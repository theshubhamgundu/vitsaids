import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseApi } from '../../utils/supabaseApi';
import { LoadingSpinner } from '../LoadingSpinner';
import { motion } from 'motion/react';

export function OAuthCallback() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the session from Supabase after OAuth redirect
        const sessionData = await supabaseApi.getCurrentSession();
        
        if (sessionData) {
          // User is authenticated, redirect to appropriate dashboard
          if (sessionData.user.type === 'student' && !sessionData.user.isOnboarded) {
            navigate('/onboarding');
          } else {
            navigate(`/${sessionData.user.type}-dashboard`);
          }
        } else {
          // No session found, redirect to login
          navigate('/login');
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        navigate('/login');
      }
    };

    // Small delay to ensure Supabase has processed the callback
    const timer = setTimeout(handleOAuthCallback, 1000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center p-8"
      >
        <LoadingSpinner />
        <h2 className="text-xl font-semibold mt-4 mb-2">Completing authentication...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
      </motion.div>
    </div>
  );
}