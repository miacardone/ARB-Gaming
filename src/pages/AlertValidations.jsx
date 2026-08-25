import { useMemo, useState } from 'react';
import { PageHeader, Card, Badge } from '@/components/ui/Surface';
import { DataTable } from '@/components/ui/DataTable';
import { SelectField } from '@/components/ui/Form';
import { VALIDATIONS } from '@/data/alerts';
import brand from '@/brand/brand.config';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDateTime } from '@/utils/format';

/**
 * Alert validations.
 *
 * A read-only log of Order Insight-style transaction checks that run
 * before an alert or dispute exists — confirming the transaction data an
 * issuer sees actually matches the operator's own record of it. Nothing here
 * is a decision an agent makes, so there's no action column: it's a
 * reference feed, not a queue.
 */

export function AlertValidations() {
  const { notify } = useToast();
  const [entityFilter, setEntityFilter] = useState('');

  /* Entity is a SCOPE filter — it decides which rows the table is even about,
     so it stays here. Free-text search belongs to the table, which already
     searches every visible column. */
  const scoped = useMemo(
    () => VALIDATIONS.filter((v) => !entityFilter || v.entityId === entityFilter),
    [entityFilter],
  );

  const columns = [
    { key: 'id', header: 'Validation ID', fw: 8, cell: (r) => <span className="mono strong nowrap">{r.id}</span> },
    { key: 'entityLabel', header: 'Entity', fw: 9 },
    { key: 'source', header: 'Source', fw: 7, cell: (r) => <Badge tone="neutral">{r.source}</Badge> },
    { key: 'amount', header: 'Amount', fw: 6, align: 'right', cell: (r) => <span className="mono small">{formatCurrency(r.amount, r.currency)}</span> },
    { key: 'panMasked', header: 'Card number', fw: 9, cell: (r) => <span className="mono small">{r.panMasked}</span> },
    { key: 'ccType', header: 'Card type', fw: 6, cell: (r) => <Badge tone={r.ccType === 'Visa' ? 'info' : 'warning'}>{r.ccType}</Badge> },
    { key: 'descriptor', header: 'Descriptor', fw: 10, cell: (r) => <span className="mono small">{r.descriptor}</span> },
    { key: 'mid', header: 'MID', fw: 8, cell: (r) => <span className="mono small">{r.mid}</span> },
    { key: 'validatedAt', header: 'Validated at', fw: 9, cell: (r) => <span className="small">{formatDateTime(r.validatedAt)}</span> },
    { key: 'arn', header: 'ARN', fw: 10, cell: (r) => <span className="mono small">{r.arn}</span> },
    { key: 'outcome', header: 'Outcome', fw: 6, cell: (r) => <Badge tone="success" dot>{r.outcome}</Badge> },
  ];

  return (
    <>
      <PageHeader title="Alert validations" description="Transaction checks run before an alert or dispute exists — a reference feed, not a queue." />

      <Card bodyClassName="card__body--flush">
        <DataTable
          tools={{
            placeholder: 'Search validation ID, descriptor, ARN, MID…',
            filters: (
              <SelectField
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                placeholder="All entities"
                options={brand.entities.map((e) => ({ value: e.id, label: e.label }))}
              />
            ),
            exportName: 'validations',
            onCopied: (ok) => notify(ok ? 'Copied.' : 'Clipboard blocked.', ok ? 'success' : 'danger'),
          }}
          columns={columns}
          rows={scoped}
          rowKey={(r) => r.id}
        />
      </Card>
    </>
  );
}

export default AlertValidations;
