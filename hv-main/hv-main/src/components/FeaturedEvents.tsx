import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, Users, IndianRupee, ArrowRight, AlertCircle, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useRealTimeEvents } from '../utils/supabaseApi';
import { LoadingSpinner, EventCardSkeleton } from './LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabaseApi } from '../utils/supabaseApi';

function EventBackgroundAnimation({ type }: { type: string }) {
  switch (type) {
    case 'hackathon':
    case 'tech':
      return (
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {Array.from({ length: 4 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-cyan-400/30 text-xs"
              style={{ 
                left: `${10 + i * 20}%`, 
                top: `${20 + (i % 2) * 40}%` 
              }}
              animate={{ 
                opacity: [0, 1, 0],
                y: [0, -20, 0]
              }}
              transition={{ 
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity 
              }}
            >
              {'{ }'}
            </motion.div>
          ))}
        </div>
      );
    
    case 'cultural':
    case 'fest':
      return (
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute bottom-4 w-1 bg-gradient-to-t from-purple-500/40 to-transparent rounded-t-full"
              style={{ left: `${20 + i * 25}%`, height: '30px' }}
              animate={{ 
                scaleY: [1, 1.5, 0.8, 1.2, 1],
                rotate: [0, 3, -3, 0]
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity 
              }}
            />
          ))}
          <motion.div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-full bg-gradient-to-b from-purple-400/20 to-transparent"
            animate={{ rotate: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ clipPath: 'polygon(45% 0%, 55% 0%, 70% 100%, 30% 100%)' }}
          />
        </div>
      );
    
    case 'sports':
      return (
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <motion.div
            className="absolute w-3 h-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-full"
            initial={{ x: 10, y: 30 }}
            animate={{ 
              x: [10, 40, 70, 100],
              y: [30, 10, 30, 5]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-4 right-4 w-2 h-6 bg-gradient-to-t from-orange-500/40 to-transparent rounded-t-full"
            animate={{ 
              y: [0, -5, 0],
              scaleX: [1, 0.7, 1]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity 
            }}
          />
        </div>
      );
    
    case 'workshop':
      return (
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {Array.from({ length: 2 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-4 bg-gradient-to-r from-yellow-400/40 to-teal-400/40 rounded-sm"
              style={{ 
                right: `${20 + i * 30}%`, 
                top: `${30 + i * 20}%` 
              }}
              animate={{ 
                rotate: [0, 10, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 4,
                delay: i * 0.5,
                repeat: Infinity 
              }}
            />
          ))}
          <motion.div
            className="absolute top-1/4 left-1/4 w-8 h-6 bg-gradient-to-br from-teal-300/20 to-yellow-300/20 rounded border border-teal-400/30"
            animate={{ 
              boxShadow: [
                "0 0 5px rgba(20, 184, 166, 0.2)",
                "0 0 15px rgba(20, 184, 166, 0.4)",
                "0 0 5px rgba(20, 184, 166, 0.2)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      );
    
    default:
      return null;
  }
}

function getEventTypeColor(type: string) {
  switch (type) {
    case 'fest':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
    case 'hackathon':
    case 'tech':
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
}

function getEventGradient(type: string) {
  switch (type) {
    case 'hackathon':
    case 'tech':
      return 'from-cyan-500/20 to-green-500/20';
    case 'cultural':
    case 'fest':
      return 'from-purple-500/20 to-pink-500/20';
    case 'sports':
      return 'from-orange-500/20 to-red-500/20';
    case 'workshop':
      return 'from-yellow-500/20 to-teal-500/20';
    default:
      return 'from-gray-500/20 to-blue-500/20';
  }
}

export function FeaturedEvents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, loading, error } = useRealTimeEvents(user?.id);
  const [isUnverifiedOrganizer, setIsUnverifiedOrganizer] = useState(false);

  // Check if user is an unverified organizer
  useEffect(() => {
    if (user?.type === 'organizer' && user.verificationStatus !== 'approved') {
      setIsUnverifiedOrganizer(true);
    } else {
      setIsUnverifiedOrganizer(false);
    }
  }, [user]);

  // Show only featured events (first 4)
  const featuredEvents = events.slice(0, 4);

  if (loading) {
    return (
      <section className="py-20 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Featured Events
            </h2>
            <p className="text-muted-foreground text-lg">
              Don't miss out on these amazing upcoming events
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 px-6 bg-background">
        <div className="max-w-7xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Unable to load events</h3>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Featured Events
          </h2>
          <p className="text-muted-foreground text-lg">
            {isUnverifiedOrganizer
              ? "Complete organizer verification to view and create events"
              : "Don't miss out on these amazing upcoming events"
            }
          </p>

          {/* Unverified organizer notice */}
          {isUnverifiedOrganizer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-flex items-center px-4 py-2 bg-orange-100 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-full text-orange-800 dark:text-orange-300 text-sm"
            >
              <AlertCircle size={16} className="mr-2" />
              {user?.verificationStatus === 'pending'
                ? 'Verification under review - events will be available after approval'
                : user?.verificationStatus === 'rejected'
                ? 'Verification rejected - please resubmit verification'
                : 'Complete organizer verification to access events'
              }
            </motion.div>
          )}
        </motion.div>
        
        {/* Events Grid or Empty State */}
        {isUnverifiedOrganizer ? (
          // Empty state for unverified organizers
          <div className="text-center py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <AlertCircle size={48} className="text-orange-600 dark:text-orange-400" />
              </div>

              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {user?.verificationStatus === 'pending'
                  ? 'Verification In Progress'
                  : user?.verificationStatus === 'rejected'
                  ? 'Verification Required'
                  : 'Complete Your Verification'
                }
              </h3>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                {user?.verificationStatus === 'pending'
                  ? 'Your organizer verification is being reviewed by our team. You\'ll receive a notification within 24-48 hours. Events will be available after approval.'
                  : user?.verificationStatus === 'rejected'
                  ? 'Your verification was rejected. Please review the feedback and resubmit your verification with the correct information.'
                  : 'As an event organizer, you need to complete verification before you can view events and access organizer features.'
                }
              </p>

              <Button
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8"
                onClick={() => navigate('/organizer-dashboard')}
              >
                {user?.verificationStatus === 'pending'
                  ? 'View Verification Status'
                  : 'Complete Verification'
                }
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </motion.div>
          </div>
        ) : (
          // Events grid for verified users
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group cursor-pointer"
                onClick={() => navigate(`/event/${event.id}`)}
              >
                <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getEventGradient(event.type)} border border-border backdrop-blur-sm transition-all duration-300 group-hover:border-border/50 group-hover:shadow-2xl bg-card`}>
                  {/* Background Animation */}
                  <EventBackgroundAnimation type={event.type} />
                
                {/* Event Image */}
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Event Type Badge */}
                  <div className="absolute top-4 left-4">
                    <Badge className={getEventTypeColor(event.type)}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                {/* Event Content */}
                <div className="p-6 relative z-10">
                  <h3 className="text-xl font-bold text-card-foreground mb-3 group-hover:text-card-foreground/90 transition-colors">
                    {event.title}
                  </h3>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.college}
                    </div>
                    <div className="flex items-center text-muted-foreground text-sm">
                      <Users className="h-4 w-4 mr-2" />
                      {event.registered}/{event.capacity} registered
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold">
                      {event.price === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <div className="flex items-center text-orange-600">
                          <IndianRupee size={16} className="mr-1" />
                          <span>{event.price}</span>
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary/10 hover:bg-primary/20 backdrop-blur-sm border border-border text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
                    >
                      Register
                      <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          </div>
        )}

        {/* No events message for verified users */}
        {!isUnverifiedOrganizer && featuredEvents.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No events available</h3>
            <p className="text-muted-foreground">
              Check back later for new events
            </p>
          </div>
        )}
        
        {/* View All Button - Only for verified users with events */}
        {!isUnverifiedOrganizer && featuredEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              variant="outline"
              className="border-purple-500/50 text-purple-500 hover:bg-purple-500/10 hover:border-purple-400 px-8"
              onClick={() => {
                if (user) {
                  navigate(user.type === 'student' ? '/student-dashboard' : '/organizer-dashboard');
                } else {
                  navigate('/signup');
                }
              }}
            >
              View All Events
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
