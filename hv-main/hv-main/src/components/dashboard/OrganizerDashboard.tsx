import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Logo } from '../Logo';
import { CommunityIndicator } from './CommunityIndicator';
import { ApiStatusIndicator } from '../ApiStatusIndicator';
import { supabaseApi } from '../../utils/supabaseApi';
import type { Event as ApiEvent } from '../../utils/supabaseApi';
import { Input } from '../ui/input';
import { showToast } from '../../utils/toast';
import {
  Plus,
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Bell,
  Eye,
  Edit,
  Trash2,
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  FileText,
  LogOut,
  Moon,
  Sun,
  User as UserIcon,
  MessageCircle,
  Megaphone,
  Crown,
  Key,
  Shield,
} from 'lucide-react';

type OrganizerEvent = ApiEvent & { revenue?: number; isDraft?: boolean };

export function OrganizerDashboard() {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isVerified] = useState(true);
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    name: user?.name,
    phone: user?.phone,
    dateOfBirth: '',
    college: user?.college,
    collegeAddress: '',
    departmentOrCourse: '',
    year: '',
    clubName: '',
    clubPosition: '',
    clubCategory: 'Tech',
    docStudentIdUrl: '',
    docClubCertificateUrl: '',
    profilePhotoUrl: '',
    bankAccountNumber: '',
    ifscCode: '',
    upiId: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await supabaseApi.getEvents({ }, user?.id);
        // Filter to organizer-owned events if needed; for now, show all
        setEvents(data as OrganizerEvent[]);
      } catch (e) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id]);

  const submitVerification = async () => {
    if (!user) return;
    await supabaseApi.submitOrganizerVerification(user.id, form);
    await updateUser({ verificationStatus: 'pending', updatedAt: new Date().toISOString() });
    showToast.info('Details submitted. Awaiting approval.');
    setShowVerificationForm(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: string) => {
    try {
      if (!user) return;
      const file = e.target.files?.[0];
      if (!file) return;
      const url = await supabaseApi.uploadVerificationFile(file, user.id, kind);
      const keyMap: Record<string, string> = {
        profile: 'profilePhotoUrl',
        studentId: 'docStudentIdUrl',
        clubCert: 'docClubCertificateUrl',
      };
      const key = keyMap[kind] || kind;
      setForm(prev => ({ ...prev, [key]: url }));
      showToast.success('File uploaded');
    } catch (err) {
      console.error('Upload failed', err);
      showToast.error('Upload failed');
    }
  };

  const handleEditEvent = (eventId: string) => {
    navigate(`/create-event?edit=${eventId}`);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      // In a real app, this would call an API
      console.log('Deleting event:', eventId);
      // Show success toast
      alert('Event deleted successfully!');
    }
  };

  const handleShareEvent = (eventId: string) => {
    // Generate shareable link
    const shareUrl = `${window.location.origin}/event/${eventId}`;
    if (navigator.share) {
      navigator.share({
        title: 'Check out this event!',
        url: shareUrl,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Event link copied to clipboard!');
    }
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleAddCrewMember = () => {
    const email = prompt('Enter crew member email:');
    if (email) {
      // In a real app, this would call an API
      console.log('Adding crew member:', email);
      alert(`Invitation sent to ${email}!`);
    }
  };

  const getStatusBadge = (status: string, isDraft: boolean) => {
    if (isDraft) {
      return <Badge variant="secondary">Draft</Badge>;
    }
    switch (status) {
      case 'live':
        return <Badge className="bg-green-600">Live</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-600">Upcoming</Badge>;
      case 'ended':
        return <Badge variant="outline">Ended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="md" showText={true} />
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Organizer Dashboard
              </h1>
              <ApiStatusIndicator usingFallback={false} />
              {user?.type === 'organizer' && user?.verificationStatus !== 'approved' && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>{user?.verificationStatus === 'pending' ? 'Verification Pending' : 'Unverified'}</span>
                </Badge>
              )}
              {!isVerified && (
                <Badge variant="destructive" className="flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>Pending Verification</span>
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="relative"
                >
                  <Bell size={16} className="mr-2" />
                  Notifications
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    2
                  </Badge>
                </Button>
              </div>
              
              {user?.type === 'organizer' && user?.verificationStatus !== 'approved' ? (
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={() => setShowVerificationForm(true)}
                >
                  <Plus size={16} className="mr-2" />
                  Complete Verification
                </Button>
              ) : (
                <Button 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={() => navigate('/create-event')}
                >
                  <Plus size={16} className="mr-2" />
                  Create Event
                </Button>
              )}
              
              {/* Direct Logout Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => console.log('Profile button clicked')}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        {user?.name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-[100]">
                  <div className="flex items-center justify-start space-x-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        {user?.name?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || 'Sarah Wilson'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email || 'organizer@demo.com'}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === 'dark' ? (
                      <Sun className="mr-2 h-4 w-4" />
                    ) : (
                      <Moon className="mr-2 h-4 w-4" />
                    )}
                    Toggle Theme
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      console.log('Logout clicked');
                      logout();
                    }} 
                    className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Organizer Verification Prompt */}
        {user?.type === 'organizer' && user?.verificationStatus !== 'approved' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock size={20} className="text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                    {user?.verificationStatus === 'pending' ? 'Verification Pending' : user?.verificationStatus === 'rejected' ? 'Verification Rejected' : 'Complete Verification'}
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {user?.verificationStatus === 'pending'
                      ? 'Your documents are under review.'
                      : user?.verificationStatus === 'rejected'
                        ? `Reason: ${user?.rejectionReason || 'Not provided'}`
                        : 'Provide your details and documents to unlock full access.'}
                  </p>
                </div>
              </div>
              {user?.verificationStatus !== 'pending' && (
                <Button size="sm" onClick={() => setShowVerificationForm(true)}>
                  {user?.verificationStatus === 'rejected' ? 'Resubmit' : 'Complete Verification'}
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {showVerificationForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Organizer Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text sm mb-1">Full Name</label>
                  <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Phone Number</label>
                  <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Date of Birth</label>
                  <Input type="date" value={form.dateOfBirth || ''} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Profile Photo</label>
                  <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'profile')} />
                  {form.profilePhotoUrl && (
                    <p className="text-xs text-muted-foreground mt-1">Uploaded</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">College Name</label>
                  <Input value={form.college || ''} onChange={(e) => setForm({ ...form, college: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">College Address</label>
                  <Input value={form.collegeAddress || ''} onChange={(e) => setForm({ ...form, collegeAddress: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Department/Course</label>
                  <Input value={form.departmentOrCourse || ''} onChange={(e) => setForm({ ...form, departmentOrCourse: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Year of Study</label>
                  <Input value={form.year || ''} onChange={(e) => setForm({ ...form, year: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Club/Society Name</label>
                  <Input value={form.clubName || ''} onChange={(e) => setForm({ ...form, clubName: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Position in Club</label>
                  <Input value={form.clubPosition || ''} onChange={(e) => setForm({ ...form, clubPosition: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Club Category</label>
                  <Input value={form.clubCategory || 'Tech'} onChange={(e) => setForm({ ...form, clubCategory: e.target.value as any })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Student ID</label>
                  <Input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'studentId')} />
                  {form.docStudentIdUrl && (
                    <p className="text-xs text-muted-foreground mt-1">Uploaded</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm mb-1">Club Certificate</label>
                  <Input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'clubCert')} />
                  {form.docClubCertificateUrl && (
                    <p className="text-xs text-muted-foreground mt-1">Uploaded</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1">Bank Account Number</label>
                  <Input value={form.bankAccountNumber || ''} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">IFSC Code</label>
                  <Input value={form.ifscCode || ''} onChange={(e) => setForm({ ...form, ifscCode: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm mb-1">UPI ID</label>
                  <Input value={form.upiId || ''} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={submitVerification}>Submit for Verification</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <CalendarIcon size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-2xl font-bold">{events.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Users size={24} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Registrations</p>
                    <p className="text-2xl font-bold">
                      {events.reduce((acc, event) => acc + (event.registered || 0), 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <DollarSign size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      ₹{events.reduce((acc, event) => acc + (event.revenue || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                    <TrendingUp size={24} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Fill Rate</p>
                    <p className="text-2xl font-bold">78%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Community Activity Indicator */}
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <CommunityIndicator 
              userId={user?.id} 
              userType="organizer"
            />
          </motion.div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="attendees">Attendees</TabsTrigger>
            <TabsTrigger value="crew">Crew</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">My Events</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download size={14} className="mr-2" />
                  Export
                </Button>
                <Button onClick={() => navigate('/create-event')}>
                  <Plus size={14} className="mr-2" />
                  Create Event
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {(!loading && events.length === 0) && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No events yet. Click "Create Event" to get started.
                  </CardContent>
                </Card>
              )}
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-semibold text-lg">{event.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)} • {new Date(event.date).toLocaleDateString()}
                            </p>
                          </div>
                          {getStatusBadge(event.status, !!event.isDraft)}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewEvent(event.id)}>
                            <Eye size={14} className="mr-2" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/event/${event.id}/community`)}>
                            <MessageCircle size={14} className="mr-2" />
                            Community
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditEvent(event.id)}>
                            <Edit size={14} className="mr-2" />
                            Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleShareEvent(event.id)}>
                            <Share2 size={14} className="mr-2" />
                            Share
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Registrations</span>
                            <span>{event.registered}/{event.capacity}</span>
                          </div>
                          <Progress value={(event.registered / event.capacity) * 100} className="h-2" />
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="text-lg font-semibold">₹{(event.revenue || 0).toLocaleString()}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Fill Rate</p>
                          <p className="text-lg font-semibold">
                            {Math.round((event.registered / event.capacity) * 100)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Community Tab */}
          <TabsContent value="community" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Community Management</h3>
              <Badge className="bg-blue-600">
                <Crown size={12} className="mr-1" />
                Organizer Access
              </Badge>
            </div>

            {events.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No communities yet. Create an event to automatically create its community.
                </CardContent>
              </Card>
            ) : (
            <div className="grid gap-6">
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{event.title}</CardTitle>
                          {event.isDraft ? (
                            <p className="text-sm text-muted-foreground">Draft event</p>
                          ) : null}
                        </div>
                        {getStatusBadge(event.status, !!event.isDraft)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/event/${event.id}/community`)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <MessageCircle size={14} className="mr-2" />
                          Manage Community
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            )}

            {/* Community Features Overview */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100">Community Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h5 className="font-medium">Organizer Privileges</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Megaphone size={14} className="mr-2 text-blue-600" />
                        <span>Post announcements to all members</span>
                      </div>
                      <div className="flex items-center">
                        <Key size={14} className="mr-2 text-purple-600" />
                        <span>Assign community administrators</span>
                      </div>
                      <div className="flex items-center">
                        <Shield size={14} className="mr-2 text-green-600" />
                        <span>Moderate all channels and messages</span>
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-2 text-orange-600" />
                        <span>Manage member permissions</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h5 className="font-medium">Available Channels</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Megaphone size={14} className="mr-2 text-blue-600" />
                        <span>Announcements (organizer-only)</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle size={14} className="mr-2 text-purple-600" />
                        <span>General discussion</span>
                      </div>
                      <div className="flex items-center">
                        <Users size={14} className="mr-2 text-green-600" />
                        <span>Team Formation sub-group</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon size={14} className="mr-2 text-orange-600" />
                        <span>Workshop Queries sub-group</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 size={20} className="mr-2" />
                    Registration Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Chart visualization would be here
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart size={20} className="mr-2" />
                    Event Types Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Pie chart would be here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendees Tab */}
          <TabsContent value="attendees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendee Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Select an event to view attendee details</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crew Tab */}
          <TabsContent value="crew" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Crew Management</h3>
              <Button onClick={handleAddCrewMember}>
                <Plus size={14} className="mr-2" />
                Add Crew Member
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8 text-muted-foreground">
                  <Users size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No crew members added yet</p>
                  <p className="text-sm">Add crew members to help manage your events</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Organization Name</label>
                  <p className="text-sm text-muted-foreground">Tech Club - IIT Delhi</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Email</label>
                  <p className="text-sm text-muted-foreground">tech.club@iitd.ac.in</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Details</label>
                  <p className="text-sm text-muted-foreground">UPI: techclub@paytm • Bank: **** 1234</p>
                </div>
                <Button variant="outline">
                  <Settings size={14} className="mr-2" />
                  Edit Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Floating Theme Toggle */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={toggleTheme}
          size="lg"
          className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200"
          variant="outline"
        >
          {theme === 'dark' ? (
            <Sun size={20} className="text-yellow-500" />
          ) : (
            <Moon size={20} className="text-blue-600" />
          )}
        </Button>
      </div>
    </div>
  );
}