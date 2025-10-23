import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Download, 
  Share2,
  Star,
  Trophy,
  Users,
  CheckCircle
} from 'lucide-react';
import type { Event, Ticket } from '../../utils/supabaseApi';

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

interface ModernTicketProps {
  ticket: Ticket;
  event: Event;
  user: User;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export function ModernTicket({ ticket, event, user, onDownload, onShare, className = '' }: ModernTicketProps) {
  const isUsed = ticket.status === 'used';
  const isValid = ticket.status === 'valid';

  const getEventTypeGradient = (type: string) => {
    switch (type) {
      case 'fest':
        return 'from-purple-600 to-blue-600';
      case 'hackathon':
        return 'from-green-600 to-teal-600';
      case 'cultural':
        return 'from-pink-600 to-rose-600';
      case 'workshop':
        return 'from-orange-600 to-amber-600';
      case 'sports':
        return 'from-red-600 to-orange-600';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'fest':
        return <Star size={20} />;
      case 'hackathon':
        return <Trophy size={20} />;
      case 'cultural':
        return <Users size={20} />;
      default:
        return <Calendar size={20} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`max-w-md mx-auto ${className}`}
    >
      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-2xl border-0">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getEventTypeGradient(event.type)} p-6 text-white relative overflow-hidden`}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }} />
          </div>
          
          {/* FindMyEvent branding */}
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                {getEventIcon(event.type)}
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">FindMyEvent</p>
                <p className="text-xs opacity-70">Digital Ticket</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-30">
              {event.type.toUpperCase()}
            </Badge>
          </div>

          {/* Event title */}
          <h2 className="text-xl font-bold mb-2 relative z-10">{event.title}</h2>
          <p className="text-sm opacity-80 relative z-10">{event.college}</p>

          {/* Status indicator */}
          {isUsed && (
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <CheckCircle size={14} />
              <span>USED</span>
            </div>
          )}
        </div>

        {/* Ticket body */}
        <div className="p-6 bg-white dark:bg-gray-900">
          {/* Event details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar size={16} className="text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(event.date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-gray-500">Date</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Clock size={16} className="text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{event.time}</p>
                <p className="text-xs text-gray-500">Time</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm col-span-2">
              <MapPin size={16} className="text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{event.venue}</p>
                <p className="text-xs text-gray-500">Venue</p>
              </div>
            </div>
          </div>

          {/* Attendee info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Attendee Information</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg shadow-inner inline-block mb-4">
              <QRCodeSVG
                value={ticket.qrCode}
                size={120}
                level="M"
                includeMargin
                className={isUsed ? 'opacity-50' : ''}
              />
            </div>
            <p className="text-xs text-gray-500 mb-1">Ticket ID: {ticket.id.slice(-8).toUpperCase()}</p>
            <p className="text-xs text-gray-400">Scan at venue for entry</p>
          </div>

          {/* Ticket info */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Generated: {new Date(ticket.generatedAt).toLocaleDateString()}</span>
              <span>Status: {ticket.status.toUpperCase()}</span>
            </div>
            {ticket.usedAt && (
              <div className="mt-1 text-xs text-green-600">
                Used: {new Date(ticket.usedAt).toLocaleString()}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-3 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="flex-1"
            >
              <Download size={16} className="mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="flex-1"
            >
              <Share2 size={16} className="mr-2" />
              Share
            </Button>
          </div>

          {/* Security footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-400">
              Secured by FindMyEvent • Valid for single entry only
            </p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">Verified Authentic</span>
            </div>
          </div>
        </div>

        {/* Decorative tear line */}
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex justify-between px-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full -mt-1.5"
              />
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Ticket download component
export function TicketDownload({ ticket, event, user }: { ticket: Ticket; event: Event; user: User }) {
  const handleDownload = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>FindMyEvent Ticket - ${event.title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .ticket { max-width: 400px; margin: 0 auto; border: 2px solid #ddd; border-radius: 12px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; padding: 20px; text-align: center; }
              .content { padding: 20px; }
              .qr-code { text-align: center; margin: 20px 0; }
              .details { margin: 10px 0; }
              .label { font-weight: bold; color: #666; }
              @media print { body { margin: 0; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <h1>${event.title}</h1>
                <p>FindMyEvent Digital Ticket</p>
              </div>
              <div class="content">
                <div class="details">
                  <p><span class="label">Date:</span> ${new Date(event.date).toLocaleDateString()}</p>
                  <p><span class="label">Time:</span> ${event.time}</p>
                  <p><span class="label">Venue:</span> ${event.venue}</p>
                  <p><span class="label">Attendee:</span> ${user.name}</p>
                </div>
                <div class="qr-code">
                  <p>QR Code: ${ticket.qrCode}</p>
                  <p style="font-size: 12px;">Ticket ID: ${ticket.id}</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.title} - FindMyEvent Ticket`,
          text: `Check out my ticket for ${event.title}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        // Toast would be called here - success
        console.log('Link copied to clipboard');
      } catch (error) {
        console.log('Failed to copy to clipboard:', error);
        // Fallback: create a text area and select the text
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          console.log('Link copied using fallback method');
        } catch (fallbackError) {
          console.log('Fallback copy also failed:', fallbackError);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <ModernTicket
      ticket={ticket}
      event={event}
      user={user}
      onDownload={handleDownload}
      onShare={handleShare}
    />
  );
}