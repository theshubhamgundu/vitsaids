import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Logo } from '../Logo';
import { supabaseApi, getOrganizers } from '../../utils/supabaseApi';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Settings,
  FileText,
  BarChart3,
  LogOut,
  Moon,
  Sun,
  User,
  MessageCircle,
  Megaphone,
  Flag,
  Eye,
  Trash2
} from 'lucide-react';

const platformStats = {
  totalUsers: 0,
  totalOrganizers: 0,
  totalEvents: 0,
  totalRevenue: 0,
  pendingVerifications: 0,
  activeEvents: 0,
  activeCommunities: 0,
  totalMessages: 0,
  reportedContent: 0
};

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('verifications');
  const [organizers, setOrganizers] = useState<Array<{ id:string; name:string; email:string; verificationStatus: 'approved'|'pending'|'rejected'|'unverified' }>>([]);
  const [pending, setPending] = useState<Array<{id:string; userId:string; name:string|null; email:string|null; college:string|null; submittedAt:string; documents:string[];}>>([]);

  const refreshPending = async () => {
    try {
      const list = await supabaseApi.getPendingOrganizerVerifications();
      setPending(list.map(i => ({ id: i.id, userId: i.userId, name: i.name, email: i.email, college: i.college, submittedAt: i.submittedAt, documents: i.documents })));
    } catch {
      setPending([]);
    }
  };

  useEffect(() => {
    // Initial and focus-based refresh
    refreshPending();
    (async () => { const list = await getOrganizers(); setOrganizers(list); })();
    const onFocus = () => { refreshPending(); };
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(() => { refreshPending(); }, 5000);
    return () => { window.removeEventListener('focus', onFocus); window.clearInterval(interval); };
  }, []);

  const handleApproveOrganizer = async (id: string) => {
    if (!window.confirm('Approve this organizer?')) return;
    const item = pending.find(p => p.id === id);
    const userId = item?.userId || id;
    await supabaseApi.reviewOrganizerVerification(userId, 'approved');
    await refreshPending();
    alert('Organizer approved successfully!');
  };

  const handleRejectOrganizer = async (id: string) => {
    const reason = prompt('Please provide a reason for rejection:') || '';
    if (!reason) return;
    const item = pending.find(p => p.id === id);
    const userId = item?.userId || id;
    await supabaseApi.reviewOrganizerVerification(userId, 'rejected', reason);
    await refreshPending();
    alert('Organizer rejected. Email notification sent.');
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-600">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <Badge className="bg-red-600">
                <Shield size={12} className="mr-1" />
                Admin Access
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download size={16} className="mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <Settings size={16} className="mr-2" />
                System Settings
              </Button>
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
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
                        {user?.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start space-x-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-red-600 to orange-600 text-white">
                        {user?.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || 'Admin'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="organizers">Organizers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          {/* Organizers Tab */}
          <TabsContent value="organizers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Organizers</h3>
              <Badge variant="outline">{organizers.length} total</Badge>
            </div>

            {organizers.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No organizers found.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {['pending','approved','rejected','unverified'].map((status) => (
                  <div key={status} className="space-y-2">
                    <h4 className="font-semibold capitalize">{status}</h4>
                    {organizers.filter(o => o.verificationStatus === status).length === 0 ? (
                      <p className="text-sm text-muted-foreground">No {status} organizers.</p>
                    ) : (
                      organizers.filter(o => o.verificationStatus === status).map((o) => (
                        <Card key={o.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{o.name}</p>
                              <p className="text-sm text-muted-foreground">{o.email}</p>
                            </div>
                            <Badge variant={status==='approved' ? 'secondary' : status==='pending' ? 'destructive' : 'outline'} className="capitalize">{status}</Badge>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Pending Organizer Verifications</h3>
              <Badge variant="destructive">{pending.length} pending</Badge>
            </div>

            {pending.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No pending organizers.
                </CardContent>
              </Card>
            ) : (
            <div className="space-y-4">
                {pending.map((organizer) => (
                  <motion.div key={organizer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h4 className="font-semibold">{organizer.name}</h4>
                          <p className="text-sm text-muted-foreground">{organizer.college}</p>
                          <p className="text-sm text-muted-foreground">{organizer.email}</p>
                            <p className="text-xs text-muted-foreground">Submitted: {new Date(organizer.submittedAt).toLocaleString()}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {organizer.documents.map((doc) => (
                                <Badge key={doc} variant="outline" className="text-xs">{doc}</Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleApproveOrganizer(organizer.id)}>
                            <CheckCircle size={14} className="mr-2" />
                            Approve
                          </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleRejectOrganizer(organizer.id)}>
                            <XCircle size={14} className="mr-2" />
                            Reject
                          </Button>
                            <Button size="sm" variant="outline" onClick={refreshPending}>
                            <FileText size={14} className="mr-2" />
                              Refresh
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                Hook up platform events here.
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 size={20} className="mr-2" />
                  Platform Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Analytics here
                  </div>
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