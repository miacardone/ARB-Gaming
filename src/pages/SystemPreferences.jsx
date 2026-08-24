import { useState } from 'react';
import { PageHeader, Card, Button } from '@/components/ui/Surface';
import { SelectField, TextField, ToggleField } from '@/components/ui/Form';
import { useBrand } from '@/brand/BrandProvider';
import { buildSystemPreferences } from '@/data/admin';
import { ASSIGN_USERS } from '@/data/work-case';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/utils/format';

export function SystemPreferences() {
  const brand = useBrand();
  const { notify } = useToast();
  const [prefs, setPrefs] = useState(() => buildSystemPreferences(brand));

  const set = (patch) => setPrefs((p) => ({ ...p, ...patch }));
  const setNested = (key, patch) => setPrefs((p) => ({ ...p, [key]: { ...p[key], ...patch } }));

  const sampleId = `${prefs.numbering.prefix}${prefs.numbering.separator}${String(prefs.numbering.nextSequence + 1).padStart(prefs.numbering.digits, '0')}`;

  return (
    <>
      <PageHeader
        title="System preferences"
        description="Numbering, currency, internal due-date offsets and the thresholds that drive routing and risk."
        actions={<Button variant="primary" icon="check" onClick={() => notify('System preferences saved.', 'success')}>Save preferences</Button>}
      />

      <div className="stack">
        <div className="grid grid--2">
          <Card title="Case numbering">
            <div className="stack stack--tight">
              <TextField label="Prefix" value={prefs.numbering.prefix} onChange={(e) => setNested('numbering', { prefix: e.target.value.toUpperCase() })} />
              <TextField label="Separator" maxLength={1} value={prefs.numbering.separator} onChange={(e) => setNested('numbering', { separator: e.target.value })} />
              <TextField label="Digits" type="number" min="3" max="10" value={prefs.numbering.digits} onChange={(e) => setNested('numbering', { digits: Number(e.target.value) })} />
              <div className="row row--xtight small">
                <span className="muted">Next case will be</span>
                <code className="code-inline">{sampleId}</code>
              </div>
            </div>
          </Card>

          <Card title="Currency and locale">
            <div className="stack stack--tight">
              <SelectField
                label="Currency"
                value={prefs.currency}
                onChange={(e) => set({ currency: e.target.value })}
                options={brand.preferenceOptions.currencies.map((c) => ({ value: c, label: c }))}
              />
              <SelectField
                label="Locale"
                value={prefs.locale}
                onChange={(e) => set({ locale: e.target.value })}
                options={brand.preferenceOptions.locales.map((l) => ({ value: l, label: l }))}
              />
              <SelectField
                label="Timezone"
                value={prefs.timezone}
                onChange={(e) => set({ timezone: e.target.value })}
                options={brand.preferenceOptions.timezones}
              />
              <p className="micro subtle">
                These apply to new records. Defaults reflect {brand.legalName}’s {brand.hqCity} headquarters. The
                display locale for this session comes from the tenant configuration.
              </p>
            </div>
          </Card>
        </div>

        <Card title="Internal due-date offsets">
          <p className="small muted" style={{ marginBottom: 'var(--s-3)' }}>
            Network windows are fixed by the schemes. The internal buffer is ours — it is what analysts actually work to,
            and it leaves room to fix a rejected submission.
          </p>
          <div className="grid grid--4">
            {brand.schemes.map((s) => (
              <TextField
                key={s.id}
                label={`${s.label} window (days)`}
                type="number"
                min="1"
                value={prefs.dueDateOffsets.schemeDays[s.id]}
                onChange={(e) => setNested('dueDateOffsets', { schemeDays: { ...prefs.dueDateOffsets.schemeDays, [s.id]: Number(e.target.value) } })}
              />
            ))}
            <TextField
              label={`${brand.terms.claimProgram} window (days)`}
              type="number"
              min="1"
              value={prefs.dueDateOffsets.claimDays}
              onChange={(e) => setNested('dueDateOffsets', { claimDays: Number(e.target.value) })}
            />
            <TextField
              label="Internal buffer (days)"
              type="number"
              min="0"
              value={prefs.dueDateOffsets.internalBufferDays}
              onChange={(e) => setNested('dueDateOffsets', { internalBufferDays: Number(e.target.value) })}
              hint="Days before the network deadline that a case is due internally."
            />
          </div>
        </Card>

        <div className="grid grid--2">
          <Card title="Amount thresholds">
            <div className="stack stack--tight">
              <TextField
                label={`Minimum processing amount (${prefs.currency})`}
                type="number"
                min="0"
                step="0.01"
                value={prefs.thresholds.minimumProcessingAmount}
                onChange={(e) => setNested('thresholds', { minimumProcessingAmount: Number(e.target.value) })}
                hint="Below this, defending costs more than the recovery returns."
              />
              <TextField
                label={`Risk amount (${prefs.currency})`}
                type="number"
                min="0"
                value={prefs.thresholds.riskAmount}
                onChange={(e) => setNested('thresholds', { riskAmount: Number(e.target.value) })}
                hint="At or above this, a case is treated as high value for priority and flags."
              />
              <p className="micro subtle">
                Currently flagging anything at or above {formatCurrency(prefs.thresholds.riskAmount, prefs.currency)}.
              </p>
            </div>
          </Card>

          <Card title="Routing">
            <div className="stack stack--tight">
              <ToggleField
                label="Auto-assign on intake"
                description="Route new cases to an analyst automatically where a rule matches."
                checked={prefs.routing.autoAssign}
                onChange={(e) => setNested('routing', { autoAssign: e.target.checked })}
              />
              <TextField
                label={`High-value routing threshold (${prefs.currency})`}
                type="number"
                min="0"
                value={prefs.routing.highValue}
                onChange={(e) => setNested('routing', { highValue: Number(e.target.value) })}
                hint="Above this, cases route to a senior queue regardless of reason code."
              />
              <SelectField
                label="Default reviewer"
                value={prefs.routing.defaultReviewer}
                onChange={(e) => setNested('routing', { defaultReviewer: e.target.value })}
                options={ASSIGN_USERS.map((u) => ({ value: u, label: u }))}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

export default SystemPreferences;
