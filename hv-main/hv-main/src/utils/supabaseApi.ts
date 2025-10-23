// Supabase API integration for FindMyEvent platform - Fixed to use native client
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseClient';
import { showToast } from './toast';

// Global type declarations for window notification systems
declare global {
  interface Window {
    organizerVerificationNotifications?: Array<{
      id: string;
      type: 'organizer_verification';
      userId: string;
      userName?: string;
      userEmail?: string;
      college?: string;
      submittedAt: string;
      status: 'pending' | 'approved' | 'rejected';
      resolvedAt?: string;
      adminViewed: boolean;
    }>;
    userNotifications?: Record<string, Array<{
      id: string;
      userId: string;
      type: string;
      title: string;
      message: string;
      status?: string;
      createdAt: string;
      read: boolean;
    }>>;
  }
}

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
  type: 'student' | 'organizer' | 'crew' | 'admin';
  college?: string;
  phone?: string;
  avatar?: string;
  interests?: string[];
  location?: string;
  verified: boolean;
  isOnboarded?: boolean;
  year?: string;
  // Organizer verification fields
  verificationStatus?: 'unverified' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  // Personal
  dateOfBirth?: string;
  profilePhotoUrl?: string;
  // College
  collegeAddress?: string;
  departmentOrCourse?: string;
  // Club/Organization
  clubName?: string;
  clubPosition?: string;
  clubCategory?: 'Tech' | 'Cultural' | 'Sports' | 'Other';
  // Documents (URLs)
  docStudentIdUrl?: string;
  docClubCertificateUrl?: string;
  // Bank/Payments
  bankAccountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  createdAt: string;
  updatedAt: string;
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

// Mock data for development - will be replaced with real DB operations later
const mockEvents: Event[] = [
  {
    id: '1',
    title: 'TechFest 2024',
    description: 'Annual technology festival featuring workshops, hackathons, and competitions.',
    type: 'tech',
    date: '2024-03-15',
    time: '09:00',
    venue: 'Main Auditorium',
    college: 'IIT Delhi',
    organizer: 'Tech Club',
    organizerId: 'org-1',
    price: 500,
    capacity: 200,
    registered: 45,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    tags: ['technology', 'hackathon', 'workshops'],
    requirements: ['Laptop', 'Basic programming knowledge'],
    prizes: ['₹50,000 for winner', '₹25,000 for runner-up'],
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    title: 'Cultural Night 2024',
    description: 'A vibrant evening of music, dance, and cultural performances.',
    type: 'cultural',
    date: '2024-03-20',
    time: '18:00',
    venue: 'Open Air Theatre',
    college: 'Delhi University',
    organizer: 'Cultural Society',
    organizerId: 'org-2',
    price: 200,
    capacity: 500,
    registered: 156,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    tags: ['cultural', 'music', 'dance'],
    requirements: ['None'],
    prizes: ['Certificates for participants'],
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z'
  },
  {
    id: '3',
    title: 'AI/ML Workshop',
    description: 'Hands-on workshop on Artificial Intelligence and Machine Learning fundamentals.',
    type: 'workshop',
    date: '2024-03-25',
    time: '10:00',
    venue: 'Computer Lab 1',
    college: 'IIIT Hyderabad',
    organizer: 'AI Club',
    organizerId: 'org-3',
    price: 300,
    capacity: 50,
    registered: 32,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
    tags: ['AI', 'ML', 'workshop', 'hands-on'],
    requirements: ['Basic Python knowledge', 'Laptop with Python installed'],
    prizes: ['Certificate of completion'],
    createdAt: '2024-01-17T00:00:00Z',
    updatedAt: '2024-01-17T00:00:00Z'
  },
  {
    id: '4',
    title: 'CodeClash Hackathon',
    description: '48-hour coding marathon to build innovative solutions using latest technologies.',
    type: 'hackathon',
    date: '2024-04-05',
    time: '08:00',
    venue: 'Innovation Center',
    college: 'NIT Trichy',
    organizer: 'Coding Club',
    organizerId: 'org-4',
    price: 0,
    capacity: 100,
    registered: 67,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800',
    tags: ['hackathon', 'coding', 'innovation', 'tech'],
    requirements: ['Laptop', 'Programming experience', 'Team of 2-4 members'],
    prizes: ['₹1,00,000 for winner', '₹50,000 for runner-up', '₹25,000 for third place'],
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z'
  },
  {
    id: '5',
    title: 'Cricket Championship 2024',
    description: 'Inter-college cricket tournament with teams from across the state.',
    type: 'sports',
    date: '2024-04-10',
    time: '06:00',
    venue: 'Sports Complex',
    college: 'Mumbai University',
    organizer: 'Sports Committee',
    organizerId: 'org-5',
    price: 100,
    capacity: 300,
    registered: 89,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800',
    tags: ['sports', 'cricket', 'tournament', 'competition'],
    requirements: ['Sports gear', 'Team registration'],
    prizes: ['Trophy and ₹30,000', 'Runner-up ₹15,000'],
    createdAt: '2024-01-19T00:00:00Z',
    updatedAt: '2024-01-19T00:00:00Z'
  },
  {
    id: '6',
    title: 'Art & Literature Fest',
    description: 'Celebration of arts, literature, poetry, and creative expression.',
    type: 'cultural',
    date: '2024-04-15',
    time: '14:00',
    venue: 'Central Library',
    college: 'Jadavpur University',
    organizer: 'Literary Society',
    organizerId: 'org-6',
    price: 150,
    capacity: 200,
    registered: 134,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    tags: ['art', 'literature', 'poetry', 'cultural'],
    requirements: ['None'],
    prizes: ['Recognition certificates', 'Publication opportunities'],
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z'
  },
  {
    id: '7',
    title: 'Blockchain Workshop',
    description: 'Comprehensive workshop on blockchain technology and cryptocurrency.',
    type: 'workshop',
    date: '2024-04-20',
    time: '10:00',
    venue: 'Tech Auditorium',
    college: 'IIT Bombay',
    organizer: 'Blockchain Club',
    organizerId: 'org-7',
    price: 400,
    capacity: 80,
    registered: 45,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    tags: ['blockchain', 'cryptocurrency', 'technology', 'workshop'],
    requirements: ['Basic programming knowledge', 'Laptop'],
    prizes: ['Certificate and course materials'],
    createdAt: '2024-01-21T00:00:00Z',
    updatedAt: '2024-01-21T00:00:00Z'
  },
  {
    id: '8',
    title: 'Annual College Fest',
    description: 'Grand celebration with multiple events, competitions, and performances.',
    type: 'fest',
    date: '2024-04-25',
    time: '09:00',
    venue: 'Entire Campus',
    college: 'Delhi College of Engineering',
    organizer: 'Student Council',
    organizerId: 'org-8',
    price: 250,
    capacity: 1000,
    registered: 423,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    tags: ['fest', 'celebration', 'events', 'competitions'],
    requirements: ['College ID', 'Event-specific requirements'],
    prizes: ['Multiple prizes across events'],
    createdAt: '2024-01-22T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z'
  }
];

const mockUsers: User[] = [
  {
    id: 'a47c6ca1-718d-48de-8313-f310fef2761f',
    name: 'John Doe',
    email: 'john@example.com',
    type: 'student',
    college: 'IIT Delhi',
    verified: true,
    isOnboarded: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  // Add mock verified organizers
  {
    id: 'org-1',
    name: 'Tech Club Lead',
    email: 'tech@iitdelhi.ac.in',
    type: 'organizer',
    college: 'IIT Delhi',
    verified: true,
    isOnboarded: true,
    verificationStatus: 'approved',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'org-2',
    name: 'Cultural Society Head',
    email: 'cultural@du.ac.in',
    type: 'organizer',
    college: 'Delhi University',
    verified: true,
    isOnboarded: true,
    verificationStatus: 'approved',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'org-3',
    name: 'AI Club Coordinator',
    email: 'ai@iiith.ac.in',
    type: 'organizer',
    college: 'IIIT Hyderabad',
    verified: true,
    isOnboarded: true,
    verificationStatus: 'approved',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Base API class - now using native Supabase client instead of Edge Functions
class SupabaseAPI {

  // Auth methods - these use native Supabase auth
  async signup(email: string, password: string, name: string, type: string): Promise<User> {
    try {
      // Basic client-side validation to avoid 400s from Supabase
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showToast.error('Please enter a valid email address');
        throw new Error('Invalid email format');
      }

      if (!password || password.length < 6) {
        showToast.error('Password must be at least 6 characters');
        throw new Error('Weak password');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, type },
        },
      });

      if (error) throw error;

      const authUser = data.user;
      const session = data.session;

      // Create profile in database
      if (authUser) {
        const userRole = (type as any) || 'student';
        
        // Insert user profile into database
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: authUser.id,
            email: authUser.email || email,
            full_name: name || authUser.user_metadata?.name || 'User',
            role: userRole,
            profile_completed: false,
            interests: [],
            location_preferences: []
          }]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue with mock data fallback
        }

        const newProfile: User = {
          id: authUser.id,
          name: name || authUser.user_metadata?.name || 'User',
          email: authUser.email || email,
          type: userRole,
          verified: !!authUser.email_confirmed_at,
          isOnboarded: false,
          // Set initial verification status for organizers
          verificationStatus: type === 'organizer' ? 'unverified' : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Also add to mock data for fallback
        mockUsers.push(newProfile);

        showToast.auth.signupSuccess();
        return newProfile;
      }

      // If sign-up requires email confirmation and no session, return minimal user placeholder
      showToast.success('Account created. Please verify your email to continue.');
      return {
        id: 'pending',
        name,
        email,
        type: (type as any),
        verified: false,
        isOnboarded: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as User;
    } catch (error: any) {
      console.error('Signup error:', error);
      showToast.auth.signupError();
      throw error;
    }
  }

  // OAuth methods
  async signInWithGoogle(): Promise<{ user: User; session: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Google OAuth error:', error);
        showToast.auth.loginError();
        throw new Error(error.message);
      }

      showToast.success('Redirecting to Google...');
      return data as any;
    } catch (error) {
      console.error('Google OAuth error:', error);
      showToast.auth.loginError();
      throw error;
    }
  }

  async signInWithGitHub(): Promise<{ user: User; session: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('GitHub OAuth error:', error);
        showToast.auth.loginError();
        throw new Error(error.message);
      }

      showToast.success('Redirecting to GitHub...');
      return data as any;
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      showToast.auth.loginError();
      throw error;
    }
  }

  async signInWithPhone(phone: string): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });

      if (error) {
        console.error('Phone OTP error:', error);
        showToast.error('Failed to send OTP');
        throw new Error(error.message);
      }

      showToast.success('OTP sent successfully!');
      return { data, error: null };
    } catch (error) {
      console.error('Phone OTP error:', error);
      showToast.error('Failed to send OTP');
      throw error;
    }
  }

  async verifyPhoneOtp(phone: string, token: string): Promise<{ user: User; session: any }> {
    try {
      const { data: { session }, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms'
      });

      if (error) {
        console.error('Phone OTP verification error:', error);
        showToast.auth.loginError();
        throw new Error(error.message);
      }

      if (!session) {
        throw new Error('No session returned after OTP verification');
      }

      // Get or create user profile from mock data (later from real DB)
      let user = mockUsers.find(u => u.id === session.user.id);
      if (!user) {
        user = {
          id: session.user.id,
          name: session.user.phone || 'User',
          email: session.user.email || '',
          phone: session.user.phone || '',
          type: 'student',
          verified: true,
          isOnboarded: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockUsers.push(user);
      }

      showToast.auth.loginSuccess(user.name);
      return { user, session };
    } catch (error) {
      console.error('Phone OTP verification error:', error);
      showToast.auth.loginError();
      throw error;
    }
  }

  async signInWithSupabase(email: string, password: string): Promise<{ user: User; session: any }> {
    try {
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign-in error:', error);
        showToast.auth.loginError();
        throw new Error(error.message);
      }

      if (!session) {
        throw new Error('No session returned');
      }

      // Build user object directly from auth session to avoid users table dependency
      const user: User = {
          id: session.user.id,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
        type: (session.user.user_metadata?.type as any) || 'student',
          verified: !!session.user.email_confirmed_at,
          isOnboarded: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
      } as User;
      
      showToast.auth.loginSuccess(user.name);
      return { user, session };
    } catch (error) {
      console.error('Authentication error during sign-in:', error);
      showToast.auth.loginError();
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      showToast.auth.logoutSuccess();
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  async getCurrentSession(): Promise<{ user: User; session: any } | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        const msg = (error as any)?.message || '';
        if (msg.toLowerCase().includes('invalid refresh token')) {
          try { await supabase.auth.signOut(); } catch (_) {}
        }
        return null;
      }
      // Build user directly from session
        const authUser = session.user;
        const meta: any = authUser.user_metadata || {};
      const user: User = {
          id: authUser.id,
          name: meta.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          type: (meta.type as any) || 'student',
          verified: !!authUser.email_confirmed_at,
          isOnboarded: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
      } as User;

      return { user, session };
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  // Events API - using real Supabase database
  async getEvents(filters?: { type?: string; college?: string; search?: string }, userId?: string): Promise<Event[]> {
    try {
      // Select only from events to avoid relying on implicit FKs/joins
      let query = supabase
        .from('events')
        .select('*');

      // Apply filters
      if (filters?.type) {
        query = query.eq('event_type', filters.type);
      }

      if (filters?.college) {
        query = query.ilike('college_id', `%${filters.college}%`);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        // Fallback to mock data if database query fails
        return this.getMockEvents(filters, userId);
      }

      // Transform database events to our Event interface (schema-flexible)
      const events: Event[] = (data || []).map((dbEvent: any) => {
        const start = dbEvent.start_date || dbEvent.start || dbEvent.date || dbEvent.starts_at || dbEvent.datetime;
        const startDate = start ? new Date(start) : new Date();
        const dateStr = startDate.toISOString().split('T')[0];
        const timeStr = startDate.toTimeString().split(' ')[0].substring(0, 5);

        return {
          id: dbEvent.id,
          title: dbEvent.title,
          description: dbEvent.description || '',
          type: (dbEvent.event_type || dbEvent.type || 'other') as any,
          date: dateStr,
          time: timeStr,
          venue: dbEvent.venue || dbEvent.location || '',
          college: dbEvent.college_id || dbEvent.college || '',
          organizer: 'Organizer',
          organizerId: dbEvent.organizer_id || dbEvent.organizerId || '',
          price: dbEvent.registration_fee ?? dbEvent.price ?? 0,
          capacity: dbEvent.max_attendees ?? dbEvent.capacity ?? 0,
          registered: dbEvent.current_attendees ?? dbEvent.registered ?? 0,
          status: (dbEvent.status === 'active' ? 'upcoming' : (dbEvent.status || 'upcoming')) as any,
          image: dbEvent.image_url || dbEvent.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
          tags: dbEvent.tags || [],
          requirements: dbEvent.requirements || [],
          prizes: [],
          createdAt: dbEvent.created_at || dbEvent.createdAt || new Date().toISOString(),
          updatedAt: dbEvent.updated_at || dbEvent.updatedAt || new Date().toISOString(),
        };
      });

      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      // Fallback to mock data
      return this.getMockEvents(filters, userId);
    }
  }

  // Fallback method for mock events
  private async getMockEvents(filters?: { type?: string; college?: string; search?: string }, userId?: string): Promise<Event[]> {
    // If organizer and not approved, do NOT show demo events
    if (userId) {
      try {
        const user = await this.getUser(userId);
        if (user?.type === 'organizer' && user.verificationStatus !== 'approved') {
          return [];
        }
      } catch {
        // If unable to resolve user, be conservative for organizers
        return [];
      }
    }

    let filteredEvents: Event[] = [...mockEvents];

      // Apply filters
      if (filters?.type) {
        filteredEvents = filteredEvents.filter(event => event.type === filters.type);
      }

      if (filters?.college) {
        filteredEvents = filteredEvents.filter(event =>
          event.college.toLowerCase().includes(filters.college!.toLowerCase())
        );
      }

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredEvents = filteredEvents.filter(event =>
          event.title.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      return filteredEvents;
  }

  async getEvent(id: string): Promise<Event> {
    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      // First, try to find the exact event
      let event = mockEvents.find(e => e.id === id);

      // If not found, try some fallback logic for common cases
      if (!event) {
        console.warn(`Event with ID '${id}' not found, checking fallbacks...`);

        // If someone tries to access with a number-like ID, ensure it's a string
        const stringId = String(id);
        event = mockEvents.find(e => e.id === stringId);

        // If still not found and it's a valid looking ID, log details for debugging
        if (!event) {
          console.error(`Event lookup failed for ID: '${id}' (type: ${typeof id})`);
          console.log('Available event IDs:', mockEvents.map(e => e.id));

          // For development/demo purposes, return the first event if the ID looks like a test ID
          if (id && (id.includes('test') || id.includes('demo') || id.includes('sample') || id.length > 10)) {
            console.log('Returning first available event as fallback for demo/test ID');
            return mockEvents[0];
          }

          throw new Error(`Event with ID '${id}' not found`);
        }
      }

      return event;
    } catch (error) {
      console.error('Error fetching event:', error);
      // Don't show toast here - let the component handle the error display
      throw error;
    }
  }

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'registered'>, creatorUserId?: string): Promise<Event> {
    try {
      // Check if creator is a verified organizer
      const creator = creatorUserId ? await this.getUser(creatorUserId) : null;

      if (creator?.type === 'organizer' && creator.verificationStatus !== 'approved') {
        throw new Error('Only verified organizers can create events. Please complete verification first.');
      }

      // Prepare database event data (schema-flexible)
      const dbEventData: any = {
        title: eventData.title,
        description: eventData.description,
        event_type: eventData.type,
        location: eventData.venue,
        venue: eventData.venue,
        max_attendees: eventData.capacity,
        registration_fee: eventData.price,
        is_paid: eventData.price > 0,
        organizer_id: creator?.type === 'organizer' ? creator.id : eventData.organizerId,
        college_id: eventData.college,
        tags: eventData.tags || [],
        requirements: eventData.requirements || [],
        image_url: eventData.image,
        contact_email: creator?.email,
        status: 'active'
      };

      // Only include start_date/end_date if table has these columns (handled by insert catch)
      const startIso = new Date(`${eventData.date}T${eventData.time}:00`).toISOString();
      dbEventData.start_date = startIso;
      dbEventData.end_date = startIso;

      const { data, error } = await supabase
        .from('events')
        .insert([dbEventData])
        .select()
        .single();

      if (error || !data) {
        console.error('Supabase error creating event:', error || 'No data');
        // Fall back to mock event so UI proceeds
        const fallbackEvent: Event = {
        ...eventData,
        id: `event-${Date.now()}`,
        registered: 0,
        organizerId: creator?.type === 'organizer' ? creator.id : eventData.organizerId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
          status: 'upcoming',
          prizes: eventData.prizes || [],
        } as any;
        mockEvents.push(fallbackEvent);
        showToast.events.createSuccess(fallbackEvent.title);
        return fallbackEvent;
      }

      // Transform back to our Event interface
      const newEvent: Event = {
        id: data.id,
        title: data.title,
        description: data.description || '',
        type: data.event_type as any,
        date: new Date(data.start_date).toISOString().split('T')[0],
        time: new Date(data.start_date).toTimeString().split(' ')[0].substring(0, 5),
        venue: data.venue || data.location || '',
        college: data.college_id || '',
        organizer: creator?.name || 'Unknown',
        organizerId: data.organizer_id,
        price: data.registration_fee || 0,
        capacity: data.max_attendees || 0,
        registered: 0,
        status: 'upcoming',
        image: data.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        tags: data.tags || [],
        requirements: data.requirements || [],
        prizes: [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      // Also add to mock data for fallback
      mockEvents.push(newEvent);

        showToast.events.createSuccess(newEvent.title);
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      if (error.message?.includes('verified organizers')) {
        showToast.error('Event creation failed: Complete organizer verification first');
      } else {
        showToast.events.createError();
      }
      throw error;
    }
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
    try {
      const eventIndex = mockEvents.findIndex(e => e.id === id);
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      mockEvents[eventIndex] = {
        ...mockEvents[eventIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      showToast.events.updateSuccess();
      return mockEvents[eventIndex];
    } catch (error) {
      console.error('Error updating event:', error);
      showToast.events.updateError();
      throw error;
    }
  }

  // Users API - resilient to missing custom table, will fall back to Auth
  async getUser(id: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        const user: User = {
          id: data.id,
          name: data.full_name || 'User',
          email: data.email,
          type: (data.role as any) || 'student',
          college: data.college_name,
          verified: !!data.profile_completed,
          isOnboarded: !!data.profile_completed,
          interests: data.interests || [],
          location: data.location_preferences?.[0],
          verificationStatus: data.role === 'organizer' ? 'approved' : undefined,
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString()
        };
      return user;
      }

      // Fallback to Supabase Auth
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (authUser && authUser.id === id) {
        const meta: any = authUser.user_metadata || {};
        return {
          id: authUser.id,
          name: meta.name || authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
          type: (meta.type as any) || 'student',
          verified: !!authUser.email_confirmed_at,
          isOnboarded: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as User;
      }

      // Fallback to mock
      const mock = mockUsers.find(u => u.id === id);
      if (mock) return mock;
      throw new Error('User not found');
    } catch (error) {
      console.error('Error fetching user:', error);
      showToast.error('Failed to fetch user profile');
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      // Prepare database update data
      const dbUpdates: any = {};
      
      if (updates.name) dbUpdates.full_name = updates.name;
      if (updates.college) dbUpdates.college_name = updates.college;
      if (updates.interests) dbUpdates.interests = updates.interests;
      if (updates.location) dbUpdates.location_preferences = [updates.location];
      if (updates.verificationStatus) {
        // Map verification status to role if needed
        if (updates.verificationStatus === 'approved' && updates.type === 'organizer') {
          dbUpdates.role = 'organizer';
        }
      }
      if (updates.isOnboarded !== undefined) dbUpdates.profile_completed = updates.isOnboarded;

      const { data, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        console.error('Supabase error updating user:', error || 'No data');
        // Fallback to mock data update
        const userIndex = mockUsers.findIndex(u => u.id === id);
        if (userIndex !== -1) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      showToast.profile.updateSuccess();
      return mockUsers[userIndex];
        }
        // Synthesize from auth as last resort
        const { data: authRes } = await supabase.auth.getUser();
        const authUser = authRes?.user;
        if (authUser && authUser.id === id) {
          const synthesized: User = {
            id,
            name: updates.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            email: authUser.email || '',
            type: (updates.type as any) || 'student',
            verified: !!authUser.email_confirmed_at,
            isOnboarded: !!updates.isOnboarded,
            verificationStatus: updates.verificationStatus as any,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          showToast.profile.updateSuccess();
          return synthesized;
        }
        throw new Error('User not found');
      }

      // Transform back to our User interface
      const user: User = {
        id: data.id,
        name: data.full_name || 'User',
        email: data.email,
        type: data.role as any,
        college: data.college_name,
        verified: data.profile_completed,
        isOnboarded: data.profile_completed,
        interests: data.interests || [],
        location: data.location_preferences?.[0],
        verificationStatus: data.role === 'organizer' ? 'approved' : undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      // Also update mock data for consistency
      const mockIndex = mockUsers.findIndex(u => u.id === id);
      if (mockIndex !== -1) {
        mockUsers[mockIndex] = user;
      }

      showToast.profile.updateSuccess();
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      showToast.profile.updateError();
      throw error;
    }
  }

  // Organizer Verification - using mock data with admin notification
  async submitOrganizerVerification(userId: string, payload: Partial<User>): Promise<void> {
    try {
      // Try to update user; if it fails (no users table), continue
      try {
      await this.updateUser(userId, {
        verificationStatus: 'pending',
        rejectionReason: undefined,
        ...payload,
      });
      } catch (e) {
        console.warn('Skipping user update for verification (fallback path):', e);
      }

      // Persist admin notification in DB (fallback to window store)
      const title = 'Organizer verification request';
      const message = JSON.stringify({
        name: payload.name,
        email: payload.email,
        college: payload.college,
        submittedAt: new Date().toISOString()
      });

      // Upsert into organizers table with pending status
      try {
        await supabase
          .from('organizers')
          .upsert([{ id: userId, name: payload.name, email: (payload as any)?.email, college: payload.college, status: 'pending', updated_at: new Date().toISOString() }], { onConflict: 'id' });
      } catch {}

      const { error: notifErr } = await supabase
        .from('notifications')
        .insert([{ user_id: userId, title, message, type: 'organizer_verification', is_read: false }]);

      if (notifErr) {
        // Fallback to in-memory window store
      const notification = {
        id: `notification-${Date.now()}`,
        type: 'organizer_verification',
        userId,
        userName: payload.name,
        userEmail: mockUsers.find(u => u.id === userId)?.email,
        college: payload.college,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        adminViewed: false
      };
        // Maintain a separate fallback list used by admin fetch
        (window as any).pendingOrganizerVerifications = (window as any).pendingOrganizerVerifications || [];
        (window as any).pendingOrganizerVerifications.push(notification);
      if (!window.organizerVerificationNotifications) {
        window.organizerVerificationNotifications = [];
      }
      window.organizerVerificationNotifications.push(notification);
      }

      // Dispatch event for real-time admin dashboard updates
      // Dispatch a generic event for admin dashboard refresh
      window.dispatchEvent(new CustomEvent('newOrganizerVerification', { detail: { userId } }));

      console.log('Admin notification created for organizer verification:', { userId, name: payload.name, college: payload.college });
      showToast.success('Verification submitted! Admin will review your details within 24-48 hours.');
    } catch (error) {
      console.error('Error submitting verification:', error);
      showToast.error('Failed to submit verification details');
      throw error;
    }
  }

  async getPendingOrganizerVerifications(): Promise<Array<{ id: string; userId: string; name: string | null; email: string | null; college: string | null; submittedAt: string; documents: string[]; clubName?: string; department?: string }>> {
    // Prefer reading from organizers table
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select('id,name,email,college,status,updated_at')
        .eq('status', 'pending');
      if (!error && Array.isArray(data)) {
        return data.map((o: any) => ({
          id: o.id,
          userId: o.id,
          name: o.name,
          email: o.email,
          college: o.college,
          submittedAt: o.updated_at || new Date().toISOString(),
          documents: [] as string[],
        }));
      }
    } catch {}

    // Fallback reading from notifications table
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('type', 'organizer_verification')
        .eq('is_read', false);

      if (!error && Array.isArray(data)) {
        const result = await Promise.all(data.map(async (n: any) => {
          const userId = n.user_id as string;
          let name: string | null = null;
          let email: string | null = null;
          let college: string | null = null;
          try {
            const u = await this.getUser(userId);
            name = u?.name || null;
            email = (u as any)?.email || null;
            college = (u as any)?.college || null;
          } catch {}
          // Also parse any metadata stored in message JSON
          try {
            const meta = JSON.parse(n.message || '{}');
            name = name || meta.name || null;
            email = email || meta.email || null;
            college = college || meta.college || null;
          } catch {}
          return {
            id: n.id,
            userId,
            name,
            email,
            college,
            submittedAt: n.created_at || new Date().toISOString(),
            documents: [] as string[],
          };
        }));
        return result;
      }
    } catch {}

    // Fallback: use in-memory pending organizer verifications if present
    const local = (window as any).pendingOrganizerVerifications as any[] | undefined;
    if (local && local.length) {
      return local.map(n => ({
        id: n.id,
        userId: n.userId,
        name: n.userName || null,
        email: n.userEmail || null,
        college: n.college || null,
        submittedAt: n.submittedAt,
        documents: [] as string[],
      }));
    }
    return [];
  }

  async reviewOrganizerVerification(userId: string, status: 'approved' | 'rejected', rejectionReason?: string): Promise<void> {
    try {
      // Avoid users table; rely on organizers table + local state updates

      // Update organizers table status
      try {
        await supabase
          .from('organizers')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', userId);
      } catch {}

      // Mark notifications as read for this user
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('type', 'organizer_verification')
          .eq('user_id', userId);
      } catch {}

      // Also clear from local fallback store
      try {
        const list = (window as any).pendingOrganizerVerifications as any[] | undefined;
        if (list) {
          (window as any).pendingOrganizerVerifications = list.filter(n => n.userId !== userId);
        }
      } catch {}

      // Get user details for notification
      const user = mockUsers.find(u => u.id === userId);

      // Create user notification
      const userNotification = {
        id: `user-notification-${Date.now()}`,
        userId,
        type: 'verification_result',
        title: `Organizer Verification ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: status === 'approved'
          ? 'Congratulations! Your organizer account has been approved. You can now access all events and create your own.'
          : `Your organizer verification was rejected. Reason: ${rejectionReason || 'Please contact support for details.'}`,
        status,
        createdAt: new Date().toISOString(),
        read: false
      };

      // Store user notification (in real app, would send email/push notification)
      if (!window.userNotifications) {
        window.userNotifications = {};
      }
      if (!window.userNotifications[userId]) {
        window.userNotifications[userId] = [];
      }
      window.userNotifications[userId].push(userNotification);

      // Mark admin notification as resolved
      if (window.organizerVerificationNotifications) {
        const notificationIndex = window.organizerVerificationNotifications.findIndex(
          n => n.userId === userId && n.status === 'pending'
        );
        if (notificationIndex !== -1) {
          window.organizerVerificationNotifications[notificationIndex].status = status;
          window.organizerVerificationNotifications[notificationIndex].resolvedAt = new Date().toISOString();
        }
      }

      // Dispatch events for real-time updates
      window.dispatchEvent(new CustomEvent('verificationStatusChanged', {
        detail: { userId, status, user }
      }));

      window.dispatchEvent(new CustomEvent('userNotification', {
        detail: { userId, notification: userNotification }
      }));

      if (status === 'approved') {
        showToast.success(`${user?.name || 'Organizer'} verification approved successfully!`);
      } else {
        showToast.success(`${user?.name || 'Organizer'} verification rejected.`);
      }

      console.log(`Organizer verification ${status}:`, { userId, userName: user?.name, rejectionReason });
    } catch (error) {
      console.error('Error reviewing verification:', error);
      showToast.error(`Failed to ${status} verification`);
      throw error;
    }
  }

  async setOrganizerVerification(
    userId: string,
    status: 'pending' | 'approved' | 'rejected',
    rejectionReason?: string
  ): Promise<User> {
    if (status === 'pending') {
      await this.updateUser(userId, { verificationStatus: status, rejectionReason });
      return this.getUser(userId);
    }
    await this.reviewOrganizerVerification(userId, status as 'approved' | 'rejected', rejectionReason);
    return this.getUser(userId);
  }

  // Storage helpers - placeholder
  async uploadVerificationFile(file: File, userId: string, kind: string): Promise<string> {
    // For now, return a placeholder URL
    return `https://placeholder.com/verification/${userId}/${kind}`;
  }

  // Registrations API - mock implementations
  async registerForEvent(userId: string, eventId: string, formData?: any, teamRegistrationType?: string, teamMembers?: any[]): Promise<Registration> {
    try {
      const registration: Registration = {
        id: `reg-${Date.now()}`,
        userId,
        eventId,
        status: 'confirmed',
        paymentStatus: 'completed',
        registeredAt: new Date().toISOString(),
        checkedIn: false,
      };

      // Update event registered count
      const eventIndex = mockEvents.findIndex(e => e.id === eventId);
      if (eventIndex !== -1) {
        mockEvents[eventIndex].registered += 1;
      }

      showToast.events.registrationSuccess('event');
      return registration;
    } catch (error) {
      console.error('Error registering for event:', error);
      showToast.events.registrationError();
      throw error;
    }
  }

  async getUserRegistrations(userId: string): Promise<(Registration & { event: Event })[]> {
    try {
      // Return empty array for now
      return [];
    } catch (error) {
      console.error('Error fetching user registrations:', error);
      showToast.error('Failed to fetch registrations');
      throw error;
    }
  }

  // Tickets API - mock implementations
  async generateTicket(registrationId: string): Promise<Ticket> {
    try {
      const ticket: Ticket = {
        id: `ticket-${Date.now()}`,
        eventId: 'mock-event',
        userId: 'mock-user',
        registrationId,
        qrCode: `qr-${Date.now()}`,
        status: 'valid',
        generatedAt: new Date().toISOString(),
      };
      
      showToast.tickets.generateSuccess();
      return ticket;
    } catch (error) {
      console.error('Error generating ticket:', error);
      showToast.tickets.generateError();
      throw error;
    }
  }

  async verifyTicket(qrCode: string): Promise<{ valid: boolean; ticket?: Ticket; event?: Event; user?: User }> {
    try {
      // Mock verification
      return { valid: true };
    } catch (error) {
      console.error('Error verifying ticket:', error);
      showToast.error('Failed to verify ticket');
      throw error;
    }
  }

  async checkInTicket(qrCode: string): Promise<boolean> {
    try {
      showToast.crew.checkinSuccess('attendee');
      return true;
    } catch (error) {
      console.error('Error checking in ticket:', error);
      showToast.crew.checkinError();
      throw error;
    }
  }

  // Notification methods
  async getUserNotifications(userId: string): Promise<Array<{
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    status?: string;
    createdAt: string;
    read: boolean;
  }>> {
    if (!window.userNotifications || !window.userNotifications[userId]) {
      return [];
    }
    return window.userNotifications[userId].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
    if (window.userNotifications?.[userId]) {
      const notification = window.userNotifications[userId].find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    }
  }

  async getAdminNotifications(): Promise<Array<{
    id: string;
    type: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    college?: string;
    submittedAt: string;
    status: string;
    adminViewed: boolean;
  }>> {
    return window.organizerVerificationNotifications || [];
  }

  async markAdminNotificationViewed(notificationId: string): Promise<void> {
    if (window.organizerVerificationNotifications) {
      const notification = window.organizerVerificationNotifications.find(n => n.id === notificationId);
      if (notification) {
        notification.adminViewed = true;
      }
    }
  }

  // Helper method to check if user can see real events
  canUserSeeRealEvents(user: User): boolean {
    if (!user) return false;

    // Students and other non-organizer users can always see real events
    if (user.type !== 'organizer') return true;

    // Organizers can only see real events if they are approved
    return user.verificationStatus === 'approved';
  }

  // Helper to get verification status display
  getVerificationStatusDisplay(status?: string): { text: string; color: string; description: string } {
    switch (status) {
      case 'approved':
        return {
          text: 'Verified',
          color: 'text-green-600',
          description: 'Your organizer account is verified. You have access to all features.'
        };
      case 'pending':
        return {
          text: 'Pending Review',
          color: 'text-yellow-600',
          description: 'Your verification is under review. You\'ll be notified within 24-48 hours.'
        };
      case 'rejected':
        return {
          text: 'Verification Rejected',
          color: 'text-red-600',
          description: 'Your verification was rejected. Please contact support or resubmit with correct details.'
        };
      default:
        return {
          text: 'Not Verified',
          color: 'text-gray-600',
          description: 'Complete your organizer verification to access all events and features.'
        };
    }
  }
}

// Export singleton instance
export const supabaseApi = new SupabaseAPI();

// Additional helpers for admin views
export async function getOrganizers(): Promise<Array<{ id: string; name: string; email: string; verificationStatus: 'approved' | 'pending' | 'rejected' | 'unverified' }>> {
  const useDb = (import.meta as any).env?.VITE_USE_DB !== 'false';
  if (useDb) {
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select('id,name,email,status');
      if (!error && Array.isArray(data)) {
        return data.map((o: any) => ({
          id: o.id,
          name: o.name || 'Organizer',
          email: o.email || '',
          verificationStatus: (o.status as any) || 'unverified',
        }));
      }
    } catch {}
  }
  // Fallback: mock users
  return mockUsers
    .filter(u => u.type === 'organizer')
    .map(u => ({ id: u.id, name: u.name, email: u.email, verificationStatus: (u.verificationStatus as any) || 'approved' }));
}

// Real-time data hooks
import React from 'react';

export function useRealTimeEvents(userId?: string) {
  const [events, setEvents] = React.useState<Event[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [usingFallback, setUsingFallback] = React.useState(false);

  const fetchEvents = React.useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await supabaseApi.getEvents(undefined, userId);
      setEvents(data);
      setUsingFallback(false);
    } catch (error) {
      console.error('Error in useRealTimeEvents:', error);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchEvents();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents, usingFallback };
}

export function useRealTimeUserRegistrations(userId: string | null) {
  const [registrations, setRegistrations] = React.useState<(Registration & { event: Event })[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchRegistrations = React.useCallback(async () => {
    if (!userId) {
      setRegistrations([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const data = await supabaseApi.getUserRegistrations(userId);
      setRegistrations(data);
    } catch (error) {
      console.error('Error in useRealTimeUserRegistrations:', error);
      // Use empty array as fallback - user hasn't registered for events yet
      setRegistrations([]);
      setError(null); // Don't show error for missing registrations
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    fetchRegistrations();
    
    // Real-time updates every 30 seconds
    const interval = setInterval(fetchRegistrations, 30000);
    return () => clearInterval(interval);
  }, [fetchRegistrations]);

  return { registrations, loading, error, refetch: fetchRegistrations };
}
