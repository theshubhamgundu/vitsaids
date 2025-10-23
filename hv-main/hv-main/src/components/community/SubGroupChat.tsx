import { useState, useEffect, useRef } from 'react';
import { CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { 
  Send, 
  Reply, 
  MoreHorizontal,
  Trash2,
  Pin,
  Users,
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

interface SubGroup {
  id: string;
  name: string;
  description: string;
  emoji: string;
  memberCount: number;
  lastActivity: Date;
}

interface SubGroupChatProps {
  eventId: string;
  groupId: string;
  group?: SubGroup;
  currentUser: {
    id: string;
    name: string;
    role: 'organizer' | 'admin' | 'attendee';
  };
  canModerate: boolean;
}

export function SubGroupChat({ eventId, groupId, group, currentUser, canModerate }: SubGroupChatProps) {
  // Sample messages based on group type
  const getInitialMessages = (): Message[] => {
    switch (group?.name) {
      case 'Team Formation':
        return [
          {
            id: '1',
            content: 'Looking for 2 more developers for a fintech project! We have a designer and PM already. DM me if interested! 💻',
            author: { id: '2', name: 'Rahul Mehta', role: 'attendee' },
            createdAt: new Date(Date.now() - 1000 * 60 * 30)
          },
          {
            id: '2',
            content: 'I\'m a full-stack developer with React/Node experience. Would love to join! 🚀',
            author: { id: '3', name: 'Ananya Singh', role: 'attendee' },
            createdAt: new Date(Date.now() - 1000 * 60 * 25),
            replyTo: { id: '1', author: 'Rahul Mehta', content: 'Looking for 2 more developers for a fintech project!' }
          }
        ];
      case 'Workshop Queries':
        return [
          {
            id: '1',
            content: '🎤 What prerequisites do we need for the ML workshop tomorrow?',
            author: { id: '2', name: 'Kevin Chen', role: 'attendee' },
            createdAt: new Date(Date.now() - 1000 * 60 * 40)
          },
          {
            id: '2',
            content: 'Basic Python knowledge and bring your laptop with Python 3.8+ installed. We\'ll provide the dataset! 📊',
            author: { id: '3', name: 'Dr. Sarah Wilson', role: 'admin' },
            createdAt: new Date(Date.now() - 1000 * 60 * 35),
            isPinned: true
          }
        ];
      case 'Travel Coordination':
        return [
          {
            id: '1',
            content: '🚖 Anyone traveling from Bangalore? Looking to share a cab from the airport!',
            author: { id: '2', name: 'Pooja Nair', role: 'attendee' },
            createdAt: new Date(Date.now() - 1000 * 60 * 60)
          },
          {
            id: '2',
            content: 'I\'ll be landing at 2 PM tomorrow. Happy to share! DM me your flight details 🛬',
            author: { id: '3', name: 'Vikram Joshi', role: 'attendee' },
            createdAt: new Date(Date.now() - 1000 * 60 * 50)
          }
        ];
      default:
        return [
          {
            id: '1',
            content: '🎉 This hackathon energy is incredible! Met so many amazing people already!',
            author: { id: '2', name: 'Maya Patel', role: 'attendee' },
            createdAt: new Date(Date.now() - 1000 * 60 * 20)
          }
        ];
    }
  };

  const [messages, setMessages] = useState<Message[]>(getInitialMessages());
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
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{group?.emoji}</span>
          <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
            {group?.name || 'Sub-Group'}
          </CardTitle>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{group?.memberCount || 0} members</span>
        </div>
      </CardHeader>

      {/* Group Description */}
      {group?.description && (
        <div className="px-6 pb-4">
          <p className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg">
            {group.description}
          </p>
        </div>
      )}

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {sortedMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">{group?.emoji || '💬'}</div>
            <p>No messages in {group?.name || 'this group'} yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          sortedMessages.map((message) => (
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
          ))
        )}
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
            placeholder={`Message ${group?.name || 'group'}...`}
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