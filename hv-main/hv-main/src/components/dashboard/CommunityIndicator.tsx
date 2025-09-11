import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  Megaphone, 
  Users, 
  TrendingUp,
  Bell,
  Activity
} from 'lucide-react';

interface CommunityActivity {
  eventId: string;
  eventTitle: string;
  unreadAnnouncements: number;
  unreadMessages: number;
  totalMembers: number;
  isActive: boolean;
  lastActivity: Date;
}

interface CommunityIndicatorProps {
  userId?: string;
  userType: 'student' | 'organizer' | 'crew' | 'admin';
  className?: string;
}

export function CommunityIndicator({ userId, userType, className = '' }: CommunityIndicatorProps) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<CommunityActivity[]>([
    {
      eventId: 'evt_techfest2024',
      eventTitle: 'TechFest 2024',
      unreadAnnouncements: 2,
      unreadMessages: 15,
      totalMembers: 245,
      isActive: true,
      lastActivity: new Date(Date.now() - 1000 * 60 * 15) // 15 mins ago
    },
    {
      eventId: 'evt_cultural2024', 
      eventTitle: 'Cultural Extravaganza 2024',
      unreadAnnouncements: 0,
      unreadMessages: 8,
      totalMembers: 156,
      isActive: true,
      lastActivity: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
    },
    {
      eventId: 'evt_hackathon2024',
      eventTitle: 'Code Warriors Hackathon',
      unreadAnnouncements: 1,
      unreadMessages: 23,
      totalMembers: 89,
      isActive: true,
      lastActivity: new Date(Date.now() - 1000 * 60 * 5) // 5 mins ago
    }
  ]);

  const totalUnreadAnnouncements = activities.reduce((sum, activity) => sum + activity.unreadAnnouncements, 0);
  const totalUnreadMessages = activities.reduce((sum, activity) => sum + activity.unreadMessages, 0);
  const totalUnread = totalUnreadAnnouncements + totalUnreadMessages;
  const activeCommunities = activities.filter(a => a.isActive).length;

  const getMostActiveEvent = () => {
    return activities.reduce((mostActive, current) => {
      const currentActivity = current.unreadAnnouncements + current.unreadMessages;
      const mostActiveActivity = mostActive.unreadAnnouncements + mostActive.unreadMessages;
      return currentActivity > mostActiveActivity ? current : mostActive;
    }, activities[0]);
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (activities.length === 0) {
    return null;
  }

  const mostActive = getMostActiveEvent();

  return (
    <div className={className}>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Activity size={18} className="text-blue-600" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Community Activity</h3>
              {totalUnread > 0 && (
                <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Badge>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(`/event/${mostActive.eventId}/community`)}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <MessageCircle size={14} className="text-purple-600" />
                <span className="text-sm font-medium">{activeCommunities}</span>
              </div>
              <p className="text-xs text-muted-foreground">Active Communities</p>
            </div>
            
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Megaphone size={14} className="text-orange-600" />
                <span className="text-sm font-medium">{totalUnreadAnnouncements}</span>
              </div>
              <p className="text-xs text-muted-foreground">New Announcements</p>
            </div>
            
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <TrendingUp size={14} className="text-green-600" />
                <span className="text-sm font-medium">{totalUnreadMessages}</span>
              </div>
              <p className="text-xs text-muted-foreground">New Messages</p>
            </div>
          </div>

          {mostActive && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-white dark:bg-gray-800 rounded-lg border"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm truncate">{mostActive.eventTitle}</h4>
                <div className="flex items-center space-x-1">
                  {mostActive.isActive && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(mostActive.lastActivity)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Users size={12} className="mr-1" />
                    {mostActive.totalMembers}
                  </span>
                  {mostActive.unreadAnnouncements > 0 && (
                    <Badge variant="secondary" className="text-xs h-4">
                      {mostActive.unreadAnnouncements} announcements
                    </Badge>
                  )}
                  {mostActive.unreadMessages > 0 && (
                    <Badge variant="secondary" className="text-xs h-4">
                      {mostActive.unreadMessages} messages
                    </Badge>
                  )}
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => navigate(`/event/${mostActive.eventId}/community`)}
                  className="h-6 px-2 text-xs"
                >
                  Join
                </Button>
              </div>
            </motion.div>
          )}

          {userType === 'organizer' && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                💡 As an organizer, you can post announcements and manage community permissions
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}