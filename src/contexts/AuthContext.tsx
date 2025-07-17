// AuthContext.tsx - Fixed Version with Circular Dependency Resolution

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

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
    const [location, setLocation] = useLocation();

    // --- Helper Functions (Fixed to avoid circular dependencies) ---

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

    // loadUserProfile - no longer depends on handleProfileCreation
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
                    setNeedsProfileCreation(false);
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

    // refreshUserProfile should trigger the main listener to re-evaluate the state
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
            }
        } else {
            console.warn('[Auth] Cannot refresh profile: No user logged in. Clearing profile state.');
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLoading(false);
        }
    }, [user, toast]);

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
            console.log('[Auth] Redirecting to home (pending approval)');
            setLocation('/');
        }
    }, [setLocation]);

    // --- PRIMARY EFFECT HOOK: Single Source of Truth for Authentication State ---
    useEffect(() => {
        setLoading(true);

        // Store the handler function separately so we can call it for initial session
        const handleAuthChange = async (event: string, session: Session | null) => {
            console.log(`[Auth] Auth state changed via listener. Event: ${event}, User: ${session?.user?.email || 'No User'}`);

            // Prevent redundant processing for the same SIGNED_IN user
            if (session?.user && previousUserIdRef.current === session.user.id && event === 'SIGNED_IN') {
                console.log(`[Auth] Listener: Skipping redundant SIGNED_IN processing for user ${session.user.id}`);
                setLoading(false);
                return;
            }
            previousUserIdRef.current = session?.user?.id || null;

            if (session?.user) {
                setUser(session.user);
                setSession(session);

                const profile = await loadUserProfile(session.user);

                if (profile) {
                    setUserProfile(profile);
                    setNeedsProfileCreation(false);
                    handlePostAuthRedirect(profile);
                } else {
                    setUserProfile(null);
                }
            } else {
                setUser(null);
                setSession(null);
                setUserProfile(null);
                setNeedsProfileCreation(false);

                const currentWindowPath = window.location.pathname;
                const isPublicOrAuthPage = currentWindowPath === '/' || currentWindowPath === '/login' ||
                                           currentWindowPath.startsWith('/public') ||
                                           currentWindowPath.startsWith('/student-onboarding') ||
                                           currentWindowPath.startsWith('/complete-profile');

                if (!isPublicOrAuthPage) {
                    setLocation('/login');
                }
            }
            setLoading(false);
        };

        const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

        // Initial check on component mount
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            if (initialSession) {
                handleAuthChange('INITIAL_SESSION', initialSession);
            } else {
                handleAuthChange('INITIAL_SESSION', null);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [loadUserProfile, handlePostAuthRedirect, setLocation]);

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
                console.warn('[Auth] Login succeeded but no user data in response.');
                toast({ title: 'Login issue', description: 'Login successful, but no user data found.', variant: 'destructive' });
                return;
            }

            console.log('[Auth] Login successful. Listener will handle state update and redirection.');

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
        student_name: string,
        ht_no: string,
        year?: string
    ): Promise<{ error: string | null }> => {
        setLoading(true);

        try {
            console.log(`[Auth] Attempting sign up for student with email: ${email}`);

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

            const { data: existingProfile, error: existingProfileCheckError } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (existingProfileCheckError && existingProfileCheckError.code !== 'PGRST116') {
                 console.error('[Auth] Error checking for existing profile before insert:', existingProfileCheckError);
                 toast({
                    title: 'Profile Check Error',
                    description: existingProfileCheckError.message,
                    variant: 'destructive',
                 });
                 await supabase.auth.signOut();
                 return { error: existingProfileCheckError.message };
            }

            if (!existingProfile) {
                console.log('[Auth] No existing profile found. Attempting to insert new student profile.');
                const { error: profileInsertError } = await supabase.from('user_profiles').insert([
                    {
                        id: user.id,
                        email: user.email!,
                        student_name: trimmedName,
                        ht_no: trimmedHtNo,
                        year: year || null,
                        role: 'student',
                        status: 'active',
                    },
                ]);

                if (profileInsertError) {
                    console.error('[Auth] Error inserting user profile:', profileInsertError.message);
                    toast({
                        title: 'Profile Creation Error',
                        description: profileInsertError.message,
                        variant: 'destructive',
                    });
                    await supabase.auth.signOut();
                    return { error: profileInsertError.message };
                }
                console.log('[Auth] Student profile inserted successfully.');
            } else {
                console.log('[Auth] User profile already exists. Skipping profile insert for ID:', user.id);
            }

            toast({
                title: 'Account created successfully',
                description: 'Processing your account and redirecting...',
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

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

            await new Promise(resolve => setTimeout(resolve, 500));
            await refreshUserProfile();

            toast({ title: 'Profile created successfully', description: 'Welcome to your dashboard!' });

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
            setLoading(true);

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
            setLoading(false);
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
