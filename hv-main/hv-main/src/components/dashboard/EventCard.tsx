import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar, MapPin, Users, IndianRupee, Clock, Heart, Share2, ExternalLink, MessageCircle } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { PaymentInterface } from '../payments/PaymentInterface';
import { showToast } from '../../utils/toast';
import { Event } from '../../utils/supabaseApi';
import { useAuth } from '../../contexts/AuthContext';
import { supabaseApi } from '../../utils/supabaseApi';



interface EventCardProps {
  event: Event;
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
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

  const getStatusBadge = () => {
    if (!event.capacity) return null;
    
    const fillPercentage = (event.registered / event.capacity) * 100;
    
    if (fillPercentage >= 90) {
      return <Badge variant="destructive" className="text-xs">Few spots left</Badge>;
    } else if (fillPercentage >= 70) {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">Filling fast</Badge>;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRegistration = async () => {
    if (!user) {
      showToast.error('Please login to register for events');
      navigate('/login');
      return;
    }

    if (event.price === 0) {
      // Direct registration for free events
      setIsRegistering(true);
      try {
        await supabaseApi.registerForEvent(user.id, event.id);
        setIsRegistered(true);
      } catch (error) {
        console.error('Registration failed:', error);
      } finally {
        setIsRegistering(false);
      }
    } else {
      // Open payment dialog for paid events
      setIsPaymentOpen(true);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!user) return;
    
    setIsRegistering(true);
    try {
      await supabaseApi.registerForEvent(user.id, event.id);
      setIsRegistered(true);
      setIsPaymentOpen(false);
    } catch (error) {
      console.error('Registration after payment failed:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out this event: ${event.title} at ${event.college}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast.success('Event link copied to clipboard!');
      } catch (error) {
        console.log('Failed to copy to clipboard:', error);
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
  };

  const handleFavorite = () => {
    showToast.success('Event added to favorites!');
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Event Image */}
        <div className="relative">
          <ImageWithFallback
            src={event.image}
            alt={event.title}
            className="w-full h-48 object-cover"
          />
          
          {/* Overlays */}
          <div className="absolute top-3 left-3">
            <Badge className={getEventTypeColor(event.type)}>
              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
            </Badge>
          </div>
          
          <div className="absolute top-3 right-3 flex space-x-2">
            {getStatusBadge()}
          </div>
          
          {/* Quick Actions */}
          <div className="absolute bottom-3 right-3 flex space-x-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white"
              onClick={handleFavorite}
            >
              <Heart size={14} />
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white"
              onClick={handleShare}
            >
              <Share2 size={14} />
            </Button>
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground">{event.college}</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Event Details */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar size={14} className="mr-2" />
              <span>{formatDate(event.date)} at {event.time}</span>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin size={14} className="mr-2" />
              <span>{event.venue}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-muted-foreground">
                <Users size={14} className="mr-2" />
                <span>
                  {event.registered} registered
                  {event.capacity && ` / ${event.capacity}`}
                </span>
              </div>
              
              <div className="flex items-center font-medium">
                {event.price === 0 ? (
                  <span className="text-green-600">Free</span>
                ) : (
                  <div className="flex items-center text-orange-600">
                    <IndianRupee size={14} className="mr-1" />
                    <span>{event.price}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar for Capacity */}
          {event.capacity && (
            <div className="space-y-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((event.registered / event.capacity) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {event.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{event.tags.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-3">
          <div className="flex space-x-2 w-full">
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={handleRegistration}
              disabled={isRegistered || isRegistering}
            >
              {isRegistering 
                ? 'Registering...' 
                : isRegistered 
                ? 'Registered ✓' 
                : (event.type === 'fest' ? 'Get Ticket' : 'Register')
              }
            </Button>
            {isRegistered && (
              <Button 
                variant="outline" 
                size="sm" 
                className="px-3"
                onClick={() => navigate(`/event/${event.id}/community`)}
                title="Join Community"
              >
                <MessageCircle size={14} />
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              className="px-3"
              onClick={() => navigate(`/event/${event.id}`)}
            >
              <ExternalLink size={14} />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="payment-dialog-description">
          <DialogHeader>
            <DialogTitle>Complete Registration</DialogTitle>
            <DialogDescription id="payment-dialog-description">
              Complete your payment to register for {event.title}. You will be charged ₹{event.price} for this event.
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
    </motion.div>
  );
}