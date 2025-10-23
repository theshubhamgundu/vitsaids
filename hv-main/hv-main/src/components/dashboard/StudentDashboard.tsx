import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { EventCard } from './EventCard';
import { EventFilters } from './EventFilters';
import { MySection } from './MySection';
import { NotificationSystem } from '../notifications/NotificationSystem';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Search, Filter, Calendar, MapPin, User, Bell, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { supabaseApi, Event, useRealTimeEvents } from '../../utils/supabaseApi';
import { LoadingSpinner } from '../LoadingSpinner';
import { Logo } from '../Logo';
import { CommunityIndicator } from './CommunityIndicator';
import { ApiStatusIndicator } from '../ApiStatusIndicator';
import { SupabaseConnectionTest } from '../SupabaseConnectionTest';



export function StudentDashboard() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [filters, setFilters] = useState({
    college: '',
    eventType: '',
    dateRange: '',
    priceRange: '',
    distance: ''
  });

  // Use real-time events hook
  const { events, loading, error, refetch, usingFallback } = useRealTimeEvents(user?.id);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo size="md" showText={true} />
              <ApiStatusIndicator usingFallback={usingFallback} />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative"
                >
                  <Bell size={16} className="mr-2" />
                  Notifications
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    3
                  </Badge>
                </Button>
                <NotificationSystem 
                  isOpen={showNotifications} 
                  onClose={() => setShowNotifications(false)} 
                />
              </div>
              
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
        <Tabs defaultValue="discover" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="discover" className="flex items-center space-x-2">
              <Search size={16} />
              <span>Discover Events</span>
            </TabsTrigger>
            <TabsTrigger value="my-section" className="flex items-center space-x-2">
              <User size={16} />
              <span>My Section</span>
            </TabsTrigger>
          </TabsList>

          {/* Discover Events Tab */}
          <TabsContent value="discover" className="space-y-6">
            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
            >
              <h2 className="text-xl font-semibold mb-2">Welcome back, Student!</h2>
              <p className="text-muted-foreground">
                Discover amazing events from colleges across the country. Your personalized recommendations are ready!
              </p>
              {/* Removed demo fallback message */}
            </motion.div>

            {/* Supabase Connection Test */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center"
            >
              <SupabaseConnectionTest />
            </motion.div>

            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search events, colleges, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter size={16} />
                <span>Filters</span>
              </Button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <EventFilters filters={filters} onFiltersChange={setFilters} />
              </motion.div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Calendar size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-xl font-semibold">12 Events</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <MapPin size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nearby</p>
                    <p className="text-xl font-semibold">8 Events</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <User size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">For You</p>
                    <p className="text-xl font-semibold">5 Events</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Community Activity Indicator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <CommunityIndicator 
                userId={user?.id} 
                userType="student"
              />
            </motion.div>

            {/* Events Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {searchQuery ? `Search Results (${filteredEvents.length})` : 'Recommended Events'}
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <EventCard event={event} />
                    </motion.div>
                  ))}
                </div>
              )}

              {filteredEvents.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-gray-400 mb-4">
                    <Search size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No events found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or filters
                  </p>
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* My Section Tab */}
          <TabsContent value="my-section">
            <MySection />
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