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

    const { toast } = useToast();
    const [, setLocation] = useLocation();

    const loadUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
        console.log(`[Auth] loadUserProfile: Attempting to load profile for userId: ${userId}`);
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.error(`[Auth] loadUserProfile error for userId ${userId}:`, error.message);
            if (error.code === 'PGRST116') { // This code often indicates "No row found" for maybeSingle
                console.warn(`[Auth] loadUserProfile: No profile found for userId ${userId}. This is expected if the user is new or profile not created.`);
            }
            return null;
        }
        if (!data) {
             console.log(`[Auth] loadUserProfile: No data returned for userId ${userId}.`);
        } else {
             console.log(`[Auth] loadUserProfile: Profile found for userId ${userId}:`, data);
        }
        return data ? (data as UserProfile) : null;
    }, []);

    const refreshUserProfile = useCallback(async () => {
        if (user) {
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
        } else {
            console.warn('[Auth] Cannot refresh profile: No user logged in. Clearing profile state.');
            setUserProfile(null);
            setNeedsProfileCreation(false);
        }
    }, [user, loadUserProfile]);

    useEffect(() => {
        let isMounted = true;
        const cleanupFunctions: (() => void)[] = [];

        const initializeAuth = async () => {
            setLoading(true);
            console.log('[Auth] Initializing auth (initial load)...');
            let currentProfile: UserProfile | null = null;
            let currentSession: Session | null = null;
            let currentUser: User | null = null;

            try {
                const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

                if (!isMounted) return;

                if (sessionError) {
                    console.error('[Auth] Error getting initial session:', sessionError);
                }

                currentSession = initialSession;
                currentUser = initialSession?.user ?? null;

                if (currentUser) {
                    console.log('[Auth] Found current user during init:', currentUser.email, 'ID:', currentUser.id, 'Role:', currentUser.user_metadata?.role);
                    currentProfile = await loadUserProfile(currentUser.id);

                    if (!isMounted) return;

                    if (!currentProfile && currentUser.email === 'admin@vignanits.ac.in') {
                        console.log('[Auth] Auto-creating admin profile during initialization for:', currentUser.email);
                        const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                            id: currentUser.id,
                            email: currentUser.email,
                            role: 'admin',
                            status: 'approved',
                        });
                        if (adminInsertError) {
                            console.error('[Auth] Admin auto-creation error during init:', adminInsertError);
                        } else {
                            currentProfile = await loadUserProfile(currentUser.id);
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
                    const userAuthRole = currentUser?.user_metadata?.role;
                    const needs = (!currentProfile && userAuthRole === 'student');
                    setNeedsProfileCreation(needs);
                    setLoading(false);
                    console.log(`[Auth] Auth initialization complete. User: ${currentUser?.email}, Profile: ${currentProfile ? 'Found' : 'Not Found'}, NeedsProfileCreation: ${needs}. Final loading state: ${false}`);
                }
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            console.log(`[Auth] Auth state changed via listener. Event: ${_event}, User: ${session?.user?.email}`);

            if (!isMounted) return;

            setLoading(true);

            let newProfile: UserProfile | null = null;
            let newUser: User | null = session?.user ?? null;

            try {
                setSession(session);
                setUser(newUser);

                if (newUser) {
                    console.log('[Auth] Listener: User present. Loading profile for:', newUser.email, 'ID:', newUser.id, 'Role:', newUser.user_metadata?.role);
                    newProfile = await loadUserProfile(newUser.id);

                    if (!isMounted) return;

                    if (!newProfile && newUser.email === 'admin@vignanits.ac.in') {
                        console.log('[Auth] Listener: Auto-creating admin profile (if not found) for:', newUser.email);
                        const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                            id: newUser.id,
                            email: newUser.email,
                            role: 'admin',
                            status: 'approved',
                        });
                        if (adminInsertError) {
                            console.error('[Auth] Listener: Admin auto-creation error:', adminInsertError);
                        } else {
                            newProfile = await loadUserProfile(newUser.id);
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
                    setUserProfile(newProfile);
                    const newUserAuthRole = newUser?.user_metadata?.role;
                    const needs = (!newProfile && newUserAuthRole === 'student');
                    setNeedsProfileCreation(needs);
                    setLoading(false);
                    console.log(`[Auth] Listener: Auth state processing complete. Profile: ${newProfile ? 'Found' : 'Not Found'}, NeedsProfileCreation: ${needs}. Final loading state: ${false}`);
                }
            }
        });

        cleanupFunctions.push(() => subscription.unsubscribe());

        return () => {
            isMounted = false;
            cleanupFunctions.forEach(func => func());
        };
    }, [loadUserProfile, toast]);

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

            if (data.user) {
                console.log('[Auth] Login successful for user ID:', data.user.id);

                setSession(data.session);
                setUser(data.user);

                // Give it a small moment before trying to load profile, helpful after fresh sign-up + auto-login
                // This might address a very quick race condition.
                await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay

                let profile = await loadUserProfile(data.user.id);

                if (!profile) {
                    console.log('[Auth] Profile not found immediately after login, checking for admin auto-create or student profile need.');
                    if (data.user.email === 'admin@vignanits.ac.in') {
                        console.log('[Auth] Admin auto-create during login for:', data.user.email);
                        const { error: adminInsertError } = await supabase.from('user_profiles').insert({
                            id: data.user.id,
                            email: data.user.email,
                            role: 'admin',
                            status: 'approved',
                        });
                        if (adminInsertError) {
                            console.error('[Auth] Admin auto-creation error during login:', adminInsertError);
                        } else {
                            await new Promise(resolve => setTimeout(resolve, 300)); // Delay after insert
                            profile = await loadUserProfile(data.user.id);
                            if (profile) toast({ title: 'Admin profile created', description: 'Welcome, administrator!' });
                        }
                    }
                }

                setUserProfile(profile);
                const userAuthRole = data.user.user_metadata?.role; // Use user from data, not state
                const needs = (!profile && userAuthRole === 'student');
                setNeedsProfileCreation(needs);
                console.log(`[Auth] Login result: Profile ${profile ? 'Found' : 'Not Found'}, NeedsProfileCreation: ${needs}.`);


                if (!profile && userType === 'student') {
                    toast({ title: 'Complete Profile', description: 'Please complete your student profile to proceed.' });
                    setLocation('/student-dashboard');
                } else if (profile?.role === 'admin' && profile.status === 'approved') {
                    toast({ title: 'Login Successful', description: 'Redirecting to Admin Dashboard.' });
                    setLocation('/admin-dashboard');
                } else if (profile?.role === 'student' && profile.status === 'approved') {
                    toast({ title: 'Login Successful', description: 'Redirecting to Student Dashboard.' });
                    setLocation('/student-dashboard');
                } else {
                    toast({ title: 'Login Successful', description: 'Access denied or profile incomplete. Contact admin for approval.' });
                    await supabase.auth.signOut();
                    setLocation('/');
                }
            } else {
                console.warn('[Auth] Login succeeded but no user data in response.');
                toast({ title: 'Login issue', description: 'Login successful, but no user data found.', variant: 'destructive' });
                setLocation('/');
            }
        } catch (err: any) {
            console.error('[Auth] Login caught error:', err);
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

                if (verifyError) {
                    console.error('[Auth] Student verification query failed:', verifyError.message);
                    toast({ title: 'Verification Error', description: verifyError.message, variant: 'destructive' });
                    return { error: verifyError };
                }
                if (!data) {
                    console.error('[Auth] Student verification failed: No matching student found in verified_students.');
                    toast({ title: 'Verification Failed', description: 'Student not found in verified list. Contact admin.', variant: 'destructive' });
                    return { error: { message: 'Student not found in verified list. Contact admin.' } };
                }
                console.log('[Auth] Student verification successful:', data);
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

            const userId = data.user?.id;
            console.log('[Auth] Supabase sign up initiated. User ID:', userId, 'Email:', data.user?.email, 'Confirmed:', data.user?.email_confirmed_at === null ? 'No' : 'Yes');

            if (!userId) {
                console.error('[Auth] Sign-up succeeded but user ID missing after Supabase call.');
                toast({ title: 'Signup Error', description: 'Sign-up succeeded but user ID missing.', variant: 'destructive' });
                return { error: { message: 'Sign-up succeeded but user ID missing.' } };
            }

            setUser(data.user);
            setSession(data.session);

            const insertData: Partial<UserProfile> = {
                id: userId,
                email: email,
                role: userType,
                status: userType === 'admin' ? 'approved' : 'pending',
            };

            if (userType === 'student') {
                insertData.ht_no = htNo || null;
                insertData.student_name = studentName || null;
                insertData.year = year || null;
            }

            console.log('[Auth] Attempting to insert user profile with data:', insertData);
            const { error: insertError } = await supabase.from('user_profiles').insert(insertData);

            if (insertError) {
                console.error('[Auth] Error inserting user profile:', insertError.message);
                console.error('[Auth] Insert error hint:', insertError.hint);
                toast({ title: 'Profile Creation Error', description: insertError.message, variant: 'destructive' });
                await supabase.auth.signOut();
                return { error: insertError };
            }
            console.log('[Auth] User profile inserted successfully.');

            // Add a small delay after insert to help with replication if RLS is very strict
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay

            let newlyInsertedProfile = await loadUserProfile(userId);
            setUserProfile(newlyInsertedProfile);

            const needs = (!newlyInsertedProfile && userType === 'student'); // Use userType, not data.user.user_metadata, which might not be updated yet
            setNeedsProfileCreation(needs);
            console.log(`[Auth] Signup profile check: Profile ${newlyInsertedProfile ? 'Found' : 'Not Found'}, NeedsProfileCreation: ${needs}.`);

            if (newlyInsertedProfile?.role === 'student') {
                if (newlyInsertedProfile.status === 'approved') {
                    toast({ title: 'Account created', description: 'Redirecting to Student Dashboard.' });
                    setLocation('/student-dashboard');
                } else {
                    toast({ title: 'Account created', description: 'Your account is pending approval. You may need to complete your profile for full access.' });
                    setLocation('/student-dashboard'); // Still redirect to dashboard, the modal will handle completion
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
            return;
        }
        setLoading(true);
        console.log('[Auth] Attempting to create/update student profile for user:', user.id);

        try {
            // Retrieve the user's current profile from the state, or default values if null
            const currentProfile = userProfile || {
                id: user.id,
                email: user.email!,
                role: (user.user_metadata?.role as UserProfile['role']) || 'student',
                status: 'pending', // Default status for new profile
                student_name: null,
                ht_no: null,
                year: null,
            };

            const updatePayload: Partial<UserProfile> = {
                ...currentProfile, // Spread existing profile data
                ...profileData, // Overlay new data from the form
                id: user.id, // Ensure ID is correct for the update operation
                email: user.email!, // Ensure email is present
                status: 'approved', // Assuming completion means approval
            };

            // Clean up undefined/null values that might cause issues if not explicitly expected by schema
            Object.keys(updatePayload).forEach(key => {
                const value = (updatePayload as any)[key];
                if (value === undefined || value === null || value === '') {
                    delete (updatePayload as any)[key];
                }
            });
            // Specifically ensure student_name, ht_no, year are present if student
            if (currentProfile.role === 'student') {
                if (!updatePayload.student_name) updatePayload.student_name = profileData.student_name || null;
                if (!updatePayload.ht_no) updatePayload.ht_no = profileData.ht_no || null;
                if (!updatePayload.year) updatePayload.year = profileData.year || null;
            }


            console.log('[Auth] Profile update payload (createProfile):', updatePayload);

            const { error } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('id', user.id);

            if (error) {
                console.error('[Auth] Error updating student profile:', error);
                toast({ title: 'Profile Update Failed', description: error.message, variant: 'destructive' });
                throw error;
            }

            console.log('[Auth] Student profile updated successfully in DB. Now refreshing context state...');
            // Add a small delay here if you suspect RLS sync issues
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay after update
            await refreshUserProfile(); // This will re-fetch and update userProfile/needsProfileCreation

            // needsProfileCreation should now be false due to refreshUserProfile
            toast({ title: 'Profile created successfully', description: 'Welcome to your dashboard!' });
            setLocation('/student-dashboard');

        } catch (error: any) {
            console.error('[Auth] General createProfile catch error:', error);
            toast({ title: 'Profile Update Failed', description: error.message || 'An unexpected error occurred during profile update.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const closeProfileCreationModal = useCallback(() => {
        setNeedsProfileCreation(false);
        console.log('[Auth] Profile creation modal explicitly closed.');
    }, []);

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
            setUser(null);
            setSession(null);
            setUserProfile(null);
            setNeedsProfileCreation(false);
            setLocation('/');
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
