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
/**
 * CIEDE2000. CIE76 was tried first and rejected: it overestimates differences
 * in saturated blues and violets badly enough that the ramp's own first two
 * steps scored 33 when CIEDE2000 puts them at 15 — so a threshold tuned on one
 * metric was meaningless against numbers quoted from the other. The figures in
 * brand.config are CIEDE2000; this is the same maths, so they agree.
 */
const deltaE = (c1, c2) => {
  const [L1, a1, b1] = lab(c1);
  const [L2, a2, b2] = lab(c2);
  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)) || 0);
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1 = a1p || b1 ? (deg(Math.atan2(b1, a1p)) + 360) % 360 : 0;
  const h2 = a2p || b2 ? (deg(Math.atan2(b2, a2p)) + 360) % 360 : 0;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dh = h2 - h1;
  if (C1p * C2p === 0) dh = 0;
  else if (dh > 180) dh -= 360;
  else if (dh < -180) dh += 360;
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dh) / 2);
  const Lp = (L1 + L2) / 2;
  const Cp = (C1p + C2p) / 2;
  let hp;
  if (C1p * C2p === 0) hp = h1 + h2;
  else if (Math.abs(h1 - h2) <= 180) hp = (h1 + h2) / 2;
  else hp = h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
  const T = 1 - 0.17 * Math.cos(rad(hp - 30)) + 0.24 * Math.cos(rad(2 * hp))
    + 0.32 * Math.cos(rad(3 * hp + 6)) - 0.2 * Math.cos(rad(4 * hp - 63));
  const dTh = 30 * Math.exp(-(((hp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cp ** 7 / (Cp ** 7 + 25 ** 7)) || 0;
  const Sl = 1 + (0.015 * (Lp - 50) ** 2) / Math.sqrt(20 + (Lp - 50) ** 2);
  const Sc = 1 + 0.045 * Cp;
  const Sh = 1 + 0.015 * Cp * T;
  const Rt = -Math.sin(rad(2 * dTh)) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2
    + Rt * (dCp / Sc) * (dHp / Sh));
};

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

  it('uses no green anywhere in the palette', () => {
    // The brand is violet (and blue for PCH). A green success token was the one
    // colour in the UI that came from nowhere in ARB's palette.
    const hue = (h) => {
      const [r, g, b] = hex2rgb(h).map((v) => v / 255);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max === min) return null;
      const d = max - min;
      const deg = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return ((deg * 60) + 360) % 360;
    };
    Object.entries(b.colors).forEach(([token, value]) => {
      const h = hue(value);
      // Greens sit roughly 75-165 degrees. Scheme colours are the card
      // networks' own and are not ours to change.
      if (h != null && !token.startsWith('scheme')) {
        expect(h < 75 || h > 165, `${token} (${value}) is green at ${Math.round(h)}deg`).toBe(true);
      }
    });
  });

  it('keeps the success token readable as text on white and on its own tint', () => {
    expect(contrast(b.colors.success, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(contrast(b.colors.success, b.colors.successTint)).toBeGreaterThanOrEqual(4.5);
  });

  it('steps the chart ramp monotonically in lightness', () => {
    // Separation comes from lightness, not hue, which is what lets the ramp
    // survive greyscale and colour-vision deficiency.
    const tints = b.chartSeries.slice(0, 4).map((c) => lab(c)[0]);
    tints.forEach((l, i) => {
      if (i) expect(l).toBeGreaterThan(tints[i - 1]);
    });
  });

  it('separates the two-way split far enough to read', () => {
    // The regression this pair exists to prevent: the ramp's own first two
    // steps sit ~15 apart under normal vision AND under every CVD, which is
    // not a distinction a reader can use. The pair uses the ramp's ENDS, so
    // the separation is lightness — which is why the CVD numbers barely move.
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
