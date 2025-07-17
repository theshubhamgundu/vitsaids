// AuthContext.tsx - Final Corrected Version for Supabase Session Persistence

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast'; // CORRECTED: Changed '=>' to 'from'
import { useLocation } from 'wouter'; // Ensure wouter is correctly installed and imported

// --- Interfaces ---
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
        studentName: string, // Changed from optional, expecting these for student signup
        htNo: string,        // Changed from optional, expecting these for student signup
        year?: string        // Still optional
    ) => Promise<{ error: any }>;
    logout: () => Promise<void>;
    createProfile: (profileData: { phone?: string; address?: string; emergency_no?: string; ht_no?: string; student_name?: string; year?: string; }) => Promise<void>;
    closeProfileCreationModal: () => void;
    refreshUserProfile: () => Promise<void>;
}

// --- Auth Context and Hook ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};

// --- Auth Provider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [needsProfileCreation, setNeedsProfileCreation] = useState(false);
    const [loading, setLoading] = useState(true);

    // Using useRef to track previous user ID to prevent redundant processing in onAuthStateChange
    const previousUserIdRef = useRef<string | null>(null);

    const { toast } = useToast();
    // Keep `location` destructured for potential use elsewhere or for dependencies,
    // but read `window.location.pathname` inside useEffect for safety.
    const [location, setLocation] = useLocation();

    // --- Helper Functions (Memoized with useCallback) ---

    // loadUserProfile now takes a User object directly to simplify parameter passing
    const loadUserProfile = useCallback(async (currentUser: User): Promise<UserProfile | null> => {
        try {
            console.log(`[Auth] loadUserProfile: Attempting to load profile for userId: ${currentUser.id}`);

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle(); // Use maybeSingle for robust handling of no record found

            if (error) {
                console.error(`[Auth] loadUserProfile error for userId ${currentUser.id}:`, error.message);
                toast({
                    title: 'Error loading profile',
                    description: 'Could not fetch user profile. Please try again.',
                    variant: 'destructive',
                });
                return null; // Return null on database query error
            }

            // If no profile data is returned for the authenticated user
            if (!data) {
                console.log(`[Auth] loadUserProfile: No profile data found for userId ${currentUser.id}.`);

                const userAuthRole = currentUser.user_metadata?.role;

                // Scenario: User is authenticated but profile is missing (e.g., new student signup)
                if (userAuthRole === 'student') {
                    setNeedsProfileCreation(true);
                    // Only redirect if not already on an onboarding/completion page
                    const currentWindowPath = window.location.pathname; // Use window.location.pathname for safety
                    if (currentWindowPath !== '/student-onboarding' && currentWindowPath !== '/complete-profile') {
                        setLocation('/student-onboarding'); // Preferred onboarding path
                        toast({
                            title: 'Profile incomplete',
                            description: 'Please complete your student profile to continue.',
                        });
                    }
                }
                // Scenario: Specific admin email, try to auto-create admin profile if missing
                else if (userAuthRole === 'admin' && currentUser.email === 'admin@vignanits.ac.in') {
                    console.log('[Auth] Attempting to auto-create admin profile.');
                    // handleProfileCreation will also do a check for existing profile before inserting
                    const adminProfile = await handleProfileCreation(currentUser);
                    if (adminProfile) {
                        return adminProfile; // Return the newly created/found admin profile
                    } else {
                        toast({
                            title: 'Admin profile creation failed',
                            description: 'Could not set up admin profile. Please contact support.',
                            variant: 'destructive',
                        });
                        return null; // Failed to create admin profile
                    }
                } else {
                    // For other roles without profiles or unhandled cases, just set needsProfileCreation to false
                    setNeedsProfileCreation(false);
                }
                return null; // Explicitly return null if profile was not found/created here
            }

            // Profile successfully found
            console.log(`[Auth] loadUserProfile: Profile found for userId ${currentUser.id}:`, data);
            return data as UserProfile;
        } catch (error) {
            console.error(`[Auth] loadUserProfile: Unexpected error for userId ${currentUser.id}:`, error);
            toast({
                title: 'Unexpected error',
                description: 'An unexpected error occurred while loading your profile.',
                variant: 'destructive',
            });
            return null; // Return null on unexpected errors
        }
    }, [handleProfileCreation, setLocation, toast]); // Removed `location` from deps as we use window.location.pathname

    // refreshUserProfile should trigger the main listener to re-evaluate the state
    const refreshUserProfile = useCallback(async () => {
        if (user) {
            console.log('[Auth] refreshUserProfile called. Triggering session refresh...');
            setLoading(true); // Show loading state during refresh

            // FIX: Renamed destructured 'error' to 'refreshError' to avoid potential minification conflicts
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
                console.error('[Auth] Error refreshing session during refreshUserProfile:', refreshError.message);
                toast({
                    title: 'Session Refresh Error',
                    description: 'Could not refresh session.',
                    variant: 'destructive',
                });
            }
            // The onAuthStateChange listener will handle setting setLoading(false) once it processes the event.
        } else {
            console.warn('[Auth] Cannot refresh profile: No user logged in. Clearing profile state.');
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLoading(false); // No user, so no loading needed for refresh
        }
    }, [user, toast]); // Dependency on `user` to know if a user exists to refresh

    // handleProfileCreation for admin auto-creation (called by loadUserProfile if admin profile is missing)
    const handleProfileCreation = useCallback(async (currentUser: User): Promise<UserProfile | null> => {
        if (!currentUser) return null;

        // Auto-create logic only for the specific admin email
        if (currentUser.email === 'admin@vignanits.ac.in') {
            console.log('[Auth] Attempting auto-creation of admin profile for:', currentUser.email);
            try {
                // Check if profile already exists before inserting (avoids duplicate key errors)
                const { data: existingAdminProfile, error: existingAdminProfileError } = await supabase
                    .from('user_profiles')
                    .select('id')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (existingAdminProfileError && existingAdminProfileError.code !== 'PGRST116') { // PGRST116 means no rows found
                    console.error('[Auth] Error checking for existing admin profile:', existingAdminProfileError);
                    toast({ title: 'Profile Check Error', description: existingAdminProfileError.message, variant: 'destructive' });
                    return null;
                }

                if (!existingAdminProfile) {
                    // Only insert if no existing profile was found
                    const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                        id: currentUser.id,
                        email: currentUser.email,
                        role: 'admin',
                        status: 'approved',
                    });

                    if (adminInsertError) {
                        console.error('[Auth] Admin auto-creation error:', adminInsertError);
                        toast({
                            title: 'Admin Profile Error',
                            description: adminInsertError.message,
                            variant: 'destructive',
                        });
                        return null;
                    }
                    console.log('[Auth] Admin profile inserted successfully.');
                    // Small delay for DB consistency after insert before attempting to load
                    await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                    console.log('[Auth] Admin profile already exists for:', currentUser.email, '. Skipping insert.');
                }

                // Load and return the profile (whether newly created or existing)
                const profile = await loadUserProfile(currentUser); // Call loadUserProfile with User object
                if (profile) {
                    toast({ title: 'Admin profile created/loaded', description: 'Welcome, administrator!' });
                    return profile;
                }
            } catch (error) {
                console.error('[Auth] Error during admin profile creation process:', error);
                toast({
                    title: 'Admin Profile Setup Failed',
                    description: 'An unexpected error occurred during admin profile setup.',
                    variant: 'destructive',
                });
            }
        }
        return null; // Not admin, or admin profile creation failed
    }, [loadUserProfile, toast]); // Dependencies: loadUserProfile is now correctly passed User object

    // handlePostAuthRedirect handles all role-based dashboard redirection
    const handlePostAuthRedirect = useCallback((profile: UserProfile) => {
        const currentPath = window.location.pathname; // Use window.location.pathname for reads

        console.log('[Auth] Handling post-auth redirect:', {
            currentPath,
            role: profile.role,
            status: profile.status
        });

        // Redirect based on role and status, only if not already on the correct page
        if (profile.role === 'admin' && profile.status === 'approved' && currentPath !== '/admin-dashboard') {
            console.log('[Auth] Redirecting to admin dashboard');
            setLocation('/admin-dashboard');
        } else if (profile.role === 'student' && profile.status === 'approved' && currentPath !== '/student-dashboard') {
            console.log('[Auth] Redirecting to student dashboard');
            setLocation('/student-dashboard');
        } else if (profile.status === 'pending' && currentPath !== '/') {
            // For users with 'pending' status, always redirect to home or a dedicated pending page
            console.log('[Auth] Redirecting to home (pending approval)');
            setLocation('/');
        }
        // If already on the correct page or a related onboarding/public page, no redirect needed.
    }, [setLocation]); // `location` is not a direct dependency as we read window.location.pathname

    // --- PRIMARY EFFECT HOOK: Single Source of Truth for Authentication State ---
    useEffect(() => {
        setLoading(true); // Indicate loading while authentication state is being determined

        // The single listener for all authentication state changes from Supabase.
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log(`[Auth] Auth state changed via listener. Event: ${event}, User: ${session?.user?.email || 'No User'}`);

                // Prevent redundant processing for the same SIGNED_IN user if state hasn't genuinely changed
                if (session?.user && previousUserIdRef.current === session.user.id && event === 'SIGNED_IN') {
                    console.log(`[Auth] Listener: Skipping redundant SIGNED_IN processing for user ${session.user.id}`);
                    setLoading(false); // Crucial: ensure loading state is false if we're skipping
                    return; // Exit early
                }
                // Update the ref with the current user's ID for the next event check
                previousUserIdRef.current = session?.user?.id || null;

                if (session?.user) {
                    // User is signed in or session has been refreshed/updated
                    setUser(session.user);
                    setSession(session);

                    // Load/handle the user's profile based on the authenticated user.
                    // This is the *only* place loadUserProfile is called after an auth event.
                    const profile = await loadUserProfile(session.user);

                    if (profile) {
                        setUserProfile(profile);
                        setNeedsProfileCreation(false);
                        // Redirect AFTER all profile data is loaded and state is updated
                        handlePostAuthRedirect(profile);
                    } else {
                        // If loadUserProfile returned null (e.g., profile not found or error occurred in it)
                        // needsProfileCreation and potential redirect to onboarding/home are handled within loadUserProfile itself.
                        setUserProfile(null); // Ensure userProfile state is clear if no profile was loaded/found
                    }
                } else {
                    // User is signed out, session is null, or expired. Clear all user-related state.
                    setUser(null);
                    setSession(null);
                    setUserProfile(null);
                    setNeedsProfileCreation(false);

                    // Redirect to login only if the user is not already on a public/home/login/onboarding page.
                    const currentWindowPath = window.location.pathname; // Use window.location.pathname for safety
                    const isPublicOrAuthPage = currentWindowPath === '/' || currentWindowPath === '/login' ||
                                               currentWindowPath.startsWith('/public') ||
                                               currentWindowPath.startsWith('/student-onboarding') ||
                                               currentWindowPath.startsWith('/complete-profile');

                    if (!isPublicOrAuthPage) {
                        setLocation('/login'); // Redirect to the login page
                    }
                }
                setLoading(false); // Auth state determination is complete, hide the loading spinner.
            }
        );

        // --- Initial Check on Component Mount ---
        // This is crucial for correctly setting the initial auth state when the page first loads.
        // It fetches the current session from Supabase and then manually triggers the onAuthStateChange handler.
        // This makes the listener the *single source of truth* for initial state setup as well.
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            if (initialSession) {
                // Mimic a 'SIGNED_IN' event for initial state setup if a session exists
                authListener.handler('SIGNED_IN', initialSession);
            } else {
                // Mimic a 'SIGNED_OUT' event for initial state setup (no session found)
                authListener.handler('SIGNED_OUT', null);
            }
        });

        // Cleanup function: Unsubscribe from the auth listener when the component unmounts
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [loadUserProfile, handleProfileCreation, handlePostAuthRedirect, setLocation]); // Removed 'location' from deps

    // --- Authentication Actions (Login, SignUp, CreateProfile, Logout) ---

    const login = async (email: string, password: string, userType: 'student' | 'admin') => {
        setLoading(true); // Show loading during the login process
        try {
            console.log(`[Auth] Attempting login for ${userType} with email: ${email}`);

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                console.error('[Auth] Login failed:', error.message);
                toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
                throw error; // Re-throw to allow calling component to catch
            }

            if (!data.user) {
                console.warn('[Auth] Login succeeded but no user data in response.');
                toast({ title: 'Login issue', description: 'Login successful, but no user data found.', variant: 'destructive' });
                return;
            }

            // Successfully signed in via Supabase.
            // The `onAuthStateChange` listener (in the useEffect) will now automatically
            // pick up the 'SIGNED_IN' event, update all context states (user, session, userProfile),
            // and perform the appropriate redirection.
            // No manual `setUser`, `setSession`, `loadUserProfile`, or `handlePostAuthRedirect` calls here.
            console.log('[Auth] Login successful. Listener will handle state update and redirection.');

        } catch (err: any) {
            console.error('[Auth] Login caught error:', err);
            toast({ title: 'Login Failed', description: err.message || 'An unexpected error occurred during login.', variant: 'destructive' });
        } finally {
            setLoading(false); // Always stop loading, regardless of login success or failure
        }
    };

    const signUp = async (
        email: string,
        password: string,
        student_name: string,
        ht_no: string,
        year?: string
    ): Promise<{ error: string | null }> => {
        setLoading(true); // Show loading at the start of the signup process

        try {
            console.log(`[Auth] Attempting sign up for student with email: ${email}`);

            // Step 1: Sign up user in Supabase Auth
            const { data: userData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError || !userData.user) {
                console.error('[Auth] Supabase signUp error:', signUpError?.message || 'No user data after signup.');
                toast({
                    title: 'Error creating account',
                    description: signUpError?.message || 'An unknown error occurred during signup.',
                    variant: 'destructive',
                });
                return { error: signUpError?.message || 'Signup failed' };
            }

            const { user } = userData; // The user object from the successful auth signup

            // Step 2: Sanitize student input
            const trimmedName = student_name.trim();
            const trimmedHtNo = ht_no.trim().toUpperCase();

            // Step 3: Insert user profile into 'user_profiles' table (or ensure it exists)
            // This check and insert is a safeguard. If a database trigger automatically creates profiles,
            // this might be redundant but harmless. If not, it's essential.
            const { data: existingProfile, error: existingProfileCheckError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle(); // Use maybeSingle for robust check

            if (existingProfileCheckError && existingProfileCheckError.code !== 'PGRST116') { // PGRST116 indicates no rows found
                 console.error('[Auth] Error checking for existing profile before insert:', existingProfileCheckError);
                 toast({
                    title: 'Profile Check Error',
                    description: existingProfileCheckError.message,
                    variant: 'destructive',
                 });
                 await supabase.auth.signOut(); // Log out on critical error to prevent inconsistent state
                 return { error: existingProfileCheckError.message };
            }

            if (!existingProfile) {
                console.log('[Auth] No existing profile found. Attempting to insert new student profile.');
                const { error: profileInsertError } = await supabase.from('user_profiles').insert([
                    {
                        id: user.id,
                        email: user.email!, // Use email from the authenticated user
                        student_name: trimmedName,
                        ht_no: trimmedHtNo,
                        year: year || null, // `year` is optional in interface, set to null if undefined
                        role: 'student', // Fixed role for this signup flow
                        status: 'active', // Assuming auto-approval for new student signups
                    },
                ]);

                if (profileInsertError) {
                    console.error('[Auth] Error inserting user profile:', profileInsertError.message);
                    toast({
                        title: 'Profile Creation Error',
                        description: profileInsertError.message,
                        variant: 'destructive',
                    });
                    await supabase.auth.signOut(); // Critical: Sign out user if profile creation fails
                    return { error: profileInsertError.message };
                }
                console.log('[Auth] Student profile inserted successfully.');
            } else {
                console.log('[Auth] User profile already exists. Skipping profile insert for ID:', user.id);
            }

            // Step 4: Display success toast
            toast({
                title: 'Account created successfully',
                description: 'Processing your account and redirecting...',
            });

            // Add a small delay. While onAuthStateChange should trigger reliably,
            // this gives database replication a moment, which can be critical for RLS
            // or if the profile data is immediately accessed by the listener.
            await new Promise(resolve => setTimeout(resolve, 1000));

            // The onAuthStateChange listener (in the main useEffect) will now pick up the
            // 'SIGNED_IN' event (from signUp's auto-login) and handle state, profile, and redirection.
            // No manual state updates or direct redirects are needed here to avoid redundancy and race conditions.

            return { error: null }; // Indicate success

        } catch (err: any) {
            console.error('[Auth] Unexpected error during sign up (catch block):', err);
            toast({
                title: 'Signup Failed',
                description: err.message || 'An unexpected error occurred during sign up.',
                variant: 'destructive',
            });
            return { error: err.message || 'An unexpected error occurred during sign up.' };
        } finally {
            setLoading(false); // Ensure loading is turned off after signup attempt finishes
        }
    };

    const createProfile = async (profileData: { phone?: string; address?: string; emergency_no?: string; ht_no?: string; student_name?: string; year?: string; }) => {
        if (!user) {
            toast({ title: 'Error', description: 'User not authenticated to create profile.', variant: 'destructive' });
            return;
        }

        setLoading(true); // Show loading for profile completion
        try {
            console.log('[Auth] Attempting to create/update student profile for user:', user.id);

            const updatePayload: Partial<UserProfile> = {
                ...profileData,
                id: user.id,
                email: user.email!, // Use email from current authenticated user
                status: 'approved', // Mark as approved upon completion
            };

            // Clean up undefined, null, or empty string values from payload
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

            console.log('[Auth] Student profile updated successfully. Triggering refresh...');

            // Small delay for DB consistency before the refresh operation
            await new Promise(resolve => setTimeout(resolve, 500));
            // Trigger refreshUserProfile, which will in turn cause onAuthStateChange to re-evaluate,
            // load the updated profile, and handle the final redirection.
            await refreshUserProfile();

            toast({ title: 'Profile created successfully', description: 'Welcome to your dashboard!' });
            // Direct `setLocation` is removed here to ensure redirection is centralized via `onAuthStateChange`.

        } catch (error: any) {
            console.error('[Auth] Error in createProfile:', error);
            toast({ title: 'Profile Update Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setLoading(false); // Stop loading after profile completion attempt
        }
    };

    const closeProfileCreationModal = useCallback(() => {
        setNeedsProfileCreation(false);
        console.log('[Auth] Profile creation modal explicitly closed.');
    }, []);

    const logout = async () => {
        try {
            console.log('[Auth] Attempting logout...');
            setLoading(true); // Show loading state during logout

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
            // The `onAuthStateChange` listener will automatically handle clearing state
            // and redirecting to the login page for the 'SIGNED_OUT' event.
            setLoading(false); // Stop loading after logout attempt
        }
    };

    // --- Render Loading Spinner or Children ---
    // The loading state is managed by the main useEffect to cover the initial auth check.
    if (loading) {
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
                loading, // Reflects global loading state (initial, during auth actions)
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
