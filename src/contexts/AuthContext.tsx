// AuthContext.tsx - Final Version with Robust State Management and Redirect Logic

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter'; // FIXED: Removed the extra '=' here

// --- Configuration ---
// IMPORTANT: Use environment variables for sensitive or environment-specific values.
// Ensure NEXT_PUBLIC_ADMIN_EMAIL is set in your .env.local file (e.g., NEXT_PUBLIC_ADMIN_EMAIL=admin@vignanits.ac.in)
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@vignanits.ac.in';

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
    loading: boolean; // Indicates if AuthProvider is actively determining the initial auth state or processing an auth action
    isAuthenticated: boolean; // True if a user is logged in
    needsProfileCreation: boolean; // True if user is logged in but profile is missing/incomplete
    login: (email: string, password: string, userType: 'student' | 'admin') => Promise<void>;
    signUp: (
        email: string,
        password: string,
        studentName: string,
        htNo: string,
        year: string,
        phone?: string,
        address?: string,
        emergency_no?: string
    ) => Promise<{ error: string | null }>;
    logout: () => Promise<void>;
    createProfile: (profileData: { phone?: string; address?: string; emergency_no?: string; ht_no?: string; student_name?: string; year?: string; }) => Promise<void>;
    closeProfileCreationModal: () => void;
    refreshUserProfile: () => Promise<void>;
}

// --- Auth Context and Hook ---
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // This error typically means useAuth is called outside of AuthProvider.
        console.error("useAuth must be used within an AuthProvider. Context is undefined.");
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// --- Auth Provider Component ---
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [needsProfileCreation, setNeedsProfileCreation] = useState(false);
    const [loading, setLoading] = useState(true); // True initially, means auth state is being determined

    // This ref ensures the initial Supabase session check in useEffect runs only once per mount.
    const isInitialCheckDone = useRef(false);

    // This ref helps prevent redundant processing of the same SIGNED_IN event from Supabase's listener.
    const previousUserIdRef = useRef<string | null>(null);

    const { toast } = useToast();
    const [location, setLocation] = useLocation(); // wouter's setLocation

    // --- Helper Functions ---

    /**
     * Attempts to create an admin profile for a specific email if it doesn't exist.
     * Called when an 'admin@vignanits.ac.in' user logs in and their profile is missing.
     */
    const createAdminProfile = useCallback(async (currentUser: User): Promise<UserProfile | null> => {
        if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
            return null;
        }

        console.log('[Auth] Attempting auto-creation of admin profile for:', currentUser.email);
        try {
            const { data: existingAdminProfile, error: existingAdminProfileError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (existingAdminProfileError) {
                // Only log and toast for actual errors, not 'no rows found' (PGRST116)
                if (existingAdminProfileError.code !== 'PGRST116') {
                    console.error('[Auth] Error checking for existing admin profile:', existingAdminProfileError);
                    toast({ title: 'Profile Check Error', description: existingAdminProfileError.message, variant: 'destructive' });
                    return null;
                }
            }

            if (!existingAdminProfile) {
                const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                    id: currentUser.id,
                    email: currentUser.email,
                    role: 'admin',
                    status: 'approved',
                    student_name: 'Administrator', // Default name for admin
                    ht_no: null, // Admins don't have HT No
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
                // Small delay to allow DB to propagate the insert before fetching immediately
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                console.log('[Auth] Admin profile already exists for:', currentUser.email, '. Skipping insert.');
            }

            // Always fetch the profile after ensuring it exists (either found or just created)
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (error) {
                console.error('[Auth] Error loading admin profile after creation/check:', error);
                return null;
            }

            if (data) {
                toast({ title: 'Admin profile created/loaded', description: 'Welcome, administrator!' });
                return data as UserProfile;
            }
        } catch (error) {
            console.error('[Auth] Error during admin profile creation process:', error);
            toast({
                title: 'Admin Profile Setup Failed',
                description: 'An unexpected error occurred during admin profile setup.',
                variant: 'destructive',
            });
        }
        return null;
    }, [toast, ADMIN_EMAIL]);

    /**
     * Loads the user's profile from the 'user_profiles' table.
     * Also handles setting `needsProfileCreation` and potential redirection to onboarding.
     */
    const loadUserProfile = useCallback(async (currentUser: User): Promise<UserProfile | null> => {
        try {
            console.log(`[Auth] loadUserProfile: Attempting to load profile for userId: ${currentUser.id}`);

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (error) {
                console.error(`[Auth] loadUserProfile error for userId ${currentUser.id}:`, error.message);
                toast({
                    title: 'Error loading profile',
                    description: 'Could not fetch user profile. Please try again.',
                    variant: 'destructive',
                });
                return null;
            }

            if (!data) {
                console.log(`[Auth] loadUserProfile: No profile data found for userId ${currentUser.id}.`);

                // Supabase `user.user_metadata.role` is set on signup by `signUp` function.
                // This is a common pattern to quickly know the intended role from auth,
                // but the definitive role and status come from the `user_profiles` table.
                const userAuthRole = currentUser.user_metadata?.role; 

                // If user is authenticated but profile is missing, especially for students, prompt for creation.
                if (userAuthRole === 'student') {
                    setNeedsProfileCreation(true);
                    const currentWindowPath = window.location.pathname;
                    if (currentWindowPath !== '/student-onboarding' && currentWindowPath !== '/complete-profile') {
                        setLocation('/student-onboarding');
                        toast({
                            title: 'Profile incomplete',
                            description: 'Please complete your student profile to continue.',
                        });
                    }
                }
                // Special handling for the admin email if their profile is missing
                else if (userAuthRole === 'admin' && currentUser.email === ADMIN_EMAIL) {
                    console.log('[Auth] Attempting to auto-create admin profile.');
                    const adminProfile = await createAdminProfile(currentUser);
                    if (adminProfile) {
                        return adminProfile;
                    } else {
                        toast({
                            title: 'Admin profile creation failed',
                            description: 'Could not set up admin profile. Please contact support.',
                            variant: 'destructive',
                        });
                        return null;
                    }
                } else {
                    // For other roles without profiles or unhandled cases, don't set creation needed.
                    setNeedsProfileCreation(false);
                }
                return null;
            }

            // Profile successfully found
            console.log(`[Auth] loadUserProfile: Profile found for userId ${currentUser.id}:`, data);
            setNeedsProfileCreation(false); // Profile is complete
            return data as UserProfile;
        } catch (error) {
            console.error(`[Auth] loadUserProfile: Unexpected error for userId ${currentUser.id}:`, error);
            toast({
                title: 'Unexpected error',
                description: 'An unexpected error occurred while loading your profile.',
                variant: 'destructive',
            });
            return null;
        }
    }, [createAdminProfile, setLocation, toast, ADMIN_EMAIL]);

    /**
     * Handles redirection to the appropriate dashboard based on user role and status.
     * Prevents unnecessary re-navigations if already on the target path.
     */
    const handlePostAuthRedirect = useCallback((profile: UserProfile) => {
        const currentPath = window.location.pathname;

        console.log('[Auth] Handling post-auth redirect:', {
            currentPath,
            role: profile.role,
            status: profile.status
        });

        if (profile.role === 'admin' && profile.status === 'approved') {
            if (currentPath !== '/admin-dashboard') {
                console.log('[Auth] Redirecting to admin dashboard');
                setLocation('/admin-dashboard');
            } else {
                console.log('[Auth] Already on admin dashboard, skipping redirect.');
            }
        } else if (profile.role === 'student' && profile.status === 'approved') {
            if (currentPath !== '/student-dashboard') {
                console.log('[Auth] Redirecting to student dashboard');
                setLocation('/student-dashboard');
                window.location.reload(); // Keep this reload as it was in your original code
            } else {
                console.log('[Auth] Already on student dashboard, skipping redirect.');
            }
        } else if (profile.status === 'pending') {
            if (currentPath !== '/') { // Or a specific '/pending-approval' page
                console.log('[Auth] Redirecting to home (profile pending approval)');
                setLocation('/');
            } else {
                console.log('[Auth] Already on home (pending approval), skipping redirect.');
            }
        }
    }, [setLocation]);

    /**
     * Centralized handler for all Supabase auth state change events.
     * Updates local state and triggers profile loading/redirection.
     */
    const handleAuthChangeWrapper = useCallback(async (event: string, session: Session | null) => {
        console.log(`[Auth] Auth state changed via wrapper. Event: ${event}, User: ${session?.user?.email || 'No User'}`);

        // This check prevents redundant processing of the same SIGNED_IN event.
        if (session?.user && previousUserIdRef.current === session.user.id && event === 'SIGNED_IN') {
            console.log(`[Auth] Wrapper: Skipping redundant SIGNED_IN processing for user ${session.user.id}`);
            setLoading(false); // Ensure loading is turned off even if skipped
            return;
        }
        previousUserIdRef.current = session?.user?.id || null; // Update ref for next check

        setLoading(true); // Set loading true at the beginning of processing any auth change event.

        if (session?.user) {
            setUser(session.user);
            setSession(session);

            const profile = await loadUserProfile(session.user);

            if (profile) {
                setUserProfile(profile);
                setNeedsProfileCreation(false); // Profile is now loaded/complete
                handlePostAuthRedirect(profile);
            } else {
                // Profile not found/could not be loaded. `loadUserProfile` itself handles
                // setting `needsProfileCreation` and potential onboarding redirect for students.
                setUserProfile(null);
            }
        } else {
            // No user session (signed out or never logged in)
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false); // No user, so no profile creation is pending

            const currentWindowPath = window.location.pathname;
            const isPublicOrAuthPage = currentWindowPath === '/' || currentWindowPath.startsWith('/public') ||
                                         currentWindowPath.startsWith('/student-onboarding') ||
                                         currentWindowPath.startsWith('/complete-profile');

            // Redirect to homepage '/' after logout, assuming LoginModal lives there
            if (!isPublicOrAuthPage) {
                console.log('[Auth] No user session and not on public/auth page. Redirecting to homepage.');
                setLocation('/'); // Redirect to homepage where the modal would appear
            } else {
                console.log('[Auth] No user session, but on a public/auth page. Staying put.');
            }
        }
        setLoading(false); // Turn off loading once all state updates for this event are processed.
    }, [loadUserProfile, handlePostAuthRedirect, setLocation]);

    /**
     * Explicitly refreshes the user's profile and triggers a re-evaluation of auth state.
     * Useful after profile updates (e.g., `createProfile`).
     */
    const refreshUserProfile = useCallback(async () => {
        if (user) {
            console.log('[Auth] refreshUserProfile called. Triggering session refresh...');
            setLoading(true); // Show loader during refresh

            // `refreshSession` triggers `onAuthStateChange`, which calls `handleAuthChangeWrapper`.
            // The wrapper will then reload the profile and handle state/redirect.
            const { error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
                console.error('[Auth] Error refreshing session during refreshUserProfile:', refreshError.message);
                toast({
                    title: 'Session Refresh Error',
                    description: 'Could not refresh session.',
                    variant: 'destructive',
                });
                setLoading(false); // Turn off loading if refresh itself fails
            }
            // handleAuthChangeWrapper will ultimately set loading to false after processing.
        } else {
            console.warn('[Auth] Cannot refresh profile: No user logged in. Clearing profile state.');
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLoading(false);
        }
    }, [user, toast]);


    // --- PRIMARY EFFECT HOOK: Initializes Auth Listener and performs initial session check ---
    useEffect(() => {
        // This ref ensures that the heavy lifting (setting up listener, initial getSession)
        // only happens once per component mount, preventing re-runs on unrelated state changes.
        if (isInitialCheckDone.current) {
            console.log('[Auth] AuthProvider useEffect: Initial check already performed. Skipping.');
            return;
        }

        console.log('[Auth] AuthProvider useEffect: Starting initial session check.');
        setLoading(true); // Start loading as soon as component mounts for initial check

        // 1. Set up the Supabase auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            handleAuthChangeWrapper(event, session);
        });

        // 2. Perform the initial session retrieval
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            handleAuthChangeWrapper('INITIAL_SESSION', initialSession);
            isInitialCheckDone.current = true; // Mark initial check as complete AFTER processing.
        }).catch(err => {
            console.error('[Auth] Error getting initial session:', err);
            toast({ title: 'Auth Error', description: 'Failed to get initial session.', variant: 'destructive' });
            setLoading(false); // Ensure loading is off on error
            isInitialCheckDone.current = true; // Mark complete to prevent re-loop
        });

        // Cleanup function for useEffect
        return () => {
            console.log('[Auth] AuthProvider useEffect cleanup: Unsubscribing auth listener.');
            authListener.subscription.unsubscribe();
            // Reset the ref when the component unmounts for HMR environments.
            isInitialCheckDone.current = false;
        };
    }, [handleAuthChangeWrapper]); // Only `handleAuthChangeWrapper` as a dependency because it's stable and encapsulates other logic.


    // --- Authentication Actions (exposed via context) ---

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

            if (!data.user || !data.session) {
                console.warn('[Auth] Login successful, but no user or session data returned. This is unusual.');
                toast({ title: 'Login issue', description: 'Login successful, but user data missing. Please refresh.', variant: 'destructive' });
                // Do not setLoading(false) here, let the listener handle it or the error below.
                return; 
            }

            console.log('[Auth] Login successful. Listener should pick it up.');
            // The onAuthStateChange listener (via handleAuthChangeWrapper) will be triggered
            // by signInWithPassword and handle all subsequent state updates and redirections.
            // No explicit state updates or redirects are needed here.

        } catch (err: any) {
            console.error('[Auth] Login caught error:', err);
            toast({ title: 'Login Failed', description: err.message || 'An unexpected error occurred during login.', variant: 'destructive' });
        } finally {
            // Ensure loading is always turned off. The listener might have already done so, but this is a safeguard.
            if (loading) setLoading(false); 
        }
    };

    const signUp = async (
        email: string,
        password: string,
        studentName: string, // This parameter should contain the student's full name
        htNo: string,
        year: string,         // This parameter should contain the student's year
        phone?: string,
        address?: string,
        emergency_no?: string
    ): Promise<{ error: string | null }> => {
        setLoading(true);

        try {
            console.log(`[Auth] Attempting sign up for student with email: ${email}`);

            // --- Field Validation ---
            if (!studentName || studentName.trim() === '') {
                const errorMessage = 'Student Name is required.';
                toast({ title: 'Missing Field', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (!email || email.trim() === '') {
                const errorMessage = 'Email is required.';
                toast({ title: 'Missing Field', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (!htNo || htNo.trim() === '') {
                const errorMessage = 'Hall Ticket Number is required.';
                toast({ title: 'Missing Field', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (!year || year.trim() === '') {
                const errorMessage = 'Year is required.';
                toast({ title: 'Missing Field', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (!password || password.length < 6) { // Supabase default minimum is 6
                const errorMessage = 'Password must be at least 6 characters long.';
                toast({ title: 'Invalid Password', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }

            const trimmedName = studentName.trim();
            const trimmedHtNo = htNo.trim().toUpperCase();

            // 1. Create the user in Supabase Auth. This also implicitly logs the user in.
            // You can optionally set initial user_metadata here.
            const { data: userData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'student' // This adds role to user.user_metadata, useful for initial checks
                    }
                }
            });

            if (signUpError || !userData.user) {
                console.error('[Auth] Supabase signUp error:', signUpError?.message || 'No user data after signup.');
                toast({
                    title: 'Error creating account',
                    description: signUpError?.message || 'An unknown error occurred during signup.',
                    variant: 'destructive',
                });
                setLoading(false); // Turn off loading on immediate error
                return { error: signUpError?.message || 'Signup failed' };
            }

            const { user } = userData;

            // 2. Check if a profile already exists for the newly signed-up user.
            // This is primarily a safeguard; for fresh signups, it shouldn't exist.
            const { data: existingProfile, error: existingProfileCheckError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (existingProfileCheckError) {
                if (existingProfileCheckError.code !== 'PGRST116') { // PGRST116 means "No rows found"
                    console.error('[Auth] Error checking for existing profile before insert:', existingProfileCheckError);
                    toast({
                        title: 'Profile Check Error',
                        description: existingProfileCheckError.message,
                        variant: 'destructive',
                    });
                    await supabase.auth.signOut(); // Critical error, invalidate session
                    setLoading(false); // Turn off loading on critical error
                    return { error: existingProfileCheckError.message };
                }
            }

            let createdOrFetchedProfile: UserProfile | null = null;
            // 3. Create the profile if it doesn't exist.
            if (!existingProfile) {
                console.log('[Auth] No existing profile found. Attempting to insert new student profile.');
                const profileToInsert = {
                    id: user.id,
                    email: user.email!,
                    // FIXED: Corrected the mapping as per our discussion
                    student_name: trimmedName,
                    ht_no: trimmedHtNo,
                    year: year,
                    phone: phone || null,
                    address: address || null,
                    emergency_no: emergency_no || null,
                    role: 'student' as const,
                    status: 'approved' as const, // Assuming immediate approval for new signups
                };
                const { data: insertedProfile, error: profileInsertError } = await supabase.from('user_profiles').insert([
                    profileToInsert
                ]).select('*').single(); // Get the inserted row back

                if (profileInsertError) {
                    console.error('[Auth] Error inserting user profile:', profileInsertError.message);
                    toast({
                        title: 'Profile Creation Error',
                        description: profileInsertError.message,
                        variant: 'destructive',
                    });
                    await supabase.auth.signOut(); // Profile creation failed, so log out the user
                    setLoading(false); // Turn off loading on profile insert failure
                    return { error: profileInsertError.message };
                }
                console.log('[Auth] Student profile inserted successfully.', insertedProfile);
                createdOrFetchedProfile = insertedProfile;
            } else {
                console.warn('[Auth] User profile unexpectedly exists for new signup. Fetching existing profile for ID:', user.id);
                // If for some reason a profile already existed (e.g., partial signup before, or manual intervention)
                createdOrFetchedProfile = await loadUserProfile(user);
            }

            // 4. Update AuthContext state immediately and redirect
            if (createdOrFetchedProfile) {
                // These state updates directly affect consumers of AuthContext
                setUser(user);
                setSession(userData.session); // Use the session from the signUp result
                setUserProfile(createdOrFetchedProfile);
                setNeedsProfileCreation(false); // Profile is complete

                // Directly trigger redirection to dashboard
                handlePostAuthRedirect(createdOrFetchedProfile);
                
                toast({
                    title: 'Account created successfully',
                    description: 'Welcome to your dashboard!',
                });
            } else {
                console.warn('[Auth] Signup successful, but profile could not be established in AuthContext state.');
                toast({
                    title: 'Signup Success, Profile Error',
                    description: 'Your account was created, but there was an issue setting up your profile.',
                    variant: 'destructive',
                });
                // If profile not established, user stays on current page (e.g., signup)
            }

            return { error: null };

        } catch (err: any) {
            console.error('[Auth] Unexpected error during sign up (catch block):', err);
            toast({
                title: 'Signup Failed',
                description: err.message || 'An unexpected error occurred during sign up.',
                variant: 'destructive',
            });
            return { error: err.message || 'An unexpected error occurred during sign up.' };
        } finally {
            // Ensure loading is always turned off. The listener might have already done so, but this is a safeguard.
            if (loading) setLoading(false);
        }
    };

    const createProfile = async (profileData: { phone?: string; address?: string; emergency_no?: string; ht_no?: string; student_name?: string; year?: string; }) => {
        if (!user) {
            toast({ title: 'Error', description: 'User not authenticated to create profile.', variant: 'destructive' });
            setLoading(false); // Ensure loading is off if not authenticated
            return;
        }

        setLoading(true);
        try {
            console.log('[Auth] Attempting to create/update student profile for user:', user.id);

            const updatePayload: Partial<UserProfile> = {
                ...profileData,
                email: user.email!, // Ensure email is included
                status: 'approved', // Set status to approved on completion
                // The role should already be set during signup, but if missing, could default here
                role: (userProfile?.role || 'student') as 'student', // Ensure role is student or existing
            };

            // Remove any undefined, null, or empty string values from the payload before sending to Supabase
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

            // `refreshUserProfile` will call `supabase.auth.refreshSession()`,
            // which triggers the `onAuthStateChange` listener. The listener
            // then calls `handleAuthChangeWrapper` to re-fetch the *updated* profile
            // and trigger the correct post-auth redirection.
            await refreshUserProfile();

            toast({ title: 'Profile created successfully', description: 'Welcome to your dashboard!' });

        } catch (error: any) {
            console.error('[Auth] Error in createProfile:', error);
            toast({ title: 'Profile Update Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            // Ensure loading is always turned off. `refreshUserProfile` (and indirectly `handleAuthChangeWrapper`)
            // primarily handles `setLoading(false)`, but this `finally` acts as a safeguard.
            if (loading) setLoading(false);
        }
    };

    const closeProfileCreationModal = useCallback(() => {
        setNeedsProfileCreation(false);
        console.log('[Auth] Profile creation modal explicitly closed.');
    }, []);

    const logout = async () => {
        try {
            console.log('[Auth] Attempting logout...');
            setLoading(true); // Show loader for logout action

            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('[Auth] Logout error:', error);
                toast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
            } else {
                console.log('[Auth] Logout successful.');
                toast({ title: 'Logged out successfully' });
                // The `onAuthStateChange` listener (via `handleAuthChangeWrapper`)
                // will automatically handle clearing context state and redirecting to '/'
                // after receiving the SIGNED_OUT event.
            }
        } catch (error) {
            console.error('[Auth] Logout caught error:', error);
            toast({ title: 'Logout Failed', description: error.message || 'An unexpected error occurred during logout.', variant: 'destructive' });
        } finally {
            // Ensure loading is always turned off. The listener might have already done so, but this is a safeguard.
            if (loading) setLoading(false);
        }
    };

    // --- Render Loading Spinner or Children ---
    // This conditional rendering ensures that the app waits until the initial authentication
    // state (user, session, profile) has been determined before rendering the main content.
    if (loading && !isInitialCheckDone.current) {
        console.log('[Auth] Render: Initial authentication state is being determined...');
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }
    
    // If initial check is done, but `loading` is true again (e.g., during `login`, `signup`, `refreshUserProfile` calls),
    // show a loader. You can adjust the styling for a full-screen or a more subtle one.
    if (loading) {
        console.log('[Auth] Render: Processing authentication action (login/signup/refresh)...');
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Once loading is false, and initial check is done, render children
    console.log('[Auth] Render: Authentication state determined. Rendering children.');
    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                userProfile,
                loading,
                isAuthenticated: !!user, // Derived directly from `user`
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
