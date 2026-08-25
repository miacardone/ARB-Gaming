import { describe, expect, it } from 'vitest';
import { CASES } from '@/data/cases';
import { buildConsolidationGroups, consolidationStats } from '@/domain/consolidation';
import brand from '@/brand/brand.config';

/**
 * The generated book is the product. These are the checks that were run by hand
 * after every change during the build — they belong in CI, not in a throwaway
 * harness.
 */
describe('generated case book', () => {
  it('is 1,200 cases at exactly 2:1 chargebacks to claims', () => {
    const cb = CASES.filter((c) => c.caseType === 'chargeback');
    const claims = CASES.filter((c) => c.caseType === 'claim');
    expect(CASES).toHaveLength(1200);
    expect(cb).toHaveLength(800);
    expect(claims).toHaveLength(400);
  });

  it('never post-dates a presentment', () => {
    // Dates anchor to now(), so the seed controls offsets, not the calendar.
    // A short window (Amex + RFI computes negative) must be floored, not left
    // to produce a case created in the future.
    const today = new Date().toISOString().slice(0, 10);
    expect(CASES.filter((c) => c.dateCreated > today)).toHaveLength(0);
  });

  it('resolves an entity and a queue on every case', () => {
    // The original tenant leak: an entity-weight map keyed on literal entity
    // ids produced entity-less cases the moment a second tenant generated.
    expect(CASES.filter((c) => !c.entityLabel)).toHaveLength(0);
    expect(CASES.filter((c) => !c.queueLabel)).toHaveLength(0);
  });

  it('prices every purchase on the .99 ladder', () => {
    const off = CASES.filter((c) => Math.round((c.itemPrice % 1) * 100) !== 99);
    expect(off).toHaveLength(0);
  });

  it('keeps every case inside a configured market', () => {
    const configured = new Set(brand.markets);
    const stray = [...new Set(CASES.map((c) => c.market))].filter((m) => !configured.has(m));
    expect(stray).toEqual([]);
  });

  it('routes post-restriction claims to the compliance queue', () => {
    const restricted = CASES.filter((c) => c.caseType === 'claim' && c.reasonCode === 'wrong_item');
    expect(restricted.length).toBeGreaterThan(0);
    expect(restricted.every((c) => c.queueId === 'logistics')).toBe(true);
  });
});

describe('consolidation', () => {
  const groups = buildConsolidationGroups(CASES);
  const stats = consolidationStats(CASES, groups);

  it('flags 10-15% of the book', () => {
    // Tuned loosely this hit 60%, then 28% — at which point the flag carries no
    // information. The band is the feature, so it is asserted rather than noted.
    expect(stats.flaggedRate).toBeGreaterThanOrEqual(10);
    expect(stats.flaggedRate).toBeLessThanOrEqual(15);
  });

  it('marks double-refund risk only where a purchase is shared', () => {
    // A studio group holding a chargeback and a claim across two different
    // purchases is two separate losses, not a double-dip.
    const risky = groups.filter((g) => g.duplicateRefundRisk);
    expect(risky.length).toBeGreaterThan(0);
    expect(risky.every((g) => g.ruleId === 'same_order' && g.crossChannel)).toBe(true);
  });

  it('honours each rule’s minimum group size', () => {
    brand.consolidation.rules.forEach((rule) => {
      groups
        .filter((g) => g.ruleId === rule.id)
        .forEach((g) => expect(g.size).toBeGreaterThanOrEqual(rule.minSize));
    });
  });

  it('keeps the open-only rule to open cases', () => {
    const openOnly = brand.consolidation.rules.filter((r) => r.openOnly).map((r) => r.id);
    groups
      .filter((g) => openOnly.includes(g.ruleId))
      .forEach((g) => expect(g.openCount).toBe(g.size));
  });
});
