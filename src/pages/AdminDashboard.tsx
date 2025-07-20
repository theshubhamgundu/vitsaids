import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Calendar, GraduationCap, TrendingUp, LogOut, BookOpen, Trophy, Image, BarChart3, Plus, Trash2, Upload, Clock, FileText, Search, MoreVertical, User, X, GripVertical } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import TimetableManager from '@/components/TimetableManager';
import { useLocation } from 'wouter';

// DND-Kit imports (still needed as DND is managed at the dashboard level for multiple lists)
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { arrayMove } from '@dnd-kit/sortable';

// GitHub utilities
import { uploadToGitHubRepo } from '@/lib/github-utils';

// --- NEW IMPORTS FOR UPLOAD FORMS ---
import GalleryUploadForm from '@/components/GalleryUploadForm';
import EventsUploadForm from '@/components/EventsUploadForm';
import FacultyUploadForm from '@/components/FacultyUploadForm';
import PlacementsUploadForm from '@/components/PlacementsUploadForm';
import AchievementsUploadForm from '@/components/AchievementsUploadForm';
// --- END NEW IMPORTS ---


// Type definitions for our data (these remain in AdminDashboard as it manages the overall state)
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
    speaker?: string;
    image?: string;
}

interface Faculty {
    id: string;
    name: string;
    designation: string;
    department: string;
    bio?: string;
    expertise?: string;
    publications?: string;
    image?: string;
}

interface GalleryItem {
    id: string;
    title: string;
    description?: string;
    image: string;
}

interface Placement {
    id: string;
    student_name: string;
    company: string;
    ctc?: number;
    year: number;
    type: string;
    branch: string;
    image?: string;
}

interface CertificateItem {
    id: string;
    ht_no: string;
    certificate_url: string;
    certificate_name: string;
    uploaded_at?: string;
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
}


const SortableItem = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: 'none',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
};


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

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const persistGitHubData = useCallback(async <T extends { id: string }>(
        dataArray: T[],
        filePath: string,
        variableName: string,
        commitMessage: string
    ) => {
        setIsUpdating(true);
        try {
            console.warn(`WARNING: persistGitHubData is currently a NO-OP for actual GitHub file content updates/deletions for '${variableName}'.
                You need to implement 'updateFileContentInGithub' and 'fetchFileContentFromGithub' in your github-utils.ts.`);
            toast({ title: 'Persistence Not Implemented', description: 'GitHub file operations are not yet enabled. Changes are not saved.', variant: 'destructive' });
            return false;
        } catch (error: any) {
            console.error(`Error simulating persistence of ${variableName} data to GitHub:`, error);
            toast({ title: 'Persistence Error', description: `Failed to save changes: ${error.message}`, variant: 'destructive' });
            return false;
        } finally {
            setIsUpdating(false);
        }
    }, [toast]);

    const loadAllStudents = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            let query = supabase.from('user_profiles').select('*').eq('role', 'student');
            if (selectedYearFilter !== 'all') {
                query = query.eq('year', parseInt(selectedYearFilter));
            }
            const { data, error } = await query.order('student_name', { ascending: true });
            if (error) throw error;

            const studentsWithPhotos = await Promise.all(data.map(async (student: PendingStudent) => {
                const photoPath = `profiles/${student.id}/photo.jpg`;
                const { data: publicUrlData, error: storageError } = supabase.storage.from("profile_photos").getPublicUrl(photoPath);

                if (storageError || !publicUrlData?.publicUrl) {
                    console.warn(`Could not get public URL for student ${student.id}'s photo:`, storageError?.message || 'No public URL found.');
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
    }, [selectedYearFilter, toast]);


    const loadEvents = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            console.error("CRITICAL: GitHub integration incomplete: fetchAndParseTsFile is missing. Cannot load events data from GitHub.");
            const data: Event[] = [];
            setEvents(data);
        } catch (error: any) {
            console.error('Error loading events:', error);
            toast({ title: 'Error loading events', description: error.message || 'Please implement GitHub fetch.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadFaculty = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            console.error("CRITICAL: GitHub integration incomplete: fetchAndParseTsFile is missing. Cannot load faculty data from GitHub.");
            const data: Faculty[] = [];
            setFaculty(data);
        } catch (error: any) {
            console.error('Error loading faculty:', error);
            toast({ title: 'Error loading faculty', description: error.message || 'Please implement GitHub fetch.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadPlacements = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            console.error("CRITICAL: GitHub integration incomplete: fetchAndParseTsFile is missing. Cannot load placements data from GitHub.");
            const data: Placement[] = [];
            setPlacements(data);
        } catch (error: any) {
            console.error('Error loading placements:', error);
            toast({ title: 'Error loading placements', description: error.message || 'Please implement GitHub fetch.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadGallery = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            console.error("CRITICAL: GitHub integration incomplete: fetchAndParseTsFile is missing. Cannot load gallery data from GitHub.");
            const data: GalleryItem[] = [];
            setGallery(data);
        } catch (error: any) {
            console.error('Error loading gallery:', error);
            toast({ title: 'Error loading gallery', description: error.message || 'Please implement GitHub fetch.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadAchievements = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            console.error("CRITICAL: GitHub integration incomplete: fetchAndParseTsFile is missing. Cannot load achievements data from GitHub.");
            const data: Achievement[] = [];
            setAchievements(data);
        } catch (error: any) {
            console.error('Error loading achievements:', error);
            toast({ title: 'Error loading achievements', description: error.message || 'Please implement GitHub fetch.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);


    const loadCertifications = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            let query = supabase
                .from('certificates')
                .select(`*, user_profiles!inner(student_name, ht_no, email, year)`);

            if (selectedYearFilterCerts !== 'all') {
                query = query.eq('user_profiles.year', parseInt(selectedYearFilterCerts));
            }

            const { data, error } = await query.order('uploaded_at', { ascending: false });

            if (!error && data) {
                setCertifications(data);
                if (!certificateSearchHTNO) {
                    setFilteredCertificates(data);
                }
            } else {
                console.error('Error loading certificates:', error);
                toast({ title: 'Error loading certificates', description: error?.message || 'Unknown error', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error loading certificates (catch block):', error);
            toast({ title: 'Error loading certificates', description: 'Network or unexpected error.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast, selectedYearFilterCerts, certificateSearchHTNO]);


    const loadStats = useCallback(async () => {
        try {
            const { count: studentsCount, error: studentsError } = await supabase.from('user_profiles').select('id', { count: 'exact' }).eq('role', 'student');
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
        if (!loading && userProfile?.role === 'admin') {
            loadAllStudents();
            loadEvents();
            loadFaculty();
            loadPlacements();
            loadGallery();
            loadAchievements();
            loadCertifications();
            loadStats();

            const studentsChannel = supabase
                .channel('students-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
                    loadAllStudents();
                    loadStats();
                })
                .subscribe();

            const certificatesChannel = supabase
                .channel('certificates-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, () => {
                    loadCertifications();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(studentsChannel);
                supabase.removeChannel(certificatesChannel);
            };
        } else if (!loading && userProfile && userProfile.role !== 'admin') {
            setLocation('/');
        }
    }, [userProfile, loading, setLocation, loadAllStudents, loadEvents, loadFaculty, loadPlacements, loadGallery, loadAchievements, loadCertifications, loadStats]);

    useEffect(() => {
        if (certificateSearchHTNO || selectedYearFilterCerts !== 'all') { // Trigger filter if any filter is active
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
        } else {
            setFilteredCertificates(certifications); // Show all if no filters are active
        }
    }, [certificateSearchHTNO, certifications, selectedYearFilterCerts]); // Added selectedYearFilterCerts here too


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
        } finally {
            setIsUpdating(false);
        }
    };

    const updateStudent = async (studentData: Partial<PendingStudent>) => {
        try {
            const { error } = await supabase
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

        setIsPhotoLoading(true);

        const filePathInStorage = `profiles/${viewingStudent.id}/photo.jpg`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('profile_photos')
                .upload(filePathInStorage, newProfilePhotoFile, {
                    upsert: true,
                    contentType: newProfilePhotoFile.type,
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: publicUrlData } = supabase.storage.from('profile_photos').getPublicUrl(filePathInStorage);
            const newPhotoUrl = publicUrlData.publicUrl;

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ photo_url: newPhotoUrl })
                .eq('id', viewingStudent.id);

            if (updateError) {
                throw updateError;
            }

            toast({ title: '✅ Profile photo updated successfully' });
            setNewProfilePhotoFile(null);
            loadAllStudents();
            setViewingStudent(prev => prev ? { ...prev, photo_url: newPhotoUrl } : null);

        } catch (error: any) {
            console.error('Error uploading profile photo:', error);
            toast({ title: 'Error uploading photo', description: error.message || 'Please try again.', variant: 'destructive' });
        } finally {
            setIsPhotoLoading(false);
        }
    };

    const handleViewStudentDetails = async (student: PendingStudent) => {
        setIsPhotoLoading(true);
        setViewingStudent(student);
        setIsPhotoLoading(false);
    };

    const handleDragEnd = async <T extends { id: string }>(
        event: DragEndEvent,
        dataArray: T[],
        setDataArray: React.Dispatch<React.SetStateAction<T[]>>,
        filePath: string,
        variableName: string
    ) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = dataArray.findIndex(item => item.id === active.id);
            const newIndex = dataArray.findIndex(item => item.id === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrderedArray = arrayMove(dataArray, oldIndex, newIndex);
                setDataArray(newOrderedArray);

                const success = await persistGitHubData(newOrderedArray, filePath, variableName, `Reordered ${variableName}`);
                if (!success) {
                    setDataArray(dataArray);
                    toast({ title: 'Reorder Failed', description: 'Changes could not be saved to GitHub. Please implement persistGitHubData fully.', variant: 'destructive' });
                } else {
                    toast({ title: 'Reordered successfully', description: `Items in ${variableName} have been reordered (simulated).` });
                }
            }
        }
    };


    const handleDeleteEvent = async (eventToDelete: Event) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the event "${eventToDelete.title}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            if (eventToDelete.image) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete event image from GitHub.");
            }

            const updatedEvents = events.filter(event => event.id !== eventToDelete.id);
            setEvents(updatedEvents);

            const success = await persistGitHubData(updatedEvents, 'public/events/events.ts', 'events', `Delete event: ${eventToDelete.title}`);
            if (!success) {
                setEvents(events);
                toast({ title: 'Error', description: 'Failed to delete event details from GitHub. Please refresh.', variant: 'destructive' });
            } else {
                toast({ title: 'Event deleted successfully (simulated)' });
                loadStats();
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
            if (facultyToDelete.image) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete faculty image from GitHub.");
            }

            const updatedFaculty = faculty.filter(member => member.id !== facultyToDelete.id);
            setFaculty(updatedFaculty);

            const success = await persistGitHubData(updatedFaculty, 'public/faculty/faculty.ts', 'faculty', `Delete faculty: ${facultyToDelete.name}`);
            if (!success) {
                setFaculty(faculty);
                toast({ title: 'Error', description: 'Failed to delete faculty details from GitHub. Please refresh.', variant: 'destructive' });
            } else {
                toast({ title: 'Faculty member deleted successfully (simulated)' });
                loadStats();
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
            if (itemToDelete.image) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete gallery image from GitHub.");
            }

            const updatedGallery = gallery.filter(item => item.id !== itemToDelete.id);
            setGallery(updatedGallery);

            const success = await persistGitHubData(updatedGallery, 'public/gallery/gallery.ts', 'galleryItems', `Delete gallery item: ${itemToDelete.title}`);
            if (!success) {
                setGallery(gallery);
                toast({ title: 'Error', description: 'Failed to delete gallery item from GitHub. Please refresh.', variant: 'destructive' });
            } else {
                toast({ title: 'Gallery item deleted successfully (simulated)' });
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
            if (itemToDelete.image) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete placement image from GitHub.");
            }

            const updatedPlacements = placements.filter(item => item.id !== itemToDelete.id);
            setPlacements(updatedPlacements);

            const success = await persistGitHubData(updatedPlacements, 'public/placements/placements.ts', 'placements', `Delete placement: ${itemToDelete.student_name}`);
            if (!success) {
                setPlacements(placements);
                toast({ title: 'Error', description: 'Failed to delete placement record from GitHub. Please refresh.', variant: 'destructive' });
            } else {
                toast({ title: 'Placement record deleted successfully (simulated)' });
                loadStats();
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
            if (itemToDelete.certificate_url) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete achievement certificate from GitHub.");
            }

            const updatedAchievements = achievements.filter(item => item.id !== itemToDelete.id);
            setAchievements(updatedAchievements);

            const success = await persistGitHubData(updatedAchievements, 'public/achievements/achievements.ts', 'achievements', `Delete achievement: ${itemToDelete.title}`);
            if (!success) {
                setAchievements(achievements);
                toast({ title: 'Error', description: 'Failed to delete achievement from GitHub. Please refresh.', variant: 'destructive' });
            } else {
                toast({ title: 'Achievement deleted successfully (simulated)' });
                loadStats();
            }
        } catch (error: any) {
            console.error('Error deleting achievement:', error);
            toast({ title: 'Deletion Failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    };


    const handleSearchCertificates = () => {
        if (!certificateSearchHTNO && selectedYearFilterCerts === 'all') {
            setFilteredCertificates(certifications);
            toast({ title: 'Showing all certificates.' });
            return;
        }

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

        if (currentFiltered.length === 0) {
            toast({ title: 'No certificates found for this search criteria.' });
        } else {
            toast({ title: `Found ${currentFiltered.length} certificate(s).` });
        }
    };


    const deleteCertification = async (certId: string, certificateUrl: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this certificate? This action cannot be undone.");
        if (!confirmDelete) return;

        try {
            if (certificateUrl) {
                const pathWithinBucket = certificateUrl.split('certificates/')[1];
                if (pathWithinBucket) {
                    const { error: storageError } = await supabase.storage.from('certificates').remove([pathWithinBucket]);
                    if (storageError) {
                        console.warn('Error deleting certificate file from storage:', storageError);
                        toast({ title: 'Warning', description: 'Could not delete file from storage. Record deleted from DB.', variant: 'destructive' });
                    }
                }
            }

            const { error } = await supabase
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


    const uploadResult = async () => {
        if (!resultFile || !resultTitle) {
            toast({ title: 'Error', description: 'Please provide a title and choose a file', variant: 'destructive' });
            return;
        }
        setIsUploading(true);
        const fileName = `${Date.now()}-${resultFile.name}`;
        const filePath = `results/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage.from('results').upload(filePath, resultFile, { upsert: true });
            if (uploadError) {
                throw uploadError;
            }
            const { data: publicUrlData } = supabase.storage.from('results').getPublicUrl(filePath);

            const { error: dbError } = await supabase.from('results').insert([{ title: resultTitle, file_url: publicUrlData.publicUrl }]);
            if (dbError) {
                throw dbError;
            }
            toast({ title: '✅ Result uploaded successfully' });
            setResultTitle('');
            setResultFile(null);
        } catch (error: any) {
            console.error('Error uploading result:', error);
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
                            onClick={userProfile?.role === 'admin' ? () => supabase.auth.signOut() : () => setLocation('/login')}
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

                <Tabs defaultValue={TAB_VALUES.STUDENTS} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-10 gap-1">
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
                    </TabsList>

                    {/* Students Tab Content (Supabase Backed) */}
                    <TabsContent value={TAB_VALUES.STUDENTS}>
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
                                                        <th className="border border-gray-200 px-3 py-2 text-left">H.T No.</th>
                                                        <th className="border border-gray-200 px-3 py-2 text-left">Student Name</th> {/* Combined Photo and Name Header */}
                                                        <th className="border border-gray-200 px-3 py-2 text-left">Year</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {allStudents.map((student) => (
                                                        <tr key={student.id} onClick={() => handleViewStudentDetails(student)} className="cursor-pointer hover:bg-gray-100">
                                                            <td className="border border-gray-200 py-2 px-3">{student.ht_no}</td>
                                                            <td className="border border-gray-200 py-2 px-3 flex items-center gap-2">
                                                                <img
                                                                    src={student.photo_url || "/default-avatar.png"}
                                                                    alt="Profile"
                                                                    className="w-6 h-6 rounded-full object-cover" // Applied small avatar styles
                                                                    onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
                                                                />
                                                                <span className="text-sm font-medium">{student.student_name}</span> {/* Ensured text-sm */}
                                                            </td>
                                                            <td className="border border-gray-200 py-2 px-3">{student.year}</td>
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

                    {/* Certifications Tab Content (Supabase Backed) */}
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
                                        // No direct call to handleSearchCertificates here,
                                        // the useEffect below will trigger on state change.
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
                                            loadCertifications(); // Re-load all certs from DB without filters
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
                                                                            href={supabase.storage.from('certificates').getPublicUrl(cert.certificate_url).data.publicUrl}
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
                                        {(certificateSearchHTNO || selectedYearFilterCerts !== 'all') && <p className="text-gray-500 text-sm">(Try clearing the filters)</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Events Tab Content (GitHub Backed) */}
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
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(event) => handleDragEnd(event, events, setEvents, 'public/events/events.ts', 'events')}
                                                >
                                                    <SortableContext
                                                        items={events.map(event => event.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full border-collapse border border-gray-200">
                                                                <thead>
                                                                    <tr className="bg-gray-50">
                                                                        <th className="border border-gray-200 px-4 py-2 text-left w-12">Order</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Title</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Venue</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {events.map((event) => (
                                                                        <SortableItem key={event.id} id={event.id}>
                                                                            <tr className="bg-white hover:bg-gray-100 border-b border-gray-200">
                                                                                <td className="border border-gray-200 px-2 py-2 text-center">
                                                                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab mx-auto" />
                                                                                </td>
                                                                                <td className="border border-gray-200 px-4 py-2">{event.title}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">{new Date(event.date).toLocaleDateString()}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">{event.venue || 'N/A'}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">
                                                                                    <div className="flex space-x-2">
                                                                                        <EventsUploadForm
                                                                                            isEdit={true}
                                                                                            initialData={event}
                                                                                            onUploadSuccess={loadEvents}
                                                                                            events={events}
                                                                                            setEvents={setEvents}
                                                                                            isUploading={isUploading}
                                                                                            setIsUploading={setIsUploading}
                                                                                            isUpdating={isUpdating}
                                                                                            setIsUpdating={setIsUpdating}
                                                                                            persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                                                                persistGitHubData(dataArray as Event[], filePath, variableName, commitMessage)
                                                                                            }
                                                                                        />
                                                                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteEvent(event)} disabled={isDeleting}>
                                                                                            <Trash2 className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </SortableItem>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
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
                                                <span>Upload New Event</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <EventsUploadForm
                                                onUploadSuccess={loadEvents}
                                                events={events}
                                                setEvents={setEvents}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                                persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                    persistGitHubData(dataArray as Event[], filePath, variableName, commitMessage)
                                                }
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Faculty Tab Content (GitHub Backed) */}
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
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(event) => handleDragEnd(event, faculty, setFaculty, 'public/faculty/faculty.ts', 'faculty')}
                                                >
                                                    <SortableContext
                                                        items={faculty.map(member => member.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full border-collapse border border-gray-200">
                                                                <thead>
                                                                    <tr className="bg-gray-50">
                                                                        <th className="border border-gray-200 px-4 py-2 text-left w-12">Order</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Designation</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Department</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {faculty.map((member) => (
                                                                        <SortableItem key={member.id} id={member.id}>
                                                                            <tr className="bg-white hover:bg-gray-100 border-b border-gray-200">
                                                                                <td className="border border-gray-200 px-2 py-2 text-center">
                                                                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab mx-auto" />
                                                                                </td>
                                                                                <td className="border border-gray-200 px-4 py-2">{member.name}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">{member.designation}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">{member.department || 'N/A'}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">
                                                                                    <div className="flex space-x-2">
                                                                                        <FacultyUploadForm
                                                                                            isEdit={true}
                                                                                            initialData={member}
                                                                                            onUploadSuccess={loadFaculty}
                                                                                            faculty={faculty}
                                                                                            setFaculty={setFaculty}
                                                                                            isUploading={isUploading}
                                                                                            setIsUploading={setIsUploading}
                                                                                            isUpdating={isUpdating}
                                                                                            setIsUpdating={setIsUpdating}
                                                                                            persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                                                                persistGitHubData(dataArray as Faculty[], filePath, variableName, commitMessage)
                                                                                            }
                                                                                        />
                                                                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteFaculty(member)} disabled={isDeleting}>
                                                                                            <Trash2 className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </SortableItem>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
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
                                                faculty={faculty}
                                                setFaculty={setFaculty}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                                persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                    persistGitHubData(dataArray as Faculty[], filePath, variableName, commitMessage)
                                                }
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Placements Tab Content (GitHub Backed) */}
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
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(event) => handleDragEnd(event, placements, setPlacements, 'public/placements/placements.ts', 'placements')}
                                                >
                                                    <SortableContext
                                                        items={placements.map(item => item.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full border-collapse border border-gray-200">
                                                                <thead>
                                                                    <tr className="bg-gray-50">
                                                                        <th className="border border-gray-200 px-4 py-2 text-left w-12">Order</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Student Name</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Company</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Year</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {placements.map((placement) => (
                                                                        <SortableItem key={placement.id} id={placement.id}>
                                                                            <tr className="bg-white hover:bg-gray-100 border-b border-gray-200">
                                                                                <td className="border border-gray-200 px-2 py-2 text-center">
                                                                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab mx-auto" />
                                                                                </td>
                                                                                <td className="border border-gray-200 px-4 py-2">{placement.student_name}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">{placement.company}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">{placement.year}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">
                                                                                    <div className="flex space-x-2">
                                                                                        <PlacementsUploadForm
                                                                                            isEdit={true}
                                                                                            initialData={placement}
                                                                                            onUploadSuccess={loadPlacements}
                                                                                            placements={placements}
                                                                                            setPlacements={setPlacements}
                                                                                            isUploading={isUploading}
                                                                                            setIsUploading={setIsUploading}
                                                                                            isUpdating={isUpdating}
                                                                                            setIsUpdating={setIsUpdating}
                                                                                            persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                                                                persistGitHubData(dataArray as Placement[], filePath, variableName, commitMessage)
                                                                                            }
                                                                                        />
                                                                                        <Button size="sm" variant="destructive" onClick={() => handleDeletePlacement(placement)} disabled={isDeleting}>
                                                                                            <Trash2 className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </SortableItem>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
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
                                                placements={placements}
                                                setPlacements={setPlacements}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                                persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                    persistGitHubData(dataArray as Placement[], filePath, variableName, commitMessage)
                                                }
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* NEW: Achievements Tab Content (GitHub Backed) */}
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
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(event) => handleDragEnd(event, achievements, setAchievements, 'public/achievements/achievements.ts', 'achievements')}
                                                >
                                                    <SortableContext
                                                        items={achievements.map(item => item.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full border-collapse border border-gray-200">
                                                                <thead>
                                                                    <tr className="bg-gray-50">
                                                                        <th className="border border-gray-200 px-4 py-2 text-left w-12">Order</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Title</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                                                                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {achievements.map((item) => (
                                                                        <SortableItem key={item.id} id={item.id}>
                                                                            <tr className="bg-white hover:bg-gray-100 border-b border-gray-200">
                                                                                <td className="border border-gray-200 px-2 py-2 text-center">
                                                                                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab mx-auto" />
                                                                                </td>
                                                                                <td className="border border-gray-200 px-4 py-2">{item.title}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                                                                                <td className="border border-gray-200 px-4 py-2">
                                                                                    <div className="flex space-x-2">
                                                                                        <AchievementsUploadForm
                                                                                            isEdit={true}
                                                                                            initialData={item}
                                                                                            onUploadSuccess={loadAchievements}
                                                                                            achievements={achievements}
                                                                                            setAchievements={setAchievements}
                                                                                            isUploading={isUploading}
                                                                                            setIsUploading={setIsUploading}
                                                                                            isUpdating={isUpdating}
                                                                                            setIsUpdating={setIsUpdating}
                                                                                            persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                                                                persistGitHubData(dataArray as Achievement[], filePath, variableName, commitMessage)
                                                                                            }
                                                                                        />
                                                                                        <Button size="sm" variant="destructive" onClick={() => handleDeleteAchievement(item)} disabled={isDeleting}>
                                                                                            <Trash2 className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        </SortableItem>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
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
                                                achievements={achievements}
                                                setAchievements={setAchievements}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                                persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                    persistGitHubData(dataArray as Achievement[], filePath, variableName, commitMessage)
                                                }
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

                    {/* Gallery Tab Content (GitHub Backed) */}
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
                                                <DndContext
                                                    sensors={sensors}
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(event) => handleDragEnd(event, gallery, setGallery, 'public/gallery/gallery.ts', 'galleryItems')}
                                                >
                                                    <SortableContext
                                                        items={gallery.map(item => item.id)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                            {gallery.map((item) => (
                                                                <SortableItem key={item.id} id={item.id}>
                                                                    <Card className="relative group overflow-hidden h-full flex flex-col">
                                                                        <div className="absolute top-2 left-2 z-10">
                                                                            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                                                                        </div>
                                                                        <img src={item.image} alt={item.title} className="w-full h-32 object-cover" />
                                                                        <CardContent className="p-2 text-sm flex-grow">
                                                                            <h3 className="font-semibold">{item.title}</h3>
                                                                            <p className="text-gray-500 text-xs truncate">{item.description}</p>
                                                                            <div className="flex justify-end space-x-2 mt-2">
                                                                                <GalleryUploadForm
                                                                                    isEdit={true}
                                                                                    initialData={item}
                                                                                    onUploadSuccess={loadGallery}
                                                                                    galleryItems={gallery}
                                                                                    setGalleryItems={setGallery}
                                                                                    isUploading={isUploading}
                                                                                    setIsUploading={setIsUploading}
                                                                                    isUpdating={isUpdating}
                                                                                    setIsUpdating={setIsUpdating}
                                                                                    persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                                                        persistGitHubData(dataArray as GalleryItem[], filePath, variableName, commitMessage)
                                                                                    }
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
                                                                </SortableItem>
                                                            ))}
                                                        </div>
                                                    </SortableContext>
                                                </DndContext>
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
                                                galleryItems={gallery}
                                                setGalleryItems={setGallery}
                                                isUploading={isUploading}
                                                setIsUploading={setIsUploading}
                                                isUpdating={isUpdating}
                                                setIsUpdating={setIsUpdating}
                                                persistGitHubData={(dataArray, filePath, variableName, commitMessage) =>
                                                    persistGitHubData(dataArray as GalleryItem[], filePath, variableName, commitMessage)
                                                }
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Edit Student Dialog (Supabase Backed) */}
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

                {/* Promote Students Modal (Supabase Backed) */}
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

                {/* Student Detail View Dialog (Supabase Backed) */}
                <Dialog open={!!viewingStudent} onOpenChange={() => { setViewingStudent(null); setNewProfilePhotoFile(null); }}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Student Details</DialogTitle>
                        </DialogHeader>
                        {viewingStudent && (
                            <div className="grid gap-4 py-4">
                                {/* Profile Photo Display */}
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

                                {/* Photo Upload Option */}
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

                                {/* Student Details */}
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
