// src/App.tsx
import React from 'react';
import { Route, Switch } from 'wouter';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/shared/ProtectedRoute';
// Pages
import LandingPage from './pages/LandingPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';
import StudentOnboarding from './pages/StudentOnboarding';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Switch>
            {/* Public Routes */}
            <Route path="/" component={LandingPage} />
            {/* Student Onboarding */}
            <Route path="/student/onboarding" component={StudentOnboarding} />
            {/* Protected Student Dashboard */}
            <ProtectedRoute path="/student/dashboard" role="student">
              <StudentDashboard />
            </ProtectedRoute>
            {/* Protected Admin Dashboard */}
            <ProtectedRoute path="/admin/dashboard" role="admin">
              <AdminDashboard />
            </ProtectedRoute>
            {/* 404 Page */}
            <Route>
              <NotFoundPage />
            </Route>
          </Switch>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
