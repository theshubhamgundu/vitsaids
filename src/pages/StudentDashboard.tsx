// StudentDashboard.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
// Assuming ProfileCompletionModal is a component you created that takes onComplete prop
// and expects a userProfile prop (which should align with AuthContext's UserProfile type)
import ProfileCompletionModal from '@/components/ProfileCompletionModal';
import {
    LogOut, Eye, Trash2, Upload, Pencil, Edit, Save, X,
} from 'lucide-react';

// Define the shape of UserProfile as it comes from AuthContext
// This should match the interface in AuthContext.tsx
interface StudentUserProfile {
    id: string;
    role: string;
    status: string;
    student_name: string | null;
    ht_no: string | null;
    year: string | null; // Assuming this might be '1st Year', '2nd Year', etc.
    email: string;
    phone?: string | null;
    section?: string | null;
    semester?: string | null;
    cgpa?: number | null;
    photo_url?: string | null;
    address?: string | null;
    emergency_no?: string | null;
}

const StudentDashboard = () => {
    // Use the user and userProfile from AuthContext to determine access and display data
    // Ensure `user` is also available if you need to check general authentication status
    const { user, userProfile, logout, loading, createProfile } = useAuth(); // Added `user` and `createProfile` from AuthContext
    const [, setLocation] = useLocation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [certificates, setCertificates] = useState<any[]>([]); // Changed to match common naming convention
    const [results, setResults] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<any[]>([]);
    const [timetable, setTimetable] = useState<any[]>([]);
    const [tab, setTab] = useState('profile');

    const [certTitle, setCertTitle] = useState('');
    const [certDesc, setCertDesc] = useState('');
    const [certFile, setCertFile] = useState<File | null>(null);

    // Profile completion and editing states
    const [showProfileCompletion, setShowProfileCompletion] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editForm, setEditForm] = useState({
        phone: '',
        address: '',
        emergency_no: ''
    });

    // --- Core Redirection and Data Fetching Logic ---

    // Effect for initial authentication check and redirection
    // This runs AFTER AuthContext has set its `loading` and `userProfile` states
    useEffect(() => {
        if (!loading) { // Once AuthContext has finished its initial load
            // If there's no user, or userProfile doesn't exist, or their role isn't 'student'
            if (!user || !userProfile || userProfile.role !== 'student') {
                console.log("StudentDashboard: Unauthorized access or not a student. Redirecting to home.");
                setLocation('/'); // Redirect to homepage or login page
            }
        }
    }, [loading, user, userProfile, setLocation]); // Depend on user and userProfile from AuthContext

    // Effect for fetching data once userProfile is reliably available
    useEffect(() => {
        // Only proceed if loading is false and userProfile exists and is a student
        if (!loading && userProfile && userProfile.role === 'student') {
            // Check for profile completion here as well, in case it wasn't caught on signup/login
            const isIncomplete = !userProfile.phone || !userProfile.address || !userProfile.emergency_no;
            if (isIncomplete) {
                setShowProfileCompletion(true);
            }

            // Fetch data using userProfile properties
            fetchPhoto();
            fetchCertificates(); // Corrected function name
            fetchResults();
            fetchAttendance();
            fetchTimetable();
        }
    }, [loading, userProfile]); // Depend on loading and userProfile

    // --- Loading State and Initial Render ---
    // Display a loading message or spinner while authentication state is being determined
    // This should be the first thing checked in the component's render
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading student dashboard...</p>
                </div>
            </div>
        );
    }

    // If we reach here and userProfile is still null or not a student,
    // the useEffect above should have redirected. This acts as a final safeguard.
    if (!userProfile || userProfile.role !== 'student') {
        return null; // Component should not render its content if not authorized, let useEffect handle redirect
    }

    // Safely use userProfile (now guaranteed to be StudentUserProfile by TypeScript due to the above checks)
    const currentUserProfile = userProfile as StudentUserProfile;

    // --- Helper Functions ---
    const getInitials = (name: string | null) =>
        name?.split(' ').map(n => n[0]).join('').toUpperCase() || ''; // Handle null name gracefully

    const fetchPhoto = async () => {
        if (!currentUserProfile.id) return; // Ensure ID is present
        const { data, error } = await supabase.storage
            .from('profile_photos')
            .getPublicUrl(`profiles/${currentUserProfile.id}/photo.jpg`);

        if (error) {
            console.error('Error fetching photo:', error);
            setPhotoUrl(null); // Clear photo if error
            return;
        }
        setPhotoUrl(data?.publicUrl || null);
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUserProfile.id) {
            toast({ title: 'Error', description: 'No file selected or user ID missing.', variant: 'destructive' });
            return;
        }
        try {
            const { error } = await supabase.storage
                .from('profile_photos')
                .upload(`profiles/${currentUserProfile.id}/photo.jpg`, file, { upsert: true });

            if (error) {
                console.error('Photo upload error:', error);
                throw error;
            }
            toast({ title: 'Photo uploaded successfully.' });
            fetchPhoto(); // Re-fetch to display the new photo
        } catch (error: any) {
            toast({ title: 'Upload Failed', description: error.message || 'Failed to upload photo.', variant: 'destructive' });
        }
    };

    const fetchCertificates = async () => { // Corrected function name
        if (!currentUserProfile.ht_no) return;
        const { data, error } = await supabase
            .from('student_certificates')
            .select('*')
            .eq('htno', currentUserProfile.ht_no);

        if (error) {
            console.error('Error fetching certificates:', error);
            setCertificates([]); // Clear if error
            return;
        }
        setCertificates(data || []);
    };

    const fetchResults = async () => {
        if (!currentUserProfile.ht_no) return;
        const { data, error } = await supabase
            .from('results')
            .select('*')
            .eq('ht_no', currentUserProfile.ht_no);

        if (error) {
            console.error('Error fetching results:', error);
            setResults([]); // Clear if error
            return;
        }
        setResults(data || []);
    };

    const fetchAttendance = async () => {
        if (!currentUserProfile.ht_no) return;
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('ht_no', currentUserProfile.ht_no);

        if (error) {
            console.error('Error fetching attendance:', error);
            setAttendance([]); // Clear if error
            return;
        }
        setAttendance(data || []);
    };

    const fetchTimetable = async () => {
        // Assuming timetable 'year' column is a number. Adjust if it's '1st Year', '2nd Year' string.
        const yearAsNumber = parseInt(currentUserProfile.year || '0');
        if (!yearAsNumber || yearAsNumber === 0) {
            console.warn("Timetable: userProfile.year is not a valid number.");
            return;
        }
        const { data, error } = await supabase
            .from('timetable')
            .select('*')
            .eq('year', yearAsNumber); // Use the parsed number

        if (error) {
            console.error('Error fetching timetable:', error);
            setTimetable([]); // Clear if error
            return;
        }
        setTimetable(data || []);
    };

    const uploadCert = async () => {
        if (!certFile || !certTitle) {
            toast({
                title: 'Error',
                description: 'Please provide both title and file',
                variant: 'destructive'
            });
            return;
        }
        if (!currentUserProfile.ht_no || !user?.id) { // Ensure both HT No and User ID are present
             toast({ title: 'Error', description: 'User profile or authentication details missing.', variant: 'destructive' });
             return;
        }

        try {
            console.log('🔍 Debug - Auth user:', user);
            console.log('🔍 Debug - User profile:', currentUserProfile);

            // Get the file extension
            const fileExt = certFile.name.split('.').pop();
            const fileName = `${Date.now()}-${certTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
            const path = `${currentUserProfile.ht_no}/${fileName}`;

            console.log('🔍 Debug - File path for upload:', path);

            // Upload file to storage
            const { error: uploadError } = await supabase.storage
                .from('certifications')
                .upload(path, certFile, { upsert: true });

            if (uploadError) {
                console.log('🔍 Debug - Upload error:', uploadError);
                throw uploadError;
            }

            // Get public URL for the file
            const publicURL = supabase.storage.from('certifications').getPublicUrl(path).data.publicUrl;
            console.log('🔍 Debug - Public URL:', publicURL);

            // Insert record to database
            console.log('🔍 Debug - About to insert certificate record:', {
                htno: currentUserProfile.ht_no,
                title: certTitle,
                description: certDesc,
                file_url: publicURL,
                user_id: user.id, // Use the user.id from Supabase auth session
            });

            const { data: insertData, error: dbError } = await supabase
                .from('student_certificates')
                .insert({
                    htno: currentUserProfile.ht_no,
                    title: certTitle,
                    description: certDesc,
                    file_url: publicURL,
                    user_id: user.id, // Ensure this matches auth.uid() for RLS
                })
                .select(); // Select to get the inserted row back

            console.log('🔍 Debug - Insert result:', insertData);
            console.log('🔍 Debug - Insert error:', dbError);

            if (dbError) {
                throw dbError;
            }

            toast({
                title: '✅ Certificate uploaded successfully',
            });

            setCertFile(null);
            setCertTitle('');
            setCertDesc('');
            fetchCertificates(); // Re-fetch to update the list

        } catch (error: any) {
            console.error('Error uploading certificate:', error);
            toast({
                title: 'Upload failed',
                description: error.message || 'Failed to upload certificate. Please try again.',
                variant: 'destructive'
            });
        }
    };

    const deleteCert = async (fileUrl: string, id: string) => {
        try {
            // Extract path from URL for storage deletion
            const url = new URL(fileUrl);
            const pathSegments = url.pathname.split('/');
            // Assumes path is like /bucketname/profiles/HTNO/filename.ext
            // So we need pathSegments[pathSegments.length - 2] for HTNO and last for filename
            const fileName = pathSegments[pathSegments.length - 1];
            const folderName = pathSegments[pathSegments.length - 2]; // This should be your htno
            const storagePath = `${folderName}/${fileName}`; // Reconstruct path relative to bucket root

            console.log(`Deleting storage object: certifications/${storagePath}`);
            const { error: storageError } = await supabase.storage.from('certifications').remove([storagePath]);

            if (storageError && storageError.statusCode !== '404') { // Ignore 404 if file already gone
                console.error('Error deleting file from storage:', storageError);
                toast({ title: 'Error', description: 'Failed to delete file from storage.', variant: 'destructive' });
                throw storageError; // Re-throw to prevent DB deletion if storage failed for other reasons
            }

            console.log(`Deleting DB record for certificate ID: ${id}`);
            const { error: dbError } = await supabase.from('student_certificates').delete().eq('id', id);

            if (dbError) {
                console.error('Error deleting certificate record:', dbError);
                toast({ title: 'Error', description: 'Failed to delete certificate record.', variant: 'destructive' });
                throw dbError;
            }

            toast({ title: 'Certificate deleted successfully' });
            fetchCertificates(); // Re-fetch to update the list
        } catch (error: any) {
            console.error('Error in deleteCert:', error);
            toast({ title: 'Deletion Failed', description: error.message || 'An unexpected error occurred during deletion.', variant: 'destructive' });
        }
    };

    // Edit profile functions
    const handleEditProfile = () => {
        setEditForm({
            phone: currentUserProfile.phone || '',
            address: currentUserProfile.address || '',
            emergency_no: currentUserProfile.emergency_no || ''
        });
        setShowEditProfile(true);
    };

    const handleSaveProfile = async () => {
        try {
            // Assuming AuthContext has an updateProfile function or you re-fetch after update
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    phone: editForm.phone,
                    address: editForm.address,
                    emergency_no: editForm.emergency_no
                })
                .eq('id', currentUserProfile.id); // Use the ID from userProfile

            if (error) throw error;

            toast({
                title: '✅ Profile updated successfully',
                description: 'Your profile has been updated.',
            });

            setShowEditProfile(false);
            // Instead of full reload, trigger AuthContext to re-fetch and update its profile state
            // This relies on your AuthContext having a mechanism to refresh the profile.
            // My proposed AuthContext fix would update the state automatically on auth state change.
            // For now, if AuthContext doesn't expose a direct refresh, a soft reload might be needed.
            // If AuthContext is updated, simply fetching the profile again will update the state here.
            // Alternatively, add a `updateUserProfile` function to AuthContext that does this:
            // await updateAuthUserProfile({ phone: editForm.phone, ... });
            window.location.reload(); // Temporarily kept this, but ideal is to update AuthContext state
        } catch (error: any) {
            console.error('Error saving profile:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to update profile',
                variant: 'destructive'
            });
        }
    };

    // This handles completion from ProfileCompletionModal
    const handleProfileCompletion = () => {
        setShowProfileCompletion(false);
        // After profile completion (which updates the DB), re-fetch the userProfile in AuthContext
        // to ensure the latest data is available to all components.
        // If your AuthContext has a `refreshUserProfile` method, call it here.
        // Otherwise, a full page reload might be the simplest temporary solution.
        window.location.reload(); // Temporarily kept this for simplicity. Ideal is state update.
    };


    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Student Dashboard</h1>
                <Button onClick={logout}><LogOut className="mr-2" size={16} /> Logout</Button>
            </div>

            {/* Profile Photo + Info */}
            <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl">
                    {photoUrl ? (
                        <img src={photoUrl} className="w-full h-full rounded-full object-cover" alt="Profile" />
                    ) : (
                        getInitials(currentUserProfile.student_name)
                    )}
                    <Pencil
                        size={16}
                        className="absolute bottom-0 right-0 bg-white text-black rounded-full p-1 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handlePhotoChange}
                        accept="image/*" // Restrict to image files
                    />
                </div>
                <div>
                    <h2 className="text-lg font-semibold">{currentUserProfile.student_name}</h2>
                    <p className="text-sm text-muted-foreground">{currentUserProfile.ht_no}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><p>Attendance</p><h3 className="text-xl font-bold">{attendance[0]?.cumulative || '0'}%</h3></CardContent></Card>
                <Card><CardContent className="p-4"><p>Current CGPA</p><h3 className="text-xl font-bold">{currentUserProfile.cgpa || 'N/A'}</h3></CardContent></Card>
                <Card><CardContent className="p-4"><p>Certifications</p><h3 className="text-xl font-bold">{certificates.length}</h3></CardContent></Card>
            </div>

            {/* Tabs Section */}
            <Tabs value={tab} onValueChange={setTab} className="space-y-4">
                <TabsList className="w-full grid grid-cols-5 gap-2">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                    <TabsTrigger value="certifications">Certifications</TabsTrigger>
                    <TabsTrigger value="timetable">Timetable</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Profile Information</h3>
                                <Button onClick={handleEditProfile} variant="outline" size="sm">
                                    <Edit className="mr-2" size={16} />
                                    Edit Profile
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong>Full Name:</strong> {currentUserProfile.student_name}</p>
                                <p><strong>Email:</strong> {currentUserProfile.email}</p>
                                <p><strong>Phone:</strong> {currentUserProfile.phone || 'Not provided'}</p>
                                <p><strong>Year:</strong> {currentUserProfile.year}</p>
                                <p><strong>Address:</strong> {currentUserProfile.address || 'Not provided'}</p>
                                <p><strong>Emergency Contact:</strong> {currentUserProfile.emergency_no || 'Not provided'}</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance">
                    <Card><CardContent className="p-6">
                        <h3 className="font-semibold mb-4">Subject-wise Attendance</h3>
                        <div className="overflow-x-auto"> {/* Added for responsiveness */}
                            <table className="min-w-full border-collapse">
                                <thead><tr>
                                    <th className="p-2 border bg-gray-50 text-left">Subject</th>
                                    <th className="p-2 border bg-gray-50 text-left">Attendance %</th>
                                </tr></thead>
                                <tbody>
                                    {attendance.length > 0 ? (
                                        attendance.map((a, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="p-2 border">{a.subject}</td>
                                                <td className="p-2 border">{a.percentage}%</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">No attendance data available.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="results">
                    <Card><CardContent className="p-6">
                        <h3 className="font-semibold mb-4">Results</h3>
                        {results.length > 0 ? (
                            results.map(r => (
                                <div key={r.id} className="flex justify-between items-center mb-2 p-2 border-b last:border-b-0">
                                    <span>{r.title}</span>
                                    <a href={supabase.storage.from('results').getPublicUrl(r.file_url).data.publicUrl} target="_blank" rel="noreferrer">
                                        <Button variant="outline" size="sm"><Eye className="mr-1" size={14} /> View</Button>
                                    </a>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground p-4">No results data available.</p>
                        )}
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="certifications">
                    <Card><CardContent className="p-6 space-y-4">
                        <h3 className="font-semibold mb-2">Upload Certificate</h3>
                        <Input placeholder="Title" value={certTitle} onChange={e => setCertTitle(e.target.value)} />
                        <Input placeholder="Description (Optional)" value={certDesc} onChange={e => setCertDesc(e.target.value)} />
                        <Input type="file" onChange={e => setCertFile(e.target.files?.[0] || null)} accept=".pdf, .jpg, .jpeg, .png" />
                        <Button onClick={uploadCert}><Upload size={16} className="mr-2" /> Upload</Button>

                        <h3 className="font-semibold mt-6">Uploaded Certificates</h3>
                        {certificates.length > 0 ? (
                            certificates.map(c => (
                                <div key={c.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                                    <span>{c.title}</span>
                                    <div className="space-x-2">
                                        <a href={c.file_url} target="_blank" rel="noopener noreferrer"> {/* Added rel="noopener noreferrer" for security */}
                                            <Button size="sm" variant="ghost"><Eye size={14} /></Button>
                                        </a>
                                        <Button variant="destructive" size="sm" onClick={() => deleteCert(c.file_url, c.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-muted-foreground p-4">No certificates uploaded yet.</p>
                        )}
                    </CardContent></Card>
                </TabsContent>

                <TabsContent value="timetable">
                    <Card><CardContent className="p-6">
                        <h3 className="font-semibold mb-4">Full Timetable</h3>
                        <div className="overflow-x-auto"> {/* Added for responsiveness */}
                            <table className="min-w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="p-2 border bg-gray-50 text-left">Day</th>
                                        <th className="p-2 border bg-gray-50 text-left">Period 1</th>
                                        <th className="p-2 border bg-gray-50 text-left">Period 2</th>
                                        <th className="p-2 border bg-gray-50 text-left">Period 3</th>
                                        <th className="p-2 border bg-gray-50 text-left">Period 4</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {timetable.length > 0 ? (
                                        timetable.map((t, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="p-2 border">{t.day}</td>
                                                <td className="p-2 border">{t.p1}</td>
                                                <td className="p-2 border">{t.p2}</td>
                                                <td className="p-2 border">{t.p3}</td>
                                                <td className="p-2 border">{t.p4}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No timetable data available for your year.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent></Card>
                </TabsContent>
            </Tabs>

            {/* Profile Completion Modal */}
            <ProfileCompletionModal
                isOpen={showProfileCompletion}
                // Pass currentUserProfile directly, ensuring it's not null here
                userProfile={currentUserProfile}
                onComplete={handleProfileCompletion}
                // You might need to pass `createProfile` from useAuth here if the modal handles the DB update
                // Or ensure `onComplete` in the modal triggers the AuthContext's update logic
            />

            {/* Edit Profile Dialog */}
            <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Update your contact information and address details.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-phone">Phone Number</Label>
                            <Input
                                id="edit-phone"
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-address">Address</Label>
                            <Input
                                id="edit-address"
                                value={editForm.address}
                                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                                placeholder="Enter your address"
                            />
                        </div>

                        <div>
                            <Label htmlFor="edit-emergency">Emergency Contact (Parent Number)</Label>
                            <Input
                                id="edit-emergency"
                                type="tel"
                                value={editForm.emergency_no}
                                onChange={(e) => setEditForm(prev => ({ ...prev, emergency_no: e.target.value }))}
                                placeholder="Enter parent/emergency contact number"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleSaveProfile} className="flex-1">
                                <Save className="mr-2" size={16} />
                                Save Changes
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowEditProfile(false)}
                                className="flex-1"
                            >
                                <X className="mr-2" size={16} />
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default StudentDashboard;
