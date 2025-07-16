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
    console.log(`[Auth] loadUserProfile: querying for userId: ${userId}`);
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
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setLoading(true);
      console.log('[Auth] Initializing auth...');

      const { data: { session: currentSession } } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        console.log('[Auth] Auth state changed: SIGNED_IN', currentSession.user.email);
        let profile = await loadUserProfile(currentSession.user.id);

        // Auto-create admin profiles if they don't exist
        if (!profile && currentSession.user.email === 'admin@vignanits.ac.in') {
          console.log('[Auth] Auto-creating admin profile...');
          const { error: adminInsertError } = await supabase.from('user_profiles').insert({
            id: currentSession.user.id,
            email: currentSession.user.email,
            role: 'admin',
            status: 'approved',
          });
          if (adminInsertError) {
            console.error('[Auth] Admin auto-creation error:', adminInsertError);
          } else {
            profile = await loadUserProfile(currentSession.user.id); // Reload profile after auto-creation
          }
        }

        setUserProfile(profile);
        setNeedsProfileCreation(!profile && currentSession.user.user_metadata?.role === 'student');

        if (profile?.role === 'student' && profile.status === 'approved') {
          setLocation('/student-dashboard');
        } else if (profile?.role === 'admin' && profile.status === 'approved') {
          setLocation('/admin-dashboard');
        }
      } else {
        console.log('[Auth] Auth state changed: SIGNED_OUT or INITIAL_SESSION (no user)');
        setUserProfile(null);
        setNeedsProfileCreation(false);
      }

      if (isMounted) {
        setLoading(false);
        console.log('[Auth] Auth initialization complete.');
      }
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[Auth] Auth state changed:', _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);

      setTimeout(async () => {
        if (!session?.user) {
          setUserProfile(null);
          setNeedsProfileCreation(false);
          console.log('[Auth] Auth state processing complete (no user in session).');
          return;
        }

        let profile = await loadUserProfile(session.user.id);

        // Same admin auto-creation logic for state changes
        if (!profile && session.user.email === 'admin@vignanits.ac.in') {
          console.log('[Auth] Auto-creating admin profile on state change...');
          const { error: adminInsertError } = await supabase.from('user_profiles').insert({
            id: session.user.id,
            email: session.user.email,
            role: 'admin',
            status: 'approved',
          });
          if (adminInsertError) {
            console.error('[Auth] Admin auto-creation error on state change:', adminInsertError);
          } else {
            profile = await loadUserProfile(session.user.id); // Reload profile after auto-creation
          }
        }

        setUserProfile(profile);
        setNeedsProfileCreation(!profile && session.user.user_metadata?.role === 'student');

        if (profile?.role === 'student' && profile.status === 'approved') {
          setLocation('/student-dashboard');
        } else if (profile?.role === 'admin' && profile.status === 'approved') {
          setLocation('/admin-dashboard');
        }
        console.log('[Auth] Auth state processing complete.');
      }, 0); // Using setTimeout to ensure state updates are batched/processed
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, userType: 'student' | 'admin') => {
    try {
      console.log(`[Auth] Attempting login for ${userType} with email: ${email}`);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[Auth] Login failed:', error.message);
        throw error;
      }

      if (data.user) {
        console.log('[Auth] Login successful for user ID:', data.user.id);
        let profile = await loadUserProfile(data.user.id);
        // Sometimes profile might not be immediately available, retry after a short delay
        if (!profile) {
          console.log('[Auth] Profile not found immediately after login, retrying...');
          await new Promise((res) => setTimeout(res, 1000)); // Wait 1 second
          profile = await loadUserProfile(data.user.id);
        }

        setUser(data.user);
        setUserProfile(profile);

        if (!profile && userType === 'student') {
          setNeedsProfileCreation(true);
          toast({ title: 'Complete Profile', description: 'Please complete your student profile.' });
          console.log('[Auth] Student needs profile creation.');
          return; // Stop further redirection if profile is incomplete
        }

        if (profile?.role === 'admin') {
          setLocation('/admin-dashboard');
          console.log('[Auth] Redirecting to admin dashboard.');
        } else if (profile?.role === 'student') {
          setLocation('/student-dashboard');
          console.log('[Auth] Redirecting to student dashboard.');
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
      console.log(`[Auth] Attempting sign up for ${userType} with email: ${email}`);

      if (userType === 'student') {
        console.log(`[Auth] Verifying student: HT No: ${htNo}, Name: ${studentName}, Year: ${year}`);
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
        console.error('[Auth] Supabase signUp error:', error.message);
        return { error };
      }

      const userId = data.user?.id;
      // const userEmail = data.user?.email; // This line is no longer strictly needed for the insert

      console.log('[Auth] Supabase sign up initiated. User ID:', userId, 'User email from auth:', data.user?.email, 'Confirmation needed:', data.user?.email_confirmed_at === null);

      // Explicitly check for userId being present
      if (!userId) {
        console.error('[Auth] Sign-up succeeded but user ID missing after Supabase call.');
        return { error: { message: 'Sign-up succeeded but user ID missing.' } };
      }

      const insertData: any = {
        id: userId,
        email: email, // ✅ FIXED: Using the 'email' argument passed to the function
        role: userType,
        status: 'approved', // Default status upon sign-up
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
        console.error('[Auth] Insert error details:', insertError.message); // Log the specific error message
        console.error('[Auth] Insert error hint:', insertError.hint);     // Log error hint
        return { error: insertError };
      }
      console.log('[Auth] User profile inserted successfully.');

      // VERIFY PROFILE IMMEDIATELY AFTER INSERT
      const newlyInsertedProfile = await loadUserProfile(userId);
      console.log('[Auth] Verifying profile immediately after insert:', newlyInsertedProfile);

      // Set user and profile state (this might cause another loadUserProfile due to useEffect)
      setUserProfile(newlyInsertedProfile); // Use the newly fetched profile directly
      setUser(data.user);

      if (newlyInsertedProfile?.role === 'student') {
        setLocation('/student-dashboard');
        console.log('[Auth] Redirecting to student dashboard after sign-up.');
      } else if (newlyInsertedProfile?.role === 'admin') {
        setLocation('/admin-dashboard');
        console.log('[Auth] Redirecting to admin dashboard after sign-up.');
      }

      toast({ title: 'Account created', description: 'Welcome!' });

      return { error: null };
    } catch (error: any) {
      console.error('[Auth] General signUp catch error:', error);
      return { error: { message: error.message || 'An unexpected error occurred during sign up.' } };
    }
  };

  const createProfile = async (profileData: { ht_no: string; student_name: string; year: string }) => {
    if (!user) throw new Error('User not authenticated');
    console.log('[Auth] Attempting to create/update student profile for user:', user.id);

    const { error } = await supabase
      .from('user_profiles')
      .update({
        ht_no: profileData.ht_no,
        student_name: profileData.student_name,
        year: profileData.year,
        status: 'approved', // Assuming this means profile is now complete
      })
      .eq('id', user.id);

    if (error) {
      console.error('[Auth] Error updating student profile:', error);
      throw error;
    }

    console.log('[Auth] Student profile updated. Refreshing session...');
    await supabase.auth.refreshSession(); // Ensure session data is up-to-date

    const updatedProfile = await loadUserProfile(user.id);
    setUserProfile(updatedProfile);
    setNeedsProfileCreation(false); // No longer needs profile creation

    if (updatedProfile?.role === 'student') {
      setLocation('/student-dashboard');
      console.log('[Auth] Redirecting to student dashboard after profile creation.');
    }

    toast({ title: 'Profile created successfully' });
  };

  const closeProfileCreationModal = () => {
    setNeedsProfileCreation(false);
    console.log('[Auth] Profile creation modal closed.');
  }

  const logout = async () => {
    console.log('[Auth] Attempting logout...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Auth] Logout error:', error);
    } else {
      console.log('[Auth] Logout successful.');
    }
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
