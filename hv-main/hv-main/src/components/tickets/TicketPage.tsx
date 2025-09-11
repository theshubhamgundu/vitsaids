import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Download, Share2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { LoadingSpinner } from '../LoadingSpinner';
import { ModernTicket } from './ModernTicket';
import type { Event, Ticket } from '../../utils/supabaseApi';
import { supabaseApi } from '../../utils/supabaseApi';
import { toast } from '../../utils/toast';
import { NavigationHeader } from '../NavigationHeader';

// Define User interface locally since it's not exported from api
interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'organizer' | 'crew' | 'admin';
  college?: string;
  phone?: string;
  avatar?: string;
  interests?: string[];
  location?: string;
  verified: boolean;
  createdAt: string;
}

export function TicketPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTicketData() {
      if (!ticketId) {
        setError('Ticket ID not provided');
        setLoading(false);
        return;
      }

      try {
        // Verify ticket with backend (use ticketId as qrCode or identifier)
        const result = await supabaseApi.verifyTicket(ticketId);
        if (!result.valid || !result.ticket || !result.event || !result.user) {
          setError('Ticket not found or invalid');
          setLoading(false);
          return;
        }

        setTicket(result.ticket as unknown as Ticket);
        setEvent(result.event as Event);
        setUser(result.user as any);
      } catch (err) {
        setError('Failed to load ticket');
        console.error('Error fetching ticket:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTicketData();
  }, [ticketId]);

  const handleDownload = () => {
    if (!ticket || !event || !user) return;

    // Create downloadable ticket
    const ticketData = {
      ticketId: ticket.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      eventVenue: event.venue,
      attendeeName: user.name,
      attendeeEmail: user.email,
      qrCode: ticket.qrCode,
      generatedAt: ticket.generatedAt,
    };

    const dataStr = JSON.stringify(ticketData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `FindMyEvent_Ticket_${ticket.id.slice(-8)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Ticket downloaded successfully!');
  };

  const handleShare = async () => {
    const shareData = {
      title: `${event?.title} - FindMyEvent Ticket`,
      text: `Check out my ticket for ${event?.title}!`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        toast.success('Ticket shared successfully!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Ticket link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      toast.error('Failed to share ticket');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !ticket || !event || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Ticket Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'The ticket you\'re looking for doesn\'t exist or has been removed.'}
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
      <NavigationHeader title="Digital Ticket" />
      
      {/* Action Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download size={16} className="mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Ticket Display */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ModernTicket
            ticket={ticket}
            event={event}
            user={user}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 max-w-md mx-auto"
        >
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Important Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Present this ticket at the venue entrance for scanning</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Arrive at least 15 minutes before the event starts</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>This ticket is valid for single entry only</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p>Keep your college ID ready for verification</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}