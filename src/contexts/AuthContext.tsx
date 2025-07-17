// AuthContext.tsx - Fixed Version for Direct Student Dashboard Redirection

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter'; // Assuming 'wouter' is your router library

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
        studentName: string,
        htNo: string,
        year?: string
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
    const [location, setLocation] = useLocation();

    // --- Helper Functions ---

    // Helper function to create admin profile (extracted to avoid circular dependency)
    const createAdminProfile = useCallback(async (currentUser: User): Promise<UserProfile | null> => {
        if (!currentUser || currentUser.email !== 'admin@vignanits.ac.in') {
            return null;
        }

        console.log('[Auth] Attempting auto-creation of admin profile for:', currentUser.email);
        try {
            // Check if profile already exists before inserting
            const { data: existingAdminProfile, error: existingAdminProfileError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (existingAdminProfileError && existingAdminProfileError.code !== 'PGRST116') {
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
                // Small delay for DB consistency after insert
                await new Promise(resolve => setTimeout(resolve, 500));
            } else {
                console.log('[Auth] Admin profile already exists for:', currentUser.email, '. Skipping insert.');
            }

            // Load the profile directly here to avoid circular dependency
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (error) {
                console.error('[Auth] Error loading admin profile after creation:', error);
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
    }, [toast]);

    // loadUserProfile - Determines if a profile exists for the current user
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

            // If no profile data is returned for the authenticated user
            if (!data) {
                console.log(`[Auth] loadUserProfile: No profile data found for userId ${currentUser.id}.`);

                const userAuthRole = currentUser.user_metadata?.role;

                // Scenario: User is authenticated but profile is missing (e.g., new student signup)
                // This block acts as a fallback for cases not directly handled by signUp's immediate profile creation
                if (userAuthRole === 'student') {
                    setNeedsProfileCreation(true);
                    // Only redirect if not already on an onboarding/completion page
                    const currentWindowPath = window.location.pathname;
                    if (currentWindowPath !== '/student-onboarding' && currentWindowPath !== '/complete-profile') {
                        setLocation('/student-onboarding');
                        toast({
                            title: 'Profile incomplete',
                            description: 'Please complete your student profile to continue.',
                        });
                    }
                }
                // Scenario: Specific admin email, try to auto-create admin profile if missing
                else if (userAuthRole === 'admin' && currentUser.email === 'admin@vignanits.ac.in') {
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
                    // For other roles without profiles or unhandled cases
                    setNeedsProfileCreation(false); // No profile, no explicit creation needed for now
                }
                return null;
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
            return null;
        }
    }, [createAdminProfile, setLocation, toast]);

    // handlePostAuthRedirect handles all role-based dashboard redirection
    const handlePostAuthRedirect = useCallback((profile: UserProfile) => {
        const currentPath = window.location.pathname;

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
            // For pending users, redirect to home or a specific pending page
            console.log('[Auth] Redirecting to home (pending approval)');
            setLocation('/');
        }
        // If the current path is already the target path, do nothing.
    }, [setLocation]);


    // Wrapper for handleAuthChange to be called from refreshUserProfile and useEffect
    const handleAuthChangeWrapper = useCallback(async (event: string, session: Session | null) => {
        console.log(`[Auth] Auth state changed via wrapper. Event: ${event}, User: ${session?.user?.email || 'No User'}`);

        // Prevent redundant processing for the same SIGNED_IN user, unless it's a specific refresh event
        if (session?.user && previousUserIdRef.current === session.user.id && event === 'SIGNED_IN' && !loading) {
            console.log(`[Auth] Wrapper: Skipping redundant SIGNED_IN processing for user ${session.user.id}`);
            setLoading(false); // Ensure loading is turned off if skipped
            return;
        }
        previousUserIdRef.current = session?.user?.id || null; // Update ref for next check

        if (session?.user) {
            setUser(session.user);
            setSession(session);

            const profile = await loadUserProfile(session.user); // This might set needsProfileCreation and redirect

            if (profile) {
                setUserProfile(profile);
                setNeedsProfileCreation(false); // Clear this flag if a profile is successfully loaded
                handlePostAuthRedirect(profile);
            } else {
                setUserProfile(null);
                // loadUserProfile already handles setting needsProfileCreation and redirect if no profile found
            }
        } else {
            // User signed out or no session
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false); // Always clear on logout

            const currentWindowPath = window.location.pathname;
            const isPublicOrAuthPage = currentWindowPath === '/' || currentWindowPath === '/login' ||
                                       currentWindowPath.startsWith('/public') ||
                                       currentWindowPath.startsWith('/student-onboarding') || // Allow these pages even when logged out
                                       currentWindowPath.startsWith('/complete-profile');

            if (!isPublicOrAuthPage) {
                setLocation('/login'); // Redirect to login if not on a public/auth page
            }
        }
        setLoading(false); // Always set loading false at the end of handling an auth change
    }, [loadUserProfile, handlePostAuthRedirect, setLocation, loading]); // Added 'loading' to dependencies

    // refreshUserProfile should trigger the main listener to re-evaluate the state
    const refreshUserProfile = useCallback(async () => {
        if (user) {
            console.log('[Auth] refreshUserProfile called. Triggering session refresh...');
            setLoading(true); // Indicate loading for refresh

            // Re-fetch the session to trigger the onAuthStateChange listener
            const { data: { session: newSession }, error: refreshError } = await supabase.auth.getSession();
            
            if (refreshError) {
                console.error('[Auth] Error refreshing session during refreshUserProfile:', refreshError.message);
                toast({
                    title: 'Session Refresh Error',
                    description: 'Could not refresh session.',
                    variant: 'destructive',
                });
                setLoading(false); // Turn off loading if refresh itself fails
            } else if (newSession) {
                // Manually call the handler to re-process the state
                await handleAuthChangeWrapper('REFRESH_PROFILE', newSession);
            } else {
                // If no session after refresh, treat as logged out
                await handleAuthChangeWrapper('SIGNED_OUT', null);
            }
        } else {
            console.warn('[Auth] Cannot refresh profile: No user logged in. Clearing profile state.');
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLoading(false);
        }
    }, [user, toast, handleAuthChangeWrapper]); // Added handleAuthChangeWrapper dependency

    // --- PRIMARY EFFECT HOOK: Single Source of Truth for Authentication State ---
    useEffect(() => {
        setLoading(true); // Ensure loading is true at the start of effect

        // Listen for auth state changes from Supabase
        const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChangeWrapper);

        // Initial check on component mount to set the current session state
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            if (initialSession) {
                handleAuthChangeWrapper('INITIAL_SESSION', initialSession);
            } else {
                handleAuthChangeWrapper('INITIAL_SESSION', null);
            }
        });

        // Cleanup: Unsubscribe from the listener when the component unmounts
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [handleAuthChangeWrapper]); // Depend on the wrapper function

    // --- Authentication Actions ---

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
                console.warn('[Auth] Login succeeded but no user data in response. This should not happen.');
                toast({ title: 'Login issue', description: 'Login successful, but user data missing.', variant: 'destructive' });
                // Do not return here, let the `onAuthStateChange` listener handle the state update.
                // If data.user is truly null unexpectedly, the listener for SIGNED_IN won't fire,
                // and loading will remain true. So we explicitly set it false here as a safeguard.
                setLoading(false);
                return;
            }

            console.log('[Auth] Login successful. Listener will handle state update and redirection.');
            // The `onAuthStateChange` listener (`handleAuthChangeWrapper`) will automatically trigger
            // due to `signInWithPassword` and handle setting state and redirection.
            // No explicit setLoading(false) here, as listener will do it.

        } catch (err: any) {
            console.error('[Auth] Login caught error:', err);
            toast({ title: 'Login Failed', description: err.message || 'An unexpected error occurred during login.', variant: 'destructive' });
            setLoading(false); // Ensure loading is turned off if an error occurs directly
        }
    };

    const signUp = async (
        email: string,
        password: string,
        student_name: string,
        ht_no: string,
        year?: string
    ): Promise<{ error: string | null }> => {
        setLoading(true);

        try {
            console.log(`[Auth] Attempting sign up for student with email: ${email}`);

            // Step 1: Sign up user with Supabase Auth
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

            const { user } = userData;

            const trimmedName = student_name.trim();
            const trimmedHtNo = ht_no.trim().toUpperCase();

            // Step 2: Check for existing profile (robustness)
            const { data: existingProfile, error: existingProfileCheckError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (existingProfileCheckError && existingProfileCheckError.code !== 'PGRST116') { // PGRST116 is "No rows found"
                console.error('[Auth] Error checking for existing profile before insert:', existingProfileCheckError);
                toast({
                    title: 'Profile Check Error',
                    description: existingProfileCheckError.message,
                    variant: 'destructive',
                });
                await supabase.auth.signOut(); // Critical error, sign out user to prevent bad state
                return { error: existingProfileCheckError.message };
            }

            let newProfile: UserProfile | null = null;
            // Step 3: Insert or retrieve user profile
            if (!existingProfile) {
                console.log('[Auth] No existing profile found. Attempting to insert new student profile.');
                const profileToInsert = {
                    id: user.id,
                    email: user.email!,
                    student_name: trimmedName,
                    ht_no: trimmedHtNo,
                    year: year || null,
                    role: 'student' as const, // Explicitly cast for type safety
                    status: 'approved' as const, // Assuming immediate approval for initial signup profile
                };
                const { data: insertedProfile, error: profileInsertError } = await supabase.from('user_profiles').insert([
                    profileToInsert
                ]).select('*').single(); // Select the inserted data back

                if (profileInsertError) {
                    console.error('[Auth] Error inserting user profile:', profileInsertError.message);
                    toast({
                        title: 'Profile Creation Error',
                        description: profileInsertError.message,
                        variant: 'destructive',
                    });
                    await supabase.auth.signOut(); // If profile insert fails, sign out the user created by Supabase
                    return { error: profileInsertError.message };
                }
                console.log('[Auth] Student profile inserted successfully.', insertedProfile);
                newProfile = insertedProfile;
            } else {
                console.log('[Auth] User profile already exists. Fetching existing profile for ID:', user.id);
                // If profile already exists, fetch it to ensure we have the latest data
                newProfile = await loadUserProfile(user); // loadUserProfile will fetch and return the profile
            }

            // Step 4: Update state and redirect if profile is successfully established
            if (newProfile) {
                setUser(user);
                setSession(userData.session); // Use the session from the signUp result
                setUserProfile(newProfile);
                setNeedsProfileCreation(false); // Profile is now complete
                handlePostAuthRedirect(newProfile); // Direct redirect to dashboard
                toast({
                    title: 'Account created successfully',
                    description: 'Welcome to your dashboard!',
                });
            } else {
                // This path should ideally not be hit if profile insert/load logic is robust.
                // It means signup succeeded but profile still couldn't be loaded/created.
                console.warn('[Auth] Signup success, but profile could not be established.');
                toast({
                    title: 'Signup Success, Profile Error',
                    description: 'Your account was created, but there was an issue setting up your profile.',
                    variant: 'destructive',
                });
                // Don't redirect, let the user deal with incomplete profile or manual refresh
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
            // Ensure loading is off, especially if an error occurred before successful state update
            if (!user && !userProfile) { // If user/profile state is not set, means an error occurred or processing is incomplete
                 setLoading(false);
            }
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
                email: user.email!, // Ensure email is included if it's part of the update logic
                status: 'approved', // Setting status to approved on completion
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

            // Directly call refreshUserProfile to re-load the profile and trigger redirect
            // This is crucial for onboarding completion to redirect to dashboard.
            await refreshUserProfile();

            toast({ title: 'Profile created successfully', description: 'Welcome to your dashboard!' });
            // Redirection is handled by refreshUserProfile's call to handleAuthChangeWrapper

        } catch (error: any) {
            console.error('[Auth] Error in createProfile:', error);
            toast({ title: 'Profile Update Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setLoading(false); // Ensure loading is reset regardless of success/failure
        }
    };

    const closeProfileCreationModal = useCallback(() => {
        setNeedsProfileCreation(false);
        console.log('[Auth] Profile creation modal explicitly closed.');
    }, []);

    const logout = async () => {
        try {
            console.log('[Auth] Attempting logout...');
            setLoading(true);

            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('[Auth] Logout error:', error);
                toast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
            } else {
                console.log('[Auth] Logout successful.');
                toast({ title: 'Logged out successfully' });
                // The `onAuthStateChange` listener will handle clearing state and redirecting to /login
            }
        } catch (error) {
            console.error('[Auth] Logout caught error:', error);
        } finally {
            setLoading(false); // Ensure loading is reset after logout attempt
        }
    };

    // --- Render Loading Spinner or Children ---
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
