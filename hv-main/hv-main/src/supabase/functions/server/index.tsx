import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "apikey",
      "X-User-ID",
      "x-client-info",
      "Range"
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Explicit OPTIONS handler to guarantee HTTP 204 for preflight
app.options("/*", (c) => c.text("", 204));

// Types
interface Event {
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

interface User {
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
  createdAt: string;
  updatedAt: string;
}

interface Registration {
  id: string;
  userId: string;
  eventId: string;
  ticketId?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  registeredAt: string;
  checkedIn: boolean;
  checkedInAt?: string;
  formData?: any; // Store complete registration form data
  teamInfo?: {
    teamId?: string;
    teamName?: string;
    teamRole?: string;
    isTeamLeader?: boolean;
    teamMembers?: Array<{
      name: string;
      email: string;
      role: string;
      skills?: string;
    }>;
  };
}

interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  registrationId: string;
  qrCode: string;
  status: 'valid' | 'used' | 'cancelled';
  generatedAt: string;
  usedAt?: string;
}

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function generateQRCode(): string {
  return 'QR_' + Math.random().toString(36).substr(2, 12).toUpperCase();
}

// Validation helper - using Hono context
function validateAuth(c: any): string | null {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      console.log('No Authorization header found');
      return null;
    }
    
    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      console.log('No access token found in Authorization header');
      return null;
    }
    
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!anonKey) {
      console.log('SUPABASE_ANON_KEY environment variable not found');
      return null;
    }
    
    const isValid = accessToken === anonKey;
    console.log('Auth validation result:', { isValid, hasToken: !!accessToken, hasAnonKey: !!anonKey });
    
    return isValid ? 'valid' : null;
  } catch (error) {
    console.error('Error in validateAuth:', error);
    return null;
  }
}

// Initialize demo data only (separate from user data)
async function initializeDemoData() {
  try {
    // Check if demo data already exists
    const existingDemoEvents = await kv.get('demo_events');
    if (existingDemoEvents) return;

    // Create demo events (only for demo accounts)
    const demoEvents: Event[] = [
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
        organizerId: 'user_organizer1',
        price: 299,
        capacity: 500,
        registered: 245,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=600&fit=crop&auto=format',
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
        organizerId: 'user_organizer1',
        price: 199,
        capacity: 300,
        registered: 156,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&auto=format',
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
        organizerId: 'user_organizer1',
        price: 0,
        capacity: 200,
        registered: 89,
        status: 'upcoming',
        image: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=600&fit=crop&auto=format',
        tags: ['coding', 'hackathon', 'programming', 'innovation'],
        requirements: ['Laptop', 'Programming Knowledge', 'Team of 2-4'],
        prizes: ['₹1,00,000 Prize Pool', 'Job Opportunities', 'Mentorship'],
        createdAt: '2024-02-10T00:00:00Z',
        updatedAt: '2024-02-20T00:00:00Z',
      }
    ];

    // Create demo users (only specific demo accounts)
    const demoUsers: User[] = [
      {
        id: 'user_student1',
        name: 'Alex Johnson',
        email: 'student@demo.com',
        type: 'student',
        college: 'IIT Delhi',
        phone: '+91 9876543210',
        interests: ['technology', 'sports', 'music'],
        location: 'Delhi',
        verified: true,
        isOnboarded: true,
        year: '3rd Year',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
      },
      {
        id: 'user_organizer1',
        name: 'Sarah Wilson',
        email: 'organizer@demo.com',
        type: 'organizer',
        college: 'IIT Delhi',
        verified: true,
        isOnboarded: true,
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
      },
      {
        id: 'user_crew1',
        name: 'Mike Chen',
        email: 'crew@demo.com',
        type: 'crew',
        college: 'IIT Delhi',
        verified: true,
        isOnboarded: true,
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z',
      },
      {
        id: 'user_admin1',
        name: 'Admin User',
        email: 'admin@demo.com',
        type: 'admin',
        verified: true,
        isOnboarded: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      }
    ];

    // Store demo data separately
    await kv.set('demo_events', demoEvents);
    await kv.set('demo_users', demoUsers);
    
    // Initialize empty real data stores if they don't exist
    const existingEvents = await kv.get('events');
    const existingUsers = await kv.get('users');
    
    if (!existingEvents) {
      await kv.set('events', []);
    }
    if (!existingUsers) {
      await kv.set('users', []);
    }
    if (!await kv.get('registrations')) {
      await kv.set('registrations', []);
    }
    if (!await kv.get('tickets')) {
      await kv.set('tickets', []);
    }

    console.log('Demo data initialized successfully');
  } catch (error) {
    console.error('Error initializing demo data:', error);
  }
}

// Helper function to check if user is a demo account
function isDemoAccount(email: string): boolean {
  const demoEmails = ['student@demo.com', 'organizer@demo.com', 'crew@demo.com', 'admin@demo.com'];
  return demoEmails.includes(email);
}

// Initialize demo data on startup
initializeDemoData();

// Health check endpoint
app.get("/make-server-a833dcda/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth endpoints
app.post("/make-server-a833dcda/auth/signup", async (c) => {
  try {
    const { email, password, name, type } = await c.req.json();
    
    // Check if it's a demo email (should not be allowed for signup)
    if (isDemoAccount(email)) {
      return c.json({ error: 'This email is reserved for demo accounts. Please use a different email address.' }, 400);
    }

    // First, try to get existing user by email to see if they already exist
    const { data: existingAuthUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    let authUser = null;
    let isNewAuthUser = true;
    
    if (!listError && existingAuthUsers) {
      const existingUser = existingAuthUsers.users.find(u => u.email === email);
      if (existingUser) {
        authUser = existingUser;
        isNewAuthUser = false;
        console.log('Found existing auth user:', existingUser.id, 'for email:', email);
      }
    } else if (listError) {
      console.error('Error listing existing users:', listError);
      // Continue anyway, let createUser handle the duplicate check
    }

    // If user doesn't exist in auth, create them
    if (isNewAuthUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        user_metadata: { name, type },
        email_confirm: true // Automatically confirm since email server isn't configured
      });

      if (error) {
        console.error('Signup error:', error);
        if (error.message.includes('already been registered')) {
          return c.json({ error: 'An account with this email already exists. Please try logging in instead.' }, 400);
        }
        return c.json({ error: error.message }, 400);
      }
      
      authUser = data.user;
    }

    if (!authUser) {
      return c.json({ error: 'Failed to create or find user account' }, 500);
    }

    // Check if user profile already exists in our system
    const users = await kv.get('users') || [];
    const existingProfile = users.find(u => u.id === authUser.id || u.email === email);
    
    if (existingProfile) {
      console.log('Found existing profile for user:', existingProfile.id);
      
      // User profile already exists
      if (isNewAuthUser) {
        // This shouldn't happen - we created a new auth user but profile exists
        // This might be data inconsistency, but let's return the existing profile
        console.warn('Data inconsistency: new auth user but existing profile found');
        return c.json({ user: existingProfile });
      } else {
        // Auth user exists and profile exists - this is a complete duplicate
        console.log('Complete duplicate signup attempt for email:', email);
        return c.json({ error: 'An account with this email already exists. Please try logging in instead.' }, 400);
      }
    }

    // If we have an existing auth user but no profile, create the profile
    if (!isNewAuthUser && !existingProfile) {
      console.log('Creating profile for existing auth user:', authUser.id);
      
      // Create user profile for existing auth user
      const newUser: User = {
        id: authUser.id,
        name,
        email,
        type,
        verified: true, // Auth user already exists so they're verified
        isOnboarded: false,
        createdAt: authUser.created_at || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      users.push(newUser);
      await kv.set('users', users);

      console.log('Created profile for existing auth user:', newUser.id);
      return c.json({ user: newUser });
    }

    // Create new user profile in our data store
    const newUser: User = {
      id: authUser.id,
      name,
      email,
      type,
      verified: true, // Since we auto-confirm emails
      isOnboarded: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    await kv.set('users', users);

    console.log('Created new user profile:', newUser.id);
    return c.json({ user: newUser });
    
  } catch (error) {
    console.error('Signup error during user creation:', error);
    return c.json({ error: 'Signup failed. Please try again.' }, 500);
  }
});

app.post("/make-server-a833dcda/auth/create-profile", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await c.req.json();
    const users = await kv.get('users') || [];
    
    // Check if user already exists
    const existingUser = users.find(u => u.id === userData.id);
    if (existingUser) {
      return c.json({ user: existingUser });
    }

    // Create new user profile
    const newUser: User = {
      ...userData,
      verified: true, // OAuth users are considered verified
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    await kv.set('users', users);

    return c.json({ user: newUser });
  } catch (error) {
    console.error('Error creating OAuth profile:', error);
    return c.json({ error: 'Failed to create profile' }, 500);
  }
});

// Helper endpoint to clean up orphaned auth users (for development)
app.post("/make-server-a833dcda/auth/cleanup", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }

    // Get all auth users
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      return c.json({ error: 'Failed to list users' }, 500);
    }

    // Find the user by email
    const authUser = authUsers.users.find(u => u.email === email);
    
    if (!authUser) {
      return c.json({ error: 'User not found in auth system' }, 404);
    }

    // Check if user has a profile in our system
    const users = await kv.get('users') || [];
    const userProfile = users.find(u => u.id === authUser.id || u.email === email);
    
    if (userProfile) {
      return c.json({ error: 'User has a profile and cannot be cleaned up' }, 400);
    }

    // Delete the orphaned auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
    
    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return c.json({ error: 'Failed to delete user' }, 500);
    }

    console.log('Cleaned up orphaned auth user:', email);
    return c.json({ message: 'User cleaned up successfully' });
    
  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    return c.json({ error: 'Cleanup failed' }, 500);
  }
});

app.post("/make-server-a833dcda/auth/callback", async (c) => {
  try {
    // Handle OAuth callback
    const { session, user: authUser } = await c.req.json();
    
    if (!session || !authUser) {
      return c.json({ error: 'Invalid callback data' }, 400);
    }

    const users = await kv.get('users') || [];
    let user = users.find(u => u.id === authUser.id);

    if (!user) {
      // Create new user profile for OAuth user
      user = {
        id: authUser.id,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        type: authUser.user_metadata?.type || 'student',
        verified: true,
        isOnboarded: authUser.user_metadata?.type !== 'student', // Only students need onboarding
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      users.push(user);
      await kv.set('users', users);
    }

    return c.json({ user, session });
  } catch (error) {
    console.error('OAuth callback error:', error);
    return c.json({ error: 'OAuth callback failed' }, 500);
  }
});

// Events endpoints
app.get("/make-server-a833dcda/events", async (c) => {
  try {
    const query = c.req.query();
    const requestUserId = c.req.header('X-User-ID'); // We'll pass this from frontend
    
    // Get real events and demo events
    const realEvents = await kv.get('events') || [];
    const demoEvents = await kv.get('demo_events') || [];
    
    // Determine if user is demo account based on user ID or other criteria
    let events = realEvents;
    
    // If no real events exist or user is demo, include demo events
    if (realEvents.length === 0 || (requestUserId && (requestUserId.startsWith('user_') && requestUserId.includes('1')))) {
      events = [...realEvents, ...demoEvents];
    }
    
    let filteredEvents = [...events];
    
    // Apply filters
    if (query.type && query.type !== 'all') {
      filteredEvents = filteredEvents.filter(event => event.type === query.type);
    }
    if (query.college) {
      filteredEvents = filteredEvents.filter(event => 
        event.college.toLowerCase().includes(query.college.toLowerCase())
      );
    }
    if (query.search) {
      const search = query.search.toLowerCase();
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search) ||
        event.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }
    
    // Sort by date
    filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return c.json({ events: filteredEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    return c.json({ error: 'Failed to fetch events' }, 500);
  }
});

app.get("/make-server-a833dcda/events/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const realEvents = await kv.get('events') || [];
    const demoEvents = await kv.get('demo_events') || [];
    const allEvents = [...realEvents, ...demoEvents];
    
    const event = allEvents.find(e => e.id === id);
    
    if (!event) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    return c.json({ event });
  } catch (error) {
    console.error('Error fetching event:', error);
    return c.json({ error: 'Failed to fetch event' }, 500);
  }
});

app.post("/make-server-a833dcda/events", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const eventData = await c.req.json();
    const events = await kv.get('events') || [];
    
    const newEvent: Event = {
      ...eventData,
      id: generateId(),
      registered: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    events.push(newEvent);
    await kv.set('events', events);
    
    return c.json({ event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    return c.json({ error: 'Failed to create event' }, 500);
  }
});

app.put("/make-server-a833dcda/events/:id", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();
    const events = await kv.get('events') || [];
    const index = events.findIndex(e => e.id === id);
    
    if (index === -1) {
      return c.json({ error: 'Event not found' }, 404);
    }
    
    events[index] = { 
      ...events[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    await kv.set('events', events);
    
    return c.json({ event: events[index] });
  } catch (error) {
    console.error('Error updating event:', error);
    return c.json({ error: 'Failed to update event' }, 500);
  }
});

// Organizer Verification endpoints
app.post("/make-server-a833dcda/organizer-verifications", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { userId, ...verificationData } = await c.req.json();
    
    // Upsert verification data into organizer_verifications table
    const { error: upsertError } = await supabase
      .from('organizer_verifications')
      .upsert({
        user_id: userId,
        status: 'pending',
        rejection_reason: null,
        name: verificationData.name || null,
        phone: verificationData.phone || null,
        date_of_birth: verificationData.dateOfBirth || null,
        college: verificationData.college || null,
        college_address: verificationData.collegeAddress || null,
        department_or_course: verificationData.departmentOrCourse || null,
        year: verificationData.year || null,
        club_name: verificationData.clubName || null,
        club_position: verificationData.clubPosition || null,
        club_category: verificationData.clubCategory || null,
        profile_photo_url: verificationData.profilePhotoUrl || null,
        doc_student_id_url: verificationData.docStudentIdUrl || null,
        doc_club_certificate_url: verificationData.docClubCertificateUrl || null,
        bank_account_number: verificationData.bankAccountNumber || null,
        ifsc_code: verificationData.ifscCode || null,
        upi_id: verificationData.upiId || null,
        submitted_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error upserting verification:', upsertError);
      return c.json({ error: 'Failed to submit verification' }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error in organizer verification endpoint:', error);
    return c.json({ error: 'Failed to submit verification' }, 500);
  }
});

app.get("/make-server-a833dcda/organizer-verifications", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { data, error } = await supabase
      .from('organizer_verifications')
      .select(`
        id, 
        user_id, 
        name, 
        college, 
        submitted_at,
        profile_photo_url,
        doc_student_id_url,
        doc_club_certificate_url,
        users:users(email)
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending verifications:', error);
      return c.json({ error: 'Failed to fetch verifications' }, 500);
    }

    const verifications = data.map(v => ({
      id: v.id,
      userId: v.user_id,
      name: v.name,
      email: v.users?.email || null,
      college: v.college,
      submittedAt: v.submitted_at,
      documents: [
        v.profile_photo_url,
        v.doc_student_id_url,
        v.doc_club_certificate_url
      ].filter(Boolean)
    }));

    return c.json({ verifications });
  } catch (error) {
    console.error('Error in get verifications endpoint:', error);
    return c.json({ error: 'Failed to fetch verifications' }, 500);
  }
});

app.put("/make-server-a833dcda/organizer-verifications/:userId", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userId = c.req.param('userId');
    const { status, rejectionReason } = await c.req.json();

    const { error } = await supabase
      .from('organizer_verifications')
      .update({
        status,
        rejection_reason: rejectionReason || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating verification:', error);
      return c.json({ error: 'Failed to update verification' }, 500);
    }

    // Also update the user's verification status
    const { error: userError } = await supabase
      .from('users')
      .update({
        verification_status: status,
        rejection_reason: rejectionReason || null,
      })
      .eq('id', userId);

    if (userError) {
      console.error('Error updating user verification status:', userError);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error in update verification endpoint:', error);
    return c.json({ error: 'Failed to update verification' }, 500);
  }
});

// Users endpoints
app.get("/make-server-a833dcda/users/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const realUsers = await kv.get('users') || [];
    const demoUsers = await kv.get('demo_users') || [];
    const allUsers = [...realUsers, ...demoUsers];
    
    const user = allUsers.find(u => u.id === id);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

app.put("/make-server-a833dcda/users/:id", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();
    
    // Check if it's a demo user first
    const demoUsers = await kv.get('demo_users') || [];
    const demoIndex = demoUsers.findIndex(u => u.id === id);
    
    if (demoIndex !== -1) {
      // Update demo user
      demoUsers[demoIndex] = { 
        ...demoUsers[demoIndex], 
        ...updates, 
        updatedAt: new Date().toISOString() 
      };
      await kv.set('demo_users', demoUsers);
      return c.json({ user: demoUsers[demoIndex] });
    }
    
    // Otherwise, update real user
    const users = await kv.get('users') || [];
    const index = users.findIndex(u => u.id === id);
    
    if (index === -1) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    users[index] = { 
      ...users[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    await kv.set('users', users);
    
    return c.json({ user: users[index] });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Registration endpoints
app.post("/make-server-a833dcda/registrations", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const requestBody = await c.req.json();
    const { userId, eventId, formData, teamRegistrationType, teamMembers } = requestBody;
    const registrations = await kv.get('registrations') || [];
    const events = await kv.get('events') || [];
    
    // Check if already registered
    const existing = registrations.find(r => r.userId === userId && r.eventId === eventId);
    if (existing) {
      return c.json({ error: 'Already registered for this event' }, 400);
    }

    // Process team information for team-based events
    let teamInfo = undefined;
    if (teamRegistrationType && (teamRegistrationType === 'create' || teamRegistrationType === 'join')) {
      if (teamRegistrationType === 'create') {
        // Generate team ID for new teams
        const teamId = generateId();
        teamInfo = {
          teamId,
          teamName: formData?.teamName || 'Unnamed Team',
          teamRole: formData?.preferredRole || formData?.teamRole || 'Member',
          isTeamLeader: true,
          teamMembers: teamMembers || []
        };
      } else if (teamRegistrationType === 'join') {
        teamInfo = {
          teamCode: formData?.teamCode,
          teamRole: formData?.preferredRole || formData?.teamRole || 'Member',
          isTeamLeader: false
        };
      }
    }
    
    const registration: Registration = {
      id: generateId(),
      userId,
      eventId,
      status: 'confirmed',
      paymentStatus: 'completed',
      registeredAt: new Date().toISOString(),
      checkedIn: false,
      formData: formData || {},
      teamInfo
    };
    
    registrations.push(registration);
    await kv.set('registrations', registrations);
    
    // Update event registration count
    const eventIndex = events.findIndex(e => e.id === eventId);
    if (eventIndex !== -1) {
      events[eventIndex].registered += 1;
      await kv.set('events', events);
    }

    console.log('Registration created successfully:', {
      registrationId: registration.id,
      eventId,
      userId,
      hasTeamInfo: !!teamInfo,
      hasFormData: !!formData
    });
    
    return c.json({ registration });
  } catch (error) {
    console.error('Error creating registration:', error);
    return c.json({ error: 'Failed to register for event' }, 500);
  }
});

app.get("/make-server-a833dcda/users/:userId/registrations", async (c) => {
  try {
    const userId = c.req.param('userId');
    const registrations = await kv.get('registrations') || [];
    const events = await kv.get('events') || [];
    
    const userRegistrations = registrations
      .filter(reg => reg.userId === userId)
      .map(reg => ({
        ...reg,
        event: events.find(e => e.id === reg.eventId)
      }))
      .filter(reg => reg.event);
    
    return c.json({ registrations: userRegistrations });
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    return c.json({ error: 'Failed to fetch registrations' }, 500);
  }
});

// Ticket endpoints
app.post("/make-server-a833dcda/tickets", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { registrationId } = await c.req.json();
    const registrations = await kv.get('registrations') || [];
    const tickets = await kv.get('tickets') || [];
    
    const registration = registrations.find(r => r.id === registrationId);
    if (!registration) {
      return c.json({ error: 'Registration not found' }, 404);
    }
    
    // Check if ticket already exists
    const existingTicket = tickets.find(t => t.registrationId === registrationId);
    if (existingTicket) {
      return c.json({ ticket: existingTicket });
    }
    
    const ticket: Ticket = {
      id: generateId(),
      eventId: registration.eventId,
      userId: registration.userId,
      registrationId,
      qrCode: generateQRCode(),
      status: 'valid',
      generatedAt: new Date().toISOString(),
    };
    
    tickets.push(ticket);
    await kv.set('tickets', tickets);
    
    // Update registration with ticket ID
    const regIndex = registrations.findIndex(r => r.id === registrationId);
    if (regIndex !== -1) {
      registrations[regIndex].ticketId = ticket.id;
      await kv.set('registrations', registrations);
    }
    
    return c.json({ ticket });
  } catch (error) {
    console.error('Error generating ticket:', error);
    return c.json({ error: 'Failed to generate ticket' }, 500);
  }
});

app.post("/make-server-a833dcda/tickets/verify", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { qrCode } = await c.req.json();
    const tickets = await kv.get('tickets') || [];
    const events = await kv.get('events') || [];
    const users = await kv.get('users') || [];
    
    const ticket = tickets.find(t => t.qrCode === qrCode);
    if (!ticket || ticket.status !== 'valid') {
      return c.json({ valid: false });
    }
    
    const event = events.find(e => e.id === ticket.eventId);
    const user = users.find(u => u.id === ticket.userId);
    
    return c.json({ valid: true, ticket, event, user });
  } catch (error) {
    console.error('Error verifying ticket:', error);
    return c.json({ error: 'Failed to verify ticket' }, 500);
  }
});

app.post("/make-server-a833dcda/tickets/checkin", async (c) => {
  try {
    if (!validateAuth(c)) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { qrCode } = await c.req.json();
    const tickets = await kv.get('tickets') || [];
    const registrations = await kv.get('registrations') || [];
    
    const ticketIndex = tickets.findIndex(t => t.qrCode === qrCode);
    if (ticketIndex === -1 || tickets[ticketIndex].status !== 'valid') {
      return c.json({ success: false, error: 'Invalid ticket' });
    }
    
    // Mark ticket as used
    tickets[ticketIndex].status = 'used';
    tickets[ticketIndex].usedAt = new Date().toISOString();
    await kv.set('tickets', tickets);
    
    // Update registration check-in status
    const regIndex = registrations.findIndex(r => r.id === tickets[ticketIndex].registrationId);
    if (regIndex !== -1) {
      registrations[regIndex].checkedIn = true;
      registrations[regIndex].checkedInAt = new Date().toISOString();
      await kv.set('registrations', registrations);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error checking in ticket:', error);
    return c.json({ error: 'Failed to check in ticket' }, 500);
  }
});

Deno.serve(app.fetch);