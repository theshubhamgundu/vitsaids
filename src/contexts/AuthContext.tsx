// AuthContext.tsx
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
    const [initialized, setInitialized] = useState(false);

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
                // Don't throw error for missing profile - it's expected for new users
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

    // Initialize auth state
    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                console.log('[Auth] Initializing auth (initial load)...');

                // Get initial session
                const { data: { session: initialSession } } = await supabase.auth.getSession();
                console.log('[DEBUG] Initial session:', initialSession);
                console.log('[DEBUG] Initial user:', initialSession?.user);

                if (!isMounted) return;

                const currentUser = initialSession?.user ?? null;
                let currentProfile: UserProfile | null = null;

                if (currentUser) {
                    console.log('[Auth] Found current user during init:', currentUser.email, 'ID:', currentUser.id, 'Role:', currentUser.user_metadata?.role);

                    // Load existing profile
                    currentProfile = await loadUserProfile(currentUser.id);

                    // If no profile exists, try to create one for admin
                    if (!currentProfile) {
                        currentProfile = await handleProfileCreation(currentUser);
                    }
                }

                if (isMounted) {
                    setSession(initialSession);
                    setUser(currentUser);
                    setUserProfile(currentProfile);

                    const userAuthRole = currentUser?.user_metadata?.role;
                    const needs = (!currentProfile && userAuthRole === 'student');
                    setNeedsProfileCreation(needs);

                    console.log(`[Auth] Auth initialization complete. User: ${currentUser?.email}, Profile: ${currentProfile ? 'Found' : 'Not Found'}, NeedsProfileCreation: ${needs}`);
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
                    setInitialized(true);
                }
            }
        };

        initializeAuth();

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Auth state changed via listener. Event: ${event}, User: ${session?.user?.email}`);

            if (!isMounted || !initialized) return;

            // Don't set loading for sign out events to prevent UI flicker
            if (event !== 'SIGNED_OUT') {
                setLoading(true);
            }

            try {
                const newUser = session?.user ?? null;
                let newProfile: UserProfile | null = null;

                setSession(session);
                setUser(newUser);

                if (newUser) {
                    console.log('[Auth] Listener: User present. Loading profile for:', newUser.email, 'ID:', newUser.id, 'Role:', newUser.user_metadata?.role);

                    // Load existing profile
                    newProfile = await loadUserProfile(newUser.id);

                    // If no profile exists, try to create one for admin
                    if (!newProfile) {
                        newProfile = await handleProfileCreation(newUser);
                    }
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
    }, [loadUserProfile, handleProfileCreation, initialized]);

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

            console.log('[Auth] Login successful for user ID:', data.user.id);

            // Wait a moment for auth state to settle
            await new Promise(resolve => setTimeout(resolve, 500));

            // Load profile
            let profile = await loadUserProfile(data.user.id);

            // Try to create admin profile if needed
            if (!profile) {
                profile = await handleProfileCreation(data.user);
            }

            // Handle redirection based on profile
            if (!profile && userType === 'student') {
                toast({ title: 'Complete Profile', description: 'Please complete your student profile to proceed.' });
                setLocation('/student-dashboard');
            } else if (profile?.role === 'admin' && profile.status === 'approved') {
                toast({ title: 'Login Successful', description: 'Redirecting to Admin Dashboard.' });
                setLocation('/admin-dashboard');
            } else if (profile?.role === 'student' && profile.status === 'approved') {
                toast({ title: 'Login Successful', description: 'Redirecting to Student Dashboard.' });
                setLocation('/student-dashboard');
            } else if (profile?.status === 'pending') {
                toast({ title: 'Account Pending', description: 'Your account is pending approval. Please wait for admin approval.' });
                setLocation('/');
            } else {
                toast({ title: 'Access Denied', description: 'Profile incomplete or access denied. Contact admin.' });
                await supabase.auth.signOut();
                setLocation('/');
            }

        } catch (err: any) {
            console.error('[Auth] Login caught error:', err);
            toast({ title: 'Login Failed', description: err.message || 'An unexpected error occurred during login.', variant: 'destructive' });
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

            // Verify student if needed
            if (userType === 'student') {
                console.log(`[Auth] Verifying student: HT No: ${htNo}, Name: ${studentName}, Year: ${year}`);

                const { data: studentData, error: verifyError } = await supabase
                    .from('verified_students')
                    .select('*')
                    .ilike('ht_no', htNo || '')
                    .ilike('student_name', studentName || '')
                    .ilike('year', year || '')
                    .maybeSingle();

                if (verifyError) {
                    console.error('[Auth] Student verification query failed:', verifyError.message);
                    toast({ title: 'Verification Error', description: verifyError.message, variant: 'destructive' });
                    return { error: verifyError };
                }

                if (!studentData) {
                    console.error('[Auth] Student verification failed: No matching student found.');
                    toast({ title: 'Verification Failed', description: 'Student not found in verified list. Contact admin.', variant: 'destructive' });
                    return { error: { message: 'Student not found in verified list. Contact admin.' } };
                }

                console.log('[Auth] Student verification successful:', studentData);
            }

            // Create auth user
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

            if (!data.user?.id) {
                console.error('[Auth] Sign-up succeeded but user ID missing.');
                toast({ title: 'Signup Error', description: 'Sign-up succeeded but user ID missing.', variant: 'destructive' });
                return { error: { message: 'Sign-up succeeded but user ID missing.' } };
            }

            console.log('[Auth] Supabase sign up successful. User ID:', data.user.id);

            // Prepare profile data
            const insertData: Partial<UserProfile> = {
                id: data.user.id,
                email: email,
                role: userType,
                status: userType === 'admin' ? 'approved' : 'pending',
            };

            if (userType === 'student') {
                insertData.ht_no = htNo || null;
                insertData.student_name = studentName || null;
                insertData.year = year || null;
            }

            // Check if profile already exists before inserting
            const { data: existingProfile, error: checkError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', data.user.id)
                .maybeSingle();

            if (checkError) {
                console.error('[Auth] Error checking for existing profile:', checkError);
                toast({
                    title: 'Error checking profile',
                    description: checkError.message,
                    variant: 'destructive',
                });
                return { error: checkError };
            }

            if (existingProfile) {
                console.log('[Auth] Profile already exists. Skipping insert.');
            } else {
                console.log('[Auth] No existing profile. Attempting to insert new profile with data:', insertData);
                const { error: insertError } = await supabase
                    .from('user_profiles')
                    .insert(insertData);

                if (insertError) {
                    console.error('[Auth] Error inserting user profile:', insertError); // full object
                    toast({
                        title: 'Profile Creation Error',
                        description: insertError.message || 'An error occurred while creating your profile.',
                        variant: 'destructive',
                    });
                    await supabase.auth.signOut();
                    return { error: insertError };
                }
                console.log('[Auth] User profile inserted successfully.');
            }

            // Wait for profile to be available
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Verify profile was created
            const newProfile = await loadUserProfile(data.user.id);

            if (!newProfile) {
                console.error('[Auth] Profile insertion succeeded but profile not found on reload.');
                toast({ title: 'Profile Error', description: 'Profile created but not accessible. Please try logging in.', variant: 'destructive' });
                return { error: { message: 'Profile created but not accessible.' } };
            }

            // Handle redirection
            if (newProfile.role === 'student') {
                if (newProfile.status === 'approved') {
                    toast({ title: 'Account created', description: 'Redirecting to Student Dashboard.' });
                    setLocation('/student-dashboard');
                } else {
                    toast({ title: 'Account created', description: 'Your account is pending approval. Complete your profile for full access.' });
                    setLocation('/student-dashboard');
                }
            } else if (newProfile.role === 'admin' && newProfile.status === 'approved') {
                toast({ title: 'Account created', description: 'Redirecting to Admin Dashboard.' });
                setLocation('/admin-dashboard');
            } else {
                toast({ title: 'Account created', description: 'Account created successfully. Please wait for approval.' });
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
            return;
        }

        setLoading(true);
        try {
            console.log('[Auth] Attempting to create/update student profile for user:', user.id);

            // Prepare update payload
            const updatePayload: Partial<UserProfile> = {
                ...profileData,
                id: user.id,
                email: user.email!,
                status: 'approved', // Mark as approved when profile is completed
            };

            // Clean up undefined values
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

            // Wait for DB consistency
            await new Promise(resolve => setTimeout(resolve, 500));

            // Refresh profile data
            await refreshUserProfile();

            toast({ title: 'Profile created successfully', description: 'Welcome to your dashboard!' });
            setLocation('/student-dashboard');

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
            // Clear state immediately
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLocation('/');
        }
    };

    // Don't render children until auth is initialized
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
