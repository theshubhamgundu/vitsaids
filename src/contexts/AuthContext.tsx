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
    // Potentially add a method to refresh user profile explicitly if needed by other components
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

    // Memoized version of loadUserProfile for stability in useEffect dependencies
    const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        console.log(`[Auth] loadUserProfile: querying for userId: ${userId}`);
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle(); // Use maybeSingle to get null if no row found

        if (error) {
            console.error('[Auth] loadUserProfile error:', error);
            // Do not throw, just return null so the calling function can handle it
            return null;
        }
        console.log('[Auth] loadUserProfile result:', data);
        return data || null;
    }, []); // No dependencies, as supabase is stable

    // Function to refresh the user profile explicitly
    const refreshUserProfile = useCallback(async () => {
        if (user) {
            console.log('[Auth] Refreshing user profile...');
            const profile = await loadUserProfile(user.id);
            setUserProfile(profile);
            // Re-evaluate needsProfileCreation based on the refreshed profile
            setNeedsProfileCreation(!profile && user.user_metadata?.role === 'student');
            console.log('[Auth] User profile refreshed:', profile);
        }
    }, [user, loadUserProfile]);


    // Main effect for initial load and authentication state changes
    useEffect(() => {
        let isMounted = true; // To prevent state updates on unmounted component
        const cleanupFunctions: (() => void)[] = [];

        const initializeAuth = async () => {
            setLoading(true); // Start loading at the very beginning of init
            console.log('[Auth] Initializing auth...');

            // Fetch current session immediately
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('[Auth] Error getting initial session:', sessionError);
                // Continue, but without a valid session
            }

            if (isMounted) {
                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
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
                            toast({ title: 'Admin profile created', description: 'Welcome, administrator!' });
                        }
                    }

                    setUserProfile(profile);
                    // Determine if student needs profile creation
                    setNeedsProfileCreation(!profile && currentSession.user.user_metadata?.role === 'student');

                } else {
                    console.log('[Auth] Auth state changed: SIGNED_OUT or INITIAL_SESSION (no user)');
                    setUserProfile(null);
                    setNeedsProfileCreation(false);
                }
                setLoading(false); // End loading after initial auth state is set
                console.log('[Auth] Auth initialization complete.');
            }
        };

        initializeAuth(); // Run once on component mount

        // Listen for auth state changes (e.g., login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log('[Auth] Auth state changed:', _event, session?.user?.email);

            if (!isMounted) return; // Prevent state updates if component unmounted

            // Always update session and user first
            setSession(session);
            setUser(session?.user ?? null);

            // Fetch user profile after auth state change, with a small delay for consistency.
            // The delay helps ensure the DB update from login/signup has propagated, reducing race conditions.
            // Only fetch profile if a user is present in the session
            const profile = session?.user ? await loadUserProfile(session.user.id) : null;

            if (isMounted) { // Check mount status again after async operation
                // Handle admin auto-creation on state change if needed (e.g., after initial admin login)
                if (!profile && session?.user?.email === 'admin@vignanits.ac.in') {
                    console.log('[Auth] Auto-creating admin profile on state change (if not found)...');
                    const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                        id: session.user.id,
                        email: session.user.email,
                        role: 'admin',
                        status: 'approved',
                    });
                    if (adminInsertError) {
                        console.error('[Auth] Admin auto-creation error on state change:', adminInsertError);
                    } else {
                        // Successfully auto-created, so reload profile
                        const newProfile = await loadUserProfile(session.user.id);
                        setUserProfile(newProfile);
                        toast({ title: 'Admin profile created', description: 'Welcome, administrator!' });
                    }
                } else {
                    setUserProfile(profile);
                }

                setNeedsProfileCreation(!profile && session?.user?.user_metadata?.role === 'student');
                console.log('[Auth] Auth state processing complete.');
            }
        });

        cleanupFunctions.push(() => subscription.unsubscribe());

        return () => {
            isMounted = false;
            cleanupFunctions.forEach(func => func());
        };
    }, [loadUserProfile, toast]); // Dependencies: loadUserProfile (memoized), toast (stable)

    const login = async (email: string, password: string, userType: 'student' | 'admin') => {
        setLoading(true); // Start loading for login operation
        try {
            console.log(`[Auth] Attempting login for ${userType} with email: ${email}`);

            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.error('[Auth] Login failed:', error.message);
                toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
                throw error; // Re-throw to propagate error for calling components if needed
            }

            if (data.user) {
                console.log('[Auth] Login successful for user ID:', data.user.id);
                // Directly load profile to ensure it's available immediately after login
                let profile = await loadUserProfile(data.user.id);

                // If profile is not immediately available, retry once after a short delay
                // This can happen due to replication lag or timing
                if (!profile) {
                    console.log('[Auth] Profile not found immediately after login, retrying (1s delay)...');
                    await new Promise((res) => setTimeout(res, 1000)); // Wait 1 second
                    profile = await loadUserProfile(data.user.id);
                }

                // Update context states
                setUser(data.user);
                setUserProfile(profile);

                // Handle immediate redirection based on the fetched profile
                if (!profile && userType === 'student') {
                    // This scenario means a student logged in but has no profile record.
                    setNeedsProfileCreation(true); // Indicate that profile creation is needed
                    toast({ title: 'Complete Profile', description: 'Please complete your student profile.' });
                    console.log('[Auth] Student needs profile creation. Showing modal or redirecting to profile completion page.');
                    // Do NOT redirect to dashboard, let the UI handle the modal or a specific profile completion route
                    // If you have a dedicated /create-profile page, you might redirect there:
                    // setLocation('/create-profile');
                } else if (profile?.role === 'admin' && profile.status === 'approved') {
                    toast({ title: 'Login Successful', description: 'Redirecting to Admin Dashboard.' });
                    setLocation('/admin-dashboard');
                    console.log('[Auth] Redirecting to admin dashboard.');
                } else if (profile?.role === 'student' && profile.status === 'approved') {
                    toast({ title: 'Login Successful', description: 'Redirecting to Student Dashboard.' });
                    setLocation('/student-dashboard');
                    console.log('[Auth] Redirecting to student dashboard.');
                } else {
                    // Fallback for unexpected roles, pending statuses, or still null profile (but user exists)
                    toast({ title: 'Login Successful', description: 'Access denied or profile incomplete. Contact admin.' });
                    setLocation('/'); // Redirect to a generic landing page or home
                    console.log('[Auth] Login successful but unexpected profile state. Redirecting to home.');
                }
            } else {
                 // Should ideally not happen if data.user is null but no error
                 console.warn('[Auth] Login succeeded without user data or error.');
                 toast({ title: 'Login issue', description: 'Login successful, but no user data found.', variant: 'destructive' });
                 setLocation('/'); // Redirect to home in case of unexpected state
            }
        } catch (err: any) {
            // Error already toasted above by specific error check
            console.error('[Auth] Login caught error:', err);
        } finally {
            setLoading(false); // End loading regardless of success or failure
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
        setLoading(true); // Start loading for signup operation
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
                options: { data: { role: userType } }, // Store initial role in user_metadata
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
                email: email, // Use the email passed to the function
                role: userType,
                // Students generally start as 'pending' for admin approval unless you auto-approve
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
                // Consider signing out the user if profile creation fails for consistency
                await supabase.auth.signOut();
                return { error: insertError };
            }
            console.log('[Auth] User profile inserted successfully.');

            // Fetch the newly created profile to ensure state is accurate
            let newlyInsertedProfile = await loadUserProfile(userId);
            // Retry fetching profile if it's null immediately after insert
            if (!newlyInsertedProfile) {
                console.log('[Auth] Profile not found immediately after insert, retrying after a short delay (1s)...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                newlyInsertedProfile = await loadUserProfile(userId);
                if (!newlyInsertedProfile) {
                    console.error('[Auth] Profile still null after retry. This might lead to profile creation prompt.');
                }
            }
            console.log('[Auth] Verifying profile immediately after insert (after retry):', newlyInsertedProfile);

            setUserProfile(newlyInsertedProfile); // Update context state with the new profile
            setUser(data.user); // Update user state to reflect the new session (if any change)

            // Redirect based on the newly inserted profile's role and status
            if (newlyInsertedProfile?.role === 'student' && newlyInsertedProfile.status === 'approved') {
                toast({ title: 'Account created', description: 'Redirecting to Student Dashboard.' });
                setLocation('/student-dashboard');
                console.log('[Auth] Redirecting to student dashboard after sign-up.');
            } else if (newlyInsertedProfile?.role === 'admin' && newlyInsertedProfile.status === 'approved') {
                toast({ title: 'Account created', description: 'Redirecting to Admin Dashboard.' });
                setLocation('/admin-dashboard');
                console.log('[Auth] Redirecting to admin dashboard after sign-up.');
            } else {
                // If status is 'pending' for a student, or any other unhandled case
                toast({ title: 'Account created', description: 'Profile status pending review or role not recognized. You may need to complete your profile or wait for approval.' });
                // If a student is 'pending', they might be redirected to a waiting page or home
                setLocation('/');
                console.log('[Auth] Sign-up complete, but profile status pending or role unrecognized. Redirecting to home.');
            }

            return { error: null };
        } catch (error: any) {
            console.error('[Auth] General signUp catch error:', error);
            toast({ title: 'Signup Failed', description: error.message || 'An unexpected error occurred during sign up.', variant: 'destructive' });
            return { error: { message: error.message || 'An unexpected error occurred during sign up.' } };
        } finally {
            setLoading(false); // End loading regardless of success or failure
        }
    };

    const createProfile = async (profileData: { ht_no: string; student_name: string; year: string }) => {
        if (!user) {
            toast({ title: 'Error', description: 'User not authenticated to create profile.', variant: 'destructive' });
            throw new Error('User not authenticated');
        }
        setLoading(true); // Indicate loading for profile creation
        console.log('[Auth] Attempting to create/update student profile for user:', user.id);

        try {
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
                toast({ title: 'Profile Update Failed', description: error.message, variant: 'destructive' });
                throw error;
            }

            console.log('[Auth] Student profile updated. Refreshing context state...');
            // Directly refresh the user profile in the context after successful update
            await refreshUserProfile(); // Use the new refreshUserProfile function

            setNeedsProfileCreation(false); // No longer needs profile creation

            // Redirect after successful profile creation
            if (userProfile?.role === 'student' && userProfile.status === 'approved') { // Check updated profile after refresh
                setLocation('/student-dashboard');
                console.log('[Auth] Redirecting to student dashboard after profile creation.');
                toast({ title: 'Profile created successfully', description: 'Welcome to your dashboard!' });
            } else {
                toast({ title: 'Profile Updated', description: 'Profile updated, but unexpected role/status. Contact admin.' });
                setLocation('/'); // Fallback
            }
        } catch (error: any) {
            console.error('[Auth] General createProfile catch error:', error);
            toast({ title: 'Profile Update Failed', description: error.message || 'An unexpected error occurred during profile update.', variant: 'destructive' });
        } finally {
            setLoading(false); // End loading
        }
    };

    const closeProfileCreationModal = () => {
        setNeedsProfileCreation(false);
        console.log('[Auth] Profile creation modal closed.');
    };

    const logout = async () => {
        setLoading(true); // Indicate loading during logout
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
            // Error handling for unexpected issues during logout
        } finally {
            // Explicitly clear state immediately on logout, regardless of success or failure
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLocation('/'); // Always redirect to home on logout
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
                refreshUserProfile, // Expose the refresh function
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
