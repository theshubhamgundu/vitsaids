import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Megaphone, 
  Plus, 
  Heart, 
  MessageSquare, 
  Pin,
  Crown,
  Key,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    role: 'organizer' | 'admin';
  };
  createdAt: Date;
  reactions: {
    likes: number;
    userLiked: boolean;
  };
  isPinned: boolean;
}

interface AnnouncementsChannelProps {
  eventId: string;
  currentUser: {
    id: string;
    name: string;
    role: 'organizer' | 'admin' | 'attendee';
  };
  canPost: boolean;
}

export function AnnouncementsChannel({ eventId, currentUser, canPost }: AnnouncementsChannelProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: '1',
      title: '📢 Venue Updated',
      content: 'Important update: The main event has been moved to Hall 3. Please report to the new venue by 10:00 AM tomorrow. Registration desk will be available from 9:30 AM.',
      author: {
        id: '1',
        name: 'Sarah Chen',
        role: 'organizer'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
      reactions: { likes: 23, userLiked: false },
      isPinned: true
    },
    {
      id: '2',
      title: '🎯 Workshop Schedule Released',
      content: 'The complete workshop schedule is now available. Check your dashboard for personalized recommendations based on your interests. Limited seats available for AI/ML workshop - register ASAP!',
      author: {
        id: '2',
        name: 'Mike Rodriguez',
        role: 'admin'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      reactions: { likes: 45, userLiked: true },
      isPinned: false
    },
    {
      id: '3',
      title: '🍕 Food & Refreshments',
      content: 'Lunch will be served from 12:30 PM to 2:00 PM in the cafeteria. We have vegetarian, vegan, and gluten-free options available. Please mention dietary restrictions at the registration desk.',
      author: {
        id: '1',
        name: 'Sarah Chen',
        role: 'organizer'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      reactions: { likes: 12, userLiked: false },
      isPinned: false
    }
  ]);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleLike = (announcementId: string) => {
    setAnnouncements(prev => prev.map(announcement => {
      if (announcement.id === announcementId) {
        return {
          ...announcement,
          reactions: {
            likes: announcement.reactions.userLiked 
              ? announcement.reactions.likes - 1 
              : announcement.reactions.likes + 1,
            userLiked: !announcement.reactions.userLiked
          }
        };
      }
      return announcement;
    }));
  };

  const handlePin = (announcementId: string) => {
    if (!canPost) return;
    
    setAnnouncements(prev => prev.map(announcement => {
      if (announcement.id === announcementId) {
        return { ...announcement, isPinned: !announcement.isPinned };
      }
      return announcement;
    }));
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    
    setIsCreating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const announcement: Announcement = {
      id: Date.now().toString(),
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role as 'organizer' | 'admin'
      },
      createdAt: new Date(),
      reactions: { likes: 0, userLiked: false },
      isPinned: false
    };

    setAnnouncements(prev => [announcement, ...prev]);
    setNewAnnouncement({ title: '', content: '' });
    setShowCreateDialog(false);
    setIsCreating(false);
  };

  const getRoleIcon = (role: string) => {
    return role === 'organizer' 
      ? <Crown className="w-3 h-3 text-yellow-500" />
      : <Key className="w-3 h-3 text-blue-500" />;
  };

  // Sort announcements - pinned first, then by date
  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
            Announcements
          </CardTitle>
        </div>
        
        {canPost && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-1" />
                Post
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]" aria-describedby="announcement-dialog-description">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription id="announcement-dialog-description">
                  Share important updates and information with all event attendees.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    placeholder="e.g., 📢 Important Update"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Content</label>
                  <Textarea
                    placeholder="Write your announcement here..."
                    rows={4}
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAnnouncement}
                  disabled={isCreating || !newAnnouncement.title.trim() || !newAnnouncement.content.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? 'Posting...' : 'Post Announcement'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>

      {/* Announcements List */}
      <CardContent className="flex-1 space-y-4 overflow-y-auto">
        {sortedAnnouncements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No announcements yet</p>
            {canPost && <p className="text-sm">Be the first to post an update!</p>}
          </div>
        ) : (
          sortedAnnouncements.map((announcement) => (
            <Card 
              key={announcement.id} 
              className={`relative transition-all duration-200 hover:shadow-md ${
                announcement.isPinned 
                  ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                  : 'bg-white dark:bg-gray-800'
              }`}
            >
              {announcement.isPinned && (
                <div className="absolute top-3 right-3">
                  <Pin className="w-4 h-4 text-blue-600 fill-current" />
                </div>
              )}
              
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {announcement.author.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">
                        {announcement.author.name}
                      </span>
                      {getRoleIcon(announcement.author.role)}
                      <Badge 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {announcement.author.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(announcement.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    
                    <h4 className="font-medium text-base mb-2 text-gray-900 dark:text-gray-100">
                      {announcement.title}
                    </h4>
                    
                    <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                      {announcement.content}
                    </p>
                    
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-xs h-7 ${
                          announcement.reactions.userLiked 
                            ? 'text-red-600 bg-red-50 dark:bg-red-900/20' 
                            : 'text-muted-foreground hover:text-red-600'
                        }`}
                        onClick={() => handleLike(announcement.id)}
                      >
                        <Heart className={`w-3 h-3 mr-1 ${
                          announcement.reactions.userLiked ? 'fill-current' : ''
                        }`} />
                        {announcement.reactions.likes}
                      </Button>
                      
                      {canPost && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 text-muted-foreground hover:text-blue-600"
                          onClick={() => handlePin(announcement.id)}
                        >
                          <Pin className={`w-3 h-3 mr-1 ${
                            announcement.isPinned ? 'fill-current text-blue-600' : ''
                          }`} />
                          {announcement.isPinned ? 'Unpin' : 'Pin'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>
    </div>
  );
}