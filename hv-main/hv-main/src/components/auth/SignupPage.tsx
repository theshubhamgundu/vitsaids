import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { AuthLayout } from './AuthLayout';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserType } from '../../contexts/AuthContext';
import { Github, Mail, Phone, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function SignupPage() {
  const [userType, setUserType] = useState<UserType>('student');
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleGoogleSignup = () => {
    // Mock Google OAuth - would integrate with actual OAuth
    if (userType === 'student') {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  const handleGithubSignup = () => {
    // Mock GitHub OAuth - would integrate with actual OAuth
    if (userType === 'student') {
      navigate('/onboarding');
    } else {
      navigate('/dashboard');
    }
  };

  const handleEmailSignup = async () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    
    try {
      await signup(email, password, name, userType);
      if (userType === 'student') {
        navigate('/onboarding');
      } else if (userType === 'organizer') {
        navigate('/organizer-onboarding');
      } else {
        navigate(`/${userType}-dashboard`);
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      
      // For "already exists" errors, offer to try again
      if (error.message?.includes('already exists') || error.message?.includes('already been registered')) {
        const retry = window.confirm(
          'An account with this email already exists. This might be from a previous incomplete signup. Would you like to try again? (We\'ll clean up any incomplete data first)'
        );
        
        if (retry) {
          // Wait a moment and try again
          setTimeout(() => {
            handleEmailSignup();
          }, 1000);
        }
      }
    }
  };

  const handlePhoneSignup = () => {
    if (!otpSent) {
      setOtpSent(true);
    } else {
      // Mock phone verification - would integrate with actual SMS service
      if (userType === 'student') {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <AuthLayout 
      title="Join FindMyEvent" 
      subtitle="Connect with events across all colleges"
    >
      {/* User Type Selection */}
      <div className="mb-6">
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          <motion.button
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              userType === 'student'
                ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setUserType('student')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <User size={16} className="inline mr-2" />
            Student
          </motion.button>
          <motion.button
            className={`flex-1 py-2 px-4 rounded-md transition-all ${
              userType === 'organizer'
                ? 'bg-white dark:bg-gray-800 shadow-sm text-purple-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setUserType('organizer')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Mail size={16} className="inline mr-2" />
            Organizer
          </motion.button>
        </div>
      </div>

      {/* OAuth Options */}
      <div className="space-y-3 mb-6">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="outline"
            className="w-full py-3 border-2 border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-400 transition-colors"
            onClick={handleGoogleSignup}
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
            onClick={handleGithubSignup}
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

      {/* Email and Phone Auth */}
      <div className="space-y-3">
        {!showEmailAuth && !showPhoneAuth ? (
          <>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full py-3 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 transition-colors"
                onClick={() => setShowEmailAuth(true)}
              >
                <div className="flex items-center justify-center space-x-3">
                  <Mail size={20} />
                  <span>Continue with Email</span>
                </div>
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className="w-full py-3 border-2 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-400 transition-colors"
                onClick={() => setShowPhoneAuth(true)}
              >
                <div className="flex items-center justify-center space-x-3">
                  <Phone size={20} />
                  <span>Continue with Phone</span>
                </div>
              </Button>
            </motion.div>
          </>
        ) : showEmailAuth ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} className="text-gray-400" />
                  ) : (
                    <Eye size={16} className="text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <Button 
              onClick={handleEmailSignup}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={!name || !email || !password || !confirmPassword || password !== confirmPassword}
            >
              Create Account
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowEmailAuth(false)}
            >
              Back to options
            </Button>
          </motion.div>
        ) : (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
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
                onClick={handlePhoneSignup}
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
                onClick={handlePhoneSignup}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={otp.length !== 6}
              >
                Verify & Continue
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setOtpSent(false)}
              >
                Change Number
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setShowPhoneAuth(false)}
              >
                Back to options
              </Button>
            </>
          )}
        </motion.div>
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign in
          </button>
        </p>
      </div>

      {/* Crew Member Link */}
      <div className="mt-8 text-center">
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