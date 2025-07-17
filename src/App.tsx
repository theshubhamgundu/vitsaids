// App.tsx

import React, { useEffect } from 'react';
import { Route, Switch } from 'wouter'; // Assuming 'wouter' is your router library
import { Toaster } from '@/components/ui/toaster'; // For shadcn/ui toasts
import { Toaster as Sonner } from '@/components/ui/sonner'; // For shadcn/ui sonner (if used)
import { TooltipProvider } from '@/components/ui/tooltip'; // For shadcn/ui tooltips
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // For react-query

// Import AuthProvider and useAuth from your contexts directory
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Import the ProtectedRoute component
import ProtectedRoute from '@/components/ProtectedRoute'; // Make sure this path is correct

// Import your page components
import Index from './pages/Index'; // Your homepage/public index
import AdminDashboard from './pages/AdminDashboard'; // Admin-specific dashboard
import StudentDashboard from './pages/StudentDashboard'; // Student-specific dashboard
import NotFound from './pages/NotFound'; // 404 Not Found page
import LoginPage from './pages/LoginPage'; // Your login page component
import StudentOnboarding from './pages/StudentOnboarding'; // Page for student profile completion

// Initialize React Query client
const queryClient = new QueryClient();

// This component encapsulates your application's routing logic.
// It sits inside the AuthProvider to consume the authentication context.
const RoutesWithAuthProtection: React.FC = () => {
  const { 
    loading, 
    isAuthenticated, 
    userProfile, 
    needsProfileCreation,
    user // Need the user object to check metadata role for onboarding redirects
  } = useAuth();
  
  const [currentPath, setLocation] = useLocation(); // wouter's setLocation hook

  // This useEffect handles initial/post-auth redirection for users
  // who might land on public routes (like '/') directly while already logged in,
  // or for students who just signed up/logged in and need profile completion.
  useEffect(() => {
    // Only proceed if the AuthContext has completed its initial loading phase
    if (loading) {
      console.log('[RoutesWithAuthProtection] AuthContext is still loading. Skipping initial route check.');
      return;
    }

    console.log('[RoutesWithAuthProtection] AuthContext loading complete. Checking initial redirect conditions.');
    console.log('[RoutesWithAuthProtection] isAuthenticated:', isAuthenticated);
    console.log('[RoutesWithAuthProtection] userProfile:', userProfile);
    console.log('[RoutesWithAuthProtection] needsProfileCreation:', needsProfileCreation);
    console.log('[RoutesWithAuthProtection] Current Path:', currentPath);

    // If authenticated and profile loaded/approved, and currently on a public route,
    // redirect them to their respective dashboard.
    if (isAuthenticated && userProfile && userProfile.status === 'approved') {
        // Prevent redirecting from protected routes back to dashboard if already there
        if (currentPath === '/login' || currentPath === '/' || currentPath === '/student-onboarding' || currentPath === '/complete-profile') {
            if (userProfile.role === 'student' && currentPath !== '/student-dashboard') {
                console.log('[RoutesWithAuthProtection] Authenticated student on public/onboarding page. Redirecting to /student-dashboard.');
                setLocation('/student-dashboard');
                return;
            } else if (userProfile.role === 'admin' && currentPath !== '/admin-dashboard') {
                console.log('[RoutesWithAuthProtection] Authenticated admin on public page. Redirecting to /admin-dashboard.');
                setLocation('/admin-dashboard');
                return;
            }
        }
    }
    // If authenticated, but needs profile creation (only applicable for students as per AuthContext logic)
    // and not currently on an onboarding page, redirect to onboarding.
    else if (isAuthenticated && needsProfileCreation && userProfile === null && user?.user_metadata?.role === 'student') {
        if (currentPath !== '/student-onboarding' && currentPath !== '/complete-profile') {
            console.log('[RoutesWithAuthProtection] Authenticated student needs profile creation. Redirecting to /student-onboarding.');
            setLocation('/student-onboarding');
            return;
        }
    }
    // If authenticated but profile is pending, ensure they are on the home page (or a specific pending page)
    else if (isAuthenticated && userProfile?.status === 'pending') {
        if (currentPath !== '/') {
            console.log('[RoutesWithAuthProtection] Authenticated user with pending profile. Redirecting to /.');
            setLocation('/');
            return;
        }
    }
    // If not authenticated and not on a public route, ProtectedRoute will handle redirect to /login.
    // If not authenticated and on a public route (`/`, `/login`, etc.), it's fine to stay there.

  }, [loading, isAuthenticated, userProfile, needsProfileCreation, user, currentPath, setLocation]); // Added user and currentPath to dependencies

  // During the initial loading phase of AuthContext, return null or a global loader.
  // The AuthProvider itself already renders a full-screen spinner when `loading` is true
  // and `!isInitialCheckDone.current` (initial state).
  // This `RoutesWithAuthProtection` component's `loading` check is primarily to prevent
  // premature rendering of routes BEFORE the initial redirect logic runs.
  if (loading) {
      console.log('[RoutesWithAuthProtection] Still in AuthContext loading phase (or processing an action). Not rendering routes yet.');
      return null; // AuthProvider's spinner is already shown.
  }

  // Once loading is false, render the actual routes
  console.log('[RoutesWithAuthProtection] AuthContext ready. Rendering application routes.');
  return (
    <Switch>
      {/* Public Routes - Accessible to anyone, authenticated or not */}
      <Route path="/" component={Index} />
      <Route path="/login" component={LoginPage} />
      <Route path="/student-onboarding" component={StudentOnboarding} />
      <Route path="/complete-profile" component={StudentOnboarding} /> {/* Alias for student onboarding */}
      {/* Add any other genuinely public routes here (e.g., /about, /contact) */}

      {/* Protected Routes - Require authentication and specific roles */}
      <ProtectedRoute path="/student-dashboard" allowedRoles={['student']}>
        <StudentDashboard />
      </ProtectedRoute>

      <ProtectedRoute path="/admin-dashboard" allowedRoles={['admin']}>
        <AdminDashboard />
      </ProtectedRoute>

      {/* Catch-all route for any unmatched paths - must be last */}
      <Route component={NotFound} />
    </Switch>
  );
};

// Main App component: Sets up global providers
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* AuthProvider must wrap all components that use auth context or ProtectedRoute */}
        <AuthProvider>
          {/* RoutesWithAuthProtection handles all application routing decisions */}
          <RoutesWithAuthProtection /> 
          <Toaster />
          <Sonner />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
