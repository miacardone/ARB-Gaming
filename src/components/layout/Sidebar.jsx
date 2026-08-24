import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Icon from '@/components/ui/Icon';
import Wordmark from '@/brand/Wordmark';
import { Tooltip } from '@/components/ui/Overlay';
import { useBrand } from '@/brand/BrandProvider';
import { NAV } from '@/data/navigation';

/**
 * Dark navigation rail with collapsible groups.
 *
 * Groups auto-open when a child route is active, so a deep link lands with its
 * section already expanded. Collapsed, a group shows a hover flyout — portalled,
 * like every other floating layer, so the rail's overflow cannot clip it.
 */

function Flyout({ anchorRect, item }) {
  if (!anchorRect) return null;

  return createPortal(
    <div className="rail__flyout" style={{ left: anchorRect.right + 6, top: anchorRect.top }}>
      <div className="rail__flyout-title">{item.label}</div>
      {item.children.map((child) => (
        <NavLink key={child.path} to={child.path} end={child.end} className={({ isActive }) => `rail__child ${isActive ? 'is-active' : ''}`.trim()}>
          {child.label}
        </NavLink>
      ))}
    </div>,
    document.body,
  );
}

function NavGroup({ item, collapsed }) {
  const { pathname } = useLocation();
  const btnRef = useRef(null);
  const [flyoutRect, setFlyoutRect] = useState(null);

  const isActiveGroup = item.children?.some((c) => pathname.startsWith(c.path)) ?? false;
  const [open, setOpen] = useState(isActiveGroup);

  useEffect(() => {
    if (isActiveGroup) setOpen(true);
  }, [isActiveGroup]);

  if (!item.children) {
    const link = (
      <NavLink to={item.path} className={({ isActive }) => `rail__link ${isActive ? 'is-active' : ''}`.trim()}>
        <Icon name={item.icon} size={16} className="rail__icon" />
        {!collapsed && <span className="rail__label">{item.label}</span>}
      </NavLink>
    );
    return collapsed ? <Tooltip label={item.label} side="right" className="rail__tooltip-fill">{link}</Tooltip> : link;
  }

  if (collapsed) {
    return (
      <div
        onMouseEnter={() => setFlyoutRect(btnRef.current?.getBoundingClientRect() ?? null)}
        onMouseLeave={() => setFlyoutRect(null)}
      >
        <button
          ref={btnRef}
          type="button"
          className="rail__group-btn"
          aria-label={item.label}
          style={isActiveGroup ? { background: 'rgba(255,255,255,0.1)', color: '#fff' } : undefined}
        >
          <Icon name={item.icon} size={16} className="rail__icon" style={isActiveGroup ? { color: 'var(--c-nav-active)' } : undefined} />
        </button>
        {flyoutRect && <Flyout anchorRect={flyoutRect} item={item} />}
      </div>
    );
  }

  return (
    <div>
      <button type="button" className="rail__group-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Icon name={item.icon} size={16} className="rail__icon" style={isActiveGroup ? { color: 'var(--c-nav-active)' } : undefined} />
        <span className="rail__label">{item.label}</span>
        <Icon name="chevronDown" size={13} className={`rail__chevron ${open ? 'is-open' : ''}`.trim()} />
      </button>
      {open && (
        <div className="rail__children">
          {item.children.map((child) => (
            <NavLink key={child.path} to={child.path} end={child.end} className={({ isActive }) => `rail__child ${isActive ? 'is-active' : ''}`.trim()}>
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ collapsed, onToggle }) {
  const brand = useBrand();

  return (
    <aside className={`rail ${collapsed ? 'rail--collapsed' : ''}`.trim()} aria-label="Main navigation">
      <div className="rail__head">
        {!collapsed && <Wordmark inverse size={24} />}
        <button
          type="button"
          className="rail__toggle-btn"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Icon name={collapsed ? 'chevronsRight' : 'chevronsLeft'} size={16} />
        </button>
      </div>

      <nav className="rail__nav">
        {NAV.map((item) => <NavGroup key={item.path} item={item} collapsed={collapsed} />)}
      </nav>

      {!collapsed && (
        <div className="rail__foot">{brand.name} · {brand.productName}</div>
      )}
    </aside>
  );
}

export default Sidebar;
