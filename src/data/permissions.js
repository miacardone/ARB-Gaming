/**
 * Permission matrix.
 *
 * DERIVED FROM OUR NAVIGATION, not the reference's. The reference's list still
 * granted "Case Priority", "Archived Cases", "Unmatched Docs", "Criteria Check"
 * and "Scheduler" — permissions for pages this build does not have. Generating
 * the grid from NAV means a nav change can never leave a stale permission
 * behind, and the counts always add up to something real.
 *
 * Non-navigation capabilities (export, bulk edit, delete…) are added on top.
 */

import { NAV_LEAVES } from '@/data/navigation';
import { ROLES } from '@/data/people';

/** Capabilities that aren't pages. `area` matches the grid sections. */
const CAPABILITIES = [
  { permission: 'Export Cases', area: 'Cases' },
  { permission: 'Bulk Edit Cases', area: 'Cases' },
  { permission: 'Reassign Cases', area: 'Cases' },
  { permission: 'Delete Cases', area: 'Cases' },
  { permission: 'Create Rule', area: 'Rules' },
  { permission: 'Edit Rule', area: 'Rules' },
  { permission: 'Delete Rule', area: 'Rules' },
  { permission: 'Export Reports', area: 'Reports' },
  { permission: 'Schedule Reports', area: 'Reports' },
  { permission: 'Skills', area: 'Administration' },
  { permission: 'Permissions', area: 'Administration' },
];

export const PERMISSION_AREAS = ['Cases', 'Rules', 'Reports', 'Administration'];

const fromNav = NAV_LEAVES
  .filter((l) => l.permission)
  .map((l) => ({ permission: l.permission, area: l.area ?? 'Administration' }));

/** De-duplicated, grouped by area, in area order. */
export const PERMISSION_GROUPS = PERMISSION_AREAS.map((area) => ({
  area,
  permissions: [...new Set([...fromNav, ...CAPABILITIES].filter((p) => p.area === area).map((p) => p.permission))],
})).filter((g) => g.permissions.length > 0);

export const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((g) => g.permissions);

/* ------------------------------------------------------------------ *
 * Default grants
 * ------------------------------------------------------------------ */

const MANAGER_DENY = new Set(['Delete Cases', 'Delete Rule', 'Permissions', 'System Preferences']);

const ANALYST_ALLOW = new Set([
  'Dashboard', 'Alerts', 'Case Management', 'Work Case', 'Export Cases',
  'Reports Center', 'Account Settings', 'Help', 'Rule Check',
]);

export const DEFAULT_GRANTS = {
  admin: new Set(ALL_PERMISSIONS),
  manager: new Set(ALL_PERMISSIONS.filter((p) => !MANAGER_DENY.has(p))),
  analyst: new Set(ALL_PERMISSIONS.filter((p) => ANALYST_ALLOW.has(p))),
};

/** Role tabs on the Permissions page, in display order. */
export const PERMISSION_ROLES = ROLES.map((r) => ({ id: r.id, name: r.name, description: r.description }));
