/**
 * DashboardPage Component - Story 8.1
 * 
 * Main dashboard page that renders the appropriate dashboard
 * based on the current user's role.
 */

import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { EmployeeDashboard } from './EmployeeDashboard';
import { IssuerDashboard } from './IssuerDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { AdminDashboard } from './AdminDashboard';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { ErrorDisplay } from '../../components/common/ErrorDisplay';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  if (isLoading) {
    return <PageLoader text="Loading..." />;
  }

  if (!isAuthenticated || !user) {
    return (
      <ErrorDisplay
        title="Not Authenticated"
        message="Please log in to view your dashboard."
        onRetry={() => navigate('/login')}
        retryText="Go to Login"
        variant="page"
      />
    );
  }

  // Render appropriate dashboard based on user role
  const role = user.role?.toUpperCase();

  switch (role) {
    case 'ADMIN':
      return (
        <div className="space-y-8">
          {/* Admin sees all dashboards */}
          <AdminDashboard />
        </div>
      );

    case 'MANAGER':
      return (
        <div className="space-y-8">
          <ManagerDashboard />
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4 px-4 md:px-6 lg:px-8">
              Your Personal Dashboard
            </h2>
            <EmployeeDashboard />
          </div>
        </div>
      );

    case 'ISSUER':
      return (
        <div className="space-y-8">
          <IssuerDashboard />
          <div className="border-t pt-8">
            <h2 className="text-lg font-semibold mb-4 px-4 md:px-6 lg:px-8">
              Your Personal Dashboard
            </h2>
            <EmployeeDashboard />
          </div>
        </div>
      );

    case 'EMPLOYEE':
    default:
      return <EmployeeDashboard />;
  }
};

export default DashboardPage;
