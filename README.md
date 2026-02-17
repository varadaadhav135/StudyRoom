# Imperial Study Library 📚

A modern, royal-themed digital library management system for educational institutions.

## 🎯 Features

- **Supabase Authentication & Role-Based Access**
  - **Admin Dashboard**: Comprehensive control over students, resources, and subscriptions
  - **Student Dashboard**: Access learning materials, track progress, and view subscription status
  - Secure role-based authentication with JWT tokens
  - Profile management with detailed student information

- **Subscription Management**
  - Admin-controlled subscription creation and updates
  - Automatic subscription status calculation (active, expiring soon, expired)
  - Subscription expiry warnings for students
  - Revenue tracking and analytics
  - Payment history management

- **Student Profile System**
  - Detailed student information collection (contact, address, emergency contact, education)
  - Profile completion tracking
  - Admin and student views of profile data

- **Resource Management**
  - Upload and organize study materials
  - Categorize by subject
  - Track student progress on each resource
  - PDF and video preview support

- **Beautiful UI**
  - Classic and Royal design aesthetic
  - Dark mode support
  - Responsive layout
  - Smooth animations and transitions

## 🏗️ Tech Stack

| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend | React + Vite | Free |
| Styling | Tailwind CSS | Free |
| Routing | React Router | Free |
| Backend | Supabase (PostgreSQL) | Free tier |
| Auth | JWT | Free |
| Hosting | Netlify/Vercel recommended | Free tier |

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and pnpm installed
- Supabase account (free)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd study-library
pnpm install
```

### 2. Setup Supabase Backend

Follow the comprehensive guide: [`docs/SUPABASE_SETUP.md`](./docs/SUPABASE_SETUP.md)

Quick summary:
1. Create free Supabase account
2. Run SQL to create tables
3. Copy credentials to `.env`

### 3. Configure Environment

Create `.env` file:

```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_MOCK_API=false
```

### 4. Run Development Server

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Login

**Admin credentials** (set during Supabase setup):
- Username: `admin`
- Password: `admin123`

## 📁 Project Structure

```
study-library/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components (dashboards, login)
│   ├── context/          # Auth context
│   └── utils/            # API utilities
│       ├── supabaseClient.js  # Supabase connection
│       ├── supabaseApi.js     # Database operations
│       ├── mockApi.js         # Local testing fallback
│       └── api.js             # Main API layer
├── docs/                 # Documentation
└── .env                  # Environment variables
```

## 🗄️ Database Schema

### Users Table
Stores admin and student accounts with authentication.

### Resources Table
Study materials with metadata (title, category, URL, etc.)

### Student Progress Table
Tracks student learning progress per resource.

## 🎨 Design Philosophy

- **Classic & Royal Aesthetic**: Gold accents (#D4AF37), deep navy (#1a1f3a)
- **Typography**: Playfair Display (headings), Inter (body)
- **Responsive**: Mobile-first design
- **Accessible**: WCAG compliant color contrasts

## 🔐 Authentication Flow

1. User submits credentials
2. Backend queries Supabase users table
3. Password verified (base64 encoded for demo - upgrade for production!)
4. JWT token generated and returned
5. Token stored in localStorage
6. Protected routes check auth status

## 📊 API Endpoints (Supabase)

All operations via `supabaseApi.js`:

- `login(credentials)` - Authenticate user
- `createStudent(token, data)` - Admin creates student
- `getStudents(token)` - List all students
- `updateStudent(token, id, data)` - Modify student
- `deleteStudent(token, id)` - Remove student
- `getResources(token)` - List resources
- `createResource(token, data)` - Add resource
- `getProgress(token)` - Student progress
- `updateProgress(token, resourceId, status)` - Track learning

## 🚢 Deployment

### Frontend (Recommended: Vercel/Netlify)

1. Push code to GitHub
2. Connect repo to Vercel/Netlify
3. Set environment variables in dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_USE_MOCK_API=false`
4. Deploy!

### Backend

Already hosted on Supabase - no deployment needed! ✅

## 🔧 Development

### Run Tests
```bash
pnpm test
```

### Build for Production
```bash
pnpm build
```

### Preview Production Build
```bash
pnpm preview
```

## 📈 Scaling Considerations

**Free Tier Limits (Supabase):**
- 500 MB database
- 50,000 monthly active users
- 2 GB bandwidth

Sufficient for:
- Small to medium educational institutions
- Up to 1,000 students
- Moderate daily usage

## 🐛 Troubleshooting

**Login fails:**
- Check Supabase credentials in `.env`
- Verify admin user exists in Supabase Table Editor
- Check browser console for errors

**"No backend configured" error:**
- Ensure `VITE_SUPABASE_URL` is set correctly
- Verify `VITE_USE_MOCK_API=false`
- Restart dev server after `.env` changes

**Data not persisting:**
- Check Supabase dashboard for database activity
- Verify Row Level Security policies allow operations
- Check browser network tab for failed requests

## 📝 License

MIT License - feel free to use for your institution!

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss changes.

## 🙏 Acknowledgments

- Design inspired by classic academic institutions
- Built with modern web technologies
- Powered by Supabase's excellent platform
