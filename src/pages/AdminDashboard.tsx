import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Calendar, GraduationCap, TrendingUp, LogOut, BookOpen, Trophy, Image, BarChart3, Plus, Trash2, Upload, Clock, FileText, Search, MoreVertical, User, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { useToast } from '@/hooks/use-toast';
import { supabaseOld } from '@/integrations/supabase/supabaseOld'; // 👈 OLD DB: students, certificates, profiles
import { supabase } from '@/integrations/supabase/client';         // 👈 NEW DB: faculty, gallery, events, etc.
import TimetableManager from '@/components/TimetableManager';
import { useLocation } from 'wouter';

import { uploadFile, deleteFile, fetchAllEntries, addEntry, updateEntry, deleteEntry } from '@/lib/SupabaseDataManager';

// Assuming these forms are separate components that will use the new `supabase` client for their uploads.
// I'll make sure their props are aligned with this new logic.
import ContentUploader from '@/components/ContentUploader';
import EventsUploadForm from '@/components/EventsUploadForm';
import FacultyUploadForm from '@/components/FacultyUploadForm';
import PlacementsUploadForm from '@/components/PlacementsUploadForm';
import AchievementsUploadForm from '@/components/AchievementsUploadForm';
import GalleryUploadForm from '@/components/GalleryUploadForm';

import SearchBar from '@/components/SearchBar';

// Type definitions for our data (matching Supabase table columns)
interface PendingStudent {
    id: string;
    ht_no: string;
    student_name: string;
    year: number | string;
    status: string;
    phone?: string;
    address?: string;
    emergency_no?: string;
    photo_url?: string;
    email?: string;
}

interface Event {
    id: string;
    title: string;
    description?: string;
    date: string;
    time?: string;
    venue?: string;
    image_url?: string;
    image_path?: string;
    speaker?: string;
}

interface Faculty {
    id: string;
    name: string;
    designation: string;
    department: string;
    bio?: string;
    expertise?: string;
    publications?: string;
    image_url?: string;
    image_path?: string;
}

interface GalleryItem {
    id: string;
    title: string;
    description?: string;
    image_url: string;
    image_path?: string;
}

interface Placement {
    id: string;
    student_name: string;
    company: string;
    ctc?: number;
    year: number;
    type: string;
    branch: string;
    image_url?: string;
    image_path?: string;
}

interface CertificateItem {
    id: string;
    ht_no: string;
    certificate_name: string;
    description?: string;
    certificate_url: string;
    file_path?: string;
    uploaded_at?: string;
    user_id?: string;
    user_profiles?: {
        student_name: string;
        id: string;
        ht_no: string;
        email?: string;
        year?: number;
    };
}

interface Achievement {
    id: string;
    title: string;
    description?: string;
    date?: string;
    certificate_url?: string;
    file_path?: string;
}

const AdminDashboard = () => {
    const { toast } = useToast();
    const { user, userProfile, loading } = useAuth();
    const [, setLocation] = useLocation();

    const [allStudents, setAllStudents] = useState<PendingStudent[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [certifications, setCertifications] = useState<CertificateItem[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);

    const [stats, setStats] = useState({
        totalStudents: 0,
        activeEvents: 0,
        facultyMembers: 0,
        placements: 0,
        totalAchievements: 0,
    });

    const [isGlobalLoading, setIsGlobalLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const [editingStudent, setEditingStudent] = useState<PendingStudent | null>(null);
    const [viewingStudent, setViewingStudent] = useState<PendingStudent | null>(null);
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
    const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
    const [filteredStudents, setFilteredStudents] = useState<PendingStudent[]>([]);

    const [newProfilePhotoFile, setNewProfilePhotoFile] = useState<File | null>(null);
    const [isPhotoLoading, setIsPhotoLoading] = useState(false);

    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [yearToPromote, setYearToPromote] = useState<string>('');

    const [resultTitle, setResultTitle] = useState('');
    const [resultFile, setResultFile] = useState<File | null>(null);

    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    const [certificateSearchHTNO, setCertificateSearchHTNO] = useState('');
    const [filteredCertificates, setFilteredCertificates] = useState<CertificateItem[]>([]);
    const [selectedYearFilterCerts, setSelectedYearFilterCerts] = useState<string>('all');

    const [activeTab, setActiveTab] = useState('students');

    const sensors = useSensors();

    const loadAllStudents = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            // Using supabaseOld for students
            let query = supabaseOld.from('user_profiles').select('*').eq('role', 'student');
            const { data, error } = await query.order('student_name', { ascending: true });
            if (error) throw error;

            const studentsWithPhotos = await Promise.all(data.map(async (student: PendingStudent) => {
                const photoPath = `profiles/${student.id}/photo.jpg`;
                const { data: publicUrlData, error: storageError } = supabaseOld.storage.from("profile_photos").getPublicUrl(photoPath);

                if (storageError || !publicUrlData?.publicUrl) {
                    return { ...student, photo_url: '/default-avatar.png' };
                }
                return { ...student, photo_url: publicUrlData.publicUrl };
            }));

            setAllStudents(studentsWithPhotos);
        } catch (error: any) {
            console.error('Error loading students:', error);
            toast({ title: 'Error loading students', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        let currentFilteredStudents = allStudents;

        if (selectedYearFilter !== 'all') {
            currentFilteredStudents = currentFilteredStudents.filter(student =>
                student.year === parseInt(selectedYearFilter)
            );
        }

        if (studentSearchTerm) {
            currentFilteredStudents = currentFilteredStudents.filter(student =>
                student.student_name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                student.ht_no.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                (student.email && student.email.toLowerCase().includes(studentSearchTerm.toLowerCase()))
            );
        }
        setFilteredStudents(currentFilteredStudents);
    }, [allStudents, selectedYearFilter, studentSearchTerm]);

    const loadEvents = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            // Using new supabase client for events
            const data = await fetchAllEntries<Event>('events');
            setEvents(data || []);
        } catch (error: any) {
            console.error('Error loading events:', error);
            toast({ title: 'Error loading events', description: error.message || 'Please check Supabase "events" table.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadFaculty = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            // Using new supabase client for faculty
            const data = await fetchAllEntries<Faculty>('faculty');
            setFaculty(data || []);
        } catch (error: any) {
            console.error('Error loading faculty:', error);
            toast({ title: 'Error loading faculty', description: error.message || 'Please check Supabase "faculty" table.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadPlacements = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            // Using new supabase client for placements
            const data = await fetchAllEntries<Placement>('placements');
            setPlacements(data || []);
        } catch (error: any) {
            console.error('Error loading placements:', error);
            toast({ title: 'Error loading placements', description: error.message || 'Please check Supabase "placements" table.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadGallery = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            // Using new supabase client for gallery
            const data = await fetchAllEntries<GalleryItem>('gallery');
            setGallery(data || []);
        } catch (error: any) {
            console.error('Error loading gallery:', error);
            toast({ title: 'Error loading gallery', description: error.message || 'Please check Supabase "gallery" table.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadAchievements = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            // Using new supabase client for achievements
            const data = await fetchAllEntries<Achievement>('achievements');
            setAchievements(data || []);
        } catch (error: any) {
            console.error('Error loading achievements:', error);
            toast({ title: 'Error loading achievements', description: error.message || 'Please check Supabase "achievements" table.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadCertifications = useCallback(async () => {
        setIsGlobalLoading(true);
        console.log("loadCertifications called with filters:", { certificateSearchHTNO, selectedYearFilterCerts });
        try {
            // Using supabaseOld for certifications
            let query = supabaseOld
                .from('student_certificates')
                .select(`
                    id,
                    htno,
                    title,
                    description,
                    file_url,
                    uploaded_at,
                    user_id,
                    user_profiles (id, student_name, ht_no, email, year)
                `);

            if (selectedYearFilterCerts !== 'all') {
                query = query.eq('user_profiles.year', parseInt(selectedYearFilterCerts));
            }

            const { data, error } = await query.order('uploaded_at', { ascending: false });

            console.log("Supabase student_certificates query result:", { data, error });

            if (!error && data) {
                const transformedData: CertificateItem[] = data.map((cert: any) => ({
                    id: cert.id,
                    ht_no: cert.htno,
                    certificate_name: cert.title,
                    description: cert.description,
                    certificate_url: supabaseOld.storage.from('certifications').getPublicUrl(cert.file_url).data.publicUrl,
                    file_path: cert.file_url,
                    uploaded_at: cert.uploaded_at,
                    user_id: cert.user_id,
                    user_profiles: cert.user_profiles ? {
                        id: cert.user_profiles.id,
                        student_name: cert.user_profiles.student_name,
                        ht_no: cert.user_profiles.ht_no,
                        email: cert.user_profiles.email,
                        year: cert.user_profiles.year,
                    } : undefined
                }));

                setCertifications(transformedData);
                const initialFiltered = transformedData.filter(cert => {
                    const matchesYear = selectedYearFilterCerts === 'all' || cert.user_profiles?.year === parseInt(selectedYearFilterCerts);
                    const matchesSearch = !certificateSearchHTNO ||
                        cert.ht_no.toLowerCase().includes(certificateSearchHTNO.toLowerCase()) ||
                        (cert.user_profiles?.student_name && cert.user_profiles.student_name.toLowerCase().includes(certificateSearchHTNO.toLowerCase())) ||
                        (cert.user_profiles?.email && cert.user_profiles.email.toLowerCase().includes(certificateSearchHTNO.toLowerCase()));
                    return matchesYear && matchesSearch;
                });
                setFilteredCertificates(initialFiltered);
            } else {
                toast({ title: 'Error loading certificates', description: error?.message || 'Unknown error', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error loading certificates (catch block):', error);
            toast({ title: 'Error loading certificates', description: 'Network or unexpected error.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast, certificateSearchHTNO, selectedYearFilterCerts]);

    const loadStats = useCallback(async () => {
        try {
            // Using supabaseOld for student count
            const { count: studentsCount, error: studentsError } = await supabaseOld.from('user_profiles').select('id', { count: 'exact' }).eq('role', 'student');
            if (studentsError) throw studentsError;

            setStats({
                totalStudents: studentsCount || 0,
                activeEvents: events.length || 0,
                facultyMembers: faculty.length || 0,
                placements: placements.length || 0,
                totalAchievements: achievements.length || 0,
            });
        } catch (error: any) {
            console.error('Error loading stats:', error);
            toast({ title: 'Error loading dashboard stats', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    }, [toast, events.length, faculty.length, placements.length, achievements.length]);

    useEffect(() => {
        console.log("AdminDashboard useEffect triggered. Loading:", loading, " UserProfile:", userProfile);
        if (!loading && userProfile?.role === 'admin') {
            loadAllStudents();
            loadEvents();
            loadFaculty();
            loadPlacements();
            loadGallery();
            loadAchievements();
            loadCertifications();
            loadStats();

            // Realtime subscriptions for old DB tables
            const studentsChannel = supabaseOld
                .channel('students-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
                    console.log("Supabase (Old) user_profiles change detected. Reloading students.");
                    loadAllStudents();
                    loadStats();
                })
                .subscribe();

            const certificatesChannel = supabaseOld
                .channel('certificates-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'student_certificates' }, (payload) => {
                    console.log("Supabase (Old) student_certificates change detected. Reloading certs. Payload:", payload);
                    loadCertifications();
                })
                .subscribe();

            // Realtime subscriptions for new DB tables
            const eventsChannel = supabase.channel('events-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                    console.log("Supabase (New) events change detected. Reloading events.");
                    loadEvents();
                    loadStats();
                }).subscribe();

            const facultyChannel = supabase.channel('faculty-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, () => {
                    console.log("Supabase (New) faculty change detected. Reloading faculty.");
                    loadFaculty();
                    loadStats();
                }).subscribe();

            const placementsChannel = supabase.channel('placements-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'placements' }, () => {
                    console.log("Supabase (New) placements change detected. Reloading placements.");
                    loadPlacements();
                    loadStats();
                }).subscribe();

            const galleryChannel = supabase.channel('gallery-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => {
                    console.log("Supabase (New) gallery change detected. Reloading gallery.");
                    loadGallery();
                }).subscribe();

            const achievementsChannel = supabase.channel('achievements-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements' }, () => {
                    console.log("Supabase (New) achievements change detected. Reloading achievements.");
                    loadAchievements();
                    loadStats();
                }).subscribe();

            return () => {
                supabaseOld.removeChannel(studentsChannel);
                supabaseOld.removeChannel(certificatesChannel);
                supabase.removeChannel(eventsChannel);
                supabase.removeChannel(facultyChannel);
                supabase.removeChannel(placementsChannel);
                supabase.removeChannel(galleryChannel);
                supabase.removeChannel(achievementsChannel);
            };
        } else if (!loading && userProfile && userProfile.role !== 'admin') {
            console.log("Redirecting non-admin user to /.");
            setLocation('/');
        }
    }, [userProfile, loading, setLocation, loadAllStudents, loadEvents, loadFaculty, loadPlacements, loadGallery, loadAchievements, loadCertifications, loadStats]);

    useEffect(() => {
        let currentFiltered = certifications;

        if (selectedYearFilterCerts !== 'all') {
            currentFiltered = currentFiltered.filter(cert =>
                cert.user_profiles?.year === parseInt(selectedYearFilterCerts)
            );
        }

        if (certificateSearchHTNO) {
            currentFiltered = currentFiltered.filter(cert =>
                cert.ht_no.toLowerCase().includes(certificateSearchHTNO.toLowerCase()) ||
                (cert.user_profiles?.student_name && cert.user_profiles.student_name.toLowerCase().includes(certificateSearchHTNO.toLowerCase())) ||
                (cert.user_profiles?.email && cert.user_profiles.email.toLowerCase().includes(certificateSearchHTNO.toLowerCase()))
            );
        }

        setFilteredCertificates(currentFiltered);
    }, [certificateSearchHTNO, certifications, selectedYearFilterCerts]);

    if (loading || isGlobalLoading || !userProfile) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

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
            // Using supabaseOld for student promotion
            const result = await updateEntry<PendingStudent>('user_profiles', studentId, { year: nextYear }, supabaseOld);
            if (result) {
                toast({ title: `Student promoted to year ${nextYear}` });
                loadAllStudents();
            } else {
                toast({ title: 'Promotion failed', description: 'Failed to update student in database.', variant: 'destructive' });
            }
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
        if (isNaN(currentYearNum) || currentYearNum < 1 || currentYearNum > 3) {
            toast({ title: 'Error', description: 'Invalid year selected for promotion.', variant: 'destructive' });
            return;
        }

        const nextYear = currentYearNum + 1;
        const confirmBulkPromotion = window.confirm(`Are you sure you want to promote ALL students currently in year ${currentYearNum} to year ${nextYear}? This action cannot be undone.`);

        if (!confirmBulkPromotion) {
            return;
        }

        setIsUpdating(true);
        try {
            // Using supabaseOld for bulk promotion
            const { error } = await supabaseOld
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
        } finally {
            setIsUpdating(false);
        }
    };

    const updateStudent = async (studentData: Partial<PendingStudent>) => {
        setIsUpdating(true);
        try {
            // Using supabaseOld for student updates
            const result = await updateEntry<PendingStudent>('user_profiles', studentData.id!, studentData, supabaseOld);
            if (result) {
                toast({ title: "Student details updated successfully" });
                setEditingStudent(null);
                loadAllStudents();
            } else {
                toast({ title: 'Error updating student', description: 'Failed to update student in database.', variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error updating student:', error);
            toast({ title: 'Error updating student', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsUpdating(false);
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

        setIsPhotoLoading(true);

        const folderPath = `profiles/${viewingStudent.id}/photo.jpg`;
        // Using supabaseOld for profile photo upload
        const { publicUrl, filePath, error: uploadError } = await uploadFile('profile_photos', newProfilePhotoFile, folderPath, supabaseOld);

        if (uploadError || !publicUrl) {
            console.error('Error uploading profile photo:', uploadError);
            toast({ title: 'Error uploading photo', description: uploadError?.message || 'Please try again.', variant: 'destructive' });
            setIsPhotoLoading(false);
            return;
        }

        try {
            // Using supabaseOld for updating student profile
            const result = await updateEntry<PendingStudent>('user_profiles', viewingStudent.id, { photo_url: publicUrl }, supabaseOld);
            if (result) {
                toast({ title: '✅ Profile photo updated successfully' });
                setNewProfilePhotoFile(null);
                loadAllStudents();
                setViewingStudent(prev => prev ? { ...prev, photo_url: publicUrl } : null);
            } else {
                await deleteFile('profile_photos', filePath!, supabaseOld);
                toast({ title: 'Error updating photo', description: 'Failed to link photo to student profile in database. File uploaded but not saved.', variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error linking profile photo to student:', error);
            toast({ title: 'Error linking photo', description: error.message || 'Please try again.', variant: 'destructive' });
        } finally {
            setIsPhotoLoading(false);
        }
    };

    const handleViewStudentDetails = async (student: PendingStudent) => {
        setIsPhotoLoading(true);
        setViewingStudent(student);
        setIsPhotoLoading(false);
    };

    const handleDeleteEvent = async (eventToDelete: Event) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the event "${eventToDelete.title}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            // Using new supabase client for events
            if (eventToDelete.image_path) {
                const { success, error } = await deleteFile('events', eventToDelete.image_path, supabase);
                if (error) {
                    console.warn(`Failed to delete event image ${eventToDelete.image_path}:`, error.message);
                    toast({ title: 'Image Deletion Warning', description: `Could not delete event image from storage: ${error.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('events', eventToDelete.id, supabase);
            if (success) {
                toast({ title: 'Event deleted successfully' });
                loadEvents();
                loadStats();
            } else {
                toast({ title: 'Error deleting event', description: error?.message || 'Please try again.', variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting event:', error);
            toast({ title: 'Deletion Failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteFaculty = async (facultyToDelete: Faculty) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete faculty member "${facultyToDelete.name}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            // Using new supabase client for faculty
            if (facultyToDelete.image_path) {
                const { success, error } = await deleteFile('faculty', facultyToDelete.image_path, supabase);
                if (error) {
                    console.warn(`Failed to delete faculty image ${facultyToDelete.image_path}:`, error.message);
                    toast({ title: 'Image Deletion Warning', description: `Could not delete faculty image from storage: ${error.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('faculty', facultyToDelete.id, supabase);
            if (success) {
                toast({ title: 'Faculty member deleted successfully' });
                loadFaculty();
                loadStats();
            } else {
                toast({ title: 'Error deleting faculty', description: error?.message || 'Please try again.', variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting faculty:', error);
            toast({ title: 'Deletion Failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteGalleryItem = async (itemToDelete: GalleryItem) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the gallery item "${itemToDelete.title}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            // Using new supabase client for gallery
            if (itemToDelete.image_path) {
                const { success, error } = await deleteFile('gallery', itemToDelete.image_path, supabase);
                if (error) {
                    console.warn(`Failed to delete gallery image ${itemToDelete.image_path}:`, error.message);
                    toast({ title: 'Image Deletion Warning', description: `Could not delete gallery image from storage: ${error.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('gallery', itemToDelete.id, supabase);
            if (success) {
                toast({ title: 'Gallery item deleted successfully' });
                loadGallery();
            } else {
                toast({ title: 'Error deleting gallery item', description: error?.message || 'Please try again.', variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting gallery item:', error);
            toast({ title: 'Deletion Failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeletePlacement = async (itemToDelete: Placement) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the placement record for "${itemToDelete.student_name}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            // Using new supabase client for placements
            if (itemToDelete.image_path) {
                const { success, error } = await deleteFile('placements', itemToDelete.image_path, supabase);
                if (error) {
                    console.warn(`Failed to delete placement image ${itemToDelete.image_path}:`, error.message);
                    toast({ title: 'Image Deletion Warning', description: `Could not delete placement image from storage: ${error.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('placements', itemToDelete.id, supabase);
            if (success) {
                toast({ title: 'Placement record deleted successfully' });
                loadPlacements();
                loadStats();
            } else {
                toast({ title: 'Error deleting placement record', description: error?.message || 'Please try again.', variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting placement:', error);
            toast({ title: 'Deletion Failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteAchievement = async (itemToDelete: Achievement) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the achievement "${itemToDelete.title}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            // Using new supabase client for achievements
            if (itemToDelete.file_path) {
                const { success, error } = await deleteFile('achievements', itemToDelete.file_path, supabase);
                if (error) {
                    console.warn(`Failed to delete achievement file ${itemToDelete.file_path}:`, error.message);
                    toast({ title: 'File Deletion Warning', description: `Could not delete achievement file from storage: ${error.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('achievements', itemToDelete.id, supabase);
            if (success) {
                toast({ title: 'Achievement deleted successfully' });
                loadAchievements();
                loadStats();
            } else {
                toast({ title: 'Error deleting achievement', description: error?.message || 'Please try again.', variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting achievement:', error);
            toast({ title: 'Deletion Failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSearchCertificates = () => {
        console.log("handleSearchCertificates triggered. This function is now mostly handled by useEffect for dynamic filtering.");
        toast({ title: 'Filters applied.' });
    };

    const deleteCertification = async (certId: string, certificateFilePath: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this certificate? This action cannot be undone.");
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            // Using supabaseOld for certificate deletion
            if (certificateFilePath) {
                const { error: storageError } = await supabaseOld.storage.from('certifications').remove([certificateFilePath]);
                if (storageError) {
                    console.warn('Error deleting certificate file from Supabase storage:', storageError);
                    toast({ title: 'Warning', description: 'Could not delete file from Supabase storage. Record deleted from DB.', variant: 'destructive' });
                }
            }

            const { error } = await supabaseOld
                .from('student_certificates')
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
        } finally {
            setIsDeleting(false);
        }
    };

    const uploadResult = async () => {
        if (!resultFile || !resultTitle) {
            toast({ title: 'Error', description: 'Please provide a title and choose a file', variant: 'destructive' });
            return;
        }
        setIsUploading(true);

        const folderPath = 'public_results';
        // Using new supabase client for results upload
        const { publicUrl, filePath, error: uploadError } = await uploadFile('results', resultFile, folderPath, supabase);

        if (uploadError || !publicUrl) {
            console.error('Error uploading result file:', uploadError);
            toast({ title: 'Upload failed', description: uploadError?.message || 'Please try again later.', variant: 'destructive' });
            setIsUploading(false);
            return;
        }

        try {
            // Using new supabase client for results table
            const { error: dbError } = await supabase.from('results').insert([{ title: resultTitle, file_url: publicUrl, file_path: filePath }]);
            if (dbError) {
                await deleteFile('results', filePath!, supabase);
                throw dbError;
            }
            toast({ title: '✅ Result uploaded successfully' });
            setResultTitle('');
            setResultFile(null);
        } catch (error: any) {
            console.error('Error linking result in database:', error);
            toast({ title: 'Upload failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const postNotification = async () => {
        if (!notificationTitle || !notificationMessage) {
            toast({ title: 'Fill both title and message', variant: 'destructive' });
            return;
        }
        setIsUploading(true);
        try {
            // Using new supabase client for notifications
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
        } finally {
            setIsUploading(false);
        }
    };

    const handleAttendanceFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            toast({ title: "Attendance sheet selected", description: `File: ${file.name}. Click 'Process Attendance' to continue.` });
        }
    };

    const processAttendance = () => {
        toast({
            title: "Attendance Processing Placeholder",
            description: "Full attendance processing requires backend logic (parsing file, updating database). This button is currently a placeholder.",
            variant: "info",
        });
    };

    const handleResultsFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setResultFile(file);
    };

    const TAB_VALUES = {
        STUDENTS: 'students',
        CERTIFICATIONS: 'certifications',
        EVENTS: 'events',
        FACULTY: 'faculty',
        PLACEMENTS: 'placements',
        ACHIEVEMENTS: 'achievements',
        ATTENDANCE: 'attendance',
        RESULTS: 'results',
        TIMETABLE: 'timetable',
        GALLERY: 'gallery',
        NOTIFICATIONS: 'notifications',
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-sm text-gray-600">Welcome back, {user?.email} (Admin).</p>
                        </div>
                        <Button
                            onClick={userProfile?.role === 'admin' ? () => supabaseOld.auth.signOut() : () => setLocation('/login')}
                            variant="outline"
                            className="flex items-center space-x-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>{userProfile?.role === 'admin' ? 'Logout' : 'Login'}</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-4 sm:mx-6 lg:mx-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Achievements</p>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.totalAchievements}</p>
                                </div>
                                <Trophy className="w-8 h-8 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-11 gap-1">
                        <TabsTrigger value={TAB_VALUES.STUDENTS} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Students</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.CERTIFICATIONS} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <BookOpen className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Certs</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.EVENTS} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Events</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.FACULTY} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <GraduationCap className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Faculty</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.PLACEMENTS} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Placements</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.ACHIEVEMENTS} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Trophy className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Achievemnts</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.ATTENDANCE} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Attendance</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.RESULTS} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <FileText className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Results</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.TIMETABLE} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <BarChart3 className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Timetable</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.GALLERY} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <Image className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Gallery</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.NOTIFICATIONS} className="flex items-center space-x-1 text-xs lg:text-sm">
                            <User className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Notify</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Students Tab Content (SupabaseOld Backed) */}
                    <TabsContent value={TAB_VALUES.STUDENTS}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Users className="w-5 h-5" />
                                    <span>Student Management ({filteredStudents.length} / {allStudents.length} Total)</span>
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
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <SearchBar
                                        searchTerm={studentSearchTerm}
                                        onSearchChange={setStudentSearchTerm}
                                        onClear={() => setStudentSearchTerm('')}
                                        placeholder="Search by H.T No., Name, or Email"
                                    />
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

                                {filteredStudents.length > 0 ?
                                    (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="border border-gray-200 px-3 py-2 text-left">H.T No.</th>
                                                        <th className="border border-gray-200 px-3 py-2 text-left">Student Name</th>
                                                        <th className="border border-gray-200 px-3 py-2 text-left">Year</th>
                                                        <th className="border border-gray-200 px-3 py-2 text-left">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredStudents.map((student) => (
                                                        <tr key={student.id} className="cursor-pointer hover:bg-gray-100">
                                                            <td className="border border-gray-200 px-3 py-2">{student.ht_no}</td>
                                                            <td className="border border-gray-200 px-3 py-2 flex items-center gap-2">
                                                                <img
                                                                    src={student.photo_url || "/default-avatar.png"}
                                                                    alt="Profile"
                                                                    className="w-6 h-6 rounded-full object-cover"
                                                                    onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
                                                                />
                                                                <span className="text-sm font-medium">{student.student_name}</span>
                                                            </td>
                                                            <td className="border border-gray-200 px-3 py-2">{student.year}</td>
                                                            <td className="border border-gray-200 px-3 py-2">
                                                                <Button size="sm" variant="outline" onClick={() => handleViewStudentDetails(student)}>
                                                                    View Details
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                            <p className="text-gray-500 text-lg">No students found</p>
                                            {(studentSearchTerm || selectedYearFilter !== 'all') && <p className="text-gray-500 text-sm">(Try clearing the filters)</p>}
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Certifications Tab Content (SupabaseOld Backed) */}
                    <TabsContent value={TAB_VALUES.CERTIFICATIONS}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <BookOpen className="w-5 h-5" />
                                    <span>Student Certificates ({filteredCertificates.length} / {certifications.length} Total)</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex flex-wrap items-center gap-2">
                                    <Input
                                        placeholder="Search by H.T No., Name, or Email"
                                        value={certificateSearchHTNO}
                                        onChange={(e) => setCertificateSearchHTNO(e.target.value)}
                                        className="max-w-xs"
                                    />
                                    <Select value={selectedYearFilterCerts} onValueChange={(value) => {
                                        setSelectedYearFilterCerts(value);
                                    }}>
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
                                    <Button onClick={handleSearchCertificates}>
                                        <Search className="w-4 h-4 mr-2" /> Apply Filters
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setCertificateSearchHTNO('');
                                            setSelectedYearFilterCerts('all');
                                            loadCertifications();
                                            toast({ title: 'Filters cleared, showing all certificates.' });
                                        }}
                                        disabled={!certificateSearchHTNO && selectedYearFilterCerts === 'all'}
                                    >
                                        <X className="w-4 h-4 mr-2" /> Clear Filters
                                    </Button>
                                </div>

                                {filteredCertificates.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-200">
                                            <thead>
                                                <tr className="bg-gray-50">
                                                    <th className="border border-gray-200 px-4 py-2 text-left">Student Name</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left">H.T No.</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left">Email</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left">Year</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left">Certificate Name</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left">Uploaded At</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCertificates.map((cert) => (
                                                    <tr key={cert.id}>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            {cert.user_profiles?.student_name || 'Unknown'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            {cert.ht_no || 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            {cert.user_profiles?.email || 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            {cert.user_profiles?.year || 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">{cert.certificate_name}</td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            {cert.uploaded_at ? new Date(cert.uploaded_at).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2">
                                                            <div className="flex space-x-2">
                                                                {cert.certificate_url && (
                                                                    <Button
                                                                        asChild
                                                                        size="sm"
                                                                        variant="outline"
                                                                    >
                                                                        <a
                                                                            href={cert.certificate_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            View
                                                                        </a>
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => deleteCertification(cert.id, cert.file_path!)}
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
                                        {(certificateSearchHTNO || selectedYearFilterCerts !== 'all') && <p className="text-gray-500 text-sm">(Try clearing the filters)</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Events Tab Content (Supabase Backed) */}
                    <TabsContent value={TAB_VALUES.EVENTS}>
                        <div className="w-full px-6 py-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                                <div className="md:w-1/3 w-full">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <Calendar className="w-5 h-5" />
                                                <span>Event Management ({events.length})</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {events.length > 0 ? (
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
                                                                <tr key={event.id} className="bg-white hover:bg-gray-100 border-b border-gray-200">
                                                                    <td className="border border-gray-200 px-4 py-2">{event.title}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">{new Date(event.date).toLocaleDateString()}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">{event.venue || 'N/A'}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">
                                                                        <div className="flex space-x-2">
                                                                            <EventsUploadForm
                                                                                isEdit={true}
                                                                                initialData={event}
                                                                                onUploadSuccess={loadEvents}
                                                                                isUploading={isUploading}
                                                                                setIsUploading={setIsUploading}
                                                                                isUpdating={isUpdating}
                                                                                setIsUpdating={setIsUpdating}
                                                                            />
                                                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event)} disabled={isDeleting}>
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
                                                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                    <p className="text-gray-500 text-lg">No events scheduled.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="w-full md:w-2/3">
                                    <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4">
                                        <CardHeader className="p-0 pb-4">
                                            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                                                <Plus className="h-5 w-5" />
                                                <span>Add New Event</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <EventsUploadForm
                                                onUploadSuccess={loadEvents}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Faculty Tab Content (Supabase Backed) */}
                    <TabsContent value={TAB_VALUES.FACULTY}>
                        <div className="w-full px-6 py-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                                <div className="md:w-1/3 w-full">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <GraduationCap className="w-5 h-5" />
                                                <span>Faculty Management ({faculty.length})</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {faculty.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse border border-gray-200">
                                                        <thead>
                                                            <tr className="bg-gray-50">
                                                                <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                                                                <th className="border border-gray-200 px-4 py-2 text-left">Designation</th>
                                                                <th className="border border-gray-200 px-4 py-2 text-left">Department</th>
                                                                <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {faculty.map((member) => (
                                                                <tr key={member.id} className="bg-white hover:bg-gray-100 border-b border-gray-200">
                                                                    <td className="border border-gray-200 px-4 py-2">{member.name}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">{member.designation}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">{member.department || 'N/A'}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">
                                                                        <div className="flex space-x-2">
                                                                            <FacultyUploadForm
                                                                                isEdit={true}
                                                                                initialData={member}
                                                                                onUploadSuccess={loadFaculty}
                                                                                isUploading={isUploading}
                                                                                setIsUploading={setIsUploading}
                                                                                isUpdating={isUpdating}
                                                                                setIsUpdating={setIsUpdating}
                                                                            />
                                                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteFaculty(member)} disabled={isDeleting}>
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
                                                    <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                    <p className="text-gray-500 text-lg">No faculty members found.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="w-full md:w-2/3">
                                    <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4">
                                        <CardHeader className="p-0 pb-4">
                                            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                                                <Plus className="h-5 w-5" />
                                                <span>Add New Faculty</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <FacultyUploadForm
                                                onUploadSuccess={loadFaculty}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Placements Tab Content (Supabase Backed) */}
                    <TabsContent value={TAB_VALUES.PLACEMENTS}>
                        <div className="w-full px-6 py-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                                <div className="md:w-1/3 w-full">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <TrendingUp className="w-5 h-5" />
                                                <span>Placement Management ({placements.length})</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {placements.length > 0 ? (
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
                                                                <tr key={placement.id} className="bg-white hover:bg-gray-100 border-b border-gray-200">
                                                                    <td className="border border-gray-200 px-4 py-2">{placement.student_name}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">{placement.company}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">{placement.year}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">
                                                                        <div className="flex space-x-2">
                                                                            <PlacementsUploadForm
                                                                                isEdit={true}
                                                                                initialData={placement}
                                                                                onUploadSuccess={loadPlacements}
                                                                                isUploading={isUploading}
                                                                                setIsUploading={setIsUploading}
                                                                                isUpdating={isUpdating}
                                                                                setIsUpdating={setIsUpdating}
                                                                            />
                                                                            <Button size="sm" variant="destructive" onClick={() => handleDeletePlacement(placement)} disabled={isDeleting}>
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
                                                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                    <p className="text-gray-500 text-lg">No placement records found.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="w-full md:w-2/3">
                                    <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4">
                                        <CardHeader className="p-0 pb-4">
                                            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                                                <Plus className="h-5 w-5" />
                                                <span>Add New Placement</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <PlacementsUploadForm
                                                onUploadSuccess={loadPlacements}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Achievements Tab Content (Supabase Backed) */}
                    <TabsContent value={TAB_VALUES.ACHIEVEMENTS}>
                        <div className="w-full px-6 py-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                                <div className="md:w-1/3 w-full">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <Trophy className="w-5 h-5" />
                                                <span>Achievement Management ({achievements.length})</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {achievements.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full border-collapse border border-gray-200">
                                                        <thead>
                                                            <tr className="bg-gray-50">
                                                                <th className="border border-gray-200 px-4 py-2 text-left">Title</th>
                                                                <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                                                                <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {achievements.map((item) => (
                                                                <tr key={item.id} className="bg-white hover:bg-gray-100 border-b border-gray-200">
                                                                    <td className="border border-gray-200 px-4 py-2">{item.title}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                                                                    <td className="border border-gray-200 px-4 py-2">
                                                                        <div className="flex space-x-2">
                                                                            <AchievementsUploadForm
                                                                                isEdit={true}
                                                                                initialData={item}
                                                                                onUploadSuccess={loadAchievements}
                                                                                isUploading={isUploading}
                                                                                setIsUploading={setIsUploading}
                                                                                isUpdating={isUpdating}
                                                                                setIsUpdating={setIsUpdating}
                                                                            />
                                                                            <Button size="sm" variant="destructive" onClick={() => handleDeleteAchievement(item)} disabled={isDeleting}>
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
                                                    <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                                    <p className="text-gray-500 text-lg">No achievements found.</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="w-full md:w-2/3">
                                    <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4">
                                        <CardHeader className="p-0 pb-4">
                                            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                                                <Plus className="h-5 w-5" />
                                                <span>Upload New Achievement</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <AchievementsUploadForm
                                                onUploadSuccess={loadAchievements}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Attendance Tab Content (Supabase/Internal logic) */}
                    <TabsContent value={TAB_VALUES.ATTENDANCE}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5" />
                                    <span>Attendance Upload</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Label htmlFor="attendance-file">Upload Attendance Sheet (CSV/Excel)</Label>
                                <Input id="attendance-file" type="file" accept=".csv, .xlsx" onChange={handleAttendanceFileUpload} />
                                <Button
                                    onClick={processAttendance}
                                    className="flex items-center space-x-1"
                                    disabled={isUploading}
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>Process Attendance (Placeholder)</span>
                                </Button>
                                <p className="text-sm text-gray-500">
                                    Upload a spreadsheet containing student attendance data.
                                    This will be reflected in student profiles. **Note: Full processing of the file content requires backend implementation.**
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Results Tab Content (Supabase Backed) */}
                    <TabsContent value={TAB_VALUES.RESULTS}>
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

                                <Button
                                    onClick={uploadResult}
                                    className="flex items-center space-x-1"
                                    disabled={isUploading || !resultFile || !resultTitle}
                                >
                                    {isUploading ? 'Uploading...' : 'Upload Result'}
                                    <Upload className="w-4 h-4" />
                                </Button>
                                {(!resultFile || !resultTitle) && (
                                    <p className="text-sm text-red-500">Please enter a title and select a PDF file to enable upload.</p>
                                )}
                                <p className="text-sm text-gray-500">
                                    Upload official semester results in PDF format.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Timetable Tab Content (External component) */}
                    <TabsContent value={TAB_VALUES.TIMETABLE}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <BarChart3 className="w-5 h-5" />
                                    <span>Timetable Management</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<div>Loading Timetable...</div>}>
                                    <TimetableManager />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Gallery Tab Content (Supabase Backed) */}
                    <TabsContent value={TAB_VALUES.GALLERY}>
                        <div className="w-full px-6 py-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                                <div className="md:w-1/3 w-full">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <Image className="w-5 h-5" />
                                                <span>Gallery Management ({gallery.length})</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {gallery.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                    {gallery.map((item) => (
                                                        <Card key={item.id} className="relative group overflow-hidden h-full flex flex-col">
                                                            <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" />
                                                            <CardContent className="p-2 text-sm flex-grow">
                                                                <h3 className="font-semibold">{item.title}</h3>
                                                                <p className="text-gray-500 text-xs truncate">{item.description}</p>
                                                                <div className="flex justify-end space-x-2 mt-2">
                                                                    <GalleryUploadForm
                                                                        isEdit={true}
                                                                        initialData={item}
                                                                        onUploadSuccess={loadGallery}
                                                                        isUploading={isUploading}
                                                                        setIsUploading={setIsUploading}
                                                                        isUpdating={isUpdating}
                                                                        setIsUpdating={setIsUpdating}
                                                                    />
                                                                    <Button
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        onClick={() => handleDeleteGalleryItem(item)}
                                                                        disabled={isDeleting}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
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
                                </div>

                                <div className="w-full md:w-2/3">
                                    <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4">
                                        <CardHeader className="p-0 pb-4">
                                            <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                                                <Plus className="h-5 w-5" />
                                                <span>Upload New Gallery Item</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <GalleryUploadForm
                                                onUploadSuccess={loadGallery}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Notifications Tab Content (Supabase Backed) */}
                    <TabsContent value={TAB_VALUES.NOTIFICATIONS}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="w-5 h-5" />
                                    <span>Post Notification</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Label htmlFor="notification-title">Notification Title</Label>
                                <Input
                                    id="notification-title"
                                    placeholder="e.g., Important Update"
                                    value={notificationTitle}
                                    onChange={(e) => setNotificationTitle(e.target.value)}
                                />

                                <Label htmlFor="notification-message">Notification Message</Label>
                                <Textarea
                                    id="notification-message"
                                    placeholder="Enter your message here..."
                                    value={notificationMessage}
                                    onChange={(e) => setNotificationMessage(e.target.value)}
                                />

                                <Button
                                    onClick={postNotification}
                                    className="flex items-center space-x-1"
                                    disabled={isUploading || !notificationTitle || !notificationMessage}
                                >
                                    {isUploading ? 'Posting...' : 'Post Notification'}
                                    <Upload className="w-4 h-4" />
                                </Button>
                                {(!notificationTitle || !notificationMessage) && (
                                    <p className="text-sm text-red-500">Please enter both a title and a message to post.</p>
                                )}
                                <p className="text-sm text-gray-500">
                                    Notifications will be visible to all students on their dashboards.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Edit Student Dialog (SupabaseOld Backed) */}
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
                                        value={editingStudent.student_name}
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
                                        value={editingStudent.ht_no}
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
                                        value={editingStudent.year}
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
                                        value={editingStudent.status}
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
                                        value={editingStudent.phone}
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
                                        value={editingStudent.address}
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
                                        value={editingStudent.emergency_no}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, emergency_no: e.target.value })}
                                        className="col-span-3"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => updateStudent(editingStudent)} disabled={isUpdating}>
                                        {isUpdating ? 'Updating...' : 'Update Student'}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Promote Students Modal (SupabaseOld Backed) */}
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
                                        <SelectItem value="4">4th Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleBulkPromote} disabled={!yearToPromote || isUpdating}>
                                    {isUpdating ? 'Promoting...' : 'Promote All Students in Selected Year'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Student Detail View Dialog (SupabaseOld Backed) */}
                <Dialog open={!!viewingStudent} onOpenChange={() => { setViewingStudent(null); setNewProfilePhotoFile(null); }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Student Details</DialogTitle>
                        </DialogHeader>
                        {viewingStudent && (
                            <div className="grid gap-4 py-4">
                                <div className="flex flex-col items-center mb-4 space-y-2">
                                    {isPhotoLoading ? (
                                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    ) : (
                                        <img
                                            src={viewingStudent.photo_url || '/default-avatar.png'}
                                            alt="Profile Photo"
                                            className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                                            onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
                                        />
                                    )}
                                    <span className="text-sm text-gray-500">Profile Photo</span>
                                </div>

                                <div className="grid grid-cols-4 items-center gap-2">
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

                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
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
                                <DialogFooter>
                                    <Button onClick={() => {
                                        setEditingStudent(viewingStudent);
                                        setViewingStudent(null);
                                    }}>
                                        Edit Student
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
};

export default AdminDashboard;
