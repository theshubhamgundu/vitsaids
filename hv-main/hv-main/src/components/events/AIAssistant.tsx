import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { 
  Bot, 
  Send, 
  User, 
  Lightbulb, 
  Code, 
  Cpu, 
  Database, 
  Globe,
  MessageCircle,
  Sparkles,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  eventType: string;
  eventTitle: string;
  eventDescription: string;
  isVisible: boolean;
  onClose: () => void;
}

// Mock AI responses for different tech event types
const getAIResponse = (message: string, eventType: string, eventTitle: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // Common tech event responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hi there! I'm your AI assistant for ${eventTitle}. I can help you with technical questions, project ideas, and event details. What would you like to know?`;
  }
  
  if (lowerMessage.includes('project') || lowerMessage.includes('idea')) {
    const ideas = [
      'AI-powered expense tracker with OCR receipt scanning',
      'Smart campus navigation app using augmented reality',
      'Blockchain-based student credential verification system',
      'IoT-enabled smart library management system',
      'Machine learning model for predicting student performance',
      'Sustainable energy monitoring dashboard',
      'Social impact app for connecting volunteers with local NGOs'
    ];
    const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
    return `Here's a project idea for you: ${randomIdea}. Would you like me to explain the technical stack or implementation approach?`;
  }
  
  if (lowerMessage.includes('tech') || lowerMessage.includes('stack') || lowerMessage.includes('technology')) {
    return `For modern web development, I recommend considering: Frontend - React/Vue.js with TypeScript, Backend - Node.js/Python with FastAPI, Database - PostgreSQL/MongoDB, Cloud - AWS/Vercel, and Tools - Docker, Git, CI/CD pipelines. What specific technology are you curious about?`;
  }
  
  if (lowerMessage.includes('api') || lowerMessage.includes('integration')) {
    return `Great APIs to consider: OpenAI for AI features, Stripe for payments, Firebase for real-time data, Twilio for SMS/calls, Google Maps for location services, and GitHub API for code integration. Need help with any specific API implementation?`;
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('stuck')) {
    return `I'm here to help! Try breaking down your problem into smaller parts. Common debugging steps: 1) Check console for errors, 2) Verify API endpoints, 3) Test with sample data, 4) Review documentation. What specific issue are you facing?`;
  }
  
  if (lowerMessage.includes('prize') || lowerMessage.includes('judge')) {
    return `Judges typically look for: Innovation & creativity, Technical implementation quality, User experience design, Problem-solving approach, and Presentation skills. Focus on solving a real problem with clean, scalable code!`;
  }
  
  if (lowerMessage.includes('time') || lowerMessage.includes('deadline')) {
    return `Time management tips: 1) Start with a simple MVP, 2) Plan features by priority, 3) Use frameworks to save time, 4) Test early and often, 5) Prepare your demo in advance. Remember, a working simple solution is better than an incomplete complex one!`;
  }
  
  // Event-specific responses
  if (eventType === 'hackathon') {
    if (lowerMessage.includes('team') || lowerMessage.includes('collaborate')) {
      return `For hackathons, diverse teams work best! Consider having: a frontend developer, backend developer, designer, and a business/domain expert. Use GitHub for collaboration and Slack/Discord for communication. Want tips on dividing tasks?`;
    }
    return `This hackathon is perfect for building innovative solutions! Focus on identifying a real problem, creating a solid MVP, and preparing a compelling demo. Need specific guidance on any aspect?`;
  }
  
  if (eventType === 'workshop' || eventType === 'tech') {
    return `This technical workshop will enhance your skills significantly! Make sure to follow along with hands-on exercises, ask questions during interactive sessions, and connect with other participants. What specific topics interest you most?`;
  }
  
  // Default response
  return `That's an interesting question! While I specialize in technical guidance for this ${eventType}, I'd suggest asking about project ideas, technology stacks, APIs, development best practices, or event-specific tips. How can I help make your experience better?`;
};

export function AIAssistant({ eventType, eventTitle, eventDescription, isVisible, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI assistant for ${eventTitle}. I can help you with technical questions, suggest project ideas, recommend tools and APIs, and provide guidance for this ${eventType}. What would you like to explore?`,
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getAIResponse(inputMessage, eventType, eventTitle),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { label: 'Project Ideas', icon: Lightbulb, message: 'Can you suggest some project ideas?' },
    { label: 'Tech Stack', icon: Code, message: 'What technology stack should I use?' },
    { label: 'APIs', icon: Globe, message: 'What are some useful APIs I can integrate?' },
    { label: 'Best Practices', icon: Sparkles, message: 'What are some development best practices?' }
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          className="w-full max-w-2xl h-[80vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="h-full flex flex-col border-none">
            <CardHeader className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                    <Bot size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Tech Assistant</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      AI-powered guidance for {eventType}s
                    </p>
                  </div>
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  ×
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  <Cpu size={12} className="mr-1" />
                  Tech Events Only
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4 space-y-4">
              {/* Quick Actions */}
              <div className="flex-shrink-0">
                <p className="text-sm text-muted-foreground mb-2">Quick Actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="h-auto p-2 text-left justify-start"
                      onClick={() => setInputMessage(action.message)}
                    >
                      <action.icon size={14} className="mr-2 text-blue-500" />
                      <span className="text-xs">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Messages */}
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[80%] ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`p-2 rounded-lg ${
                          message.type === 'user' 
                            ? 'bg-blue-500' 
                            : 'bg-gradient-to-br from-purple-500 to-blue-600'
                        }`}>
                          {message.type === 'user' ? (
                            <User size={16} className="text-white" />
                          ) : (
                            <Bot size={16} className="text-white" />
                          )}
                        </div>
                        <div className={`p-3 rounded-2xl ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white rounded-br-md'
                            : 'bg-gray-100 dark:bg-gray-800 rounded-bl-md'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          <p className={`text-xs mt-2 opacity-70 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex items-start space-x-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                          <Bot size={16} className="text-white" />
                        </div>
                        <div className="p-3 rounded-2xl rounded-bl-md bg-gray-100 dark:bg-gray-800">
                          <div className="flex items-center space-x-2">
                            <Loader2 size={14} className="animate-spin" />
                            <p className="text-sm text-muted-foreground">AI is thinking...</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="flex-shrink-0 flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about tech, APIs, project ideas..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                >
                  <Send size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}