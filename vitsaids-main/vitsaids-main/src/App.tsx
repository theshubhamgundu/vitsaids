import React, { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';

import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProfileCreationModal from '@/components/ProfileCreationModal';

import Index from './pages/Index';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const AppRoutes: React.FC = () => {
  const {
    user,
    userProfile,
    loading,
    needsProfileCreation,
    closeProfileCreationModal,
  } = useAuth();

  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && userProfile) {
      if (userProfile.role === 'admin') {
        setLocation('/admin-dashboard');
      } else if (userProfile.role === 'student' && userProfile.status === 'verified') {
        setLocation('/student-dashboard');
      }
    }
  }, [loading, userProfile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const showModal =
    !!user &&
    !loading &&
    userProfile?.role === 'student' &&
    needsProfileCreation;

  return (
    <>
      <Switch>
        <Route path="/" component={Index} />
        <Route path="/admin-dashboard" component={AdminDashboard} />
        <Route path="/student-dashboard" component={StudentDashboard} />
        <Route component={NotFound} />
      </Switch>

      {showModal && (
        <ProfileCreationModal
          open={true}
          onOpenChange={(open) => {
            if (!open) closeProfileCreationModal();
          }}
        />
      )}
    </>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <div className="min-h-screen">
            <AppRoutes />
            <Toaster />
            <Sonner />
          </div>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
