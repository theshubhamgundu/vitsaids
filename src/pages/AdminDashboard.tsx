import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Calendar, GraduationCap, TrendingUp, LogOut, BookOpen, Trophy, Image, BarChart3, Plus, Trash2, Upload, Clock, FileText, Search, MoreVertical, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TimetableManager from '@/components/TimetableManager';
import { useLocation } from 'wouter';

// Type definitions for our data
interface PendingStudent {
    id: string;
    ht_no: string;
    student_name: string;
    year: number | string;
    status: string;
    phone?: string;
    address?: string;
    emergency_no?: string;
    photo_url?: string; // Stored path or public URL
    email?: string;
}

interface Event {
    id: string;
    title: string;
    description?: string;
    date: string;
    time?: string;
    venue?: string;
    speaker?: string;
}

interface Faculty {
    id: string;
    name: string;
    designation: string;
    bio?: string;
    expertise?: string;
    publications?: string;
}

interface Placement {
    id: string;
    student_name: string;
    company: string;
    ctc?: number;
    year: number;
    type: string;
    branch: string;
}

// New type definition for Certificate items (from 'certificates' table)
interface CertificateItem {
    id: string;
    ht_no: string;
    certificate_url: string;
    certificate_name: string;
    uploaded_at?: string;
    // Add user_profiles for joined data (assuming 'ht_no' links to 'user_profiles.ht_no')
    user_profiles?: {
        student_name: string;
        ht_no: string;
    };
}

const AdminDashboard = () => {
    const { toast } = useToast();
    const { user, userProfile, logout, loading } = useAuth();
    const [, setLocation] = useLocation();

    // State for real-time data
    const [allStudents, setAllStudents] = useState<PendingStudent[]>([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeEvents: 0,
        facultyMembers: 0,
        placements: 0
    });
    const [events, setEvents] = useState<Event[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [gallery, setGallery] = useState<any[]>([]); // Assuming gallery structure can be anything for now
    const [certifications, setCertifications] = useState<CertificateItem[]>([]); // Updated to use CertificateItem type

    // Student Management States
    const [editingStudent, setEditingStudent] = useState<PendingStudent | null>(null);
    const [viewingStudent, setViewingStudent] = useState<PendingStudent | null>(null); // New state for viewing details
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all'); // New state for year filter
    const [newProfilePhotoFile, setNewProfilePhotoFile] = useState<File | null>(null); // State for new photo upload
    const [isPhotoLoading, setIsPhotoLoading] = useState(false); // New state for photo loading

    // Bulk Promote Students States
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false); // New state for modal visibility
    const [yearToPromote, setYearToPromote] = useState<string>(''); // New state for selected year in modal

    // Results Upload State
    const [resultTitle, setResultTitle] = useState('');
    const [resultFile, setResultFile] = useState<File | null>(null);

    // Notifications State
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    // Certificate Search State
    const [certificateSearchHTNO, setCertificateSearchHTNO] = useState('');
    const [adminCertificates, setAdminCertificates] = useState<CertificateItem[]>([]);

    // Load data from Supabase (functions defined here for proper hook order)
    const loadAllStudents = async () => {
        try {
            let query = supabase.from('user_profiles').select('*').eq('role', 'student');

            if (selectedYearFilter !== 'all') { // Apply year filter
                query = query.eq('year', parseInt(selectedYearFilter));
            }

            const { data, error } = await query.order('student_name', { ascending: true });

            if (error) throw error;

            // When loading all students, also get their public photo URLs if available
            const studentsWithPublicUrls = await Promise.all(data.map(async (student: PendingStudent) => {
                if (student.photo_url) {
                    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(student.photo_url);
                    return { ...student, photo_url: publicUrlData.publicUrl || student.photo_url };
                }
                return student;
            }));

            setAllStudents(studentsWithPublicUrls);
        } catch (error: any) {
            console.error('Error loading students:', error);
            toast({ title: 'Error loading students', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const loadStats = async () => {
        try {
            const [studentsRes, eventsRes, facultyRes, placementsRes] = await Promise.all([
                (supabase as any).from('user_profiles').select('id', { count: 'exact' }).eq('role', 'student'),
                (supabase as any).from('events').select('id', { count: 'exact' }),
                (supabase as any).from('faculty').select('id', { count: 'exact' }),
                (supabase as any).from('placements').select('id', { count: 'exact' })
            ]);

            setStats({
                totalStudents: studentsRes.count || 0,
                activeEvents: eventsRes.count || 0,
                facultyMembers: facultyRes.count || 0,
                placements: placementsRes.count || 0
            });
        } catch (error: any) {
            console.error('Error loading stats:', error);
            toast({ title: 'Error loading stats', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const loadEvents = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('events')
                .select('*')
                .order('date', { ascending: false });

            if (!error && data) {
                setEvents(data);
            } else if (error) {
                toast({ title: 'Error loading events', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error loading events:', error);
            toast({ title: 'Error loading events', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const loadFaculty = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('faculty')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setFaculty(data);
            } else if (error) {
                toast({ title: 'Error loading faculty', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error loading faculty:', error);
            toast({ title: 'Error loading faculty', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const loadPlacements = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('placements')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setPlacements(data);
            } else if (error) {
                toast({ title: 'Error loading placements', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error loading placements:', error);
            toast({ title: 'Error loading placements', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const loadGallery = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('gallery')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setGallery(data);
            } else if (error) {
                toast({ title: 'Error loading gallery', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error loading gallery:', error);
            toast({ title: 'Error loading gallery', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const loadCertifications = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('certificates')
                .select(`
                    *,
                    user_profiles!inner(student_name, id, ht_no)
                `)
                .order('uploaded_at', { ascending: false });

            if (!error && data) {
                setCertifications(data);
                console.log("Certificates loaded:", data);
            } else {
                console.error('Error loading certificates:', error);
                toast({ title: 'Error loading certificates', description: error?.message || 'Unknown error', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error loading certificates (catch block):', error);
            toast({ title: 'Error loading certificates', description: 'Network or unexpected error.', variant: 'destructive' });
        }
    };

    const fetchStudentCertificates = async () => {
        if (!certificateSearchHTNO) {
            toast({ title: 'Enter HT No. to search' });
            setAdminCertificates([]); // Clear previous results
            return;
        }
        try {
            const { data, error } = await supabase
                .from('certificates')
                .select(`
                    *,
                    user_profiles!inner(student_name, ht_no)
                `)
                .eq('ht_no', certificateSearchHTNO);

            if (error) {
                toast({ title: 'Error fetching certificates', description: error.message, variant: 'destructive' });
            } else {
                setAdminCertificates(data || []);
                if ((data || []).length === 0) {
                    toast({ title: 'No certificates found for this H.T No.' });
                } else {
                    toast({ title: `Found ${data.length} certificate(s).` });
                }
            }
        } catch (error: any) {
            console.error('Error fetching certificates:', error);
            toast({ title: 'Error fetching certificates', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    // Redirect if not admin
    useEffect(() => {
        if (!loading && userProfile) {
            console.log('AdminDashboard: Checking user access', { userProfile });
            if (userProfile.role !== 'admin') {
                console.log('User is not admin, redirecting to home');
                setLocation('/');
                return;
            }
        }
    }, [userProfile, loading, setLocation]);

    // Set up real-time subscriptions and initial data load
    useEffect(() => {
        if (userProfile?.role === 'admin') {
            loadAllStudents(); // This will now react to selectedYearFilter
            loadEvents();
            loadFaculty();
            loadPlacements();
            loadGallery();
            loadCertifications();
            loadStats();

            const studentsChannel = supabase
                .channel('students-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
                    loadAllStudents();
                    loadStats();
                })
                .subscribe();

            const eventsChannel = supabase
                .channel('events-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, loadEvents)
                .subscribe();

            const facultyChannel = supabase
                .channel('faculty-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, loadFaculty)
                .subscribe();
            const placementsChannel = supabase
                .channel('placements-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'placements' }, loadPlacements)
                .subscribe();
            const galleryChannel = supabase
                .channel('gallery-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, loadGallery)
                .subscribe();
            const certificatesChannel = supabase
                .channel('certificates-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, loadCertifications)
                .subscribe();
            return () => {
                supabase.removeChannel(studentsChannel);
                supabase.removeChannel(eventsChannel);
                supabase.removeChannel(facultyChannel);
                supabase.removeChannel(placementsChannel);
                supabase.removeChannel(galleryChannel);
                supabase.removeChannel(certificatesChannel);
            };
        }
    }, [userProfile, selectedYearFilter]);

    // Show loading while checking authentication
    if (loading || !userProfile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // Show access denied if not admin
    if (userProfile.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6 text-center">
                        <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                        <p className="text-gray-600 mb-4">
                            You don't have admin privileges to access this page.
                        </p>
                        <Button onClick={() => setLocation('/')} variant="outline">
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const promoteStudent = async (studentId: string, currentYear: number | string) => {
        const numericYear = parseInt(currentYear as string);
        if (isNaN(numericYear)) {
            toast({ title: 'Error', description: 'Invalid year format for promotion', variant: 'destructive' });
            return;
        }
        if (numericYear >= 4) {
            toast({ title: 'Notice', description: 'Student is already in final year or graduated.' });
            return;
        }
        const nextYear = numericYear + 1;
        const confirmPromotion = window.confirm(`Promote this student to year ${nextYear}?`);
        if (!confirmPromotion) return;
        try {
            const { error } = await supabase.from('user_profiles').update({ year: nextYear }).eq('id', studentId);
            if (!error) {
                toast({ title: `Student promoted to year ${nextYear}` });
                loadAllStudents();
            }
            else toast({ title: 'Promotion failed', description: error.message, variant: 'destructive' });
        } catch (error: any) {
            console.error('Error promoting student:', error);
            toast({ title: 'Promotion failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const handleBulkPromote = async () => {
        if (!yearToPromote) {
            toast({ title: 'Error', description: 'Please select a year to promote.', variant: 'destructive' });
            return;
        }

        const currentYearNum = parseInt(yearToPromote);
        if (isNaN(currentYearNum)) {
            toast({ title: 'Error', description: 'Invalid year selected for promotion.', variant: 'destructive' });
            return;
        }

        if (currentYearNum >= 4) {
            toast({ title: 'Notice', description: 'Students in 4th Year cannot be promoted further.', variant: 'info' });
            setIsPromoteModalOpen(false);
            setYearToPromote('');
            return;
        }

        const nextYear = currentYearNum + 1;
        const confirmBulkPromotion = window.confirm(`Are you sure you want to promote ALL students currently in ${currentYearNum}st/nd/rd Year to ${nextYear}th Year? This action cannot be undone.`);

        if (!confirmBulkPromotion) {
            return;
        }

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ year: nextYear })
                .eq('year', currentYearNum)
                .eq('role', 'student');

            if (!error) {
                toast({ title: `Successfully promoted all students from year ${currentYearNum} to ${nextYear}.` });
                loadAllStudents();
                loadStats();
                setIsPromoteModalOpen(false);
                setYearToPromote('');
            } else {
                toast({ title: 'Bulk promotion failed', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error during bulk promotion:', error);
            toast({ title: 'Bulk promotion failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const addEvent = async (newEvent: Omit<Event, 'id'>) => {
        try {
            const { error } = await (supabase as any)
                .from('events')
                .insert(newEvent);
            if (!error) {
                toast({ title: "Event added successfully" });
            } else {
                toast({ title: 'Error adding event', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error adding event:', error);
            toast({ title: 'Error adding event', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };
    const deleteEvent = async (eventId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('events')
                .delete()
                .eq('id', eventId);
            if (!error) {
                toast({ title: "Event deleted successfully" });
                loadEvents();
            } else {
                toast({ title: 'Error deleting event', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting event:', error);
            toast({ title: 'Error deleting event', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const addFaculty = async (newFaculty: Omit<Faculty, 'id'>) => {
        try {
            const { error } = await (supabase as any)
                .from('faculty')
                .insert(newFaculty);
            if (!error) {
                toast({ title: "Faculty member added successfully" });
            } else {
                toast({ title: 'Error adding faculty member', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error adding faculty:', error);
            toast({ title: 'Error adding faculty member', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const deleteFaculty = async (facultyId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('faculty')
                .delete()
                .eq('id', facultyId);
            if (!error) {
                toast({ title: "Faculty member removed successfully" });
                loadFaculty();
            } else {
                toast({ title: 'Error deleting faculty member', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting faculty:', error);
            toast({ title: 'Error deleting faculty member', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const addPlacement = async (newPlacement: Omit<Placement, 'id'>) => {
        try {
            const { error } = await (supabase as any)
                .from('placements')
                .insert(newPlacement);
            if (!error) {
                toast({ title: "Placement record added successfully" });
            } else {
                toast({ title: 'Error adding placement', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error adding placement:', error);
            toast({ title: 'Error adding placement', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };
    const deletePlacement = async (placementId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('placements')
                .delete()
                .eq('id', placementId);
            if (!error) {
                toast({ title: "Placement record deleted successfully" });
                loadPlacements();
            } else {
                toast({ title: 'Error deleting placement', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting placement:', error);
            toast({ title: 'Error deleting placement', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const addGalleryItem = async (newItem: { title: string; description?: string; type: string; url: string }) => {
        try {
            const { error } = await (supabase as any)
                .from('gallery')
                .insert(newItem);
            if (!error) {
                toast({ title: "Gallery item added successfully" });
            } else {
                toast({ title: 'Error adding gallery item', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error adding gallery item:', error);
            toast({ title: 'Error adding gallery item', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const deleteGalleryItem = async (itemId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('gallery')
                .delete()
                .eq('id', itemId);
            if (!error) {
                toast({ title: "Gallery item deleted successfully" });
                loadGallery();
            } else {
                toast({ title: 'Error deleting gallery item', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting gallery item:', error);
            toast({ title: 'Error deleting gallery item', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const deleteCertification = async (certId: string, certificateUrl: string) => {
        try {
            if (certificateUrl) {
                const { error: storageError } = await supabase.storage.from('certificates').remove([certificateUrl]);
                if (storageError) {
                    console.warn('Error deleting certificate file from storage:', storageError);
                    toast({ title: 'Warning', description: 'Could not delete file from storage. Record deleted from DB.', variant: 'destructive' });
                }
            }

            const { error } = await (supabase as any)
                .from('certificates')
                .delete()
                .eq('id', certId);

            if (!error) {
                toast({ title: "Certificate deleted successfully" });
                loadCertifications();
            } else {
                toast({ title: 'Error deleting certificate', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting certificate:', error);
            toast({ title: 'Error deleting certificate', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const updateStudent = async (studentData: Partial<PendingStudent>) => {
        try {
            const { error } = await (supabase as any)
                .from('user_profiles')
                .update(studentData)
                .eq('id', editingStudent?.id);
            if (!error) {
                toast({ title: "Student details updated successfully" });
                setEditingStudent(null);
                loadAllStudents();
            } else {
                toast({ title: 'Error updating student', description: error.message, variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error updating student:', error);
            toast({ title: 'Error updating student', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const handleProfilePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setNewProfilePhotoFile(file || null);
    };

    const uploadProfilePhoto = async () => {
        if (!newProfilePhotoFile || !viewingStudent?.id) {
            toast({ title: 'Error', description: 'No file or student selected.', variant: 'destructive' });
            return;
        }

        setIsPhotoLoading(true); // Start loading

        const fileExtension = newProfilePhotoFile.name.split('.').pop();
        const fileName = `${viewingStudent.id}-${Date.now()}.${fileExtension}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, newProfilePhotoFile, {
                    upsert: true,
                });

            if (uploadError) {
                throw uploadError;
            }

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ photo_url: filePath })
                .eq('id', viewingStudent.id);

            if (updateError) {
                throw updateError;
            }

            toast({ title: '✅ Profile photo updated successfully' });
            setNewProfilePhotoFile(null);
            loadAllStudents();
            setViewingStudent(prev => prev ? { ...prev, photo_url: supabase.storage.from('avatars').getPublicUrl(filePath).data.publicUrl } : null);

        } catch (error: any) {
            console.error('Error uploading profile photo:', error);
            toast({ title: 'Error uploading photo', description: error.message || 'Please try again.', variant: 'destructive' });
        } finally {
            setIsPhotoLoading(false); // End loading
        }
    };

    const uploadResult = async () => {
        if (!resultFile || !resultTitle) {
            toast({ title: 'Error', description: 'Please provide a title and choose a file', variant: 'destructive' });
            return;
        }
        const fileName = `${Date.now()}-${resultFile.name}`;
        try {
            const { error: uploadError } = await supabase.storage.from('results').upload(fileName, resultFile, { upsert: true });
            if (uploadError) {
                toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
                return;
            }
            const { error: dbError } = await supabase.from('results').insert([{ title: resultTitle, file_url: fileName }]);
            if (dbError) {
                toast({ title: 'Error saving record', description: dbError.message, variant: 'destructive' });
                return;
            }
            toast({ title: '✅ Result uploaded successfully' });
            setResultTitle('');
            setResultFile(null);
        } catch (error: any) {
            console.error('Error uploading result:', error);
            toast({ title: 'Upload failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const postNotification = async () => {
        if (!notificationTitle || !notificationMessage) {
            toast({ title: 'Fill both title and message', variant: 'destructive' });
            return;
        }
        try {
            const { error } = await supabase.from('notifications').insert([{ title: notificationTitle, message: notificationMessage }]);
            if (error) {
                toast({ title: 'Error posting notification', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: '✅ Notification posted' });
                setNotificationTitle('');
                setNotificationMessage('');
            }
        } catch (error: any) {
            console.error('Error posting notification:', error);
            toast({ title: 'Error posting notification', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    };

    const handleAttendanceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            toast({ title: "Attendance sheet selected", description: `Ready to process: ${file.name}` });
        }
    };

    const handleResultsFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setResultFile(file);
    };

    const handleViewStudentDetails = async (student: PendingStudent) => {
        setIsPhotoLoading(true); // Start loading for the displayed photo
        let studentToView = { ...student };
        if (student.photo_url && !student.photo_url.startsWith('http')) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(student.photo_url);
            studentToView.photo_url = publicUrlData.publicUrl || student.photo_url;
        }
        setViewingStudent(studentToView);
        setIsPhotoLoading(false); // End loading
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-sm text-gray-600">Welcome back, {user?.email}! Manage your department effectively.</p>
                        </div>
                        <Button
                            onClick={logout}
                            variant="outline"
                            className="flex items-center space-x-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Active Events</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.activeEvents}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Faculty Members</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.facultyMembers}</p>
                                </div>
                                <GraduationCap className="w-8 h-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Placements</p>
                                    <p className="text-3xl font-bold text-orange-600">{stats.placements}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="students" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 gap-1">
                        <TabsTrigger value="students" className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Students</span>
                        </TabsTrigger>
                        <TabsTrigger value="certifications" className="flex items-center space-x-1 text-xs lg:text-sm">
                            <BookOpen className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Certs</span>
                        </TabsTrigger>
                        <TabsTrigger value="events" className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Events</span>
                        </TabsTrigger>
                        <TabsTrigger value="faculty" className="flex items-center space-x-1 text-xs lg:text-sm">
                            <GraduationCap className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Faculty</span>
                        </TabsTrigger>
                        <TabsTrigger value="placements" className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Trophy className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Placements</span>
                        </TabsTrigger>
                        <TabsTrigger value="attendance" className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Attendance</span>
                        </TabsTrigger>
                        <TabsTrigger value="results" className="flex items-center space-x-1 text-xs lg:text-sm">
                            <FileText className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Results</span>
                        </TabsTrigger>
                        <TabsTrigger value="timetable" className="flex items-center space-x-1 text-xs lg:text-sm">
                            <BarChart3 className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Timetable</span>
                        </TabsTrigger>
                        <TabsTrigger value="gallery" className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Image className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Gallery</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="students">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Users className="w-5 h-5" />
                                    <span>Student Management ({allStudents.length})</span>
                                    <div className="ml-auto flex items-center space-x-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setIsPromoteModalOpen(true)}>
                                                    Promote Students
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex items-center space-x-2">
                                    <Label htmlFor="year-filter" className="sr-only">Filter by Year</Label>
                                    <Select value={selectedYearFilter} onValueChange={(value) => setSelectedYearFilter(value)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Filter by Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Years</SelectItem>
                                            <SelectItem value="1">1st Year</SelectItem>
                                            <SelectItem value="2">2nd Year</SelectItem>
                                            <SelectItem value="3">3rd Year</SelectItem>
                                            <SelectItem value="4">4th Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {allStudents.length > 0 ?
                                    (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="border border-gray-200 px-4 py-2 text-left">H.T No.</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Student Name</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Year</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allStudents.map((student) => (
                                                        <tr key={student.id} onClick={() => handleViewStudentDetails(student)} className="cursor-pointer hover:bg-gray-100">
                                                            <td className="border border-gray-200 px-4 py-2">{student.ht_no}</td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                {student.student_name}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">{student.year}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">No students found</p>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="certifications">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <BookOpen className="w-5 h-5" />
                                    <span>Student Certificates ({certifications.length})</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex items-center space-x-2">
                                    <Input
                                        placeholder="Search by H.T No."
                                        value={certificateSearchHTNO}
                                        onChange={(e) => setCertificateSearchHTNO(e.target.value)}
                                        className="max-w-xs"
                                    />
                                    <Button onClick={fetchStudentCertificates}>
                                        <Search className="w-4 h-4 mr-2" /> Search
                                    </Button>
                                </div>

                                {adminCertificates.length > 0 && certificateSearchHTNO ? (
                                    <div className="mb-4 p-4 border rounded-md bg-gray-50">
                                        <h3 className="font-semibold mb-2">Search Results for H.T No. "{certificateSearchHTNO}"</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-100">
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Student</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Certificate Name</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Uploaded At</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {adminCertificates.map((cert) => (
                                                        <tr key={cert.id}>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                {cert.user_profiles?.student_name || 'Unknown'}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">{cert.certificate_name}</td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                {cert.uploaded_at ? new Date(cert.uploaded_at).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <div className="flex space-x-2">
                                                                    {cert.certificate_url && (
                                                                        <a
                                                                            href={supabase.storage.from('certificates').getPublicUrl(cert.certificate_url).data.publicUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            <Button size="sm" variant="outline">
                                                                                View
                                                                            </Button>
                                                                        </a>
                                                                    )}
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => deleteCertification(cert.id, cert.certificate_url)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    certifications.length > 0 ?
                                        (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse border border-gray-200">
                                                    <thead>
                                                        <tr className="bg-gray-50">
                                                            <th className="border border-gray-200 px-4 py-2 text-left">Student</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left">H.T No.</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left">Certificate Name</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left">Uploaded At</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {certifications.map((cert) => (
                                                            <tr key={cert.id}>
                                                                <td className="border border-gray-200 px-4 py-2">
                                                                    {cert.user_profiles?.student_name || 'Unknown'}
                                                                </td>
                                                                <td className="border border-gray-200 px-4 py-2">
                                                                    {cert.ht_no}
                                                                </td>
                                                                <td className="border border-gray-200 px-4 py-2">{cert.certificate_name}</td>
                                                                <td className="border border-gray-200 px-4 py-2">
                                                                    {cert.uploaded_at ? new Date(cert.uploaded_at).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td className="border border-gray-200 px-4 py-2">
                                                                    <div className="flex space-x-2">
                                                                        {cert.certificate_url && (
                                                                            <a
                                                                                href={supabase.storage.from('certificates').getPublicUrl(cert.certificate_url).data.publicUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                            >
                                                                                <Button size="sm" variant="outline">
                                                                                    View
                                                                                </Button>
                                                                            </a>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => deleteCertification(cert.id, cert.certificate_url)}
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                <p className="text-gray-500 text-lg">No certificates found</p>
                                            </div>
                                        )
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="events">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Calendar className="w-5 h-5" />
                                    <span>Event Management ({events.length})</span>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="ml-auto flex items-center space-x-1">
                                                <Plus className="w-4 h-4" />
                                                <span>Add Event</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Event</DialogTitle>
                                            </DialogHeader>
                                            {/* Event form goes here */}
                                        </DialogContent>
                                    </Dialog>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {events.length > 0 ?
                                    (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Title</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Venue</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {events.map((event) => (
                                                        <tr key={event.id}>
                                                            <td className="border border-gray-200 px-4 py-2">{event.title}</td>
                                                            <td className="border border-gray-200 px-4 py-2">{new Date(event.date).toLocaleDateString()}</td>
                                                            <td className="border border-gray-200 px-4 py-2">{event.venue}</td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <Button size="sm" variant="destructive" onClick={() => deleteEvent(event.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">No events scheduled.</p>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="faculty">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <GraduationCap className="w-5 h-5" />
                                    <span>Faculty Management ({faculty.length})</span>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="ml-auto flex items-center space-x-1">
                                                <Plus className="w-4 h-4" />
                                                <span>Add Faculty</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Faculty Member</DialogTitle>
                                            </DialogHeader>
                                            {/* Faculty form goes here */}
                                        </DialogContent>
                                    </Dialog>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {faculty.length > 0 ?
                                    (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Designation</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {faculty.map((member) => (
                                                        <tr key={member.id}>
                                                            <td className="border border-gray-200 px-4 py-2">{member.name}</td>
                                                            <td className="border border-gray-200 px-4 py-2">{member.designation}</td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <Button size="sm" variant="destructive" onClick={() => deleteFaculty(member.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">No faculty members found.</p>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="placements">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Trophy className="w-5 h-5" />
                                    <span>Placement Management ({placements.length})</span>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="ml-auto flex items-center space-x-1">
                                                <Plus className="w-4 h-4" />
                                                <span>Add Placement</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Placement Record</DialogTitle>
                                            </DialogHeader>
                                            {/* Placement form goes here */}
                                        </DialogContent>
                                    </Dialog>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {placements.length > 0 ?
                                    (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Student Name</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Company</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Year</th>
                                                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {placements.map((placement) => (
                                                        <tr key={placement.id}>
                                                            <td className="border border-gray-200 px-4 py-2">{placement.student_name}</td>
                                                            <td className="border border-gray-200 px-4 py-2">{placement.company}</td>
                                                            <td className="border border-gray-200 px-4 py-2">{placement.year}</td>
                                                            <td className="border border-gray-200 px-4 py-2">
                                                                <Button size="sm" variant="destructive" onClick={() => deletePlacement(placement.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">No placement records found.</p>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="attendance">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5" />
                                    <span>Attendance Upload</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Label htmlFor="attendance-file">Upload Attendance Sheet (CSV/Excel)</Label>
                                <Input id="attendance-file" type="file" accept=".csv, .xlsx" onChange={handleAttendanceUpload} />
                                <Button className="flex items-center space-x-1">
                                    <Upload className="w-4 h-4" />
                                    <span>Process Attendance</span>
                                </Button>
                                <p className="text-sm text-gray-500">
                                    Upload a spreadsheet containing student attendance data.
                                    This will be reflected in student profiles.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="results">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <FileText className="w-5 h-5" />
                                    <span>Results Upload</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Label htmlFor="result-title">Result Title</Label>
                                <Input id="result-title" placeholder="e.g., Semester 1 Results" value={resultTitle} onChange={(e) => setResultTitle(e.target.value)} />

                                <Label htmlFor="result-file">Upload Result File (PDF)</Label>
                                <Input id="result-file" type="file" accept=".pdf" onChange={handleResultsFileUpload} />

                                <Button onClick={uploadResult} className="flex items-center space-x-1">
                                    <Upload className="w-4 h-4" />
                                    <span>Upload Result</span>
                                </Button>
                                <p className="text-sm text-gray-500">
                                    Upload official semester results in PDF format.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="timetable">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <BarChart3 className="w-5 h-5" />
                                    <span>Timetable Management</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TimetableManager />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="gallery">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Image className="w-5 h-5" />
                                    <span>Gallery Management ({gallery.length})</span>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="ml-auto flex items-center space-x-1">
                                                <Plus className="w-4 h-4" />
                                                <span>Add Gallery Item</span>
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Add New Gallery Item</DialogTitle>
                                            </DialogHeader>
                                            {/* Gallery form goes here */}
                                        </DialogContent>
                                    </Dialog>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {gallery.length > 0 ?
                                    (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {gallery.map((item) => (
                                                <Card key={item.id} className="relative group overflow-hidden">
                                                    <img src={item.url} alt={item.title} className="w-full h-32 object-cover" />
                                                    <CardContent className="p-2 text-sm">
                                                        <h3 className="font-semibold">{item.title}</h3>
                                                        <p className="text-gray-500 text-xs truncate">{item.description}</p>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={() => deleteGalleryItem(item.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">No gallery items found.</p>
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Edit Student Dialog */}
                <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Student Details</DialogTitle>
                        </DialogHeader>
                        {editingStudent && (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right">
                                        Name
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        defaultValue={editingStudent.student_name}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, student_name: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-htno" className="text-right">
                                        H.T No.
                                    </Label>
                                    <Input
                                        id="edit-htno"
                                        defaultValue={editingStudent.ht_no}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, ht_no: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-year" className="text-right">
                                        Year
                                    </Label>
                                    <Input
                                        id="edit-year"
                                        type="number"
                                        defaultValue={editingStudent.year}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, year: parseInt(e.target.value) || e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-status" className="text-right">
                                        Status
                                    </Label>
                                    <Input
                                        id="edit-status"
                                        defaultValue={editingStudent.status}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-phone" className="text-right">
                                        Phone
                                    </Label>
                                    <Input
                                        id="edit-phone"
                                        defaultValue={editingStudent.phone}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-address" className="text-right">
                                        Address
                                    </Label>
                                    <Textarea
                                        id="edit-address"
                                        defaultValue={editingStudent.address}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-emergency" className="text-right">
                                        Emergency No.
                                    </Label>
                                    <Input
                                        id="edit-emergency"
                                        defaultValue={editingStudent.emergency_no}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, emergency_no: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-photo" className="text-right">
                                        Photo URL
                                    </Label>
                                    <Input
                                        id="edit-photo"
                                        defaultValue={editingStudent.photo_url}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, photo_url: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-email" className="text-right">
                                        Email
                                    </Label>
                                    <Input
                                        id="edit-email"
                                        defaultValue={editingStudent.email}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <Button onClick={() => updateStudent(editingStudent)}>Update Student</Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Promote Students Modal */}
                <Dialog open={isPromoteModalOpen} onOpenChange={setIsPromoteModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Promote Students</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="current-year" className="text-right">
                                    Current Year
                                </Label>
                                <Select value={yearToPromote} onValueChange={setYearToPromote}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select current year to promote" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1st Year</SelectItem>
                                        <SelectItem value="2">2nd Year</SelectItem>
                                        <SelectItem value="3">3rd Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleBulkPromote} disabled={!yearToPromote}>
                                Promote All Students in Selected Year
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Student Detail View Dialog */}
                <Dialog open={!!viewingStudent} onOpenChange={() => { setViewingStudent(null); setNewProfilePhotoFile(null); }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Student Details</DialogTitle>
                        </DialogHeader>
                        {viewingStudent && (
                            <div className="grid gap-4 py-4">
                                {/* Profile Photo Display */}
                                <div className="flex flex-col items-center mb-4 space-y-2"> {/* Adjusted spacing */}
                                    {isPhotoLoading ? (
                                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        viewingStudent.photo_url ? (
                                            <img
                                                src={viewingStudent.photo_url}
                                                alt="Profile Photo"
                                                className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                <User className="w-16 h-16" />
                                            </div>
                                        )
                                    )}
                                    <span className="text-sm text-gray-500">Profile Photo</span>
                                </div>

                                {/* Photo Upload Option */}
                                <div className="grid grid-cols-4 items-center gap-2"> {/* Adjusted spacing */}
                                    <Label htmlFor="photo-upload" className="text-right">
                                        Update Photo
                                    </Label>
                                    <Input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePhotoChange}
                                        className="col-span-3"
                                    />
                                </div>
                                {newProfilePhotoFile && (
                                    <Button onClick={uploadProfilePhoto} className="w-full" disabled={isPhotoLoading}>
                                        {isPhotoLoading ? 'Uploading...' : 'Upload New Photo'}
                                    </Button>
                                )}

                                {/* Student Details */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4"> {/* Adjusted spacing */}
                                    <div className="font-semibold">H.T No.:</div>
                                    <div>{viewingStudent.ht_no}</div>

                                    <div className="font-semibold">Name:</div>
                                    <div>{viewingStudent.student_name}</div>

                                    <div className="font-semibold">Email:</div>
                                    <div>{viewingStudent.email || 'N/A'}</div>

                                    <div className="font-semibold">Year:</div>
                                    <div>{viewingStudent.year}</div>

                                    <div className="font-semibold">Status:</div>
                                    <div>{viewingStudent.status}</div>

                                    <div className="font-semibold">Phone:</div>
                                    <div>{viewingStudent.phone || 'N/A'}</div>

                                    <div className="font-semibold">Address:</div>
                                    <div>{viewingStudent.address || 'N/A'}</div>

                                    <div className="font-semibold">Emergency No.:</div>
                                    <div>{viewingStudent.emergency_no || 'N/A'}</div>
                                </div>
                                <Button onClick={() => {
                                    setEditingStudent(viewingStudent);
                                    setViewingStudent(null);
                                }}>
                                    Edit Student
                                </Button>
                                {/* Removed individual Promote Student button */}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

            </main>
        </div>
    );
};

export default AdminDashboard;
