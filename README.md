# 🎓 Department Management System Portal

A modern, full-featured web portal for managing academic and administrative operations in a department. Designed with clean UI, scalable backend, and real-time student–admin interaction.

Built using **React**, **TypeScript**, **Tailwind CSS**, and **Supabase**, the system supports a dual-database architecture—cleanly separating frontend content from core student data.

---

## 🚀 Live Preview

🔗 [vitsaids.vercel.app](https://vitsaids.vercel.app)

---

## ✨ Features

### 👨‍🎓 Student Dashboard
- 📊 **Attendance**: View subject-wise and overall stats
- 📝 **Results**: Year-wise performance with marks breakdown
- 🏅 **Certificates**: Download/view personal achievements (✔️ implemented)
- 💰 **Fee Status**: Track due & paid fees with admin updates
- 🗓️ **Timetable & Schedule**: View live class and exam schedules
- 🔔 **Notifications**: Admin announcements in real-time
- 👤 **Profile**: Includes profile photo and academic info

### 🛠️ Admin Dashboard
- 🔐 Secure admin login via Supabase Auth
- 📁 Upload & manage:
  - 👨‍🏫 Faculty
  - 🖼️ Gallery
  - 🎉 Events
  - 💼 Placements
  - 🏆 Achievements
- 👥 Student Management:
  - Search & filter
  - Bulk promote by year/semester
  - Full profile view & controls
- 📤 Upload System:
  - Supabase Storage for media
  - Metadata stored in `.ts` or `.json` files
- 🧩 Drag & drop sorting for visual elements

---

## 🗃️ Dual Database Architecture

> Isolate public content from student data for better security and clarity.

### 🔹 `primary_db` (Private)
- Stores: `students`, `attendance`, `results`, `certificates`, etc.
- RLS (Row Level Security) enabled
- Accessible only via Admin/Admin Auth

### 🔹 `frontend_db` (Public)
- Stores: `gallery`, `events`, `faculty`, `placements`, `achievements`
- Public read access, admin-controlled writes
- Powers the homepage and public sections

---

## 🗂️ Supabase Storage Buckets

| Bucket Name       | Purpose                        |
|-------------------|---------------------------------|
| `profile_photos`  | Student profile pictures       |
| `gallery_media`   | Gallery images                 |
| `event_media`     | Event banners & photos         |
| `faculty_photos`  | Faculty headshots              |
| `placement_files` | Recruiter logos & screenshots  |
| `achievement_img` | Certificates, awards, etc.     |

---

## ⚙️ Admin Upload Workflow

1. Choose file (image/media)
2. Enter title, description, year (optional)
3. Click Upload
4. System:
   - Uploads file to Supabase Storage
   - Updates metadata file (`*.ts` or `*.json`)
   - Instantly reflects on the homepage

---

## 💻 Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS + ShadCN UI
- **Backend**: Supabase (DB, Auth, RLS, Storage)
- **Hosting**: Vercel
- **Version Control**: GitHub
- **State Management**: React Context API

---

## 🔮 Upcoming Features

- 📈 Analytics & Admin Stats
- 📥 Excel export of student reports
- 📧 Email/SMS Notification System
- 📝 Leave Application Portal for Students
- 🤖 AI Insights on Performance Trends

---

## 👨‍💻 Developed By

**Shubham Gundu**  
🔗 [LinkedIn](https://www.linkedin.com/in/shubham-gundu-134aa8325)  
🐙 [GitHub](https://github.com/theshubhamgundu)  
📌 [Project Repo](https://vitsaids.vercel.app)

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

> Proudly built for VITS, showcasing Supabase-powered full-stack architecture and open-source engineering excellence.
