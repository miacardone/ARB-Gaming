import { useMemo } from 'react';
import { PageHeader, Card } from '@/components/ui/Surface';
import { BarChart, AreaChart } from '@/components/charts/Charts';
import { DataTable } from '@/components/ui/DataTable';
import { CASES } from '@/data/cases';
import { DUE_BUCKETS, casesByDueDatePerWeek, entityTotalsByDueDate, newCasesPerDay, reasonCategoryByDueDate } from '@/domain/metrics';
import { useBrand } from '@/brand/BrandProvider';
import { formatNumber } from '@/utils/format';

/** Every chart here carries axis titles — the brief calls for them explicitly. */
export function ReportsCenter() {
  const brand = useBrand();

  const byWeek = useMemo(() => casesByDueDatePerWeek(CASES), []);
  const daily = useMemo(() => newCasesPerDay(CASES, 28), []);
  const byEntity = useMemo(() => entityTotalsByDueDate(CASES), []);
  const byCategory = useMemo(() => reasonCategoryByDueDate(CASES), []);

  const columns = [
    { key: 'description', header: 'Description', fw: 14, cell: (r) => <span className="small strong">{r.description}</span> },
    ...DUE_BUCKETS.map((b) => ({
      key: b.id,
      header: b.label,
      fw: 7,
      align: 'right',
      cell: (r) => (
        <span className="mono small" style={b.id === 'pastDue' && r[b.id] > 0 ? { color: 'var(--c-danger)' } : undefined}>
          {formatNumber(r[b.id])}
        </span>
      ),
    })),
    { key: 'total', header: 'Total', fw: 7, align: 'right', cell: (r) => <span className="mono small strong">{formatNumber(r.total)}</span> },
  ];

  return (
    <>
      <PageHeader title="Reports center" description="Where deadline pressure sits, and why the disputes were raised." />

      <div className="stack">
        <div className="grid grid--2">
          <Card title="Cases by Due Date Per Week" bodyClassName="card__body--chart">
            <BarChart
              data={byWeek}
              xLabel="Week due"
              yLabel="Open cases"
              series={[{ key: 'chargeback', name: brand.terms.chargebacks }, { key: 'claim', name: brand.terms.claims }]}
              height={220}
            />
          </Card>

          <Card title="New Cases Per Day" bodyClassName="card__body--chart">
            <AreaChart data={daily} xLabel="Day" yLabel="New cases" height={220} />
          </Card>
        </div>

        <Card title="Entity Case Totals by Due Date" bodyClassName="card__body--chart">
          <BarChart
            data={byEntity}
            xLabel="Entity"
            yLabel="Open cases"
            /* Seven ordered buckets against a five-step ramp would cycle
               colors. Mapping them as an urgency ramp instead — contrast for
               past due, the teal steps through the near dates, neutral for the
               residual 5+ — keeps every series distinct and reads as a scale. */
            series={DUE_BUCKETS.map((b, i) => ({
              key: b.id,
              name: b.label,
              color: b.id === 'pastDue' ? 'var(--c-series-contrast)'
                : b.id === 'd5plus' ? 'var(--c-series-neutral)'
                  : `var(--c-series-${i - 1})`,
            }))}
            height={220}
          />
        </Card>

        <Card title="Case Totals by Reason Category & Due Date" bodyClassName="card__body--flush">
          <DataTable columns={columns} rows={byCategory} rowKey={(r) => r.id} />
        </Card>
      </div>
    </>
  );
}

export default ReportsCenter;
