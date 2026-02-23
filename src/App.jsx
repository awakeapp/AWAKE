import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { DateContextProvider } from './context/DateContext';
import { DataContextProvider } from './context/DataContext';

import { TaskContextProvider } from './context/TaskContext';
import { FinanceContextProvider } from './context/FinanceContext';
import { VehicleContextProvider } from './context/VehicleContext';
import { RamadanProvider } from './context/RamadanContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import FullPageLoader from './components/molecules/FullPageLoader';
import MainLayout from './components/templates/MainLayout';
import WorkspaceLayout from './components/templates/WorkspaceLayout';
import GlobalErrorBanner from './components/system/GlobalErrorBanner';
import OnboardingModal from './components/system/OnboardingModal';
import WelcomeSequence from './components/molecules/WelcomeSequence';

// Firebase services
import { trackScreenView } from './lib/analytics';
import { initRemoteConfig } from './lib/remoteConfig';

// Lazy Pages
const Login = lazy(() => import('./pages/Login'));
// const SimpleLogin = lazy(() => import('./pages/SimpleLogin')); // Removed
// const Signup = lazy(() => import('./pages/Signup')); // Removed
const Dashboard = lazy(() => import('./pages/Dashboard')); // Deprecated? Kept for ref.
const Home = lazy(() => import('./pages/Home'));
const Routine = lazy(() => import('./pages/Routine'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
// const UserManagement = lazy(() => import('./pages/UserManagement')); // Removed


const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Analytics = lazy(() => import('./pages/Analytics'));
const DietPlan = lazy(() => import('./pages/DietPlan'));
const TaskDashboard = lazy(() => import('./pages/workspace/TaskDashboard'));
const WorkspaceCalendar = lazy(() => import('./pages/workspace/WorkspaceCalendar'));
const WorkspaceBoard = lazy(() => import('./pages/workspace/WorkspaceBoard'));
const FilteredTaskView = lazy(() => import('./pages/workspace/FilteredTaskView'));
const Overview = lazy(() => import('./pages/workspace/Overview'));
const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'));
const DebtManager = lazy(() => import('./pages/finance/DebtManager'));
const AccountDetail = lazy(() => import('./pages/finance/AccountDetail'));
const MonthlyOverview = lazy(() => import('./pages/finance/MonthlyOverview'));
const VehicleDashboard = lazy(() => import('./pages/vehicle/VehicleDashboard'));

// Analytics tracker component
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track screen view on route change
    const screenName = location.pathname.replace('/', '') || 'home';
    trackScreenView(screenName);
  }, [location]);

  return null;
}

let hasRunSessionWelcome = false;

function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    // 1. If we already ran it in this JS context, don't run again (handles React re-renders).
    if (hasRunSessionWelcome) return false;

    // 2. Check navigation type to detect refresh vs fresh launch
    let isRefresh = false;

    if (window.performance) {
      // Modern Performance API
      if (typeof window.performance.getEntriesByType === 'function') {
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const type = navEntries[0].type;
          // 'reload' = manual refresh. 'back_forward' = hitting back button to enter app
          if (type === 'reload' || type === 'back_forward') {
            isRefresh = true;
          }
        }
      } 
      // Fallback for older browsers
      else if (window.performance.navigation) {
        const type = window.performance.navigation.type;
        if (type === 1 /* TYPE_RELOAD */ || type === 2 /* TYPE_BACK_FORWARD */) {
          isRefresh = true;
        }
      }
    }

    // 3. If it is a refresh, mark as run and skip
    if (isRefresh) {
      hasRunSessionWelcome = true;
      return false;
    }

    // 4. Otherwise (cold start, fresh open, app icon tap), show it!
    return true;
  });

  useEffect(() => {
    // Initialize remote config on app load
    initRemoteConfig().catch(console.error);
  }, []);

  if (showWelcome) {
    return (
        <AuthContextProvider>
            <ThemeContextProvider>
                <WelcomeSequence onComplete={() => {
                    hasRunSessionWelcome = true;
                    setShowWelcome(false);
                }} />
            </ThemeContextProvider>
        </AuthContextProvider>
    );
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthContextProvider>
        <ThemeContextProvider>
          <DateContextProvider>
            <DataContextProvider>
              <RamadanProvider>
                <TaskContextProvider>
                  <FinanceContextProvider>
                    <VehicleContextProvider>
                      <AnalyticsTracker />
                      <GlobalErrorBanner />
                      <OnboardingModal />
                      <Suspense fallback={<FullPageLoader />}>
                        <Routes>
                          {/* Public Routes */}
                          <Route path="/login" element={<Login />} />
                          {/* <Route path="/simple-login" element={<SimpleLogin />} /> */}
                          {/* <Route path="/signup" element={<Signup />} /> */}
                          

                          <Route path="/forgot-password" element={<ForgotPassword />} />


                          {/* Protected Routes */}
                          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                            <Route path="/" element={<Home />} />
                            <Route path="/routine" element={<Routine />} />
                            <Route path="/history" element={<History />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/profile" element={<Profile />} />

                            {/* <Route path="/users" element={<UserManagement />} /> */}
                            <Route path="/analytics" element={<Analytics />} />

                            <Route path="/diet" element={<DietPlan />} />

                            {/* Finance Routes */}
                            <Route path="/finance" element={<FinanceDashboard />} />
                            <Route path="/finance/debts" element={<DebtManager />} />
                            <Route path="/finance/account/:id" element={<AccountDetail />} />
                            <Route path="/finance/monthly" element={<MonthlyOverview />} />

                            {/* Vehicle Routes */}
                            <Route path="/vehicle" element={<VehicleDashboard />} />
                          </Route>



                          {/* Workspace Routes */}
                          <Route path="/workspace" element={<ProtectedRoute><WorkspaceLayout /></ProtectedRoute>}>
                            <Route index element={<TaskDashboard />} />
                            <Route path="calendar" element={<WorkspaceCalendar />} />
                            <Route path="board" element={<WorkspaceBoard />} />
                            <Route path="overview" element={<Overview />} />
                            <Route path="filter/:filterType" element={<FilteredTaskView />} />
                          </Route>

                          {/* Fallback */}
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Suspense>
                    </VehicleContextProvider>
                  </FinanceContextProvider>
                </TaskContextProvider>
              </RamadanProvider>
            </DataContextProvider>
          </DateContextProvider>
        </ThemeContextProvider>
      </AuthContextProvider>
    </BrowserRouter>
  );
}

export default App;
