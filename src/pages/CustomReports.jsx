import { useMemo, useState } from 'react';
import { PageHeader, Card, Toolbar, Tabs, Button, IconButton, Badge, Kpi, EmptyState } from '@/components/ui/Surface';
import { DataTable, ExportButtons } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { SearchBar, SelectField, TextField } from '@/components/ui/Form';
import { BarChart, Donut } from '@/components/charts/Charts';
import { Popover, TruncatedText } from '@/components/ui/Overlay';
import Icon from '@/components/ui/Icon';
import { REPORT_FORMATS, REPORT_TEMPLATES, REPORT_TYPES, SAVED_REPORTS } from '@/data/content';
import { FILTER_OPERATORS, REPORT_FIELDS, applyReportScope, describeFilter, getReportField } from '@/domain/reportFields';
import { CASES } from '@/data/cases';
import {
  caseKpis, caseTypeDonut, disputeOutcomes, dueBucketDonut,
  itemCategoryTotals, outcomeDonut, reasonCategoryTotals, reasonCodeDonut, totalsByQueue,
} from '@/domain/metrics';
import { isClosed } from '@/domain/statuses';
import brand from '@/brand/brand.config';
import { useToast } from '@/context/ToastContext';
import { formatCompactCurrency, formatDate, formatNumber, formatPercent, titleCase } from '@/utils/format';

/**
 * One preview shape per template — the whole point of a template picker is
 * that the picture actually changes, not just the label above it.
 */
function templateView(templateId, scoped, brandTerms) {
  const kpis = caseKpis(scoped);

  if (templateId === 'tpl_reason') {
    const donut = reasonCodeDonut(scoped, brand.schemes[0].id, 5);
    return {
      kpis: [
        { label: 'Disputed amount', value: formatCompactCurrency(kpis.openValue) },
        { label: 'Chargebacks', value: formatNumber(kpis.chargebacks) },
        { label: 'Claims', value: formatNumber(kpis.claims) },
        { label: 'Win rate', value: formatPercent(kpis.winRate, 0) },
      ],
      bar: {
        title: 'By reason category', data: reasonCategoryTotals(scoped),
        series: [{ key: 'count', name: 'Cases' }], xLabel: 'Category', yLabel: 'Cases',
      },
      donut: { title: `By ${brand.schemes[0].label} reason code`, ...donut, centreLabel: brand.schemes[0].label },
    };
  }

  if (templateId === 'tpl_recovery') {
    const closed = scoped.filter((c) => isClosed(c.status));
    const donut = outcomeDonut(scoped);
    return {
      kpis: [
        { label: 'Recovered', value: formatCompactCurrency(kpis.recoveredValue) },
        { label: 'Win rate', value: formatPercent(kpis.winRate, 0) },
        { label: 'Closed cases', value: formatNumber(closed.length) },
        { label: 'Written off', value: formatNumber(closed.filter((c) => c.outcome === 'written_off').length) },
      ],
      bar: {
        title: 'Outcomes per week', data: disputeOutcomes(closed, 6),
        series: [{ key: 'won', name: 'Won' }, { key: 'lost', name: 'Lost' }, { key: 'written_off', name: 'Written off' }],
        xLabel: 'Week', yLabel: 'Cases',
      },
      donut: { title: 'Outcome split', ...donut, centreLabel: 'Closed' },
    };
  }

  if (templateId === 'tpl_marketplace') {
    const donut = caseTypeDonut(scoped);
    const uniqueSellers = new Set(scoped.map((c) => c.sellerId)).size;
    return {
      kpis: [
        { label: `Unique ${brandTerms.sellers}`, value: formatNumber(uniqueSellers) },
        { label: 'Chargebacks', value: formatNumber(kpis.chargebacks) },
        { label: 'Claims', value: formatNumber(kpis.claims) },
        { label: 'Disputed amount', value: formatCompactCurrency(kpis.openValue) },
      ],
      bar: {
        title: `Top ${brandTerms.item} categories`, data: itemCategoryTotals(scoped),
        series: [{ key: 'count', name: 'Cases' }], xLabel: 'Category', yLabel: 'Cases',
      },
      donut: { title: 'Intake path split', ...donut, centreLabel: 'Cases' },
    };
  }

  // tpl_operational (default) — open queue pressure.
  const donut = dueBucketDonut(scoped);
  return {
    kpis: [
      { label: 'Open cases', value: formatNumber(kpis.openCases) },
      { label: 'Overdue', value: formatNumber(kpis.overdueCases) },
      { label: 'Unassigned', value: formatNumber(kpis.unassigned) },
      { label: 'Open value', value: formatCompactCurrency(kpis.openValue) },
    ],
    bar: {
      title: 'Open cases by queue',
      data: totalsByQueue(scoped).filter((q) => q.casesInQueue > 0).map((q) => ({ period: q.label, casesInQueue: q.casesInQueue, overdue: q.overdue })),
      series: [{ key: 'casesInQueue', name: 'In queue' }, { key: 'overdue', name: 'Overdue' }],
      xLabel: 'Queue', yLabel: 'Cases',
    },
    donut: { title: 'Due-date pressure', ...donut, centreLabel: 'Open' },
  };
}

/**
 * Custom reports.
 *
 * Scheduling lives HERE, in the builder, rather than on a Scheduler page — a
 * schedule belongs to a report. Scheduled reports get their own tab in the list.
 */

const TABS = [{ value: 'reports', label: 'Reports' }, { value: 'scheduled', label: 'Scheduled reports' }, { value: 'builder', label: 'Report builder' }];

/**
 * Template card art — a small preview of the CHART SHAPE that template
 * actually produces, not a generic spreadsheet icon repeated four times.
 */
function TemplateGlyph({ id }) {
  if (id === 'tpl_reason') {
    return (
      <svg viewBox="0 0 64 40" width="52" height="34" aria-hidden>
        <circle cx="32" cy="20" r="14" fill="none" stroke="var(--c-primary-tint)" strokeWidth="7" />
        <circle cx="32" cy="20" r="14" fill="none" stroke="var(--c-primary)" strokeWidth="7"
          strokeDasharray="52 88" strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 32 20)" />
        <circle cx="32" cy="20" r="14" fill="none" stroke="var(--c-ink)" strokeOpacity="0.55" strokeWidth="7"
          strokeDasharray="18 88" strokeDashoffset="-52" strokeLinecap="round" transform="rotate(-90 32 20)" />
      </svg>
    );
  }
  if (id === 'tpl_recovery') {
    return (
      <svg viewBox="0 0 64 40" width="52" height="34" aria-hidden>
        <polyline points="6,30 20,24 34,27 48,14 58,10" fill="none" stroke="var(--c-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="58" cy="10" r="3.5" fill="var(--c-primary)" />
        <line x1="6" y1="34" x2="58" y2="34" stroke="var(--c-line-strong)" strokeWidth="1.5" />
      </svg>
    );
  }
  if (id === 'tpl_marketplace') {
    const widths = [40, 28, 34, 18];
    return (
      <svg viewBox="0 0 64 40" width="52" height="34" aria-hidden>
        {widths.map((w, i) => (
          <rect key={i} x="4" y={4 + i * 9} width={w} height="5" rx="2.5" fill={i === 0 ? 'var(--c-primary)' : 'var(--c-primary-tint)'} />
        ))}
      </svg>
    );
  }
  // tpl_operational — vertical bars, ascending queue pressure.
  const heights = [10, 18, 14, 24, 20];
  return (
    <svg viewBox="0 0 64 40" width="52" height="34" aria-hidden>
      {heights.map((h, i) => (
        <rect key={i} x={4 + i * 12} y={34 - h} width="8" height={h} rx="1.5" fill={i === 3 ? 'var(--c-primary)' : 'var(--c-primary-tint)'} />
      ))}
      <line x1="2" y1="34" x2="62" y2="34" stroke="var(--c-line-strong)" strokeWidth="1.5" />
    </svg>
  );
}

/** What each template pulls in by default, and what it leaves out. */
function fieldCoverage(templateId, terms) {
  const seller = titleCase(terms.seller);
  const buyer = titleCase(terms.buyer);
  const item = titleCase(terms.item);
  const order = titleCase(terms.order);

  const table = {
    tpl_operational: {
      included: ['Case #', 'Queue', 'Assigned to', 'Due date', 'Status', 'Disputed amount'],
      optional: ['SLA target', 'Reviewer', 'Assignment reason'],
    },
    tpl_reason: {
      included: ['Reason code', 'Reason category', 'Scheme', 'Case count', 'Disputed amount'],
      optional: ['Dispute cycle', 'Outcome', 'Card type'],
    },
    tpl_recovery: {
      included: ['Entity', 'Outcome', 'Recovered amount', 'Closed date', 'Case #'],
      optional: ['Handling minutes', 'Reviewer', 'Write-off reason'],
    },
    tpl_marketplace: {
      included: [item, 'Category', seller, `${seller} rating`, 'Case type'],
      optional: [buyer, `${order} ID`, terms.deliveryLabel, terms.conditionLabel],
    },
  };

  return table[templateId] ?? { included: [], optional: [] };
}

/** Popout: what a template's export includes, with checkboxes to pull in what's missing. */
function CoveragePanel({ templateId, terms, extra, onToggle, close }) {
  const { included, optional } = fieldCoverage(templateId, terms);

  return (
    <div className="stack stack--tight" style={{ padding: 'var(--s-2)' }}>
      <div>
        <div className="t-section-label">Included by default</div>
        <div className="stack stack--xtight" style={{ marginTop: 4 }}>
          {included.map((f) => (
            <span key={f} className="row row--xtight small">
              <Icon name="check" size={12} style={{ color: 'var(--c-success)' }} /> {f}
            </span>
          ))}
        </div>
      </div>
      {optional.length > 0 && (
        <div>
          <div className="t-section-label">Not included — add if you need it</div>
          <div className="stack stack--xtight" style={{ marginTop: 4 }}>
            {optional.map((f) => (
              <label key={f} className="row row--xtight small" style={{ cursor: 'pointer' }}>
                <input type="checkbox" className="checkbox" checked={extra.includes(f)} onChange={() => onToggle(f)} />
                {f}
              </label>
            ))}
          </div>
        </div>
      )}
      <Button variant="secondary" size="sm" onClick={close}>Done</Button>
    </div>
  );
}

function AdvancedSearchModal({ open, onClose, value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Advanced search"
      size="lg"
      footer={<><Button variant="ghost" onClick={() => onChange({ name: '', type: '', createdBy: '', format: '', minRows: '', maxRows: '' })}>Reset</Button><Button variant="primary" onClick={onClose}>Apply</Button></>}
    >
      <div className="grid grid--3">
        <TextField label="Name" value={value.name} onChange={(e) => set({ name: e.target.value })} />
        <SelectField label="Type" value={value.type} onChange={(e) => set({ type: e.target.value })} placeholder="Any type" options={REPORT_TYPES.map((t) => ({ value: t, label: t }))} />
        <TextField label="Created by" value={value.createdBy} onChange={(e) => set({ createdBy: e.target.value })} />
        <SelectField label="Format" value={value.format} onChange={(e) => set({ format: e.target.value })} placeholder="Any format" options={REPORT_FORMATS.map((f) => ({ value: f, label: f }))} />
        <TextField label="Row count min" type="number" value={value.minRows} onChange={(e) => set({ minRows: e.target.value })} />
        <TextField label="Row count max" type="number" value={value.maxRows} onChange={(e) => set({ maxRows: e.target.value })} />
      </div>
    </Modal>
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
  /* Per-template so switching templates doesn't carry one template's extra
     fields onto another where they may not even apply. */
  const [extraFields, setExtraFields] = useState({});
  const toggleExtraField = (tplId, field) => setExtraFields((p) => {
    const current = p[tplId] ?? [];
    return { ...p, [tplId]: current.includes(field) ? current.filter((f) => f !== field) : [...current, field] };
  });

  const template = REPORT_TEMPLATES.find((t) => t.id === templateId);

  /* The preview is computed from the SCOPED set, not the whole book — the
     point of a builder is seeing the effect before you schedule it. Every
     template reads that same scope through its OWN lens, so picking a
     different template changes what the preview actually shows. */
  const scoped = useMemo(() => applyReportScope(CASES, { start, end, filter }), [start, end, filter]);
  const view = useMemo(() => templateView(templateId, scoped, brand.terms), [templateId, scoped]);

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
            {REPORT_TEMPLATES.map((t) => (
              <div key={t.id} className={`tile ${templateId === t.id ? 'is-selected' : ''}`.trim()}>
                <button type="button" className="tile__hit" onClick={() => { setTemplateId(t.id); setType(t.type); setGroupBy(t.groupBy); }}>
                  <span className="tile__preview"><TemplateGlyph id={t.id} /></span>
                  <span className="small strong">{t.name}</span>
                  <span className="micro subtle">{t.description}</span>
                  {templateId === t.id && <Badge tone="primary">Selected</Badge>}
                  {(extraFields[t.id]?.length ?? 0) > 0 && <Badge tone="info">+{extraFields[t.id].length} field{extraFields[t.id].length > 1 ? 's' : ''}</Badge>}
                </button>
                <Popover
                  className="tile__coverage-btn"
                  align="right"
                  width={230}
                  trigger={({ toggle }) => (
                    <IconButton icon="info" label={`What ${t.name} includes`} size={13} onClick={toggle} />
                  )}
                >
                  {({ close }) => (
                    <CoveragePanel
                      templateId={t.id}
                      terms={brand.terms}
                      extra={extraFields[t.id] ?? []}
                      onToggle={(field) => toggleExtraField(t.id, field)}
                      close={close}
                    />
                  )}
                </Popover>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Report preview"
          action={<Button variant="primary" icon="check" disabled={!name.trim()} onClick={() => { onSave({ name: name.trim(), type, format, mode, frequency, recipients, templateId, groupBy, filter, extraFields: extraFields[templateId] ?? [], rowCount: scoped.length }); notify(`Report “${name.trim()}” saved — ${formatNumber(scoped.length)} rows.`, 'success'); setName(''); }}>Save report</Button>}
        >
          <div className="stack">
            <div>
              <h3>{name.trim() || template.name}</h3>
              <p className="micro subtle">
                {range} · Grouped by {groupByLabel} · {template.name} · {format}
                {mode === 'recurring' ? ` · ${frequency}` : ' · On demand'}
                {filterLabel && <> · Filtered: {filterLabel}</>}
                {(extraFields[templateId]?.length ?? 0) > 0 && <> · + {extraFields[templateId].join(', ')}</>}
              </p>
              <p className="micro" style={{ color: scoped.length ? 'var(--c-ink-muted)' : 'var(--c-warning)' }}>
                <strong className="mono">{formatNumber(scoped.length)}</strong> of{' '}
                <strong className="mono">{formatNumber(CASES.length)}</strong> cases in scope
                {scoped.length === 0 && ' — nothing matches, so the preview is empty.'}
              </p>
            </div>

            <div className="grid grid--4">
              {view.kpis.map((k) => <Kpi key={k.label} label={k.label} value={k.value} />)}
            </div>

            <div className="grid grid--2">
              <div>
                <span className="t-section-label">{view.bar.title}</span>
                {view.bar.data.length ? (
                  <BarChart
                    data={view.bar.data}
                    height={220}
                    xLabel={view.bar.xLabel}
                    yLabel={view.bar.yLabel}
                    series={view.bar.series}
                  />
                ) : (
                  <p className="small subtle" style={{ padding: 'var(--s-4) 0' }}>Nothing in scope for this view.</p>
                )}
              </div>
              <div>
                <span className="t-section-label">{view.donut.title}</span>
                {view.donut.slices.length ? (
                  <Donut data={view.donut.slices} centreValue={formatNumber(view.donut.total)} centreLabel={view.donut.centreLabel} size={170} />
                ) : (
                  <p className="small subtle" style={{ padding: 'var(--s-4) 0' }}>Nothing in scope for this view.</p>
                )}
              </div>
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
  const [search, setSearch] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [criteria, setCriteria] = useState({ name: '', type: '', createdBy: '', format: '', minRows: '', maxRows: '' });

  const scheduled = reports.filter((r) => r.schedule?.mode === 'recurring');
  const source = tab === 'scheduled' ? scheduled : reports;

  const filtered = source.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (criteria.name && !r.name.toLowerCase().includes(criteria.name.toLowerCase())) return false;
    if (criteria.type && r.type !== criteria.type) return false;
    if (criteria.createdBy && !r.createdBy.includes(criteria.createdBy)) return false;
    if (criteria.format && r.format !== criteria.format) return false;
    if (criteria.minRows && r.rowCount < Number(criteria.minRows)) return false;
    if (criteria.maxRows && r.rowCount > Number(criteria.maxRows)) return false;
    return true;
  });

  const columns = [
    { key: 'name', header: 'Name', fw: 14, cell: (r) => <span className="small strong">{r.name}</span> },
    { key: 'type', header: 'Type', fw: 8, cell: (r) => <span className="small" style={{ color: 'var(--c-primary)', fontWeight: 600 }}>{r.type}</span> },
    { key: 'dateCreated', header: 'Date created', fw: 8, cell: (r) => <span className="small">{formatDate(r.dateCreated)}</span> },
    { key: 'createdBy', header: 'Created by', fw: 11, cell: (r) => <TruncatedText value={r.createdBy} className="small mono" /> },
    { key: 'rowCount', header: 'Row count', fw: 6, align: 'right', cell: (r) => <span className="mono small">{formatNumber(r.rowCount)}</span> },
    { key: 'fileSize', header: 'File size', fw: 6, align: 'right', cell: (r) => <span className="mono small">{r.fileSize}</span> },
    ...(tab === 'scheduled' ? [
      { key: 'frequency', header: 'Frequency', fw: 7, cell: (r) => <Badge tone="info">{r.schedule.frequency}</Badge> },
      { key: 'recipients', header: 'Recipients', fw: 12, cell: (r) => <TruncatedText value={r.schedule.recipients.join(', ')} className="micro subtle" /> },
    ] : []),
    {
      key: 'actions', header: 'Actions', fw: 7, width: '86px',
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
            <Toolbar>
              <SearchBar value={search} onChange={setSearch} placeholder="Search reports…" onAdvanced={() => setAdvanced(true)} advancedCount={Object.values(criteria).filter(Boolean).length} />
              <ExportButtons columns={columns.filter((c) => c.key !== 'actions')} rows={filtered} name="reports" onCopied={(ok) => notify(ok ? 'Copied.' : 'Clipboard blocked.', ok ? 'success' : 'danger')} />
            </Toolbar>
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(r) => r.id}
              empty={<EmptyState icon="spreadsheet" title={tab === 'scheduled' ? 'No scheduled reports' : 'No reports yet'} hint="Build a report and set a recurring schedule to see it here." action={<Button variant="primary" onClick={() => setTab('builder')}>Open report builder</Button>} />}
            />
          </Card>
        )}
      </div>

      <AdvancedSearchModal open={advanced} onClose={() => setAdvanced(false)} value={criteria} onChange={setCriteria} />
    </>
  );
}

export default CustomReports;
