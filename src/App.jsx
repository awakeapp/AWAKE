import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContextProvider, AuthContext } from './context/AuthContext';
import { DateContextProvider } from './context/DateContext';
import { DataContextProvider } from './context/DataContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { useContext } from 'react';

import MainLayout from './components/templates/MainLayout';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Routine from './pages/Routine';
import History from './pages/History';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import DietPlan from './pages/DietPlan';
import LoveChat from './pages/LoveChat';
import WorkspaceLayout from './components/templates/WorkspaceLayout';
import TaskDashboard from './pages/workspace/TaskDashboard';
import WorkspaceCalendar from './pages/workspace/WorkspaceCalendar';
import WorkspaceBoard from './pages/workspace/WorkspaceBoard';
import FilteredTaskView from './pages/workspace/FilteredTaskView';
import Overview from './pages/workspace/Overview';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import DebtManager from './pages/finance/DebtManager';
import AccountDetail from './pages/finance/AccountDetail';
import MonthlyOverview from './pages/finance/MonthlyOverview';
import { ChatContextProvider } from './context/ChatContext';
import { TaskContextProvider } from './context/TaskContext';
import { FinanceContextProvider } from './context/FinanceContext';
import { VehicleContextProvider } from './context/VehicleContext';
import VehicleDashboard from './pages/vehicle/VehicleDashboard';

const ProtectedRoute = ({ children }) => {
    const { user, authIsReady } = useContext(AuthContext);

    if (!authIsReady) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    return (
        <Router>
            <AuthContextProvider>
                <ThemeContextProvider>
                    <DateContextProvider>
                        <DataContextProvider>
                            <ChatContextProvider>
                                <TaskContextProvider>
                                    <FinanceContextProvider>
                                        <VehicleContextProvider>
                                            <Routes>
                                                <Route path="/login" element={<Login />} />
                                                <Route path="/forgot-password" element={<ForgotPassword />} />

                                                <Route path="/" element={
                                                    <ProtectedRoute>
                                                        <MainLayout>
                                                            <Dashboard />
                                                        </MainLayout>
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/routine" element={
                                                    <ProtectedRoute>
                                                        <MainLayout>
                                                            <Routine />
                                                        </MainLayout>
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/history" element={
                                                    <ProtectedRoute>
                                                        <MainLayout>
                                                            <History />
                                                        </MainLayout>
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/settings" element={
                                                    <ProtectedRoute>
                                                        <MainLayout>
                                                            <Settings />
                                                        </MainLayout>
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/diet-plan" element={
                                                    <ProtectedRoute>
                                                        <MainLayout>
                                                            <DietPlan />
                                                        </MainLayout>
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/chat" element={
                                                    <ProtectedRoute>
                                                        <MainLayout>
                                                            <LoveChat />
                                                        </MainLayout>
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/analytics" element={
                                                    <ProtectedRoute>
                                                        <MainLayout>
                                                            <Analytics />
                                                        </MainLayout>
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/workspace/*" element={
                                                    <ProtectedRoute>
                                                        <WorkspaceLayout>
                                                            <Routes>
                                                                <Route index element={<TaskDashboard />} />
                                                                <Route path="tasks" element={<FilteredTaskView filterType="all" />} />
                                                                <Route path="overview" element={<Overview />} />
                                                                <Route path="important" element={<FilteredTaskView filterType="important" />} />
                                                                <Route path="recent" element={<FilteredTaskView filterType="recent" />} />
                                                                <Route path="calendar" element={<WorkspaceCalendar />} />
                                                                <Route path="board" element={<WorkspaceBoard />} />
                                                                <Route path="settings" element={<Settings />} />
                                                                <Route path="*" element={<Navigate to="" replace />} />
                                                            </Routes>
                                                        </WorkspaceLayout>
                                                    </ProtectedRoute>
                                                } />

                                                {/* Finance Module */}
                                                <Route path="/finance" element={
                                                    <ProtectedRoute>
                                                        <FinanceDashboard />
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/finance/analytics" element={
                                                    <ProtectedRoute>
                                                        <MonthlyOverview />
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/finance/debts" element={
                                                    <ProtectedRoute>
                                                        <DebtManager />
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="/finance/account/:id" element={
                                                    <ProtectedRoute>
                                                        <AccountDetail />
                                                    </ProtectedRoute>
                                                } />

                                                {/* Vehicle Module */}
                                                <Route path="/vehicle" element={
                                                    <ProtectedRoute>
                                                        <VehicleDashboard />
                                                    </ProtectedRoute>
                                                } />

                                                <Route path="*" element={<Navigate to="/" replace />} />
                                            </Routes>
                                        </VehicleContextProvider>
                                    </FinanceContextProvider>
                                </TaskContextProvider>
                            </ChatContextProvider>
                        </DataContextProvider>
                    </DateContextProvider>
                </ThemeContextProvider>
            </AuthContextProvider>
        </Router>
    );
}

export default App;
