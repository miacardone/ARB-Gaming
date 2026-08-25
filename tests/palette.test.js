import { describe, expect, it } from 'vitest';
import { arbBrand, pchBrand } from '@/brand/brand.config';

/* --- colour maths, so the palette claims are checked not asserted --------- */

const hex2rgb = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const lin = (c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const luminance = (h) => {
  const [r, g, b] = hex2rgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const lab = (h) => {
  const [r, g, b] = hex2rgb(h).map(lin);
  let X = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const Y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  let Z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  [X, Z] = [f(X), f(Z)];
  const fy = f(Y);
  return [116 * fy - 16, 500 * (X - fy), 200 * (fy - Z)];
};
/** CIE76 — coarser than CIEDE2000 but monotonic, which is all a floor needs. */
const deltaE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));

/** Viénot dichromat simulation in linear RGB. */
const CVD = {
  protanopia: [[0.11238, 0.88762, 0], [0.11238, 0.88762, 0], [0.00401, -0.00401, 1]],
  deuteranopia: [[0.29275, 0.70725, 0], [0.29275, 0.70725, 0], [-0.02234, 0.02234, 1]],
};
const simulate = (h, kind) => {
  const [r, g, b] = hex2rgb(h).map(lin);
  const m = CVD[kind];
  const enc = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  return `#${m
    .map((row) => Math.round(Math.max(0, Math.min(1, enc(Math.max(0, Math.min(1, row[0] * r + row[1] * g + row[2] * b))))) * 255)
      .toString(16)
      .padStart(2, '0'))
    .join('')}`;
};

describe.each([['ARB', arbBrand], ['PCH', pchBrand]])('%s palette', (_name, b) => {
  it('passes AA for label text on the primary fill', () => {
    // Buttons and pills put white text on `primary`.
    expect(contrast(b.colors.primary, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the active nav accent visible on the rail', () => {
    // navActive is an icon and a 2px inset bar, not text — WCAG's bar for a
    // graphical object is 3:1. The label beside it is #fff on the rail itself.
    expect(contrast(b.colors.navActive, b.colors.navRail)).toBeGreaterThanOrEqual(3);
    expect(contrast('#FFFFFF', b.colors.navRail)).toBeGreaterThanOrEqual(4.5);
  });

  it('passes AA wherever white text sits on a brand fill', () => {
    // The real defect this replaced a wrong assertion with: the rule builder
    // put white text on navActive (4.10:1) on a light surface. Fills that
    // carry white text must clear 4.5, and `primary` is the token for that.
    expect(contrast('#FFFFFF', b.colors.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#FFFFFF', b.colors.primaryDeep)).toBeGreaterThanOrEqual(4.5);
  });

  it('steps the chart ramp monotonically in lightness', () => {
    // Separation comes from lightness, not hue, which is what lets the ramp
    // survive greyscale and colour-vision deficiency.
    const tints = b.chartSeries.slice(0, 4).map((c) => lab(c)[0]);
    tints.forEach((l, i) => {
      if (i) expect(l).toBeGreaterThan(tints[i - 1]);
    });
  });

  it('separates the two-way split by hue, not lightness', () => {
    // The regression this pair exists to prevent: the ramp's own first two
    // steps sit ~15 apart under normal vision AND under every CVD, which is
    // not a distinction a reader can use.
    const [a, c] = b.chartDuo;
    expect(deltaE(a, c)).toBeGreaterThanOrEqual(30);
    expect(deltaE(simulate(a, 'protanopia'), simulate(c, 'protanopia'))).toBeGreaterThanOrEqual(25);
    expect(deltaE(simulate(a, 'deuteranopia'), simulate(c, 'deuteranopia'))).toBeGreaterThanOrEqual(20);
  });

  it('keeps both duo colours legible as a graphical object on white', () => {
    // WCAG 3:1 for non-text.
    b.chartDuo.forEach((c) => expect(contrast(c, '#FFFFFF')).toBeGreaterThanOrEqual(3));
  });

  it('does not let the duo partner read as the danger state', () => {
    expect(deltaE(b.chartDuo[1], b.colors.danger)).toBeGreaterThanOrEqual(20);
  });

  it('beats the ramp it replaced for a binary split', () => {
    const rampPair = deltaE(b.chartSeries[0], b.chartSeries[1]);
    expect(deltaE(...b.chartDuo)).toBeGreaterThan(rampPair * 1.5);
  });
});
