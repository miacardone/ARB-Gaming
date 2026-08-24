import Icon from '@/components/ui/Icon';
import { Tooltip } from '@/components/ui/Overlay';

/* ---------- Button ---------- */

export function Button({ variant = 'secondary', size, block, icon, iconAfter, as: Tag = 'button', className = '', children, ...rest }) {
  const classes = ['btn', `btn--${variant}`, size ? `btn--${size}` : '', block ? 'btn--block' : '', !children ? 'btn--icon' : '', className]
    .filter(Boolean).join(' ');

  return (
    <Tag className={classes} {...(Tag === 'button' ? { type: rest.type ?? 'button' } : {})} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 12 : 14} />}
      {children}
      {iconAfter && <Icon name={iconAfter} size={size === 'sm' ? 12 : 14} />}
    </Tag>
  );
}

/** Icon-only button. Always tooltipped — an icon with no label is a guess. */
export function IconButton({ icon, label, tone, size = 15, onClick, disabled, className = '', ...rest }) {
  return (
    <Tooltip label={label} disabled={disabled && !label}>
      <button
        type="button"
        className={`icon-btn ${tone ? `icon-btn--${tone}` : ''} ${className}`.trim()}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        {...rest}
      >
        <Icon name={icon} size={size} />
      </button>
    </Tooltip>
  );
}

/* ---------- Badge ---------- */

export function Badge({ tone = 'neutral', dot = false, className = '', children }) {
  return (
    <span className={`badge badge--${tone} ${className}`.trim()}>
      {dot && <span className={`dot dot--${tone}`} />}
      {children}
    </span>
  );
}

/* ---------- Page header ---------- */

export function PageHeader({ title, description, meta, actions }) {
  return (
    <header className="page-head">
      <div className="page-head__title">
        <div className="page-head__row">
          <h1>{title}</h1>
          {description && (
            <Tooltip label={description} side="bottom" wide>
              <button type="button" className="info-btn" aria-label={`About ${title}`}>
                <Icon name="info" size={14} />
              </button>
            </Tooltip>
          )}
        </div>
        {meta ?? (description && <p className="page-head__desc">{description}</p>)}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}

/* ---------- Card ---------- */

export function Card({ title, action, children, className = '', bodyClassName = 'card__body' }) {
  return (
    <section className={`card ${className}`.trim()}>
      {(title || action) && (
        <header className="card__head">
          {title && <h2 className="card__title">{title}</h2>}
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Toolbar({ children, className = '' }) {
  return <div className={`toolbar ${className}`.trim()}>{children}</div>;
}

/* ---------- Empty state ---------- */

export function EmptyState({ icon = 'inbox', title, hint, action }) {
  return (
    <div className="empty">
      <span className="empty__glyph"><Icon name={icon} size={20} /></span>
      <p className="empty__title">{title}</p>
      {hint && <p className="empty__hint">{hint}</p>}
      {action && <div style={{ marginTop: 'var(--s-2)' }}>{action}</div>}
    </div>
  );
}

/* ---------- Tabs ---------- */

export function Tabs({ tabs = [], value, onChange, className = '' }) {
  return (
    <div className={`tabs ${className}`.trim()} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={`tab ${value === tab.value ? 'is-active' : ''}`.trim()}
          onClick={() => onChange?.(tab.value)}
        >
          {tab.label}
          {tab.badge != null && <span className="tab__badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
}

export function SubTabs({ tabs = [], value, onChange }) {
  return (
    <div className="subtabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={`subtab ${value === tab.value ? 'is-active' : ''}`.trim()}
          onClick={() => onChange?.(tab.value)}
        >
          {tab.label}
          {tab.badge != null && <span className="subtle"> ({tab.badge})</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Stepper ---------- */

export function Stepper({ steps = [], current = 0 }) {
  return (
    <div className="stepper">
      {steps.map((label, i) => (
        <div key={label} className="row row--xtight row--nowrap">
          <div className={`step ${i === current ? 'is-active' : i < current ? 'is-done' : ''}`.trim()}>
            <span className="step__dot">{i < current ? <Icon name="check" size={11} strokeWidth={2.6} /> : i + 1}</span>
            <span className="step__label">{label}</span>
          </div>
          {i < steps.length - 1 && <span className="step__line" />}
        </div>
      ))}
    </div>
  );
}

/* ---------- KPI ---------- */

export function Kpi({ label, value, meta }) {
  return (
    <div className="kpi">
      <span className="kpi__label">{label}</span>
      <span className="kpi__value">{value}</span>
      {meta && <span className="kpi__meta">{meta}</span>}
    </div>
  );
}

export default Card;
