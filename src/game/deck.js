const COULEURS = ['vert', 'jaune', 'violet', 'noir'];
const NOMS_PIRATES = ['Harry', 'Benjamin', 'Rosie', 'Betsy', 'Juanita', 'Pascal', 'Lucie', 'Will'];

export function creerDeck() {
  let deck = [];

  COULEURS.forEach(couleur => {
    for (let valeur = 1; valeur <= 14; valeur++) {
      deck.push({ 
        type: 'numerotee', 
        couleur: couleur, 
        valeur: valeur, 
        id: couleur + '-' + valeur 
      });
    }
  });

  for (let i = 0; i < 6; i++) {
    deck.push({ type: 'fuite', id: 'fuite-' + i });
  }

  for (let i = 0; i < 8; i++) {
    deck.push({ type: 'pirate', nom: NOMS_PIRATES[i], id: 'pirate-' + i });
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ type: 'sirene', id: 'sirene-' + i });
  }

  for (let i = 0; i < 2; i++) {
    deck.push({ type: 'skullking', id: 'sk-' + i });
  }

  deck.push({ type: 'tigresse', id: 'tigresse' });

  for (let i = 0; i < 3; i++) {
    deck.push({ type: 'butin', id: 'butin-' + i });
  }

  deck.push({ type: 'kraken', id: 'kraken' });
  deck.push({ type: 'baleine', id: 'baleine' });

  return deck;
}

export function melanger(deck) {
  const copie = [...deck];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copie[i];
    copie[i] = copie[j];
    copie[j] = temp;
  }
  return copie;
} 