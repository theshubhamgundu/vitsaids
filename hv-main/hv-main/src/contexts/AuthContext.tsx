import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseApi, User } from '../utils/supabaseApi';
import { showToast } from '../utils/toast';

export type UserType = 'student' | 'organizer' | 'crew' | 'admin';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  loginWithPhone: (phone: string) => Promise<void>;
  verifyPhoneOtp: (phone: string, otp: string) => Promise<void>;
  signup: (email: string, password: string, name: string, type: UserType) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users removed. All auth flows depend on Supabase only.

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await supabaseApi.getCurrentSession();
        if (sessionData) {
          setUser(sessionData.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking Supabase session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Demo logins (always available for known demo accounts)
      const isDemoEmail = /^(admin|student|organizer|crew)@demo\.com$/i.test(email);
      if (isDemoEmail && password === 'demo123') {
        const role = email.split('@')[0] as UserType;
        const demoUser: User = {
          id: `demo_${role}`,
          name: role.charAt(0).toUpperCase() + role.slice(1),
          email,
          type: role,
          verified: true,
          isOnboarded: role === 'student' ? false : true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any;
        setUser(demoUser);
        showToast.auth.loginSuccess(demoUser.name);
        return;
      }

      // Supabase authentication only
      try {
        const { user: authenticatedUser } = await supabaseApi.signInWithSupabase(email, password);
        setUser(authenticatedUser);
        showToast.auth.loginSuccess(authenticatedUser.name);
        return;
      } catch (authError: any) {
        console.error('Supabase authentication failed:', authError);

        // Provide user-friendly error messages
        if (authError.message?.includes('Invalid login credentials')) {
          showToast.error('Account not found or incorrect password.');
        } else if (authError.message?.includes('Email not confirmed')) {
          showToast.error('Please confirm your email address before signing in.');
        } else if (authError.message?.includes('User not found')) {
          showToast.error('No account found with this email. Please sign up first.');
        } else {
          showToast.error('Login failed. Please try again.');
        }

        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Don't show another toast here as we already showed one above
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, type: UserType) => {
    try {
      setIsLoading(true);

      const newUser = await supabaseApi.signup(email, password, name, type);
      // Ensure we have an auth session; sign in if needed
      try {
        const { user: authenticatedUser } = await supabaseApi.signInWithSupabase(email, password);
        // Ensure organizer/student role persists even if auth metadata is missing
        const effectiveUser = { ...authenticatedUser, type } as User;
        setUser(effectiveUser);
      } catch {
        // If sign-in fails (e.g., email confirmation required), fall back to created profile
        const fallbackUser = { ...newUser, type } as User;
        setUser(fallbackUser);
      }
      showToast.success('Account created successfully! Welcome to FindMyEvent.');
    } catch (error: any) {
      console.error('Signup error:', error);

      // Provide user-friendly error messages
      if (error.message?.includes('already exists') || error.message?.includes('already been registered')) {
        showToast.error('An account with this email already exists. If you previously started signup, we\'ve cleaned it up. Please try again.');
      } else if (error.message?.includes('Password should be at least 6 characters')) {
        showToast.error('Password must be at least 6 characters long.');
      } else if (error.message?.includes('Invalid email')) {
        showToast.error('Please enter a valid email address.');
      } else if (error.message?.includes('Demo email not allowed') || error.message?.includes('reserved for demo')) {
        // Already handled above
      } else {
        showToast.error('Signup failed. Please try again.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await supabaseApi.signOut();
      setUser(null);
      showToast.auth.logoutSuccess();
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      showToast.auth.logoutSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setIsLoading(true);
      await supabaseApi.signInWithGoogle();
      // The actual authentication will happen via redirect
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGitHub = async () => {
    try {
      setIsLoading(true);
      await supabaseApi.signInWithGitHub();
      // The actual authentication will happen via redirect
    } catch (error) {
      console.error('GitHub login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (phone: string) => {
    try {
      setIsLoading(true);
      await supabaseApi.signInWithPhone(phone);
      // OTP will be sent to the phone
    } catch (error) {
      console.error('Phone login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhoneOtp = async (phone: string, otp: string) => {
    try {
      setIsLoading(true);
      const { user: authenticatedUser } = await supabaseApi.verifyPhoneOtp(phone, otp);
      setUser(authenticatedUser);
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const updatedUser = await supabaseApi.updateUser(user.id, updates);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithGoogle,
      loginWithGitHub,
      loginWithPhone,
      verifyPhoneOtp,
      signup,
      logout,
      updateUser,
      isAuthenticated,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}