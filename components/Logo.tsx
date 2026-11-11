// Version allégée (240 px de haut, 19 Ko) : le logo ne s'affiche jamais en plus grand.
const SRC = '/logo-mask.png';
/** Proportions du fichier (1560 × 1721). */
const RATIO = 1560 / 1721;

/**
 * Logo VHOA. Le PNG est noir sur fond transparent : on s'en sert comme masque
 * pour le peindre de la couleur voulue (blanc par défaut, ou un dégradé via `className`).
 */
export function Logo({ height = 28, className = 'bg-white' }: { height?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="VHOA"
      className={`inline-block shrink-0 ${className}`}
      style={{
        height,
        width: height * RATIO,
        maskImage: `url(${SRC})`,
        WebkitMaskImage: `url(${SRC})`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}
