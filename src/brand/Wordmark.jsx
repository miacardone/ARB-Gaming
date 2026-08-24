import { useBrand } from '@/brand/BrandProvider';

/**
 * Tenant wordmark: logo served from a path in brand.config, plus type.
 * The asset is never imported into this component — swapping tenants swaps a
 * string, not a module graph.
 */
export function Wordmark({ inverse = false, showText = true, size = 26 }) {
  const brand = useBrand();

  /* A full lockup (icon + wordtype in one asset) replaces the icon+text
     combo below when the brand provides one — it's white-on-transparent,
     so it only reads correctly on a dark surface. */
  if (inverse && brand.wordmarkImage) {
    const height = size * 1.3;
    return (
      <span className="wordmark">
        <img
          src={brand.wordmarkImage}
          alt={brand.name}
          height={height}
          width={height * (brand.wordmarkImageRatio ?? 1)}
          className="wordmark__image"
        />
      </span>
    );
  }

  return (
    <span className={`wordmark ${inverse ? 'wordmark--inverse' : ''}`.trim()}>
      <img
        src={brand.logo}
        alt=""
        width={size}
        height={size}
        className="wordmark__logo"
        aria-hidden="true"
      />
      {showText && (
        <span className="wordmark__text" style={{ fontWeight: brand.wordmark.weight }}>
          {brand.wordmark.text}
          <span className="wordmark__accent">{brand.wordmark.accent}</span>
        </span>
      )}
    </span>
  );
}

export default Wordmark;
