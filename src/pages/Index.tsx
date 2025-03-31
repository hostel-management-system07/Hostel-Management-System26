
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index: React.FC = () => {
  const { currentUser, userDetails, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (currentUser && userDetails) {
    return <Navigate to={userDetails.role === 'admin' ? '/admin-dashboard' : '/student-dashboard'} replace />;
  }
  
  return <Navigate to="/login" replace />;
};

export default Index;
