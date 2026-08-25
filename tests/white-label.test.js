import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { TENANTS } from '@/brand/brand.config';

/**
 * The white-label rule, enforced rather than documented: no component may
 * hard-code a colour, a brand name, or a tenant value. Every leak this build
 * started with was of exactly this shape — a plausible default that only
 * misbehaves once a second tenant exists.
 */

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const SRC = join(process.cwd(), 'src');
const sourceFiles = walk(SRC).filter((f) => /\.jsx?$/.test(f));
const componentFiles = sourceFiles.filter((f) => !f.includes(join('src', 'brand')));

/** Strip comments so prose about a colour is not mistaken for a hard-coded one. */
const codeOf = (file) =>
  readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('tenant registry', () => {
  it('has at least two tenants, so the swap is exercised', () => {
    expect(Object.keys(TENANTS).length).toBeGreaterThanOrEqual(2);
  });

  it.each(Object.entries(TENANTS))('%s carries a complete config', (_id, b) => {
    ['name', 'currency', 'locale', 'timezone', 'logo', 'terms', 'numbering', 'entities', 'queues'].forEach((k) =>
      expect(b[k], k).toBeTruthy(),
    );
    expect(b.entities.length).toBeGreaterThan(0);
    expect(b.markets.length).toBeGreaterThan(0);
    // Queue ids are shared across tenants by design — cases route into them by
    // id, so a tenant that renames an id silently empties that queue.
    const ids = b.queues.map((q) => q.id).sort();
    expect(ids).toEqual(TENANTS.arb.queues.map((q) => q.id).sort());
  });

  it('gives each tenant its own demo credentials and case prefix', () => {
    const users = Object.values(TENANTS).map((b) => b.demoCredentials.username);
    const prefixes = Object.values(TENANTS).map((b) => b.numbering.prefix);
    expect(new Set(users).size).toBe(users.length);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });
});

describe('no tenant leaks in components', () => {
  it('hard-codes no hex colour outside the brand config and tokens', () => {
    const offenders = componentFiles
      .filter((f) => !f.endsWith('Charts.jsx')) // gradients declare stop colours from props
      .map((f) => [f, codeOf(f).match(/#[0-9a-fA-F]{6}\b/g) ?? []])
      .filter(([, hits]) => hits.length)
      // The document viewer prints on simulated paper, which is not themed.
      .filter(([f]) => !f.endsWith('DocViewer.jsx'));
    expect(offenders.map(([f, h]) => `${f.replace(SRC, 'src')}: ${h.join(',')}`)).toEqual([]);
  });

  it('names no tenant in a component', () => {
    const names = Object.values(TENANTS).flatMap((b) => [b.name, b.legalName]);
    const offenders = componentFiles
      .map((f) => [f, names.filter((n) => codeOf(f).includes(n))])
      .filter(([, hits]) => hits.length);
    expect(offenders.map(([f, h]) => `${f.replace(SRC, 'src')}: ${h.join(',')}`)).toEqual([]);
  });

  it('leaves no British spelling in shipped source', () => {
    // The console is US-market; this is the sweep that caught "Ageing cases".
    const BRITISH = /\b(colour|centre|behaviour|programme|authorisation|organisation|recognise[sd]?|analysed|defence|licence|despatch\w*|fulfilment|enrolment|catalogue|whilst|amongst|ageing|itemised)\b/i;
    const offenders = sourceFiles
      .map((f) => [f, codeOf(f).match(BRITISH)])
      .filter(([, m]) => m);
    expect(offenders.map(([f, m]) => `${f.replace(SRC, 'src')}: ${m[0]}`)).toEqual([]);
  });
});

describe('table alignment convention', () => {
  it("right-aligns only money", () => {
    // Values centre; currency is the single exception, because a column of
    // amounts is read by scanning the decimal point. `align: 'right'` is the
    // marker for that and means nothing else — counts, percentages, dates and
    // durations all centre with everything else.
    const offenders = [];
    sourceFiles.forEach((file) => {
      const src = readFileSync(file, 'utf8');
      src.split('\n').forEach((line, i) => {
        if (!line.includes("align: 'right'")) return;
        // Look at the column definition and the few lines after it, since a
        // cell renderer is often spread over several.
        const block = src.split('\n').slice(i, i + 12).join('\n');
        if (!/formatCurrency|formatCompactCurrency|disputeAmount/.test(block)) {
          offenders.push(`${file.replace(SRC, 'src')}:${i + 1}`);
        }
      });
    });
    expect(offenders).toEqual([]);
  });
});

describe('no dead controls', () => {
  it('sets every piece of state it reads', () => {
    // A control removed while its logic stayed behind — the Alert case work
    // filters that could be applied with nothing left to clear them.
    const offenders = [];
    sourceFiles.forEach((file) => {
      const src = readFileSync(file, 'utf8');
      for (const m of src.matchAll(/const \[(\w+), (set\w+)\] = useState/g)) {
        const [, name, setter] = m;
        const after = src.slice(m.index + m[0].length);
        const reads = after.match(new RegExp(`(?<![\\w.])${name}(?![\\w])`, 'g'))?.length ?? 0;
        const writes = after.match(new RegExp(`(?<![\\w.])${setter}(?![\\w])`, 'g'))?.length ?? 0;
        if (reads > 0 && writes === 0) offenders.push(`${file.replace(SRC, 'src')}: ${name}`);
      }
    });
    expect(offenders).toEqual([]);
  });

  it('imports nothing it does not use', () => {
    const offenders = [];
    sourceFiles.forEach((file) => {
      const src = readFileSync(file, 'utf8');
      const body = src.split('\n').filter((l) => !l.startsWith('import')).join('\n');
      for (const m of src.matchAll(/^import \{([^}]*)\} from '[^']*';/gm)) {
        m[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .forEach((name) => {
            if (!new RegExp(`(?<![\\w])${name}(?![\\w])`).test(body)) {
              offenders.push(`${file.replace(SRC, 'src')}: ${name}`);
            }
          });
      }
    });
    expect(offenders).toEqual([]);
  });
});
