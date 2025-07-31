# 🔗 Connecting Supabase Databases to Cursor

## Overview

This guide will help you connect both Supabase databases (supabaseOld and supabaseNew) to Cursor for seamless development and database management.

## 📋 Prerequisites

1. **Cursor IDE** installed and running
2. **Supabase project URLs** and **API keys** for both databases
3. **Supabase CLI** (optional but recommended)

## 🗄️ Database Information

### supabaseOld (Primary Database)
- **Purpose**: User management, authentication, student data
- **Tables**: `user_profiles`, `students`, `certificates`, `attendance_records`, `notifications`, `timetable_slots`
- **Environment Variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### supabaseNew (Content Database)
- **Purpose**: Public content and media
- **Tables**: `events`, `faculty`, `gallery`, `gallery_media`, `placements`, `achievements`, `results`
- **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔧 Method 1: Using Cursor's Database Extension

### Step 1: Install Database Extension
1. Open Cursor
2. Go to **Extensions** (Ctrl+Shift+X)
3. Search for **"Database Client"** or **"SQLTools"**
4. Install the extension

### Step 2: Add Supabase Connections

#### For supabaseOld:
1. Open Command Palette (Ctrl+Shift+P)
2. Type: `Database: Add Connection`
3. Select **PostgreSQL**
4. Fill in the details:
   ```
   Connection Name: supabaseOld
   Host: [Your OLD_SUPABASE_URL without https://]
   Port: 5432
   Database: postgres
   Username: postgres
   Password: [Your OLD_SUPABASE_ANON_KEY]
   ```

#### For supabaseNew:
1. Repeat the process for the second database:
   ```
   Connection Name: supabaseNew
   Host: [Your NEW_SUPABASE_URL without https://]
   Port: 5432
   Database: postgres
   Username: postgres
   Password: [Your NEW_SUPABASE_ANON_KEY]
   ```

## 🔧 Method 2: Using Supabase CLI with Cursor

### Step 1: Install Supabase CLI
```bash
npm install -g supabase
```

### Step 2: Login to Supabase
```bash
supabase login
```

### Step 3: Link Projects
```bash
# Link supabaseOld project
supabase link --project-ref [OLD_PROJECT_REF]

# Link supabaseNew project (in a different directory or use different config)
supabase link --project-ref [NEW_PROJECT_REF]
```

### Step 4: Access Database in Cursor
1. Open Terminal in Cursor
2. Run: `supabase db pull` to get schema
3. Use Cursor's database tools to connect

## 🔧 Method 3: Direct Connection via Environment Variables

### Step 1: Create Environment File
Create `.env` file in your project root:

```env
# supabaseOld (Primary Database)
VITE_SUPABASE_URL=https://your-old-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-old-anon-key

# supabaseNew (Content Database)
NEXT_PUBLIC_SUPABASE_URL=https://your-new-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
```

### Step 2: Get Connection Details
1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Copy the connection details

## 🛠️ How to Get Your Supabase Credentials

### For Each Database:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Get Project URL**
   - Go to **Settings** → **API**
   - Copy the **Project URL**

3. **Get API Keys**
   - In the same **Settings** → **API** section
   - Copy the **anon public** key

4. **Get Database Connection String**
   - Go to **Settings** → **Database**
   - Copy the **Connection string**

## 📊 Database Schema Overview

### supabaseOld Tables:
```sql
-- User Management
user_profiles (id, role, status, student_name, email, ...)
students (id, ht_no, student_name, year, ...)

-- Academic Data
certificates (id, ht_no, certificate_name, certificate_url, ...)
attendance_records (id, file_name, file_url, uploaded_at, ...)
timetable_slots (id, day, time, subject, faculty, room)

-- System Data
notifications (id, title, message, created_at)
```

### supabaseNew Tables:
```sql
-- Public Content
events (id, title, description, date, time, venue, image_url, ...)
faculty (id, name, designation, image_url, ...)
placements (id, student_name, company, ctc, year, image_url, ...)
achievements (id, student_name, title, description, image_url, ...)

-- Media & Gallery
gallery (id, title, description, ...)
gallery_media (id, gallery_item_id, media_url, media_type, ...)

-- Results
results (id, title, file_url, file_path, ...)
```

## 🔍 Testing Your Connections

### Test supabaseOld:
```sql
-- Test user_profiles table
SELECT COUNT(*) FROM user_profiles;

-- Test admin user
SELECT * FROM user_profiles WHERE role = 'admin';
```

### Test supabaseNew:
```sql
-- Test events table
SELECT COUNT(*) FROM events;

-- Test public read access
SELECT * FROM faculty LIMIT 5;
```

## 🚀 Benefits of Cursor Integration

1. **Real-time Database Viewing**
   - See data changes instantly
   - Monitor user activities

2. **SQL Query Execution**
   - Run queries directly in Cursor
   - Test database operations

3. **Schema Management**
   - View table structures
   - Understand relationships

4. **Debugging**
   - Check data integrity
   - Verify RLS policies

5. **Development Workflow**
   - Seamless integration with code
   - Quick data validation

## 🔒 Security Considerations

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Limit database access** to development only
4. **Regularly rotate** API keys

## 🐛 Troubleshooting

### Connection Issues:
1. **Check API keys** are correct
2. **Verify project URLs** are accurate
3. **Ensure RLS policies** allow your access
4. **Check network connectivity**

### Permission Issues:
1. **Verify admin role** in user_profiles
2. **Check RLS policies** are properly set
3. **Ensure tables exist** in the database

## 📞 Support

If you encounter issues:
1. Check Supabase documentation
2. Verify your project settings
3. Test connections in Supabase dashboard first
4. Review RLS policies in the migration file

## 🎯 Next Steps

After connecting both databases:
1. **Test all CRUD operations**
2. **Verify RLS policies work**
3. **Monitor real-time data**
4. **Set up automated backups** (recommended)

---

**Happy coding with your dual Supabase setup! 🚀** 