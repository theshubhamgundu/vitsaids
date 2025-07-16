// AuthContext.tsx
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
  email: string; // Changed to non-nullable as per DB constraint
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
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Auth] loadUserProfile error:', error);
      return null;
    }

    return data || null;
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setLoading(true);

      const { data: { session: currentSession } } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        let profile = await loadUserProfile(currentSession.user.id);

        if (!profile && currentSession.user.email === 'admin@vignanits.ac.in') {
          // This block is for auto-creating admin profiles if they don't exist
          // It explicitly sets 'email'
          await supabase.from('user_profiles').insert({
            id: currentSession.user.id,
            email: currentSession.user.email, // Email is provided here
            role: 'admin',
            status: 'approved',
          });
          profile = await loadUserProfile(currentSession.user.id);
        }

        setUserProfile(profile);
        setNeedsProfileCreation(!profile && currentSession.user.user_metadata?.role === 'student');

        if (profile?.role === 'student' && profile.status === 'approved') {
          setLocation('/student-dashboard');
        } else if (profile?.role === 'admin' && profile.status === 'approved') {
          setLocation('/admin-dashboard');
        }
      } else {
        setUserProfile(null);
        setNeedsProfileCreation(false);
      }

      if (isMounted) setLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      setTimeout(async () => {
        if (!session?.user) {
          setUserProfile(null);
          setNeedsProfileCreation(false);
          return;
        }

        let profile = await loadUserProfile(session.user.id);

        if (!profile && session.user.email === 'admin@vignanits.ac.in') {
          // Same admin auto-creation logic
          await supabase.from('user_profiles').insert({
            id: session.user.id,
            email: session.user.email, // Email is provided here
            role: 'admin',
            status: 'approved',
          });
          profile = await loadUserProfile(session.user.id);
        }

        setUserProfile(profile);
        setNeedsProfileCreation(!profile && session.user.user_metadata?.role === 'student');

        if (profile?.role === 'student' && profile.status === 'approved') {
          setLocation('/student-dashboard');
        } else if (profile?.role === 'admin' && profile.status === 'approved') {
          setLocation('/admin-dashboard');
        }
      }, 0);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, userType: 'student' | 'admin') => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        let profile = await loadUserProfile(data.user.id);
        if (!profile) {
          await new Promise((res) => setTimeout(res, 1000));
          profile = await loadUserProfile(data.user.id);
        }

        setUser(data.user);
        setUserProfile(profile);

        if (!profile && userType === 'student') {
          setNeedsProfileCreation(true);
          toast({ title: 'Complete Profile', description: 'Please complete your student profile.' });
          return;
        }

        if (profile?.role === 'admin') {
          setLocation('/admin-dashboard');
        } else if (profile?.role === 'student') {
          setLocation('/student-dashboard');
        }

        toast({ title: 'Login Successful' });
      }
    } catch (err: any) {
      toast({ title: 'Login failed', description: err.message });
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
      if (userType === 'student') {
        const { data, error: verifyError } = await supabase
          .from('verified_students')
          .select('*')
          .ilike('ht_no', htNo || '')
          .ilike('student_name', studentName || '')
          .ilike('year', year || '')
          .maybeSingle();

        if (verifyError || !data) {
          console.error('[Auth] Student verification failed:', verifyError || 'No data found');
          return {
            error: {
              message: 'Student not found in verified list. Contact admin.',
            },
          };
        }
        console.log('[Auth] Student verification successful:', data);
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role: userType } },
      });

      if (error) {
        console.error('[Auth] Supabase signUp error:', error);
        return { error };
      }

      const userId = data.user?.id;
      // const userEmail = data.user?.email; // This line is no longer strictly needed for the insert

      console.log('[Auth] SignUp successful. userId:', userId, 'userEmail (from data.user):', data.user?.email); // Keep for debugging if needed

      // Explicitly check for userId being present
      if (!userId) {
        console.error('[Auth] Sign-up succeeded but user ID missing after Supabase call.');
        return { error: { message: 'Sign-up succeeded but user ID missing.' } };
      }

      const insertData: any = {
        id: userId,
        email: email, // ✅ FIXED: Use the 'email' argument passed to the function
        role: userType,
        status: 'approved',
      };

      if (userType === 'student') {
        insertData.ht_no = htNo;
        insertData.student_name = studentName;
        insertData.year = year;
      }

      console.log('[Auth] Attempting to insert user profile with data:', insertData);

      const { error: insertError } = await supabase.from('user_profiles').insert(insertData);
      if (insertError) {
        console.error('[Auth] Error inserting user profile:', insertError);
        return { error: insertError };
      }
      console.log('[Auth] User profile inserted successfully.');

      const profile = await loadUserProfile(userId);
      setUserProfile(profile);
      setUser(data.user);

      if (profile?.role === 'student') {
        setLocation('/student-dashboard');
      } else if (profile?.role === 'admin') {
        setLocation('/admin-dashboard');
      }

      toast({ title: 'Account created', description: 'Welcome!' });

      return { error: null };
    } catch (error: any) {
      console.error('[Auth] General signUp catch error:', error);
      return { error };
    }
  };

  const createProfile = async (profileData: { ht_no: string; student_name: string; year: string }) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ht_no: profileData.ht_no,
        student_name: profileData.student_name,
        year: profileData.year,
        status: 'approved',
      })
      .eq('id', user.id);

    if (error) throw error;

    await supabase.auth.refreshSession();

    const updatedProfile = await loadUserProfile(user.id);
    setUserProfile(updatedProfile);
    setNeedsProfileCreation(false);

    if (updatedProfile?.role === 'student') {
      setLocation('/student-dashboard');
    }

    toast({ title: 'Profile created successfully' });
  };

  const closeProfileCreationModal = () => setNeedsProfileCreation(false);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setNeedsProfileCreation(false);
    setLocation('/');
    toast({ title: 'Logged out' });
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
