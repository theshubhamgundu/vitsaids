import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { NotificationSystem } from '../notifications/NotificationSystem';
import { QRScanner } from '../crew/QRScanner';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Logo } from '../Logo';
import { 
  Calendar, 
  Users, 
  QrCode, 
  CheckCircle, 
  Clock,
  Search,
  User,
  MapPin,
  Camera,
  Settings,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';

const assignedEvents = [
  {
    id: '1',
    title: 'TechFest 2024',
    date: '2024-03-15',
    location: 'Main Campus',
    role: 'Entry Scanner',
    attendees: 245,
    checkedIn: 180
  },
  {
    id: '2',
    title: 'Cultural Night',
    date: '2024-03-18',
    location: 'Auditorium',
    role: 'Registration Desk',
    attendees: 150,
    checkedIn: 0
  }
];

const mockAttendees = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    ticketId: 'T001',
    status: 'checked-in',
    checkInTime: '2024-03-15T10:30:00'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    ticketId: 'T002',
    status: 'registered',
    checkInTime: null
  }
];

export function CrewDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(assignedEvents[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const filteredAttendees = mockAttendees.filter(attendee =>
    attendee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    attendee.ticketId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="md" showText={true} />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Crew Dashboard
              </h1>
              <Badge variant="secondary">
                Assigned to {assignedEvents.length} events
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowScanner(!showScanner)}
                className="flex items-center"
              >
                <Camera size={16} className="mr-2" />
                {showScanner ? 'Close Scanner' : 'QR Scanner'}
              </Button>
              
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
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start space-x-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        {user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
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
                  <DropdownMenuItem onClick={logout} className="text-red-600">
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
        {/* Event Selector */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Assigned Events</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedEvents.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card 
                  className={`cursor-pointer transition-all ${
                    selectedEvent.id === event.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center">
                            <Calendar size={12} className="mr-1" />
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <MapPin size={12} className="mr-1" />
                            {event.location}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2">
                          {event.role}
                        </Badge>
                        <div className="text-sm">
                          <span className="font-medium">{event.checkedIn}</span>
                          <span className="text-muted-foreground">/{event.attendees}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* QR Scanner */}
        {showScanner && (
          <QRScanner 
            onClose={() => setShowScanner(false)}
            onScanSuccess={(ticket, event, user) => {
              console.log('Scan successful:', { ticket, event, user });
              // Update attendee status in real application
            }}
          />
        )}

        {/* Attendee List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users size={20} className="mr-2" />
                {selectedEvent.title} - Attendees
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedEvent.checkedIn} of {selectedEvent.attendees} checked in
                </span>
                <Badge variant={selectedEvent.checkedIn > 0 ? 'default' : 'secondary'}>
                  {Math.round((selectedEvent.checkedIn / selectedEvent.attendees) * 100)}% Complete
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search attendees by name, email, or ticket ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Attendee List */}
            <div className="space-y-3">
              {filteredAttendees.map((attendee) => (
                <motion.div
                  key={attendee.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div>
                      <h5 className="font-medium">{attendee.name}</h5>
                      <p className="text-sm text-muted-foreground">{attendee.email}</p>
                      <p className="text-xs text-muted-foreground">Ticket: {attendee.ticketId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {attendee.status === 'checked-in' ? (
                      <div className="text-right">
                        <Badge className="bg-green-600 mb-1">
                          <CheckCircle size={12} className="mr-1" />
                          Checked In
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(attendee.checkInTime!).toLocaleTimeString()}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="outline">
                        <Clock size={12} className="mr-1" />
                        Registered
                      </Badge>
                    )}
                    
                    {attendee.status === 'registered' && (
                      <Button size="sm" variant="outline">
                        Check In
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredAttendees.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No attendees found</p>
                {searchQuery && (
                  <p className="text-sm">Try adjusting your search terms</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
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