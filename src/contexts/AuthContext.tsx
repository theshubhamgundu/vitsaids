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

            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

            if (sessionError) {
                console.error('[Auth] Session error:', sessionError);
                return { user: null, session: null };
            }

            if (!sessionData.session) {
                console.log('[Auth] No session found');
                return { user: null, session: null };
            }

            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError) {
                console.error('[Auth] User validation error:', userError);
                return { user: null, session: null };
            }

            if (!userData.user) {
                console.log('[Auth] No user found despite having session');
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

        if (currentUser.email === 'admin@vignanits.ac.in') {
            console.log('[Auth] Auto-creating admin profile for:', currentUser.email);
            try {
                const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                    id: currentUser.id,
                    email: currentUser.email,
                    role: 'admin',
                    status: 'approved',
                });

                if (adminInsertError && adminInsertError.code !== '23505') {
                    console.error('[Auth] Admin auto-creation error:', adminInsertError);
                    return null;
                }

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

    useEffect(() => {
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                console.log('[Auth] Initializing auth (initial load)...');

                const { user: validatedUser, session: validatedSession } = await validateSession();

                if (!isMounted) return;

                let currentProfile: UserProfile | null = null;

                if (validatedUser && validatedSession) {
                    console.log('[Auth] Valid session found during init:', validatedUser.email);

                    currentProfile = await loadUserProfile(validatedUser.id);

                    if (!currentProfile) {
                        currentProfile = await handleProfileCreation(validatedUser);
                    }

                    if (currentProfile) {
                        setTimeout(() => {
                            if (isMounted) {
                                handlePostAuthRedirect(currentProfile!);
                            }
                        }, 100);
                    }
                } else {
                    console.log('[Auth] No valid session found during init');
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
                    setInitialized(true);
                }
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Auth state changed via listener. Event: ${event}, User: ${session?.user?.email}`);

            if (!isMounted || !initialized) return;

            if (event !== 'SIGNED_OUT') {
                setLoading(true);
            }

            try {
                const newUser = session?.user ?? null;
                let newProfile: UserProfile | null = null;

                setSession(session);
                setUser(newUser);

                if (newUser && session) {
                    console.log('[Auth] Listener: User present. Loading profile for:', newUser.email);

                    newProfile = await loadUserProfile(newUser.id);

                    if (!newProfile) {
                        newProfile = await handleProfileCreation(newUser);
                    }

                    if (newProfile && event === 'SIGNED_IN') {
                        handlePostAuthRedirect(newProfile);
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
    }, [validateSession, loadUserProfile, handleProfileCreation, handlePostAuthRedirect, initialized]);

    // This new useEffect handles tab visibility changes to re-validate session
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                console.log('[Auth] Tab became visible again. Re-validating session...');
                setLoading(true); // Start loading spinner
                const { user: refreshedUser, session: refreshedSession } = await validateSession();

                setUser(refreshedUser);
                setSession(refreshedSession);

                if (refreshedUser) {
                    const profile = await loadUserProfile(refreshedUser.id);
                    setUserProfile(profile);
                    setNeedsProfileCreation(!profile && refreshedUser.user_metadata?.role === 'student');
                } else {
                    setUserProfile(null);
                    setNeedsProfileCreation(false);
                }
                setLoading(false); // Stop loading spinner
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [validateSession, loadUserProfile]); // Dependencies for this effect


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
            const { data: userData, error: userReloadError } = await supabase.auth.getUser();
            if (userReloadError || !userData.user) {
                console.error('[Auth] Failed to reload user after login:', userReloadError);
                toast({ title: 'Login Error', description: 'Could not load user data after login.', variant: 'destructive' });
                await supabase.auth.signOut(); // Force logout if user data is inconsistent
                return;
            }
            console.log("Reloaded user ID after login:", userData.user?.id);


            // The auth state listener will handle loading the profile and redirection.
            // No direct redirection needed here to prevent conflicts.

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

            // RELOAD USER: Ensure we have the most up-to-date user object after sign-up
            const { data: userData, error: userReloadError } = await supabase.auth.getUser();
            if (userReloadError || !userData.user) {
                console.error('[Auth] Failed to reload user after signup:', userReloadError);
                toast({ title: 'Signup Error', description: 'Could not load user data after signup.', variant: 'destructive' });
                await supabase.auth.signOut(); // Force logout if user data is inconsistent
                return { error: userReloadError || { message: 'User data inconsistent after signup.' } };
            }
            console.log("Reloaded user ID after signup:", userData.user?.id);


            const insertData: Partial<UserProfile> = {
                id: userData.user.id, // Use the reloaded user's ID
                email: email,
                role: userType,
                // FIX: Auto-approve students for direct access after signup
                status: 'approved',
            };

            if (userType === 'student') {
                insertData.ht_no = htNo || null;
                insertData.student_name = studentName || null;
                insertData.year = year || null;
            }

            const { data: existingProfile, error: checkError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', userData.user.id) // Use the reloaded user's ID for check
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
                    console.error('[Auth] Error inserting user profile:', insertError);
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

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Use the reloaded user's ID to load the profile
            const newProfile = await loadUserProfile(userData.user.id);

            if (!newProfile) {
                console.error('[Auth] Profile insertion succeeded but profile not found on reload.');
                toast({ title: 'Profile Error', description: 'Profile created but not accessible. Please try logging in.', variant: 'destructive' });
                return { error: { message: 'Profile created but not accessible.' } };
            }

            toast({ title: 'Account created successfully' });
            // The auth state listener will handle redirection after successful sign-up and profile loading.

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

            const updatePayload: Partial<UserProfile> = {
                ...profileData,
                id: user.id,
                email: user.email!,
                status: 'approved',
            };

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

            await new Promise(resolve => setTimeout(resolve, 500));
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
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLocation('/');
        }
    };

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
