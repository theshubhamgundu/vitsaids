import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { 
  Search, 
  Download, 
  Users, 
  Calendar,
  Mail,
  Phone,
  School,
  Trophy,
  CheckCircle,
  Clock,
  Filter,
  FileText,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { showToast } from '../../utils/toast';
import { supabaseApi } from '../../utils/supabaseApi';

interface RegistrationData {
  userId: string;
  eventId: string;
  formData: Record<string, any>;
  submittedAt: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface RegistrationsListProps {
  eventId: string;
  eventTitle: string;
  eventType: string;
}

export function RegistrationsList({ eventId, eventTitle, eventType }: RegistrationsListProps) {
  const [registrations, setRegistrations] = useState<RegistrationData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [expandedRegistration, setExpandedRegistration] = useState<string | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, [eventId]);

  const loadRegistrations = async () => {
    try {
      const session = await supabaseApi.getCurrentSession();
      if (!session?.user?.id) {
        setRegistrations([]);
        return;
      }
      const data = await supabaseApi.getUserRegistrations(session.user.id);
      const eventRegistrations: RegistrationData[] = data
        .filter(reg => reg.event.id === eventId)
        .map(reg => ({
          userId: reg.userId,
          eventId: reg.eventId,
          formData: (reg as any).formData || {},
          submittedAt: reg.registeredAt,
          status: (reg.status === 'confirmed' ? 'approved' : reg.status === 'cancelled' ? 'rejected' : 'pending') as 'approved' | 'rejected' | 'pending'
        }));
      setRegistrations(eventRegistrations);
    } catch (error) {
      console.error('Error loading registrations:', error);
      showToast.error('Failed to load registrations');
    }
  };

  const updateRegistrationStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      // Placeholder: Implement backend moderation endpoint if needed.
      showToast.info('Status change requires backend endpoint.');
    } catch (error) {
      showToast.error('Failed to update registration status');
    }
  };

  const exportToCSV = () => {
    if (registrations.length === 0) {
      showToast.error('No registrations to export');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'College', 'Submitted At', 'Status'];
    const csvContent = [
      headers.join(','),
      ...registrations.map(reg => [
        reg.formData.participantName || 'N/A',
        reg.formData.email || 'N/A',
        reg.formData.phone || 'N/A',
        reg.formData.college || 'N/A',
        new Date(reg.submittedAt).toLocaleDateString(),
        reg.status || 'pending'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventTitle.replace(/\s+/g, '_')}_registrations.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast.success('Registrations exported successfully');
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = searchTerm === '' || 
      Object.values(reg.formData).some(value => 
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesTab = selectedTab === 'all' || 
      (reg.status || 'pending') === selectedTab;
    
    return matchesSearch && matchesTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
    }
  };

  const renderFieldValue = (key: string, value: any) => {
    if (typeof value === 'boolean') {
      return value ? '✓ Yes' : '✗ No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value || 'N/A');
  };

  const getFieldIcon = (key: string) => {
    if (key.includes('email')) return Mail;
    if (key.includes('phone')) return Phone;
    if (key.includes('college')) return School;
    if (key.includes('team')) return Users;
    return FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Event Registrations</h2>
          <p className="text-muted-foreground">
            {registrations.length} registration{registrations.length !== 1 ? 's' : ''} for {eventTitle}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={registrations.length === 0}>
            <Download size={16} className="mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search registrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({registrations.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({registrations.filter(r => (r.status || 'pending') === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({registrations.filter(r => r.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({registrations.filter(r => r.status === 'rejected').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {filteredRegistrations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No registrations found</h3>
                <p className="text-muted-foreground">
                  {searchTerm 
                    ? 'No registrations match your search criteria.'
                    : 'No one has registered for this event yet.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRegistrations.map((registration, index) => (
                <motion.div
                  key={`${registration.userId}-${registration.submittedAt}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">
                                {registration.formData.participantName || 'Unknown Participant'}
                              </h3>
                              <Badge className={getStatusColor(registration.status || 'pending')}>
                                {(registration.status || 'pending').charAt(0).toUpperCase() + 
                                 (registration.status || 'pending').slice(1)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Mail size={14} />
                              <span>{registration.formData.email || 'No email'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar size={14} />
                              <span>{new Date(registration.submittedAt).toLocaleDateString()}</span>
                            </div>
                            {registration.formData.teamName && (
                              <div className="flex items-center space-x-1">
                                <Users size={14} />
                                <span>{registration.formData.teamName}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {(!registration.status || registration.status === 'pending') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRegistrationStatus(registration.userId, 'approved')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle size={14} className="mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRegistrationStatus(registration.userId, 'rejected')}
                                className="text-red-600 hover:text-red-700"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedRegistration(
                              expandedRegistration === registration.userId ? null : registration.userId
                            )}
                          >
                            {expandedRegistration === registration.userId ? (
                              <ChevronDown size={16} />
                            ) : (
                              <ChevronRight size={16} />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {expandedRegistration === registration.userId && (
                      <CardContent className="pt-0">
                        <Separator className="mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(registration.formData)
                            .filter(([key]) => !['participantName', 'email'].includes(key))
                            .map(([key, value]) => {
                              const FieldIcon = getFieldIcon(key);
                              return (
                                <div key={key} className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <FieldIcon size={14} className="text-muted-foreground" />
                                    <Label className="text-sm font-medium capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </Label>
                                  </div>
                                  <p className="text-sm text-muted-foreground pl-6">
                                    {renderFieldValue(key, value)}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for field labels
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}