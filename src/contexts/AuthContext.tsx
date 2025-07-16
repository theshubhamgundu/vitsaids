// AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter'; // Assuming wouter for routing

// Define the UserProfile interface (ensure it matches your database schema)
// Updated to reflect expected types from your schema
interface UserProfile {
    id: string; // Corresponds to auth.users.id
    role: 'student' | 'admin' | 'faculty' | 'none'; // 'none' for newly signed up users without profile yet
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
        userType: 'student' | 'admin',
        htNo?: string,
        studentName?: string,
        year?: string
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

    const { toast } = useToast();
    const [, setLocation] = useLocation();

    // Helper function to load user profile
    const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        console.log(`[Auth] loadUserProfile: querying for userId: ${userId}`);
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error('[Auth] loadUserProfile error:', error);
            // Consider what to do here. If it's a "not found" error, it's not a critical error.
            // If it's a network error, it is. For now, treat all as potential issues.
            return null;
        }
        console.log('[Auth] loadUserProfile result:', data);
        return data ? (data as UserProfile) : null;
    }, []);

    // Function to refresh the user profile state explicitly
    const refreshUserProfile = useCallback(async () => {
        if (user) {
            console.log('[Auth] Refreshing user profile...');
            const profile = await loadUserProfile(user.id);
            if (profile) {
                setUserProfile(profile);
                setNeedsProfileCreation(false); // If profile is found, they don't need creation
            } else {
                // If profile not found after refresh, and user's metadata role is student, set needsProfileCreation
                if (user.user_metadata?.role === 'student') {
                    setNeedsProfileCreation(true);
                    console.warn('[Auth] User profile still not found after refresh; student needs profile creation.');
                }
                setUserProfile(null); // Explicitly set to null if not found
            }
            console.log('[Auth] User profile refreshed. Current profile:', profile);
        } else {
            console.warn('[Auth] Cannot refresh profile: No user logged in.');
            setUserProfile(null);
            setNeedsProfileCreation(false);
        }
    }, [user, loadUserProfile]);

    // Main effect for initial load and authentication state changes
    useEffect(() => {
        let isMounted = true;
        const cleanupFunctions: (() => void)[] = [];

        const initializeAuth = async () => {
            setLoading(true); // Start loading
            console.log('[Auth] Initializing auth...');
            let currentProfile: UserProfile | null = null;
            let currentSession: Session | null = null;
            let currentUser: User | null = null;

            try {
                // Fetch initial session
                const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

                if (!isMounted) return; // Exit if unmounted during async operation

                if (sessionError) {
                    console.error('[Auth] Error getting initial session:', sessionError);
                }

                currentSession = initialSession;
                currentUser = initialSession?.user ?? null;

                if (currentUser) {
                    console.log('[Auth] Found current user:', currentUser.email);
                    currentProfile = await loadUserProfile(currentUser.id);

                    if (!isMounted) return;

                    // Auto-create admin profiles if they don't exist
                    if (!currentProfile && currentUser.email === 'admin@vignanits.ac.in') {
                        console.log('[Auth] Auto-creating admin profile during initialization...');
                        const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                            id: currentUser.id,
                            email: currentUser.email,
                            role: 'admin',
                            status: 'approved',
                        });
                        if (adminInsertError) {
                            console.error('[Auth] Admin auto-creation error during init:', adminInsertError);
                        } else {
                            currentProfile = await loadUserProfile(currentUser.id); // Reload profile
                            if (isMounted && currentProfile) {
                                toast({ title: 'Admin profile created', description: 'Welcome, administrator!' });
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('[Auth] Error during initializeAuth:', e);
            } finally {
                if (isMounted) {
                    setSession(currentSession);
                    setUser(currentUser);
                    setUserProfile(currentProfile);
                    // Determine needsProfileCreation based on the *retrieved* profile and user's auth metadata role
                    const userAuthRole = currentUser?.user_metadata?.role;
                    setNeedsProfileCreation(!currentProfile && userAuthRole === 'student');
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
            let newUser: User | null = session?.user ?? null;

            try {
                setSession(session);
                setUser(newUser); // Update user state first

                if (newUser) {
                    newProfile = await loadUserProfile(newUser.id);

                    if (!isMounted) return;

                    // Handle admin auto-creation on state change if needed (e.g., after initial signup)
                    if (!newProfile && newUser.email === 'admin@vignanits.ac.in') {
                        console.log('[Auth] Auto-creating admin profile on state change listener (if not found)...');
                        const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                            id: newUser.id,
                            email: newUser.email,
                            role: 'admin',
                            status: 'approved',
                        });
                        if (adminInsertError) {
                            console.error('[Auth] Admin auto-creation error on state change listener:', adminInsertError);
                        } else {
                            newProfile = await loadUserProfile(newUser.id); // Reload profile
                            if (isMounted && newProfile) {
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
                    const newUserAuthRole = newUser?.user_metadata?.role;
                    setNeedsProfileCreation(!newProfile && newUserAuthRole === 'student');
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
    }, [loadUserProfile, toast]); // Removed `user` from dependencies to prevent infinite loop on user state changes. `user` is updated within the effect.

    const login = async (email: string, password: string, userType: 'student' | 'admin') => {
        setLoading(true);
        try {
            console.log(`[Auth] Attempting login for ${userType} with email: ${email}`);
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                console.error('[Auth] Login failed:', error.message);
                toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
                throw error; // Re-throw to allow component to handle if needed
            }

            if (data.user) {
                console.log('[Auth] Login successful for user ID:', data.user.id);

                // Update session and user states immediately
                setSession(data.session);
                setUser(data.user);

                let profile = await loadUserProfile(data.user.id);
                if (!profile) {
                    console.log('[Auth] Profile not found immediately after login, attempting auto-create for admin or noting student profile need.');
                    // Handle admin auto-creation upon first login if not already done by listener
                    if (data.user.email === 'admin@vignanits.ac.in') {
                        const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                            id: data.user.id,
                            email: data.user.email,
                            role: 'admin',
                            status: 'approved',
                        });
                        if (adminInsertError) {
                            console.error('[Auth] Admin auto-creation error during login:', adminInsertError);
                        } else {
                            profile = await loadUserProfile(data.user.id); // Reload profile
                            if (profile) toast({ title: 'Admin profile created', description: 'Welcome, administrator!' });
                        }
                    }
                }

                setUserProfile(profile);

                // Determine redirection and needsProfileCreation based on the *fetched* profile and userType
                if (!profile && userType === 'student') {
                    setNeedsProfileCreation(true);
                    toast({ title: 'Complete Profile', description: 'Please complete your student profile to proceed.' });
                    setLocation('/student-dashboard'); // Redirect to dashboard to show modal
                    console.log('[Auth] Student needs profile creation. Redirecting to student dashboard.');
                } else if (profile?.role === 'admin' && profile.status === 'approved') {
                    toast({ title: 'Login Successful', description: 'Redirecting to Admin Dashboard.' });
                    setLocation('/admin-dashboard');
                    console.log('[Auth] Redirecting to admin dashboard.');
                } else if (profile?.role === 'student' && profile.status === 'approved') {
                    toast({ title: 'Login Successful', description: 'Redirecting to Student Dashboard.' });
                    setLocation('/student-dashboard');
                    console.log('[Auth] Redirecting to student dashboard.');
                } else {
                    toast({ title: 'Login Successful', description: 'Access denied or profile incomplete. Contact admin for approval.' });
                    // If profile exists but status is not approved, or role doesn't match
                    // We log them out and redirect to home/login
                    await supabase.auth.signOut(); // Log out if unauthorized role/status
                    setLocation('/');
                    console.log('[Auth] Login successful but unauthorized role/status. Logging out and redirecting to home.');
                }
            } else {
                console.warn('[Auth] Login succeeded but no user data found.');
                toast({ title: 'Login issue', description: 'Login successful, but no user data found.', variant: 'destructive' });
                setLocation('/');
            }
        } catch (err: any) {
            console.error('[Auth] Login caught error:', err);
            // Error already toasted by the specific error handlers within try block
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
                options: { data: { role: userType } }, // Store role in user_metadata
            });

            if (error) {
                console.error('[Auth] Supabase signUp error:', error.message);
                toast({ title: 'Signup Error', description: error.message, variant: 'destructive' });
                return { error };
            }

            const userId = data.user?.id;
            console.log('[Auth] Supabase sign up initiated. User ID:', userId, 'Confirmation needed:', data.user?.email_confirmed_at === null);

            if (!userId) {
                console.error('[Auth] Sign-up succeeded but user ID missing after Supabase call.');
                toast({ title: 'Signup Error', description: 'Sign-up succeeded but user ID missing.', variant: 'destructive' });
                return { error: { message: 'Sign-up succeeded but user ID missing.' } };
            }

            // Set user and session states immediately after successful signup to reflect Auth state
            setUser(data.user);
            setSession(data.session);

            const insertData: Partial<UserProfile> = {
                id: userId,
                email: email,
                role: userType, // Role from signup input
                status: userType === 'admin' ? 'approved' : 'pending', // Default status
            };

            if (userType === 'student') {
                insertData.ht_no = htNo || null;
                insertData.student_name = studentName || null;
                insertData.year = year || null;
            }

            console.log('[Auth] Attempting to insert user profile with data:', insertData);
            const { error: insertError } = await supabase.from('user_profiles').insert(insertData);

            if (insertError) {
                console.error('[Auth] Error inserting user profile:', insertError);
                console.error('[Auth] Insert error details:', insertError.message);
                toast({ title: 'Profile Creation Error', description: insertError.message, variant: 'destructive' });
                // If profile insertion fails, we should log out the user from auth to avoid orphaned accounts
                await supabase.auth.signOut();
                return { error: insertError };
            }
            console.log('[Auth] User profile inserted successfully.');

            // Load the newly created profile to update AuthContext state
            const newlyInsertedProfile = await loadUserProfile(userId);
            setUserProfile(newlyInsertedProfile);

            // Determine what to do after profile creation
            if (newlyInsertedProfile?.role === 'student') {
                if (newlyInsertedProfile.status === 'approved') {
                    toast({ title: 'Account created', description: 'Redirecting to Student Dashboard.' });
                    setLocation('/student-dashboard');
                } else { // status is 'pending' for students
                    toast({ title: 'Account created', description: 'Your account is pending approval. You may need to complete your profile for full access.' });
                    setNeedsProfileCreation(true); // Still show modal if general profile incomplete details are required
                    setLocation('/student-dashboard'); // Redirect to dashboard to potentially show modal
                }
            } else if (newlyInsertedProfile?.role === 'admin' && newlyInsertedProfile.status === 'approved') {
                toast({ title: 'Account created', description: 'Redirecting to Admin Dashboard.' });
                setLocation('/admin-dashboard');
            } else {
                toast({ title: 'Account created', description: 'Profile status pending review or role not recognized. You may need to wait for approval.' });
                setLocation('/');
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

    const createProfile = async (profileData: { phone?: string; address?: string; emergency_no?: string; ht_no?: string; student_name?: string; year?: string; }) => {
        if (!user) {
            toast({ title: 'Error', description: 'User not authenticated to create profile.', variant: 'destructive' });
            return; // Exit if no user
        }
        setLoading(true);
        console.log('[Auth] Attempting to create/update student profile for user:', user.id);

        try {
            // Merge profileData with current userProfile values to ensure all fields are sent for update
            // This is for the scenario where a student completes their *initial* profile or updates later
            const updatePayload: Partial<UserProfile> = {
                ...userProfile, // Start with current profile data
                ...profileData, // Overlay new data from the form
                id: user.id, // Ensure ID is correct
                email: user.email!, // Email should always be present from auth
                role: userProfile?.role || (user.user_metadata?.role as UserProfile['role']) || 'student', // Preserve existing role or default
                status: userProfile?.status || 'approved', // Default to approved on completion if not explicitly set
            };

            // Remove undefined fields to avoid issues with Supabase `update`
            Object.keys(updatePayload).forEach(key => {
                if ((updatePayload as any)[key] === undefined) {
                    delete (updatePayload as any)[key];
                }
            });

            console.log('[Auth] Profile update payload:', updatePayload);

            const { error } = await supabase
                .from('user_profiles')
                .update(updatePayload) // Use update, not upsert, as profile should exist
                .eq('id', user.id);

            if (error) {
                console.error('[Auth] Error updating student profile:', error);
                toast({ title: 'Profile Update Failed', description: error.message, variant: 'destructive' });
                throw error;
            }

            console.log('[Auth] Student profile updated. Refreshing context state...');
            await refreshUserProfile(); // This will update userProfile and needsProfileCreation

            setNeedsProfileCreation(false); // Explicitly close the modal state

            toast({ title: 'Profile updated successfully', description: 'Welcome to your dashboard!' });
            setLocation('/student-dashboard'); // Ensure redirection to dashboard after completion

        } catch (error: any) {
            console.error('[Auth] General createProfile catch error:', error);
            toast({ title: 'Profile Update Failed', description: error.message || 'An unexpected error occurred during profile update.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const closeProfileCreationModal = useCallback(() => {
        setNeedsProfileCreation(false);
        console.log('[Auth] Profile creation modal closed.');
    }, []); // Use useCallback for stability

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
            // These state updates are crucial after logout.
            // The onAuthStateChange listener will also pick this up,
            // but setting them here ensures immediate UI feedback.
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLocation('/'); // Always redirect to home/login after logout
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
