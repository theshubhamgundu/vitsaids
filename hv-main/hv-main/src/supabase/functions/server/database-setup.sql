-- FindMyEvent Platform Database Schema
-- Complete database setup with all tables and RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_type AS ENUM ('student', 'organizer', 'crew', 'admin');
CREATE TYPE event_type AS ENUM ('fest', 'hackathon', 'workshop', 'cultural', 'sports', 'tech');
CREATE TYPE event_status AS ENUM ('draft', 'upcoming', 'live', 'ended', 'cancelled');
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE ticket_status AS ENUM ('valid', 'used', 'cancelled');

-- Users table
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Organizer verification fields
    verification_status TEXT DEFAULT 'unverified',
    rejection_reason TEXT,
    date_of_birth DATE,
    profile_photo_url TEXT,
    college_address TEXT,
    department_or_course TEXT,
    club_name TEXT,
    club_position TEXT,
    club_category TEXT,
    doc_student_id_url TEXT,
    doc_club_certificate_url TEXT,
    bank_account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    
    CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_phone_check CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT events_price_check CHECK (price >= 0),
    CONSTRAINT events_capacity_check CHECK (capacity > 0),
    CONSTRAINT events_registered_check CHECK (registered >= 0 AND registered <= capacity),
    CONSTRAINT events_datetime_check CHECK (date >= CURRENT_DATE OR (date = CURRENT_DATE AND time >= CURRENT_TIME))
);

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    
    UNIQUE(user_id, event_id),
    CONSTRAINT registrations_amount_check CHECK (amount_paid IS NULL OR amount_paid >= 0)
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    qr_code TEXT UNIQUE NOT NULL,
    status ticket_status DEFAULT 'valid',
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES users(id),
    metadata JSONB,
    
    CONSTRAINT tickets_status_used_check CHECK (
        (status = 'used' AND used_at IS NOT NULL) OR 
        (status != 'used' AND used_at IS NULL)
    )
);

-- User sessions table (for custom session management)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    event_reminders BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    preferred_colleges TEXT[] DEFAULT '{}',
    preferred_event_types event_type[] DEFAULT '{}',
    theme TEXT DEFAULT 'system',
    language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Event analytics table
CREATE TABLE IF NOT EXISTS event_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT,
    payment_gateway TEXT,
    transaction_id TEXT UNIQUE,
    gateway_response JSONB,
    status payment_status DEFAULT 'pending',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT payment_amount_check CHECK (amount > 0)
);

-- Event crew assignments
CREATE TABLE IF NOT EXISTS event_crew (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    
    UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_college ON events(college);
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_registration_id ON tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_crew ENABLE ROW LEVEL SECURITY;

-- Organizer verification submissions table (DB-driven instead of localStorage)
CREATE TABLE IF NOT EXISTS organizer_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    -- Snapshot of submitted fields
    name TEXT,
    phone TEXT,
    date_of_birth DATE,
    college TEXT,
    college_address TEXT,
    department_or_course TEXT,
    year TEXT,
    club_name TEXT,
    club_position TEXT,
    club_category TEXT,
    profile_photo_url TEXT,
    doc_student_id_url TEXT,
    doc_club_certificate_url TEXT,
    bank_account_number TEXT,
    ifsc_code TEXT,
    upi_id TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES users(id)
);

ALTER TABLE organizer_verifications ENABLE ROW LEVEL SECURITY;

-- RLS: Organizers can insert and view their own submission; Admins can view all and update
DROP POLICY IF EXISTS "Organizers insert their verification" ON organizer_verifications;
CREATE POLICY "Organizers insert their verification" ON organizer_verifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizers read their verification" ON organizer_verifications;
CREATE POLICY "Organizers read their verification" ON organizer_verifications
    FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'));

DROP POLICY IF EXISTS "Admins update verification" ON organizer_verifications;
CREATE POLICY "Admins update verification" ON organizer_verifications
    FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'));

DROP POLICY IF EXISTS "Admins delete verification" ON organizer_verifications;
CREATE POLICY "Admins delete verification" ON organizer_verifications
    FOR DELETE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin'));

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable" ON users;
CREATE POLICY "Public profiles are viewable" ON users
    FOR SELECT USING (true);

-- RLS Policies for events table
DROP POLICY IF EXISTS "Events are viewable by everyone" ON events;
CREATE POLICY "Events are viewable by everyone" ON events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Organizers can create events" ON events;
CREATE POLICY "Organizers can create events" ON events
    FOR INSERT WITH CHECK (
        auth.uid() = organizer_id AND 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type IN ('organizer', 'admin'))
    );

DROP POLICY IF EXISTS "Organizers can update their own events" ON events;
CREATE POLICY "Organizers can update their own events" ON events
    FOR UPDATE USING (
        auth.uid() = organizer_id OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
    );

DROP POLICY IF EXISTS "Organizers can delete their own events" ON events;
CREATE POLICY "Organizers can delete their own events" ON events
    FOR DELETE USING (
        auth.uid() = organizer_id OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
    );

-- RLS Policies for registrations table
DROP POLICY IF EXISTS "Users can view their own registrations" ON registrations;
CREATE POLICY "Users can view their own registrations" ON registrations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type IN ('admin', 'crew'))
    );

DROP POLICY IF EXISTS "Users can create their own registrations" ON registrations;
CREATE POLICY "Users can create their own registrations" ON registrations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own registrations" ON registrations;
CREATE POLICY "Users can update their own registrations" ON registrations
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type IN ('admin', 'crew'))
    );

-- RLS Policies for tickets table
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
CREATE POLICY "Users can view their own tickets" ON tickets
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type IN ('admin', 'crew'))
    );

DROP POLICY IF EXISTS "System can create tickets" ON tickets;
CREATE POLICY "System can create tickets" ON tickets
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Crew can update tickets" ON tickets;
CREATE POLICY "Crew can update tickets" ON tickets
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type IN ('crew', 'admin')) OR
        auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id)
    );

-- RLS Policies for user_sessions table
DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own sessions" ON user_sessions;
CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for notifications table
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON notifications;
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- RLS Policies for user_preferences table
DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for event_analytics table
DROP POLICY IF EXISTS "Event analytics are viewable by organizers and admins" ON event_analytics;
CREATE POLICY "Event analytics are viewable by organizers and admins" ON event_analytics
    FOR SELECT USING (
        auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
    );

-- RLS Policies for payment_transactions table
DROP POLICY IF EXISTS "Users can view their own transactions" ON payment_transactions;
CREATE POLICY "Users can view their own transactions" ON payment_transactions
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
    );

DROP POLICY IF EXISTS "System can manage transactions" ON payment_transactions;
CREATE POLICY "System can manage transactions" ON payment_transactions
    FOR ALL WITH CHECK (true);

-- RLS Policies for event_crew table
DROP POLICY IF EXISTS "Event crew assignments are viewable" ON event_crew;
CREATE POLICY "Event crew assignments are viewable" ON event_crew
    FOR SELECT USING (
        auth.uid() = user_id OR
        auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
    );

DROP POLICY IF EXISTS "Organizers can manage crew assignments" ON event_crew;
CREATE POLICY "Organizers can manage crew assignments" ON event_crew
    FOR ALL USING (
        auth.uid() IN (SELECT organizer_id FROM events WHERE id = event_id) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND type = 'admin')
    );

-- Create functions for common operations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at 
    BEFORE UPDATE ON events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
CREATE TRIGGER update_registrations_updated_at 
    BEFORE UPDATE ON registrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizer_verifications_updated_at ON organizer_verifications;
CREATE TRIGGER update_organizer_verifications_updated_at
    BEFORE UPDATE ON organizer_verifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate QR codes
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'QR_' || upper(encode(gen_random_bytes(8), 'hex'));
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create user preferences on user creation
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_preferences (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_user_preferences_trigger ON users;
CREATE TRIGGER create_user_preferences_trigger
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_preferences();

-- Function to update event registration count
CREATE OR REPLACE FUNCTION update_event_registration_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        UPDATE events SET registered = registered + 1 WHERE id = NEW.event_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            UPDATE events SET registered = registered + 1 WHERE id = NEW.event_id;
        ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            UPDATE events SET registered = registered - 1 WHERE id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
        UPDATE events SET registered = registered - 1 WHERE id = OLD.event_id;
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_event_registration_count_trigger ON registrations;
CREATE TRIGGER update_event_registration_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON registrations
    FOR EACH ROW EXECUTE FUNCTION update_event_registration_count();

-- Function to automatically create ticket after confirmed registration
CREATE OR REPLACE FUNCTION create_ticket_after_registration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND NEW.payment_status = 'completed' THEN
        INSERT INTO tickets (registration_id, user_id, event_id, qr_code)
        VALUES (NEW.id, NEW.user_id, NEW.event_id, generate_qr_code());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_ticket_after_registration_trigger ON registrations;
CREATE TRIGGER create_ticket_after_registration_trigger
    AFTER INSERT OR UPDATE ON registrations
    FOR EACH ROW EXECUTE FUNCTION create_ticket_after_registration();

-- Create views for common queries
CREATE OR REPLACE VIEW event_details AS
SELECT 
    e.*,
    u.name as organizer_name,
    u.email as organizer_email,
    COUNT(DISTINCT r.id) as total_registrations,
    COUNT(DISTINCT CASE WHEN r.status = 'confirmed' THEN r.id END) as confirmed_registrations,
    COUNT(DISTINCT CASE WHEN r.checked_in = true THEN r.id END) as checked_in_count
FROM events e
LEFT JOIN users u ON e.organizer_id = u.id
LEFT JOIN registrations r ON e.id = r.event_id
GROUP BY e.id, u.name, u.email;

CREATE OR REPLACE VIEW user_registrations AS
SELECT 
    r.*,
    e.title as event_title,
    e.date as event_date,
    e.time as event_time,
    e.venue as event_venue,
    e.type as event_type,
    t.qr_code,
    t.status as ticket_status
FROM registrations r
JOIN events e ON r.event_id = e.id
LEFT JOIN tickets t ON r.id = t.registration_id;

-- Insert default data
INSERT INTO users (id, email, name, type, college, verified, is_onboarded, created_at, updated_at) VALUES
    ('user_student1', 'student@demo.com', 'Alex Johnson', 'student', 'IIT Delhi', true, true, '2024-01-15T00:00:00Z', '2024-01-15T00:00:00Z'),
    ('user_organizer1', 'organizer@demo.com', 'Sarah Wilson', 'organizer', 'IIT Delhi', true, true, '2024-01-10T00:00:00Z', '2024-01-10T00:00:00Z'),
    ('user_crew1', 'crew@demo.com', 'Mike Chen', 'crew', 'IIT Delhi', true, true, '2024-01-20T00:00:00Z', '2024-01-20T00:00:00Z'),
    ('user_admin1', 'admin@demo.com', 'Admin User', 'admin', NULL, true, true, '2024-01-01T00:00:00Z', '2024-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, title, description, type, date, time, venue, college, organizer, organizer_id, price, capacity, registered, status, image_url, tags, requirements, prizes, created_at, updated_at) VALUES
    ('evt_techfest2024', 'TechFest 2024', 'The biggest technical festival showcasing innovation, robotics, AI competitions, and tech talks by industry leaders.', 'fest', '2024-03-15', '09:00', 'Main Campus', 'IIT Delhi', 'Tech Club IIT Delhi', 'user_organizer1', 299, 500, 245, 'upcoming', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800', ARRAY['technology', 'robotics', 'AI', 'competition'], ARRAY['Student ID', 'Laptop (for coding events)'], ARRAY['₹50,000 Grand Prize', 'Internship Opportunities', 'Certificates'], '2024-02-01T00:00:00Z', '2024-02-15T00:00:00Z'),
    ('evt_cultural2024', 'Cultural Extravaganza 2024', 'A vibrant celebration of arts, music, dance, and cultural performances from around the world.', 'cultural', '2024-03-20', '18:00', 'Auditorium', 'Delhi University', 'Cultural Society DU', 'user_organizer1', 199, 300, 156, 'upcoming', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', ARRAY['cultural', 'music', 'dance', 'arts'], ARRAY['College ID'], ARRAY['Trophies', 'Certificates', 'Cultural Scholarships'], '2024-02-05T00:00:00Z', '2024-02-18T00:00:00Z'),
    ('evt_hackathon2024', 'Code Warriors Hackathon', '48-hour coding marathon to build innovative solutions for real-world problems.', 'hackathon', '2024-03-25', '08:00', 'Computer Lab', 'BITS Pilani', 'Coding Club BITS', 'user_organizer1', 0, 200, 89, 'upcoming', 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800', ARRAY['coding', 'hackathon', 'programming', 'innovation'], ARRAY['Laptop', 'Programming Knowledge', 'Team of 2-4'], ARRAY['₹1,00,000 Prize Pool', 'Job Opportunities', 'Mentorship'], '2024-02-10T00:00:00Z', '2024-02-20T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions to anon users (for public data)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON events TO anon;
GRANT SELECT ON event_details TO anon;

-- Create storage bucket for verification documents if not exists
DO $$
BEGIN
  PERFORM 1 FROM storage.buckets WHERE id = 'verification-docs';
  IF NOT FOUND THEN
    PERFORM storage.create_bucket('verification-docs', public := true);
  END IF;
END $$;