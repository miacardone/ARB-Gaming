/**
 * NAVIGATION — one source of truth for the rail, the routes and Permissions.
 *
 * This is the client's edited IA. The differences from the reference product
 * are deliberate and must not be "fixed" back:
 *
 *   · "Rule check", not "Criteria check" — it checks a rule, not a criterion.
 *   · NO Case priority page. Priority is derived from due date and value
 *     (domain/statuses.js), so there is nothing to administer.
 *   · Archived is a TAB inside Case management, not a sibling page.
 *   · NO Scheduler page. A schedule belongs to a report, so it is a step in
 *     the Custom reports builder.
 *   · Users is ONE page with tabs, not a dropdown of three.
 *   · NO Unmatched docs section anywhere.
 *   · Alerts is the network EARLY-WARNING product (Verifi CDRN / Visa RDR /
 *     Ethoca) — refund before a chargeback is ever filed — not a generic
 *     notifications inbox. It sits right under Dashboard, split into Case
 *     work (the alert queue) and Settings (identifiers, recipients,
 *     self-service).
 *
 * `permission` is the key Permissions grants against — the grid is generated
 * from THIS list, so a nav change can never leave a stale permission behind.
 */

export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  alerts: '/alerts',
  alertSettings: '/alerts/settings',
  alertPermissions: '/alerts/permissions',
  alertReporting: '/alerts/reporting',
  alertAssignments: '/alerts/assignments',
  alertValidations: '/alerts/validations',

  ruleGroups: '/rules/groups',
  addRule: '/rules/groups/add',
  bulkActions: '/rules/bulk',
  ruleCheck: '/rules/check',

  assignmentReasons: '/case-admin/assignment-reasons',
  queueManagement: '/case-admin/queues',
  caseManagement: '/case-admin/cases',
  uploadCases: '/case-admin/upload',

  workCase: '/work-case',
  workCaseDetail: (id = ':caseId') => `/work-case/${id}`,

  reportsCenter: '/reports/center',
  monitoring: '/reports/monitoring',
  customReports: '/reports/custom',

  users: '/users',
  apiDocumentation: '/api-docs',

  accountSettings: '/settings/account',
  webhooks: '/settings/webhooks',
  systemPreferences: '/settings/system',

  help: '/help',
};

export const NAV = [
  { label: 'Dashboard', path: ROUTES.dashboard, icon: 'dashboard', permission: 'Dashboard', area: 'Cases' },
  {
    label: 'Alerts',
    path: '/alerts-group',
    icon: 'bell',
    children: [
      // end: true — '/alerts' is a string-prefix of every sibling below it
      // (/alerts/settings, /alerts/permissions, ...), so without an exact-match
      // this link would stay highlighted no matter which sibling was active.
      { label: 'Alert case work', path: ROUTES.alerts, icon: 'shield', permission: 'Alert Case Work', area: 'Cases', end: true },
      { label: 'Alert settings', path: ROUTES.alertSettings, icon: 'sliders', permission: 'Alert Settings', area: 'Cases' },
      { label: 'Alert permissions', path: ROUTES.alertPermissions, icon: 'lock', permission: 'Alert Permissions', area: 'Administration' },
      { label: 'Alert reporting', path: ROUTES.alertReporting, icon: 'file', permission: 'Alert Reporting', area: 'Reports' },
      { label: 'Alert assignments', path: ROUTES.alertAssignments, icon: 'user', permission: 'Alert Assignments', area: 'Administration' },
      { label: 'Alert validations', path: ROUTES.alertValidations, icon: 'checklist', permission: 'Alert Validations', area: 'Cases' },
    ],
  },
  {
    label: 'Rules',
    path: '/rules',
    icon: 'rules',
    children: [
      { label: 'Rule groups', path: ROUTES.ruleGroups, icon: 'layers', permission: 'Rule Groups', area: 'Rules' },
      { label: 'Bulk actions', path: ROUTES.bulkActions, icon: 'checklist', permission: 'Bulk Actions', area: 'Rules' },
      { label: 'Rule check', path: ROUTES.ruleCheck, icon: 'searchCheck', permission: 'Rule Check', area: 'Rules' },
    ],
  },
  {
    label: 'Case admin',
    path: '/case-admin',
    icon: 'folder',
    children: [
      { label: 'Assignment reasons', path: ROUTES.assignmentReasons, icon: 'tag', permission: 'Assignment Reasons', area: 'Administration' },
      { label: 'Queue management', path: ROUTES.queueManagement, icon: 'inbox', permission: 'Queue Management', area: 'Administration' },
      { label: 'Case management', path: ROUTES.caseManagement, icon: 'table', permission: 'Case Management', area: 'Cases' },
      { label: 'Upload cases', path: ROUTES.uploadCases, icon: 'upload', permission: 'Upload Cases', area: 'Cases' },
    ],
  },
  { label: 'Work case', path: ROUTES.workCase, icon: 'briefcase', permission: 'Work Case', area: 'Cases' },
  {
    label: 'Reports',
    path: '/reports',
    icon: 'chart',
    children: [
      { label: 'Reports center', path: ROUTES.reportsCenter, icon: 'pie', permission: 'Reports Center', area: 'Reports' },
      { label: 'Monitoring', path: ROUTES.monitoring, icon: 'activity', permission: 'Monitoring', area: 'Reports' },
      { label: 'Custom reports', path: ROUTES.customReports, icon: 'spreadsheet', permission: 'Custom Reports', area: 'Reports' },
    ],
  },
  { label: 'Users', path: ROUTES.users, icon: 'users', permission: 'User Management', area: 'Administration' },
  { label: 'API documentation', path: ROUTES.apiDocumentation, icon: 'code', permission: 'API Documentation', area: 'Administration' },
  {
    label: 'Settings',
    path: '/settings',
    icon: 'cog',
    children: [
      { label: 'Account settings', path: ROUTES.accountSettings, icon: 'userCircle', permission: 'Account Settings', area: 'Administration' },
      { label: 'Webhooks', path: ROUTES.webhooks, icon: 'webhook', permission: 'Webhooks', area: 'Administration' },
      { label: 'System preferences', path: ROUTES.systemPreferences, icon: 'sliders', permission: 'System Preferences', area: 'Administration' },
    ],
  },
  { label: 'Help', path: ROUTES.help, icon: 'help', permission: 'Help', area: 'Administration' },
];

/** Every navigable leaf, flattened. */
export const NAV_LEAVES = NAV.flatMap((item) =>
  item.children ? item.children.map((c) => ({ ...c, parent: item.label })) : [{ ...item, parent: null }],
);

export const titleForPath = (pathname) =>
  NAV_LEAVES.find((l) => pathname === l.path || pathname.startsWith(`${l.path}/`))?.label ?? '';
