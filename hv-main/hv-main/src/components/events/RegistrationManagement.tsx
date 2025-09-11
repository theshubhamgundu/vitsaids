import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Search,
  Download,
  Mail,
  Eye,
  Filter,
  Users,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Label } from '../ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../utils/toast';

interface RegistrationSubmission {
  id: string;
  userId: string;
  eventId: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  formData: Record<string, any>;
  teamMembers?: Array<{
    name: string;
    email: string;
    phone?: string;
    college?: string;
    year?: string;
    role?: string;
    skills?: string[];
  }>;
  user: {
    name: string;
    email: string;
    college?: string;
  };
}

interface RegistrationManagementProps {
  eventId: string;
  eventTitle: string;
}

export function RegistrationManagement({ eventId, eventTitle }: RegistrationManagementProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<RegistrationSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<RegistrationSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<RegistrationSubmission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Placeholder: backend wiring to replace localStorage (no demo/mocks)
  useEffect(() => {
    setLoading(false);
    setSubmissions([]);
  }, [eventId]);

  // Filter submissions based on search and status
  useEffect(() => {
    let filtered = submissions;

    if (searchTerm) {
      filtered = filtered.filter(submission => 
        submission.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.user.college?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(submission => submission.status === statusFilter);
    }

    setFilteredSubmissions(filtered);
  }, [submissions, searchTerm, statusFilter]);

  const updateSubmissionStatus = (submissionId: string, newStatus: 'approved' | 'rejected') => {
    setSubmissions(prev => 
      prev.map(submission => 
        submission.id === submissionId 
          ? { ...submission, status: newStatus }
          : submission
      )
    );
    showToast.success(`Registration ${newStatus}`);
  };

  const exportRegistrations = () => {
    const csvContent = [
      // Headers
      ['Name', 'Email', 'College', 'Status', 'Submitted At', 'Team Size'].join(','),
      // Data
      ...filteredSubmissions.map(submission => [
        submission.user.name,
        submission.user.email,
        submission.user.college || 'N/A',
        submission.status,
        new Date(submission.submittedAt).toLocaleDateString(),
        submission.teamMembers ? submission.teamMembers.length : 1
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventTitle}_registrations.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast.success('Registrations exported successfully');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} className="text-green-600" />;
      case 'rejected': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-yellow-600" />;
    }
  };

  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    teamRegistrations: submissions.filter(s => s.teamMembers && s.teamMembers.length > 1).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Registration Management</h2>
          <p className="text-muted-foreground">Manage registrations for {eventTitle}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportRegistrations}>
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
          <Button variant="outline">
            <Mail size={16} className="mr-2" />
            Email All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Registrations</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <FileText size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock size={24} className="text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-semibold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Registrations</p>
                <p className="text-2xl font-semibold text-purple-600">{stats.teamRegistrations}</p>
              </div>
              <Users size={24} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participant</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Team Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{submission.user.name}</div>
                      <div className="text-sm text-muted-foreground">{submission.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{submission.user.college || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {submission.teamMembers && submission.teamMembers.length > 1 ? (
                        <>
                          <Users size={16} />
                          <span>{submission.teamMembers.length}</span>
                        </>
                      ) : (
                        <>
                          <User size={16} />
                          <span>1</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(submission.status)}
                        <span className="capitalize">{submission.status}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(submission.submittedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye size={14} />
                      </Button>
                      {submission.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredSubmissions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No registrations found</p>
              <p className="text-sm">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Registrations will appear here once people sign up'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registration Details</DialogTitle>
            <DialogDescription>
              Detailed view of registration submission
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* Status and Actions */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(selectedSubmission.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(selectedSubmission.status)}
                      <span className="capitalize">{selectedSubmission.status}</span>
                    </div>
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Submitted on {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                {selectedSubmission.status === 'pending' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        updateSubmissionStatus(selectedSubmission.id, 'approved');
                        setDetailsOpen(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle size={14} className="mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        updateSubmissionStatus(selectedSubmission.id, 'rejected');
                        setDetailsOpen(false);
                      }}
                      className="text-red-600 hover:text-red-700 border-red-200"
                    >
                      <XCircle size={14} className="mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>

              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="responses">Form Responses</TabsTrigger>
                  {selectedSubmission.teamMembers && selectedSubmission.teamMembers.length > 1 && (
                    <TabsTrigger value="team">Team Members</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-medium">Name</Label>
                          <p>{selectedSubmission.user.name}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Email</Label>
                          <p>{selectedSubmission.user.email}</p>
                        </div>
                        <div>
                          <Label className="font-medium">College</Label>
                          <p>{selectedSubmission.user.college || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="font-medium">Phone</Label>
                          <p>{selectedSubmission.formData.phone || 'N/A'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="responses" className="space-y-4">
                  <Card>
                    <CardContent className="p-4">
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {Object.entries(selectedSubmission.formData).map(([key, value]) => {
                            if (['teamMembers'].includes(key)) return null;
                            
                            return (
                              <div key={key} className="border-b pb-3">
                                <Label className="font-medium capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Label>
                                <div className="mt-1">
                                  {Array.isArray(value) ? (
                                    <div className="flex flex-wrap gap-1">
                                      {value.map((item, index) => (
                                        <Badge key={index} variant="outline">{item}</Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-muted-foreground">{value?.toString() || 'N/A'}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {selectedSubmission.teamMembers && selectedSubmission.teamMembers.length > 1 && (
                  <TabsContent value="team" className="space-y-4">
                    <div className="grid gap-4">
                      {selectedSubmission.teamMembers.map((member, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-lg flex items-center space-x-2">
                              <User size={16} />
                              <span>{member.name}</span>
                              {index === 0 && <Badge variant="secondary">Leader</Badge>}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="font-medium">Email</Label>
                              <p className="text-muted-foreground">{member.email}</p>
                            </div>
                            <div>
                              <Label className="font-medium">Phone</Label>
                              <p className="text-muted-foreground">{member.phone || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="font-medium">College</Label>
                              <p className="text-muted-foreground">{member.college || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="font-medium">Year</Label>
                              <p className="text-muted-foreground">{member.year || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="font-medium">Role</Label>
                              <p className="text-muted-foreground">{member.role || 'N/A'}</p>
                            </div>
                            <div>
                              <Label className="font-medium">Skills</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.skills && member.skills.length > 0 ? (
                                  member.skills.map((skill, skillIndex) => (
                                    <Badge key={skillIndex} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-muted-foreground text-sm">None specified</span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

