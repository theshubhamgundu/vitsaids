import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
// IMPORTANT: fetchAndParseTsFile, deleteFileFromGithub, updateGithubContentFile are NOT exported by your provided github-utils.ts
// You MUST implement these functions in '@/lib/github-utils' for GitHub-backed features to work.
import { uploadToGitHubRepo } from '@/lib/github-utils';

// --- NEW IMPORTS FOR UPLOAD FORMS ---
// Verify: Make sure none of these form components import AdminDashboard back (to avoid circular dependencies)
import GalleryUploadForm from '@/components/GalleryUploadForm';
import EventsUploadForm from '@/components/EventsUploadForm';
import FacultyUploadForm from '@/components/FacultyUploadForm';
import PlacementsUploadForm from '@/components/PlacementsUploadForm';
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
        ht_no: string;
    };
}

// NEW TYPE FOR ACHIEVEMENT
interface Achievement {
    id: string;
    title: string;
    description?: string;
    date?: string; // Optional date for when achievement was earned
    certificate_url?: string; // URL to a certificate PDF or image
}


// CRITICAL FIX: Moved SortableItem component definition above AdminDashboard to prevent ReferenceError
// Reusable Sortable Item Component for DND-Kit
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

    // State for main data arrays
    const [allStudents, setAllStudents] = useState<PendingStudent[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [certifications, setCertifications] = useState<CertificateItem[]>([]);
    // NEW STATE FOR ACHIEVEMENTS
    const [achievements, setAchievements] = useState<Achievement[]>([]);


    // Dashboard Stats
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeEvents: 0,
        facultyMembers: 0,
        placements: 0,
        totalAchievements: 0, // NEW STAT
    });

    // Loading states for various operations
    const [isGlobalLoading, setIsGlobalLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false); // For editing/reordering metadata

    // Student Management States (Supabase)
    const [editingStudent, setEditingStudent] = useState<PendingStudent | null>(null);
    const [viewingStudent, setViewingStudent] = useState<PendingStudent | null>(null);
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
    const [newProfilePhotoFile, setNewProfilePhotoFile] = useState<File | null>(null);
    const [isPhotoLoading, setIsPhotoLoading] = useState(false);

    // Bulk Promote Students States (Supabase)
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [yearToPromote, setYearToPromote] = useState<string>('');

    // Results Upload State (Supabase backed for now, assuming PDF direct upload)
    const [resultTitle, setResultTitle] = useState('');
    const [resultFile, setResultFile] = useState<File | null>(null);

    // Notifications State (Supabase backed)
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    // Certificate Search State (Supabase backed)
    const [certificateSearchHTNO, setCertificateSearchHTNO] = useState('');
    const [adminCertificates, setAdminCertificates] = useState<CertificateItem[]>([]);

    // DND-Kit Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- Generic GitHub Data Persistence Function ---
    // IMPORTANT: This function will only simulate success or fail, as your `github-utils.ts`
    // doesn't export the `updateGithubContentFile` or `deleteFileFromGithub` directly.
    // You MUST implement corresponding `update` and `delete` functions in `github-utils.ts`
    // for actual GitHub persistence.
    const persistGitHubData = useCallback(async <T extends { id: string }>(
        dataArray: T[],
        filePath: string,
        variableName: string,
        commitMessage: string
    ) => {
        setIsUpdating(true);
        try {
            // For now, this is a NO-OP for actual GitHub file operations.
            // You need to implement 'updateFileContentInGithub' (to update filePath)
            // and potentially 'deleteFileFromGithub' in your github-utils.ts.
            console.warn(`WARNING: persistGitHubData is currently a NO-OP for actual GitHub file content updates/deletions for '${variableName}'.
                You need to implement 'updateFileContentInGithub' and 'fetchFileContentFromGithub' in your github-utils.ts.`);
            toast({ title: 'Persistence Not Implemented', description: 'GitHub file operations are not yet enabled. Changes are not saved.', variant: 'destructive' });
            return false; // Indicate failure to revert optimistic UI updates
        } catch (error: any) {
            console.error(`Error simulating persistence of ${variableName} data to GitHub:`, error);
            toast({ title: 'Persistence Error', description: `Failed to save changes: ${error.message}`, variant: 'destructive' });
            return false;
        } finally {
            setIsUpdating(false);
        }
    }, [toast]);

    // --- Data Loading Functions ---
    // IMPORTANT: `fetchAndParseTsFile` is also NOT exported from your `github-utils.ts`.
    // These functions currently rely on this missing utility to fetch data.
    // They will need to be updated to use a functional `fetch` utility from `github-utils.ts`
    // or their data loading mechanism needs to change.
    // For now, I'm adding `console.error` and returning empty arrays/default stats.

    const loadAllStudents = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            let query = supabase.from('user_profiles').select('*').eq('role', 'student');
            if (selectedYearFilter !== 'all') {
                query = query.eq('year', parseInt(selectedYearFilter));
            }
            const { data, error } = await query.order('student_name', { ascending: true });
            if (error) throw error;

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
        } finally {
            setIsGlobalLoading(false);
        }
    }, [selectedYearFilter, toast]);


    const loadEvents = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            console.error("CRITICAL: GitHub integration incomplete: fetchAndParseTsFile is missing. Cannot load events data from GitHub.");
            // const data = await fetchAndParseTsFile('public/events/events.ts', 'events'); // Placeholder if you implement real GitHub fetch
            const data: Event[] = []; // Default to empty array to prevent crash
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
            // const data = await fetchAndParseTsFile('public/faculty/faculty.ts', 'faculty'); // Placeholder if you implement real GitHub fetch
            const data: Faculty[] = []; // Default to empty array
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
            // const data = await fetchAndParseTsFile('public/placements/placements.ts', 'placements'); // Placeholder if you implement real GitHub fetch
            const data: Placement[] = []; // Default to empty array
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
            // const data = await fetchAndParseTsFile('public/gallery/gallery.ts', 'galleryItems'); // Placeholder if you implement real GitHub fetch
            const data: GalleryItem[] = []; // Default to empty array
            setGallery(data);
        } catch (error: any) {
            console.error('Error loading gallery:', error);
            toast({ title: 'Error loading gallery', description: error.message || 'Please implement GitHub fetch.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    // NEW: Load Achievements
    const loadAchievements = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            console.error("CRITICAL: GitHub integration incomplete: fetchAndParseTsFile is missing. Cannot load achievements data from GitHub.");
            // const data = await fetchAndParseTsFile('public/achievements/achievements.ts', 'achievements'); // Placeholder
            const data: Achievement[] = []; // Default to empty array
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
            const { data, error } = await supabase
                .from('certificates')
                .select(`*, user_profiles!inner(student_name, id, ht_no)`)
                .order('uploaded_at', { ascending: false });

            if (!error && data) {
                setCertifications(data);
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
    }, [toast]);

    // Fixed: loadStats now relies on already loaded state or fetches directly from Supabase for student count
    const loadStats = useCallback(async () => {
        try {
            const { count: studentsCount, error: studentsError } = await supabase.from('user_profiles').select('id', { count: 'exact' }).eq('role', 'student');
            if (studentsError) throw studentsError;

            // These counts will reflect the state from loadEvents/Faculty/Placements/Achievements
            // If those fail due to missing GitHub utilities, these will be 0.
            setStats({
                totalStudents: studentsCount || 0,
                activeEvents: events.length || 0,
                facultyMembers: faculty.length || 0,
                placements: placements.length || 0,
                totalAchievements: achievements.length || 0, // NEW STAT
            });

        } catch (error: any) {
            console.error('Error loading stats:', error);
            toast({ title: 'Error loading dashboard stats', description: error.message || 'Please try again later.', variant: 'destructive' });
        }
    }, [toast, events.length, faculty.length, placements.length, achievements.length]); // Dependencies adjusted

    useEffect(() => {
        if (!loading && userProfile?.role === 'admin') {
            loadAllStudents();
            loadEvents(); // These will now log errors if fetchAndParseTsFile is truly missing
            loadFaculty();
            loadPlacements();
            loadGallery();
            loadAchievements(); // NEW: Load achievements
            loadCertifications();
            loadStats(); // Call after other loads, as it depends on their state

            // Supabase Subscriptions (for students & certificates)
            const studentsChannel = supabase
                .channel('students-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
                    loadAllStudents();
                    loadStats();
                })
                .subscribe();

            const certificatesChannel = supabase
                .channel('certificates-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'certificates' }, loadCertifications)
                .subscribe();

            return () => {
                supabase.removeChannel(studentsChannel);
                supabase.removeChannel(certificatesChannel);
            };
        } else if (!loading && userProfile && userProfile.role !== 'admin') {
            setLocation('/');
        }
    }, [userProfile, loading, setLocation, loadAllStudents, loadEvents, loadFaculty, loadPlacements, loadGallery, loadAchievements, loadCertifications, loadStats]);

    // Show loading while checking authentication
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

    // --- Student Management Functions (Supabase) ---
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

        const fileExtension = newProfilePhotoFile.name.split('.').pop();
        const fileName = `${viewingStudent.id}-${Date.now()}.${fileExtension}`;
        const filePath = `avatars/${fileName}`;

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
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setViewingStudent(prev => prev ? { ...prev, photo_url: publicUrlData.publicUrl || filePath } : null);

        } catch (error: any) {
            console.error('Error uploading profile photo:', error);
            toast({ title: 'Error uploading photo', description: error.message || 'Please try again.', variant: 'destructive' });
        } finally {
            setIsPhotoLoading(false);
        }
    };

    const handleViewStudentDetails = async (student: PendingStudent) => {
        setIsPhotoLoading(true);
        let studentToView = { ...student };
        if (student.photo_url && !student.photo_url.startsWith('http')) {
            const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(student.photo_url);
            studentToView.photo_url = publicUrlData.publicUrl || student.photo_url;
        }
        setViewingStudent(studentToView);
        setIsPhotoLoading(false);
    };

    // --- GitHub Backed Content Management Functions (for display & DND) ---

    // Generic DND Handler for GitHub-backed lists
    const handleDragEnd = async <T extends { id: string }>(
        event: DragEndEvent,
        dataArray: T[],
        setDataArray: React.Dispatch<React.SetStateAction<T[]>>,
        filePath: string, // e.g., 'public/events/events.ts'
        variableName: string // e.g., 'events'
    ) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = dataArray.findIndex(item => item.id === active.id);
            const newIndex = dataArray.findIndex(item => item.id === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrderedArray = arrayMove(dataArray, oldIndex, newIndex);
                setDataArray(newOrderedArray); // Optimistic UI update

                // This call will currently be a NO-OP due to missing GitHub update utility
                const success = await persistGitHubData(newOrderedArray, filePath, variableName, `Reordered ${variableName}`);
                if (!success) {
                    setDataArray(dataArray); // Revert if API call fails
                    toast({ title: 'Reorder Failed', description: 'Changes could not be saved to GitHub. Please implement persistGitHubData fully.', variant: 'destructive' });
                } else {
                    toast({ title: 'Reordered successfully', description: `Items in ${variableName} have been reordered (simulated).` });
                }
            }
        }
    };


    // --- Events CRUD (These will be passed to EventsUploadForm) ---
    const handleDeleteEvent = async (eventToDelete: Event) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the event "${eventToDelete.title}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            if (eventToDelete.image) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete event image from GitHub.");
                // await deleteFileFromGithub(pathInRepo, `Delete event image: ${eventToDelete.title}`); // Implement in github-utils.ts
            }

            const updatedEvents = events.filter(event => event.id !== eventToDelete.id);
            setEvents(updatedEvents); // Optimistic UI update

            const success = await persistGitHubData(updatedEvents, 'public/events/events.ts', 'events', `Delete event: ${eventToDelete.title}`);
            if (!success) {
                setEvents(events); // Revert if API call fails
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


    // --- Faculty CRUD (These will be passed to FacultyUploadForm) ---
    const handleDeleteFaculty = async (facultyToDelete: Faculty) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete faculty member "${facultyToDelete.name}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            if (facultyToDelete.image) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete faculty image from GitHub.");
                // await deleteFileFromGithub(pathInRepo, `Delete faculty image: ${facultyToDelete.name}`); // Implement in github-utils.ts
            }

            const updatedFaculty = faculty.filter(member => member.id !== facultyToDelete.id);
            setFaculty(updatedFaculty);

            const success = await persistGitHubData(updatedFaculty, 'public/faculty/faculty.ts', 'faculty', `Delete faculty: ${facultyToDelete.name}`);
            if (!success) {
                setFaculty(faculty); // Revert if API call fails
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


    // --- Gallery CRUD (These will be passed to GalleryUploadForm) ---
    const handleDeleteGalleryItem = async (itemToDelete: GalleryItem) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the gallery item "${itemToDelete.title}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            if (itemToDelete.image) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete gallery image from GitHub.");
                // await deleteFileFromGithub(pathInRepo, `Delete gallery image: ${itemToDelete.title}`); // Implement in github-utils.ts
            }

            const updatedGallery = gallery.filter(item => item.id !== itemToDelete.id);
            setGallery(updatedGallery);

            const success = await persistGitHubData(updatedGallery, 'public/gallery/gallery.ts', 'galleryItems', `Delete gallery item: ${itemToDelete.title}`);
            if (!success) {
                setGallery(gallery); // Revert if API call fails
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


    // --- Placements CRUD (These will be passed to PlacementsUploadForm) ---
    const handleDeletePlacement = async (itemToDelete: Placement) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the placement record for "${itemToDelete.student_name}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            if (itemToDelete.image) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete placement image from GitHub.");
                // await deleteFileFromGithub(pathInRepo, `Delete placement image: ${itemToDelete.student_name}`); // Implement in github-utils.ts
            }

            const updatedPlacements = placements.filter(item => item.id !== itemToDelete.id);
            setPlacements(updatedPlacements);

            const success = await persistGitHubData(updatedPlacements, 'public/placements/placements.ts', 'placements', `Delete placement: ${itemToDelete.student_name}`);
            if (!success) {
                setPlacements(placements); // Revert if API call fails
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

    // NEW: Achievements CRUD
    const handleDeleteAchievement = async (itemToDelete: Achievement) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the achievement "${itemToDelete.title}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            if (itemToDelete.certificate_url) {
                console.error("CRITICAL: GitHub integration incomplete: deleteFileFromGithub is missing. Cannot delete achievement certificate from GitHub.");
                // await deleteFileFromGithub(pathInRepo, `Delete achievement certificate: ${itemToDelete.title}`); // Implement in github-utils.ts
            }

            const updatedAchievements = achievements.filter(item => item.id !== itemToDelete.id);
            setAchievements(updatedAchievements); // Optimistic UI update

            const success = await persistGitHubData(updatedAchievements, 'public/achievements/achievements.ts', 'achievements', `Delete achievement: ${itemToDelete.title}`);
            if (!success) {
                setAchievements(achievements); // Revert if API call fails
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


    // --- Certificates (Supabase) ---
    const fetchStudentCertificates = async () => {
        if (!certificateSearchHTNO) {
            toast({ title: 'Enter HT No. to search' });
            setAdminCertificates([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('certificates')
                .select(`*, user_profiles!inner(student_name, ht_no)`)
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

    const deleteCertification = async (certId: string, certificateUrl: string) => {
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


    // --- Other Management Functions (Supabase-backed where applicable) ---

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

    // Recommendation: Use constants for tab keys
    const TAB_VALUES = {
        STUDENTS: 'students',
        CERTIFICATIONS: 'certifications',
        EVENTS: 'events',
        FACULTY: 'faculty',
        PLACEMENTS: 'placements',
        ACHIEVEMENTS: 'achievements', // NEW TAB VALUE
        ATTENDANCE: 'attendance',
        RESULTS: 'results',
        TIMETABLE: 'timetable',
        GALLERY: 'gallery',
    };

    // New component for Achievements Upload Form (embedded here for full file, but should be its own file)
    // You should extract this into `src/components/AchievementsUploadForm.tsx`
    const AchievementsUploadForm = ({ onUploadSuccess, achievements, setAchievements, isUploading, setIsUploading, isUpdating, setIsUpdating, persistGitHubData, isEdit = false, initialData = null }: {
        onUploadSuccess: () => void;
        achievements: Achievement[];
        setAchievements: React.Dispatch<React.SetStateAction<Achievement[]>>;
        isUploading: boolean;
        setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
        isUpdating: boolean;
        setIsUpdating: React.Dispatch<React.SetStateAction<boolean>>;
        persistGitHubData: (dataArray: Achievement[], filePath: string, variableName: string, commitMessage: string) => Promise<boolean>;
        isEdit?: boolean;
        initialData?: Achievement | null;
    }) => {
        const [title, setTitle] = useState(initialData?.title || '');
        const [description, setDescription] = useState(initialData?.description || '');
        const [date, setDate] = useState(initialData?.date || '');
        const [certificateFile, setCertificateFile] = useState<File | null>(null);
        const [dialogOpen, setDialogOpen] = useState(false);

        useEffect(() => {
            if (isEdit && initialData) {
                setTitle(initialData.title);
                setDescription(initialData.description || '');
                setDate(initialData.date || '');
                // Do not set certificateFile from initialData.certificate_url here
                // as it's a URL, not a File object. User will re-upload if needed.
            }
        }, [isEdit, initialData]);

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files[0]) {
                setCertificateFile(e.target.files[0]);
            }
        };

        const handleSubmit = async () => {
            if (!title) {
                toast({ title: 'Title is required', variant: 'destructive' });
                return;
            }

            setIsUploading(true);
            try {
                let fileUrl = initialData?.certificate_url; // Keep existing URL if not uploading new file
                if (certificateFile) {
                    const fileExtension = certificateFile.name.split('.').pop();
                    const fileName = `achievement-${Date.now()}.${fileExtension}`;
                    const pathInRepo = `public/achievements/${fileName}`; // Changed to public/achievements

                    const uploadSuccess = await uploadToGitHubRepo(certificateFile, pathInRepo, `Upload achievement certificate for ${title}`);
                    if (!uploadSuccess) {
                        throw new Error("Failed to upload certificate to GitHub.");
                    }
                    // This public URL part might need adjustment based on how uploadToGitHubRepo returns the URL
                    // For now, assuming raw.githubusercontent.com path. Replace with actual logic.
                    fileUrl = `https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/main/${pathInRepo}`; // *** IMPORTANT: REPLACE WITH YOUR ACTUAL GITHUB USERNAME AND REPO NAME ***
                }


                const newAchievement: Achievement = {
                    id: isEdit && initialData ? initialData.id : crypto.randomUUID(),
                    title,
                    description: description || undefined,
                    date: date || undefined,
                    certificate_url: fileUrl || undefined,
                };

                let updatedAchievements;
                if (isEdit && initialData) {
                    updatedAchievements = achievements.map(item =>
                        item.id === initialData.id ? newAchievement : item
                    );
                } else {
                    updatedAchievements = [...achievements, newAchievement];
                }

                setAchievements(updatedAchievements); // Optimistic update
                // IMPORTANT: The path for metadata should be `src/data/achievements.json`
                // Ensure your API handles writing to `src/data` for JSON files.
                const success = await persistGitHubData(updatedAchievements, 'src/data/achievements.json', 'achievements', `Add/Update Achievement: ${title}`);
                if (!success) {
                    setAchievements(achievements); // Revert
                    toast({ title: 'Error', description: 'Failed to save achievement metadata to GitHub.', variant: 'destructive' });
                    return;
                }

                toast({ title: `Achievement ${isEdit ? 'updated' : 'uploaded'} successfully` });
                setDialogOpen(false);
                setTitle('');
                setDescription('');
                setDate('');
                setCertificateFile(null);
                onUploadSuccess(); // Refresh parent data (e.g., loadAchievements, loadStats)
            } catch (error: any) {
                console.error("Error uploading achievement:", error);
                toast({ title: "Upload failed", description: error.message || "An unexpected error occurred.", variant: "destructive" });
            } finally {
                setIsUploading(false);
            }
        };

        return (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto h-8 flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>{isEdit ? 'Edit' : 'Add New Achievement'}</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{isEdit ? 'Edit Achievement' : 'Upload New Achievement'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="achievement-title" className="text-right">
                                Title
                            </Label>
                            <Input
                                id="achievement-title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="col-span-3"
                                placeholder="e.g., Best Project Award"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="achievement-description" className="text-right">
                                Description
                            </Label>
                            <Textarea
                                id="achievement-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="col-span-3"
                                placeholder="Brief description of the achievement"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="achievement-date" className="text-right">
                                Date (Optional)
                            </Label>
                            <Input
                                id="achievement-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="achievement-file" className="text-right">
                                Certificate (PDF/Image)
                            </Label>
                            <Input
                                id="achievement-file"
                                type="file"
                                accept=".pdf,image/*"
                                onChange={handleFileChange}
                                className="col-span-3"
                            />
                        </div>
                        {initialData?.certificate_url && !certificateFile && (
                            <div className="col-span-4 text-center text-sm text-gray-500">
                                Existing file: <a href={initialData.certificate_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Current</a>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSubmit} disabled={isUploading || isUpdating}>
                            {isUploading || isUpdating ? (isEdit ? 'Updating...' : 'Uploading...') : (isEdit ? 'Save Changes' : 'Upload Achievement')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"> {/* Adjusted grid-cols to 5 for new stat card */}
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

                    {/* NEW: Achievements Stat Card */}
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

                    {/* Certifications Tab Content (Supabase Backed) */}
                    <TabsContent value={TAB_VALUES.CERTIFICATIONS}>
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
                                            </div>
                                        )
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Events Tab Content (GitHub Backed) */}
                    <TabsContent value={TAB_VALUES.EVENTS}>
                        <div className="w-full px-6 py-6">
                            <div className="flex flex-col md:flex-row gap-6 items-start w-full">
                                {/* Left Section - Heading + Uploaded List Count */}
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

                                {/* Right Section - Upload Form */}
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
                                {/* Left Section - Heading + Uploaded List Count */}
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

                                {/* Right Section - Upload Form */}
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
                                {/* Left Section - Heading + Uploaded List Count */}
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

                                {/* Right Section - Upload Form */}
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
                                {/* Left Section - Heading + Uploaded List Count */}
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

                                {/* Right Section - Upload Form */}
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
                                <Input id="attendance-file" type="file" accept=".csv, .xlsx" onChange={handleAttendanceUpload} />
                                <Button className="flex items-center space-x-1" disabled={isUploading}>
                                    <Upload className="w-4 h-4" />
                                    <span>Process Attendance (Placeholder)</span>
                                </Button>
                                <p className="text-sm text-gray-500">
                                    Upload a spreadsheet containing student attendance data.
                                    This will be reflected in student profiles. (Further implementation needed for processing file content)
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

                                <Button onClick={uploadResult} className="flex items-center space-x-1" disabled={isUploading || !resultFile || !resultTitle}>
                                    {isUploading ? 'Uploading...' : 'Upload Result'}
                                    <Upload className="w-4 h-4" />
                                </Button>
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
                                {/* Added Suspense for TimetableManager */}
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
                                {/* Left Section - Heading + Uploaded List Count */}
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

                                {/* Right Section - Upload Form */}
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
