import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, User, Lock, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'student' | 'admin';
}

const LoginModal = ({ isOpen, onClose, userType }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [htNo, setHtNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [year, setYear] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const { login, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (userType === 'student') {
          // For students, validate required fields and pass student data
          if (!htNo || !studentName || !year || !email || !password) {
            setError('All fields are required for student registration.');
            setIsLoading(false);
            return;
          }
          
          // FIX: Correct argument order for signUp - email, password, studentName, htNo, year
          // Convert year string to just the number part (e.g., "3rd Year" -> "3")
          const yearString = year.charAt(0);
          const result = await signUp(email, password, studentName, htNo, yearString); // ✅ CORRECTED
          if (result.error) {
            setError(result.error.message);
            setIsLoading(false);
            return;
          }
        } else { // userType === 'admin'
          if (!email || !password) {
            setError('Email and password are required for admin registration.');
            setIsLoading(false);
            return;
          }
          const result = await signUp(email, password, userType);
          if (result.error) {
            setError(result.error.message);
            setIsLoading(false);
            return;
          }
        }

        toast({
          title: 'Account Created',
          description: userType === 'admin' ? 'Admin account created successfully.' : 'Student account created successfully.',
        });

        // AuthContext handles redirection after successful signup.
        // The modal will be closed by the handleClose in onOpenChange when redirection occurs,
        // or after the finally block if no error occurred.
        
      } else { // Not sign up, it's login
        await login(email, password, userType);
        // AuthContext handles redirection after successful login.
      }
    } catch (error: any) {
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      // Reset form and close modal only if no error was set during the process.
      // This prevents closing the modal on failed attempts before the user sees the error.
      if (!error) { 
        resetForm();
        onClose();
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setHtNo('');
    setStudentName('');
    setYear('');
    setError('');
    setIsSignUp(false);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Create Account' : `${userType === 'admin' ? 'Admin' : 'Student'} Login`}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {isSignUp
              ? `Create a new ${userType} account`
              : `Enter your credentials to access the ${userType} dashboard`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Student signup fields - show first for students */}
            {isSignUp && userType === 'student' && (
              <>
                <div>
                  <Label htmlFor="htNo">Hall Ticket Number (HT No.)</Label>
                  <div className="relative mt-1">
                    <Input
                      id="htNo"
                      type="text"
                      value={htNo}
                      onChange={(e) => setHtNo(e.target.value)}
                      placeholder="e.g., 23891A7228"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="studentName">Student Name</Label>
                  <div className="relative mt-1">
                    <Input
                      id="studentName"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="year">Year</Label>
                  <Select value={year} onValueChange={setYear} required>
                    <SelectTrigger id="year" aria-label="Select Year">
                      <SelectValue placeholder="Select your year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder={`Enter your ${userType} email`}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">{isSignUp ? 'Create Password' : 'Password'}</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder={isSignUp ? 'Create a strong password' : 'Enter your password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading
                ? (isSignUp ? 'Creating Account...' : 'Signing in...')
                : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>

            {userType === 'admin' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 w-full"
                  disabled={isLoading}
                >
                  <UserPlus className="w-4 h-4" />
                  {isSignUp ? 'Already have an account? Sign In' : 'New Admin? Create Account'}
                </button>
              </div>
            )}

            {userType === 'student' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 w-full"
                  disabled={isLoading}
                >
                  <UserPlus className="w-4 h-4" />
                  {isSignUp ? 'Already have an account? Sign In' : 'New Student? Create Account'}
                </button>
              </div>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
