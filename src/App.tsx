import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { performanceMonitor } from './utils/performanceMonitor';
import { routePreloader } from './utils/routePreloader';
import { OptimizedHooksDemo } from './components/examples/OptimizedHooksDemo';
import ProtectedRoute from './components/shared/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';

// Lazy-loaded page components
import DashboardLazy from './pages/Dashboard/Dashboard.lazy';
import CompaniesPageLazy from './pages/companies/CompaniesPage.lazy';
import CoursesPageLazy from './pages/courses/CoursesPage.lazy';
import TrainersPageLazy from './pages/trainers/TrainersPage.lazy';
import EmployeesPageLazy from './pages/employees/EmployeesPage.lazy';
import SchedulesPageLazy from './pages/schedules/SchedulesPage.lazy';
import SettingsLazy from './pages/settings/Settings.lazy';
import TenantsPageLazy from './pages/tenants/TenantsPage.lazy';
import QuotesAndInvoicesLazy from './pages/QuotesAndInvoices.lazy';
import DocumentsCorsiLazy from './pages/DocumentsCorsi.lazy';
import GDPRDashboardLazy from './pages/GDPRDashboard.lazy';
import AdminGDPRLazy from './pages/AdminGDPR.lazy';

function App() {
  const location = useLocation();

  useEffect(() => {
    // Track route changes for performance monitoring
    performanceMonitor.startRouteTracking(location.pathname);
    
    // Preload high-priority routes on app start
    routePreloader.preloadByPriority('high');
    
    return () => {
      performanceMonitor.endRouteTracking(location.pathname);
    };
  }, [location.pathname]);

  useEffect(() => {
    // Preload medium-priority routes after initial load
    const timer = setTimeout(() => {
      routePreloader.preloadByPriority('medium');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Routes>
      {/* Rotta pubblica per il login */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rotte protette */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={
          <Layout>
            <DashboardLazy />
          </Layout>
        } />
        <Route path="/companies" element={
          <Layout>
            <CompaniesPageLazy />
          </Layout>
        } />
        <Route path="/courses" element={
          <Layout>
            <CoursesPageLazy />
          </Layout>
        } />
        <Route path="/trainers" element={
          <Layout>
            <TrainersPageLazy />
          </Layout>
        } />
        <Route path="/employees" element={
          <Layout>
            <EmployeesPageLazy />
          </Layout>
        } />
        <Route path="/schedules" element={
          <Layout>
            <SchedulesPageLazy />
          </Layout>
        } />
        <Route path="/settings/*" element={
          <Layout>
            <SettingsLazy />
          </Layout>
        } />
        <Route path="/tenants" element={
          <Layout>
            <TenantsPageLazy />
          </Layout>
        } />
        <Route path="/quotes-and-invoices" element={
          <Layout>
            <QuotesAndInvoicesLazy />
          </Layout>
        } />
        <Route path="/documents-corsi" element={
          <Layout>
            <DocumentsCorsiLazy />
          </Layout>
        } />
        <Route path="/gdpr" element={
          <Layout>
            <GDPRDashboardLazy />
          </Layout>
        } />
        <Route path="/admin/gdpr" element={
          <Layout>
            <AdminGDPRLazy />
          </Layout>
        } />
        <Route path="/demo" element={
          <Layout>
            <OptimizedHooksDemo />
          </Layout>
        } />
      </Route>
    </Routes>
  );
}

export default App;