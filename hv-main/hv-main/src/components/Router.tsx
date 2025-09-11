import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

// Auth Components
import { SignupPage } from './auth/SignupPage';
import { LoginPage } from './auth/LoginPage';
import { CrewLoginPage } from './auth/CrewLoginPage';
import { OAuthCallback } from './auth/OAuthCallback';

// Protected Route Components
import { ProtectedRoute, AuthRedirect } from './ProtectedRoute';

// Onboarding
import { OnboardingPage } from './onboarding/OnboardingPage';
import { OrganizerOnboarding } from './onboarding/OrganizerOnboarding';

// Dashboard Components
import { StudentDashboard } from './dashboard/StudentDashboard';
import { OrganizerDashboard } from './dashboard/OrganizerDashboard';
import { CrewDashboard } from './dashboard/CrewDashboard';
import { AdminDashboard } from './dashboard/AdminDashboard';

// Landing Page Components
import { Navbar } from './Navbar';
import { HeroCard } from './HeroCard';
import { AboutSection } from './AboutSection';
import { FeaturedEvents } from './FeaturedEvents';
import { Footer } from './Footer';

// Event Pages
import { EventDetailsPage } from './events/EventDetailsPage';
import { CreateEventPage } from './events/CreateEventPage';

// Community Pages
import { EventCommunityPage } from './community/EventCommunityPage';

// Profile and Settings
import { ProfilePage } from './profile/ProfilePage';
import { SettingsPage } from './settings/SettingsPage';
import { TicketPage } from './tickets/TicketPage';

function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroCard />
        <AboutSection />
        <FeaturedEvents />
      </main>
      <Footer />
    </>
  );
}

export function AppRouter() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Authentication Routes - redirect if already authenticated */}
        <Route path="/signup" element={<AuthRedirect><SignupPage /></AuthRedirect>} />
        <Route path="/login" element={<AuthRedirect><LoginPage /></AuthRedirect>} />
        <Route path="/crew-login" element={<AuthRedirect><CrewLoginPage /></AuthRedirect>} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        
        {/* Onboarding - Students */}
        <Route 
          path="/onboarding" 
          element={
            <ProtectedRoute allowedUserTypes={['student']}>
              <OnboardingPage />
            </ProtectedRoute>
          } 
        />
        {/* Onboarding - Organizers */}
        <Route 
          path="/organizer-onboarding" 
          element={
            <ProtectedRoute allowedUserTypes={['organizer']}>
              <OrganizerOnboarding />
            </ProtectedRoute>
          } 
        />
        
        {/* Dashboard Routes - Role-based protection */}
        <Route 
          path="/student-dashboard" 
          element={
            <ProtectedRoute allowedUserTypes={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/organizer-dashboard" 
          element={
            <ProtectedRoute allowedUserTypes={['organizer']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/crew-dashboard" 
          element={
            <ProtectedRoute allowedUserTypes={['crew']}>
              <CrewDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedUserTypes={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Event Routes - Protected */}
        <Route 
          path="/event/:id" 
          element={
            <ProtectedRoute>
              <EventDetailsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create-event" 
          element={
            <ProtectedRoute allowedUserTypes={['organizer']}>
              <CreateEventPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/event/:eventId/community" 
          element={
            <ProtectedRoute>
              <EventCommunityPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Ticket Route - Protected */}
        <Route 
          path="/ticket/:ticketId" 
          element={
            <ProtectedRoute>
              <TicketPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Profile and Settings - Protected */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirects */}
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        
        {/* 404 - Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}