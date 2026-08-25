import { useMemo, useState } from 'react';
import { PageHeader, Card, Tabs, Button, IconButton, Badge, Kpi, EmptyState } from '@/components/ui/Surface';
import { DataTable } from '@/components/ui/DataTable';

import { SelectField, TextField } from '@/components/ui/Form';
import { BarChart, Donut, BarRows, LineChart, DotPlot, ScatterPlot } from '@/components/charts/Charts';
import { Popover, TruncatedText } from '@/components/ui/Overlay';
import Icon from '@/components/ui/Icon';
import { REPORT_FORMATS, REPORT_TEMPLATES, REPORT_TYPES, SAVED_REPORTS } from '@/data/content';
import { FILTER_OPERATORS, REPORT_FIELDS, applyReportScope, describeFilter, getReportField } from '@/domain/reportFields';
import { CASES } from '@/data/cases';
import { DUE_BUCKETS, caseActivityPerWeek, dueBucketOf, reasonCodeDonut, topSellersByVolume, totalsByQueue, weeklySeries } from '@/domain/metrics';
import brand, { categoryLabel } from '@/brand/brand.config';
import { useToast } from '@/context/ToastContext';
import { formatCompactCurrency, formatCurrency, formatDate, formatNumber, titleCase } from '@/utils/format';

/**
 * Custom reports.
 *
 * Scheduling lives HERE, in the builder, rather than on a Scheduler page — a
 * schedule belongs to a report. Scheduled reports get their own tab in the list.
 */

const TABS = [{ value: 'reports', label: 'Reports' }, { value: 'scheduled', label: 'Scheduled reports' }, { value: 'builder', label: 'Report builder' }];

/** Each template covers a genuinely different angle, so each gets its own
 *  icon rather than the one generic "spreadsheet" glyph every template used
 *  to share. */
const TEMPLATE_META = {
  tpl_operational: { icon: 'inbox' },
  tpl_reason: { icon: 'searchCheck' },
  tpl_recovery: { icon: 'archive' },
  tpl_marketplace: { icon: 'layers' },
};

/** Real report columns, shared by every template — this is what the info
 *  popover's checklist actually controls, not a per-template blurb. */
const REPORT_COLUMN_DEFAULTS = [
  { key: 'id', label: 'Case #' },
  { key: 'queueLabel', label: 'Queue' },
  { key: 'worker', label: 'Assigned to' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'status', label: 'Status' },
  { key: 'disputeAmount', label: 'Disputed amount' },
];
const REPORT_COLUMN_OPTIONAL = [
  { key: 'networkDueDate', label: 'SLA target' },
  { key: 'reviewer', label: 'Reviewer' },
  { key: 'assignmentReason', label: 'Assignment reason' },
  { key: 'bankCode', label: 'Bank code' },
];

/** The second preview chart follows the template's own groupBy, not a fixed
 *  reason-code donut for every template — a recovery report should show
 *  entities, not schemes. */
function breakdownFor(scoped, groupBy) {
  const by = new Map();
  scoped.forEach((c) => {
    const key = groupBy === 'queue' ? c.queueLabel
      : groupBy === 'entity' ? c.entityLabel
        : groupBy === 'caseType' ? (c.caseType === 'chargeback' ? brand.terms.chargebacks : brand.terms.claims)
          : categoryLabel(c.reasonCategory) ?? 'Other';
    by.set(key, (by.get(key) ?? 0) + 1);
  });
  return [...by.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

/**
 * Each template renders a genuinely different pair of visuals, not the same
 * chart with a different groupBy — an operational review is about queue
 * pressure, a recovery report is about money, a marketplace report is about
 * sellers. `kpis` also swaps per template so the top row isn't identical
 * across all four.
 */
function templatePreview(templateId, scoped, brandRef) {
  const closed = scoped.filter((c) => ['completed', 'rejected', 'expired', 'written_off'].includes(c.status));

  if (templateId === 'tpl_operational') {
    const queueDepth = totalsByQueue(scoped)
      .filter((q) => q.casesInQueue > 0)
      .sort((a, b) => b.casesInQueue - a.casesInQueue)
      .map((q) => ({ label: q.label, value: q.casesInQueue, meta: formatCompactCurrency(q.value) }));

    const dueBuckets = DUE_BUCKETS.map((b) => ({
      label: b.label,
      value: scoped.filter((c) => dueBucketOf(c.dueDate) === b.id).length,
      color: b.id === 'pastDue' ? 'var(--c-nav-active)' : undefined,
    }));

    return {
      kpis: [
        { label: 'Open cases', value: formatNumber(scoped.filter((c) => !closed.includes(c)).length), spark: weeklySeries(scoped, 6, () => 1, (c) => !closed.includes(c)) },
        { label: 'Past due', value: formatNumber(scoped.filter((c) => dueBucketOf(c.dueDate) === 'pastDue').length), spark: weeklySeries(scoped, 6, () => 1, (c) => dueBucketOf(c.dueDate) === 'pastDue') },
        { label: 'Unassigned', value: formatNumber(scoped.filter((c) => c.worker === '—').length), spark: weeklySeries(scoped, 6, () => 1, (c) => c.worker === '—') },
        { label: 'Queues in use', value: formatNumber(queueDepth.length) },
      ],
      /* Operational: KPI-led. A wide bar chart of arrivals, then the queue
         ranking under it. No pies — this report is about volume and time. */
      showKpis: true,
      panels: [
        { title: 'Open cases entering each week', kind: 'bars', span: 2, xLabel: 'Week', yLabel: 'Cases',
          data: weeksBack(scoped, 8, (c) => !closed.includes(c)),
          series: [{ key: 'value', name: 'Open on arrival', color: 'var(--c-duo-0)' }] },
        { title: 'Cases by queue', kind: 'rows', data: queueDepth },
        { title: 'Due-date pressure', kind: 'lollipop', data: dueBuckets, yLabel: 'Cases', height: 210 },
      ],
    };
  }

  if (templateId === 'tpl_reason') {
    const scheme = brandRef.schemes[0];
    const scheme2 = brandRef.schemes[1];
    const schemeDonut = reasonCodeDonut(scoped, scheme.id);
    const scheme2Donut = reasonCodeDonut(scoped, scheme2.id);
    const categoryBreakdown = breakdownFor(scoped, 'reasonCategory');

    return {
      kpis: [
        { label: 'Total cases', value: formatNumber(scoped.length), spark: weeklySeries(scoped, 6, () => 1) },
        { label: `${scheme.label} share`, value: formatNumber(schemeDonut.total), spark: weeklySeries(scoped, 6, () => 1, (c) => c.network === scheme.id) },
        { label: 'Reason categories', value: formatNumber(categoryBreakdown.length) },
        { label: 'Disputed value', value: formatCompactCurrency(scoped.reduce((s, c) => s + c.disputeAmount, 0)), spark: weeklySeries(scoped, 6, (c) => c.disputeAmount) },
      ],
      /* Reason analysis: composition. Two pies side by side, one per scheme,
         then a line of how the categories move. No KPI row — the pies are the
         headline. */
      showKpis: false,
      panels: [
        { title: `${scheme.label} reason codes`, kind: 'donut', data: schemeDonut.slices, centerValue: formatNumber(schemeDonut.total), centerLabel: scheme.label },
        { title: `${scheme2.label} reason codes`, kind: 'donut', data: scheme2Donut.slices, centerValue: formatNumber(scheme2Donut.total), centerLabel: scheme2.label },
        { title: 'Reason categories per week', kind: 'line', span: 2, xLabel: 'Week', yLabel: 'Cases',
          data: categoryByWeek(scoped, 8),
          series: [
            { key: 'fraud', name: 'Fraud', color: 'var(--c-duo-0)' },
            { key: 'consumer', name: 'Consumer dispute', color: 'var(--c-duo-1)' },
            { key: 'processing', name: 'Processing error', color: 'var(--c-series-2)' },
          ] },
        { title: 'Fraud vs. processing vs. consumer', kind: 'rows', span: 2, data: categoryBreakdown },
      ],
    };
  }

  if (templateId === 'tpl_recovery') {
    const outcomeBreakdown = ['won', 'lost', 'written_off'].map((id) => ({
      label: id === 'won' ? 'Won' : id === 'lost' ? 'Lost' : 'Written off',
      value: closed.filter((c) => c.outcome === id).length,
      color: id === 'won' ? 'var(--c-duo-0)' : id === 'lost' ? 'var(--c-duo-1)' : 'var(--c-series-neutral)',
    }));
    const recoveredByEntity = [...new Set(closed.map((c) => c.entityLabel))]
      .map((label) => ({ label, value: closed.filter((c) => c.entityLabel === label && c.outcome === 'won').reduce((s, c) => s + c.disputeAmount, 0) }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .map((r) => ({ ...r, meta: formatCurrency(r.value) }));

    return {
      kpis: [
        { label: 'Closed cases', value: formatNumber(closed.length), spark: weeklySeries(closed, 6, () => 1) },
        { label: 'Won', value: formatNumber(closed.filter((c) => c.outcome === 'won').length), spark: weeklySeries(closed, 6, () => 1, (c) => c.outcome === 'won') },
        { label: 'Recovered value', value: formatCompactCurrency(closed.filter((c) => c.outcome === 'won').reduce((s, c) => s + c.disputeAmount, 0)), spark: weeklySeries(closed, 6, (c) => c.disputeAmount, (c) => c.outcome === 'won') },
        { label: 'Written off', value: formatCompactCurrency(closed.filter((c) => c.outcome === 'written_off').reduce((s, c) => s + c.disputeAmount, 0)), spark: weeklySeries(closed, 6, (c) => c.disputeAmount, (c) => c.outcome === 'written_off') },
      ],
      /* Recovery: the mixed one. KPIs, a pie, a money line and a ranking —
         a finance read rather than an operational one. */
      showKpis: true,
      panels: [
        { title: 'Outcome mix', kind: 'donut', data: outcomeBreakdown, small: true },
        { title: 'Recovered value by entity', kind: 'rows', data: recoveredByEntity.map((r) => ({ label: r.label, value: r.value, meta: r.meta })) },
        { title: 'Recovered vs. written off, by week', kind: 'line', span: 2, xLabel: 'Week', yLabel: 'USD',
          data: recoveryByWeek(closed, 8),
          series: [
            { key: 'recovered', name: 'Recovered', color: 'var(--c-duo-0)' },
            { key: 'writtenOff', name: 'Written off', color: 'var(--c-duo-1)' },
          ] },
      ],
    };
  }

  // tpl_marketplace
  const chargebacks = scoped.filter((c) => c.caseType === 'chargeback').length;
  const claims = scoped.length - chargebacks;
  const typeSplit = [
    { label: brandRef.terms.chargebacks, value: chargebacks, color: 'var(--c-duo-0)' },
    { label: brandRef.terms.claims, value: claims, color: 'var(--c-duo-1)' },
  ];
  const sellerBreakdown = topSellersByVolume(scoped, 8);

  return {
    kpis: [
      { label: 'Total cases', value: formatNumber(scoped.length), spark: weeklySeries(scoped, 6, () => 1) },
      { label: brandRef.terms.claims, value: formatNumber(claims), spark: weeklySeries(scoped, 6, () => 1, (c) => c.caseType === 'claim') },
      { label: 'Distinct sellers', value: formatNumber(sellerBreakdown.length) },
      { label: 'Disputed value', value: formatCompactCurrency(scoped.reduce((s, c) => s + c.disputeAmount, 0)), spark: weeklySeries(scoped, 6, (c) => c.disputeAmount) },
    ],
    /* Studio exposure: the geographic/scatter one. Where the disputes are, and
       which studios sit in the high-volume/high-value corner. */
    showKpis: false,
    panels: [
      { title: `${titleCase(brandRef.terms.seller)} exposure — volume against value`, kind: 'scatter', span: 2, height: 300,
        xLabel: 'Cases', yLabel: 'Disputed value (USD)', formatX: formatNumber, formatY: formatCompactCurrency,
        data: sellerScatter(scoped) },
      { title: 'Cases by state', kind: 'lollipop', span: 2, yLabel: 'Cases', height: 250,
        data: stateBreakdown(scoped) },
      { title: `${brandRef.terms.chargebacks} vs. ${brandRef.terms.claims}`, kind: 'donut', data: typeSplit, small: true },
      { title: `Top ${brandRef.terms.sellers} by volume`, kind: 'rows', data: sellerBreakdown },
    ],
  };
}

const WEEK_MS = 7 * 86_400_000;

/** Weekly counts, oldest first, labelled the way the other charts label weeks. */
function weeksBack(rows, weeks, predicate = () => true) {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * WEEK_MS;
    const inWeek = rows.filter((c) => {
      const t = new Date(c.dateCreated).getTime();
      return predicate(c) && t >= end - WEEK_MS && t < end;
    });
    return { period: `Week ${new Date(end).getWeek?.() ?? Math.ceil(((end - new Date(new Date(end).getFullYear(), 0, 1)) / 86_400_000 + 1) / 7)}`, value: inWeek.length };
  });
}

/** Recovered vs. written-off value per week, for the recovery template. */
function recoveryByWeek(closedRows, weeks) {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * WEEK_MS;
    const inWeek = closedRows.filter((c) => {
      const t = new Date(c.dateCreated).getTime();
      return t >= end - WEEK_MS && t < end;
    });
    const sum = (o) => Math.round(inWeek.filter((c) => c.outcome === o).reduce((a, c) => a + c.disputeAmount, 0));
    return {
      period: `Week ${Math.ceil(((end - new Date(new Date(end).getFullYear(), 0, 1)) / 86_400_000 + 1) / 7)}`,
      recovered: sum('won'),
      writtenOff: sum('written_off'),
    };
  });
}

/** Reason-category counts per week, for the reason template's trend line. */
function categoryByWeek(rows, weeks) {
  const now = Date.now();
  return Array.from({ length: weeks }, (_, i) => {
    const end = now - (weeks - 1 - i) * WEEK_MS;
    const inWeek = rows.filter((c) => {
      const t = new Date(c.dateCreated).getTime();
      return t >= end - WEEK_MS && t < end;
    });
    const n = (cat) => inWeek.filter((c) => c.reasonCategory === cat).length;
    return {
      period: `Week ${Math.ceil(((end - new Date(new Date(end).getFullYear(), 0, 1)) / 86_400_000 + 1) / 7)}`,
      fraud: n('fraud'), consumer: n('consumer'), processing: n('processing'),
    };
  });
}

/** One point per studio: case count against disputed value. */
function sellerScatter(rows) {
  const by = new Map();
  rows.forEach((c) => {
    const cur = by.get(c.seller) ?? { label: c.seller, x: 0, y: 0 };
    cur.x += 1; cur.y += c.disputeAmount;
    by.set(c.seller, cur);
  });
  return [...by.values()].map((d) => ({ ...d, y: Math.round(d.y) }));
}

/** Case counts by US state — the geographic axis for this tenant. */
function stateBreakdown(rows) {
  const by = new Map();
  rows.forEach((c) => { if (c.market) by.set(c.market, (by.get(c.market) ?? 0) + 1); });
  return [...by.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

/**
 * Each template picks a different chart vocabulary, which is the point — four
 * templates that all render "donut plus bar list" are four copies of one
 * report. Operational reads as pressure over time, reason analysis as
 * composition, recovery as money over time, studio exposure as a ranking.
 */
function PreviewPanel({ panel }) {
  const body = () => {
    if (!panel.data?.length) return <p className="micro subtle">No data in scope.</p>;
    switch (panel.kind) {
      case 'donut':
        return <Donut data={panel.data} size={panel.small ? 170 : 190} legend centerValue={panel.centerValue} centerLabel={panel.centerLabel} />;
      case 'bars':
        return <BarChart data={panel.data} height={210} series={panel.series} xLabel={panel.xLabel} yLabel={panel.yLabel} />;
      case 'line':
        return <LineChart data={panel.data} height={210} series={panel.series} xLabel={panel.xLabel} yLabel={panel.yLabel} />;
      case 'lollipop':
        return <DotPlot data={panel.data} xKey={panel.xKey ?? 'label'} valueKey={panel.valueKey ?? 'value'} height={panel.height ?? 230} yLabel={panel.yLabel} formatValue={panel.formatValue} />;
      case 'scatter':
        return <ScatterPlot data={panel.data} height={panel.height ?? 280} xLabel={panel.xLabel} yLabel={panel.yLabel} formatX={panel.formatX} formatY={panel.formatY} />;
      default:
        return <BarRows rows={panel.data} />;
    }
  };
  return (
    <div style={panel.span === 2 ? { gridColumn: '1 / -1' } : undefined}>
      <span className="t-section-label">{panel.title}</span>
      <div style={{ marginTop: 8 }}>{body()}</div>
    </div>
  );
}

function ReportBuilder({ onSave }) {
  const { notify } = useToast();

  const [templateId, setTemplateId] = useState(REPORT_TEMPLATES[0].id);
  const [name, setName] = useState('');
  const [type, setType] = useState(REPORT_TYPES[0]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [groupBy, setGroupBy] = useState(REPORT_FIELDS[0].id);
  const [filter, setFilter] = useState({ field: '', operator: 'gt', value: '' });
  const [format, setFormat] = useState('CSV');
  const [mode, setMode] = useState('on_demand');
  const [frequency, setFrequency] = useState('Weekly');
  const [emailOnComplete, setEmailOnComplete] = useState(true);
  const [recipients, setRecipients] = useState([`ops@${brand.emailDomain}`]);
  const [recipientDraft, setRecipientDraft] = useState('');

  const template = REPORT_TEMPLATES.find((t) => t.id === templateId);
  const [extraFields, setExtraFields] = useState({});
  const activeExtras = extraFields[templateId] ?? [];

  /* The preview is computed from the SCOPED set, not the whole book — the
     point of a builder is seeing the effect before you schedule it. */
  const scoped = useMemo(() => applyReportScope(CASES, { start, end, filter }), [start, end, filter]);
  const byPeriod = useMemo(() => caseActivityPerWeek(scoped, 6), [scoped]);
  const preview = useMemo(() => templatePreview(templateId, scoped, brand), [templateId, scoped]);

  const range = start && end ? `${formatDate(start)} – ${formatDate(end)}` : 'All time';
  const filterLabel = describeFilter(filter);
  const groupByLabel = getReportField(groupBy)?.label ?? groupBy;

  const addRecipient = () => {
    const v = recipientDraft.trim();
    if (!v || recipients.includes(v)) return;
    setRecipients((p) => [...p, v]);
    setRecipientDraft('');
  };

  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(260px, 320px) minmax(0, 1fr)', alignItems: 'start' }}>
      <Card title="Configuration">
        <div className="stack stack--tight">
          <TextField label="Report name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekly counterfeit review" />
          <SelectField label="Report type" value={type} onChange={(e) => setType(e.target.value)} options={REPORT_TYPES.map((t) => ({ value: t, label: t }))} />

          <div className="field">
            <span className="field__label">Start date</span>
            <div className="row row--xtight row--nowrap">
              <input className="input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              {start && <IconButton icon="close" label="Clear start date" size={12} onClick={() => setStart('')} />}
            </div>
          </div>

          <div className="field">
            <span className="field__label">End date</span>
            <div className="row row--xtight row--nowrap">
              <input className="input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              {end && <IconButton icon="close" label="Clear end date" size={12} onClick={() => setEnd('')} />}
            </div>
          </div>

          <SelectField
            label="Group by"
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            options={REPORT_FIELDS.map((f) => ({ value: f.id, label: f.label }))}
          />

          {/* Filter row — field, operator, value. The field list is the same
              REPORT_FIELDS the Group by above uses, so the two cannot drift. */}
          <div className="field">
            <span className="field__label">Filter</span>
            <div className="stack stack--xtight">
              <SelectField
                value={filter.field}
                onChange={(e) => setFilter((f) => ({ ...f, field: e.target.value }))}
                placeholder="No filter"
                options={REPORT_FIELDS.map((f) => ({ value: f.id, label: f.label }))}
              />
              {filter.field && (
                <>
                  <SelectField
                    value={filter.operator}
                    onChange={(e) => setFilter((f) => ({ ...f, operator: e.target.value }))}
                    options={FILTER_OPERATORS.map((o) => ({ value: o.id, label: o.label }))}
                  />
                  <div className="row row--xtight row--nowrap">
                    <input
                      className="input"
                      value={filter.value}
                      onChange={(e) => setFilter((f) => ({ ...f, value: e.target.value }))}
                      placeholder="Value"
                      aria-label="Filter value"
                    />
                    {(filter.field || filter.value) && (
                      <IconButton icon="close" label="Clear filter" size={12} onClick={() => setFilter({ field: '', operator: 'gt', value: '' })} />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          <SelectField label="Format" value={format} onChange={(e) => setFormat(e.target.value)} options={REPORT_FORMATS.map((f) => ({ value: f, label: f }))} />

          <div className="field">
            <span className="field__label">Schedule</span>
            <div className="seg">
              <button type="button" className={`seg__btn ${mode === 'on_demand' ? 'is-active' : ''}`.trim()} onClick={() => setMode('on_demand')}>Run on demand</button>
              <button type="button" className={`seg__btn ${mode === 'recurring' ? 'is-active' : ''}`.trim()} onClick={() => setMode('recurring')}>Recurring</button>
            </div>
          </div>

          {mode === 'recurring' && (
            <SelectField label="Frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} options={['Daily', 'Weekly', 'Monthly'].map((f) => ({ value: f, label: f }))} />
          )}

          <label className="row row--xtight" style={{ cursor: 'pointer' }}>
            <input type="checkbox" className="checkbox" checked={emailOnComplete} onChange={(e) => setEmailOnComplete(e.target.checked)} />
            <span className="small">Email on complete</span>
          </label>

          <div className="field">
            <span className="field__label">Recipients</span>
            <div className="row row--tight" style={{ marginBottom: 4 }}>
              {recipients.map((r) => (
                <span key={r} className="chip">
                  {r}
                  <button type="button" className="chip__remove" onClick={() => setRecipients((p) => p.filter((x) => x !== r))} aria-label={`Remove ${r}`}>
                    <Icon name="close" size={11} />
                  </button>
                </span>
              ))}
            </div>
            <div className="row row--xtight row--nowrap">
              <input className="input" value={recipientDraft} onChange={(e) => setRecipientDraft(e.target.value)} placeholder={`name@${brand.emailDomain}`} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRecipient())} />
              <Button variant="secondary" size="sm" onClick={addRecipient}>Add</Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="stack stack--tight">
        <Card title="Choose a template">
          <div className="grid grid--4">
            {REPORT_TEMPLATES.map((t) => {
              const meta = TEMPLATE_META[t.id] ?? { icon: 'spreadsheet' };
              return (
                <div key={t.id} style={{ position: 'relative' }}>
                  <button type="button" className={`tile ${templateId === t.id ? 'is-selected' : ''}`.trim()} onClick={() => { setTemplateId(t.id); setType(t.type); setGroupBy(t.groupBy); }} style={{ width: '100%' }}>
                    <span className="tile__preview"><Icon name={meta.icon} size={20} /></span>
                    <span className="small strong">{t.name}</span>
                    <span className="micro subtle">{t.description}</span>
                    <span className="row row--xtight" style={{ marginTop: 2 }}>
                      {templateId === t.id && <Badge tone="success">Selected</Badge>}
                      {(extraFields[t.id] ?? []).length > 0 && (
                        <Badge tone="primary">+{(extraFields[t.id] ?? []).length} custom</Badge>
                      )}
                    </span>
                  </button>
                  <div style={{ position: 'absolute', top: 6, right: 6 }} onClick={(e) => e.stopPropagation()}>
                    <Popover
                      align="right"
                      width={250}
                      trigger={({ toggle }) => (
                        <button type="button" className="icon-btn" onClick={toggle} aria-label={`Fields in ${t.name}`}>
                          <Icon name="info" size={13} className="subtle" />
                        </button>
                      )}
                    >
                      {({ close }) => {
                        const activeSet = new Set(extraFields[t.id] ?? []);
                        return (
                          <div className="stack stack--tight" style={{ padding: 'var(--s-2)' }}>
                            <div>
                              <span className="t-section-label">Included by default</span>
                              <div className="stack stack--xtight" style={{ marginTop: 4 }}>
                                {REPORT_COLUMN_DEFAULTS.map((f) => (
                                  <label key={f.key} className="row row--xtight" style={{ cursor: 'not-allowed' }}>
                                    <input type="checkbox" className="checkbox" checked disabled />
                                    <span className="micro">{f.label}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            <div>
                              <span className="t-section-label">Not included — add if you need it</span>
                              <div className="stack stack--xtight" style={{ marginTop: 4 }}>
                                {REPORT_COLUMN_OPTIONAL.map((f) => {
                                  const on = activeSet.has(f.key);
                                  return (
                                    <label key={f.key} className="row row--xtight" style={{ cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={on}
                                        onChange={() => setExtraFields((p) => ({
                                          ...p,
                                          [t.id]: on ? (p[t.id] ?? []).filter((x) => x !== f.key) : [...(p[t.id] ?? []), f.key],
                                        }))}
                                      />
                                      <span className="micro">{f.label}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                            <Button variant="secondary" size="sm" onClick={close} style={{ alignSelf: 'flex-end' }}>Done</Button>
                          </div>
                        );
                      }}
                    </Popover>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          title="Report preview"
          action={<Button variant="primary" icon="check" disabled={!name.trim()} onClick={() => { onSave({ name: name.trim(), type, format, mode, frequency, recipients, templateId, groupBy, filter, rowCount: scoped.length }); notify(`Report “${name.trim()}” saved — ${formatNumber(scoped.length)} rows.`, 'success'); setName(''); }}>Save report</Button>}
        >
          <div className="stack">
            <div>
              <h3>{name.trim() || template.name}</h3>
              <p className="micro subtle">
                {range} · Grouped by {groupByLabel} · {template.name} · {format}
                {mode === 'recurring' ? ` · ${frequency}` : ' · On demand'}
                {filterLabel && <> · Filtered: {filterLabel}</>}
              </p>
              <p className="micro" style={{ color: scoped.length ? 'var(--c-ink-muted)' : 'var(--c-warning)' }}>
                <strong className="mono">{formatNumber(scoped.length)}</strong> of{' '}
                <strong className="mono">{formatNumber(CASES.length)}</strong> cases in scope
                {scoped.length === 0 && ' — nothing matches, so the preview is empty.'}
              </p>

            </div>

            {preview.showKpis !== false && (
              <div className="grid grid--4">
                {preview.kpis.map((k) => <Kpi key={k.label} label={k.label} value={k.value} spark={k.spark} />)}
              </div>
            )}

            <div className="grid grid--2">
              {preview.panels.map((panel) => <PreviewPanel key={panel.title} panel={panel} />)}

              {/* Anything picked beyond the template's own field set gets its
                  own section, with real values — a field added in a popover and
                  then never shown again is impossible to sanity-check. */}
              {activeExtras.length > 0 && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span className="t-section-label">
                    Custom adds — {activeExtras.length} field{activeExtras.length === 1 ? '' : 's'} beyond this template
                  </span>
                  <div className="row row--tight" style={{ margin: '6px 0 10px' }}>
                    {activeExtras.map((k) => (
                      <span key={k} className="chip chip--added">
                        <Icon name="plus" size={10} />
                        {REPORT_COLUMN_OPTIONAL.find((f) => f.key === k)?.label ?? k}
                      </span>
                    ))}
                  </div>
                  <DataTable
                    columns={[
                      { key: 'id', header: 'Case #', mono: true, fw: 8 },
                      ...activeExtras.map((k) => ({
                        key: k,
                        header: REPORT_COLUMN_OPTIONAL.find((f) => f.key === k)?.label ?? k,
                        fw: 10,
                        cell: (r) => <span className="small">{r[k] == null || r[k] === '' ? '—' : String(r[k])}</span>,
                      })),
                    ]}
                    rows={scoped.slice(0, 5)}
                    rowKey={(r) => r.id}
                    density="fit"
                    empty={<p className="micro subtle">No rows in scope.</p>}
                  />
                  <p className="micro subtle" style={{ marginTop: 6 }}>
                    First 5 of {formatNumber(scoped.length)} rows. These columns are appended to the export.
                  </p>
                </div>
              )}
            </div>

            <div>
              <span className="t-section-label">Cases by period</span>
              <BarChart
                data={byPeriod}
                height={200}
                xLabel="Week"
                yLabel="Cases"
                series={[{ key: 'completed', name: 'Completed' }, { key: 'represented', name: 'Represented' }, { key: 'open', name: 'Open' }]}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function CustomReports() {
  const { notify } = useToast();
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState(SAVED_REPORTS);
  const scheduled = reports.filter((r) => r.schedule?.mode === 'recurring');

  /* The tab is the only scope this screen owns. Name, type, creator, format
     and row count are all columns, so the table's own advanced search covers
     them — a second bespoke filter modal for the same fields was two ways to
     do one thing. */
  const scopedReports = tab === 'scheduled' ? scheduled : reports;

  const columns = [
    { key: 'name', header: 'Name', fw: 14, cell: (r) => <span className="small strong">{r.name}</span> },
    { key: 'type', header: 'Type', fw: 8, cell: (r) => <span className="small" style={{ color: 'var(--c-primary)', fontWeight: 600 }}>{r.type}</span> },
    { key: 'dateCreated', header: 'Date created', fw: 8, cell: (r) => <span className="small">{formatDate(r.dateCreated)}</span> },
    { key: 'createdBy', header: 'Created by', fw: 11, cell: (r) => <TruncatedText value={r.createdBy} className="small mono" /> },
    { key: 'rowCount', header: 'Row count', fw: 6, cell: (r) => <span className="mono small">{formatNumber(r.rowCount)}</span> },
    { key: 'fileSize', header: 'File size', fw: 6, cell: (r) => <span className="mono small">{r.fileSize}</span> },
    ...(tab === 'scheduled' ? [
      { key: 'frequency', header: 'Frequency', fw: 7, align: 'center', cell: (r) => <Badge tone="info">{r.schedule.frequency}</Badge> },
      { key: 'recipients', header: 'Recipients', fw: 12, cell: (r) => <TruncatedText value={r.schedule.recipients.join(', ')} className="micro subtle" /> },
    ] : []),
    {
      key: 'actions', header: 'Actions', pinned: true, fw: 7, width: '86px', align: 'center',
      cell: (r) => (
        <div className="row row--xtight row--nowrap">
          <IconButton icon="play" label="Run now" size={13} onClick={() => notify(`“${r.name}” queued.`, 'success')} />
          <IconButton icon="download" label="Download" size={13} onClick={() => notify('Download started.')} />
          <IconButton icon="trash" label="Delete" tone="danger" size={13} onClick={() => { setReports((p) => p.filter((x) => x.id !== r.id)); notify('Report deleted.', 'success'); }} />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Custom reports"
        description="Build a report from the live book, preview it, and schedule delivery. Scheduling lives in the builder rather than on its own page."
        actions={tab !== 'builder' && <Button variant="primary" icon="plus" onClick={() => setTab('builder')}>Report Builder</Button>}
      />

      <div className="stack stack--tight">
        <Card bodyClassName="card__body--flush">
          <div style={{ padding: '0 var(--s-4)' }}>
            <Tabs
              tabs={TABS.map((t) => ({ ...t, badge: t.value === 'reports' ? reports.length : t.value === 'scheduled' ? scheduled.length : undefined }))}
              value={tab}
              onChange={setTab}
            />
          </div>
        </Card>

        {tab === 'builder' ? (
          <ReportBuilder onSave={(r) => {
            setReports((p) => [...p, {
              ...r, id: `rep${p.length + 1}`, dateCreated: new Date().toISOString(), createdBy: 'you',
              rowCount: r.rowCount ?? CASES.length, fileSize: '—',
              schedule: r.mode === 'recurring' ? { mode: 'recurring', frequency: r.frequency, recipients: r.recipients } : { mode: 'on_demand' },
            }]);
            setTab('reports');
          }} />
        ) : (
          <Card bodyClassName="card__body--flush">
            <DataTable
              tools={{ placeholder: 'Search reports…', exportName: 'reports', onCopied: (ok) => notify(ok ? 'Copied.' : 'Clipboard blocked.', ok ? 'success' : 'danger') }}
              columns={columns}
              rows={scopedReports}
              rowKey={(r) => r.id}
              empty={<EmptyState icon="spreadsheet" title={tab === 'scheduled' ? 'No scheduled reports' : 'No reports yet'} hint="Build a report and set a recurring schedule to see it here." action={<Button variant="primary" onClick={() => setTab('builder')}>Open report builder</Button>} />}
            />
          </Card>
        )}
      </div>
    </>
  );
}

export default CustomReports;
