// src/components/shared/ProtectedRoute.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'wouter';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'student' | 'admin';
  path: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  role, 
  path 
}) => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If user is not authenticated, redirect to landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If role is specified and user doesn't have the required role
  if (role && user.role !== role) {
    // Redirect based on user's actual role
    const redirectPath = user.role === 'admin' 
      ? '/admin/dashboard' 
      : '/student/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has the correct role
  return <>{children}</>;
};

export default ProtectedRoute;
