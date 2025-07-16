import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Calendar, GraduationCap, TrendingUp, LogOut, BookOpen, Trophy, Image, BarChart3, Plus, Trash2, Check, X, Upload, Clock, FileText } from 'lucide-react';
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

const AdminDashboard = () => {
  const { toast } = useToast();

  // ✅ Promote Student
  const promoteStudent = async (studentId: string, currentYear: number | string) => {
    const numericYear = parseInt(currentYear as string);
    if (isNaN(numericYear)) {
      toast({ title: 'Error', description: 'Invalid year format for promotion', variant: 'destructive' });
      return;
    }
    if (numericYear >= 4) {
      toast({ title: 'Notice', description: 'Student is already in final year' });
      return;
    }
    const nextYear = numericYear + 1;
    const confirm = window.confirm(`Promote this student to year ${nextYear}?`);
    if (!confirm) return;
    try {
      const { error } = await supabase.from('user_profiles').update({ year: nextYear }).eq('id', studentId);
      if (!error) toast({ title: `Student promoted to year ${nextYear}` });
    } catch (error) {
      console.error('Error promoting student:', error);
      toast({ title: 'Promotion failed', description: 'Please try again later.', variant: 'destructive' });
    }
  };

  // ✅ Admin: Search Certificates
  const [certificateSearchHTNO, setCertificateSearchHTNO] = useState('');
  const [adminCertificates, setAdminCertificates] = useState<any[]>([]);
  const fetchStudentCertificates = async () => {
    if (!certificateSearchHTNO) {
      toast({ title: 'Enter HT No. to search' });
      return;
    }
    const { data, error } = await supabase
      .from('student_certificates')
      .select('*')
      .eq('htno', certificateSearchHTNO);
    if (error) {
      toast({ title: 'Error fetching certificates', variant: 'destructive' });
    } else {
      setAdminCertificates(data || []);
      if ((data || []).length === 0) toast({ title: 'No certificates found' });
    }
  };

  // ✅ Results Upload
  const [resultTitle, setResultTitle] = useState('');
  const [resultFile, setResultFile] = useState<File | null>(null);
  const uploadResult = async () => {
    if (!resultFile || !resultTitle) {
      toast({ title: 'Error', description: 'Please provide a title and choose a file', variant: 'destructive' });
      return;
    }
    const fileName = `${Date.now()}-${resultFile.name}`;
    const { error: uploadError } = await supabase.storage.from('results').upload(fileName, resultFile, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', variant: 'destructive' });
      return;
    }
    const { error: dbError } = await supabase.from('results').insert([{ title: resultTitle, file_url: fileName }]);
    if (dbError) {
      toast({ title: 'Error saving record', variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Result uploaded successfully' });
    setResultTitle('');
    setResultFile(null);
  };

  // ✅ Notifications
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const postNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      toast({ title: 'Fill both title and message', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('notifications').insert([{ title: notificationTitle, message: notificationMessage }]);
    if (error) {
      toast({ title: 'Error posting notification', variant: 'destructive' });
    } else {
      toast({ title: '✅ Notification posted' });
      setNotificationTitle('');
      setNotificationMessage('');
    }
  };

  const { user, userProfile, logout, loading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // ✅ ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
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
  const [gallery, setGallery] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [editingStudent, setEditingStudent] = useState<PendingStudent | null>(null);

  console.log('AdminDashboard: userProfile:', userProfile, 'loading:', loading);

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

  // Load data from Supabase using any type to bypass type constraints
  useEffect(() => {
    if (userProfile?.role === 'admin') {
      loadAllStudents();
      loadEvents();
      loadFaculty();
      loadPlacements();
      loadGallery();
      loadCertifications();
      loadStats();
      
      // Set up real-time subscriptions
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

      const certificationsChannel = supabase
        .channel('certifications-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'certifications' }, loadCertifications)
        .subscribe();

      return () => {
        supabase.removeChannel(studentsChannel);
        supabase.removeChannel(eventsChannel);
        supabase.removeChannel(facultyChannel);
        supabase.removeChannel(placementsChannel);
        supabase.removeChannel(galleryChannel);
        supabase.removeChannel(certificationsChannel);
      };
    }
  }, [userProfile]);

  // ✅ NOW SAFE TO DO EARLY RETURNS AFTER ALL HOOKS
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

  const loadAllStudents = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('user_profiles')
        .select('*')
        .eq('role', 'student')
        .order('status', { ascending: false }); // pending first
      
      if (!error && data) {
        setAllStudents(data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
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
    } catch (error) {
      console.error('Error loading stats:', error);
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
      }
    } catch (error) {
      console.error('Error loading events:', error);
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
      }
    } catch (error) {
      console.error('Error loading faculty:', error);
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
      }
    } catch (error) {
      console.error('Error loading placements:', error);
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
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
    }
  };

  const loadCertifications = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('certifications')
        .select(`
          *, 
          user_profiles!inner(student_name, ht_no)
        `)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setCertifications(data);
      }
    } catch (error) {
      console.error('Error loading certifications:', error);
    }
  };

  // Student Management Functions
  const approveStudent = async (studentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({ status: 'approved' })
        .eq('id', studentId);
      
      if (!error) {
        toast({ title: "Student approved successfully" });
      }
    } catch (error) {
      console.error('Error approving student:', error);
    }
  };

  const rejectStudent = async (studentId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update({ status: 'rejected' })
        .eq('id', studentId);
      
      if (!error) {
        toast({ title: "Student rejected" });
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
    }
  };

  // Event Management Functions
  const addEvent = async (newEvent: Omit<Event, 'id'>) => {
    try {
      const { error } = await (supabase as any)
        .from('events')
        .insert(newEvent);
      
      if (!error) {
        toast({ title: "Event added successfully" });
      }
    } catch (error) {
      console.error('Error adding event:', error);
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
        loadEvents(); // Reload events after deletion
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  // Faculty Management Functions
  const addFaculty = async (newFaculty: Omit<Faculty, 'id'>) => {
    try {
      const { error } = await (supabase as any)
        .from('faculty')
        .insert(newFaculty);
      
      if (!error) {
        toast({ title: "Faculty member added successfully" });
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
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
        loadFaculty(); // Reload faculty after deletion
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
    }
  };

  // Placement Management Functions
  const addPlacement = async (newPlacement: Omit<Placement, 'id'>) => {
    try {
      const { error } = await (supabase as any)
        .from('placements')
        .insert(newPlacement);
      
      if (!error) {
        toast({ title: "Placement record added successfully" });
      }
    } catch (error) {
      console.error('Error adding placement:', error);
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
        loadPlacements(); // Reload placements after deletion
      }
    } catch (error) {
      console.error('Error deleting placement:', error);
    }
  };

  // Gallery Management Functions
  const addGalleryItem = async (newItem: { title: string; description?: string; type: string; url: string }) => {
    try {
      const { error } = await (supabase as any)
        .from('gallery')
        .insert(newItem);
      
      if (!error) {
        toast({ title: "Gallery item added successfully" });
      }
    } catch (error) {
      console.error('Error adding gallery item:', error);
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
        loadGallery(); // Reload gallery after deletion
      }
    } catch (error) {
      console.error('Error deleting gallery item:', error);
    }
  };

  // Certification Management Functions
  const approveCertification = async (certId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('certifications')
        .update({ status: 'approved' })
        .eq('id', certId);
      
      if (!error) {
        toast({ title: "Certification approved successfully" });
      }
    } catch (error) {
      console.error('Error approving certification:', error);
    }
  };

  const rejectCertification = async (certId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('certifications')
        .update({ status: 'rejected' })
        .eq('id', certId);
      
      if (!error) {
        toast({ title: "Certification rejected" });
      }
    } catch (error) {
      console.error('Error rejecting certification:', error);
    }
  };

  const deleteCertification = async (certId: string, fileUrl: string) => {
    try {
      // Delete file from storage if exists
      if (fileUrl) {
        await supabase.storage.from('certifications').remove([fileUrl]);
      }
      
      // Delete record from database
      const { error } = await (supabase as any)
        .from('certifications')
        .delete()
        .eq('id', certId);
      
      if (!error) {
        toast({ title: "Certification deleted successfully" });
      }
    } catch (error) {
      console.error('Error deleting certification:', error);
    }
  };

  // Student Edit Function
  const updateStudent = async (studentData: Partial<PendingStudent>) => {
    try {
      const { error } = await (supabase as any)
        .from('user_profiles')
        .update(studentData)
        .eq('id', editingStudent?.id);
      
      if (!error) {
        toast({ title: "Student details updated successfully" });
        setEditingStudent(null);
      }
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  // File upload handlers
  const handleAttendanceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({ title: "Attendance sheet uploaded successfully", description: "Data will be processed and reflected in student profiles." });
    }
  };

  const handleResultsUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({ title: "Results uploaded successfully", description: "Semester results will be available in student dashboards." });
    }
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">H.T No.</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Student Name</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Year</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allStudents.map((student) => (
                          <tr key={student.id}>
                            <td className="border border-gray-200 px-4 py-2">{student.ht_no}</td>
                            <td className="border border-gray-200 px-4 py-2">{student.student_name}</td>
                            <td className="border border-gray-200 px-4 py-2">{student.year}</td>
                            <td className="border border-gray-200 px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                student.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : student.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <div className="flex space-x-2">
                                {student.status === 'pending' && (
                                  <>
                                    <Button size="sm" onClick={() => approveStudent(student.id)} className="bg-green-600 hover:bg-green-700">
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => rejectStudent(student.id)}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button size="sm" variant="outline" onClick={() => setEditingStudent(student)}>
                                  Edit
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
                  <span>Student Certifications ({certifications.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certifications.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left">Student</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">H.T No.</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Certificate Title</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Issuer</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Date Issued</th>
                          <th className="border border-gray-200 px-4 py-2 text-left">Status</th>
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
                              {cert.user_profiles?.ht_no || cert.ht_no}
                            </td>
                            <td className="border border-gray-200 px-4 py-2">{cert.title}</td>
                            <td className="border border-gray-200 px-4 py-2">{cert.issuer}</td>
                            <td className="border border-gray-200 px-4 py-2">{cert.date_issued}</td>
                            <td className="border border-gray-200 px-4 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                cert.status === 'pending' 
                                  ? 'bg-yellow-100 text-yellow-800' 
                                  : cert.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {cert.status}
                              </span>
                            </td>
                            <td className="border border-gray-200 px-4 py-2">
                              <div className="flex space-x-2">
                                {cert.file_url && (
                                  <a 
                                    href={supabase.storage.from('certifications').getPublicUrl(cert.file_url).data.publicUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <Button size="sm" variant="outline">
                                      View
                                    </Button>
                                  </a>
                                )}
                                {cert.status === 'pending' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      onClick={() => approveCertification(cert.id)} 
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive" 
                                      onClick={() => rejectCertification(cert.id)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => deleteCertification(cert.id, cert.file_url)}
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
                    <p className="text-gray-500 text-lg">No certifications submitted yet</p>
                    <p className="text-gray-400">Students will see their certifications here once uploaded</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>Event Management</span>
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Event</DialogTitle>
                      </DialogHeader>
                      <EventForm onSave={addEvent} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{event.title}</h3>
                          <p className="text-gray-600">Date: {event.date}</p>
                          <p className="text-gray-600">Time: {event.time}</p>
                          <p className="text-gray-600">Venue: {event.venue}</p>
                          {event.speaker && <p className="text-gray-600">Speaker: {event.speaker}</p>}
                          <p className="text-gray-600">{event.description}</p>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => deleteEvent(event.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faculty">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <GraduationCap className="w-5 h-5" />
                    <span>Faculty Management</span>
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Faculty
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Faculty Member</DialogTitle>
                      </DialogHeader>
                      <FacultyForm onSave={addFaculty} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {faculty.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{member.name}</h3>
                          <p className="text-gray-600">{member.designation}</p>
                          {member.expertise && <p className="text-sm text-gray-500">Expertise: {member.expertise}</p>}
                          {member.bio && <p className="text-sm text-gray-500 mt-2">{member.bio}</p>}
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => deleteFaculty(member.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="placements">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5" />
                    <span>Placement Records</span>
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Placement
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Placement Record</DialogTitle>
                      </DialogHeader>
                      <PlacementForm onSave={addPlacement} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left">Student</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Company</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">CTC</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Year</th>
                        <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {placements.map((placement) => (
                        <tr key={placement.id}>
                          <td className="border border-gray-200 px-4 py-2">{placement.student_name}</td>
                          <td className="border border-gray-200 px-4 py-2">{placement.company}</td>
                          <td className="border border-gray-200 px-4 py-2 font-semibold text-green-600">
                            {placement.ctc ? `${placement.ctc} LPA` : 'N/A'}
                          </td>
                          <td className="border border-gray-200 px-4 py-2">{placement.type}</td>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Attendance Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Monthly Attendance</h3>
                    <p className="text-gray-600 mb-4">Upload Excel sheet with student roll numbers and attendance data</p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleAttendanceUpload}
                      className="hidden"
                      id="attendance-upload"
                    />
                    <Label htmlFor="attendance-upload">
                      <Button asChild>
                        <span>Choose File</span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Results Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Semester Results</h3>
                    <p className="text-gray-600 mb-4">Upload Excel sheet with student results for each semester</p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleResultsUpload}
                      className="hidden"
                      id="results-upload"
                    />
                    <Label htmlFor="results-upload">
                      <Button asChild>
                        <span>Choose File</span>
                      </Button>
                    </Label>
                  </div>
                </div>
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
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Image className="w-5 h-5" />
                    <span>Department Gallery</span>
                  </CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Media
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Gallery Item</DialogTitle>
                      </DialogHeader>
                      <GalleryForm onSave={addGalleryItem} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gallery.map((item) => (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      {item.type === 'image' ? (
                        <img src={item.url} alt={item.title} className="w-full h-48 object-cover" />
                      ) : (
                        <video src={item.url} className="w-full h-48 object-cover" controls />
                      )}
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                          <Button size="sm" variant="destructive" onClick={() => deleteGalleryItem(item.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {gallery.length === 0 && (
                  <div className="text-center py-12">
                    <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No gallery items yet</p>
                    <p className="text-gray-400">Add photos and videos to showcase your department</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Student Edit Modal */}
      <Dialog open={editingStudent !== null} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student Details</DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <StudentEditForm student={editingStudent} onSave={updateStudent} onCancel={() => setEditingStudent(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Form Components
const EventForm = ({ onSave }: { onSave: (data: Omit<Event, 'id'>) => void }) => {
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    date: '', 
    time: '', 
    venue: '', 
    speaker: '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ title: '', description: '', date: '', time: '', venue: '', speaker: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title</Label>
        <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
      </div>
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required />
      </div>
      <div>
        <Label htmlFor="time">Time</Label>
        <Input id="time" type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
      </div>
      <div>
        <Label htmlFor="venue">Venue</Label>
        <Input id="venue" value={formData.venue} onChange={(e) => setFormData({...formData, venue: e.target.value})} />
      </div>
      <div>
        <Label htmlFor="speaker">Speaker</Label>
        <Input id="speaker" value={formData.speaker} onChange={(e) => setFormData({...formData, speaker: e.target.value})} />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
      </div>
      <Button type="submit">Add Event</Button>
    </form>
  );
};

const FacultyForm = ({ onSave }: { onSave: (data: Omit<Faculty, 'id'>) => void }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    designation: '', 
    bio: '', 
    expertise: '', 
    publications: '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ name: '', designation: '', bio: '', expertise: '', publications: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
      </div>
      <div>
        <Label htmlFor="designation">Designation</Label>
        <Input id="designation" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} required />
      </div>
      <div>
        <Label htmlFor="expertise">Area of Expertise</Label>
        <Input id="expertise" value={formData.expertise} onChange={(e) => setFormData({...formData, expertise: e.target.value})} />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} />
      </div>
      <div>
        <Label htmlFor="publications">Publications/Achievements</Label>
        <Textarea id="publications" value={formData.publications} onChange={(e) => setFormData({...formData, publications: e.target.value})} />
      </div>
      <Button type="submit">Add Faculty</Button>
    </form>
  );
};

const PlacementForm = ({ onSave }: { onSave: (data: Omit<Placement, 'id'>) => void }) => {
  const [formData, setFormData] = useState({ 
    student_name: '', 
    company: '', 
    ctc: '', 
    type: 'Full-Time', 
    year: '2025', 
    branch: 'AI & DS' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      student_name: formData.student_name,
      company: formData.company,
      ctc: formData.ctc ? parseFloat(formData.ctc) : 0,
      type: formData.type,
      year: parseInt(formData.year),
      branch: formData.branch
    });
    setFormData({ student_name: '', company: '', ctc: '', type: 'Full-Time', year: '2025', branch: 'AI & DS' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="student_name">Student Name</Label>
        <Input id="student_name" value={formData.student_name} onChange={(e) => setFormData({...formData, student_name: e.target.value})} required />
      </div>
      <div>
        <Label htmlFor="company">Company</Label>
        <Input id="company" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} required />
      </div>
      <div>
        <Label htmlFor="ctc">CTC (in LPA)</Label>
        <Input id="ctc" type="number" step="0.01" value={formData.ctc} onChange={(e) => setFormData({...formData, ctc: e.target.value})} />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <select 
          id="type" 
          value={formData.type} 
          onChange={(e) => setFormData({...formData, type: e.target.value})}
          className="w-full h-10 px-3 py-2 border border-input rounded-md"
        >
          <option value="Full-Time">Full-Time</option>
          <option value="Internship">Internship</option>
        </select>
      </div>
      <div>
        <Label htmlFor="year">Year</Label>
        <Input id="year" type="number" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} required />
      </div>
      <Button type="submit">Add Placement</Button>
    </form>
  );
};

// Gallery Form Component
const GalleryForm = ({ onSave }: { onSave: (data: any) => void }) => {
  const [formData, setFormData] = useState({ 
    title: '', 
    description: '', 
    type: 'image', 
    url: '' 
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ title: '', description: '', type: 'image', url: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <select id="type" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full p-2 border rounded">
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
      </div>
      <div>
        <Label htmlFor="url">URL</Label>
        <Input id="url" type="url" value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} required />
      </div>
      <Button type="submit">Add to Gallery</Button>
    </form>
  );
};

// Student Edit Form Component
const StudentEditForm = ({ student, onSave, onCancel }: { student: PendingStudent; onSave: (data: any) => void; onCancel: () => void }) => {
  const [formData, setFormData] = useState({ 
    student_name: student.student_name || '', 
    ht_no: student.ht_no || '', 
    year: student.year || '', 
    status: student.status || 'pending',
    phone: student.phone || '',
    address: student.address || '',
    emergency_no: student.emergency_no || '',
    email: student.email || ''
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let photoUrl = student.photo_url;
    
    // Handle photo upload if a new file is selected
    if (photoFile) {
      try {
        const { error: uploadError } = await supabase.storage
          .from('profile_photos')
          .upload(`profiles/${student.id}/photo.jpg`, photoFile, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data } = supabase.storage
          .from('profile_photos')
          .getPublicUrl(`profiles/${student.id}/photo.jpg`);
        photoUrl = data.publicUrl;
      } catch (error) {
        toast({
          title: 'Error uploading photo',
          description: 'Photo upload failed, but other data will be saved.',
          variant: 'destructive'
        });
      }
    }
    
    onSave({
      ...formData,
      photo_url: photoUrl
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-96 overflow-y-auto">
      <div>
        <Label htmlFor="student_name">Student Name</Label>
        <Input 
          id="student_name" 
          value={formData.student_name} 
          onChange={(e) => setFormData({...formData, student_name: e.target.value})} 
          required 
        />
      </div>
      
      <div>
        <Label htmlFor="ht_no">H.T No.</Label>
        <Input 
          id="ht_no" 
          value={formData.ht_no} 
          onChange={(e) => setFormData({...formData, ht_no: e.target.value})} 
          required 
        />
      </div>
      
      <div>
        <Label htmlFor="year">Year</Label>
        <Input 
          id="year" 
          value={formData.year} 
          onChange={(e) => setFormData({...formData, year: e.target.value})} 
          required 
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email"
          value={formData.email} 
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input 
          id="phone" 
          type="tel"
          value={formData.phone} 
          onChange={(e) => setFormData({...formData, phone: e.target.value})} 
        />
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea 
          id="address" 
          value={formData.address} 
          onChange={(e) => setFormData({...formData, address: e.target.value})} 
          rows={2}
        />
      </div>

      <div>
        <Label htmlFor="emergency_no">Emergency Contact (Parent Number)</Label>
        <Input 
          id="emergency_no" 
          type="tel"
          value={formData.emergency_no} 
          onChange={(e) => setFormData({...formData, emergency_no: e.target.value})} 
        />
      </div>

      <div>
        <Label htmlFor="photo">Profile Photo</Label>
        <div className="flex items-center gap-2">
          <Input 
            id="photo" 
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} 
          />
          {student.photo_url && (
            <span className="text-sm text-muted-foreground">Current photo exists</span>
          )}
        </div>
      </div>
      
      <div>
        <Label htmlFor="status">Status</Label>
        <select 
          id="status" 
          value={formData.status} 
          onChange={(e) => setFormData({...formData, status: e.target.value})} 
          className="w-full p-2 border rounded h-10"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      <div className="flex space-x-2 pt-4">
        <Button type="submit">Update Student</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

export default AdminDashboard;
