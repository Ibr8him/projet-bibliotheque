
// --- Gestion du localStorage ---
const bibliotheque = {
    livres: [],
    prochainIdLivre: 1
};

function sauvegarderBibliotheque() {
    localStorage.setItem('bibliotheque', JSON.stringify(bibliotheque));
}

function chargerBibliotheque() {
    const data = localStorage.getItem('bibliotheque');
    if (data) {
        const obj = JSON.parse(data);
        bibliotheque.livres = obj.livres || [];
        bibliotheque.prochainIdLivre = obj.prochainIdLivre || 1;
    }
}

// --- Affichage des livres (ul et select) ---
function afficherLivres() {
    const ul = document.getElementById('listeResultats');
    ul.innerHTML = '';
    if (bibliotheque.livres.length === 0) {
        ul.innerHTML = '<li>Aucun livre dans la bibliothèque.</li>';
    } else {
        bibliotheque.livres.forEach(livre => {
            ul.innerHTML += `<li>ID: ${livre.id}, Titre: ${livre.titre}, Auteur: ${livre.auteur}, ISBN: ${livre.isbn}, Année: ${livre.annee}, Genre: ${livre.genre}</li>`;
        });
    }
    const select = document.getElementById('listeLivres');
    if (select) {
        select.innerHTML = '<option value="">--Sélectionner un livre--</option>';
        bibliotheque.livres.forEach(livre => {
            select.innerHTML += `<option value="${livre.id}">${livre.titre} (${livre.auteur})</option>`;
        });
    }
}

// --- Ajout d'un livre ---
function ajouterLivre(titre, auteur, isbn, annee, genre) {
    if (!titre || !auteur || !isbn || !annee || !genre) {
        return { succes: false, message: "Tous les paramètres sont obligatoires." };
    }
    const regexISBN = /^\d{3}-\d-\d{2}-\d{6}-\d$/;
    if (!regexISBN.test(isbn)) {
        return { succes: false, message: "Format ISBN invalide." };
    }
    const anneeActuelle = new Date().getFullYear();
    if (typeof annee !== "number" || annee < 1000 || annee > anneeActuelle) {
        return { succes: false, message: `Année invalide (1000 à ${anneeActuelle}).` };
    }
    const existe = bibliotheque.livres.some(livre => livre.isbn === isbn);
    if (existe) {
        return { succes: false, message: "Un livre avec ce ISBN existe déjà." };
    }
    const livre = {
        id: bibliotheque.prochainIdLivre++,
        titre,
        auteur,
        isbn,
        annee,
        genre
    };
    bibliotheque.livres.push(livre);
    sauvegarderBibliotheque();
    return { succes: true, message: "Livre ajouté avec succès.", livre };
}

// --- Suppression d'un livre ---
function supprimerLivre(id) {
    const index = bibliotheque.livres.findIndex(livre => livre.id === id);
    if (index === -1) {
        return { succes: false, message: "Livre non trouvé." };
    }
    bibliotheque.livres.splice(index, 1);
    sauvegarderBibliotheque();
    return { succes: true, message: "Livre supprimé avec succès." };
}

// --- Recherche de livres ---
function rechercherLivres(criteres) {
    let resultats = bibliotheque.livres.filter(livre => {
        let ok = true;
        if (criteres.titre) {
            ok = ok && livre.titre.toLowerCase().includes(criteres.titre.toLowerCase());
        }
        if (criteres.auteur) {
            ok = ok && livre.auteur.toLowerCase().includes(criteres.auteur.toLowerCase());
        }
        if (criteres.genre) {
            ok = ok && livre.genre.toLowerCase() === criteres.genre.toLowerCase();
        }
        if (criteres.annee) {
            ok = ok && livre.annee === criteres.annee;
        }
        if (criteres.anneeMin) {
            ok = ok && livre.annee >= criteres.anneeMin;
        }
        if (criteres.anneeMax) {
            ok = ok && livre.annee <= criteres.anneeMax;
        }
        return ok;
    });
    resultats.sort((a, b) => {
        let scoreA = 0, scoreB = 0;
        if (criteres.titre) {
            if (a.titre.toLowerCase().includes(criteres.titre.toLowerCase())) scoreA++;
            if (b.titre.toLowerCase().includes(criteres.titre.toLowerCase())) scoreB++;
        }
        if (criteres.auteur) {
            if (a.auteur.toLowerCase().includes(criteres.auteur.toLowerCase())) scoreA++;
            if (b.auteur.toLowerCase().includes(criteres.auteur.toLowerCase())) scoreB++;
        }
        if (criteres.genre) {
            if (a.genre.toLowerCase() === criteres.genre.toLowerCase()) scoreA++;
            if (b.genre.toLowerCase() === criteres.genre.toLowerCase()) scoreB++;
        }
        if (criteres.annee) {
            if (a.annee === criteres.annee) scoreA++;
            if (b.annee === criteres.annee) scoreB++;
        }
        return scoreB - scoreA;
    });
    return resultats;
}

// --- Gestion des formulaires ---
document.getElementById('ajoutLivreForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const titre = document.getElementById('titre').value;   
    const auteur = document.getElementById('auteur').value;
    const isbn = document.getElementById('isbn').value;
    const annee = parseInt(document.getElementById('annee').value);
    const genre = document.getElementById('genre').value;
    const resultat = ajouterLivre(titre, auteur, isbn, annee, genre);
    const divResultat = document.getElementById('messageAjout');
    divResultat.textContent = resultat.message;
    divResultat.style.color = resultat.succes ? 'green' : 'red';
    if (resultat.succes) {
        document.getElementById('ajoutLivreForm').reset();
        afficherLivres();
    }
});

document.getElementById('suppressionLivreForm').addEventListener('submit', function(e) {  
    e.preventDefault();
    const id = parseInt(document.getElementById('idSuppression').value);    
    const resultat = supprimerLivre(id);
    const divResultat = document.getElementById('messageSuppression');
    divResultat.textContent = resultat.message;
    divResultat.style.color = resultat.succes ? 'green' : 'red';
    if (resultat.succes) {
        document.getElementById('suppressionLivreForm').reset();
        afficherLivres();
    }
});

document.getElementById('rechercheLivreForm').addEventListener('submit', function(e) {
    e.preventDefault(); 
    const titre = document.getElementById('titreRecherche').value;
    const auteur = document.getElementById('auteurRecherche').value;
    const genre = document.getElementById('genreRecherche').value;      
    const anneeMin = document.getElementById('anneeMin').value ? parseInt(document.getElementById('anneeMin').value) : null;
    const anneeMax = document.getElementById('anneeMax').value ? parseInt(document.getElementById('anneeMax').value) : null;
    const criteres = { titre, auteur, genre, anneeMin, anneeMax };
    const resultats = rechercherLivres(criteres);
    const divResultat = document.getElementById('resultatsRecherche');
    if (resultats.length === 0) {
        divResultat.innerHTML = "<p>Aucun livre trouvé.</p>";
    } else {
        let html = "<ul>";
        resultats.forEach(livre => {
            html += `<li>ID: ${livre.id}, Titre: ${livre.titre}, Auteur: ${livre.auteur}, ISBN: ${livre.isbn}, Année: ${livre.annee}, Genre: ${livre.genre}</li>`;
        });
        html += "</ul>";
        divResultat.innerHTML = html;
    }
    divResultat.style.color = 'black';
});

// --- Initialisation au chargement de la page ---
window.addEventListener('DOMContentLoaded', function() {
    chargerBibliotheque();
    afficherLivres();
});

