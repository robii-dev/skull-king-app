export function calculerScoreManche(annonce, plisRemportes, numeroManche) {
  if (annonce === null) return 0;

  if (annonce === 0) {
    if (plisRemportes === 0) {
      return 10 * numeroManche;
    } else {
      return -10 * numeroManche;
    }
  } else {
    if (plisRemportes === annonce) {
      return 20 * annonce;
    } else {
      const ecart = Math.abs(annonce - plisRemportes);
      return -10 * ecart;
    }
  }
}