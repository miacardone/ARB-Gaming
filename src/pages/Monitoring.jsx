import { useMemo, useState } from 'react';
import { PageHeader, Card, Badge } from '@/components/ui/Surface';
import { BarChart } from '@/components/charts/Charts';
import { DataTable } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/Form';
import { CASES } from '@/data/cases';
import { ERROR_TYPES, disputeOutcomes, documentProcessing, errorHandling } from '@/domain/metrics';
import { formatNumber, formatPercent } from '@/utils/format';

/** Chart plus the numbers behind it — a stacked bar alone is not auditable. */
function Section({ title, data, series, totalsLabel, children, xLabel, yLabel }) {
  const totals = series.map((s) => ({ ...s, total: data.reduce((sum, row) => sum + (row[s.key] ?? 0), 0) }));
  const grand = totals.reduce((sum, s) => sum + s.total, 0);

  const columns = [
    { key: 'label', header: totalsLabel, fw: 12, cell: (r) => <span className="row row--xtight"><span className="legend__swatch" style={{ background: r.color }} /><span className="small strong">{r.name}</span></span> },
    ...data.map((row) => ({ key: row.period, header: row.period, fw: 6, align: 'right', cell: (r) => <span className="mono small">{formatNumber(row[r.key] ?? 0)}</span> })),
    { key: 'total', header: 'Total', fw: 6, align: 'right', cell: (r) => <span className="mono small strong">{formatNumber(r.total)}</span> },
    { key: 'share', header: 'Share', fw: 6, align: 'right', cell: (r) => <span className="mono small subtle">{formatPercent(grand ? (r.total / grand) * 100 : 0, 1)}</span> },
  ];

  return (
    <Card title={title} bodyClassName="card__body--chart">
      <BarChart data={data} series={series} xLabel={xLabel} yLabel={yLabel} height={200} />
      <div style={{ marginTop: 'var(--s-3)' }}>
        <DataTable columns={columns} rows={totals} rowKey={(r) => r.key} density="fit" />
      </div>
      {children}
    </Card>
  );
}

export function Monitoring() {
  const [weeks, setWeeks] = useState(8);

  const docs = useMemo(() => documentProcessing(CASES, weeks), [weeks]);
  const outcomes = useMemo(() => disputeOutcomes(CASES, weeks), [weeks]);
  const errors = useMemo(() => errorHandling(CASES, weeks), [weeks]);

  return (
    <>
      <PageHeader
        title="Monitoring"
        description="Document processing, dispute outcomes and integration errors."
        actions={
          <SelectField
            value={weeks}
            onChange={(e) => setWeeks(Number(e.target.value))}
            options={[{ value: 4, label: 'Last 4 weeks' }, { value: 8, label: 'Last 8 weeks' }, { value: 12, label: 'Last 12 weeks' }]}
          />
        }
      />

      <div className="stack">
        <Section
          title="Case and document processing"
          data={docs}
          xLabel="Week"
          yLabel="Documents"
          totalsLabel="Processing state"
          series={[
            { key: 'received', name: 'Received', color: 'var(--c-success)' },
            { key: 'pending', name: 'Pending', color: 'var(--c-warning)' },
            { key: 'missing', name: 'Missing', color: 'var(--c-danger)' },
          ]}
        />

        <Section
          title="Dispute outcomes"
          data={outcomes}
          xLabel="Week"
          yLabel="Cases"
          totalsLabel="Outcome"
          series={[
            { key: 'won', name: 'Won', color: 'var(--c-success)' },
            { key: 'lost', name: 'Lost', color: 'var(--c-danger)' },
            { key: 'written_off', name: 'Written off', color: 'var(--c-series-neutral)' },
          ]}
        />

        <Section
          title="Error handling by response type"
          data={errors}
          xLabel="Week"
          yLabel="Errors"
          totalsLabel="Error type"
          series={ERROR_TYPES.map((t, i) => ({ key: t.id, name: t.label, color: `var(--c-series-${i})` }))}
        >
          <div className="stack stack--xtight" style={{ marginTop: 'var(--s-4)' }}>
            <span className="t-section-label">How each error is handled</span>
            {ERROR_TYPES.map((t) => (
              <div key={t.id} className="row row--xtight">
                <Badge tone="neutral">{t.http}</Badge>
                <span className="small strong">{t.label}</span>
                <span className="small muted">— {t.remedy}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}

export default Monitoring;
