
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Index from '@/pages/Index';
import StudentDashboard from '@/pages/StudentDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import NotFound from '@/pages/NotFound';
import './App.css';

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is logged in but profile is not complete or not approved
  if (user && userProfile) {
    const isStudentWithIncompleteProfile = 
      userProfile.role === 'student' && 
      (!userProfile.student_name || !userProfile.ht_no || !userProfile.year);
    
    const isNotApproved = userProfile.status === 'pending' || userProfile.status === 'rejected';
    
    if (isStudentWithIncompleteProfile || isNotApproved) {
      // Redirect to home page where ProfileCompletionModal will handle this
      return <Index />;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <AppContent />
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
