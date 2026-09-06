function getTypeEffectif(entry) {
  if (entry.carte.type === 'tigresse') {
    return entry.tigresseChoix === 'pirate' ? 'pirate' : 'fuite';
  }
  return entry.carte.type;
}

function trouverGagnantParmi(cartesJouees, couleurDemandee) {
  const avecType = cartesJouees.map(function(entry) {
    return Object.assign({}, entry, { typeEffectif: getTypeEffectif(entry) });
  });

  const sirenes = avecType.filter(function(e) { return e.typeEffectif === 'sirene'; });
  const skullkings = avecType.filter(function(e) { return e.typeEffectif === 'skullking'; });
  const pirates = avecType.filter(function(e) { return e.typeEffectif === 'pirate'; });

  if (sirenes.length > 0 && skullkings.length > 0) {
    return sirenes[0];
  }
  if (skullkings.length > 0) {
    return skullkings[0];
  }
  if (pirates.length > 0) {
    return pirates[0];
  }
  if (sirenes.length > 0) {
    return sirenes[0];
  }

  const noirs = avecType.filter(function(e) {
    return e.carte.type === 'numerotee' && e.carte.couleur === 'noir';
  });
  if (noirs.length > 0) {
    return noirs.reduce(function(meilleur, actuel) {
      return actuel.carte.valeur > meilleur.carte.valeur ? actuel : meilleur;
    });
  }

  if (couleurDemandee) {
    const cartesCouleur = avecType.filter(function(e) {
      return e.carte.type === 'numerotee' && e.carte.couleur === couleurDemandee;
    });
    if (cartesCouleur.length > 0) {
      return cartesCouleur.reduce(function(meilleur, actuel) {
        return actuel.carte.valeur > meilleur.carte.valeur ? actuel : meilleur;
      });
    }
  }

  return avecType[0];
}

// Résolution spéciale quand la Baleine Blanche est en jeu :
// seule la valeur numérique compte, couleurs et bonus ignorés
function resoudreParHauteur(cartesJouees) {
  const numerotees = cartesJouees.filter(function(e) {
    return e.carte.type === 'numerotee';
  });

  if (numerotees.length === 0) {
    return cartesJouees[0]; // fallback si aucune carte numérotée
  }

  return numerotees.reduce(function(meilleur, actuel) {
    return actuel.carte.valeur > meilleur.carte.valeur ? actuel : meilleur;
  });
}

export function resoudrePli(cartesJouees, couleurDemandee) {
  const hasKraken = cartesJouees.some(function(e) { return e.carte.type === 'kraken'; });
  const hasBaleine = cartesJouees.some(function(e) { return e.carte.type === 'baleine'; });

  if (hasKraken) {
    const sansKraken = cartesJouees.filter(function(e) { return e.carte.type !== 'kraken'; });

    if (sansKraken.length === 0) {
      return { gagnant: cartesJouees[0], annule: true };
    }

    const gagnantHypothetique = hasBaleine
      ? resoudreParHauteur(sansKraken)
      : trouverGagnantParmi(sansKraken, couleurDemandee);

    return { gagnant: gagnantHypothetique, annule: true };
  }

  if (hasBaleine) {
    return { gagnant: resoudreParHauteur(cartesJouees), annule: false };
  }

  const gagnant = trouverGagnantParmi(cartesJouees, couleurDemandee);
  return { gagnant: gagnant, annule: false };
}