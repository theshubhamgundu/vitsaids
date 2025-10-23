import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../utils/toast';
import {
  Bell,
  Calendar,
  CreditCard,
  UserCheck,
  Award,
  AlertCircle,
  CheckCircle,
  X,
  Settings,
  BellRing
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'event' | 'payment' | 'verification' | 'reminder' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSystem({ isOpen, onClose }: NotificationSystemProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  // Mock notifications based on user type
  useEffect(() => {
    if (user) {
      const mockNotifications = generateMockNotifications(user.type);
      setNotifications(mockNotifications);
    }
  }, [user]);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance every 10 seconds
        const newNotification = generateRandomNotification();
        setNotifications(prev => [newNotification, ...prev.slice(0, 19)]); // Keep only 20 latest
        
        // Show toast for high priority notifications
        if (newNotification.priority === 'high') {
          showToast.info(newNotification.title);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const generateMockNotifications = (userType: string): Notification[] => {
    const baseNotifications: Notification[] = [
      {
        id: '1',
        type: 'system',
        title: 'Welcome to FindMyEvent!',
        message: 'Start discovering amazing events from colleges across the country.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        priority: 'medium'
      }
    ];

    if (userType === 'student') {
      baseNotifications.push(
        {
          id: '2',
          type: 'event',
          title: 'New Event: TechFest 2024',
          message: 'A new technology festival has been posted in your area. Registration ends soon!',
          timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
          read: false,
          priority: 'high'
        },
        {
          id: '3',
          type: 'reminder',
          title: 'Event Tomorrow',
          message: 'Don\'t forget about the Cultural Night tomorrow at 7 PM.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          read: true,
          priority: 'high'
        },
        {
          id: '4',
          type: 'payment',
          title: 'Payment Successful',
          message: 'Your payment for Code Warriors Hackathon has been confirmed.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
          read: true,
          priority: 'medium'
        }
      );
    } else if (userType === 'organizer') {
      baseNotifications.push(
        {
          id: '2',
          type: 'verification',
          title: 'Account Verified',
          message: 'Congratulations! Your organizer account has been verified.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          read: false,
          priority: 'high'
        },
        {
          id: '3',
          type: 'event',
          title: '50 New Registrations',
          message: 'Your event "TechFest 2024" received 50 new registrations today.',
          timestamp: new Date(Date.now() - 1000 * 60 * 120),
          read: false,
          priority: 'medium'
        },
        {
          id: '4',
          type: 'payment',
          title: 'Revenue Update',
          message: 'You\'ve earned ₹25,000 from event registrations this week.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          read: true,
          priority: 'medium'
        }
      );
    }

    return baseNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const generateRandomNotification = (): Notification => {
    const types = ['event', 'payment', 'reminder', 'system'];
    const priorities = ['low', 'medium', 'high'];
    const messages = [
      { title: 'New Event Alert', message: 'A new event matching your interests has been posted.' },
      { title: 'Registration Reminder', message: 'Registration for your selected event closes in 24 hours.' },
      { title: 'Payment Processed', message: 'Your payment has been successfully processed.' },
      { title: 'Event Update', message: 'There has been an update to one of your registered events.' }
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    return {
      id: Date.now().toString(),
      type: types[Math.floor(Math.random() * types.length)] as any,
      title: randomMessage.title,
      message: randomMessage.message,
      timestamp: new Date(),
      read: false,
      priority: priorities[Math.floor(Math.random() * priorities.length)] as any
    };
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <Calendar size={16} className="text-blue-600" />;
      case 'payment':
        return <CreditCard size={16} className="text-green-600" />;
      case 'verification':
        return <UserCheck size={16} className="text-purple-600" />;
      case 'reminder':
        return <BellRing size={16} className="text-orange-600" />;
      default:
        return <Bell size={16} className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500';
      case 'medium':
        return 'border-l-yellow-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    showToast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="absolute top-full right-0 mt-2 w-96 z-50"
      >
        <Card className="shadow-lg border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Bell size={20} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex space-x-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread ({unreadCount})
                </Button>
              </div>
              
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No notifications found</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className={`p-4 border-l-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                          getPriorityColor(notification.priority)
                        } ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium truncate">
                                  {notification.title}
                                </h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatTimestamp(notification.timestamp)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X size={12} />
                          </Button>
                        </div>
                      </div>
                      {index < filteredNotifications.length - 1 && <Separator />}
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}