# Quick Start Guide: Supabase Authentication & Subscriptions

## Prerequisites
- Node.js 16+ installed
- Supabase account (free tier works)
- Git

## Step 1: Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the migration file: `supabase/migrations/001_initial_schema.sql`
4. Copy all contents and paste into SQL Editor
5. Click **Run** to execute the migration

## Step 2: Configure Environment Variables

Update your `.env` file with Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Settings → API

## Step 3: Create Your First Admin User

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**
2. Click **Add User**
3. Enter admin email and password
4. Click **Create User**
5. Go to **Table Editor** → **profiles**
6. Find the new user row
7. Set `role` to `Admin`
8. Add a `username` (e.g., "Admin")

### Option B: Via SQL

```sql
-- Insert into auth.users (get the ID from Authentication tab)
-- Then update the profile:
UPDATE profiles 
SET role = 'Admin', username = 'Admin Name'
WHERE email = 'admin@example.com';
```

## Step 4: Install Dependencies & Run

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

## Step 5: Login as Admin

1. Open `http://localhost:5173`
2. Login with your admin credentials
3. You should see the **Admin Dashboard**

## Step 6: Create Your First Student

1. In Admin Dashboard, go to **Scholar Roster** tab
2. Click **Enroll Scholar**
3. Fill in:
   - Name
   - Email
   - Password (this will be shared with student)
4. Click **Permit Access**
5. **IMPORTANT**: Copy the credentials shown in the modal
6. Share these credentials with the student

## Step 7: Test Student Login

1. Logout from admin account
2. Login with student credentials
3. You should see the **Student Dashboard** with:
   - Learning resources
   - Subscription tab (showing 1-month default subscription)
   - Profile tab (to complete profile information)

## Managing Subscriptions

### Update Subscription Dates

1. Login as admin
2. Go to **Scholar Roster**
3. Click **Subscription** button next to any student
4. Modify start/end dates and amount
5. Click **Update Subscription**

### View Revenue Analytics

1. Login as admin
2. Go to **Revenue Analytics** tab
3. See total revenue, active subscriptions, and payment history

## Troubleshooting

### "Failed to fetch profile"
- Ensure the migration was run successfully
- Check that RLS policies exist in Supabase
- Verify user has a profile record

### "Permission denied"
- Ensure RLS is enabled on all tables
- Check that user's role is set correctly in profiles table
- Verify auth token is valid

### "Subscription not showing"
- Check subscriptions table in Supabase
- Ensure subscription record exists for the student
- Verify subscription dates are correct

## Next Steps

✅ Create admin user  
✅ Create students  
✅ Update subscriptions  
✅ View revenue analytics  
⬜ Customize subscription amounts  
⬜ Enable email validation  
⬜ Set up password reset flow  
⬜ Integrate payment gateway (optional)

## Need Help?

Refer to:
- `docs/SUPABASE_SETUP.md` - Detailed Supabase setup
- `walkthrough.md` - Complete implementation details
- Supabase docs: https://supabase.com/docs

---

**You're all set! 🎉** Your Study Library now has full authentication, subscription management, and revenue tracking.
