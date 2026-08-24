import { useMemo, useState } from 'react';
import Icon from '@/components/ui/Icon';
import { Badge, Button } from '@/components/ui/Surface';
import { SelectField, TextAreaField, TextField } from '@/components/ui/Form';
import { Tooltip } from '@/components/ui/Overlay';
import { useBrand } from '@/brand/BrandProvider';
import { RESOLUTIONS } from '@/domain/statuses';
import { blockedActions, ENTITY_TEMPLATES, INTERMEMBER_MESSAGES, REPRESENTMENT_REASONS, WRITE_OFF_REASONS } from '@/data/work-case';
import { formatCurrency } from '@/utils/format';

/**
 * Actions card — four square tiles, each replacing the card with its form.
 *
 * GATING IS THE POINT. A blocking special instruction disables the matching
 * tile and explains why on hover. The reference rendered its instruction card
 * beside four permanently-enabled buttons, which is theatre: a card that says
 * "do not write off" next to an enabled Write Off button tells the analyst
 * nothing they can act on. Both read from the same source in data/work-case.
 */

function Field({ label, required, children, span }) {
  return (
    <div className="field" style={span ? { gridColumn: '1 / -1' } : undefined}>
      <span className="field__label">{label}{required && <span className="field__req">*</span>}</span>
      {children}
    </div>
  );
}

function RepresentmentForm({ c, onSubmit }) {
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('full');
  const [amount, setAmount] = useState(String(c.disputeAmount));

  const valid = reason && message.trim() && Number(amount) > 0;

  return (
    <div className="stack stack--tight">
      <SelectField label="Representment Reason" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Select a reason…" options={REPRESENTMENT_REASONS.map((r) => ({ value: r, label: r }))} />
      <SelectField label="Intermember Message" required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Select a message…" options={INTERMEMBER_MESSAGES.map((m) => ({ value: m, label: m }))} />

      <button type="button" className="accordion__head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Payment Brand / Scheme Questionnaire
        <Icon name="chevron" size={13} className={`accordion__chevron ${open ? 'is-open' : ''}`.trim()} />
      </button>

      {open && (
        <div className="stack stack--tight" style={{ padding: '0 0 var(--s-2)' }}>
          <span className="t-section-label">Second presentment information</span>
          <Field label="Chargeback amount" required>
            <div className="row row--xtight row--nowrap">
              <span className="micro subtle mono">{c.currency}</span>
              <input className="input" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={mode === 'full'} />
            </div>
          </Field>
          <div className="seg">
            <button type="button" className={`seg__btn ${mode === 'full' ? 'is-active' : ''}`.trim()} onClick={() => { setMode('full'); setAmount(String(c.disputeAmount)); }}>Full</button>
            <button type="button" className={`seg__btn ${mode === 'partial' ? 'is-active' : ''}`.trim()} onClick={() => setMode('partial')}>Partial</button>
          </div>
          <span className="micro subtle">Case amount is {formatCurrency(c.disputeAmount, c.currency)}.</span>
        </div>
      )}

      <Button variant="primary" block disabled={!valid} onClick={() => onSubmit('representment', `Representment submitted for ${formatCurrency(Number(amount), c.currency)}.`)}>
        Submit Dispute
      </Button>
    </div>
  );
}

function WriteOffForm({ c, onSubmit }) {
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const valid = reason && note.trim();

  return (
    <div className="stack stack--tight">
      <SelectField label="Write Off Reason" required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Select a reason…" options={WRITE_OFF_REASONS.map((r) => ({ value: r, label: r }))} />
      <TextAreaField label="Write Off Note" required rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Explain the write-off decision…" />
      <Button variant="primary" block disabled={!valid} onClick={() => onSubmit('write_off', `Case written off — ${formatCurrency(c.disputeAmount, c.currency)}.`)}>
        Submit Dispute
      </Button>
    </div>
  );
}

function ChargeEntityForm({ onSubmit }) {
  const [template, setTemplate] = useState('');
  const [enclosure, setEnclosure] = useState(false);
  const [touched, setTouched] = useState(false);

  return (
    <div className="stack stack--tight">
      <SelectField
        label="Template"
        required
        value={template}
        onChange={(e) => { setTemplate(e.target.value); setTouched(true); }}
        onBlur={() => setTouched(true)}
        placeholder="Select a template…"
        options={ENTITY_TEMPLATES.map((t) => ({ value: t, label: t }))}
        error={touched && !template ? 'A template is required.' : undefined}
      />
      <label className="row row--xtight" style={{ cursor: 'pointer' }}>
        <input type="checkbox" className="checkbox" checked={enclosure} onChange={(e) => setEnclosure(e.target.checked)} />
        <span className="small">Show Enclosure</span>
      </label>
      <Button variant="primary" block disabled={!template} onClick={() => onSubmit('charge_entity', 'Charged to entity.')}>
        Submit Dispute
      </Button>
    </div>
  );
}

/**
 * Split case. The three parts must sum to the case amount; the remainder is
 * shown live and Submit stays disabled until it is zero.
 */
function SplitCaseForm({ c, onSubmit }) {
  const [entity, setEntity] = useState('');
  const [writeOff, setWriteOff] = useState('');
  const [defence, setDefence] = useState('');

  const sum = (Number(entity) || 0) + (Number(writeOff) || 0) + (Number(defence) || 0);
  const remainder = Math.round((c.disputeAmount - sum) * 100) / 100;
  const balanced = Math.abs(remainder) < 0.005 && sum > 0;

  const money = (label, value, onChange) => (
    <Field label={label} required>
      <div className="row row--xtight row--nowrap">
        <span className="micro subtle mono">{c.currency}</span>
        <input className="input" type="number" min="0" step="0.01" value={value} onChange={(e) => onChange(e.target.value)} placeholder="0.00" />
      </div>
    </Field>
  );

  return (
    <div className="stack stack--tight">
      <div className="row row--between small">
        <span className="muted">Case amount</span>
        <span className="mono strong">{formatCurrency(c.disputeAmount, c.currency)}</span>
      </div>

      {money('Charge to Entity', entity, setEntity)}
      {money('Write-Off', writeOff, setWriteOff)}
      {money('Representment-Defence', defence, setDefence)}

      <div
        className="row row--between small"
        style={{
          padding: 'var(--s-2)',
          borderRadius: 'var(--r-md)',
          background: balanced ? 'var(--c-success-tint)' : 'var(--c-warning-tint)',
          color: balanced ? 'var(--c-success)' : 'var(--c-warning)',
        }}
      >
        <span className="strong">{balanced ? 'Balanced' : 'Remaining to allocate'}</span>
        <span className="mono strong">{formatCurrency(remainder, c.currency)}</span>
      </div>

      <Button variant="primary" block disabled={!balanced} onClick={() => onSubmit('split_case', 'Case split and submitted.')}>
        Submit Dispute
      </Button>
    </div>
  );
}

export function ActionsCard({ c, onSubmit }) {
  const brand = useBrand();
  const [active, setActive] = useState(null);
  const blocked = useMemo(() => blockedActions(c.id), [c.id]);

  if (active) {
    const spec = RESOLUTIONS.find((r) => r.id === active);
    return (
      <div className="stack stack--tight">
        <div className="row row--tight">
          <button type="button" className="icon-btn" onClick={() => setActive(null)} aria-label="Back to actions">
            <Icon name="arrowLeft" size={15} />
          </button>
          <span className="small strong">{spec.label}</span>
        </div>

        {active === 'representment' && <RepresentmentForm c={c} onSubmit={onSubmit} />}
        {active === 'write_off' && <WriteOffForm c={c} onSubmit={onSubmit} />}
        {active === 'charge_entity' && <ChargeEntityForm onSubmit={onSubmit} />}
        {active === 'split_case' && <SplitCaseForm c={c} onSubmit={onSubmit} />}
      </div>
    );
  }

  return (
    <div className="stack stack--tight">
      <div className="action-tiles">
        {RESOLUTIONS.map((r) => {
          const block = blocked.get(r.id);
          const tile = (
            <button
              key={r.id}
              type="button"
              className="action-tile"
              disabled={Boolean(block)}
              onClick={() => setActive(r.id)}
            >
              <Icon name={r.icon} size={20} className="action-tile__icon" />
              {r.label}
              {block && <Icon name="lock" size={11} className="subtle" />}
            </button>
          );

          return block ? (
            <Tooltip
              key={r.id}
              label={<><span className="tooltip__title">{block.title}</span>{block.text}</>}
              wide
            >
              {tile}
            </Tooltip>
          ) : tile;
        })}
      </div>

      {blocked.size > 0 && (
        <p className="micro subtle row row--xtight">
          <Icon name="info" size={11} />
          {blocked.size === 1 ? 'One action is' : `${blocked.size} actions are`} blocked by a special instruction.
        </p>
      )}

      <p className="micro subtle">
        Case amount {formatCurrency(c.disputeAmount, c.currency)} · {brand.terms.entity} {c.entityLabel}
      </p>
    </div>
  );
}

export default ActionsCard;
