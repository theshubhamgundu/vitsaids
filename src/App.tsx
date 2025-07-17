// App.tsx - Revised for LoginModal

import React, { useEffect, useState } from 'react'; // Import useState for modal visibility
import { Route, Switch, useLocation as useWouterLocation } from 'wouter'; // Renamed to avoid conflict with AuthContext's useLocation
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

// Import your page/component files
import Index from './pages/Index';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import NotFound from './pages/NotFound';
import StudentOnboarding from './pages/StudentOnboarding';
import LoginModal from '@/components/LoginModal'; // Assuming your LoginModal is here

const queryClient = new QueryClient();

// This component encapsulates your application's routing logic.
const RoutesWithAuthProtection: React.FC = () => {
  const {
    loading,
    isAuthenticated,
    userProfile,
    needsProfileCreation,
    user // Added user to check for user_metadata.role
  } = useAuth();

  const [location, setWouterLocation] = useWouterLocation(); // Using wouter's useLocation

  // State to control the visibility of the LoginModal
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Effect to handle initial/post-auth redirection and modal visibility
  useEffect(() => {
    // Only proceed if the AuthContext has completed its initial loading phase
    if (loading) {
      console.log('[RoutesWithAuthProtection] AuthContext is still loading. Skipping initial route/modal check.');
      return;
    }

    console.log('[RoutesWithAuthProtection] AuthContext loading complete. Checking initial redirect/modal conditions.');
    console.log('[RoutesWithAuthProtection] isAuthenticated:', isAuthenticated);
    console.log('[RoutesWithAuthProtection] userProfile:', userProfile);
    console.log('[RoutesWithAuthProtection] needsProfileCreation:', needsProfileCreation);
    console.log('[RoutesWithAuthProtection] Current Path:', location);

    // Scenario 1: User is authenticated and profile is approved
    if (isAuthenticated && userProfile && userProfile.status === 'approved') {
        // If user is on a public page ('/', '/login-modal-trigger') after successful auth,
        // redirect them to their respective dashboard.
        if (location === '/' || location === '/login-modal-trigger') { // Add any other paths that might trigger the modal/are public entry points
            if (userProfile.role === 'student' && location !== '/student-dashboard') {
                console.log('[RoutesWithAuthProtection] Authenticated student on public page. Redirecting to /student-dashboard.');
                setWouterLocation('/student-dashboard');
                setIsLoginModalOpen(false); // Close modal if open
                return;
            } else if (userProfile.role === 'admin' && location !== '/admin-dashboard') {
                console.log('[RoutesWithAuthProtection] Authenticated admin on public page. Redirecting to /admin-dashboard.');
                setWouterLocation('/admin-dashboard');
                setIsLoginModalOpen(false); // Close modal if open
                return;
            }
        }
        // Close login modal if user is authenticated and not on a public path.
        if (isLoginModalOpen) {
            setIsLoginModalOpen(false);
        }
    }
    // Scenario 2: Authenticated student needs profile creation
    else if (isAuthenticated && needsProfileCreation && userProfile === null && user?.user_metadata?.role === 'student') {
        if (location !== '/student-onboarding' && location !== '/complete-profile') {
            console.log('[RoutesWithAuthProtection] Authenticated student needs profile creation. Redirecting to /student-onboarding.');
            setWouterLocation('/student-onboarding');
            setIsLoginModalOpen(false); // Close modal if open
            return;
        }
    }
    // Scenario 3: Authenticated user with pending profile status
    else if (isAuthenticated && userProfile?.status === 'pending') {
        if (location !== '/') { // Redirect to home for pending approval
            console.log('[RoutesWithAuthProtection] Authenticated user with pending profile. Redirecting to /.');
            setWouterLocation('/');
            setIsLoginModalOpen(false); // Close modal if open
            return;
        }
    }
    // Scenario 4: Not authenticated and on a path that should trigger the login modal
    // For example, if you want the login modal to pop up when someone lands on '/'
    // or if a ProtectedRoute redirects to '/' when unauthenticated.
    else if (!isAuthenticated) {
        // Decide when to show the modal.
        // Option A: Always show on '/' if not authenticated
        // if (location === '/') {
        //     setIsLoginModalOpen(true);
        // }
        // Option B: Show when a protected route tries to redirect to '/'
        // You might need a query param or separate state for this.
        // For simplicity, let's assume LoginModal is initially opened by a button on Index page.
        // Or, you can have a specific path like '/login-prompt' that opens the modal.
        // For now, if unauthenticated AND on the root, we'll prompt the modal.
        if (location === '/') {
            setIsLoginModalOpen(true);
        } else {
             setIsLoginModalOpen(false); // Ensure it's closed on other public pages
        }
    }
  }, [loading, isAuthenticated, userProfile, needsProfileCreation, user, location, setWouterLocation]);


  // During the initial loading phase of AuthContext, return null
  // (the root AuthProvider already displays the global spinner).
  if (loading) {
      console.log('[RoutesWithAuthProtection] Still in AuthContext loading phase. Not rendering routes.');
      return null;
  }

  // Once AuthContext is ready, render the routes and the modal conditionally
  console.log('[RoutesWithAuthProtection] AuthContext ready. Rendering application routes.');
  return (
    <>
      <Switch>
        {/* Public Routes */}
        <Route path="/" component={Index} />
        {/* The LoginModal is NOT a route itself */}
        <Route path="/student-onboarding" component={StudentOnboarding} />
        <Route path="/complete-profile" component={StudentOnboarding} />

        {/* Protected Routes - Use ProtectedRoute wrapper */}
        <ProtectedRoute path="/student-dashboard" allowedRoles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>

        <ProtectedRoute path="/admin-dashboard" allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>

        {/* Catch-all for unmatched paths */}
        <Route component={NotFound} />
      </Switch>

      {/* Conditionally render LoginModal based on state */}
      {/* This modal needs to be high enough in the tree to overlay everything */}
      {isLoginModalOpen && !isAuthenticated && ( // Only show if modal state is open AND not authenticated
          <LoginModal
              open={isLoginModalOpen}
              onOpenChange={setIsLoginModalOpen} // Allow modal to control its own open/close state
          />
      )}
    </>
  );
};

// Main App component: Sets up global providers
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <RoutesWithAuthProtection />
          <Toaster />
          <Sonner />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
