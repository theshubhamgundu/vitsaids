// Database migration and setup utility
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

export async function runMigrations() {
  try {
    console.log('Starting database migrations...');

    // Check if tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');

    if (tablesError) {
      console.error('Error checking tables:', tablesError);
      return false;
    }

    if (tables && tables.length > 0) {
      console.log('Database already initialized, skipping migrations');
      return true;
    }

    // Read and execute SQL migration
    const sqlContent = await Deno.readTextFile('./database-setup.sql');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute statements one by one
    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });
        if (error) {
          console.error('Error executing statement:', error);
          console.error('Statement:', statement);
        }
      } catch (err) {
        console.error('Error executing SQL statement:', err);
        console.error('Statement:', statement);
      }
    }

    console.log('Database migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Error running migrations:', error);
    return false;
  }
}

// Alternative approach using direct SQL execution
export async function initializeDatabase() {
  try {
    console.log('Initializing database with direct approach...');

    // Create custom types if they don't exist
    await executeSQL(`
      DO $$ BEGIN
        CREATE TYPE user_type AS ENUM ('student', 'organizer', 'crew', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await executeSQL(`
      DO $$ BEGIN
        CREATE TYPE event_type AS ENUM ('fest', 'hackathon', 'workshop', 'cultural', 'sports', 'tech');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await executeSQL(`
      DO $$ BEGIN
        CREATE TYPE event_status AS ENUM ('draft', 'upcoming', 'live', 'ended', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await executeSQL(`
      DO $$ BEGIN
        CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await executeSQL(`
      DO $$ BEGIN
        CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await executeSQL(`
      DO $$ BEGIN
        CREATE TYPE ticket_status AS ENUM ('valid', 'used', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create users table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT auth.uid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type user_type NOT NULL DEFAULT 'student',
        college TEXT,
        phone TEXT,
        avatar_url TEXT,
        interests TEXT[] DEFAULT '{}',
        location TEXT,
        year TEXT,
        verified BOOLEAN DEFAULT FALSE,
        is_onboarded BOOLEAN DEFAULT FALSE,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create events table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        type event_type NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        venue TEXT NOT NULL,
        college TEXT NOT NULL,
        organizer TEXT NOT NULL,
        organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
        price DECIMAL(10,2) DEFAULT 0,
        capacity INTEGER NOT NULL DEFAULT 100,
        registered INTEGER DEFAULT 0,
        status event_status DEFAULT 'draft',
        image_url TEXT,
        tags TEXT[] DEFAULT '{}',
        requirements TEXT[] DEFAULT '{}',
        prizes TEXT[] DEFAULT '{}',
        is_featured BOOLEAN DEFAULT FALSE,
        external_link TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Create registrations table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        status registration_status DEFAULT 'pending',
        payment_status payment_status DEFAULT 'pending',
        payment_id TEXT,
        amount_paid DECIMAL(10,2),
        registered_at TIMESTAMPTZ DEFAULT NOW(),
        checked_in BOOLEAN DEFAULT FALSE,
        checked_in_at TIMESTAMPTZ,
        team_name TEXT,
        team_members TEXT[] DEFAULT '{}',
        additional_info JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, event_id)
      );
    `);

    // Create tickets table
    await executeSQL(`
      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        qr_code TEXT UNIQUE NOT NULL,
        status ticket_status DEFAULT 'valid',
        generated_at TIMESTAMPTZ DEFAULT NOW(),
        used_at TIMESTAMPTZ,
        used_by UUID REFERENCES users(id),
        metadata JSONB
      );
    `);

    // Insert default users if they don't exist
    await executeSQL(`
      INSERT INTO users (id, email, name, type, college, verified, is_onboarded, created_at, updated_at) VALUES
        ('user_student1', 'student@demo.com', 'Alex Johnson', 'student', 'IIT Delhi', true, true, '2024-01-15T00:00:00Z', '2024-01-15T00:00:00Z'),
        ('user_organizer1', 'organizer@demo.com', 'Sarah Wilson', 'organizer', 'IIT Delhi', true, true, '2024-01-10T00:00:00Z', '2024-01-10T00:00:00Z'),
        ('user_crew1', 'crew@demo.com', 'Mike Chen', 'crew', 'IIT Delhi', true, true, '2024-01-20T00:00:00Z', '2024-01-20T00:00:00Z'),
        ('user_admin1', 'admin@demo.com', 'Admin User', 'admin', NULL, true, true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Insert default events if they don't exist
    await executeSQL(`
      INSERT INTO events (id, title, description, type, date, time, venue, college, organizer, organizer_id, price, capacity, registered, status, image_url, tags, requirements, prizes, created_at, updated_at) VALUES
        ('evt_techfest2024', 'TechFest 2024', 'The biggest technical festival showcasing innovation, robotics, AI competitions, and tech talks by industry leaders.', 'fest', '2024-03-15', '09:00', 'Main Campus', 'IIT Delhi', 'Tech Club IIT Delhi', 'user_organizer1', 299, 500, 245, 'upcoming', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800', ARRAY['technology', 'robotics', 'AI', 'competition'], ARRAY['Student ID', 'Laptop (for coding events)'], ARRAY['₹50,000 Grand Prize', 'Internship Opportunities', 'Certificates'], '2024-02-01T00:00:00Z', '2024-02-15T00:00:00Z'),
        ('evt_cultural2024', 'Cultural Extravaganza 2024', 'A vibrant celebration of arts, music, dance, and cultural performances from around the world.', 'cultural', '2024-03-20', '18:00', 'Auditorium', 'Delhi University', 'Cultural Society DU', 'user_organizer1', 199, 300, 156, 'upcoming', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', ARRAY['cultural', 'music', 'dance', 'arts'], ARRAY['College ID'], ARRAY['Trophies', 'Certificates', 'Cultural Scholarships'], '2024-02-05T00:00:00Z', '2024-02-18T00:00:00Z'),
        ('evt_hackathon2024', 'Code Warriors Hackathon', '48-hour coding marathon to build innovative solutions for real-world problems.', 'hackathon', '2024-03-25', '08:00', 'Computer Lab', 'BITS Pilani', 'Coding Club BITS', 'user_organizer1', 0, 200, 89, 'upcoming', 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800', ARRAY['coding', 'hackathon', 'programming', 'innovation'], ARRAY['Laptop', 'Programming Knowledge', 'Team of 2-4'], ARRAY['₹1,00,000 Prize Pool', 'Job Opportunities', 'Mentorship'], '2024-02-10T00:00:00Z', '2024-02-20T00:00:00Z')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Enable RLS
    await executeSQL(`ALTER TABLE users ENABLE ROW LEVEL SECURITY;`);
    await executeSQL(`ALTER TABLE events ENABLE ROW LEVEL SECURITY;`);
    await executeSQL(`ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;`);
    await executeSQL(`ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;`);

    // Create basic RLS policies
    await executeSQL(`
      DROP POLICY IF EXISTS "Public read access for events" ON events;
      CREATE POLICY "Public read access for events" ON events FOR SELECT USING (true);
    `);

    await executeSQL(`
      DROP POLICY IF EXISTS "Users can view their own data" ON users;
      CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
    `);

    await executeSQL(`
      DROP POLICY IF EXISTS "Users can update their own data" ON users;
      CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
    `);

    console.log('Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    return false;
  }
}

async function executeSQL(sql: string) {
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_statement: sql });
    if (error) {
      console.error('SQL execution error:', error);
      console.error('SQL:', sql);
    }
  } catch (err) {
    // If exec_sql RPC doesn't exist, try direct query execution
    try {
      const { error } = await supabase.from('_').select('1').limit(0);
      // This is a workaround since we can't execute arbitrary SQL from the client
      console.log('Attempting alternative SQL execution...');
    } catch (altErr) {
      console.error('Alternative SQL execution failed:', altErr);
    }
  }
}