import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AnnouncementsChannel } from './AnnouncementsChannel';
import { DiscussionChat } from './DiscussionChat';
import { SubGroupChat } from './SubGroupChat';
import { AdminTools } from './AdminTools';
import { UserRoleManager } from './UserRoleManager';
import { Separator } from '../ui/separator';
import { NavigationHeader } from '../NavigationHeader';
import { 
  Megaphone, 
  MessageCircle, 
  Users, 
  Settings, 
  Plus,
  Crown,
  Key,
  User
} from 'lucide-react';

interface EventCommunityProps {}

interface UserRole {
  id: string;
  name: string;
  email: string;
  role: 'organizer' | 'admin' | 'attendee';
  joinedAt: Date;
}

interface SubGroup {
  id: string;
  name: string;
  description: string;
  emoji: string;
  memberCount: number;
  lastActivity: Date;
}

export function EventCommunityPage({}: EventCommunityProps) {
  const { eventId } = useParams();
  const [currentUser, setCurrentUser] = useState<UserRole>({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'organizer', // Demo as organizer
    joinedAt: new Date()
  });
  
  const [eventDetails, setEventDetails] = useState({
    id: eventId || '1',
    title: 'HackX 2025 Hyderabad',
    organizer: 'Tech Innovators Club',
    totalMembers: 156,
    onlineMembers: 23
  });

  const [subGroups, setSubGroups] = useState<SubGroup[]>([
    {
      id: '1',
      name: 'Team Formation',
      description: 'Find teammates and form groups',
      emoji: '🧑‍💻',
      memberCount: 45,
      lastActivity: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
    },
    {
      id: '2',
      name: 'Workshop Queries',
      description: 'Questions about workshops and sessions',
      emoji: '🎤',
      memberCount: 32,
      lastActivity: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
    },
    {
      id: '3',
      name: 'Travel Coordination',
      description: 'Coordinate travel and accommodation',
      emoji: '🚖',
      memberCount: 28,
      lastActivity: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    },
    {
      id: '4',
      name: 'Networking',
      description: 'Off-topic discussions and networking',
      emoji: '🎉',
      memberCount: 67,
      lastActivity: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
    }
  ]);

  const [activeTab, setActiveTab] = useState('announcements');
  const [showAdminTools, setShowAdminTools] = useState(false);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'organizer':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Key className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      organizer: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      attendee: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    };
    
    return (
      <Badge variant="secondary" className={variants[role as keyof typeof variants]}>
        <span className="flex items-center gap-1">
          {getRoleIcon(role)}
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </span>
      </Badge>
    );
  };

  const canModerate = currentUser.role === 'organizer' || currentUser.role === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <NavigationHeader 
        title={`${eventDetails.title} Community`}
        backPath={`/event/${eventId}`}
      />
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Card className="shadow-sm border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                    {eventDetails.title}
                  </CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Organized by {eventDetails.organizer}
                  </p>
                </div>
                <div className="text-right">
                  {getRoleBadge(currentUser.role)}
                  <div className="text-sm text-muted-foreground mt-2">
                    <span className="text-green-600 dark:text-green-400">
                      {eventDetails.onlineMembers} online
                    </span>
                    {' · '}
                    {eventDetails.totalMembers} members
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Channels List */}
          <div className="lg:col-span-1">
            <Card className="shadow-sm border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
                  Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeTab === 'announcements' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('announcements')}
                >
                  <Megaphone className="w-4 h-4 mr-2" />
                  Announcements
                </Button>
                
                <Button
                  variant={activeTab === 'general' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('general')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  General Chat
                </Button>

                <Separator className="my-3" />
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Sub-Groups</span>
                  {canModerate && (
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Plus className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                {subGroups.map((group) => (
                  <Button
                    key={group.id}
                    variant={activeTab === `group-${group.id}` ? 'default' : 'ghost'}
                    className="w-full justify-start text-left"
                    onClick={() => setActiveTab(`group-${group.id}`)}
                  >
                    <span className="mr-2">{group.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{group.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {group.memberCount} members
                      </div>
                    </div>
                  </Button>
                ))}

                {canModerate && (
                  <>
                    <Separator className="my-3" />
                    <Button
                      variant={showAdminTools ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => setShowAdminTools(!showAdminTools)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Admin Tools
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="shadow-sm border-0 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm min-h-[600px]">
              {activeTab === 'announcements' && (
                <AnnouncementsChannel 
                  eventId={eventDetails.id}
                  currentUser={currentUser}
                  canPost={canModerate}
                />
              )}
              
              {activeTab === 'general' && (
                <DiscussionChat 
                  eventId={eventDetails.id}
                  channelId="general"
                  currentUser={currentUser}
                  canModerate={canModerate}
                />
              )}
              
              {activeTab.startsWith('group-') && (
                <SubGroupChat 
                  eventId={eventDetails.id}
                  groupId={activeTab.replace('group-', '')}
                  group={subGroups.find(g => g.id === activeTab.replace('group-', ''))}
                  currentUser={currentUser}
                  canModerate={canModerate}
                />
              )}
              
              {showAdminTools && canModerate && (
                <AdminTools 
                  eventId={eventDetails.id}
                  currentUser={currentUser}
                  onClose={() => setShowAdminTools(false)}
                />
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}