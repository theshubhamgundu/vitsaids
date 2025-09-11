import { useState } from 'react';
import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { 
  Settings, 
  Users, 
  MessageSquare, 
  Shield, 
  UserPlus,
  UserMinus,
  Trash2,
  Search,
  MoreHorizontal,
  Crown,
  Key,
  User,
  VolumeX,
  Ban,
  Archive,
  Plus,
  X
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'organizer' | 'admin' | 'attendee';
  joinedAt: Date;
  lastActive: Date;
  messageCount: number;
  isOnline: boolean;
  isMuted?: boolean;
  isBanned?: boolean;
}

interface SubGroup {
  id: string;
  name: string;
  description: string;
  emoji: string;
  memberCount: number;
  createdAt: Date;
}

interface AdminToolsProps {
  eventId: string;
  currentUser: {
    id: string;
    name: string;
    role: 'organizer' | 'admin' | 'attendee';
  };
  onClose: () => void;
}

export function AdminTools({ eventId, currentUser, onClose }: AdminToolsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    emoji: '💬'
  });
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      role: 'organizer',
      joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      lastActive: new Date(Date.now() - 1000 * 60 * 30),
      messageCount: 45,
      isOnline: true
    },
    {
      id: '2',
      name: 'Mike Rodriguez',
      email: 'mike@example.com',
      role: 'admin',
      joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
      lastActive: new Date(Date.now() - 1000 * 60 * 15),
      messageCount: 32,
      isOnline: true
    },
    {
      id: '3',
      name: 'Alex Kumar',
      email: 'alex@example.com',
      role: 'attendee',
      joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      lastActive: new Date(Date.now() - 1000 * 60 * 60 * 2),
      messageCount: 18,
      isOnline: false
    },
    {
      id: '4',
      name: 'Jessica Park',
      email: 'jessica@example.com',
      role: 'attendee',
      joinedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      lastActive: new Date(Date.now() - 1000 * 60 * 45),
      messageCount: 28,
      isOnline: true
    }
  ]);

  const [subGroups, setSubGroups] = useState<SubGroup[]>([
    {
      id: '1',
      name: 'Team Formation',
      description: 'Find teammates and form groups',
      emoji: '🧑‍💻',
      memberCount: 45,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
    },
    {
      id: '2',
      name: 'Workshop Queries',
      description: 'Questions about workshops and sessions',
      emoji: '🎤',
      memberCount: 32,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24)
    }
  ]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePromoteUser = (userId: string) => {
    if (currentUser.role !== 'organizer') return;
    
    setUsers(prev => prev.map(user => 
      user.id === userId && user.role === 'attendee'
        ? { ...user, role: 'admin' as const }
        : user
    ));
  };

  const handleDemoteUser = (userId: string) => {
    if (currentUser.role !== 'organizer') return;
    
    setUsers(prev => prev.map(user => 
      user.id === userId && user.role === 'admin'
        ? { ...user, role: 'attendee' as const }
        : user
    ));
  };

  const handleMuteUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, isMuted: !user.isMuted }
        : user
    ));
  };

  const handleBanUser = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, isBanned: !user.isBanned }
        : user
    ));
  };

  const handleCreateGroup = () => {
    if (!newGroupData.name.trim()) return;
    
    const newGroup: SubGroup = {
      id: Date.now().toString(),
      name: newGroupData.name,
      description: newGroupData.description,
      emoji: newGroupData.emoji,
      memberCount: 0,
      createdAt: new Date()
    };

    setSubGroups(prev => [...prev, newGroup]);
    setNewGroupData({ name: '', description: '', emoji: '💬' });
    setShowCreateGroup(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    setSubGroups(prev => prev.filter(group => group.id !== groupId));
  };

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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'organizer':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const canPromoteDemote = currentUser.role === 'organizer';
  const canModerate = currentUser.role === 'organizer' || currentUser.role === 'admin';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
            Admin Tools
          </CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>

      {/* Content */}
      <CardContent className="flex-1 overflow-hidden">
        <Tabs defaultValue="users" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="moderation" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Moderation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="flex-1 space-y-4 overflow-hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* User List */}
            <div className="space-y-3 overflow-y-auto flex-1">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{user.name}</span>
                        {getRoleIcon(user.role)}
                        <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </Badge>
                        {user.isMuted && (
                          <Badge variant="destructive" className="text-xs">
                            <VolumeX className="w-3 h-3 mr-1" />
                            Muted
                          </Badge>
                        )}
                        {user.isBanned && (
                          <Badge variant="destructive" className="text-xs">
                            <Ban className="w-3 h-3 mr-1" />
                            Banned
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {user.email} • {user.messageCount} messages
                      </p>
                    </div>
                  </div>

                  {user.id !== currentUser.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canPromoteDemote && user.role === 'attendee' && (
                          <DropdownMenuItem onClick={() => handlePromoteUser(user.id)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Promote to Admin
                          </DropdownMenuItem>
                        )}
                        {canPromoteDemote && user.role === 'admin' && (
                          <DropdownMenuItem onClick={() => handleDemoteUser(user.id)}>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Demote to Attendee
                          </DropdownMenuItem>
                        )}
                        {canModerate && (
                          <>
                            <DropdownMenuItem onClick={() => handleMuteUser(user.id)}>
                              <VolumeX className="w-4 h-4 mr-2" />
                              {user.isMuted ? 'Unmute' : 'Mute'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleBanUser(user.id)}
                              className="text-red-600 dark:text-red-400"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              {user.isBanned ? 'Unban' : 'Ban'}
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="groups" className="flex-1 space-y-4 overflow-hidden">
            {/* Create Group Button */}
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Sub-Groups ({subGroups.length})</h3>
              <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby="create-group-description">
                  <DialogHeader>
                    <DialogTitle>Create Sub-Group</DialogTitle>
                    <DialogDescription id="create-group-description">
                      Create a new sub-group for focused discussions within your event community.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Group Name</label>
                      <Input
                        placeholder="e.g., Mentorship Hub"
                        value={newGroupData.name}
                        onChange={(e) => setNewGroupData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Emoji</label>
                      <Input
                        placeholder="💬"
                        value={newGroupData.emoji}
                        onChange={(e) => setNewGroupData(prev => ({ ...prev, emoji: e.target.value }))}
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Description</label>
                      <Textarea
                        placeholder="What is this group for?"
                        value={newGroupData.description}
                        onChange={(e) => setNewGroupData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateGroup}
                      disabled={!newGroupData.name.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Groups List */}
            <div className="space-y-3 overflow-y-auto flex-1">
              {subGroups.map((group) => (
                <div key={group.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{group.emoji}</div>
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <p className="text-xs text-muted-foreground">
                        {group.description} • {group.memberCount} members
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDeleteGroup(group.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="moderation" className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Community Guidelines
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Ensure all members follow respectful communication and stay on topic.
                </p>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Archive Event
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                  Close all channels and archive this community after the event.
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Archive className="w-4 h-4 mr-1" />
                  Archive Community
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </div>
  );
}