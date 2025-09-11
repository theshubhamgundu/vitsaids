import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { AuthLayout } from './AuthLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Github, Mail, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithGitHub, loginWithPhone, verifyPhoneOtp } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      // Navigation will be handled by OAuth redirect
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleGithubLogin = async () => {
    try {
      await loginWithGitHub();
      // Navigation will be handled by OAuth redirect
    } catch (error) {
      console.error('GitHub login failed:', error);
    }
  };

  const handlePhoneLogin = async () => {
    if (!otpSent) {
      try {
        await loginWithPhone(`+91${phoneNumber}`);
        setOtpSent(true);
      } catch (error) {
        console.error('Phone login failed:', error);
        toast.error('Failed to send OTP');
      }
    } else {
      try {
        await verifyPhoneOtp(`+91${phoneNumber}`, otp);
        // Navigation will be handled by AuthRedirect component in router
      } catch (error) {
        console.error('OTP verification failed:', error);
        toast.error('OTP verification failed');
      }
    }
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleEmailLogin = async () => {
    if (isLoggingIn) return;
    
    try {
      setIsLoggingIn(true);
      await login(email, password);
      // Navigation will be handled by AuthRedirect component in router
    } catch (error) {
      console.error('Login failed:', error);
      // Toast is already shown by the auth context
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Demo login removed

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Sign in to continue to FindMyEvent"
    >
      {/* OAuth Options */}
      <div className="space-y-3 mb-6">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full py-3 border-2 border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-400 transition-colors"
            onClick={handleGoogleLogin}
          >
            <div className="flex items-center justify-center space-x-3">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </div>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full py-3 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-800 dark:hover:border-gray-400 transition-colors"
            onClick={handleGithubLogin}
          >
            <div className="flex items-center justify-center space-x-3">
              <Github size={20} />
              <span>Continue with GitHub</span>
            </div>
          </Button>
        </motion.div>
      </div>

      <div className="relative mb-6">
        <Separator />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-white dark:bg-gray-800 px-4 text-sm text-muted-foreground">or</span>
        </div>
      </div>

      {/* Toggle between Email and Phone */}
      <div className="flex mb-4">
        <button
          className={`flex-1 py-2 px-4 text-sm rounded-l-lg border border-r-0 ${
            !showPhoneAuth 
              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' 
              : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600'
          }`}
          onClick={() => setShowPhoneAuth(false)}
        >
          <Mail size={16} className="inline mr-2" />
          Email
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm rounded-r-lg border ${
            showPhoneAuth 
              ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800' 
              : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600'
          }`}
          onClick={() => setShowPhoneAuth(true)}
        >
          <Phone size={16} className="inline mr-2" />
          Phone
        </button>
      </div>

      {/* Email Login */}
      {!showPhoneAuth ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={16} className="text-gray-400" />
                ) : (
                  <Eye size={16} className="text-gray-400" />
                )}
              </button>
            </div>
          </div>
          <div className="text-right">
            <button className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </button>
          </div>
          <Button 
            onClick={handleEmailLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!email || !password || isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Signing In...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </Button>
        </motion.div>
      ) : (
        /* Phone Login */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {!otpSent ? (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500">
                    +91
                  </span>
                  <Input
                    type="tel"
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <Button 
                onClick={handlePhoneLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={phoneNumber.length !== 10}
              >
                Send OTP
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Enter OTP</label>
                <Input
                  type="text"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  OTP sent to +91 {phoneNumber}
                </p>
              </div>
              <Button 
                onClick={handlePhoneLogin}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={otp.length !== 6}
              >
                Verify & Sign In
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setOtpSent(false)}
              >
                Change Number
              </Button>
            </>
          )}
        </motion.div>
      )}

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button 
            onClick={() => navigate('/signup')}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>

      {/* Quick Demo Logins (controlled by env) */}
      {((import.meta as any).env?.VITE_ENABLE_DEMO_LOGINS === 'true') && (
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium mb-2 text-center text-blue-700 dark:text-blue-300">Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => login('student@demo.com','demo123')}>Student</Button>
            <Button variant="outline" size="sm" onClick={() => login('organizer@demo.com','demo123')}>Organizer</Button>
            <Button variant="outline" size="sm" onClick={() => login('crew@demo.com','demo123')}>Crew</Button>
            <Button variant="outline" size="sm" onClick={() => login('admin@demo.com','demo123')}>Admin</Button>
          </div>
        </div>
      )}

      {/* Authentication Help */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
          💡 New users: Create an account above. Existing users: Use your email/password or OAuth.
        </p>
      </div>

      {/* Crew Member Link */}
      <div className="mt-4 text-center">
        <button 
          onClick={() => navigate('/crew-login')}
          className="text-xs text-muted-foreground hover:text-blue-600 underline"
        >
          Are you a crew member? Click here
        </button>
      </div>
    </AuthLayout>
  );
}