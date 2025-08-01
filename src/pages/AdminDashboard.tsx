import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  Search, 
  Filter,
  Download,
  Upload,
  BarChart3,
  Award,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import SearchBar from '@/components/SearchBar';

interface Student {
  id: string;
  created_at?: string | null;
  email: string | null;
  ht_no: string | null;
  student_name: string | null;
  status: string | null;
  year: string | null;
  address: string | null;
  phone: string | null;
  emergency_no: string | null;
  cgpa: number | null;
  section: string | null;
  semester: string | null;
  role?: string | null;
  photo_url?: string | null;
}

interface Certification {
  id: string;
  created_at: string | null;
  student_id: string | null;
  student_name: string | null;
  ht_no: string | null;
  title: string;
  type: string;
  provider?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  description?: string | null;
  certificate_url?: string | null;
  status: string | null;
}

const AdminDashboard = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [filteredCertifications, setFilteredCertifications] = useState<Certification[]>([]);
  const [certSearchTerm, setCertSearchTerm] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedCertification, setSelectedCertification] = useState<Certification | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    approvedStudents: 0,
    totalCertifications: 0,
    pendingCertifications: 0,
    approvedCertifications: 0
  });

  const { user, logout } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchCertifications();
  }, []);

  useEffect(() => {
    // Filter students based on search term and status
    let results = students;

    if (searchTerm) {
      results = results.filter(student =>
        student.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.ht_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      results = results.filter(student => student.status === statusFilter);
    }

    setFilteredStudents(results);
  }, [students, searchTerm, statusFilter]);

  useEffect(() => {
    // Filter certifications based on search term and status
    let results = certifications;

    if (certSearchTerm) {
      results = results.filter(cert =>
        cert.student_name?.toLowerCase().includes(certSearchTerm.toLowerCase()) ||
        cert.title?.toLowerCase().includes(certSearchTerm.toLowerCase()) ||
        cert.type?.toLowerCase().includes(certSearchTerm.toLowerCase())
      );
    }

    if (certStatusFilter !== 'all') {
      results = results.filter(cert => cert.status === certStatusFilter);
    }

    setFilteredCertifications(results);
  }, [certifications, certSearchTerm, certStatusFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStudents(data as Student[]);

      // Calculate stats
      setStats(prevStats => ({
        ...prevStats,
        totalStudents: data.length,
        pendingApprovals: data.filter(student => student.status === 'pending').length,
        approvedStudents: data.filter(student => student.status === 'approved').length
      }));
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch students.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*, user_profiles(student_name, ht_no)')
        .order('created_at', { ascending: false })
        .returns<
          (Omit<Certification, 'student_name' | 'ht_no'> & {
            user_profiles: { student_name: string; ht_no: string } | null;
          })[]
        >();
  
      if (error) throw error;
  
      // Transform the data to include student_name and ht_no directly in the Certification interface
      const transformedData: Certification[] = data.map(item => ({
        ...item,
        student_name: item.user_profiles?.student_name || 'Unknown',
        ht_no: item.user_profiles?.ht_no || 'Unknown',
      }));
  
      setCertifications(transformedData);
  
      // Calculate stats
      setStats(prevStats => ({
        ...prevStats,
        totalCertifications: transformedData.length,
        pendingCertifications: transformedData.filter(cert => cert.status === 'pending').length,
        approvedCertifications: transformedData.filter(cert => cert.status === 'approved').length
      }));
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch certifications.',
        variant: 'destructive',
      });
    }
  };

  const updateStudentStatus = async (studentId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ status })
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Student has been ${status}.`,
      });

      fetchStudents();
      setShowStudentModal(false);
    } catch (error) {
      console.error('Error updating student status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update student status.',
        variant: 'destructive',
      });
    }
  };

  const updateCertificationStatus = async (certId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('certifications')
        .update({ status })
        .eq('id', certId);

      if (error) throw error;

      toast({
        title: 'Certification Updated',
        description: `Certification has been ${status}.`,
      });

      fetchCertifications();
      setShowCertModal(false);
    } catch (error) {
      console.error('Error updating certification status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update certification status.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.email}</span>
              <Button onClick={logout} variant="outline">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Calendar className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Placements</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
              <Award className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList className="grid grid-cols-11 w-full">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="certs" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Certs
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="faculty" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Faculty
            </TabsTrigger>
            <TabsTrigger value="placements" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Placements
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="timetable" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Timetable
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="notify" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Notify
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Management ({filteredStudents.length} / {stats.totalStudents} Total)
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <SearchBar
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onClear={() => setSearchTerm('')}
                    placeholder="Search by H.T No., Name, Year..."
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Years</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left p-4 font-medium text-gray-600">H.T No.</th>
                          <th className="text-left p-4 font-medium text-gray-600">Student Name</th>
                          <th className="text-left p-4 font-medium text-gray-600">Year</th>
                          <th className="text-left p-4 font-medium text-gray-600">Status</th>
                          <th className="text-left p-4 font-medium text-gray-600">Registered</th>
                          <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="p-4">
                              <div className="text-sm text-gray-900">{student.ht_no}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-medium text-gray-900">{student.student_name}</div>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-gray-900">{student.year}</div>
                            </td>
                            <td className="p-4">
                              <Badge variant={
                                student.status === 'approved' ? 'default' : 
                                student.status === 'rejected' ? 'destructive' : 'default'
                              }>
                                {student.status}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <div className="text-sm text-gray-500">
                                {student.created_at ? format(new Date(student.created_at), 'MMM dd, yyyy') : 'N/A'}
                              </div>
                            </td>
                            <td className="p-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setShowStudentModal(true);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredStudents.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No students found matching your criteria.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certifications Tab */}
          <TabsContent value="certs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Certification Management</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <SearchBar
                    searchTerm={certSearchTerm}
                    onSearchChange={setCertSearchTerm}
                    onClear={() => setCertSearchTerm('')}
                    placeholder="Search certifications..."
                  />
                  <select
                    value={certStatusFilter}
                    onChange={(e) => setCertStatusFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-4 font-medium text-gray-600">Student</th>
                        <th className="text-left p-4 font-medium text-gray-600">Certification</th>
                        <th className="text-left p-4 font-medium text-gray-600">Status</th>
                        <th className="text-left p-4 font-medium text-gray-600">Uploaded</th>
                        <th className="text-left p-4 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCertifications.map((cert) => (
                        <tr key={cert.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-900">{cert.student_name}</div>
                              <div className="text-sm text-gray-500">HT: {cert.ht_no}</div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium text-gray-900">{cert.title}</div>
                              <div className="text-sm text-gray-500">{cert.type}</div>
                              {cert.provider && (
                                <div className="text-sm text-gray-500">Provider: {cert.provider}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={
                              cert.status === 'approved' ? 'default' : 
                              cert.status === 'rejected' ? 'destructive' : 'default'
                            }>
                              {cert.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-gray-500">
                              {cert.created_at ? format(new Date(cert.created_at), 'MMM dd, yyyy') : 'N/A'}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCertification(cert);
                                setShowCertModal(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredCertifications.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No certifications found matching your criteria.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs - Placeholder Content */}
          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Events Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Events management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faculty" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Faculty Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Faculty management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="placements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Placements Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Placements management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Achievements Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Achievements management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Attendance Sheet (CSV/Excel)
                    </label>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  <Button variant="outline" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Process Attendance (Placeholder)
                  </Button>
                  <p className="text-sm text-gray-500">
                    Upload a spreadsheet containing student attendance data. This will be reflected in student profiles. 
                    **Note: Full processing of the file content requires backend implementation.**
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Results Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Results management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetable" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Timetable Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Timetable management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Gallery management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notify" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Notification management functionality will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Student Details Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Student Details</h2>
                <Button variant="outline" onClick={() => setShowStudentModal(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.student_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Hall Ticket No.</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.ht_no}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Year</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.year}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="mt-1 text-gray-900">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge variant={
                        selectedStudent.status === 'approved' ? 'default' : 
                        selectedStudent.status === 'rejected' ? 'destructive' : 'default'
                      }>
                        {selectedStudent.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Registration Date</label>
                    <p className="mt-1 text-gray-900">
                      {selectedStudent.created_at ? format(new Date(selectedStudent.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedStudent.status === 'pending' && (
                  <div className="flex space-x-4 pt-4 border-t">
                    <Button
                      onClick={() => updateStudentStatus(selectedStudent.id, 'approved')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Student
                    </Button>
                    <Button
                      onClick={() => updateStudentStatus(selectedStudent.id, 'rejected')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Student
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Certification Details Modal */}
      {showCertModal && selectedCertification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Certification Details</h2>
                <Button variant="outline" onClick={() => setShowCertModal(false)}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Student Name</label>
                    <p className="mt-1 text-gray-900">{selectedCertification.student_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Hall Ticket No.</label>
                    <p className="mt-1 text-gray-900">{selectedCertification.ht_no}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Certification Title</label>
                    <p className="mt-1 text-gray-900">{selectedCertification.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type</label>
                    <p className="mt-1 text-gray-900">{selectedCertification.type}</p>
                  </div>
                  {selectedCertification.provider && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Provider</label>
                      <p className="mt-1 text-gray-900">{selectedCertification.provider}</p>
                    </div>
                  )}
                  {selectedCertification.issue_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Issue Date</label>
                      <p className="mt-1 text-gray-900">
                        {format(new Date(selectedCertification.issue_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedCertification.expiry_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Expiry Date</label>
                      <p className="mt-1 text-gray-900">
                        {format(new Date(selectedCertification.expiry_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">
                      <Badge variant={
                        selectedCertification.status === 'approved' ? 'default' : 
                        selectedCertification.status === 'rejected' ? 'destructive' : 'default'
                      }>
                        {selectedCertification.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Upload Date</label>
                    <p className="mt-1 text-gray-900">
                      {selectedCertification.created_at ? format(new Date(selectedCertification.created_at), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </p>
                  </div>
                </div>

                {selectedCertification.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="mt-1 text-gray-900">{selectedCertification.description}</p>
                  </div>
                )}

                {selectedCertification.certificate_url && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Certificate File</label>
                    <div className="mt-1">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedCertification.certificate_url, '_blank')}
                        className="flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Certificate
                      </Button>
                    </div>
                  </div>
                )}

                {selectedCertification.status === 'pending' && (
                  <div className="flex space-x-4 pt-4 border-t">
                    <Button
                      onClick={() => updateCertificationStatus(selectedCertification.id, 'approved')}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Certification
                    </Button>
                    <Button
                      onClick={() => updateCertificationStatus(selectedCertification.id, 'rejected')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Certification
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
