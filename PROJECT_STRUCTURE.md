# Project Structure

## Directory Tree

```
study-library/
├── public/                       # Static assets
├── src/                          # Source code
│   ├── components/              # Reusable UI components
│   │   └── Modal.jsx           # Modal dialog
│   ├── context/                # React Context providers
│   │   └── AuthContext.jsx     # Authentication state
│   ├── pages/                  # Page components
│   │   ├── LandingPage.jsx    # Home/marketing page
│   │   ├── Login.jsx          # Login form
│   │   ├── AdminDashboard.jsx  # Admin interface
│   │   └── StudentDashboard.jsx # Student interface
│   ├── utils/                  # Utility functions
│   │   ├── supabaseClient.js  # Supabase connection
│   │   ├── supabaseApi.js     # Database operations
│   │   ├── mockApi.js         # Development fallback
│   │   └── api.js             # Unified API layer
│   ├── App.jsx                # Root component
│   ├── index.css              # Global styles
│   └── main.jsx               # Entry point
├── docs/                       # Documentation
│   └── SUPABASE_SETUP.md      # Backend setup guide
├── .env                        # Environment variables
├── package.json               # Dependencies
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind configuration
├── README.md                  # Project overview
├── ARCHITECTURE.md            # System architecture
└── PROJECT_STRUCTURE.md       # This file
```

## Key Files Explained

### Frontend Entry Points
- **`src/main.jsx`**: Application bootstrap, renders `<App />` to DOM
- **`src/App.jsx`**: Root component with routing configuration

### Authentication
- **`src/context/AuthContext.jsx`**: Global auth state, JWT management
- **`src/pages/Login.jsx`**: Login UI, credential submission

### Backend Integration
- **`src/utils/supabaseClient.js`**: Supabase connection singleton
- **`src/utils/supabaseApi.js`**: Database CRUD operations
- **`src/utils/mockApi.js`**: localStorage-based fallback for local dev
- **`src/utils/api.js`**: Automatic backend selection logic

### Pages
- **`src/pages/LandingPage.jsx`**: Public-facing intro page
- **`src/pages/AdminDashboard.jsx`**: Student & resource management
- **`src/pages/StudentDashboard.jsx`**: Learning materials & progress

### Configuration
- **`.env`**: Environment variables (Supabase credentials)
- **`vite.config.js`**: Build tool configuration
- **`tailwind.config.js`**: Styling framework setup

## Data Flow

```
User Interaction
       ↓
  Page Component
       ↓
  utils/api.js  ←→  AuthContext
       ↓
  [Mock or Supabase?]
       ↓
  supabaseApi.js  →  Supabase Database
```

## Development Workflow

1. **Start dev server**: `pnpm run dev`
2. **Make changes** in `src/` folder
3. **Hot reload** updates browser automatically
4. **Build for production**: `pnpm build`
5. **Preview build**: `pnpm preview`

## Backend Structure (Supabase)

```
Supabase Project
├── Database
│   ├── users                  # User accounts
│   ├── resources             # Study materials
│   └── student_progress      # Learning tracking
├── Authentication            # Built-in auth (not used yet)
├── Storage                   # File uploads (future)
└── Edge Functions            # Serverless (future)
```

## Environment Modes

### Development (Local)
- Mock API: `VITE_USE_MOCK_API=true`
- Data: Browser localStorage
- Hot reload enabled

### Production (Deployed)
- Supabase: `VITE_USE_MOCK_API=false`
- Data: PostgreSQL database
- Optimized build

## Adding New Features

### New Page
1. Create `src/pages/NewPage.jsx`
2. Add route in `src/App.jsx`
3. Add navigation link in dashboard

### New API Endpoint
1. Add function to `src/utils/supabaseApi.js`
2. Add wrapper in `src/utils/api.js`
3. Call from page component

### New Database Table
1. Write SQL in Supabase SQL Editor
2. Create TypeScript types (optional)
3. Add CRUD functions in `supabaseApi.js`

## Dependencies

**Core:**
- `react` - UI library
- `react-dom` - DOM rendering
- `react-router-dom` - Routing

**Backend:**
- `@supabase/supabase-js` - Supabase client
- `axios` - HTTP client (legacy, can be removed)

**Utilities:**
- `jwt-decode` - JWT parsing
- `react-toastify` - Notifications

**Dev Tools:**
- `vite` - Build tool
- `tailwindcss` - Styling
- `eslint` - Code linting

## Build Output

```
dist/
├── assets/
│   ├── index-[hash].js     # Bundled JavaScript
│   └── index-[hash].css    # Bundled styles
├── index.html              # Entry HTML
└── favicon.ico            # Site icon
```

Deploy `dist/` folder to Vercel/Netlify.
