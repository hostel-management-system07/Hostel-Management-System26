
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  requiredRole?: 'student' | 'admin';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, requiredRole }) => {
  const { currentUser, userDetails, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userDetails?.role !== requiredRole) {
    return <Navigate to={`/${userDetails?.role}-dashboard`} replace />;
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
