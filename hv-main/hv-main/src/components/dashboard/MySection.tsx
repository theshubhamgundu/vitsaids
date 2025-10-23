import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Switch } from '../ui/switch';
import { LoadingSpinner } from '../LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseApi, useRealTimeUserRegistrations, Registration, Event } from '../../utils/supabaseApi';
import { 
  Calendar, 
  Ticket, 
  CreditCard, 
  User, 
  Activity, 
  Crown, 
  HelpCircle,
  Download,
  Share2,
  QrCode,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Users,
  MessageCircle,
  Megaphone
} from 'lucide-react';

const mockRegisteredEvents = [
  {
    id: '1',
    title: 'TechFest 2024',
    college: 'IIT Delhi',
    date: '2024-03-15',
    status: 'upcoming',
    hasTicket: true,
    ticketType: 'Digital Pass'
  },
  {
    id: '2',
    title: 'Code Warriors Hackathon',
    college: 'BITS Pilani',
    date: '2024-03-20',
    status: 'upcoming',
    hasTicket: false,
    ticketType: 'Registration'
  }
];

const mockTickets = [
  {
    id: 'T001',
    eventTitle: 'TechFest 2024',
    eventDate: '2024-03-15',
    ticketType: 'General Admission',
    qrCode: 'QR123456789',
    status: 'active',
    downloadUrl: '#'
  }
];

const mockTransactions = [
  {
    id: 'TXN001',
    eventTitle: 'TechFest 2024',
    amount: 299,
    date: '2024-02-15',
    status: 'completed',
    paymentMethod: 'UPI'
  },
  {
    id: 'TXN002',
    eventTitle: 'Cultural Night 2024',
    amount: 150,
    date: '2024-02-20',
    status: 'completed',
    paymentMethod: 'Card'
  }
];

export function MySection() {
  const [activeTab, setActiveTab] = useState('events');
  const { user } = useAuth();
  const { registrations, loading, error } = useRealTimeUserRegistrations(user?.id || null);
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Profile Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg">
                  JD
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-semibold">John Doe</h2>
                <p className="text-muted-foreground">Computer Science • 3rd Year • IIT Delhi</p>
                <div className="flex items-center space-x-4 mt-2 text-sm">
                  <span className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    {mockRegisteredEvents.length} Events
                  </span>
                  <span className="flex items-center">
                    <Ticket size={14} className="mr-1" />
                    {mockTickets.length} Tickets
                  </span>
                  <span className="flex items-center">
                    <Star size={14} className="mr-1" />
                    Member since Feb 2024
                  </span>
                </div>
              </div>
              <Button variant="outline">
                <User size={16} className="mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="events" className="flex items-center space-x-1">
            <Calendar size={14} />
            <span className="hidden sm:inline">Events</span>
          </TabsTrigger>
          <TabsTrigger value="community" className="flex items-center space-x-1">
            <MessageCircle size={14} />
            <span className="hidden sm:inline">Community</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center space-x-1">
            <Ticket size={14} />
            <span className="hidden sm:inline">Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center space-x-1">
            <CreditCard size={14} />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center space-x-1">
            <User size={14} />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-1">
            <Activity size={14} />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">My Events</h3>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <CalendarIcon size={14} className="mr-2" />
                Calendar View
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {mockRegisteredEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <Calendar size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.college}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs flex items-center">
                              <Clock size={12} className="mr-1" />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                            <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {event.hasTicket && (
                          <Button size="sm" variant="outline">
                            <QrCode size={14} className="mr-2" />
                            View Ticket
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/event/${event.id}/community`)}
                          variant="outline"
                          className="mr-2"
                        >
                          <MessageCircle size={14} className="mr-1" />
                          Community
                        </Button>
                        <Button size="sm" onClick={() => navigate(`/event/${event.id}`)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Event Communities</h3>
            <Badge variant="outline">
              {mockRegisteredEvents.length} communities available
            </Badge>
          </div>

          <div className="grid gap-4">
            {mockRegisteredEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                          <MessageCircle size={24} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">{event.college}</p>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className="text-xs flex items-center">
                              <Users size={12} className="mr-1" />
                              156 members
                            </span>
                            <span className="text-xs flex items-center">
                              <Megaphone size={12} className="mr-1" />
                              3 announcements
                            </span>
                            <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                              {event.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/event/${event.id}/community`)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <MessageCircle size={14} className="mr-2" />
                          Join Discussion
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Community Features Info */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-3 text-blue-900 dark:text-blue-100">Community Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <Megaphone size={16} className="mr-2 text-blue-600" />
                  <span>Official announcements from organizers</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle size={16} className="mr-2 text-purple-600" />
                  <span>General discussion with attendees</span>
                </div>
                <div className="flex items-center">
                  <Users size={16} className="mr-2 text-green-600" />
                  <span>Topic-specific sub-groups</span>
                </div>
                <div className="flex items-center">
                  <Crown size={16} className="mr-2 text-yellow-600" />
                  <span>Role-based permissions</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">My Tickets & Passes</h3>
            <Button variant="outline" size="sm">
              <Download size={14} className="mr-2" />
              Download All
            </Button>
          </div>

          <div className="grid gap-4">
            {mockTickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="border-2 border-dashed border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl">
                          <QrCode size={24} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{ticket.eventTitle}</h4>
                          <p className="text-sm text-muted-foreground">{ticket.ticketType}</p>
                          <div className="flex items-center space-x-3 mt-2">
                            <span className="text-xs flex items-center">
                              <CalendarIcon size={12} className="mr-1" />
                              {new Date(ticket.eventDate).toLocaleDateString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              ID: {ticket.id}
                            </Badge>
                            <Badge 
                              variant={ticket.status === 'active' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Share2 size={14} className="mr-2" />
                          Share
                        </Button>
                        <Button size="sm">
                          <Download size={14} className="mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Payment History</h3>
            <Button variant="outline" size="sm">
              <Download size={14} className="mr-2" />
              Export
            </Button>
          </div>

          <div className="grid gap-4">
            {mockTransactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <CreditCard size={20} className="text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{transaction.eventTitle}</h4>
                          <p className="text-sm text-muted-foreground">
                            Paid via {transaction.paymentMethod}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">₹{transaction.amount}</p>
                        <Badge 
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <h3 className="text-lg font-semibold">Profile & Settings</h3>
          
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-sm text-muted-foreground">John Doe</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">john@example.com</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">College</label>
                    <p className="text-sm text-muted-foreground">IIT Delhi</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Year</label>
                    <p className="text-sm text-muted-foreground">3rd Year</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit Information
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified about new events</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Event reminders via SMS</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <h3 className="text-lg font-semibold">Activity & Stats</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg inline-block mb-2">
                  <Calendar size={24} className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Events Attended</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg inline-block mb-2">
                  <Users size={24} className="text-purple-600" />
                </div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Colleges Visited</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg inline-block mb-2">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


      </Tabs>
    </div>
  );
}