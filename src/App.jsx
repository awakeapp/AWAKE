import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContextProvider } from './context/AuthContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { DateContextProvider } from './context/DateContext';
import { DataContextProvider } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';

import { TaskContextProvider } from './context/TaskContext';
import { FinanceContextProvider } from './context/FinanceContext';
import { VehicleContextProvider } from './context/VehicleContext';
import { PrayerProvider } from './context/PrayerContext';
import { RamadanProvider } from './context/RamadanContext';
import { RAMADAN_MODE } from './lib/featureFlags';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import FullPageLoader from './components/molecules/FullPageLoader';
import MainLayout from './components/templates/MainLayout';
import RamadanLayout from './components/templates/RamadanLayout';
import WorkspaceLayout from './components/templates/WorkspaceLayout';
import GlobalErrorBanner from './components/system/GlobalErrorBanner';
import OnboardingModal from './components/system/OnboardingModal';
import WelcomeSequence from './components/molecules/WelcomeSequence';

// Firebase services
import { trackScreenView } from './lib/analytics';
import { initRemoteConfig } from './lib/remoteConfig';

// Lazy Pages
const Login = lazy(() => import('./pages/Login'));
const Home = lazy(() => import('./pages/Home'));
const Routine = lazy(() => import('./pages/Routine'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const Profile = lazy(() => import('./pages/Profile'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Analytics = lazy(() => import('./pages/Analytics'));
const DietPlan = lazy(() => import('./pages/DietPlan'));
const About = lazy(() => import('./pages/About'));
import ComingSoon from './pages/ComingSoon';

const TaskDashboard = lazy(() => import('./pages/workspace/TaskDashboard'));
const WorkspaceCalendar = lazy(() => import('./pages/workspace/WorkspaceCalendar'));
const WorkspaceBoard = lazy(() => import('./pages/workspace/WorkspaceBoard'));
const FilteredTaskView = lazy(() => import('./pages/workspace/FilteredTaskView'));
const Overview = lazy(() => import('./pages/workspace/Overview'));

const FinanceDashboard = lazy(() => import('./pages/finance/FinanceDashboard'));
const DebtManager = lazy(() => import('./pages/finance/DebtManager'));
const PartyDetail = lazy(() => import('./pages/finance/PartyDetail'));
const AccountDetail = lazy(() => import('./pages/finance/AccountDetail'));
const MonthlyOverview = lazy(() => import('./pages/finance/MonthlyOverview'));
const FinanceSettings = lazy(() => import('./pages/finance/FinanceSettings'));
const FinanceEMI = lazy(() => import('./pages/finance/FinanceEMI'));

const VehicleDashboard = lazy(() => import('./pages/vehicle/VehicleDashboard'));

// Ramadan pages — lazy loaded only if RAMADAN_MODE flag is true
const RamadanDashboard = RAMADAN_MODE ? lazy(() => import('./pages/ramadan/RamadanDashboard')) : null;
const RamadanStats     = RAMADAN_MODE ? lazy(() => import('./pages/ramadan/RamadanStats'))     : null;
const RamadanDhikr    = RAMADAN_MODE ? lazy(() => import('./pages/ramadan/RamadanDhikr'))    : null;
const RamadanSettings = RAMADAN_MODE ? lazy(() => import('./pages/ramadan/RamadanSettings')) : null;

// Analytics tracker component
function AnalyticsTracker() {
  const location = useLocation();
  useEffect(() => {
    const screenName = location.pathname.replace('/', '') || 'home';
    trackScreenView(screenName);
  }, [location]);
  return null;
}

let hasRunSessionWelcome = false;

function App() {
  const [showWelcome, setShowWelcome] = useState(() => {
    if (hasRunSessionWelcome) return false;
    let isRefresh = false;
    if (window.performance) {
      if (typeof window.performance.getEntriesByType === 'function') {
        const navEntries = window.performance.getEntriesByType('navigation');
        if (navEntries.length > 0) {
          const type = navEntries[0].type;
          if (type === 'reload' || type === 'back_forward') isRefresh = true;
        }
      } else if (window.performance.navigation) {
        const type = window.performance.navigation.type;
        if (type === 1 || type === 2) isRefresh = true;
      }
    }
    if (isRefresh) { hasRunSessionWelcome = true; return false; }
    return true;
  });

  useEffect(() => {
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
          <SettingsProvider>
          <DateContextProvider>
            <DataContextProvider>
              {/* PrayerProvider provides core logic, RamadanProvider handles tracking */}
              <PrayerProvider>
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
                          <Route path="/forgot-password" element={<ForgotPassword />} />

                          {/* Protected Routes */}
                          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                            <Route path="/" element={<Home />} />
                            <Route path="/routine" element={<Routine />} />
                            <Route path="/history" element={<History />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/coming-soon" element={<ComingSoon />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/diet" element={<DietPlan />} />


                            {/* Finance */}
                            <Route path="/finance" element={<FinanceDashboard />} />
                            <Route path="/finance/debts" element={<DebtManager />} />
                            <Route path="/finance/debts/:partyId" element={<PartyDetail />} />
                            <Route path="/finance/account/:id" element={<AccountDetail />} />
                            <Route path="/finance/monthly" element={<MonthlyOverview />} />
                            <Route path="/finance/settings" element={<FinanceSettings />} />
                            <Route path="/finance/emi" element={<FinanceEMI />} />

                            {/* Vehicle */}
                            <Route path="/vehicle" element={<VehicleDashboard />} />
                          </Route>

                          {/* Ramadan — only included when RAMADAN_MODE=true, using RamadanLayout */}
                          {RAMADAN_MODE && RamadanDashboard && (
                            <Route element={<ProtectedRoute><RamadanLayout /></ProtectedRoute>}>
                              <Route path="/ramadan" element={<RamadanDashboard />} />
                              <Route path="/ramadan/stats" element={<RamadanStats />} />
                              <Route path="/ramadan/dhikr" element={<RamadanDhikr />} />
                              <Route path="/ramadan/settings" element={<RamadanSettings />} />
                            </Route>
                          )}

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
            </PrayerProvider>
            </DataContextProvider>
          </DateContextProvider>
          </SettingsProvider>
        </ThemeContextProvider>
      </AuthContextProvider>
    </BrowserRouter>
  );
}

export default App;
