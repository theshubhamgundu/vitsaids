import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface UserProfile {
  id: string;
  role: string;
  status: string;
  student_name: string | null;
  ht_no: string | null;
  year: string | null;
  email?: string | null;
  phone?: string | null;
  section?: string | null;
  semester?: string | null;
  cgpa?: number | null;
  photo_url?: string | null;
  address?: string | null;
  emergency_no?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  needsProfileCreation: boolean;
  login: (email: string, password: string, userType: 'student' | 'admin') => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userType: 'student' | 'admin',
    htNo?: string,
    studentName?: string,
    year?: string
  ) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  createProfile: (profileData: { ht_no: string; student_name: string; year: string }) => Promise<void>;
  closeProfileCreationModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [needsProfileCreation, setNeedsProfileCreation] = useState(false);
  const [loading, setLoading] = useState(true);

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('[Auth] loadUserProfile: querying for userId:', userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] loadUserProfile error:', error);
        return null;
      }

      console.log('[Auth] loadUserProfile result:', data);
      return data || null;
    } catch (error) {
      console.error('[Auth] loadUserProfile exception:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      console.log('[Auth] Initializing auth...');
      setLoading(true);

      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data.session;
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          let profile = await loadUserProfile(currentSession.user.id);
          
          // Auto-create admin profile if it doesn't exist
          if (!profile && currentSession.user.email === 'admin@vignanits.ac.in') {
            const { error } = await supabase.from('user_profiles').insert({
              id: currentSession.user.id,
              role: 'admin',
              status: 'approved'
            });
            
            if (!error) {
              profile = await loadUserProfile(currentSession.user.id);
            }
          }
          
          setUserProfile(profile);

          if (!profile && currentSession.user.user_metadata?.role === 'student') {
            setNeedsProfileCreation(true);
          } else {
            setNeedsProfileCreation(false);
          }
        } else {
          setUserProfile(null);
          setNeedsProfileCreation(false);
        }
      } catch (err) {
        console.error('[Auth] initAuth failed:', err);
        setUser(null);
        setUserProfile(null);
        setNeedsProfileCreation(false);
      } finally {
        if (isMounted) {
          setLoading(false);
          console.log('[Auth] Auth initialization complete.');
        }
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth] Auth state changed:', _event, session?.user?.email || 'no user');
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);

      // Use setTimeout to prevent blocking the auth state change callback
      setTimeout(async () => {
        if (!isMounted) return;
        
        if (session?.user) {
          let profile = await loadUserProfile(session.user.id);
          
          // Auto-create admin profile if it doesn't exist
          if (!profile && session.user.email === 'admin@vignanits.ac.in') {
            console.log('[Auth] Creating admin profile...');
            const { error } = await supabase.from('user_profiles').insert({
              id: session.user.id,
              role: 'admin',
              status: 'approved'
            });
            
            if (!error) {
              profile = await loadUserProfile(session.user.id);
            }
          }
          
          if (isMounted) {
            setUserProfile(profile);
            setNeedsProfileCreation(!profile && session.user.user_metadata?.role === 'student');
          }
        } else {
          if (isMounted) {
            setUserProfile(null);
            setNeedsProfileCreation(false);
          }
        }

        if (isMounted) {
          setLoading(false);
          console.log('[Auth] Auth state processing complete');
        }
      }, 0);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
      console.log('[Auth] Cleaned up auth listener.');
    };
  }, []);

  const login = async (email: string, password: string, userType: 'student' | 'admin') => {
    try {
      console.log('[Auth] Login attempt:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const profile = await loadUserProfile(data.user.id);
        setUser(data.user);
        setUserProfile(profile);

        if (!profile && userType === 'student') {
          setNeedsProfileCreation(true);
          toast({ title: 'Create your profile', description: 'Complete your student profile.' });
          return;
        }

        // ✅ NEW: Auto-redirect logic - bypass status check
        if (profile?.role === 'admin') {
          setLocation('/admin-dashboard');
        } else if (profile?.role === 'student') {
          // ✅ CHANGED: Remove status check, redirect directly to dashboard
          setLocation('/student-dashboard');
        }

        toast({ title: 'Login successful', description: 'Welcome back!' });
      }
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.message || 'Unknown error' });
      console.error('[Auth] Login failed:', err);
      throw err;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userType: 'student' | 'admin',
    htNo?: string,
    studentName?: string,
    year?: string
  ): Promise<{ error: any }> => {
    try {
      let verified: any = null;

      if (userType === 'student') {
        // Verify student details match verified_students table
        const { data, error: verifyError } = await supabase
          .from('verified_students')
          .select('*')
          .ilike('ht_no', htNo?.trim() || '')
          .ilike('student_name', studentName?.trim() || '')
          .ilike('year', year?.trim() || '')
          .maybeSingle();

        if (verifyError || !data) {
          return { error: { message: 'Student details not found in verified students list. Please check your information or contact admin.' } };
        }

        verified = data;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: userType } },
      });

      if (error) return { error };

      if (data.user) {
        const insertData: any = {
          id: data.user.id,
          role: userType,
          // ✅ CHANGED: Set status to 'approved' for students to bypass approval
          status: 'approved', // Previously: userType === 'admin' ? 'approved' : 'pending'
        };

        if (userType === 'student') {
          insertData.ht_no = htNo;
          insertData.student_name = studentName;
          insertData.year = year;
        }

        const { error: insertError } = await supabase.from('user_profiles').insert(insertData);
        if (insertError) return { error: insertError };

        toast({
          title: 'Account created',
          description:
            userType === 'admin'
              ? 'Admin account created successfully.'
              : 'Student account created successfully. You can now access your dashboard.',
        });
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const createProfile = async (profileData: {
    ht_no: string;
    student_name: string;
    year: string;
  }) => {
    if (!user) throw new Error('User not authenticated for profile creation');

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ht_no: profileData.ht_no,
        student_name: profileData.student_name,
        year: profileData.year,
        // ✅ CHANGED: Set status to 'approved' immediately
        status: 'approved', // Previously: 'pending'
      })
      .eq('id', user.id);

    if (error) throw error;

    const updatedProfile = await loadUserProfile(user.id);
    setUserProfile(updatedProfile);
    setNeedsProfileCreation(false);

    toast({
      title: 'Profile created',
      description: 'Your profile has been created successfully.',
    });
  };

  const closeProfileCreationModal = () => {
    setNeedsProfileCreation(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setNeedsProfileCreation(false);
    setLocation('/');
    toast({ title: 'Logged out', description: 'You have been signed out.' });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        needsProfileCreation,
        login,
        signUp,
        logout,
        createProfile,
        closeProfileCreationModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
