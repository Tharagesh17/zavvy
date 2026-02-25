# How to Connect Supabase to Zavvy

The "Product Management" and "SmartCollect" features live in your Supabase database. Since the database hasn't been set up yet, the login and dashboard won't work properly.

Follow these steps to connect and initialize it:

## 1. Get Your Credentials
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Go to **Project Settings** (gear icon) -> **API**.
4. Copy:
   - **Project URL**
   - **anon public** key
   - **service_role** key (Click "Reveal" - keep this secret!)

## 2. Update Environment Variables
Open the file `.env.local` in your Zavvy folder and paste the values:

```env
NEXT_PUBLIC_SUPABASE_URL=Stop_Matching_UPI_Screenshots_at_11_PM
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

(It looks like you might already have them in `.env.local`, but please double-check they match your current project).

## 3. Run the Database Setup Script
The app needs specific tables (Sellers, Products, Orders) to function.

1. Open the file `SUPABASE_SETUP.sql` in this folder.
2. Select All (Ctrl+A) and Copy (Ctrl+C).
3. Go to your Supabase Dashboard -> **SQL Editor** (on the left sidebar).
4. Click **"New Query"**.
5. Paste the code into the editor.
6. Click **"Run"** (bottom right).

## 4. Restart the App
Once the SQL runs successfully (it should say "Success"), restart your local server to ensure it picks up the changes:

1. Stop the server (Ctrl+C in terminal).
2. Run `npm run dev` again.
3. Go to `http://localhost:3000/login`.
4. Use "Dev: Skip OTP" to log in. You will now be taken to the Onboarding Flow.

You're done! The "Product Management" and "SmartCollect" features are now active.
