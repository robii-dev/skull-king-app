import { creerDeck, melanger } from './deck';
import { resoudrePli } from './resolvePli';
import { calculerScoreManche } from './scoring';
import { INVALID_MOVE, ActivePlayers } from 'boardgame.io/core';

export const SkullKingGame = {
  name: 'skull-king',
  setup: ({ ctx }) => {
    const joueurDepartAleatoire = Math.floor(Math.random() * ctx.numPlayers);
    const etatManche = distribuerManche(1, ctx.numPlayers, joueurDepartAleatoire);
    
    const scores = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      scores[i] = 0;
    }
    etatManche.scores = scores;
    etatManche.joueurDepartAleatoire = joueurDepartAleatoire;

    const nomsJoueurs = {};
    for (let i = 0; i < ctx.numPlayers; i++) {
      nomsJoueurs[i] = null;
    }
    etatManche.nomsJoueurs = nomsJoueurs;

    return etatManche;
  },

  moves: {
    definirNom: ({ G }, idJoueur, nom) => {
      if (G.nomsJoueurs[idJoueur]) return INVALID_MOVE;
      if (!nom || nom.trim() === '') return INVALID_MOVE;
      G.nomsJoueurs[idJoueur] = nom.trim();
    },

    mancheSuivante: ({ G, ctx }) => {
      if (G.manche >= 10) return;

      const idsJoueurs = Object.keys(G.mains);

      idsJoueurs.forEach(function(id) {
        const scoreManche = calculerScoreManche(G.annonces[id], G.plisRemportes[id], G.manche);
        const bonus = G.bonusManche[id] || 0;
        const pari = G.pariManche[id] || 0;
        let bonusPari = 0;
        if (pari > 0) {
          const reussi = G.annonces[id] !== null && G.plisRemportes[id] === G.annonces[id];
          bonusPari = reussi ? pari : -pari;
        }
        G.scores[id] = G.scores[id] + scoreManche + bonus + bonusPari;
      });

      G.alliances.forEach(function(alliance) {
        const aReussi = function(id) {
          return G.annonces[id] !== null && G.plisRemportes[id] === G.annonces[id];
        };
        if (aReussi(alliance.joueurButin) && aReussi(alliance.joueurGagnant)) {
          G.scores[alliance.joueurButin] += 20;
          G.scores[alliance.joueurGagnant] += 20;
        }
      });

      const nouvelleManche = G.manche + 1;
      const premierJoueur = (G.joueurDepartAleatoire + (nouvelleManche - 1)) % ctx.numPlayers;

      const nouvelEtat = distribuerManche(nouvelleManche, ctx.numPlayers, premierJoueur);
      G.manche = nouvelEtat.manche;
      G.mains = nouvelEtat.mains;
      G.piocheRestante = nouvelEtat.piocheRestante;
      G.annonces = nouvelEtat.annonces;
      G.pretPourAnnonce = nouvelEtat.pretPourAnnonce;
      G.annoncesRevelees = nouvelEtat.annoncesRevelees;
      G.pliEnCours = nouvelEtat.pliEnCours;
      G.plisRemportes = nouvelEtat.plisRemportes;
      G.couleurDemandee = nouvelEtat.couleurDemandee;
      G.gagnantDernierPli = nouvelEtat.gagnantDernierPli;
      G.bonusManche = nouvelEtat.bonusManche;
      G.joueurQuiCommence = nouvelEtat.joueurQuiCommence;
      G.joueurActuel = nouvelEtat.joueurActuel;
      G.dernierPliCartes = nouvelEtat.dernierPliCartes;
      G.pliAnnule = nouvelEtat.pliAnnule;
      G.alliances = nouvelEtat.alliances;
      G.dernieresAlliancesFormees = nouvelEtat.dernieresAlliancesFormees;
      G.pouvoirEnAttente = nouvelEtat.pouvoirEnAttente;
      G.revelationJuanita = nouvelEtat.revelationJuanita;
      G.revelationLucie = nouvelEtat.revelationLucie;
      G.pariManche = nouvelEtat.pariManche;
      G.partieTerminee = false;
    },

    terminerPartie: ({ G }) => {
      if (G.partieTerminee) return;
      if (G.manche < 10) return;

      const idsJoueurs = Object.keys(G.mains);
      idsJoueurs.forEach(function(id) {
        const scoreManche = calculerScoreManche(G.annonces[id], G.plisRemportes[id], G.manche);
        const bonus = G.bonusManche[id] || 0;
        const pari = G.pariManche[id] || 0;
        let bonusPari = 0;
        if (pari > 0) {
          const reussi = G.annonces[id] !== null && G.plisRemportes[id] === G.annonces[id];
          bonusPari = reussi ? pari : -pari;
        }
        G.scores[id] = G.scores[id] + scoreManche + bonus + bonusPari;
      });

      G.alliances.forEach(function(alliance) {
        const aReussi = function(id) {
          return G.annonces[id] !== null && G.plisRemportes[id] === G.annonces[id];
        };
        if (aReussi(alliance.joueurButin) && aReussi(alliance.joueurGagnant)) {
          G.scores[alliance.joueurButin] += 20;
          G.scores[alliance.joueurGagnant] += 20;
        }
      });

      G.partieTerminee = true;
    },

    annoncer: ({ G }, idJoueur, nombre) => {
      if (G.annoncesRevelees) return INVALID_MOVE;
      if (G.pretPourAnnonce[idJoueur]) return INVALID_MOVE;
      G.annonces[idJoueur] = nombre;
    },

    validerAnnonce: ({ G, ctx }, idJoueur) => {
      if (G.annoncesRevelees) return INVALID_MOVE;
      if (G.annonces[idJoueur] === null) return INVALID_MOVE;
      
      G.pretPourAnnonce[idJoueur] = true;

      const idsJoueurs = Object.keys(G.mains);
      const tousPrets = idsJoueurs.every(function(id) {
        return G.pretPourAnnonce[id] === true;
      });

      if (tousPrets) {
        G.annoncesRevelees = true;
      }
    },

    jouerCarte: ({ G, ctx }, idJoueur, carteId, tigresseChoix) => {
      if (!G.annoncesRevelees) return INVALID_MOVE;
      if (G.pouvoirEnAttente !== null) return INVALID_MOVE;
      if (idJoueur !== G.joueurActuel) return INVALID_MOVE;

      const main = G.mains[idJoueur];
      const carte = main.find(function(c) { return c.id === carteId; });
      if (!carte) return INVALID_MOVE;

      if (G.couleurDemandee) {
        const estCarteLibre = carte.type !== 'numerotee' || carte.couleur === 'noir';
        const carteRespecteCouleur = carte.type === 'numerotee' && carte.couleur === G.couleurDemandee;
        
        if (!estCarteLibre && !carteRespecteCouleur) {
          const aUneCarteDeLaCouleur = main.some(function(c) {
            return c.type === 'numerotee' && c.couleur === G.couleurDemandee;
          });
          if (aUneCarteDeLaCouleur) {
            return INVALID_MOVE;
          }
        }
      }

      if (G.pliEnCours.length === 0 && carte.type === 'numerotee' && carte.couleur !== 'noir') {
        G.couleurDemandee = carte.couleur;
      }

      G.pliEnCours.push({ idJoueur: idJoueur, carte: carte, tigresseChoix: tigresseChoix });
      G.mains[idJoueur] = main.filter(function(c) { return c.id !== carteId; });

      if (G.pliEnCours.length === ctx.numPlayers) {
        resoudreEtEnregistrerPli(G);
      } else {
        const prochainIndex = (parseInt(idJoueur) + 1) % ctx.numPlayers;
        G.joueurActuel = String(prochainIndex);
      }
    },

    resoudrePouvoirHarry: ({ G }, idJoueur, modification) => {
      if (!G.pouvoirEnAttente || G.pouvoirEnAttente.nom !== 'Harry') return;
      const ancienneAnnonce = G.annonces[idJoueur];
      if (ancienneAnnonce === null) {
        G.pouvoirEnAttente = null;
        return;
      }
      let nouvelleAnnonce = ancienneAnnonce + modification;
      if (nouvelleAnnonce < 0) nouvelleAnnonce = 0;
      if (nouvelleAnnonce > G.manche) nouvelleAnnonce = G.manche;
      G.annonces[idJoueur] = nouvelleAnnonce;
      G.pouvoirEnAttente = null;
    },

    resoudrePouvoirBenjamin: ({ G }, idJoueurBenjamin, idJoueurCible, idCarteMoi, idCarteCible) => {
      if (!G.pouvoirEnAttente || G.pouvoirEnAttente.nom !== 'Benjamin') return;
      
      const mainMoi = G.mains[idJoueurBenjamin];
      const mainCible = G.mains[idJoueurCible];
      
      const carteMoi = mainMoi.find(function(c) { return c.id === idCarteMoi; });
      const carteCible = mainCible.find(function(c) { return c.id === idCarteCible; });
      
      if (!carteMoi || !carteCible) {
        G.pouvoirEnAttente = null;
        return;
      }

      G.mains[idJoueurBenjamin] = mainMoi.filter(function(c) { return c.id !== idCarteMoi; });
      G.mains[idJoueurCible] = mainCible.filter(function(c) { return c.id !== idCarteCible; });
      
      G.mains[idJoueurBenjamin].push(carteCible);
      G.mains[idJoueurCible].push(carteMoi);

      G.pouvoirEnAttente = null;
    },

    resoudrePouvoirRosie: ({ G }, idJoueurChoisi) => {
      if (!G.pouvoirEnAttente || G.pouvoirEnAttente.nom !== 'Rosie') return;
      G.joueurActuel = idJoueurChoisi;
      G.joueurQuiCommence = idJoueurChoisi;
      G.pouvoirEnAttente = null;
    },

    resoudrePouvoirBetsy: ({ G }, idJoueurBetsy, idCartePli, idCarteMain) => {
      if (!G.pouvoirEnAttente || G.pouvoirEnAttente.nom !== 'Betsy') return;

      const entryPli = G.dernierPliCartes.find(function(e) { return e.carte.id === idCartePli; });
      const carteMain = G.mains[idJoueurBetsy].find(function(c) { return c.id === idCarteMain; });

      if (!entryPli || !carteMain) {
        G.pouvoirEnAttente = null;
        return;
      }

      G.dernierPliCartes = G.dernierPliCartes.filter(function(e) { return e.carte.id !== idCartePli; });
      G.mains[idJoueurBetsy] = G.mains[idJoueurBetsy].filter(function(c) { return c.id !== idCarteMain; });
      G.mains[idJoueurBetsy].push(entryPli.carte);

      G.pouvoirEnAttente = null;
    },

    fermerJuanita: ({ G }) => {
      G.revelationJuanita = null;
    },

    resoudrePouvoirPascal: ({ G }, idJoueur, montant) => {
      if (!G.pouvoirEnAttente || G.pouvoirEnAttente.nom !== 'Pascal') return;
      G.pariManche[idJoueur] = montant;
      G.pouvoirEnAttente = null;
    },

    resoudrePouvoirLucieChoisirCible: ({ G }, idJoueurLucie, idJoueurCible) => {
      if (!G.pouvoirEnAttente || G.pouvoirEnAttente.nom !== 'Lucie') return;
      G.revelationLucie = {
        idJoueurLucie: idJoueurLucie,
        idJoueurCible: idJoueurCible,
        main: G.mains[idJoueurCible].slice()
      };
      G.pouvoirEnAttente = null;
    },

    fermerLucie: ({ G }) => {
      G.revelationLucie = null;
    },

    piocherWill: ({ G }, idJoueur) => {
      if (!G.pouvoirEnAttente || G.pouvoirEnAttente.nom !== 'Will' || G.pouvoirEnAttente.etape !== 'pioche') return;
      
      const nbAPiocher = Math.min(2, G.piocheRestante.length);
      const cartesPiochees = G.piocheRestante.splice(0, nbAPiocher);
      G.mains[idJoueur] = G.mains[idJoueur].concat(cartesPiochees);
      
      G.pouvoirEnAttente.etape = 'defausse';
    },

    defausserWill: ({ G }, idJoueur, idCarte1, idCarte2) => {
      if (!G.pouvoirEnAttente || G.pouvoirEnAttente.nom !== 'Will' || G.pouvoirEnAttente.etape !== 'defausse') return;
      
      G.mains[idJoueur] = G.mains[idJoueur].filter(function(c) {
        return c.id !== idCarte1 && c.id !== idCarte2;
      });
      
      G.pouvoirEnAttente = null;
    },
  },

  playerView: ({ G, ctx, playerID }) => {
    if (playerID === null || playerID === undefined) {
      return G;
    }

    const mainsFiltrees = {};
    Object.keys(G.mains).forEach(function(id) {
      if (id === playerID) {
        mainsFiltrees[id] = G.mains[id];
      } else {
        mainsFiltrees[id] = G.mains[id].map(function() {
          return { cachee: true };
        });
      }
    });

    return Object.assign({}, G, { mains: mainsFiltrees });
  },
  turn: {
    activePlayers: ActivePlayers.ALL,
    },
};

function resoudreEtEnregistrerPli(G) {
  const resultat = resoudrePli(G.pliEnCours, G.couleurDemandee);
  const gagnant = resultat.gagnant;

  const alliancesFormeesCePli = [];

  if (!resultat.annule) {
    G.plisRemportes[gagnant.idJoueur] = (G.plisRemportes[gagnant.idJoueur] || 0) + 1;

    if (gagnant.carte.type === 'skullking') {
      const nbPirates = G.pliEnCours.filter(function(e) {
        return e.carte.type === 'pirate' || (e.carte.type === 'tigresse' && e.tigresseChoix === 'pirate');
      }).length;
      G.bonusManche[gagnant.idJoueur] = (G.bonusManche[gagnant.idJoueur] || 0) + (nbPirates * 30);
    }

    if (gagnant.carte.type === 'sirene') {
      const nbSK = G.pliEnCours.filter(function(e) {
        return e.carte.type === 'skullking';
      }).length;
      G.bonusManche[gagnant.idJoueur] = (G.bonusManche[gagnant.idJoueur] || 0) + (nbSK * 50);
    }

    G.pliEnCours.forEach(function(entry) {
      if (entry.carte.type === 'butin' && entry.idJoueur !== gagnant.idJoueur) {
        const alliance = { joueurButin: entry.idJoueur, joueurGagnant: gagnant.idJoueur };
        G.alliances.push(alliance);
        alliancesFormeesCePli.push(alliance);
      }
    });
  }

  G.gagnantDernierPli = gagnant.idJoueur;
  G.pliAnnule = resultat.annule;
  G.dernierPliCartes = G.pliEnCours.slice();
  G.dernieresAlliancesFormees = alliancesFormeesCePli;

  G.pliEnCours = [];
  G.couleurDemandee = null;

  G.joueurQuiCommence = gagnant.idJoueur;
  G.joueurActuel = gagnant.idJoueur;

  if (!resultat.annule && gagnant.carte.type === 'pirate' && gagnant.carte.nom) {
    const nom = gagnant.carte.nom;
    if (nom === 'Juanita') {
      G.revelationJuanita = { idJoueur: gagnant.idJoueur, cartes: G.piocheRestante.slice() };
    } else if (nom === 'Will') {
      G.pouvoirEnAttente = { nom: nom, idJoueur: gagnant.idJoueur, etape: 'pioche' };
    } else {
      G.pouvoirEnAttente = { nom: nom, idJoueur: gagnant.idJoueur, etape: null };
    }
  }
}

function distribuerManche(numeroManche, nombreJoueurs, premierJoueur) {
  const deckMelange = melanger(creerDeck());
  
  const mains = {};
  const annonces = {};
  const pretPourAnnonce = {};
  const plisRemportes = {};
  const bonusManche = {};
  const pariManche = {};
  for (let i = 0; i < nombreJoueurs; i++) {
    mains[i] = deckMelange.splice(0, numeroManche);
    annonces[i] = null;
    pretPourAnnonce[i] = false;
    plisRemportes[i] = 0;
    bonusManche[i] = 0;
    pariManche[i] = 0;
  }

  return {
    manche: numeroManche,
    mains: mains,
    piocheRestante: deckMelange,
    annonces: annonces,
    pretPourAnnonce: pretPourAnnonce,
    annoncesRevelees: false,
    pliEnCours: [],
    plisRemportes: plisRemportes,
    couleurDemandee: null,
    gagnantDernierPli: null,
    bonusManche: bonusManche,
    joueurQuiCommence: String(premierJoueur),
    joueurActuel: String(premierJoueur),
    dernierPliCartes: [],
    pliAnnule: false,
    alliances: [],
    dernieresAlliancesFormees: [],
    pouvoirEnAttente: null,
    revelationJuanita: null,
    revelationLucie: null,
    pariManche: pariManche,
  };
}