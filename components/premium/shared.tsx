/** Montant en euros, à la française : 499 → « 4,99 € », 3500 → « 35 € ». */
export function euros(cents: number) {
  const whole = cents % 100 === 0;
  return `${(cents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })} €`;
}

export const longDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/** Analyses du coach incluses chaque mois (même valeur que l'API). */
export const PREMIUM_ANALYSES = 60;
