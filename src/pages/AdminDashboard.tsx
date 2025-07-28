import React, { useState, useEffect, useCallback, Suspense, createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SearchBar from '@/components/SearchBar';
import { Users, Calendar, GraduationCap, TrendingUp, LogOut, BookOpen, Trophy, Image, BarChart3, Plus, Trash2, Upload, Clock, FileText, Search, MoreVertical, User, X, Sun, Moon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch'; // For the theme toggle
import { useLocation } from 'wouter'; // This line is correct, the issue might be with the import statement itself

import { useToast } from '@/hooks/use-toast';
import { supabaseOld } from '@/integrations/supabase/supabaseOld'; // 👈 OLD DB: students, certificates, profiles
import { supabaseNew } from '@/integrations/supabase/supabaseNew'; // 👈 NEW DB: faculty, gallery, events, etc.
import TimetableManager from '@/components/TimetableManager'; // Assuming this component will be updated or passed supabase instance

import { uploadFile, deleteFile, fetchAllEntries, addEntry, updateEntry, deleteEntry } from '@/lib/SupabaseDataManager'; // Make sure these are robust

// Theme Context
type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('theme') as Theme;
            if (savedTheme) return savedTheme;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            root.classList.add(theme);
            localStorage.setItem('theme', theme);
        }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

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
    certificate_url?: string; // This could be for a certificate associated with the achievement
    file_path?: string; // path to the certificate file
}

interface AttendanceRecord {
    id: string;
    file_name: string;
    file_url: string;
    file_path: string;
    uploaded_at: string;
    processed_status: string; // e.g., 'pending', 'processing', 'completed', 'error'
    notes?: string;
}

const AdminDashboard = () => {
    const { toast } = useToast();
    const { user, userProfile, loading } = useAuth();
    const [, setLocation] = useLocation();
    const { theme, toggleTheme } = useTheme(); // Use theme context

    const [allStudents, setAllStudents] = useState<PendingStudent[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [faculty, setFaculty] = useState<Faculty[]>([]);
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [certifications, setCertifications] = useState<CertificateItem[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);


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
    const [isPhotoLoading, setIsPhotoLoading] = useState(false);

    // Student Management States
    const [editingStudent, setEditingStudent] = useState<PendingStudent | null>(null);
    const [viewingStudent, setViewingStudent] = useState<PendingStudent | null>(null);
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
    const [studentSearchTerm, setStudentSearchTerm] = useState<string>('');
    const [filteredStudents, setFilteredStudents] = useState<PendingStudent[]>([]);
    const [newProfilePhotoFile, setNewProfilePhotoFile] = useState<File | null>(null);
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [yearToPromote, setYearToPromote] = useState<string>('');

    // Certificate Management States
    const [certificateSearchHTNO, setCertificateSearchHTNO] = useState('');
    const [filteredCertificates, setFilteredCertificates] = useState<CertificateItem[]>([]);
    const [selectedYearFilterCerts, setSelectedYearFilterCerts] = useState<string>('all');

    // Results Upload States
    const [resultTitle, setResultTitle] = useState('');
    const [resultFile, setResultFile] = useState<File | null>(null);

    // Notification States
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    // New Content Upload Form States (for Events, Faculty, Gallery, Placements, Achievements)
    const [newEvent, setNewEvent] = useState<Omit<Event, 'id' | 'image_url' | 'image_path'>>({ title: '', description: '', date: '', time: '', venue: '', speaker: '' });
    const [newEventImage, setNewEventImage] = useState<File | null>(null);
    const [newFaculty, setNewFaculty] = useState<Omit<Faculty, 'id' | 'image_url' | 'image_path'>>({ name: '', designation: '', department: '', bio: '', expertise: '', publications: '' });
    const [newFacultyImage, setNewFacultyImage] = useState<File | null>(null);
    const [newGalleryItem, setNewGalleryItem] = useState<Omit<GalleryItem, 'id' | 'image_url' | 'image_path'>>({ title: '', description: '' });
    const [newGalleryImage, setNewGalleryImage] = useState<File | null>(null);
    const [newPlacement, setNewPlacement] = useState<Omit<Placement, 'id' | 'image_url' | 'image_path'>>({ student_name: '', company: '', year: 0, type: '', branch: '', ctc: 0 });
    const [newPlacementImage, setNewPlacementImage] = useState<File | null>(null);
    const [newAchievement, setNewAchievement] = useState<Omit<Achievement, 'id' | 'certificate_url' | 'file_path'>>({ title: '', description: '', date: '' });
    const [newAchievementFile, setNewAchievementFile] = useState<File | null>(null);

    // Attendance Upload States
    const [attendanceFile, setAttendanceFile] = useState<File | null>(null);


    const [activeTab, setActiveTab] = useState('students');

    // --- Data Loading Callbacks ---
    const loadAllStudents = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            let query = supabaseOld.from('user_profiles').select('*').eq('role', 'student');
            const { data, error } = await query.order('student_name', { ascending: true });
            if (error) throw error;

            const studentsWithPhotos = await Promise.all(data.map(async (student: PendingStudent) => {
                const photoPath = `profiles/${student.id}/photo.jpg`;
                const { data: publicUrlData } = supabaseOld.storage.from("profile_photos").getPublicUrl(photoPath);
                return { ...student, photo_url: publicUrlData?.publicUrl || '/default-avatar.png' };
            }));
            setAllStudents(studentsWithPhotos);
        } catch (error: any) {
            console.error('Error loading students:', error);
            toast({ title: 'Error loading students', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadEvents = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            const data = await fetchAllEntries<Event>('events', supabaseNew);
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
            const data = await fetchAllEntries<Faculty>('faculty', supabaseNew);
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
            const data = await fetchAllEntries<Placement>('placements', supabaseNew);
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
            const data = await fetchAllEntries<GalleryItem>('gallery', supabaseNew);
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
            const data = await fetchAllEntries<Achievement>('achievements', supabaseNew);
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
        try {
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

    const loadAttendanceRecords = useCallback(async () => {
        setIsGlobalLoading(true);
        try {
            // Assuming a new 'attendance_records' table in supabaseOld
            const data = await fetchAllEntries<AttendanceRecord>('attendance_records', supabaseOld);
            setAttendanceRecords(data || []);
        } catch (error: any) {
            console.error('Error loading attendance records:', error);
            toast({ title: 'Error loading attendance records', description: error.message || 'Please check Supabase "attendance_records" table.', variant: 'destructive' });
        } finally {
            setIsGlobalLoading(false);
        }
    }, [toast]);

    const loadStats = useCallback(async () => {
        try {
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

    // --- Main Data Loading and Realtime Subscriptions ---
    useEffect(() => {
        if (!loading && userProfile?.role === 'admin') {
            loadAllStudents();
            loadEvents();
            loadFaculty();
            loadPlacements();
            loadGallery();
            loadAchievements();
            loadCertifications();
            loadAttendanceRecords(); // Load attendance records
            loadStats();

            const studentsChannel = supabaseOld
                .channel('students-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'user_profiles' }, () => {
                    loadAllStudents();
                    loadStats();
                })
                .subscribe();

            const certificatesChannel = supabaseOld
                .channel('certificates-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'student_certificates' }, () => {
                    loadCertifications();
                })
                .subscribe();

            const attendanceChannel = supabaseOld
                .channel('attendance-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
                    loadAttendanceRecords();
                })
                .subscribe();

            const eventsChannel = supabaseNew.channel('events-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
                    loadEvents();
                    loadStats();
                }).subscribe();

            const facultyChannel = supabaseNew.channel('faculty-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'faculty' }, () => {
                    loadFaculty();
                    loadStats();
                }).subscribe();

            const placementsChannel = supabaseNew.channel('placements-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'placements' }, () => {
                    loadPlacements();
                    loadStats();
                }).subscribe();

            const galleryChannel = supabaseNew.channel('gallery-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery' }, () => {
                    loadGallery();
                }).subscribe();

            const achievementsChannel = supabaseNew.channel('achievements-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'achievements' }, () => {
                    loadAchievements();
                    loadStats();
                }).subscribe();

            return () => {
                supabaseOld.removeChannel(studentsChannel);
                supabaseOld.removeChannel(certificatesChannel);
                supabaseOld.removeChannel(attendanceChannel);
                supabaseNew.removeChannel(eventsChannel);
                supabaseNew.removeChannel(facultyChannel);
                supabaseNew.removeChannel(placementsChannel);
                supabaseNew.removeChannel(galleryChannel);
                supabaseNew.removeChannel(achievementsChannel);
            };
        } else if (!loading && userProfile && userProfile.role !== 'admin') {
            setLocation('/');
        }
    }, [userProfile, loading, setLocation, loadAllStudents, loadEvents, loadFaculty, loadPlacements, loadGallery, loadAchievements, loadCertifications, loadAttendanceRecords, loadStats]);

    // Student and Certificate client-side filtering effects
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (userProfile.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-900">
                <Card className="w-full max-w-md dark:bg-gray-800 dark:text-gray-100">
                    <CardContent className="p-6 text-center">
                        <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            You don't have admin privileges to access this page.
                        </p>
                        <Button onClick={() => setLocation('/')} variant="outline" className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">
                            Go Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // --- Student Actions ---
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
        setIsUpdating(true);
        try {
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
        } finally {
            setIsUpdating(false);
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

        setIsUpdating(true);
        try {
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

        const folderPath = `profiles/${viewingStudent.id}/${newProfilePhotoFile.name}`; // Use actual file name for unique path
        const { publicUrl, filePath, error: uploadError } = await uploadFile('profile_photos', newProfilePhotoFile, folderPath, supabaseOld);

        if (uploadError || !publicUrl) {
            console.error('Error uploading profile photo:', uploadError);
            toast({ title: 'Error uploading photo', description: uploadError?.message || 'Please try again.', variant: 'destructive' });
            setIsPhotoLoading(false);
            return;
        }

        try {
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

    // --- Content Management (Events, Faculty, Gallery, Placements, Achievements) ---

    // Generic form submission handler for new entries
    const handleAddEntry = async <T extends { title?: string; name?: string; student_name?: string }, F extends { id: string }>(
        tableName: string,
        newData: T,
        file: File | null,
        bucketName: string | null,
        supabaseInstance: any,
        onSuccess: () => void,
        setNewData: React.Dispatch<React.SetStateAction<T | Omit<T, 'id' | 'image_url' | 'image_path' | 'certificate_url' | 'file_path'>>>
    ) => {
        setIsUploading(true);
        let publicUrl = '';
        let filePath = '';

        try {
            if (file && bucketName) {
                const uploadFolderPath = `${tableName}/${file.name}`; // Dynamic path
                const uploadResult = await uploadFile(bucketName, file, uploadFolderPath, supabaseInstance);
                if (uploadResult.error || !uploadResult.publicUrl) {
                    throw new Error(uploadResult.error?.message || 'File upload failed');
                }
                publicUrl = uploadResult.publicUrl;
                filePath = uploadResult.filePath!;
            }

            const dataToInsert = {
                ...newData,
                ...(bucketName && {
                    [bucketName === 'certifications' || bucketName === 'achievements' ? 'file_url' : 'image_url']: publicUrl,
                    file_path: filePath, // Generalize file_path for all uploads
                }),
                created_at: new Date().toISOString(), // Add timestamp
            };
            if (dataToInsert.ctc !== undefined && dataToInsert.ctc === 0) {
                delete dataToInsert.ctc; // Don't insert if 0 and optional
            }
            if (dataToInsert.year !== undefined && dataToInsert.year === 0) {
                delete dataToInsert.year; // Don't insert if 0 and optional
            }


            const addResult = await addEntry(tableName, dataToInsert, supabaseInstance);
            if (!addResult) {
                throw new Error('Failed to add entry to database.');
            }
            toast({ title: '✅ Item added successfully' });
            setNewData({} as any); // Clear form
            if (file) {
                if (tableName === 'events') setNewEventImage(null);
                if (tableName === 'faculty') setNewFacultyImage(null);
                if (tableName === 'gallery') setNewGalleryImage(null);
                if (tableName === 'placements') setNewPlacementImage(null);
                if (tableName === 'achievements') setNewAchievementFile(null);
            }
            onSuccess();
        } catch (error: any) {
            console.error(`Error adding ${tableName} entry:`, error);
            toast({ title: `Error adding ${tableName}`, description: error.message || 'Please try again.', variant: 'destructive' });
            if (filePath && bucketName) {
                await deleteFile(bucketName, filePath, supabaseInstance); // Clean up uploaded file if DB insert fails
            }
        } finally {
            setIsUploading(false);
        }
    };

    // --- Deletion Handlers (from previous code) ---
    const handleDeleteEvent = async (eventToDelete: Event) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the event "${eventToDelete.title}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            if (eventToDelete.image_path) {
                const { error: storageError } = await deleteFile('events', eventToDelete.image_path, supabaseNew);
                if (storageError) {
                    console.warn(`Failed to delete event image ${eventToDelete.image_path}:`, storageError.message);
                    toast({ title: 'Image Deletion Warning', description: `Could not delete event image from storage: ${storageError.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('events', eventToDelete.id, supabaseNew);
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
            if (facultyToDelete.image_path) {
                const { error: storageError } = await deleteFile('faculty', facultyToDelete.image_path, supabaseNew);
                if (storageError) {
                    console.warn(`Failed to delete faculty image ${facultyToDelete.image_path}:`, storageError.message);
                    toast({ title: 'Image Deletion Warning', description: `Could not delete faculty image from storage: ${storageError.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('faculty', facultyToDelete.id, supabaseNew);
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
            if (itemToDelete.image_path) {
                const { error: storageError } = await deleteFile('gallery', itemToDelete.image_path, supabaseNew);
                if (storageError) {
                    console.warn(`Failed to delete gallery image ${itemToDelete.image_path}:`, storageError.message);
                    toast({ title: 'Image Deletion Warning', description: `Could not delete gallery image from storage: ${storageError.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('gallery', itemToDelete.id, supabaseNew);
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
            if (itemToDelete.image_path) {
                const { error: storageError } = await deleteFile('placements', itemToDelete.image_path, supabaseNew);
                if (storageError) {
                    console.warn(`Failed to delete placement image ${itemToDelete.image_path}:`, storageError.message);
                    toast({ title: 'Image Deletion Warning', description: `Could not delete placement image from storage: ${storageError.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('placements', itemToDelete.id, supabaseNew);
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
            if (itemToDelete.file_path) {
                const { error: storageError } = await deleteFile('achievements', itemToDelete.file_path, supabaseNew);
                if (storageError) {
                    console.warn(`Failed to delete achievement file ${itemToDelete.file_path}:`, storageError.message);
                    toast({ title: 'File Deletion Warning', description: `Could not delete achievement file from storage: ${storageError.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('achievements', itemToDelete.id, supabaseNew);
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

    const deleteCertification = async (certId: string, certificateFilePath: string) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this certificate? This action cannot be undone.");
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
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

    const handleSearchCertificates = () => {
        // The filtering logic is already handled by the useEffect for dynamic filtering.
        // This function can remain to trigger a re-evaluation or for future complex search logic.
        toast({ title: 'Filters applied.' });
    };

    const uploadResult = async () => {
        if (!resultFile || !resultTitle) {
            toast({ title: 'Error', description: 'Please provide a title and choose a file', variant: 'destructive' });
            return;
        }
        setIsUploading(true);

        const folderPath = `public_results/${resultFile.name}`;
        const { publicUrl, filePath, error: uploadError } = await uploadFile('results', resultFile, folderPath, supabaseNew);

        if (uploadError || !publicUrl) {
            console.error('Error uploading result file:', uploadError);
            toast({ title: 'Upload failed', description: uploadError?.message || 'Please try again later.', variant: 'destructive' });
            setIsUploading(false);
            return;
        }

        try {
            const { error: dbError } = await supabaseNew.from('results').insert([{ title: resultTitle, file_url: publicUrl, file_path: filePath }]);
            if (dbError) {
                await deleteFile('results', filePath!, supabaseNew);
                throw dbError;
            }
            toast({ title: '✅ Result uploaded successfully' });
            setResultTitle('');
            setResultFile(null);
            // Consider adding a loadResults function and calling it here if you display existing results
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
            const { error } = await supabaseNew.from('notifications').insert([{ title: notificationTitle, message: notificationMessage, created_at: new Date().toISOString() }]);
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
        setAttendanceFile(file || null);
        if (file) {
            toast({ title: "Attendance sheet selected", description: `File: ${file.name}. Click 'Process Attendance' to continue.` });
        }
    };

    const processAttendance = async () => {
        if (!attendanceFile) {
            toast({ title: "Error", description: "Please select an attendance file to upload.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        try {
            // Define the path for the attendance file in storage.
            // Using a timestamp to ensure unique file names and prevent overwrites.
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const folderPath = `attendance_sheets/${timestamp}_${attendanceFile.name}`;

            // Upload the file to Supabase Storage (using supabaseOld as requested)
            const { publicUrl, filePath, error: uploadError } = await uploadFile('attendance_sheets', attendanceFile, folderPath, supabaseOld);

            if (uploadError || !publicUrl) {
                console.error('Error uploading attendance file:', uploadError);
                toast({ title: 'Upload failed', description: uploadError?.message || 'Please try again later.', variant: 'destructive' });
                return;
            }

            // Store metadata in the 'attendance_records' table (in supabaseOld)
            const { error: dbError } = await supabaseOld.from('attendance_records').insert([
                {
                    file_name: attendanceFile.name,
                    file_url: publicUrl,
                    file_path: filePath,
                    uploaded_at: new Date().toISOString(),
                    processed_status: 'pending', // Initial status
                    notes: 'File uploaded, awaiting backend processing.'
                }
            ]);

            if (dbError) {
                // If DB insert fails, clean up the uploaded file from storage
                await deleteFile('attendance_sheets', filePath!, supabaseOld);
                throw dbError;
            }

            toast({
                title: "✅ Attendance sheet uploaded",
                description: `File "${attendanceFile.name}" uploaded. Backend processing initiated (placeholder).`,
            });
            setAttendanceFile(null); // Clear the file input
            loadAttendanceRecords(); // Refresh the list of attendance records

        } catch (error: any) {
            console.error('Error during attendance upload/processing:', error);
            toast({ title: 'Attendance Processing Failed', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAttendanceRecord = async (recordToDelete: AttendanceRecord) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete the attendance record for "${recordToDelete.file_name}"? This cannot be undone.`);
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            if (recordToDelete.file_path) {
                const { error: storageError } = await deleteFile('attendance_sheets', recordToDelete.file_path, supabaseOld);
                if (storageError) {
                    console.warn(`Failed to delete attendance file ${recordToDelete.file_path}:`, storageError.message);
                    toast({ title: 'File Deletion Warning', description: `Could not delete attendance file from storage: ${storageError.message}`, variant: 'warning' });
                }
            }
            const { success, error } = await deleteEntry('attendance_records', recordToDelete.id, supabaseOld);
            if (success) {
                toast({ title: 'Attendance record deleted successfully' });
                loadAttendanceRecords();
            } else {
                toast({ title: 'Error deleting attendance record', description: error?.message || 'Please try again.', variant: 'destructive' });
            }
        } catch (error: any) {
            console.error('Error deleting attendance record:', error);
            toast({ title: 'Deletion Failed', description: error.message || 'Please try again later.', variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
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
        <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            <header className="bg-white shadow-sm border-b dark:bg-gray-800 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Welcome back, {user?.email} (Admin).</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            {/* Theme Toggle */}
                            <div className="flex items-center space-x-2">
                                {theme === 'light' ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-indigo-400" />}
                                <Switch
                                    checked={theme === 'dark'}
                                    onCheckedChange={toggleTheme}
                                    aria-label="Toggle theme"
                                />
                            </div>
                            <Button
                                onClick={userProfile?.role === 'admin' ? () => supabaseOld.auth.signOut() : () => setLocation('/login')}
                                variant="outline"
                                className="flex items-center space-x-2 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>{userProfile?.role === 'admin' ? 'Logout' : 'Login'}</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-4 sm:mx-6 lg:mx-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <Card className="dark:bg-gray-800 dark:text-gray-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Students</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:text-gray-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Events</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.activeEvents}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:text-gray-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Faculty Members</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.facultyMembers}</p>
                                </div>
                                <GraduationCap className="w-8 h-8 text-purple-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:text-gray-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Placements</p>
                                    <p className="text-3xl font-bold text-orange-600">{stats.placements}</p>
                                </div>
                                <TrendingUp className="w-8 h-8 text-orange-600" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:text-gray-100">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Achievements</p>
                                    <p className="text-3xl font-bold text-yellow-600">{stats.totalAchievements}</p>
                                </div>
                                <Trophy className="w-8 h-8 text-yellow-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-11 gap-1 bg-gray-100 dark:bg-gray-700">
                        <TabsTrigger value={TAB_VALUES.STUDENTS} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Students</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.CERTIFICATIONS} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <BookOpen className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Certs</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.EVENTS} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <Calendar className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Events</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.FACULTY} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <GraduationCap className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Faculty</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.PLACEMENTS} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <TrendingUp className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Placements</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.ACHIEVEMENTS} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <Trophy className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Achievemnts</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.ATTENDANCE} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <Clock className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Attendance</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.RESULTS} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <FileText className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Results</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.TIMETABLE} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <BarChart3 className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Timetable</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.GALLERY} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <Image className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Gallery</span>
                        </TabsTrigger>
                        <TabsTrigger value={TAB_VALUES.NOTIFICATIONS} className="flex items-center space-x-1 text-xs lg:text-sm data-[state=active]:bg-blue-500 data-[state=active]:text-white dark:data-[state=active]:bg-blue-700">
                            <User className="w-3 h-3 lg:w-4 lg:h-4" />
                            <span>Notify</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Students Tab Content (SupabaseOld Backed) */}
                    <TabsContent value={TAB_VALUES.STUDENTS}>
                        <Card className="dark:bg-gray-800 dark:text-gray-100">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                    <Users className="w-5 h-5" />
                                    <span>Student Management ({filteredStudents.length} / {allStudents.length} Total)</span>
                                    <div className="ml-auto flex items-center space-x-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="dark:bg-gray-700 dark:border-gray-600">
                                                <DropdownMenuItem onClick={() => setIsPromoteModalOpen(true)} className="dark:text-gray-100 dark:hover:bg-gray-600">
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
                                        className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                    <Select value={selectedYearFilter} onValueChange={(value) => setSelectedYearFilter(value)}>
                                        <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                                            <SelectValue placeholder="Filter by Year" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                            <SelectItem value="all" className="dark:text-gray-100 dark:hover:bg-gray-600">All Years</SelectItem>
                                            <SelectItem value="1" className="dark:text-gray-100 dark:hover:bg-gray-600">1st Year</SelectItem>
                                            <SelectItem value="2" className="dark:text-gray-100 dark:hover:bg-gray-600">2nd Year</SelectItem>
                                            <SelectItem value="3" className="dark:text-gray-100 dark:hover:bg-gray-600">3rd Year</SelectItem>
                                            <SelectItem value="4" className="dark:text-gray-100 dark:hover:bg-gray-600">4th Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {filteredStudents.length > 0 ?
                                    (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                                                <thead>
                                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                                        <th className="border border-gray-200 px-3 py-2 text-left dark:border-gray-600 dark:text-gray-100">H.T No.</th>
                                                        <th className="border border-gray-200 px-3 py-2 text-left dark:border-gray-600 dark:text-gray-100">Student Name</th>
                                                        <th className="border border-gray-200 px-3 py-2 text-left dark:border-gray-600 dark:text-gray-100">Year</th>
                                                        <th className="border border-gray-200 px-3 py-2 text-left dark:border-gray-600 dark:text-gray-100">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filteredStudents.map((student) => (
                                                        <tr key={student.id} className="cursor-pointer hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                                                            <td className="border border-gray-200 px-3 py-2 dark:border-gray-600 dark:text-gray-200">{student.ht_no}</td>
                                                            <td className="border border-gray-200 px-3 py-2 flex items-center gap-2 dark:border-gray-600 dark:text-gray-200">
                                                                <img
                                                                    src={student.photo_url || "/default-avatar.png"}
                                                                    alt="Profile"
                                                                    className="w-6 h-6 rounded-full object-cover"
                                                                    onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
                                                                />
                                                                <span className="text-sm font-medium">{student.student_name}</span>
                                                            </td>
                                                            <td className="border border-gray-200 px-3 py-2 dark:border-gray-600 dark:text-gray-200">{student.year}</td>
                                                            <td className="border border-gray-200 px-3 py-2 dark:border-gray-600">
                                                                <Button size="sm" variant="outline" onClick={() => handleViewStudentDetails(student)} className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">
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
                                            <p className="text-gray-500 text-lg dark:text-gray-400">No students found</p>
                                            {(studentSearchTerm || selectedYearFilter !== 'all') && <p className="text-gray-500 text-sm dark:text-gray-400">(Try clearing the filters)</p>}
                                        </div>
                                    )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Certifications Tab Content (SupabaseOld Backed) */}
                    <TabsContent value={TAB_VALUES.CERTIFICATIONS}>
                        <Card className="dark:bg-gray-800 dark:text-gray-100">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
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
                                        className="max-w-xs dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                    <Select value={selectedYearFilterCerts} onValueChange={(value) => {
                                        setSelectedYearFilterCerts(value);
                                    }}>
                                        <SelectTrigger className="w-[180px] dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                                            <SelectValue placeholder="Filter by Year" />
                                        </SelectTrigger>
                                        <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                            <SelectItem value="all" className="dark:text-gray-100 dark:hover:bg-gray-600">All Years</SelectItem>
                                            <SelectItem value="1" className="dark:text-gray-100 dark:hover:bg-gray-600">1st Year</SelectItem>
                                            <SelectItem value="2" className="dark:text-gray-100 dark:hover:bg-gray-600">2nd Year</SelectItem>
                                            <SelectItem value="3" className="dark:text-gray-100 dark:hover:bg-gray-600">3rd Year</SelectItem>
                                            <SelectItem value="4" className="dark:text-gray-100 dark:hover:bg-gray-600">4th Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleSearchCertificates} className="dark:bg-blue-600 dark:hover:bg-blue-700">
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
                                        className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                                    >
                                        <X className="w-4 h-4 mr-2" /> Clear Filters
                                    </Button>
                                </div>

                                {filteredCertificates.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-700">
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Student Name</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">H.T No.</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Email</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Year</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Certificate Name</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Uploaded At</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredCertificates.map((cert) => (
                                                    <tr key={cert.id} className="dark:bg-gray-800 dark:hover:bg-gray-700">
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">
                                                            {cert.user_profiles?.student_name || 'Unknown'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">
                                                            {cert.ht_no || 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">
                                                            {cert.user_profiles?.email || 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">
                                                            {cert.user_profiles?.year || 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{cert.certificate_name}</td>
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">
                                                            {cert.uploaded_at ? new Date(cert.uploaded_at).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600">
                                                            <div className="flex space-x-2">
                                                                {cert.certificate_url && (
                                                                    <Button
                                                                        asChild
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
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
                                                                    disabled={isDeleting}
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
                                        <p className="text-gray-500 text-lg dark:text-gray-400">No certificates found</p>
                                        {(certificateSearchHTNO || selectedYearFilterCerts !== 'all') && <p className="text-gray-500 text-sm dark:text-gray-400">(Try clearing the filters)</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Events Tab Content (SupabaseNew Backed) */}
                    <TabsContent value={TAB_VALUES.EVENTS}>
                        <div className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
                                <Card className="dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <Calendar className="w-5 h-5" />
                                            <span>Event Management ({events.length})</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {events.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Title</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Date</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Venue</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {events.map((event) => (
                                                            <tr key={event.id} className="bg-white hover:bg-gray-100 border-b border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600">
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{event.title}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{new Date(event.date).toLocaleDateString()}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{event.venue || 'N/A'}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600">
                                                                    <div className="flex space-x-2">
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
                                                <p className="text-gray-500 text-lg dark:text-gray-400">No events scheduled.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4 dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader className="p-0 pb-4">
                                        <CardTitle className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <Plus className="h-5 w-5" />
                                            <span>Add New Event</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 space-y-4">
                                        <Label htmlFor="event-title">Title</Label>
                                        <Input id="event-title" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="event-description">Description</Label>
                                        <Textarea id="event-description" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="event-date">Date</Label>
                                        <Input id="event-date" type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="event-time">Time (Optional)</Label>
                                        <Input id="event-time" type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="event-venue">Venue (Optional)</Label>
                                        <Input id="event-venue" value={newEvent.venue} onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="event-speaker">Speaker (Optional)</Label>
                                        <Input id="event-speaker" value={newEvent.speaker} onChange={(e) => setNewEvent({ ...newEvent, speaker: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="event-image">Image (Optional)</Label>
                                        <Input id="event-image" type="file" accept="image/*" onChange={(e) => setNewEventImage(e.target.files?.[0] || null)} />

                                        <Button
                                            onClick={() => handleAddEntry('events', newEvent, newEventImage, 'events', supabaseNew, loadEvents, setNewEvent)}
                                            disabled={isUploading || !newEvent.title || !newEvent.date}
                                            className="w-full flex items-center space-x-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>{isUploading ? 'Adding...' : 'Add Event'}</span>
                                        </Button>
                                        {(!newEvent.title || !newEvent.date) && (
                                            <p className="text-sm text-red-500">Please enter a title and date to add an event.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Faculty Tab Content (SupabaseNew Backed) */}
                    <TabsContent value={TAB_VALUES.FACULTY}>
                        <div className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
                                <Card className="dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <GraduationCap className="w-5 h-5" />
                                            <span>Faculty Management ({faculty.length})</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {faculty.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Name</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Designation</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Department</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {faculty.map((member) => (
                                                            <tr key={member.id} className="bg-white hover:bg-gray-100 border-b border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600">
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{member.name}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{member.designation}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{member.department || 'N/A'}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600">
                                                                    <div className="flex space-x-2">
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
                                                <p className="text-gray-500 text-lg dark:text-gray-400">No faculty members found.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4 dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader className="p-0 pb-4">
                                        <CardTitle className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <Plus className="h-5 w-5" />
                                            <span>Add New Faculty</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 space-y-4">
                                        <Label htmlFor="faculty-name">Name</Label>
                                        <Input id="faculty-name" value={newFaculty.name} onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="faculty-designation">Designation</Label>
                                        <Input id="faculty-designation" value={newFaculty.designation} onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="faculty-department">Department</Label>
                                        <Input id="faculty-department" value={newFaculty.department} onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="faculty-bio">Bio (Optional)</Label>
                                        <Textarea id="faculty-bio" value={newFaculty.bio} onChange={(e) => setNewFaculty({ ...newFaculty, bio: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="faculty-expertise">Expertise (Optional)</Label>
                                        <Input id="faculty-expertise" value={newFaculty.expertise} onChange={(e) => setNewFaculty({ ...newFaculty, expertise: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="faculty-publications">Publications (Optional)</Label>
                                        <Textarea id="faculty-publications" value={newFaculty.publications} onChange={(e) => setNewFaculty({ ...newFaculty, publications: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="faculty-image">Image (Optional)</Label>
                                        <Input id="faculty-image" type="file" accept="image/*" onChange={(e) => setNewFacultyImage(e.target.files?.[0] || null)} />

                                        <Button
                                            onClick={() => handleAddEntry('faculty', newFaculty, newFacultyImage, 'faculty', supabaseNew, loadFaculty, setNewFaculty)}
                                            disabled={isUploading || !newFaculty.name || !newFaculty.designation || !newFaculty.department}
                                            className="w-full flex items-center space-x-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>{isUploading ? 'Adding...' : 'Add Faculty'}</span>
                                        </Button>
                                        {(!newFaculty.name || !newFaculty.designation || !newFaculty.department) && (
                                            <p className="text-sm text-red-500">Please enter name, designation, and department to add faculty.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Placements Tab Content (SupabaseNew Backed) */}
                    <TabsContent value={TAB_VALUES.PLACEMENTS}>
                        <div className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
                                <Card className="dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <TrendingUp className="w-5 h-5" />
                                            <span>Placement Management ({placements.length})</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {placements.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Student Name</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Company</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Year</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {placements.map((placement) => (
                                                            <tr key={placement.id} className="bg-white hover:bg-gray-100 border-b border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600">
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{placement.student_name}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{placement.company}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{placement.year}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600">
                                                                    <div className="flex space-x-2">
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
                                                <p className="text-gray-500 text-lg dark:text-gray-400">No placement records found.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4 dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader className="p-0 pb-4">
                                        <CardTitle className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <Plus className="h-5 w-5" />
                                            <span>Add New Placement</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 space-y-4">
                                        <Label htmlFor="placement-student-name">Student Name</Label>
                                        <Input id="placement-student-name" value={newPlacement.student_name} onChange={(e) => setNewPlacement({ ...newPlacement, student_name: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="placement-company">Company</Label>
                                        <Input id="placement-company" value={newPlacement.company} onChange={(e) => setNewPlacement({ ...newPlacement, company: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="placement-ctc">CTC (Optional)</Label>
                                        <Input id="placement-ctc" type="number" value={newPlacement.ctc || ''} onChange={(e) => setNewPlacement({ ...newPlacement, ctc: parseFloat(e.target.value) || undefined })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="placement-year">Year</Label>
                                        <Input id="placement-year" type="number" value={newPlacement.year || ''} onChange={(e) => setNewPlacement({ ...newPlacement, year: parseInt(e.target.value) || 0 })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="placement-type">Type</Label>
                                        <Input id="placement-type" value={newPlacement.type} onChange={(e) => setNewPlacement({ ...newPlacement, type: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="placement-branch">Branch</Label>
                                        <Input id="placement-branch" value={newPlacement.branch} onChange={(e) => setNewPlacement({ ...newPlacement, branch: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="placement-image">Image (Optional)</Label>
                                        <Input id="placement-image" type="file" accept="image/*" onChange={(e) => setNewPlacementImage(e.target.files?.[0] || null)} />

                                        <Button
                                            onClick={() => handleAddEntry('placements', newPlacement, newPlacementImage, 'placements', supabaseNew, loadPlacements, setNewPlacement)}
                                            disabled={isUploading || !newPlacement.student_name || !newPlacement.company || !newPlacement.year || !newPlacement.type || !newPlacement.branch}
                                            className="w-full flex items-center space-x-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>{isUploading ? 'Adding...' : 'Add Placement'}</span>
                                        </Button>
                                        {(!newPlacement.student_name || !newPlacement.company || !newPlacement.year || !newPlacement.type || !newPlacement.branch) && (
                                            <p className="text-sm text-red-500">Please fill all required fields to add a placement.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Achievements Tab Content (SupabaseNew Backed) */}
                    <TabsContent value={TAB_VALUES.ACHIEVEMENTS}>
                        <div className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
                                <Card className="dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <Trophy className="w-5 h-5" />
                                            <span>Achievement Management ({achievements.length})</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {achievements.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                                                    <thead>
                                                        <tr className="bg-gray-50 dark:bg-gray-700">
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Title</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Date</th>
                                                            <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {achievements.map((item) => (
                                                            <tr key={item.id} className="bg-white hover:bg-gray-100 border-b border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600">
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{item.title}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</td>
                                                                <td className="border border-gray-200 px-4 py-2 dark:border-gray-600">
                                                                    <div className="flex space-x-2">
                                                                        {item.certificate_url && (
                                                                            <Button
                                                                                asChild
                                                                                size="sm"
                                                                                variant="outline"
                                                                                className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                                                                            >
                                                                                <a
                                                                                    href={item.certificate_url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                >
                                                                                    View Cert
                                                                                </a>
                                                                            </Button>
                                                                        )}
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
                                                <p className="text-gray-500 text-lg dark:text-gray-400">No achievements found.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4 dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader className="p-0 pb-4">
                                        <CardTitle className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <Plus className="h-5 w-5" />
                                            <span>Upload New Achievement</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 space-y-4">
                                        <Label htmlFor="achievement-title">Title</Label>
                                        <Input id="achievement-title" value={newAchievement.title} onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="achievement-description">Description (Optional)</Label>
                                        <Textarea id="achievement-description" value={newAchievement.description} onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="achievement-date">Date (Optional)</Label>
                                        <Input id="achievement-date" type="date" value={newAchievement.date} onChange={(e) => setNewAchievement({ ...newAchievement, date: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="achievement-file">Certificate File (PDF/Image - Optional)</Label>
                                        <Input id="achievement-file" type="file" accept=".pdf,image/*" onChange={(e) => setNewAchievementFile(e.target.files?.[0] || null)} />

                                        <Button
                                            onClick={() => handleAddEntry('achievements', newAchievement, newAchievementFile, 'achievements', supabaseNew, loadAchievements, setNewAchievement)}
                                            disabled={isUploading || !newAchievement.title}
                                            className="w-full flex items-center space-x-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>{isUploading ? 'Uploading...' : 'Upload Achievement'}</span>
                                        </Button>
                                        {!newAchievement.title && (
                                            <p className="text-sm text-red-500">Please enter a title to upload an achievement.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Attendance Tab Content (SupabaseOld Backed) */}
                    <TabsContent value={TAB_VALUES.ATTENDANCE}>
                        <Card className="dark:bg-gray-800 dark:text-gray-100">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                    <Clock className="w-5 h-5" />
                                    <span>Attendance Upload & Records</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <h3 className="text-lg font-semibold mb-2 dark:text-gray-100">Upload New Attendance Sheet</h3>
                                <Label htmlFor="attendance-file" className="dark:text-gray-200">Upload Attendance Sheet (CSV/Excel)</Label>
                                <Input id="attendance-file" type="file" accept=".csv, .xlsx" onChange={handleAttendanceFileUpload} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />
                                <Button
                                    onClick={processAttendance}
                                    className="flex items-center space-x-1 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    disabled={isUploading || !attendanceFile}
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>{isUploading ? 'Uploading...' : 'Upload & Process Attendance'}</span>
                                </Button>
                                {!attendanceFile && (
                                    <p className="text-sm text-red-500">Please select a file to upload attendance.</p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Upload a spreadsheet containing student attendance data.
                                    This will be stored. **Note: Full processing of the file content (parsing & updating profiles) requires backend implementation.**
                                </p>

                                <h3 className="text-lg font-semibold mt-8 mb-2 dark:text-gray-100">Existing Attendance Records ({attendanceRecords.length})</h3>
                                {attendanceRecords.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-200 dark:border-gray-600">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-700">
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">File Name</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Uploaded At</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Status</th>
                                                    <th className="border border-gray-200 px-4 py-2 text-left dark:border-gray-600 dark:text-gray-100">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {attendanceRecords.map((record) => (
                                                    <tr key={record.id} className="bg-white hover:bg-gray-100 border-b border-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600">
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{record.file_name}</td>
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">{new Date(record.uploaded_at).toLocaleDateString()}</td>
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600 dark:text-gray-200">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${record.processed_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                                {record.processed_status}
                                                            </span>
                                                        </td>
                                                        <td className="border border-gray-200 px-4 py-2 dark:border-gray-600">
                                                            <div className="flex space-x-2">
                                                                {record.file_url && (
                                                                    <Button
                                                                        asChild
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700"
                                                                    >
                                                                        <a
                                                                            href={record.file_url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            View File
                                                                        </a>
                                                                    </Button>
                                                                )}
                                                                <Button size="sm" variant="destructive" onClick={() => handleDeleteAttendanceRecord(record)} disabled={isDeleting}>
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
                                        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-500 text-lg dark:text-gray-400">No attendance records found.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>


                    {/* Results Tab Content (SupabaseNew Backed) */}
                    <TabsContent value={TAB_VALUES.RESULTS}>
                        <Card className="dark:bg-gray-800 dark:text-gray-100">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                    <FileText className="w-5 h-5" />
                                    <span>Results Upload</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Label htmlFor="result-title" className="dark:text-gray-200">Result Title</Label>
                                <Input id="result-title" placeholder="e.g., Semester 1 Results" value={resultTitle} onChange={(e) => setResultTitle(e.target.value)} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                <Label htmlFor="result-file" className="dark:text-gray-200">Upload Result File (PDF)</Label>
                                <Input id="result-file" type="file" accept=".pdf" onChange={handleResultsFileUpload} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                <Button
                                    onClick={uploadResult}
                                    className="flex items-center space-x-1 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    disabled={isUploading || !resultFile || !resultTitle}
                                >
                                    {isUploading ? 'Uploading...' : 'Upload Result'}
                                    <Upload className="w-4 h-4" />
                                </Button>
                                {(!resultFile || !resultTitle) && (
                                    <p className="text-sm text-red-500">Please enter a title and select a PDF file to enable upload.</p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Upload official semester results in PDF format.
                                </p>
                            </CardContent>
                        </Card>
                        {/* You might want to add a section to view/manage uploaded results here too */}
                    </TabsContent>

                    {/* Timetable Tab Content (External component) */}
                    <TabsContent value={TAB_VALUES.TIMETABLE}>
                        <Card className="dark:bg-gray-800 dark:text-gray-100">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                    <BarChart3 className="w-5 h-5" />
                                    <span>Timetable Management</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Suspense fallback={<div className="text-gray-600 dark:text-gray-300">Loading Timetable...</div>}>
                                    {/* Assuming TimetableManager can now receive supabase instances if needed, or handles its own imports */}
                                    <TimetableManager supabaseNew={supabaseNew} supabaseOld={supabaseOld} toast={toast} />
                                </Suspense>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Gallery Tab Content (SupabaseNew Backed) */}
                    <TabsContent value={TAB_VALUES.GALLERY}>
                        <div className="w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
                                <Card className="dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <Image className="w-5 h-5" />
                                            <span>Gallery Management ({gallery.length})</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {gallery.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {gallery.map((item) => (
                                                    <Card key={item.id} className="relative group overflow-hidden h-full flex flex-col dark:bg-gray-700 dark:text-gray-100">
                                                        <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover" />
                                                        <CardContent className="p-2 text-sm flex-grow">
                                                            <h3 className="font-semibold">{item.title}</h3>
                                                            <p className="text-gray-500 text-xs truncate dark:text-gray-300">{item.description}</p>
                                                            <div className="flex justify-end space-x-2 mt-2">
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
                                                <p className="text-gray-500 text-lg dark:text-gray-400">No gallery items found.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="bg-white rounded-xl border p-6 shadow-md space-y-4 dark:bg-gray-800 dark:text-gray-100">
                                    <CardHeader className="p-0 pb-4">
                                        <CardTitle className="text-xl font-semibold flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                            <Plus className="h-5 w-5" />
                                            <span>Upload New Gallery Item</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 space-y-4">
                                        <Label htmlFor="gallery-title">Title</Label>
                                        <Input id="gallery-title" value={newGalleryItem.title} onChange={(e) => setNewGalleryItem({ ...newGalleryItem, title: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="gallery-description">Description (Optional)</Label>
                                        <Textarea id="gallery-description" value={newGalleryItem.description} onChange={(e) => setNewGalleryItem({ ...newGalleryItem, description: e.target.value })} className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600" />

                                        <Label htmlFor="gallery-image">Image</Label>
                                        <Input id="gallery-image" type="file" accept="image/*" onChange={(e) => setNewGalleryImage(e.target.files?.[0] || null)} />

                                        <Button
                                            onClick={() => handleAddEntry('gallery', newGalleryItem, newGalleryImage, 'gallery', supabaseNew, loadGallery, setNewGalleryItem)}
                                            disabled={isUploading || !newGalleryItem.title || !newGalleryImage}
                                            className="w-full flex items-center space-x-2 dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            <Upload className="w-4 h-4" />
                                            <span>{isUploading ? 'Uploading...' : 'Upload Gallery Item'}</span>
                                        </Button>
                                        {(!newGalleryItem.title || !newGalleryImage) && (
                                            <p className="text-sm text-red-500">Please enter a title and select an image to upload to gallery.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Notifications Tab Content (SupabaseNew Backed) */}
                    <TabsContent value={TAB_VALUES.NOTIFICATIONS}>
                        <Card className="dark:bg-gray-800 dark:text-gray-100">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                                    <User className="w-5 h-5" />
                                    <span>Post Notification</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Label htmlFor="notification-title" className="dark:text-gray-200">Notification Title</Label>
                                <Input
                                    id="notification-title"
                                    placeholder="e.g., Important Update"
                                    value={notificationTitle}
                                    onChange={(e) => setNotificationTitle(e.target.value)}
                                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                />

                                <Label htmlFor="notification-message" className="dark:text-gray-200">Notification Message</Label>
                                <Textarea
                                    id="notification-message"
                                    placeholder="Enter your message here..."
                                    value={notificationMessage}
                                    onChange={(e) => setNotificationMessage(e.target.value)}
                                    className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                />

                                <Button
                                    onClick={postNotification}
                                    className="flex items-center space-x-1 dark:bg-blue-600 dark:hover:bg-blue-700"
                                    disabled={isUploading || !notificationTitle || !notificationMessage}
                                >
                                    {isUploading ? 'Posting...' : 'Post Notification'}
                                    <Upload className="w-4 h-4" />
                                </Button>
                                {(!notificationTitle || !notificationMessage) && (
                                    <p className="text-sm text-red-500">Please enter both a title and a message to post.</p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Notifications will be visible to all students on their dashboards.
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Edit Student Dialog (SupabaseOld Backed) */}
                <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
                    <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                        <DialogHeader>
                            <DialogTitle className="dark:text-gray-100">Edit Student Details</DialogTitle>
                        </DialogHeader>
                        {editingStudent && (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-name" className="text-right dark:text-gray-200">
                                        Name
                                    </Label>
                                    <Input
                                        id="edit-name"
                                        value={editingStudent.student_name}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, student_name: e.target.value })}
                                        className="col-span-3 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-htno" className="text-right dark:text-gray-200">
                                        H.T No.
                                    </Label>
                                    <Input
                                        id="edit-htno"
                                        value={editingStudent.ht_no}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, ht_no: e.target.value })}
                                        className="col-span-3 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-year" className="text-right dark:text-gray-200">
                                        Year
                                    </Label>
                                    <Input
                                        id="edit-year"
                                        type="number"
                                        value={editingStudent.year}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, year: parseInt(e.target.value) || e.target.value })}
                                        className="col-span-3 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-status" className="text-right dark:text-gray-200">
                                        Status
                                    </Label>
                                    <Input
                                        id="edit-status"
                                        value={editingStudent.status}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.value })}
                                        className="col-span-3 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-phone" className="text-right dark:text-gray-200">
                                        Phone
                                    </Label>
                                    <Input
                                        id="edit-phone"
                                        value={editingStudent.phone}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                                        className="col-span-3 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-address" className="text-right dark:text-gray-200">
                                        Address
                                    </Label>
                                    <Textarea
                                        id="edit-address"
                                        value={editingStudent.address}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                                        className="col-span-3 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="edit-emergency" className="text-right dark:text-gray-200">
                                        Emergency No.
                                    </Label>
                                    <Input
                                        id="edit-emergency"
                                        value={editingStudent.emergency_no}
                                        onChange={(e) => setEditingStudent({ ...editingStudent, emergency_no: e.target.value })}
                                        className="col-span-3 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button onClick={() => updateStudent(editingStudent)} disabled={isUpdating} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                                        {isUpdating ? 'Updating...' : 'Update Student'}
                                    </Button>
                                </DialogFooter>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Promote Students Modal (SupabaseOld Backed) */}
                <Dialog open={isPromoteModalOpen} onOpenChange={setIsPromoteModalOpen}>
                    <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                        <DialogHeader>
                            <DialogTitle className="dark:text-gray-100">Promote Students</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="current-year" className="text-right dark:text-gray-200">
                                    Current Year
                                </Label>
                                <Select value={yearToPromote} onValueChange={setYearToPromote}>
                                    <SelectTrigger className="col-span-3 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
                                        <SelectValue placeholder="Select current year to promote" />
                                    </SelectTrigger>
                                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                        <SelectItem value="1" className="dark:text-gray-100 dark:hover:bg-gray-600">1st Year</SelectItem>
                                        <SelectItem value="2" className="dark:text-gray-100 dark:hover:bg-gray-600">2nd Year</SelectItem>
                                        <SelectItem value="3" className="dark:text-gray-100 dark:hover:bg-gray-600">3rd Year</SelectItem>
                                        <SelectItem value="4" className="dark:text-gray-100 dark:hover:bg-gray-600">4th Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleBulkPromote} disabled={!yearToPromote || isUpdating} className="dark:bg-blue-600 dark:hover:bg-blue-700">
                                    {isUpdating ? 'Promoting...' : 'Promote All Students in Selected Year'}
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Student Detail View Dialog (SupabaseOld Backed) */}
                <Dialog open={!!viewingStudent} onOpenChange={() => { setViewingStudent(null); setNewProfilePhotoFile(null); }}>
                    <DialogContent className="sm:max-w-[500px] dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700">
                        <DialogHeader>
                            <DialogTitle className="dark:text-gray-100">Student Details</DialogTitle>
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
                                            className="w-32 h-32 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                                            onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
                                        />
                                    )}
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Profile Photo</span>
                                </div>

                                {/* Photo Upload Option */}
                                <div className="grid grid-cols-4 items-center gap-2">
                                    <Label htmlFor="photo-upload" className="text-right dark:text-gray-200">
                                        Update Photo
                                    </Label>
                                    <Input
                                        id="photo-upload"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleProfilePhotoChange}
                                        className="col-span-3 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                    />
                                </div>
                                {newProfilePhotoFile && (
                                    <Button onClick={uploadProfilePhoto} className="w-full dark:bg-blue-600 dark:hover:bg-blue-700" disabled={isPhotoLoading}>
                                        {isPhotoLoading ? 'Uploading...' : 'Upload New Photo'}
                                    </Button>
                                )}

                                {/* Student Details */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-gray-900 dark:text-gray-200">
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
                                    }} className="dark:bg-blue-600 dark:hover:bg-blue-700">
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

// Wrap the AdminDashboard with ThemeProvider
const WrappedAdminDashboard = () => (
    <ThemeProvider>
        <AdminDashboard />
    </ThemeProvider>
);

export default WrappedAdminDashboard;
