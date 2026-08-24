/**
 * Derived analytics.
 *
 * Everything the dashboard and reports draw is computed from the same book the
 * tables show — no parallel "analytics" fixture that can quietly disagree with
 * the queue. If the table says 901 open cases, the KPI says 901.
 */

import brand, { REASON_CATEGORIES } from '@/brand/brand.config';
import { isClosed } from '@/domain/statuses';

const DAY = 86_400_000;

const startOfDay = (ms) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const weekLabel = (ms) => {
  const d = new Date(ms);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  return `Week ${Math.ceil(((d - jan1) / DAY + jan1.getDay() + 1) / 7)}`;
};

/* ------------------------------------------------------------------ *
 * Dashboard
 * ------------------------------------------------------------------ */

/** Case Activity Per Week — stacked by outcome-ish status, last 6 weeks. */
export function caseActivityPerWeek(cases, weeks = 6) {
  const now = Date.now();
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * DAY;
    return { period: weekLabel(end), start: end - 7 * DAY, end, completed: 0, represented: 0, expired: 0, rejected: 0, open: 0 };
  });

  cases.forEach((c) => {
    const at = new Date(c.dateCreated).getTime();
    const b = buckets.find((x) => at > x.start && at <= x.end);
    if (!b) return;
    if (c.status === 'completed') b.completed += 1;
    else if (c.status === 'represented') b.represented += 1;
    else if (c.status === 'expired') b.expired += 1;
    else if (c.status === 'rejected') b.rejected += 1;
    else b.open += 1;
  });

  return buckets.map(({ period, completed, represented, expired, rejected, open }) => ({
    period, completed, represented, expired, rejected, open,
  }));
}

/** New Cases Per Day — area chart. */
export function newCasesPerDay(cases, days = 28) {
  const today = startOfDay(Date.now());
  const buckets = Array.from({ length: days }, (_, i) => {
    const at = today - (days - 1 - i) * DAY;
    return {
      at,
      period: new Intl.DateTimeFormat(brand.locale, { day: '2-digit', month: 'short' }).format(at),
      value: 0,
    };
  });

  cases.forEach((c) => {
    const day = startOfDay(new Date(c.dateCreated).getTime());
    const b = buckets.find((x) => x.at === day);
    if (b) b.value += 1;
  });

  return buckets;
}

/** Reason-code split for one scheme — the two dashboard donuts. */
export function reasonCodeDonut(cases, schemeId, topN = 5) {
  const relevant = cases.filter((c) => c.caseType === 'chargeback' && c.network === schemeId);

  const counts = new Map();
  relevant.forEach((c) => {
    if (!counts.has(c.reasonCode)) counts.set(c.reasonCode, { label: c.reasonCode, description: c.reasonLabel, value: 0 });
    counts.get(c.reasonCode).value += 1;
  });

  const sorted = [...counts.values()].sort((a, b) => b.value - a.value);
  const head = sorted.slice(0, topN);
  const tail = sorted.slice(topN);

  if (tail.length) {
    head.push({ label: 'Other', description: `${tail.length} further codes`, value: tail.reduce((s, e) => s + e.value, 0), other: true });
  }

  return { slices: head, total: relevant.length };
}

/** Analyst activity table — EMAIL / AHT (MINUTES) / CASES PER USER. */
export function analystActivity(cases) {
  const byUser = new Map();

  cases.forEach((c) => {
    if (c.worker === '—') return;
    if (!byUser.has(c.worker)) byUser.set(c.worker, { email: c.worker, minutes: 0, handled: 0, cases: 0 });
    const row = byUser.get(c.worker);
    row.cases += 1;
    if (c.handlingMinutes > 0) {
      row.minutes += c.handlingMinutes;
      row.handled += 1;
    }
  });

  return [...byUser.values()]
    .map((r) => ({ email: r.email, aht: r.handled ? r.minutes / r.handled : 0, casesPerUser: r.cases }))
    .sort((a, b) => b.casesPerUser - a.casesPerUser);
}

export function caseKpis(cases) {
  const open = cases.filter((c) => !isClosed(c.status));
  const closed = cases.filter((c) => isClosed(c.status));
  const won = closed.filter((c) => c.outcome === 'won');
  const today = new Date().toISOString().slice(0, 10);

  return {
    total: cases.length,
    openCases: open.length,
    overdueCases: open.filter((c) => c.dueDate < today).length,
    unassigned: open.filter((c) => c.worker === '—').length,
    openValue: Math.round(open.reduce((s, c) => s + c.disputeAmount, 0) * 100) / 100,
    recoveredValue: Math.round(won.reduce((s, c) => s + c.disputeAmount, 0) * 100) / 100,
    winRate: closed.length ? (won.length / closed.length) * 100 : 0,
    represented: cases.filter((c) => c.status === 'represented').length,
    chargebacks: cases.filter((c) => c.caseType === 'chargeback').length,
    claims: cases.filter((c) => c.caseType === 'claim').length,
  };
}

/* ------------------------------------------------------------------ *
 * Reports centre
 * ------------------------------------------------------------------ */

export const DUE_BUCKETS = [
  { id: 'pastDue', label: 'Past due' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'd2', label: '2 days' },
  { id: 'd3', label: '3 days' },
  { id: 'd4', label: '4 days' },
  { id: 'd5plus', label: '5+ days' },
];

export function dueBucketOf(dueDate) {
  const days = Math.floor((new Date(dueDate).getTime() - startOfDay(Date.now())) / DAY);
  if (days < 0) return 'pastDue';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === 2) return 'd2';
  if (days === 3) return 'd3';
  if (days === 4) return 'd4';
  return 'd5plus';
}

/** Cases by due date per week — bar chart on Reports centre. */
export function casesByDueDatePerWeek(cases, weeks = 6) {
  const now = Date.now();
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = now + i * 7 * DAY;
    return { period: weekLabel(start), start, end: start + 7 * DAY, chargeback: 0, claim: 0 };
  });

  cases.filter((c) => !isClosed(c.status)).forEach((c) => {
    const at = new Date(c.dueDate).getTime();
    const b = buckets.find((x) => at >= x.start && at < x.end);
    if (b) b[c.caseType] += 1;
  });

  return buckets;
}

/** Entity case totals by due date — full-width bar. */
export function entityTotalsByDueDate(cases) {
  return brand.entities.map((entity) => {
    const rows = cases.filter((c) => c.entityId === entity.id && !isClosed(c.status));
    const out = { period: entity.label };
    DUE_BUCKETS.forEach((b) => { out[b.id] = 0; });
    rows.forEach((c) => { out[dueBucketOf(c.dueDate)] += 1; });
    return out;
  });
}

/** Case totals by reason category and due date — the table. */
export function reasonCategoryByDueDate(cases) {
  const open = cases.filter((c) => !isClosed(c.status));

  return REASON_CATEGORIES.map((category) => {
    const rows = open.filter((c) => c.reasonCategory === category.id);
    const out = { id: category.id, description: category.label, total: rows.length };
    DUE_BUCKETS.forEach((b) => { out[b.id] = 0; });
    rows.forEach((c) => { out[dueBucketOf(c.dueDate)] += 1; });
    return out;
  }).filter((r) => r.total > 0);
}

export function totalsByQueue(cases) {
  const open = cases.filter((c) => !isClosed(c.status));
  const today = new Date().toISOString().slice(0, 10);

  return brand.queues.map((queue) => {
    const rows = open.filter((c) => c.queueId === queue.id);
    return {
      id: queue.id,
      label: queue.label,
      description: queue.description,
      sla: queue.sla,
      casesInQueue: rows.length,
      overdue: rows.filter((c) => c.dueDate < today).length,
      value: Math.round(rows.reduce((s, c) => s + c.disputeAmount, 0) * 100) / 100,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Monitoring — derived from the book, not a separate fixture
 * ------------------------------------------------------------------ */

export function documentProcessing(cases, weeks = 8) {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * DAY;
    const rows = cases.filter((c) => {
      const at = new Date(c.dateCreated).getTime();
      return at > end - 7 * DAY && at <= end;
    });
    return {
      period: weekLabel(end),
      received: rows.filter((c) => c.docStatus === 'received').length,
      pending: rows.filter((c) => c.docStatus === 'pending').length,
      missing: rows.filter((c) => c.docStatus === 'missing').length,
    };
  });
}

export function disputeOutcomes(cases, weeks = 8) {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * DAY;
    const rows = cases.filter((c) => {
      const at = new Date(c.dateCreated).getTime();
      return at > end - 7 * DAY && at <= end;
    });
    return {
      period: weekLabel(end),
      won: rows.filter((c) => c.outcome === 'won').length,
      lost: rows.filter((c) => c.outcome === 'lost').length,
      written_off: rows.filter((c) => c.outcome === 'written_off').length,
    };
  });
}

/* ------------------------------------------------------------------ *
 * Report-builder template previews — one distinct shape per template,
 * so switching templates visibly changes what the preview shows instead
 * of just relabelling the same dashboard charts.
 * ------------------------------------------------------------------ */

/** Due-date pressure as a donut — how much of the open book is overdue vs comfortable. */
export function dueBucketDonut(cases) {
  const open = cases.filter((c) => !isClosed(c.status));
  const counts = new Map(DUE_BUCKETS.map((b) => [b.id, 0]));
  open.forEach((c) => counts.set(dueBucketOf(c.dueDate), (counts.get(dueBucketOf(c.dueDate)) ?? 0) + 1));

  return {
    slices: DUE_BUCKETS.map((b) => ({ label: b.label, value: counts.get(b.id) ?? 0 })).filter((s) => s.value > 0),
    total: open.length,
  };
}

/** Volume and value by reason category — the bar half of reason-code analysis. */
export function reasonCategoryTotals(cases) {
  return REASON_CATEGORIES.map((cat) => {
    const rows = cases.filter((c) => c.reasonCategory === cat.id);
    return {
      period: cat.label,
      count: rows.length,
      value: Math.round(rows.reduce((s, c) => s + c.disputeAmount, 0) * 100) / 100,
    };
  }).filter((r) => r.count > 0);
}

/** Outcome split for closed cases — the donut half of recovery and write-off. */
export function outcomeDonut(cases) {
  const closed = cases.filter((c) => isClosed(c.status));
  const groups = [
    { label: 'Won', value: closed.filter((c) => c.outcome === 'won').length },
    { label: 'Lost', value: closed.filter((c) => c.outcome === 'lost').length },
    { label: 'Written off', value: closed.filter((c) => c.outcome === 'written_off').length },
  ].filter((s) => s.value > 0);
  return { slices: groups, total: closed.length };
}

/** Top item categories by volume — what's actually being disputed. */
export function itemCategoryTotals(cases, topN = 6) {
  const counts = new Map();
  cases.forEach((c) => counts.set(c.itemCategory, (counts.get(c.itemCategory) ?? 0) + 1));
  return [...counts.entries()]
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

/** Chargeback vs claim split — the two intake paths a hybrid case book shares. */
export function caseTypeDonut(cases) {
  const slices = [
    { label: 'Chargeback', value: cases.filter((c) => c.caseType === 'chargeback').length },
    { label: 'Claim', value: cases.filter((c) => c.caseType === 'claim').length },
  ].filter((s) => s.value > 0);
  return { slices, total: cases.length };
}

/** Error handling by response type — the one genuinely synthetic series. */
export const ERROR_TYPES = [
  { id: 'timeout', label: 'Gateway timeout', http: '504', remedy: 'Retried automatically with backoff.' },
  { id: 'validation', label: 'Validation rejected', http: '422', remedy: 'Row quarantined for manual correction.' },
  { id: 'upstream', label: 'Upstream unavailable', http: '502', remedy: 'Queued for redelivery.' },
  { id: 'auth', label: 'Authentication failed', http: '401', remedy: 'Credential rotation required.' },
];

export function errorHandling(cases, weeks = 8) {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * 7 * DAY;
    const volume = cases.filter((c) => {
      const at = new Date(c.dateCreated).getTime();
      return at > end - 7 * DAY && at <= end;
    }).length;
    // Deterministic from the week's own volume, so it moves with the book.
    return {
      period: weekLabel(end),
      timeout: Math.round(volume * 0.018) + (i % 3),
      validation: Math.round(volume * 0.041) + (i % 4),
      upstream: Math.round(volume * 0.012) + ((i + 1) % 3),
      auth: (i + 2) % 4,
    };
  });
}
