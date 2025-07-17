// AuthContext.tsx - Fixed for Session Persistence
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

interface UserProfile {
    id: string;
    role: 'student' | 'admin' | 'faculty' | 'none';
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
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
    created_at?: string;
    updated_at?: string;
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
        // Removed userType from signUp parameters as it's implied for students,
        // and htNo/studentName/year are specific to students.
        // Admin signup is handled by a fixed email or separate flow.
        studentName?: string, // Made optional for robust handling
        htNo?: string,        // Made optional for robust handling
        year?: string         // Made optional for robust handling
    ) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    createProfile: (profileData: { phone?: string; address?: string; emergency_no?: string; ht_no?: string; student_name?: string; year?: string; }) => Promise<void>;
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
    const [initialized, setInitialized] = useState(false); // Indicates if initial auth check is complete

    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        try {
            console.log(`[Auth] loadUserProfile: Attempting to load profile for userId: ${userId}`);

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error(`[Auth] loadUserProfile error for userId ${userId}:`, error.message);
                if (error.code === 'PGRST116') {
                    console.warn(`[Auth] loadUserProfile: No profile found for userId ${userId}. This is expected for new users.`);
                }
                return null;
            }

            if (!data) {
                console.log(`[Auth] loadUserProfile: No data returned for userId ${userId}.`);
                return null;
            }

            console.log(`[Auth] loadUserProfile: Profile found for userId ${userId}:`, data);
            return data as UserProfile;
        } catch (error) {
            console.error(`[Auth] loadUserProfile: Unexpected error for userId ${userId}:`, error);
            return null;
        }
    }, []);

    const validateSession = useCallback(async (): Promise<{ user: User | null; session: Session | null }> => {
        try {
            console.log('[Auth] Validating session...');

            // Fetch the current session
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('[Auth] Session error:', sessionError);
                return { user: null, session: null };
            }

            if (!sessionData.session) {
                console.log('[Auth] No session found from getSession().');
                return { user: null, session: null };
            }

            // Fetch the user data using the session
            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.error('[Auth] User validation error:', userError);
                return { user: null, session: null };
            }

            if (!userData.user) {
                console.log('[Auth] No user found from getUser() despite having session.');
                return { user: null, session: null };
            }

            console.log('[Auth] Session validation successful:', {
                userId: userData.user.id,
                email: userData.user.email,
                role: userData.user.user_metadata?.role
            });

            return { user: userData.user, session: sessionData.session };
        } catch (error) {
            console.error('[Auth] Session validation failed:', error);
            return { user: null, session: null };
        }
    }, []);

    const refreshUserProfile = useCallback(async () => {
        if (!user?.id) {
            console.warn('[Auth] Cannot refresh profile: No user logged in. Clearing profile state.');
            setUserProfile(null);
            setNeedsProfileCreation(false);
            return;
        }

        try {
            console.log('[Auth] Refreshing user profile. User ID:', user.id);
            const profile = await loadUserProfile(user.id);

            if (profile) {
                setUserProfile(profile);
                setNeedsProfileCreation(false);
                console.log('[Auth] User profile refreshed: Profile found and set. needsProfileCreation=false');
            } else {
                const userAuthRole = user.user_metadata?.role;
                const needs = (!profile && userAuthRole === 'student');
                setNeedsProfileCreation(needs);
                setUserProfile(null);
                console.log(`[Auth] User profile refreshed: No profile found. needsProfileCreation=${needs} (User Role: ${userAuthRole})`);
            }
        } catch (error) {
            console.error('[Auth] Error refreshing user profile:', error);
            setUserProfile(null);
            setNeedsProfileCreation(false);
        }
    }, [user?.id, loadUserProfile]);

    const handleProfileCreation = useCallback(async (currentUser: User) => {
        if (!currentUser) return null;

        // Auto-create admin profile if needed
        if (currentUser.email === 'admin@vignanits.ac.in') {
            console.log('[Auth] Auto-creating admin profile for:', currentUser.email);
            try {
                const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                    id: currentUser.id,
                    email: currentUser.email,
                    role: 'admin',
                    status: 'approved',
                });

                if (adminInsertError && adminInsertError.code !== '23505') { // Ignore duplicate key error
                    console.error('[Auth] Admin auto-creation error:', adminInsertError);
                    return null;
                }

                // Wait a bit for DB consistency
                await new Promise(resolve => setTimeout(resolve, 500));
                const profile = await loadUserProfile(currentUser.id);

                if (profile) {
                    toast({ title: 'Admin profile created', description: 'Welcome, administrator!' });
                    return profile;
                }
            } catch (error) {
                console.error('[Auth] Error creating admin profile:', error);
            }
        }

        return null;
    }, [loadUserProfile, toast]);

    const handlePostAuthRedirect = useCallback((profile: UserProfile) => {
        const currentPath = window.location.pathname;

        console.log('[Auth] Handling post-auth redirect:', {
            currentPath,
            role: profile.role,
            status: profile.status
        });

        // Only redirect if not already on the correct page
        if (profile.role === 'admin' && profile.status === 'approved' && currentPath !== '/admin-dashboard') {
            console.log('[Auth] Redirecting to admin dashboard');
            setLocation('/admin-dashboard');
        } else if (profile.role === 'student' && profile.status === 'approved' && currentPath !== '/student-dashboard') {
            console.log('[Auth] Redirecting to student dashboard');
            setLocation('/student-dashboard');
        } else if (profile.status === 'pending' && currentPath !== '/') {
            console.log('[Auth] Redirecting to home (pending approval)');
            setLocation('/');
        }
    }, [setLocation]);

    // Initial auth state setup and listener for real-time changes
    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                console.log('[Auth] Initializing auth (initial load)...');
                setLoading(true); // Start loading

                const { user: validatedUser, session: validatedSession } = await validateSession();

                if (!isMounted) return;

                let currentProfile: UserProfile | null = null;

                if (validatedUser && validatedSession) {
                    console.log('[Auth] Valid session found during init:', validatedUser.email);

                    // Load existing profile
                    currentProfile = await loadUserProfile(validatedUser.id);

                    // If no profile exists, try to create one for admin
                    if (!currentProfile) {
                        currentProfile = await handleProfileCreation(validatedUser);
                    }

                    // Handle initial redirect after successful initialization
                    if (currentProfile) {
                        // Small delay to ensure UI is ready before redirecting
                        setTimeout(() => {
                            if (isMounted) {
                                handlePostAuthRedirect(currentProfile!);
                            }
                        }, 100);
                    }
                } else {
                    console.log('[Auth] No valid session found during init. Clearing state.');
                    // If no valid session, ensure state is clear
                    setUser(null);
                    setSession(null);
                    setUserProfile(null);
                    setNeedsProfileCreation(false);
                }

                if (isMounted) {
                    setSession(validatedSession);
                    setUser(validatedUser);
                    setUserProfile(currentProfile);

                    const userAuthRole = validatedUser?.user_metadata?.role;
                    const needs = (!currentProfile && userAuthRole === 'student');
                    setNeedsProfileCreation(needs);

                    console.log(`[Auth] Auth initialization complete. User: ${validatedUser?.email}, Profile: ${currentProfile ? 'Found' : 'Not Found'}, NeedsProfileCreation: ${needs}`);
                }
            } catch (error) {
                console.error('[Auth] Error during initializeAuth:', error);
                if (isMounted) {
                    setSession(null);
                    setUser(null);
                    setUserProfile(null);
                    setNeedsProfileCreation(false);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setInitialized(true); // Mark initial check as complete
                }
            }
        };

        initializeAuth();

        // Set up auth state listener for real-time changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Auth state changed via listener. Event: ${event}, User: ${session?.user?.email}`);

            if (!isMounted || !initialized) return; // Only process if component is mounted and initially loaded

            // Don't set loading for SIGNED_OUT events to prevent UI flicker
            if (event !== 'SIGNED_OUT') {
                setLoading(true);
            }

            try {
                const newUser = session?.user ?? null;
                let newProfile: UserProfile | null = null;

                setSession(session);
                setUser(newUser);

                if (newUser && session) {
                    console.log('[Auth] Listener: User present. Loading profile for:', newUser.email, 'ID:', newUser.id, 'Role:', newUser.user_metadata?.role);

                    // Load existing profile
                    newProfile = await loadUserProfile(newUser.id);

                    // If no profile exists, try to create one for admin
                    if (!newProfile) {
                        newProfile = await handleProfileCreation(newUser);
                    }

                    // Handle redirection for auth state changes (specifically on SIGNED_IN event)
                    if (newProfile && event === 'SIGNED_IN') {
                        handlePostAuthRedirect(newProfile);
                    }
                } else if (event === 'SIGNED_OUT') {
                    // Clear state completely on sign out
                    setUser(null);
                    setSession(null);
                    setUserProfile(null);
                    setNeedsProfileCreation(false);
                    setLocation('/'); // Redirect to home/login on explicit logout
                    console.log('[Auth] User signed out. State cleared and redirected.');
                }

                if (isMounted) {
                    setUserProfile(newProfile);
                    const newUserAuthRole = newUser?.user_metadata?.role;
                    const needs = (!newProfile && newUserAuthRole === 'student');
                    setNeedsProfileCreation(needs);

                    console.log(`[Auth] Listener: Auth state processing complete. Profile: ${newProfile ? 'Found' : 'Not Found'}, NeedsProfileCreation: ${needs}`);
                }
            } catch (error) {
                console.error('[Auth] Error during onAuthStateChange processing:', error);
                if (isMounted) {
                    setUserProfile(null);
                    setNeedsProfileCreation(false);
                }
            } finally {
                if (isMounted && event !== 'SIGNED_OUT') {
                    setLoading(false);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, [validateSession, loadUserProfile, handleProfileCreation, handlePostAuthRedirect, initialized]); // Added initialized to deps

    // NEW: Handle tab visibility changes to re-validate session and prevent spinner issues
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                console.log('[Auth] Tab became visible. Re-validating session...');
                setLoading(true); // Show spinner while re-validating
                try {
                    const { user: refreshedUser, session: refreshedSession } = await validateSession();

                    // Update state based on re-validation
                    setUser(refreshedUser);
                    setSession(refreshedSession);

                    if (refreshedUser) {
                        const profile = await loadUserProfile(refreshedUser.id);
                        setUserProfile(profile);
                        setNeedsProfileCreation(!profile && refreshedUser.user_metadata?.role === 'student');
                        console.log('[Auth] Session re-validated and profile reloaded on tab visibility.');
                    } else {
                        // If session is no longer valid, clear state
                        setUserProfile(null);
                        setNeedsProfileCreation(false);
                        console.log('[Auth] Session not found after tab switch. State cleared.');
                        // Optional: Redirect to login if needed. Current setup relies on the redirect useEffect below.
                    }
                } catch (error) {
                    console.error('[Auth] Error during visibility change re-validation:', error);
                    setUser(null);
                    setSession(null);
                    setUserProfile(null);
                    setNeedsProfileCreation(false);
                } finally {
                    setLoading(false); // Hide spinner
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [validateSession, loadUserProfile]); // Dependencies for this effect

    // NEW: Redirect to login/home if session is explicitly null after initial check is done
    useEffect(() => {
        // Only trigger if auth has been initialized AND there's no user/session
        if (initialized && !user && !session) {
            console.log('[Auth] Initial auth check complete, no valid user/session. Redirecting to home/login.');
            // Adjust this path to your actual login page if different from '/'
            // For example: setLocation('/login');
            setLocation('/');
        }
    }, [initialized, user, session, setLocation]);


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

            if (!data.user) {
                console.warn('[Auth] Login succeeded but no user data in response.');
                toast({ title: 'Login issue', description: 'Login successful, but no user data found.', variant: 'destructive' });
                return;
            }

            // RELOAD USER: Ensure we have the most up-to-date user object after sign-in
            // This also helps trigger onAuthStateChange more reliably for immediate state update
            const { data: userData, error: userReloadError } = await supabase.auth.getUser();
            if (userReloadError || !userData.user) {
                console.error('[Auth] Failed to reload user after login:', userReloadError);
                toast({ title: 'Login Error', description: 'Could not load user data after login. Please try again.', variant: 'destructive' });
                await supabase.auth.signOut(); // Force logout if user data is inconsistent
                return;
            }
            console.log("Reloaded user ID after login:", userData.user?.id);

            // The onAuthStateChange listener will handle updating context state and redirection.
            // No direct redirection logic here to prevent conflicts.

        } catch (err: any) {
            console.error('[Auth] Login caught error:', err);
            toast({ title: 'Login Failed', description: err.message || 'An unexpected error occurred during login.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // Updated signUp function with all suggested improvements
    const signUp = async (
        email: string,
        password: string,
        student_name: string,
        ht_no: string
    ): Promise<{ error: string | null }> => {
        try {
            setLoading(true);

            // Step 1: Sign up user
            const { data: userData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError || !userData.user) {
                toast({
                    title: 'Error creating account',
                    description: signUpError?.message || 'An unknown error occurred during signup.',
                    variant: 'destructive',
                });
                return { error: signUpError?.message || 'Signup failed' };
            }

            const { user } = userData;

            // Step 2: Sanitize input
            const trimmedName = student_name.trim();
            const trimmedHtNo = ht_no.trim().toUpperCase();

            // Step 3: Avoid inserting duplicate profile (safeguard)
            // Using maybeSingle to handle cases where no record is found gracefully
            const { data: existingProfile, error: existingProfileError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle(); // Changed from .single() to .maybeSingle() for robustness

            if (existingProfileError && existingProfileError.code !== 'PGRST116') { // PGRST116 means no rows found
                 console.error('[Auth] Error checking for existing profile:', existingProfileError);
                 toast({
                    title: 'Error checking profile',
                    description: existingProfileError.message,
                    variant: 'destructive',
                 });
                 // Consider if you want to sign out the user here or proceed with a warning
                 return { error: existingProfileError.message };
            }


            if (!existingProfile) {
                const { error: profileError } = await supabase.from('user_profiles').insert([
                    {
                        id: user.id,
                        email, // optional: remove if not needed as user.email already exists
                        student_name: trimmedName,
                        ht_no: trimmedHtNo,
                        role: 'student', // Assuming this signUp path is exclusively for students
                        status: 'active', // Set to 'active' as per the prompt's implied auto-approval
                    },
                ]);

                if (profileError) {
                    console.error('[Auth] Error creating profile:', profileError.message);
                    toast({
                        title: 'Error creating profile',
                        description: profileError.message,
                        variant: 'destructive',
                    });
                    // If profile creation fails, it's safer to log out the user to prevent inconsistent states
                    await supabase.auth.signOut();
                    return { error: profileError.message };
                }
            } else {
                console.log('[Auth] User profile already exists. Skipping profile creation for ID:', user.id);
            }

            // Step 4: Toast success
            toast({
                title: 'Account created successfully',
                description: 'Redirecting to dashboard...',
            });

            // Step 5: Refresh session manually
            const { data: sessionData, error: sessionRefreshError } = await supabase.auth.getSession();

            if (sessionRefreshError) {
                console.error('[Auth] Failed to refresh session:', sessionRefreshError.message);
                toast({
                    title: 'Session Error',
                    description: 'Failed to refresh session after signup. Please try logging in.',
                    variant: 'destructive',
                });
                return { error: sessionRefreshError.message };
            }

            if (!sessionData.session) {
                console.error('[Auth] Session null after refresh.');
                toast({
                    title: 'Session Error',
                    description: 'Session not found after signup. Please try logging in.',
                    variant: 'destructive',
                });
                return { error: 'Failed to refresh session: session is null' };
            }

            setUser(user);
            setSession(sessionData.session);

            // Step 6: Load user profile & redirect
            // Added a small delay to ensure DB consistency before loading profile
            await new Promise(resolve => setTimeout(resolve, 500));
            const newProfile = await loadUserProfile(user.id);

            if (newProfile) {
                setUserProfile(newProfile);
                handlePostAuthRedirect(newProfile);
            } else {
                console.warn('[Auth] No profile found immediately after signup/creation. Setting needsProfileCreation.');
                setNeedsProfileCreation(true);
                // Optionally redirect to a profile completion page if that's your flow
                setLocation('/'); // or setLocation('/complete-profile');
            }

            return { error: null };
        } catch (err: any) {
            console.error('[Auth] Unexpected error during sign up:', err);
            toast({
                title: 'Unexpected error during sign up',
                description: err.message || 'Please try again.',
                variant: 'destructive',
            });
            return { error: err.message || 'Signup error' };
        } finally {
            setLoading(false);
        }
    };

    const createProfile = async (profileData: { phone?: string; address?: string; emergency_no?: string; ht_no?: string; student_name?: string; year?: string; }) => {
        if (!user) {
            toast({ title: 'Error', description: 'User not authenticated to create profile.', variant: 'destructive' });
            return;
        }

        setLoading(true);
        try {
            console.log('[Auth] Attempting to create/update student profile for user:', user.id);

            const updatePayload: Partial<UserProfile> = {
                ...profileData,
                id: user.id,
                email: user.email!,
                status: 'approved', // Mark as approved when profile is completed
            };

            // Clean up undefined/null/empty string values from payload
            Object.keys(updatePayload).forEach(key => {
                const value = (updatePayload as any)[key];
                if (value === undefined || value === null || value === '') {
                    delete (updatePayload as any)[key];
                }
            });

            console.log('[Auth] Profile update payload:', updatePayload);

            const { error } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('id', user.id);

            if (error) {
                console.error('[Auth] Error updating student profile:', error);
                toast({ title: 'Profile Update Failed', description: error.message, variant: 'destructive' });
                throw error;
            }

            console.log('[Auth] Student profile updated successfully. Refreshing context...');

            // Wait for DB consistency before refreshing
            await new Promise(resolve => setTimeout(resolve, 500));
            // Refresh profile data in state
            await refreshUserProfile();

            toast({ title: 'Profile created successfully', description: 'Welcome to your dashboard!' });
            setLocation('/student-dashboard'); // Redirect after successful profile creation

        } catch (error: any) {
            console.error('[Auth] Error in createProfile:', error);
            toast({ title: 'Profile Update Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const closeProfileCreationModal = useCallback(() => {
        setNeedsProfileCreation(false);
        console.log('[Auth] Profile creation modal explicitly closed.');
    }, []);

    const logout = async () => {
        try {
            console.log('[Auth] Attempting logout...');

            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('[Auth] Logout error:', error);
                toast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
            } else {
                console.log('[Auth] Logout successful.');
                toast({ title: 'Logged out successfully' });
            }
        } catch (error) {
            console.error('[Auth] Logout caught error:', error);
        } finally {
            // Clear state immediately on logout
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLocation('/'); // Redirect to home/login on logout
        }
    };

    // Render loading spinner until initial auth check is complete
    if (!initialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                userProfile,
                loading, // loading will now correctly reflect initial load, listener updates, and visibility changes
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
