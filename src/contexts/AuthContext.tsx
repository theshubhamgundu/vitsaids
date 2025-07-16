// AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter'; // Assuming wouter for routing

interface UserProfile {
    id: string;
    role: string;
    status: string;
    student_name: string | null;
    ht_no: string | null;
    year: string | null;
    email: string;
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
    refreshUserProfile: () => Promise<void>;
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

    const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
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
    }, []);

    const refreshUserProfile = useCallback(async () => {
        if (user) {
            console.log('[Auth] Refreshing user profile...');
            const profile = await loadUserProfile(user.id);
            setUserProfile(profile);
            setNeedsProfileCreation(!profile && user.user_metadata?.role === 'student');
            console.log('[Auth] User profile refreshed:', profile);
        }
    }, [user, loadUserProfile]);

    // Main effect for initial load and authentication state changes
    useEffect(() => {
        let isMounted = true;
        const cleanupFunctions: (() => void)[] = [];

        const initializeAuth = async () => {
            setLoading(true); // Start loading
            console.log('[Auth] Initializing auth...');
            let profile: UserProfile | null = null; // Declare profile here

            try {
                const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

                if (!isMounted) return; // Exit if unmounted during async operation

                if (sessionError) {
                    console.error('[Auth] Error getting initial session:', sessionError);
                }

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    console.log('[Auth] Found current user:', currentSession.user.email);
                    profile = await loadUserProfile(currentSession.user.id);

                    if (!isMounted) return; // Exit if unmounted

                    // Auto-create admin profiles if they don't exist
                    if (!profile && currentSession.user.email === 'admin@vignanits.ac.in') {
                        console.log('[Auth] Auto-creating admin profile during initialization...');
                        const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                            id: currentSession.user.id,
                            email: currentSession.user.email,
                            role: 'admin',
                            status: 'approved',
                        });
                        if (adminInsertError) {
                            console.error('[Auth] Admin auto-creation error during init:', adminInsertError);
                        } else {
                            profile = await loadUserProfile(currentSession.user.id); // Reload profile
                            if (isMounted) {
                                toast({ title: 'Admin profile created', description: 'Welcome, administrator!' });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('[Auth] Error during initializeAuth:', e);
            } finally {
                if (isMounted) {
                    setUserProfile(profile); // Ensure profile is set after all attempts
                    setNeedsProfileCreation(!profile && user?.user_metadata?.role === 'student'); // Use user from state
                    setLoading(false); // End loading definitively
                    console.log('[Auth] Auth initialization complete. Final loading state:', false);
                }
            }
        };

        initializeAuth();

        // Listen for auth state changes (e.g., login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('[Auth] Auth state changed via listener:', _event, session?.user?.email);

            if (!isMounted) return;

            setLoading(true); // Re-activate loading state during auth state change processing

            let newProfile: UserProfile | null = null;
            try {
                setSession(session);
                setUser(session?.user ?? null);

                if (session?.user) {
                    newProfile = await loadUserProfile(session.user.id);

                    if (!isMounted) return;

                    // Handle admin auto-creation on state change if needed
                    if (!newProfile && session.user.email === 'admin@vignanits.ac.in') {
                        console.log('[Auth] Auto-creating admin profile on state change listener (if not found)...');
                        const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                            id: session.user.id,
                            email: session.user.email,
                            role: 'admin',
                            status: 'approved',
                        });
                        if (adminInsertError) {
                            console.error('[Auth] Admin auto-creation error on state change listener:', adminInsertError);
                        } else {
                            newProfile = await loadUserProfile(session.user.id); // Reload profile
                            if (isMounted) {
                                toast({ title: 'Admin profile created', description: 'Welcome, administrator!' });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('[Auth] Error during onAuthStateChange processing:', e);
            } finally {
                if (isMounted) {
                    setUserProfile(newProfile); // Ensure profile is set
                    setNeedsProfileCreation(!newProfile && session?.user?.user_metadata?.role === 'student');
                    setLoading(false); // End loading definitively
                    console.log('[Auth] Auth state processing complete via listener. Final loading state:', false);
                }
            }
        });

        cleanupFunctions.push(() => subscription.unsubscribe());

        return () => {
            isMounted = false;
            cleanupFunctions.forEach(func => func());
        };
    }, [loadUserProfile, toast, user]); // Added 'user' to dependencies as `setNeedsProfileCreation` now potentially uses `user.user_metadata`

    const login = async (email: string, password: string, userType: 'student' | 'admin') => {
        setLoading(true);
        try {
            console.log(`[Auth] Attempting login for ${userType} with email: ${email}`);
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.error('[Auth] Login failed:', error.message);
                toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
                throw error;
            }

            if (data.user) {
                console.log('[Auth] Login successful for user ID:', data.user.id);
                let profile = await loadUserProfile(data.user.id);
                if (!profile) {
                    console.log('[Auth] Profile not found immediately after login, retrying (1s delay)...');
                    await new Promise((res) => setTimeout(res, 1000));
                    profile = await loadUserProfile(data.user.id);
                }

                setUser(data.user);
                setUserProfile(profile);

                if (!profile && userType === 'student') {
                    setNeedsProfileCreation(true);
                    toast({ title: 'Complete Profile', description: 'Please complete your student profile.' });
                    console.log('[Auth] Student needs profile creation. Showing modal or redirecting to profile completion page.');
                } else if (profile?.role === 'admin' && profile.status === 'approved') {
                    toast({ title: 'Login Successful', description: 'Redirecting to Admin Dashboard.' });
                    setLocation('/admin-dashboard');
                    console.log('[Auth] Redirecting to admin dashboard.');
                } else if (profile?.role === 'student' && profile.status === 'approved') {
                    toast({ title: 'Login Successful', description: 'Redirecting to Student Dashboard.' });
                    setLocation('/student-dashboard');
                    console.log('[Auth] Redirecting to student dashboard.');
                } else {
                    toast({ title: 'Login Successful', description: 'Access denied or profile incomplete. Contact admin.' });
                    setLocation('/');
                    console.log('[Auth] Login successful but unexpected profile state. Redirecting to home.');
                }
            } else {
                console.warn('[Auth] Login succeeded without user data or error.');
                toast({ title: 'Login issue', description: 'Login successful, but no user data found.', variant: 'destructive' });
                setLocation('/');
            }
        } catch (err: any) {
            console.error('[Auth] Login caught error:', err);
        } finally {
            setLoading(false);
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
        setLoading(true);
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
                    toast({ title: 'Verification Failed', description: 'Student not found in verified list. Contact admin.', variant: 'destructive' });
                    return { error: { message: 'Student not found in verified list. Contact admin.' } };
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
                toast({ title: 'Signup Error', description: error.message, variant: 'destructive' });
                return { error };
            }

            const userId = data.user?.id;
            console.log('[Auth] Supabase sign up initiated. User ID:', userId, 'User email from auth:', data.user?.email, 'Confirmation needed:', data.user?.email_confirmed_at === null);

            if (!userId) {
                console.error('[Auth] Sign-up succeeded but user ID missing after Supabase call.');
                toast({ title: 'Signup Error', description: 'Sign-up succeeded but user ID missing.', variant: 'destructive' });
                return { error: { message: 'Sign-up succeeded but user ID missing.' } };
            }

            const insertData: any = {
                id: userId,
                email: email,
                role: userType,
                status: userType === 'admin' ? 'approved' : 'pending',
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
                console.error('[Auth] Insert error details:', insertError.message);
                console.error('[Auth] Insert error hint:', insertError.hint);
                toast({ title: 'Profile Creation Error', description: insertError.message, variant: 'destructive' });
                await supabase.auth.signOut();
                return { error: insertError };
            }
            console.log('[Auth] User profile inserted successfully.');

            let newlyInsertedProfile = await loadUserProfile(userId);
            if (!newlyInsertedProfile) {
                console.log('[Auth] Profile not found immediately after insert, retrying after a short delay (1s)...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                newlyInsertedProfile = await loadUserProfile(userId);
                if (!newlyInsertedProfile) {
                    console.error('[Auth] Profile still null after retry. This might lead to profile creation prompt.');
                }
            }
            console.log('[Auth] Verifying profile immediately after insert (after retry):', newlyInsertedProfile);

            setUserProfile(newlyInsertedProfile);
            setUser(data.user);

            if (newlyInsertedProfile?.role === 'student' && newlyInsertedProfile.status === 'approved') {
                toast({ title: 'Account created', description: 'Redirecting to Student Dashboard.' });
                setLocation('/student-dashboard');
                console.log('[Auth] Redirecting to student dashboard after sign-up.');
            } else if (newlyInsertedProfile?.role === 'admin' && newlyInsertedProfile.status === 'approved') {
                toast({ title: 'Account created', description: 'Redirecting to Admin Dashboard.' });
                setLocation('/admin-dashboard');
                console.log('[Auth] Redirecting to admin dashboard after sign-up.');
            } else {
                toast({ title: 'Account created', description: 'Profile status pending review or role not recognized. You may need to complete your profile or wait for approval.' });
                setLocation('/');
                console.log('[Auth] Sign-up complete, but profile status pending or role unrecognized. Redirecting to home.');
            }

            return { error: null };
        } catch (error: any) {
            console.error('[Auth] General signUp catch error:', error);
            toast({ title: 'Signup Failed', description: error.message || 'An unexpected error occurred during sign up.', variant: 'destructive' });
            return { error: { message: error.message || 'An unexpected error occurred during sign up.' } };
        } finally {
            setLoading(false);
        }
    };

    const createProfile = async (profileData: { ht_no: string; student_name: string; year: string }) => {
        if (!user) {
            toast({ title: 'Error', description: 'User not authenticated to create profile.', variant: 'destructive' });
            throw new Error('User not authenticated');
        }
        setLoading(true);
        console.log('[Auth] Attempting to create/update student profile for user:', user.id);

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    ht_no: profileData.ht_no,
                    student_name: profileData.student_name,
                    year: profileData.year,
                    status: 'approved',
                })
                .eq('id', user.id);

            if (error) {
                console.error('[Auth] Error updating student profile:', error);
                toast({ title: 'Profile Update Failed', description: error.message, variant: 'destructive' });
                throw error;
            }

            console.log('[Auth] Student profile updated. Refreshing context state...');
            await refreshUserProfile();

            setNeedsProfileCreation(false);

            // Important: userProfile might still be null here *immediately* after refreshUserProfile()
            // because state updates are async. The dashboard component should react to the state.
            // If you need *immediate* guaranteed redirection here based on the *very latest* profile,
            // you should check the profile returned by refreshUserProfile or fetched within this function.
            // However, it's generally better to let the dashboard handle this, or have refreshUserProfile
            // return the profile and use that. For simplicity, we'll let the dashboard react.

            toast({ title: 'Profile created successfully', description: 'Welcome to your dashboard!' });
            setLocation('/student-dashboard'); // Explicitly redirect here after successful profile creation
            console.log('[Auth] Redirecting to student dashboard after profile creation.');

        } catch (error: any) {
            console.error('[Auth] General createProfile catch error:', error);
            toast({ title: 'Profile Update Failed', description: error.message || 'An unexpected error occurred during profile update.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const closeProfileCreationModal = () => {
        setNeedsProfileCreation(false);
        console.log('[Auth] Profile creation modal closed.');
    };

    const logout = async () => {
        setLoading(true);
        try {
            console.log('[Auth] Attempting logout...');
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('[Auth] Logout error:', error);
                toast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
            } else {
                console.log('[Auth] Logout successful.');
                toast({ title: 'Logged out' });
            }
        } catch (error) {
            console.error('[Auth] Logout caught error:', error);
        } finally {
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLocation('/');
            setLoading(false);
        }
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
                refreshUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
