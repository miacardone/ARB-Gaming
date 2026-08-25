import { describe, expect, it, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import BrandProvider from '@/brand/BrandProvider';
import AuthProvider from '@/context/AuthContext';
import ToastProvider from '@/context/ToastContext';

import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import AlertCaseWork from '@/pages/AlertCaseWork';
import AlertSettings from '@/pages/AlertSettings';
import AlertPermissions from '@/pages/AlertPermissions';
import AlertReporting from '@/pages/AlertReporting';
import AlertAssignments from '@/pages/AlertAssignments';
import AlertValidations from '@/pages/AlertValidations';
import CaseManagement from '@/pages/CaseManagement';
import WorkCase from '@/pages/WorkCase';
import RuleGroups from '@/pages/RuleGroups';
import AddRule from '@/pages/AddRule';
import BulkActions from '@/pages/BulkActions';
import RuleCheck from '@/pages/RuleCheck';
import AssignmentReasons from '@/pages/AssignmentReasons';
import QueueManagement from '@/pages/QueueManagement';
import UploadCases from '@/pages/UploadCases';
import ReportsCenter from '@/pages/ReportsCenter';
import Monitoring from '@/pages/Monitoring';
import CustomReports from '@/pages/CustomReports';
import Users from '@/pages/Users';
import ApiDocumentation from '@/pages/ApiDocumentation';
import AccountSettings from '@/pages/AccountSettings';
import Webhooks from '@/pages/Webhooks';
import SystemPreferences from '@/pages/SystemPreferences';
import Help from '@/pages/Help';

/**
 * `npm run build` passes on code that renders a blank page — rollup does not
 * fail on an undefined variable, a dropped import, or a stale useMemo
 * dependency. Every one of those is a runtime ReferenceError that white-screens
 * the route, and every one of them shipped at least once during this build.
 *
 * This is that sweep, made permanent: mount each page, assert it produced real
 * content, and fail on anything React logged as an error.
 */

const PAGES = [
  ['Login', Login],
  ['Dashboard', Dashboard],
  ['AlertCaseWork', AlertCaseWork],
  ['AlertSettings', AlertSettings],
  ['AlertPermissions', AlertPermissions],
  ['AlertReporting', AlertReporting],
  ['AlertAssignments', AlertAssignments],
  ['AlertValidations', AlertValidations],
  ['CaseManagement', CaseManagement],
  ['WorkCase', WorkCase],
  ['RuleGroups', RuleGroups],
  ['AddRule', AddRule],
  ['BulkActions', BulkActions],
  ['RuleCheck', RuleCheck],
  ['AssignmentReasons', AssignmentReasons],
  ['QueueManagement', QueueManagement],
  ['UploadCases', UploadCases],
  ['ReportsCenter', ReportsCenter],
  ['Monitoring', Monitoring],
  ['CustomReports', CustomReports],
  ['Users', Users],
  ['ApiDocumentation', ApiDocumentation],
  ['AccountSettings', AccountSettings],
  ['Webhooks', Webhooks],
  ['SystemPreferences', SystemPreferences],
  ['Help', Help],
];

const mount = (Page) =>
  render(
    <BrandProvider>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter>
            <Page />
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </BrandProvider>,
  );

describe('every page mounts', () => {
  beforeEach(() => {
    console.error.mockClear?.();
  });

  it.each(PAGES)('%s renders content and logs no React error', (name, Page) => {
    const { container } = mount(Page);

    // A white screen is an empty root, not a thrown test — assert on content.
    expect(container.textContent.trim().length).toBeGreaterThan(120);

    const errors = (console.error.mock?.calls ?? [])
      .map((args) => String(args[0]))
      // React Router future-flag notices are advisory, not defects.
      .filter((m) => !/React Router Future Flag/i.test(m));
    expect(errors, `${name} logged: ${errors[0] ?? ''}`).toEqual([]);
  });
});

describe('sign-in', () => {
  it('does not print the demo credentials on the page', () => {
    const { container } = mount(Login);
    expect(container.textContent).not.toContain('ARBGamingDemo');
    expect(container.textContent).not.toContain('Changeme123');
  });

  it('reveals the password on demand', () => {
    mount(Login);
    const field = document.querySelector('input[type="password"]');
    expect(field).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Show password'));
    expect(document.querySelector('input[type="password"]')).toBeNull();
    fireEvent.click(screen.getByLabelText('Hide password'));
    expect(document.querySelector('input[type="password"]')).toBeInTheDocument();
  });
});

describe('tenant swap', () => {
  it('renders the dashboard for the second tenant too', async () => {
    // The white-label contract: a tenant change is a config change, not a code
    // change. Re-import with the alternate tenant selected.
    vi.stubEnv('VITE_TENANT', 'pch');
    vi.resetModules();
    const { pchBrand } = await import('@/brand/brand.config');
    const { default: PchDashboard } = await import('@/pages/Dashboard');
    const { default: PchBrandProvider } = await import('@/brand/BrandProvider');

    const { container } = render(
      <PchBrandProvider brand={pchBrand}>
        <AuthProvider>
          <ToastProvider>
            <MemoryRouter>
              <PchDashboard />
            </MemoryRouter>
          </ToastProvider>
        </AuthProvider>
      </PchBrandProvider>,
    );
    expect(container.textContent.trim().length).toBeGreaterThan(120);
    vi.unstubAllEnvs();
  });
});
