# 🔗 SQLTools Connection Configuration for VitsAids

## 📋 Complete Connection Settings

### **Database 1: supabaseOld (User Management)**

**Connection Details:**
```
Connection Name: supabaseOld
Server Address: guseqyxrqxocgykrirsz.supabase.co
Port: 5432
Username: postgres
Password: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1c2VxeXhycXhvY2d5a3JpcnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzEwMzcsImV4cCI6MjA2NzcwNzAzN30.I8QsbX3Z-KTYNJKrDH6Qt0kofdv7QhnfZs8WHTydfKQ
Database: postgres
SSL: require
Connection Group: VitsAids
```

**Advanced Settings:**
```
SSL Mode: require
SSL Certificate: (leave empty)
SSL Key: (leave empty)
SSL CA: (leave empty)
Reject Unauthorized: false
```

### **Database 2: supabaseNew (Content Management)**

**Connection Details:**
```
Connection Name: supabaseNew
Server Address: xtingjrhndgetslwuwmh.supabase.co
Port: 5432
Username: postgres
Password: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0aW5nanJobmRnZXRzbHd1d21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzQ5NzEsImV4cCI6MjA2ODkxMDk3MX0.Ixy83YKlN0Au78YKKL6-NGzijpH7nqICC6sIUPNF6-c
Database: postgres
SSL: require
Connection Group: VitsAids
```

**Advanced Settings:**
```
SSL Mode: require
SSL Certificate: (leave empty)
SSL Key: (leave empty)
SSL CA: (leave empty)
Reject Unauthorized: false
```

## 🔧 Step-by-Step Setup Instructions

### **Step 1: Open SQLTools Connection Form**
1. Press **Ctrl + Shift + P**
2. Type: `SQLTools: Add Connection`
3. Press **Enter**

### **Step 2: Configure supabaseOld**
1. **Connection Name**: `supabaseOld`
2. **Server Address**: `guseqyxrqxocgykrirsz.supabase.co`
3. **Port**: `5432`
4. **Username**: `postgres`
5. **Password**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1c2VxeXhycXhvY2d5a3JpcnN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzEwMzcsImV4cCI6MjA2NzcwNzAzN30.I8QsbX3Z-KTYNJKrDH6Qt0kofdv7QhnfZs8WHTydfKQ`
6. **Database**: `postgres`
7. **SSL**: `require`
8. **Click "Test Connection"**
9. **If successful**: Click "Save"

### **Step 3: Configure supabaseNew**
1. **Connection Name**: `supabaseNew`
2. **Server Address**: `xtingjrhndgetslwuwmh.supabase.co`
3. **Port**: `5432`
4. **Username**: `postgres`
5. **Password**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0aW5nanJobmRnZXRzbHd1d21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMzQ5NzEsImV4cCI6MjA2ODkxMDk3MX0.Ixy83YKlN0Au78YKKL6-NGzijpH7nqICC6sIUPNF6-c`
6. **Database**: `postgres`
7. **SSL**: `require`
8. **Click "Test Connection"**
9. **If successful**: Click "Save"

## 🗄️ Database Tables Overview

### **supabaseOld Tables:**
- `user_profiles` - User management
- `students` - Student data
- `certificates` - Student certificates
- `attendance_records` - Attendance tracking
- `notifications` - System notifications
- `timetable_slots` - Class scheduling

### **supabaseNew Tables:**
- `events` - Department events
- `faculty` - Faculty information
- `gallery` - Image gallery
- `gallery_media` - Gallery media files
- `placements` - Placement data
- `achievements` - Student achievements
- `results` - Academic results

## ✅ Verification Steps

### **Test supabaseOld Connection:**
```sql
SELECT * FROM user_profiles LIMIT 5;
```

### **Test supabaseNew Connection:**
```sql
SELECT * FROM events LIMIT 5;
```

## 🔧 Troubleshooting

### **If SSL Connection Fails:**
1. Try **SSL Mode**: `no-verify`
2. Try **SSL Mode**: `disable`
3. Check if firewall is blocking port 5432

### **If Authentication Fails:**
1. Verify the anon key is correct
2. Check if the database is accessible
3. Ensure the project is active in Supabase

## 🎯 Next Steps After Connection

1. **Run RLS Migration**: Execute the migration file to fix admin access
2. **Test CRUD Operations**: Verify admin can add/edit content
3. **Monitor Logs**: Check for any remaining authentication issues

---

**Status**: ✅ Ready for configuration
**Last Updated**: January 2025 