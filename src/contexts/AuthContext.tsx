'use client';
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabaseOld as supabase } from '@/integrations/supabase/supabaseOld'; // Correctly imports supabaseOld
import { Session, User } from '@supabase/supabase-js';
// Removed unused dnd-kit imports: import { useSensors, useSensor, PointerSensor } from '@dnd-kit/core';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

// Ensure SupabaseClient type is available if needed for complex type hinting, though not strictly required here.
// import type { SupabaseClient } from '@supabase/supabase-js';

// --- Configuration ---
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@vignanits.ac.in';

// --- Interfaces ---
interface UserProfile {
    id: string;
    role: 'student' | 'admin' | 'faculty' | 'none'; // 'none' for profile needed but not assigned yet
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
    student_name: string | null;
    ht_no: string | null;
    year: string | null;
    email: string;
    phone?: string | null;
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
    isAuthenticated: boolean;
    needsProfileCreation: boolean;
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
    const [loading, setLoading] = useState(true);
    const isInitialCheckDone = useRef(false);
    const previousUserIdRef = useRef<string | null>(null);
    const { toast } = useToast();
    const [location, setLocation] = useLocation();

    // --- Helper Functions ---
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

            if (existingAdminProfileError && existingAdminProfileError.code !== 'PGRST116') {
                console.error('[Auth] Error checking for existing admin profile:', existingAdminProfileError);
                toast({ title: 'Profile Check Error', description: existingAdminProfileError.message, variant: 'destructive' });
                return null;
            }

            if (!existingAdminProfile) {
                const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                    id: currentUser.id,
                    email: currentUser.email,
                    role: 'admin',
                    status: 'approved',
                    student_name: 'Administrator', // Default name for admin
                    ht_no: null, // Admins don't have HT No.
                    year: null, // Admins don't have a year
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
                // Small delay to ensure Supabase propogates changes before refetching
                await new Promise(resolve => setTimeout(resolve, 100));
            } else {
                console.log('[Auth] Admin profile already exists for:', currentUser.email, '. Skipping insert.');
            }

            // Fetch the newly created/existing admin profile
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
                const userAuthRole = currentUser.user_metadata?.role;
                if (userAuthRole === 'student') {
                    setNeedsProfileCreation(true);
                    const currentWindowPath = window.location.pathname;
                    if (currentWindowPath !== '/student-onboarding' && currentWindowPath !== '/complete-profile') {
                        setLocation('/student-onboarding'); // Or wherever your student onboarding page is
                        toast({
                            title: 'Profile incomplete',
                            description: 'Please complete your student profile to continue.',
                        });
                    }
                } else if (userAuthRole === 'admin' && currentUser.email === ADMIN_EMAIL) {
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
                    // User is logged in but no specific role recognized or profile needed
                    setNeedsProfileCreation(false);
                }
                return null;
            }

            console.log(`[Auth] loadUserProfile: Profile found for userId ${currentUser.id}:`, data);
            setNeedsProfileCreation(false);
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
                // Consider if you really need to reload here. Wouter handles client-side navigation.
                // window.location.reload(); 
            } else {
                console.log('[Auth] Already on student dashboard, skipping redirect.');
            }
        } else if (profile.status === 'pending') {
            // Redirect to home or a specific pending page if profile is pending
            if (currentPath !== '/') { // Or '/profile-pending'
                console.log('[Auth] Redirecting to home (profile pending approval)');
                setLocation('/');
            } else {
                console.log('[Auth] Already on home (pending approval), skipping redirect.');
            }
        }
    }, [setLocation]);

    const handleAuthChangeWrapper = useCallback(async (event: string, currentSession: Session | null) => {
        console.log(`[Auth] Auth state changed via wrapper. Event: ${event}, User: ${currentSession?.user?.email || 'No User'}`);

        // Prevent redundant processing for SIGNED_IN if user ID hasn't changed
        if (currentSession?.user && previousUserIdRef.current === currentSession.user.id && event === 'SIGNED_IN') {
            console.log(`[Auth] Wrapper: Skipping redundant SIGNED_IN processing for user ${currentSession.user.id}`);
            setLoading(false);
            return;
        }
        previousUserIdRef.current = currentSession?.user?.id || null; // Update ref with current user ID
        setLoading(true);

        if (currentSession?.user) {
            setUser(currentSession.user);
            setSession(currentSession);
            const profile = await loadUserProfile(currentSession.user); // Pass the full User object
            if (profile) {
                setUserProfile(profile);
                setNeedsProfileCreation(false); // Reset this flag if profile is found
                handlePostAuthRedirect(profile);
            } else {
                setUserProfile(null);
                // If profile not found for a logged-in user, set needsProfileCreation based on role
                const userAuthRole = currentSession.user.user_metadata?.role;
                if (userAuthRole === 'student') {
                    setNeedsProfileCreation(true);
                    if (window.location.pathname !== '/student-onboarding' && window.location.pathname !== '/complete-profile') {
                        setLocation('/student-onboarding');
                    }
                } else if (userAuthRole === 'admin' && currentSession.user.email === ADMIN_EMAIL) {
                    // Admin profile will be auto-created and then loaded by loadUserProfile
                    // If it still results in null here, there's a deeper issue.
                    // The loadUserProfile itself should handle setting the profile.
                    setNeedsProfileCreation(false);
                } else {
                    setNeedsProfileCreation(false); // Default for other roles or unhandled cases
                }
            }
        } else {
            // No user session
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false); // No profile needed if no user
            previousUserIdRef.current = null; // Clear previous user ID on logout

            const currentWindowPath = window.location.pathname;
            const isPublicOrAuthPage = currentWindowPath === '/' || currentWindowPath.startsWith('/public') ||
                                       currentWindowPath.startsWith('/login') || currentWindowPath.startsWith('/signup') ||
                                       currentWindowPath.startsWith('/student-onboarding') || // Allow user to stay on onboarding if signed out during process
                                       currentWindowPath.startsWith('/complete-profile');
            
            if (!isPublicOrAuthPage) {
                console.log('[Auth] No user session and not on public/auth page. Redirecting to login page.');
                setLocation('/login'); // Redirect to login page on logout/no session
            } else {
                console.log('[Auth] No user session, but on a public/auth page. Staying put.');
            }
        }
        setLoading(false); // Done loading for this auth change event
    }, [loadUserProfile, handlePostAuthRedirect, setLocation, ADMIN_EMAIL]);

    const refreshUserProfile = useCallback(async () => {
        if (user) {
            console.log('[Auth] refreshUserProfile called. Triggering session refresh...');
            setLoading(true);
            const { error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
                console.error('[Auth] Error refreshing session during refreshUserProfile:', refreshError.message);
                toast({
                    title: 'Session Refresh Error',
                    description: 'Could not refresh session.',
                    variant: 'destructive',
                });
                setLoading(false);
            }
            // The onAuthStateChange listener will pick up the refreshed session and re-run handleAuthChangeWrapper
        } else {
            console.warn('[Auth] Cannot refresh profile: No user logged in. Clearing profile state.');
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLoading(false);
        }
    }, [user, toast]);


    useEffect(() => {
        if (isInitialCheckDone.current) {
            console.log('[Auth] AuthProvider useEffect: Initial check already performed. Skipping.');
            return;
        }
        console.log('[Auth] AuthProvider useEffect: Starting initial session check.');
        setLoading(true);

        // Get initial session and trigger wrapper
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            handleAuthChangeWrapper('INITIAL_SESSION', initialSession);
            isInitialCheckDone.current = true;
        }).catch(err => {
            console.error('[Auth] Error getting initial session:', err);
            toast({ title: 'Auth Error', description: 'Failed to get initial session.', variant: 'destructive' });
            setLoading(false);
            isInitialCheckDone.current = true;
        });

        // Set up the listener for future auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            handleAuthChangeWrapper(event, session);
        });

        return () => {
            console.log('[Auth] AuthProvider useEffect cleanup: Unsubscribing auth listener.');
            // Ensure authListener and its subscription are defined before unsubscribing
            if (authListener && authListener.subscription) {
                authListener.subscription.unsubscribe();
            }
            // Reset ref on unmount to allow re-initialization if component remounts
            isInitialCheckDone.current = false;
            previousUserIdRef.current = null;
        };
    }, [handleAuthChangeWrapper]); // Dependencies correctly include handleAuthChangeWrapper

    const login = async (email: string, password: string, userType: 'student' | 'admin') => {
        setLoading(true); // Set loading explicitly at start of login function
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
                return;
            }
            console.log('[Auth] Login successful. Auth state listener will handle updates.');
            // The handleAuthChangeWrapper will be called automatically by onAuthStateChange
            // No need to manually set states here, let the listener handle it.
        } catch (err: any) {
            console.error('[Auth] Login caught error:', err);
            toast({ title: 'Login Failed', description: err.message || 'An unexpected error occurred during login.', variant: 'destructive' });
        } finally {
            // The loading state is reset by handleAuthChangeWrapper, or if an error prevents it from being called,
            // we ensure it's reset here if no user/session could be established.
            if (!user && !session) setLoading(false);
        }
    };

    const signUp = async (
        email: string,
        password: string,
        studentName: string,
        htNo: string,
        year: string,
        phone?: string,
        address?: string,
        emergency_no?: string
    ): Promise<{ error: string | null }> => {
        console.log('[Auth] signUp function invoked with email:', email);
        setLoading(true);
        console.log('[Auth] Starting signUp with email:', email);

        try {
            // Defensive check for parameters
            console.log('[Auth] Raw signUp parameters:', { email, password, studentName, htNo, year, phone, address, emergency_no });

            // --- Detect likely swapped fields ---
            // This logic is good for frontend validation/hints, keep it.
            if (
                studentName &&
                year &&
                studentName.trim().toLowerCase() === 'student' &&
                /[a-zA-Z]/.test(year.trim()) &&
                year.trim().length > 3
            ) {
                console.warn('[Auth] WARNING: It looks like the studentName and year fields are swapped in the frontend form. Please check your form mapping.');
            }

            // --- Parameter Type Checks ---
            if (typeof email !== 'string') {
                const errorMessage = `Invalid email type: ${typeof email}`;
                console.error('[Auth] Parameter error:', errorMessage);
                toast({ title: 'Invalid Input', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (typeof password !== 'string') {
                const errorMessage = `Invalid password type: ${typeof password}`;
                console.error('[Auth] Parameter error:', errorMessage);
                toast({ title: 'Invalid Input', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (typeof studentName !== 'string') {
                const errorMessage = `Invalid studentName type: ${typeof studentName}`;
                console.error('[Auth] Parameter error:', errorMessage);
                toast({ title: 'Invalid Input', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (typeof htNo !== 'string') {
                const errorMessage = `Invalid htNo type: ${typeof htNo}`;
                console.error('[Auth] Parameter error:', errorMessage);
                toast({ title: 'Invalid Input', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (typeof year !== 'string') {
                const errorMessage = `Invalid year type: ${typeof year}`;
                console.error('[Auth] Parameter error:', errorMessage);
                toast({ title: 'Invalid Input', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            console.log('[Auth] Parameter type checks passed.');

            // --- Field Validation ---
            console.log('[Auth] Starting field validation...');
            if (!studentName || studentName.trim() === '') {
                const errorMessage = 'Student Name is required.';
                console.error('[Auth] Validation failed:', errorMessage);
                toast({ title: 'Missing Field', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (studentName.trim().toLowerCase() === 'student') {
                const errorMessage = 'Student Name cannot be "student". Please provide a valid name.';
                console.error('[Auth] Validation failed:', errorMessage);
                toast({ title: 'Invalid Field', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (/^\d+$/.test(studentName.trim())) {
                const errorMessage = 'Student Name cannot be a number. Please enter your full name.';
                console.error('[Auth] Validation failed:', errorMessage);
                toast({ title: 'Invalid Name', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (!year || year.trim() === '') {
                const errorMessage = 'Year is required.';
                console.error('[Auth] Validation failed:', errorMessage);
                toast({ title: 'Missing Field', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (year.trim().toUpperCase() === studentName.trim().toUpperCase()) {
                const errorMessage = 'Year cannot be the same as the student name.';
                console.error('[Auth] Validation failed:', errorMessage);
                toast({ title: 'Invalid Field', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (!/^[1-4]$/.test(year.trim())) {
                const errorMessage = 'Year must be a number between 1 and 4 (e.g., 1, 2, 3, or 4).';
                console.error('[Auth] Validation failed:', errorMessage);
                toast({ title: 'Invalid Year', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            if (!password || password.length < 6) {
                const errorMessage = 'Password must be at least 6 characters long.';
                console.error('[Auth] Validation failed:', errorMessage);
                toast({ title: 'Invalid Password', description: errorMessage, variant: 'destructive' });
                setLoading(false);
                return { error: errorMessage };
            }
            console.log('[Auth] Field validation passed.');

            const trimmedName = studentName.trim();
            const trimmedHtNo = htNo.trim().toUpperCase();
            const trimmedYear = year.trim();

            const formData = {
                student_name: trimmedName,
                ht_no: trimmedHtNo,
                year: trimmedYear,
                phone: phone?.trim() || null,
                address: address?.trim() || null,
                emergency_no: emergency_no?.trim() || null,
            };

            console.log('[Auth] signUp formData:', formData);

            // 1. Create the user in Supabase Auth (Auth still lives in supabaseOld)
            console.log('[Auth] Calling supabase.auth.signUp for email:', email);
            const { data: userData, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: 'student' // Attach role to user metadata on signup
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
                setLoading(false);
                return { error: signUpError?.message || 'Signup failed' };
            }

            const supabaseUser = userData.user;
            console.log('[Auth] Supabase user created with ID:', supabaseUser.id);

            // 2. Check for existing profile in user_profiles table (in supabaseOld)
            console.log('[Auth] Checking for existing profile for user ID:', supabaseUser.id);
            const { data: existingProfile, error: existingProfileCheckError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', supabaseUser.id)
                .maybeSingle();

            if (existingProfileCheckError && existingProfileCheckError.code !== 'PGRST116') {
                console.error('[Auth] Error checking for existing profile before insert:', existingProfileCheckError);
                toast({
                    title: 'Profile Check Error',
                    description: existingProfileCheckError.message,
                    variant: 'destructive',
                });
                await supabase.auth.signOut(); // Sign out the partially created user
                setLoading(false);
                return { error: existingProfileCheckError.message };
            }

            let createdOrFetchedProfile: UserProfile | null = null;
            if (!existingProfile) {
                console.log('[Auth] No existing profile found. Inserting new student profile.');
                const { data: insertedProfile, error: profileInsertError } = await supabase
                    .from('user_profiles')
                    .insert([
                        {
                            id: supabaseUser.id,
                            email: supabaseUser.email!,
                            student_name: formData.student_name,
                            ht_no: formData.ht_no,
                            year: formData.year,
                            phone: formData.phone,
                            address: formData.address,
                            emergency_no: formData.emergency_no,
                            role: 'student', // Default role for new signups
                            status: 'pending', // Default status for new signups - requires admin approval
                        }
                    ])
                    .select('*')
                    .single();

                if (profileInsertError) {
                    console.error('[Auth] Error inserting user profile:', profileInsertError.message);
                    toast({
                        title: 'Profile Creation Error',
                        description: profileInsertError.message,
                        variant: 'destructive',
                    });
                    await supabase.auth.signOut(); // Clean up auth user if profile creation fails
                    setLoading(false);
                    return { error: profileInsertError.message };
                }
                console.log('[Auth] Student profile inserted successfully:', insertedProfile);
                createdOrFetchedProfile = insertedProfile;
            } else {
                console.warn('[Auth] User profile unexpectedly exists for new signup. Fetching existing profile for ID:', supabaseUser.id);
                // Attempt to load existing profile to update context
                createdOrFetchedProfile = await loadUserProfile(supabaseUser);
            }

            if (createdOrFetchedProfile) {
                console.log('[Auth] Setting user profile in state:', createdOrFetchedProfile);
                setUser(supabaseUser);
                setSession(userData.session);
                setUserProfile(createdOrFetchedProfile);
                setNeedsProfileCreation(false); // Profile is now created/fetched
                handlePostAuthRedirect(createdOrFetchedProfile); // Redirect based on the newly created profile
                toast({
                    title: 'Account created successfully',
                    description: 'Welcome! Your profile is pending approval.', // Adjusted for pending status
                });
            } else {
                console.warn('[Auth] Signup successful, but profile could not be established in AuthContext state.');
                toast({
                    title: 'Signup Success, Profile Error',
                    description: 'Your account was created, but there was an issue setting up your profile.',
                    variant: 'destructive',
                });
            }

            return { error: null };
        } catch (err: any) {
            console.error('[Auth] Unexpected error during sign up:', {
                message: err.message,
                stack: err.stack,
                name: err.name
            });
            toast({
                title: 'Signup Failed',
                description: err.message || 'An unexpected error occurred during sign up.',
                variant: 'destructive',
            });
            // Ensure loading is set to false even on unexpected errors
            setLoading(false);
            return { error: err.message || 'An unexpected error occurred during sign up.' };
        } finally {
            // Loading state will be handled by handleAuthChangeWrapper if session is established.
            // If an error occurred that prevented session establishment, ensure it's false.
            if (!user && !session) setLoading(false);
        }
    };

    const createProfile = async (profileData: { phone?: string; address?: string; emergency_no?: string; ht_no?: string; student_name?: string; year?: string; }) => {
        if (!user) {
            console.error('[Auth] createProfile: No authenticated user.');
            toast({ title: 'Error', description: 'User not authenticated to create profile.', variant: 'destructive' });
            setLoading(false); // Ensure loading is reset
            return;
        }
        setLoading(true);
        try {
            console.log('[Auth] Attempting to create/update student profile for user:', user.id);
            const updatePayload: Partial<UserProfile> = {
                ...profileData,
                email: user.email!,
                status: 'pending', // New profiles typically start as pending
                role: (userProfile?.role || 'student') as 'student', // Preserve existing role or default to 'student'
            };
            Object.keys(updatePayload).forEach(key => {
                const value = (updatePayload as any)[key];
                // Clean up empty strings or nulls to avoid issues with DB constraints if columns are NOT NULL
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
            await refreshUserProfile(); // Refresh to get updated profile data
            toast({ title: 'Profile submitted for approval', description: 'Your profile is pending admin approval.' }); // Adjusted for pending status
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
            setLoading(true); // Set loading explicitly for logout
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('[Auth] Logout error:', error);
                toast({ title: 'Logout Error', description: error.message, variant: 'destructive' });
            } else {
                console.log('[Auth] Logout successful.');
                toast({ title: 'Logged out successfully' });
                // handleAuthChangeWrapper will be called by onAuthStateChange, which redirects.
            }
        } catch (error: any) {
            console.error('[Auth] Logout caught error:', error);
            toast({ title: 'Logout Failed', description: error.message || 'An unexpected error occurred during logout.', variant: 'destructive' });
        } finally {
            // Ensure loading is false. If auth listener doesn't trigger, this catches it.
            setLoading(false);
        }
    };

    // Render loading state if initial check is not done
    if (loading && !isInitialCheckDone.current) {
        console.log('[Auth] Render: Initial authentication state is being determined...');
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    // Render loading state for ongoing auth actions (login, signup, refresh)
    if (loading) { // This `if` block handles ongoing auth operations
        console.log('[Auth] Render: Processing authentication action (login/signup/refresh)...');
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    console.log('[Auth] Render: Authentication state determined. Rendering children.');
    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                userProfile,
                loading,
                isAuthenticated: !!user,
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
