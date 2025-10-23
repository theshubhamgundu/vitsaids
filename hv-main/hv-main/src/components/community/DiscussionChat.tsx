import { useState, useEffect, useRef } from 'react';
import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { 
  MessageCircle, 
  Send, 
  Reply, 
  MoreHorizontal,
  Trash2,
  Pin,
  Crown,
  Key,
  User,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    role: 'organizer' | 'admin' | 'attendee';
  };
  createdAt: Date;
  replyTo?: {
    id: string;
    author: string;
    content: string;
  };
  isPinned?: boolean;
}

interface DiscussionChatProps {
  eventId: string;
  channelId: string;
  currentUser: {
    id: string;
    name: string;
    role: 'organizer' | 'admin' | 'attendee';
  };
  canModerate: boolean;
}

export function DiscussionChat({ eventId, channelId, currentUser, canModerate }: DiscussionChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '❓ Where do we submit our projects for judging?',
      author: {
        id: '2',
        name: 'Alex Kumar',
        role: 'attendee'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 45) // 45 mins ago
    },
    {
      id: '2',
      content: '📍 At the registration desk in Hall 2. Make sure to submit before 5 PM today!',
      author: {
        id: '3',
        name: 'Jessica Park',
        role: 'admin'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 40), // 40 mins ago
      replyTo: {
        id: '1',
        author: 'Alex Kumar',
        content: '❓ Where do we submit our projects for judging?'
      }
    },
    {
      id: '3',
      content: 'Thanks! Just submitted our project. The demo looks awesome 🚀',
      author: {
        id: '2',
        name: 'Alex Kumar',
        role: 'attendee'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 35) // 35 mins ago
    },
    {
      id: '4',
      content: 'Is anyone else having trouble with the WiFi in Hall 1? 📶',
      author: {
        id: '4',
        name: 'Priya Sharma',
        role: 'attendee'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 20) // 20 mins ago
    },
    {
      id: '5',
      content: 'Hey everyone! The WiFi password for Hall 1 has been updated. Check with the volunteers for the new password. Sorry for the inconvenience! 🔧',
      author: {
        id: '1',
        name: 'Sarah Chen',
        role: 'organizer'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      isPinned: true
    },
    {
      id: '6',
      content: 'Perfect timing! Just got the new password. Working great now, thanks! 👍',
      author: {
        id: '4',
        name: 'Priya Sharma',
        role: 'attendee'
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 10) // 10 mins ago
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      author: currentUser,
      createdAt: new Date(),
      replyTo: replyingTo ? {
        id: replyingTo.id,
        author: replyingTo.author.name,
        content: replyingTo.content
      } : undefined
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handlePin = (messageId: string) => {
    if (!canModerate) return;
    
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isPinned: !msg.isPinned }
        : msg
    ));
  };

  const handleDelete = (messageId: string) => {
    if (!canModerate) return;
    
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'organizer':
        return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'admin':
        return <Key className="w-3 h-3 text-blue-500" />;
      default:
        return <User className="w-3 h-3 text-gray-500" />;
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

  // Sort messages - pinned first, then by date
  const sortedMessages = [...messages].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="flex-row items-center space-y-0 pb-4">
        <MessageCircle className="w-5 h-5 text-blue-600 mr-2" />
        <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
          General Chat
        </CardTitle>
        <span className="ml-auto text-sm text-muted-foreground">
          {messages.length} messages
        </span>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {sortedMessages.map((message) => (
          <div 
            key={message.id} 
            className={`flex gap-3 group ${
              message.isPinned ? 'bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-200 dark:border-blue-800' : ''
            }`}
          >
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {message.author.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">
                  {message.author.name}
                </span>
                {getRoleIcon(message.author.role)}
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getRoleBadgeColor(message.author.role)}`}
                >
                  {message.author.role}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(message.createdAt, { addSuffix: true })}
                </span>
                {message.isPinned && (
                  <Pin className="w-3 h-3 text-blue-600 fill-current" />
                )}
              </div>

              {message.replyTo && (
                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded mb-2 text-xs border-l-2 border-blue-400">
                  <div className="font-medium text-blue-600 dark:text-blue-400">
                    Replying to {message.replyTo.author}
                  </div>
                  <div className="text-muted-foreground truncate">
                    {message.replyTo.content}
                  </div>
                </div>
              )}

              <p className="text-sm leading-relaxed break-words">
                {message.content}
              </p>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleReply(message)}>
                    <Reply className="w-3 h-3 mr-2" />
                    Reply
                  </DropdownMenuItem>
                  {canModerate && (
                    <>
                      <DropdownMenuItem onClick={() => handlePin(message.id)}>
                        <Pin className="w-3 h-3 mr-2" />
                        {message.isPinned ? 'Unpin' : 'Pin'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(message.id)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="text-xs">
              <span className="text-blue-600 dark:text-blue-400">
                Replying to {replyingTo.author.name}:
              </span>
              <span className="text-muted-foreground ml-2 truncate">
                {replyingTo.content}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0"
              onClick={() => setReplyingTo(null)}
            >
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}