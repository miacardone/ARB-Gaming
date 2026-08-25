import { useMemo } from 'react';
import { PageHeader, Card, Kpi } from '@/components/ui/Surface';
import { BarChart, AreaChart, BarRows, LineChart, DotPlot, Donut } from '@/components/charts/Charts';
import { DataTable } from '@/components/ui/DataTable';
import { CASES } from '@/data/cases';
import {
  DUE_BUCKETS, avgAmountByEntity, casesByDueDatePerWeek, disputedValueTrend, disputeOutcomes,
  entityTotalsByDueDate, newCasesPerDay, reasonCategoryByDueDate, topSellersByVolume, totalsByMarket, weeklySeries,
} from '@/domain/metrics';
import { useBrand } from '@/brand/BrandProvider';
import { formatCompactCurrency, formatNumber } from '@/utils/format';

/** Every chart here carries axis titles — the brief calls for them explicitly. */
export function ReportsCenter() {
  const brand = useBrand();

  const byWeek = useMemo(() => casesByDueDatePerWeek(CASES), []);
  const daily = useMemo(() => newCasesPerDay(CASES, 28), []);
  const byEntity = useMemo(() => entityTotalsByDueDate(CASES), []);
  const byCategory = useMemo(() => reasonCategoryByDueDate(CASES), []);
  const topSellers = useMemo(() => topSellersByVolume(CASES, 8), []);
  const valueTrend = useMemo(() => disputedValueTrend(CASES, 10), []);
  const byMarket = useMemo(() => totalsByMarket(CASES), []);
  const avgByEntity = useMemo(() => avgAmountByEntity(CASES), []);
  const topMarket = byMarket[0];

  /* Each KPI gets its own six-week series, derived from the same book — a
     headline number with no shape behind it is the least useful tile on the
     page. "Markets active" counts DISTINCT markets per week, so it needs its
     own reducer rather than weeklySeries. */
  const topMarketSpark = useMemo(
    () => weeklySeries(CASES, 6, () => 1, (c) => c.market === topMarket?.market),
    [topMarket],
  );
  const topSellerSpark = useMemo(
    () => weeklySeries(CASES, 6, () => 1, (c) => c.seller === topSellers[0]?.label),
    [topSellers],
  );
  const marketsActiveSpark = useMemo(() => {
    const DAY = 86_400_000;
    const now = Date.now();
    return Array.from({ length: 6 }, (_, i) => {
      const end = now - (5 - i) * 7 * DAY;
      const seen = new Set(
        CASES.filter((c) => {
          const t = new Date(c.dateCreated).getTime();
          return t >= end - 7 * DAY && t < end;
        }).map((c) => c.market),
      );
      return seen.size;
    });
  }, []);
  const outcomes = useMemo(() => disputeOutcomes(CASES, 10), []);
  const outcomeTotals = useMemo(() => {
    const totals = outcomes.reduce((s, w) => ({ won: s.won + w.won, lost: s.lost + w.lost, written_off: s.written_off + w.written_off }), { won: 0, lost: 0, written_off: 0 });
    return [
      { label: 'Won', value: totals.won, color: 'var(--c-duo-0)' },
      { label: 'Lost', value: totals.lost, color: 'var(--c-duo-1)' },
      { label: 'Written off', value: totals.written_off, color: 'var(--c-series-neutral)' },
    ];
  }, [outcomes]);

  const columns = [
    { key: 'description', header: 'Description', fw: 14, cell: (r) => <span className="small strong">{r.description}</span> },
    ...DUE_BUCKETS.map((b) => ({
      key: b.id,
      header: b.label,
      fw: 7,
      cell: (r) => (
        <span className="mono small" style={b.id === 'pastDue' && r[b.id] > 0 ? { color: 'var(--c-danger)' } : undefined}>
          {formatNumber(r[b.id])}
        </span>
      ),
    })),
    { key: 'total', header: 'Total', fw: 7, cell: (r) => <span className="mono small strong">{formatNumber(r.total)}</span> },
  ];

  return (
    <>
      <PageHeader title="Reports center" description="Where deadline pressure sits, and why the disputes were raised." />

      <div className="stack">
        <div className="grid grid--4" style={{ gap: 'var(--s-3)' }}>
          <Kpi label="Total disputed value" value={formatCompactCurrency(CASES.reduce((s, c) => s + c.disputeAmount, 0))} spark={valueTrend.map((t) => t.disputed)} />
          <Kpi label="Top market" value={topMarket?.market ?? '—'} meta={topMarket ? `${formatNumber(topMarket.count)} cases` : undefined} spark={topMarketSpark} />
          <Kpi label={`Top ${brand.terms.seller}`} value={topSellers[0]?.label ?? '—'} meta={topSellers[0] ? `${formatNumber(topSellers[0].value)} cases` : undefined} spark={topSellerSpark} />
          <Kpi label="Markets active" value={formatNumber(byMarket.length)} meta="states with open volume" spark={marketsActiveSpark} />
        </div>

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
              color: b.id === 'pastDue' ? 'var(--c-nav-active)'
                : b.id === 'd5plus' ? 'var(--c-series-neutral)'
                  : `var(--c-series-${i - 1})`,
            }))}
            height={220}
          />
        </Card>

        <Card title="Case Totals by Reason Category & Due Date" bodyClassName="card__body--flush">
          <DataTable tools columns={columns} rows={byCategory} rowKey={(r) => r.id} />
        </Card>

        <Card title={`Top ${brand.terms.seller}s by Dispute Volume`}>
          <BarRows rows={topSellers} />
        </Card>

        <div className="grid grid--2">
          <Card title="Disputed Value Trend" bodyClassName="card__body--chart">
            <LineChart data={valueTrend} height={220} xLabel="Week" yLabel="Disputed value" formatValue={formatCompactCurrency} series={[{ key: 'disputed', name: 'Disputed value' }]} />
          </Card>
          <Card title="Outcome Mix — Last 10 Weeks" bodyClassName="card__body--chart card__body--pie-row">
            <Donut data={outcomeTotals} size={190} legend />
          </Card>
        </div>

        <Card title="Cases by Market" description="Case volume by US state. ARB is US-only, so the market axis is a state, not a country." bodyClassName="card__body--chart">
          <DotPlot data={byMarket} xKey="market" valueKey="count" height={260} yLabel="Cases" />
        </Card>

        <Card title="Average Disputed Amount by Entity" bodyClassName="card__body--chart">
          <DotPlot data={avgByEntity} yLabel="Avg. amount (USD)" formatValue={formatCompactCurrency} />
        </Card>
      </div>
    </>
  );
}

export default ReportsCenter;
