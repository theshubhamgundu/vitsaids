// API utilities for data management
import { showToast } from './toast';

// Types
export interface Event {
  id: string;
  title: string;
  description: string;
  type: 'fest' | 'hackathon' | 'workshop' | 'cultural' | 'sports' | 'tech';
  date: string;
  time: string;
  venue: string;
  college: string;
  organizer: string;
  organizerId: string;
  price: number;
  capacity: number;
  registered: number;
  status: 'draft' | 'upcoming' | 'live' | 'ended';
  image: string;
  tags: string[];
  requirements?: string[];
  prizes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
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

export interface Registration {
  id: string;
  userId: string;
  eventId: string;
  ticketId?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  registrationId: string;
  qrCode: string;
  status: 'valid' | 'used' | 'cancelled';
  generatedAt: string;
  usedAt?: string;
}

// Deprecated mock API (localStorage) - kept only to avoid import breaks; not used
class MockAPI {
  private getFromStorage<T>(key: string, defaultValue: T[]): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Events API
  async getEvents(): Promise<Event[]> { return []; }

  async getEvent(id: string): Promise<Event | null> { return null; }

  async createEvent(): Promise<Event> { throw new Error('Deprecated mock API'); }

  async updateEvent(): Promise<Event> { throw new Error('Deprecated mock API'); }

  // Users API
  async getUsers(): Promise<User[]> { return []; }

  async getUser(): Promise<User | null> { return null; }

  async updateUser(): Promise<User> { throw new Error('Deprecated mock API'); }

  // Registrations API
  async registerForEvent(): Promise<Registration> { throw new Error('Deprecated mock API'); }

  async getUserRegistrations(): Promise<(Registration & { event: Event })[]> { return []; }

  // Tickets API
  async generateTicket(): Promise<Ticket> { throw new Error('Deprecated mock API'); }

  async verifyTicket(): Promise<{ valid: boolean; ticket?: Ticket; event?: Event; user?: User }> { return { valid: false }; }

  async checkInTicket(): Promise<boolean> { return false; }

  // Helper methods
  private delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private generateQRCode(): string {
    return 'QR_' + Math.random().toString(36).substr(2, 12).toUpperCase();
  }

  private getDefaultEvents(): Event[] {
    return [
      {
        id: 'evt_techfest2024',
        title: 'TechFest 2024',
        description: 'The biggest technical festival showcasing innovation, robotics, AI competitions, and tech talks by industry leaders.',
        type: 'fest',
        date: '2024-03-15',
        time: '09:00',
        venue: 'Main Campus',
        college: 'IIT Delhi',
        organizer: 'Tech Club IIT Delhi',
        organizerId: 'org_tech_iitd',
        price: 299,
        capacity: 500,
        registered: 245,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
        tags: ['technology', 'robotics', 'AI', 'competition'],
        requirements: ['Student ID', 'Laptop (for coding events)'],
        prizes: ['₹50,000 Grand Prize', 'Internship Opportunities', 'Certificates'],
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-15T00:00:00Z',
      },
      {
        id: 'evt_cultural2024',
        title: 'Cultural Extravaganza 2024',
        description: 'A vibrant celebration of arts, music, dance, and cultural performances from around the world.',
        type: 'cultural',
        date: '2024-03-20',
        time: '18:00',
        venue: 'Auditorium',
        college: 'Delhi University',
        organizer: 'Cultural Society DU',
        organizerId: 'org_cultural_du',
        price: 199,
        capacity: 300,
        registered: 156,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        tags: ['cultural', 'music', 'dance', 'arts'],
        requirements: ['College ID'],
        prizes: ['Trophies', 'Certificates', 'Cultural Scholarships'],
        createdAt: '2024-02-05T00:00:00Z',
        updatedAt: '2024-02-18T00:00:00Z',
      },
      {
        id: 'evt_hackathon2024',
        title: 'Code Warriors Hackathon',
        description: '48-hour coding marathon to build innovative solutions for real-world problems.',
        type: 'hackathon',
        date: '2024-03-25',
        time: '08:00',
        venue: 'Computer Lab',
        college: 'BITS Pilani',
        organizer: 'Coding Club BITS',
        organizerId: 'org_coding_bits',
        price: 0,
        capacity: 200,
        registered: 89,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1649451844813-3130d6f42f8a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fDE3NTY4ODQ5MTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        tags: ['coding', 'hackathon', 'programming', 'innovation'],
        requirements: ['Laptop', 'Programming Knowledge', 'Team of 2-4'],
        prizes: ['₹1,00,000 Prize Pool', 'Job Opportunities', 'Mentorship'],
        createdAt: '2024-02-10T00:00:00Z',
        updatedAt: '2024-02-20T00:00:00Z',
      },
      {
        id: 'evt_ideathon2024',
        title: 'Innovation Ideathon 2024',
        description: 'Pitch your innovative ideas and turn them into reality. A platform for creative minds to showcase breakthrough solutions.',
        type: 'hackathon',
        date: '2024-04-05',
        time: '10:00',
        venue: 'Innovation Hub',
        college: 'IIT Bombay',
        organizer: 'Innovation Cell IIT Bombay',
        organizerId: 'org_innovation_iitb',
        price: 0,
        capacity: 150,
        registered: 67,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1677506048148-0c914dd8197b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fDE3NTY5MDg4Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080',
        tags: ['innovation', 'ideas', 'startup', 'entrepreneurship'],
        requirements: ['Laptop', 'Creative Mindset', 'Presentation Skills'],
        prizes: ['₹75,000 Prize Pool', 'Incubation Support', 'Mentorship Programs'],
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-02-25T00:00:00Z',
      },
      {
        id: 'evt_workshop_ai2024',
        title: 'AI & Machine Learning Workshop',
        description: 'Hands-on workshop covering the fundamentals of AI and machine learning with practical projects and real-world applications.',
        type: 'workshop',
        date: '2024-04-12',
        time: '14:00',
        venue: 'Computer Science Lab',
        college: 'NIT Surathkal',
        organizer: 'AI Society NIT',
        organizerId: 'org_ai_nit',
        price: 299,
        capacity: 80,
        registered: 23,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1733758283615-224f76ab0792?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fDE3NTY5MDg4NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        tags: ['AI', 'machine learning', 'python', 'data science'],
        requirements: ['Basic Programming Knowledge', 'Laptop with Python'],
        prizes: ['Certificate of Completion', 'Project Portfolio', 'Industry Connections'],
        createdAt: '2024-02-20T00:00:00Z',
        updatedAt: '2024-03-01T00:00:00Z',
      }
    ];
  }

  private getDefaultUsers(): User[] {
    return [
      {
        id: 'user_student1',
        name: 'Alex Johnson',
        email: 'student@demo.com',
        role: 'student',
        college: 'IIT Delhi',
        phone: '+91 9876543210',
        interests: ['technology', 'sports', 'music'],
        location: 'Delhi',
        verified: true,
        createdAt: '2024-01-15T00:00:00Z',
      },
      {
        id: 'user_organizer1',
        name: 'Sarah Wilson',
        email: 'organizer@demo.com',
        role: 'organizer',
        college: 'IIT Delhi',
        verified: true,
        createdAt: '2024-01-10T00:00:00Z',
      },
      {
        id: 'user_crew1',
        name: 'Mike Chen',
        email: 'crew@demo.com',
        role: 'crew',
        college: 'IIT Delhi',
        verified: true,
        createdAt: '2024-01-20T00:00:00Z',
      },
      {
        id: 'user_admin1',
        name: 'Admin User',
        email: 'admin@demo.com',
        role: 'admin',
        verified: true,
        createdAt: '2024-01-01T00:00:00Z',
      }
    ];
  }
}

// Export singleton instance
export const api = new MockAPI();

// Real-time data hooks
export function useRealTimeEvents() {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.getEvents();
        setEvents(data);
      } catch (error) {
        showToast.error('Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  return { events, loading, refetch: () => api.getEvents().then(setEvents) };
}

// Import React for hooks
import React from 'react';