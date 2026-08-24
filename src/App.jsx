import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BrandProvider from '@/brand/BrandProvider';
import AuthProvider from '@/context/AuthContext';
import ToastProvider from '@/context/ToastContext';
import AppLayout from '@/components/layout/AppLayout';
import RequireAuth from '@/components/layout/RequireAuth';
import { ROUTES } from '@/data/navigation';

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
 * Routing follows our edited IA (data/navigation.js): no Case priority, no
 * Unmatched docs, no Scheduler page, Archived as a tab inside Case management,
 * "Rule check" not "Criteria check", and Users as one page with tabs.
 */
export function App() {
  return (
    <BrandProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path={ROUTES.login} element={<Login />} />

              <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
                <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
                <Route path={ROUTES.dashboard} element={<Dashboard />} />
                <Route path={ROUTES.alerts} element={<AlertCaseWork />} />
                <Route path={ROUTES.alertSettings} element={<AlertSettings />} />
                <Route path={ROUTES.alertPermissions} element={<AlertPermissions />} />
                <Route path={ROUTES.alertReporting} element={<AlertReporting />} />
                <Route path={ROUTES.alertAssignments} element={<AlertAssignments />} />
                <Route path={ROUTES.alertValidations} element={<AlertValidations />} />

                <Route path={ROUTES.ruleGroups} element={<RuleGroups />} />
                <Route path={ROUTES.addRule} element={<AddRule />} />
                <Route path={ROUTES.bulkActions} element={<BulkActions />} />
                <Route path={ROUTES.ruleCheck} element={<RuleCheck />} />

                <Route path={ROUTES.assignmentReasons} element={<AssignmentReasons />} />
                <Route path={ROUTES.queueManagement} element={<QueueManagement />} />
                <Route path={ROUTES.caseManagement} element={<CaseManagement />} />
                <Route path={ROUTES.uploadCases} element={<UploadCases />} />

                <Route path={ROUTES.workCase} element={<WorkCase />} />
                <Route path={ROUTES.workCaseDetail()} element={<WorkCase />} />

                <Route path={ROUTES.reportsCenter} element={<ReportsCenter />} />
                <Route path={ROUTES.monitoring} element={<Monitoring />} />
                <Route path={ROUTES.customReports} element={<CustomReports />} />

                <Route path={ROUTES.users} element={<Users />} />
                <Route path={ROUTES.apiDocumentation} element={<ApiDocumentation />} />

                <Route path={ROUTES.accountSettings} element={<AccountSettings />} />
                <Route path={ROUTES.webhooks} element={<Webhooks />} />
                <Route path={ROUTES.systemPreferences} element={<SystemPreferences />} />

                <Route path={ROUTES.help} element={<Help />} />

                <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </BrandProvider>
  );
}

export default App;
