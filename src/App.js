import React, { useState, useEffect } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { SkullKingGame } from './game/SkullKing';

function nomJoueur(G, id) {
  if (G.nomsJoueurs && G.nomsJoueurs[id]) {
    return G.nomsJoueurs[id];
  }
  return 'Joueur ' + id;
}

function styleCarte(carte) {
  let couleurFond = '#616161';
  let texte = '';

  if (carte.type === 'numerotee') {
    const couleurs = {
      vert: '#2e7d32',
      jaune: '#f9a825',
      violet: '#6a1b9a',
      noir: '#212121'
    };
    couleurFond = couleurs[carte.couleur];
    texte = carte.couleur + ' ' + carte.valeur;
  } else if (carte.type === 'pirate') {
    couleurFond = '#5d4037';
    texte = '🏴‍☠️ ' + (carte.nom || 'Pirate');
  } else if (carte.type === 'sirene') {
    couleurFond = '#00838f';
    texte = '🧜‍♀️ Sirène';
  } else if (carte.type === 'skullking') {
    couleurFond = '#b71c1c';
    texte = '💀 Skull King';
  } else if (carte.type === 'fuite') {
    couleurFond = '#616161';
    texte = '🏃 Fuite';
  } else if (carte.type === 'tigresse') {
    couleurFond = '#e65100';
    texte = '🐯 Tigresse';
  } else if (carte.type === 'butin') {
    couleurFond = '#ffd700';
    texte = '💰 Butin';
  } else if (carte.type === 'kraken') {
    couleurFond = '#1a237e';
    texte = '🐙 Kraken';
  } else if (carte.type === 'baleine') {
    couleurFond = '#e3f2fd';
    texte = '🐋 Baleine';
  }

  return { couleurFond: couleurFond, texte: texte };
}

function MiniCarte(props) {
  const carte = props.carte;
  const style = styleCarte(carte);
  const selectionne = props.selectionne;
  return (
    <div
      onClick={props.onClick}
      style={{
        backgroundColor: style.couleurFond,
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        minWidth: '80px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '13px',
        cursor: props.onClick ? 'pointer' : 'default',
        border: selectionne ? '3px solid #4caf50' : '2px solid transparent',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.5)'
      }}
    >
      {style.texte}
    </div>
  );
}

function DosCarte(props) {
  const selectionne = props ? props.selectionne : false;
  const onClick = props ? props.onClick : undefined;
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#8b0000',
        border: selectionne ? '3px solid #4caf50' : '2px solid #f4c430',
        borderRadius: '8px',
        minWidth: '80px',
        height: '60px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f4c430',
        fontWeight: 'bold'
      }}
    >
      ?
    </div>
  );
}

function afficherCarte(carte) {
  if (carte.cachee) {
    return <DosCarte key={Math.random()} />;
  }
  return <MiniCarte key={carte.id} carte={carte} />;
}

function carteEstJouable(carte, main, couleurDemandee) {
  if (!couleurDemandee) return true;
  
  const estCarteLibre = carte.type !== 'numerotee' || carte.couleur === 'noir';
  if (estCarteLibre) return true;

  const carteRespecteCouleur = carte.couleur === couleurDemandee;
  if (carteRespecteCouleur) return true;

  const aUneCarteDeLaCouleur = main.some(function(c) {
    return c.type === 'numerotee' && c.couleur === couleurDemandee;
  });
  
  return !aUneCarteDeLaCouleur;
}

function jouerCarteAvecChoix(moves, idJoueur, carte) {
  if (carte.type === 'tigresse') {
    const choix = window.prompt("Tigresse jouée comme PIRATE ou FUITE ? (tape 'pirate' ou 'fuite')");
    const choixFinal = choix === 'pirate' ? 'pirate' : 'fuite';
    moves.jouerCarte(idJoueur, carte.id, choixFinal);
  } else {
    moves.jouerCarte(idJoueur, carte.id, null);
  }
}

function afficherCarteJouable(carte, idJoueur, main, couleurDemandee, estJoueurActuel, pouvoirBloque, moves) {
  if (carte.cachee) {
    return (
      <div key={Math.random()} style={{ textAlign: 'center' }}>
        <DosCarte />
      </div>
    );
  }

  const style = styleCarte(carte);
  const jouable = estJoueurActuel && !pouvoirBloque && carteEstJouable(carte, main, couleurDemandee);

  return (
    <div key={carte.id} style={{ textAlign: 'center', opacity: jouable ? 1 : 0.4 }}>
      <div
        style={{
          backgroundColor: style.couleurFond,
          color: 'white',
          padding: '15px',
          borderRadius: '10px',
          minWidth: '90px',
          fontWeight: 'bold',
          boxShadow: '2px 2px 8px rgba(0,0,0,0.5)'
        }}
      >
        {style.texte}
      </div>
      <button
        onClick={() => jouerCarteAvecChoix(moves, idJoueur, carte)}
        disabled={!jouable}
        style={{ 
          marginTop: '5px', 
          cursor: jouable ? 'pointer' : 'not-allowed', 
          fontSize: '12px' 
        }}
      >
        Jouer
      </button>
    </div>
  );
}

function afficherBoutonsAnnonce(idJoueur, manche, annonceActuelle, estPret, moves) {
  const options = [];
  for (let i = 0; i <= manche; i++) {
    options.push(i);
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
        {options.map(function(nombre) {
          const estSelectionne = annonceActuelle === nombre;
          return (
            <button
              key={nombre}
              onClick={() => moves.annoncer(idJoueur, nombre)}
              disabled={estPret}
              style={{
                width: '35px',
                height: '35px',
                borderRadius: '50%',
                border: '2px solid #f4c430',
                backgroundColor: estSelectionne ? '#f4c430' : 'transparent',
                color: estSelectionne ? '#0a1929' : 'white',
                fontWeight: 'bold',
                cursor: estPret ? 'not-allowed' : 'pointer',
                opacity: estPret ? 0.5 : 1
              }}
            >
              {nombre}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => moves.validerAnnonce(idJoueur)}
        disabled={estPret || annonceActuelle === null}
        style={{
          marginTop: '10px',
          padding: '8px 20px',
          cursor: (estPret || annonceActuelle === null) ? 'not-allowed' : 'pointer',
          backgroundColor: estPret ? '#4caf50' : '#f4c430',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          color: '#0a1929'
        }}
      >
        {estPret ? '✅ Prêt !' : 'Valider mon annonce'}
      </button>
    </div>
  );
}

function afficherJoueur(G, idJoueur, main, manche, annonce, estPret, annoncesRevelees, plisRemportes, gagnantDernierPli, couleurDemandee, joueurActuel, pouvoirBloque, moves) {
  const estGagnantDernierPli = gagnantDernierPli === idJoueur;
  const estJoueurActuel = joueurActuel === idJoueur;

  return (
    <div key={idJoueur} style={{ 
      marginBottom: '25px', 
      padding: '15px',
      backgroundColor: estJoueurActuel ? 'rgba(76,175,80,0.15)' : (estGagnantDernierPli ? 'rgba(244,196,48,0.15)' : 'rgba(255,255,255,0.05)'),
      borderRadius: '10px',
      border: estJoueurActuel ? '2px solid #4caf50' : (estGagnantDernierPli ? '2px solid #f4c430' : 'none')
    }}>
      <h3>
        {nomJoueur(G, idJoueur)} — Annonce : {annoncesRevelees ? annonce : (estPret ? '🔒 Cachée' : '❓')} 
        {' '}| Plis remportés : {plisRemportes}
        {estGagnantDernierPli ? ' 🏆' : ''}
        {estJoueurActuel && !pouvoirBloque && annoncesRevelees ? ' ▶️ À TOI DE JOUER' : ''}
      </h3>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        {main.map(function(carte) {
          return afficherCarteJouable(carte, idJoueur, main, couleurDemandee, estJoueurActuel && annoncesRevelees, pouvoirBloque, moves);
        })}
      </div>
      {!annoncesRevelees && afficherBoutonsAnnonce(idJoueur, manche, annonce, estPret, moves)}
    </div>
  );
}

function afficherPliEnCours(G, cartes) {
  if (cartes.length === 0) {
    return <p style={{ opacity: 0.5 }}>Aucune carte jouée pour l'instant</p>;
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
      {cartes.map(function(entry, index) {
        return (
          <div key={index} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', marginBottom: '5px' }}>
              {nomJoueur(G, entry.idJoueur)}
            </div>
            {afficherCarte(entry.carte)}
          </div>
        );
      })}
    </div>
  );
}

function afficherAlliancesFormees(G, alliances) {
  if (!alliances || alliances.length === 0) return null;
  return (
    <div style={{ marginTop: '10px', color: '#ffd700' }}>
      {alliances.map(function(a, index) {
        return (
          <p key={index}>
            💰 Alliance formée : {nomJoueur(G, a.joueurButin)} (Butin) + {nomJoueur(G, a.joueurGagnant)} (Gagnant)
          </p>
        );
      })}
    </div>
  );
}

function PanneauHarry(props) {
  const idJoueur = props.pouvoir.idJoueur;
  return (
    <div>
      <h3>🎩 Harry le Géant — {nomJoueur(props.G, idJoueur)} peut modifier son annonce</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '15px' }}>
        <button onClick={() => props.moves.resoudrePouvoirHarry(idJoueur, -1)} style={{ padding: '10px 20px' }}>-1</button>
        <button onClick={() => props.moves.resoudrePouvoirHarry(idJoueur, 0)} style={{ padding: '10px 20px' }}>Ne rien changer</button>
        <button onClick={() => props.moves.resoudrePouvoirHarry(idJoueur, 1)} style={{ padding: '10px 20px' }}>+1</button>
      </div>
    </div>
  );
}

function PanneauBenjamin(props) {
  const idJoueur = props.pouvoir.idJoueur;
  const G = props.G;
  const [cible, setCible] = useState(null);
  const [carteMoi, setCarteMoi] = useState(null);
  const [indexCarteCible, setIndexCarteCible] = useState(null);

  const autresJoueurs = Object.keys(G.mains).filter(function(id) { return id !== idJoueur; });

  if (cible === null) {
    return (
      <div>
        <h3>🗡️ Benjamin le Voleur — {nomJoueur(G, idJoueur)} choisit une cible</h3>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          {autresJoueurs.map(function(id) {
            return (
              <button key={id} onClick={() => setCible(id)} style={{ padding: '10px 20px' }}>
                {nomJoueur(G, id)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const mainCible = G.mains[cible];
  const carteCibleReelle = indexCarteCible !== null ? mainCible[indexCarteCible] : null;

  return (
    <div>
      <h3>🗡️ Benjamin le Voleur — Échange avec {nomJoueur(G, cible)}</h3>
      <p>Choisis ta carte à donner :</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {G.mains[idJoueur].map(function(c) {
          return <MiniCarte key={c.id} carte={c} selectionne={carteMoi === c.id} onClick={() => setCarteMoi(c.id)} />;
        })}
      </div>
      <p style={{ marginTop: '15px' }}>
        Choisis une carte à voler (tu ne sais pas ce que c'est !) :
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {mainCible.map(function(c, index) {
          return (
            <DosCarte 
              key={index} 
              selectionne={indexCarteCible === index} 
              onClick={() => setIndexCarteCible(index)} 
            />
          );
        })}
      </div>
      <button
        disabled={!carteMoi || carteCibleReelle === null}
        onClick={() => props.moves.resoudrePouvoirBenjamin(idJoueur, cible, carteMoi, carteCibleReelle.id)}
        style={{ marginTop: '15px', padding: '10px 20px' }}
      >
        Confirmer l'échange
      </button>
    </div>
  );
}

function PanneauRosie(props) {
  const idJoueur = props.pouvoir.idJoueur;
  const G = props.G;
  const tousJoueurs = Object.keys(G.mains);

  return (
    <div>
      <h3>🌹 Rosie la Douce — {nomJoueur(G, idJoueur)} désigne qui commence le prochain pli</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
        {tousJoueurs.map(function(id) {
          return (
            <button key={id} onClick={() => props.moves.resoudrePouvoirRosie(id)} style={{ padding: '10px 20px' }}>
              {nomJoueur(G, id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PanneauBetsy(props) {
  const idJoueur = props.pouvoir.idJoueur;
  const G = props.G;
  const [cartePli, setCartePli] = useState(null);
  const [carteMain, setCarteMain] = useState(null);

  return (
    <div>
      <h3>🃏 Betsy la Maligne — {nomJoueur(G, idJoueur)} échange une carte</h3>
      <p>Choisis une carte du pli à récupérer :</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {G.dernierPliCartes.map(function(entry) {
          return (
            <MiniCarte 
              key={entry.carte.id} 
              carte={entry.carte} 
              selectionne={cartePli === entry.carte.id} 
              onClick={() => setCartePli(entry.carte.id)} 
            />
          );
        })}
      </div>
      <p style={{ marginTop: '15px' }}>Choisis une carte de ta main à donner en échange :</p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {G.mains[idJoueur].map(function(c) {
          return <MiniCarte key={c.id} carte={c} selectionne={carteMain === c.id} onClick={() => setCarteMain(c.id)} />;
        })}
      </div>
      <button
        disabled={!cartePli || !carteMain}
        onClick={() => props.moves.resoudrePouvoirBetsy(idJoueur, cartePli, carteMain)}
        style={{ marginTop: '15px', padding: '10px 20px' }}
      >
        Confirmer l'échange
      </button>
    </div>
  );
}

function PanneauPascal(props) {
  const idJoueur = props.pouvoir.idJoueur;
  return (
    <div>
      <h3>🎲 Pascal le Flambeur — {nomJoueur(props.G, idJoueur)} peut miser</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '15px' }}>
        <button onClick={() => props.moves.resoudrePouvoirPascal(idJoueur, 0)} style={{ padding: '10px 20px' }}>Ne pas miser</button>
        <button onClick={() => props.moves.resoudrePouvoirPascal(idJoueur, 10)} style={{ padding: '10px 20px' }}>Miser +10</button>
        <button onClick={() => props.moves.resoudrePouvoirPascal(idJoueur, 20)} style={{ padding: '10px 20px' }}>Miser +20</button>
      </div>
    </div>
  );
}

function PanneauLucie(props) {
  const idJoueur = props.pouvoir.idJoueur;
  const G = props.G;
  const autresJoueurs = Object.keys(G.mains).filter(function(id) { return id !== idJoueur; });

  return (
    <div>
      <h3>🔮 Lucie la Voyante — {nomJoueur(G, idJoueur)} choisit une main à regarder</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
        {autresJoueurs.map(function(id) {
          return (
            <button key={id} onClick={() => props.moves.resoudrePouvoirLucieChoisirCible(idJoueur, id)} style={{ padding: '10px 20px' }}>
              {nomJoueur(G, id)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PanneauWill(props) {
  const idJoueur = props.pouvoir.idJoueur;
  const etape = props.pouvoir.etape;
  const G = props.G;
  const [carte1, setCarte1] = useState(null);
  const [carte2, setCarte2] = useState(null);

  if (etape === 'pioche') {
    return (
      <div>
        <h3>🏃 Will le Bandit — {nomJoueur(G, idJoueur)} peut piocher 2 cartes</h3>
        <button onClick={() => props.moves.piocherWill(idJoueur)} style={{ padding: '10px 20px', marginTop: '15px' }}>
          Piocher 2 cartes
        </button>
      </div>
    );
  }

  function toggleCarte(id) {
    if (carte1 === id) { setCarte1(null); return; }
    if (carte2 === id) { setCarte2(null); return; }
    if (carte1 === null) { setCarte1(id); return; }
    if (carte2 === null) { setCarte2(id); return; }
  }

  return (
    <div>
      <h3>🏃 Will le Bandit — {nomJoueur(G, idJoueur)} doit défausser 2 cartes</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '15px' }}>
        {G.mains[idJoueur].map(function(c) {
          const selectionne = carte1 === c.id || carte2 === c.id;
          return <MiniCarte key={c.id} carte={c} selectionne={selectionne} onClick={() => toggleCarte(c.id)} />;
        })}
      </div>
      <button
        disabled={!carte1 || !carte2}
        onClick={() => props.moves.defausserWill(idJoueur, carte1, carte2)}
        style={{ marginTop: '15px', padding: '10px 20px' }}
      >
        Confirmer la défausse
      </button>
    </div>
  );
}

function PanneauPouvoir(props) {
  const pouvoir = props.G.pouvoirEnAttente;
  if (!pouvoir) return null;

  const conteneurStyle = {
    backgroundColor: 'rgba(180,50,50,0.2)',
    border: '3px solid #ff5252',
    borderRadius: '15px',
    padding: '20px',
    margin: '20px auto',
    maxWidth: '700px'
  };

  let contenu = null;
  if (pouvoir.nom === 'Harry') contenu = <PanneauHarry pouvoir={pouvoir} G={props.G} moves={props.moves} />;
  else if (pouvoir.nom === 'Benjamin') contenu = <PanneauBenjamin pouvoir={pouvoir} G={props.G} moves={props.moves} />;
  else if (pouvoir.nom === 'Rosie') contenu = <PanneauRosie pouvoir={pouvoir} G={props.G} moves={props.moves} />;
  else if (pouvoir.nom === 'Betsy') contenu = <PanneauBetsy pouvoir={pouvoir} G={props.G} moves={props.moves} />;
  else if (pouvoir.nom === 'Pascal') contenu = <PanneauPascal pouvoir={pouvoir} G={props.G} moves={props.moves} />;
  else if (pouvoir.nom === 'Lucie') contenu = <PanneauLucie pouvoir={pouvoir} G={props.G} moves={props.moves} />;
  else if (pouvoir.nom === 'Will') contenu = <PanneauWill pouvoir={pouvoir} G={props.G} moves={props.moves} />;

  return <div style={conteneurStyle}>{contenu}</div>;
}

function PanneauRevelationJuanita(props) {
  const revelation = props.G.revelationJuanita;
  if (!revelation) return null;

  return (
    <div style={{
      backgroundColor: 'rgba(50,150,150,0.2)',
      border: '3px solid #00838f',
      borderRadius: '15px',
      padding: '20px',
      margin: '20px auto',
      maxWidth: '700px'
    }}>
      <h3>🃏 Juanita Jade ({nomJoueur(props.G, revelation.idJoueur)}) voit la pioche restante :</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '15px' }}>
        {revelation.cartes.map(function(c) {
          return <MiniCarte key={c.id} carte={c} />;
        })}
      </div>
      <button onClick={() => props.moves.fermerJuanita()} style={{ marginTop: '15px', padding: '8px 16px' }}>
        Fermer
      </button>
    </div>
  );
}

function PanneauRevelationLucie(props) {
  const revelation = props.G.revelationLucie;
  if (!revelation) return null;

  return (
    <div style={{
      backgroundColor: 'rgba(150,50,150,0.2)',
      border: '3px solid #9c27b0',
      borderRadius: '15px',
      padding: '20px',
      margin: '20px auto',
      maxWidth: '700px'
    }}>
      <h3>🔮 Lucie ({nomJoueur(props.G, revelation.idJoueurLucie)}) voit la main de {nomJoueur(props.G, revelation.idJoueurCible)} :</h3>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '15px' }}>
        {revelation.main.map(function(c) {
          return <MiniCarte key={c.id} carte={c} />;
        })}
      </div>
      <button onClick={() => props.moves.fermerLucie()} style={{ marginTop: '15px', padding: '8px 16px' }}>
        Fermer
      </button>
    </div>
  );
}

function SkullKingBoard(props) {
  const G = props.G;
  const moves = props.moves;
  const playerID = props.playerID;
  const nomChoisi = props.nomChoisi;

  const [conflit, setConflit] = useState(false);

  useEffect(function() {
    if (!playerID) return;
    const nomActuel = G.nomsJoueurs[playerID];
    if (nomActuel === null) {
      moves.definirNom(playerID, nomChoisi);
    } else if (nomActuel !== nomChoisi) {
      setConflit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (conflit) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'white', backgroundColor: '#0a1929', minHeight: '100vh' }}>
        <h1>⚠️ Ce joueur a déjà été pris par quelqu'un d'autre !</h1>
        <button onClick={() => window.location.reload()} style={{ padding: '15px 30px', marginTop: '20px', cursor: 'pointer' }}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  const idsJoueurs = Object.keys(G.mains);
  const pouvoirBloque = G.pouvoirEnAttente !== null;

  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      backgroundColor: '#0a1929',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🏴‍☠️ Skull King - Manche {G.manche}</h1>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '20px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {Object.keys(G.scores).map(function(id) {
          return (
            <div key={id} style={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              border: '2px solid #f4c430',
              borderRadius: '10px',
              padding: '8px 15px'
            }}>
              {nomJoueur(G, id)} : <strong>{G.scores[id]}</strong> pts
            </div>
          );
        })}
      </div>

      {G.manche < 10 && (
        <button 
          onClick={() => moves.mancheSuivante()}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', marginBottom: '20px' }}
        >
          Manche suivante ➡️
        </button>
      )}

      {!G.annoncesRevelees && (
        <p style={{ opacity: 0.8, marginBottom: '15px' }}>
          En attente des annonces : {Object.values(G.pretPourAnnonce).filter(Boolean).length} / {idsJoueurs.length} joueurs prêts
        </p>
      )}

      <PanneauPouvoir G={G} moves={moves} />
      <PanneauRevelationJuanita G={G} moves={moves} />
      <PanneauRevelationLucie G={G} moves={moves} />

      <div style={{ 
        backgroundColor: 'rgba(0,100,0,0.15)',
        border: '3px dashed #f4c430',
        borderRadius: '15px',
        padding: '20px',
        margin: '20px auto',
        maxWidth: '600px',
        minHeight: '120px'
      }}>
        {G.pliEnCours.length > 0 ? (
          <div>
            <h3>🎯 Pli en cours {G.couleurDemandee ? '(couleur demandée : ' + G.couleurDemandee + ')' : ''}</h3>
            {afficherPliEnCours(G, G.pliEnCours)}
          </div>
        ) : (
          <div>
            {G.pliAnnule ? (
              <h3>🐙 Pli annulé par le Kraken ! (aurait été gagné par {nomJoueur(G, G.gagnantDernierPli)})</h3>
            ) : (
              <h3>✅ Dernier pli résolu — Gagnant : {nomJoueur(G, G.gagnantDernierPli)}</h3>
            )}
            {afficherPliEnCours(G, G.dernierPliCartes)}
            {afficherAlliancesFormees(G, G.dernieresAlliancesFormees)}
          </div>
        )}
      </div>

      {idsJoueurs.map(function(idJoueur) {
        return afficherJoueur(
          G,
          idJoueur, 
          G.mains[idJoueur], 
          G.manche, 
          G.annonces[idJoueur],
          G.pretPourAnnonce[idJoueur],
          G.annoncesRevelees,
          G.plisRemportes[idJoueur],
          G.gagnantDernierPli,
          G.couleurDemandee,
          G.joueurActuel,
          pouvoirBloque,
          moves
        );
      })}

      <p style={{ marginTop: '30px', opacity: 0.7 }}>
        Cartes restantes dans la pioche : {G.piocheRestante.length}
      </p>
    </div>
  );
}

const SkullKingClient = Client({
  game: SkullKingGame,
  board: SkullKingBoard,
  numPlayers: 4,
  multiplayer: SocketIO({ server: 'https://skull-king-server-k7ms.onrender.com' }),
});

function EcranSelectionJoueur(props) {
  const G = props.G;
  const onChoisir = props.onChoisir;
  const onRetour = props.onRetour;
  const [idSelectionne, setIdSelectionne] = useState(null);
  const [nom, setNom] = useState('');

  const idsPossibles = Object.keys(G.nomsJoueurs);

  return (
    <div style={{
      padding: '60px',
      textAlign: 'center',
      backgroundColor: '#0a1929',
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>🏴‍☠️ Choisis ton joueur</h1>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px', flexWrap: 'wrap' }}>
        {idsPossibles.map(function(id) {
          const pris = G.nomsJoueurs[id] !== null;
          const estSelectionne = idSelectionne === id;
          return (
            <button
              key={id}
              onClick={() => !pris && setIdSelectionne(id)}
              disabled={pris}
              style={{
                padding: '15px 25px',
                fontSize: '16px',
                backgroundColor: estSelectionne ? '#f4c430' : (pris ? '#333' : 'transparent'),
                color: estSelectionne ? '#0a1929' : (pris ? '#888' : 'white'),
                border: '2px solid ' + (pris ? '#555' : '#f4c430'),
                borderRadius: '10px',
                cursor: pris ? 'not-allowed' : 'pointer'
              }}
            >
              {pris ? ('🔒 ' + G.nomsJoueurs[id]) : ('Joueur ' + id + ' (libre)')}
            </button>
          );
        })}
      </div>

      {idSelectionne !== null && (
        <div style={{ marginTop: '40px' }}>
          <p>Entre ton pseudo :</p>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ton nom"
            style={{ padding: '10px', fontSize: '16px', marginTop: '10px', width: '250px' }}
          />
          <br />
          <button
            onClick={() => onChoisir(idSelectionne, nom)}
            disabled={!nom.trim()}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              fontSize: '16px',
              cursor: !nom.trim() ? 'not-allowed' : 'pointer',
              backgroundColor: !nom.trim() ? '#666' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '10px'
            }}
          >
            Confirmer et rejoindre ✅
          </button>
        </div>
      )}

      <div style={{ marginTop: '50px' }}>
        <button onClick={onRetour} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          ⬅️ Changer de code de partie
        </button>
      </div>
    </div>
  );
}

const SpectatorClient = Client({
  game: SkullKingGame,
  board: EcranSelectionJoueur,
  numPlayers: 4,
  multiplayer: SocketIO({ server: 'https://skull-king-server-k7ms.onrender.com' }),
});

function EcranAccueil() {
  const [matchID, setMatchID] = useState('');
  const [etape, setEtape] = useState('saisieCode');
  const [playerID, setPlayerID] = useState(null);
  const [nomChoisi, setNomChoisi] = useState('');

  function validerCode() {
    if (matchID.trim()) {
      setEtape('choixJoueur');
    }
  }

  function choisirJoueur(id, nom) {
    setPlayerID(id);
    setNomChoisi(nom.trim());
    setEtape('jeu');
  }

  function retourSaisieCode() {
    setEtape('saisieCode');
  }

  if (etape === 'saisieCode') {
    return (
      <div style={{
        padding: '60px',
        textAlign: 'center',
        backgroundColor: '#0a1929',
        minHeight: '100vh',
        color: 'white'
      }}>
        <h1>🏴‍☠️ Skull King - Rejoindre une partie</h1>
        <div style={{ marginTop: '40px' }}>
          <p>Code de partie (donne le même code à tous tes amis) :</p>
          <input
            type="text"
            value={matchID}
            onChange={(e) => setMatchID(e.target.value)}
            placeholder="ex: partie1"
            style={{ padding: '10px', fontSize: '16px', marginTop: '10px', width: '250px' }}
          />
          <br />
          <button
            onClick={validerCode}
            disabled={!matchID.trim()}
            style={{
              marginTop: '30px',
              padding: '15px 40px',
              fontSize: '18px',
              cursor: !matchID.trim() ? 'not-allowed' : 'pointer',
              backgroundColor: !matchID.trim() ? '#666' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '10px'
            }}
          >
            Continuer ➡️
          </button>
        </div>
      </div>
    );
  }

  if (etape === 'choixJoueur') {
    return (
      <SpectatorClient
        matchID={matchID}
        onChoisir={choisirJoueur}
        onRetour={retourSaisieCode}
      />
    );
  }

  return (
    <SkullKingClient
      matchID={matchID}
      playerID={playerID}
      nomChoisi={nomChoisi}
    />
  );
}

export default EcranAccueil;