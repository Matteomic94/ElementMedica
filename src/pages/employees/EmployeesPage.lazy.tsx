import React, { Suspense } from 'react';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { LoadingFallback } from '../../components/ui/LoadingFallback';

/**
 * Lazy-loaded Employees page
 * Week 11 Implementation - Lazy Loading Optimization
 */

const EmployeesPage = React.lazy(() => import('./EmployeesPage').then(module => ({ default: module.EmployeesPage })));

export const EmployeesPageLazy: React.FC = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message="Loading Employees..." />}>
        <EmployeesPage />
      </Suspense>
    </ErrorBoundary>
  );
};

export default EmployeesPageLazy;