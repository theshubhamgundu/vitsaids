import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  IndianRupee,
  Heart,
  Share2,
  Star,
  Trophy,
  Gift,
  CheckCircle,
  AlertCircle,
  Bot,
  Sparkles,
  MessageCircle,
  Eye
} from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { PaymentInterface } from '../payments/PaymentInterface';
import { LoadingSpinner } from '../LoadingSpinner';
import type { Event } from '../../utils/supabaseApi';
import { supabaseApi } from '../../utils/supabaseApi';
import { showToast } from '../../utils/toast';
import { useAuth } from '../../contexts/AuthContext';
import { EventRegistrationForm, getDefaultRegistrationConfig, RegistrationFormConfig } from './EventRegistrationForm';
import { AIAssistant } from './AIAssistant';

export function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isRegistrationFormOpen, setIsRegistrationFormOpen] = useState(false);
  const [registrationConfig, setRegistrationConfig] = useState<RegistrationFormConfig | null>(null);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  useEffect(() => {
    async function fetchEvent() {
      if (!id) {
        console.error('No event ID provided in URL');
        setLoading(false);
        return;
      }

      // Basic validation for event ID
      if (id.length > 50 || id.includes('<') || id.includes('>')) {
        console.error('Invalid event ID format:', id);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching event with ID:', id);
        const eventData = await supabaseApi.getEvent(id);
        if (eventData) {
          setEvent(eventData);
          // Load registration configuration
          setRegistrationConfig(getDefaultRegistrationConfig(eventData.type));
          console.log('Successfully loaded event:', eventData.title);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        // Only show toast for unexpected errors, not for "not found" which has its own UI
        if (!error.message?.includes('not found')) {
          showToast.error('Failed to load event details');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchEvent();
  }, [id]);

  const handleRegistration = async () => {
    if (!event || !user) return;

    // For hackathons, ideathons, and workshops, show registration form
    if (['hackathon', 'ideathon', 'workshop'].includes(event.type)) {
      setIsRegistrationFormOpen(true);
      return;
    }

    // For other events, proceed with simple registration
    if (event.price === 0) {
      try {
        await supabaseApi.registerForEvent(user.id, event.id);
        setIsRegistered(true);
      } catch (error) {
        showToast.error('Registration failed');
      }
    } else {
      setIsPaymentOpen(true);
    }
  };

  const handleRegistrationSubmit = async (formData: any) => {
    if (!event || !user) return;

    try {
      console.log('Submitting registration with data:', formData);
      
      // Extract team information from form data
      const { teamRegistrationType, teamMembers, ...restFormData } = formData;
      
      // Store registration data (in a real app, this would go to the backend)
      const registrationData = {
        userId: user.id,
        eventId: event.id,
        formData: restFormData,
        teamRegistrationType,
        teamMembers,
        submittedAt: new Date().toISOString()
      };
      
      // Persist through backend only (no localStorage)

      // Complete registration through API
      if (event.price === 0) {
        // Send full registration data to backend
        await supabaseApi.registerForEvent(user.id, event.id, restFormData, teamRegistrationType, teamMembers);
        setIsRegistered(true);
        setIsRegistrationFormOpen(false);
        
        if (teamRegistrationType === 'create') {
          showToast.success('Team created and registration completed successfully!');
        } else if (teamRegistrationType === 'join') {
          showToast.success('Successfully joined team and completed registration!');
        } else {
          showToast.success('Registration completed successfully!');
        }
      } else {
        setIsRegistrationFormOpen(false);
        setIsPaymentOpen(true);
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast.error('Registration failed. Please try again.');
    }
  };

  const handlePaymentSuccess = async () => {
    if (!event || !user) return;
    
    try {
      await supabaseApi.registerForEvent(user.id, event.id);
      setIsRegistered(true);
      setIsPaymentOpen(false);
    } catch (error) {
      showToast.error('Registration failed after payment');
    }
  };

  const handleShare = async () => {
    if (!event) return;

    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title} at ${event.college}`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        showToast.success('Event shared successfully!');
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          showToast.success('Event link copied to clipboard!');
        } catch (clipboardError) {
          console.log('Failed to copy to clipboard:', clipboardError);
          // Fallback: create a text area and select the text
          const textArea = document.createElement('textarea');
          textArea.value = window.location.href;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            showToast.success('Event link copied to clipboard!');
          } catch (fallbackError) {
            console.log('Fallback copy also failed:', fallbackError);
            showToast.error('Unable to copy link. Please copy manually from the address bar.');
          }
          document.body.removeChild(textArea);
        }
      }
    } catch (err) {
      console.error('Error sharing:', err);
      showToast.error('Failed to share event');
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    showToast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'fest':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
      case 'hackathon':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'cultural':
        return 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300';
      case 'sports':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300';
      case 'workshop':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Event Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The event you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleFavorite}>
                <Heart 
                  size={16} 
                  className={`mr-2 ${isFavorited ? 'fill-current text-red-500' : ''}`} 
                />
                {isFavorited ? 'Favorited' : 'Favorite'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 size={16} className="mr-2" />
                Share
              </Button>
              {/* Community button for registered verified users */}
              {isRegistered && (!user || user.type !== 'organizer' || user.verificationStatus === 'approved') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/event/${event.id}/community`)}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200 dark:from-blue-900/20 dark:to-purple-900/20 dark:border-blue-700"
                >
                  <MessageCircle size={16} className="mr-2 text-blue-600 dark:text-blue-400" />
                  Community
                </Button>
              )}
              
              {/* AI Assistant trigger for tech events only */}
              {(['hackathon', 'ideathon', 'workshop'].includes(event.type) || 
                event.tags.some(tag => ['tech', 'ai', 'coding', 'programming', 'software', 'development'].includes(tag.toLowerCase()))) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAIAssistantOpen(true)}
                  className="bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 border-purple-200 dark:from-purple-900/20 dark:to-blue-900/20 dark:border-purple-700"
                >
                  <Bot size={16} className="mr-2 text-purple-600 dark:text-purple-400" />
                  <Sparkles size={12} className="mr-1 text-blue-500" />
                  AI Help
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Event Hero Section */}
      <section className="relative">
        <div className="h-96 relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600">
          {event.image ? (
            <>
              <ImageWithFallback
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40" />
            </>
          ) : (
            <>
              {/* Fallback gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600" />
              <div className="absolute inset-0 bg-black bg-opacity-20" />
            </>
          )}
          
          {/* Event Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="container mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Badge className={getEventTypeColor(event.type)}>
                    {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </Badge>
                </div>
                
                <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                <p className="text-xl opacity-90">{event.college}</p>
                
                <div className="flex items-center space-x-6 mt-4">
                  <div className="flex items-center space-x-2">
                    <Calendar size={20} />
                    <span>{new Date(event.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock size={20} />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={20} />
                    <span>{event.venue}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                {event.requirements && event.requirements.length > 0 && (
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                )}
                {event.prizes && event.prizes.length > 0 && (
                  <TabsTrigger value="prizes">Prizes</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <CardTitle>About This Event</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-6">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Organizer</h4>
                        <p className="text-muted-foreground">{event.organizer}</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Capacity</h4>
                        <p className="text-muted-foreground">{event.capacity} attendees</p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Registration</h4>
                        <p className="text-muted-foreground">
                          {event.registered} / {event.capacity} registered
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Price</h4>
                        <p className="text-muted-foreground">
                          {event.price === 0 ? 'Free' : `₹${event.price}`}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Registration Progress</span>
                        <span>{Math.round((event.registered / event.capacity) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((event.registered / event.capacity) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {event.requirements && event.requirements.length > 0 && (
                <TabsContent value="requirements">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckCircle size={20} className="mr-2" />
                        Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {event.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {event.prizes && event.prizes.length > 0 && (
                <TabsContent value="prizes">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Trophy size={20} className="mr-2" />
                        Prizes & Rewards
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {event.prizes.map((prize, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                              <Gift size={16} className="text-yellow-600" />
                            </div>
                            <span className="font-medium">{prize}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Registration Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {event.price === 0 ? (
                      <span className="text-green-600">Free</span>
                    ) : (
                      <div className="flex items-center justify-center text-orange-600">
                        <IndianRupee size={24} className="mr-1" />
                        <span>{event.price}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.type === 'fest' ? 'Ticket Price' : 'Registration Fee'}
                  </p>
                </div>

                {isRegistered ? (
                  <div className="space-y-3">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled
                      size="lg"
                    >
                      <CheckCircle size={16} className="mr-2" />
                      Registered ✓
                    </Button>
                    {/* Only show community access for verified users */}
                    {(!user || user.type !== 'organizer' || user.verificationStatus === 'approved') && (
                      <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        onClick={() => navigate(`/event/${event.id}/community`)}
                        size="lg"
                        variant="outline"
                      >
                        <MessageCircle size={16} className="mr-2" />
                        Join Community
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={handleRegistration}
                    disabled={event.registered >= event.capacity}
                    size="lg"
                  >
                    {event.registered >= event.capacity ? (
                      'Event Full'
                    ) : (
                      ['hackathon', 'ideathon', 'workshop'].includes(event.type) 
                        ? 'Fill Registration Form' 
                        : event.type === 'fest' 
                          ? 'Get Ticket' 
                          : 'Register Now'
                    )}
                  </Button>
                )}

                <div className="text-xs text-center text-muted-foreground">
                  <p>{event.capacity - event.registered} spots remaining</p>
                  {event.registered >= event.capacity * 0.9 && (
                    <p className="text-orange-600 font-medium">Filling up fast!</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Community Card for registered verified users */}
            {isRegistered && (!user || user.type !== 'organizer' || user.verificationStatus === 'approved') && (
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700 dark:text-blue-300">
                    <MessageCircle size={20} className="mr-2" />
                    Event Community
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with other attendees, get official updates, find teammates, and join discussions about this {event.type}.
                  </p>
                  <Button
                    onClick={() => navigate(`/event/${event.id}/community`)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Users size={16} className="mr-2" />
                    Join Community
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Verification Required Notice for Unverified Organizers */}
            {isRegistered && user?.type === 'organizer' && user.verificationStatus !== 'approved' && (
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700 dark:text-orange-300">
                    <AlertCircle size={20} className="mr-2" />
                    Community Access Restricted
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {user.verificationStatus === 'pending'
                      ? 'Community access will be available after your organizer verification is approved.'
                      : user.verificationStatus === 'rejected'
                      ? 'Complete your organizer verification to access community features.'
                      : 'Complete organizer verification to join event communities and connect with attendees.'
                    }
                  </p>
                  <Button
                    onClick={() => navigate('/organizer-dashboard')}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                  >
                    <Eye size={16} className="mr-2" />
                    {user.verificationStatus === 'pending' ? 'View Verification Status' : 'Complete Verification'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* AI Assistant Card for tech events */}
            {(['hackathon', 'ideathon', 'workshop'].includes(event.type) || 
              event.tags.some(tag => ['tech', 'ai', 'coding', 'programming', 'software', 'development'].includes(tag.toLowerCase()))) && (
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-700 dark:text-purple-300">
                    <Bot size={20} className="mr-2" />
                    AI Tech Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get personalized help with project ideas, tech stacks, APIs, and coding guidance specifically for this {event.type}.
                  </p>
                  <Button 
                    onClick={() => setIsAIAssistantOpen(true)}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                  >
                    <Sparkles size={16} className="mr-2" />
                    Start AI Chat
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-blue-500" />
                    <span className="text-sm">Registered</span>
                  </div>
                  <span className="font-medium">{event.registered}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star size={16} className="text-yellow-500" />
                    <span className="text-sm">Event Type</span>
                  </div>
                  <Badge variant="outline">{event.type}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} className="text-green-500" />
                    <span className="text-sm">Status</span>
                  </div>
                  <Badge variant="secondary">{event.status}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Registration Form Dialog */}
      <Dialog open={isRegistrationFormOpen} onOpenChange={setIsRegistrationFormOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Event Registration</DialogTitle>
            <DialogDescription>
              Complete your registration for {event.title}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-0">
            {registrationConfig && (
              <EventRegistrationForm
                eventTitle={event.title}
                eventType={event.type}
                registrationConfig={registrationConfig}
                onSubmit={handleRegistrationSubmit}
                onCancel={() => setIsRegistrationFormOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Registration</DialogTitle>
            <DialogDescription>
              Complete your payment to register for {event.title}
            </DialogDescription>
          </DialogHeader>
          <PaymentInterface
            eventTitle={event.title}
            eventPrice={event.price}
            eventId={event.id}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setIsPaymentOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* AI Assistant */}
      {(['hackathon', 'ideathon', 'workshop'].includes(event.type) || 
        event.tags.some(tag => ['tech', 'ai', 'coding', 'programming', 'software', 'development'].includes(tag.toLowerCase()))) && (
        <AIAssistant
          eventType={event.type}
          eventTitle={event.title}
          eventDescription={event.description}
          isVisible={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
        />
      )}
    </div>
  );
}
