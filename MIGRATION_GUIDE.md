# Data Migration Guide

This guide explains how to migrate your existing localStorage data to Supabase cloud storage.

## Prerequisites

1. **Set up Supabase Database**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Click "Run" to create all the necessary tables

2. **Environment Variables**
   - Make sure your `.env` file contains:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

## Migration Steps

1. **Start the Application**
   ```bash
   npm run dev
   ```

2. **Create an Account or Sign In**
   - When you first load the app, you'll see a sign-in screen
   - Create a new account using your email and password
   - Or sign in if you already have an account

3. **Navigate to Settings**
   - Click on "Settings" in the navigation menu
   - You'll see a new "Data Migration" section at the top

4. **Start Migration**
   - Click on "Data Migration" to expand the section
   - The tool will automatically analyze your localStorage data
   - You'll see a breakdown of all data to be migrated:
     - Tasks (including subtasks and dependencies)
     - Projects
     - Categories
     - Recurring Tasks
     - Daily Plans
     - Journal Entries
     - Work Schedules
     - Settings

5. **Click "Start Migration"**
   - Watch the progress bars as each data type is migrated
   - The migration handles complex relationships:
     - Parent-child task relationships
     - Task dependencies
     - Task references in daily plans
     - All IDs are properly updated

6. **Verify Migration**
   - Once complete, all your data will be in the cloud
   - The app will automatically use the cloud data
   - Your original localStorage data is preserved (not deleted)

## What Gets Migrated

- **Tasks**: All tasks with their properties, including:
  - Subtasks (parent-child relationships)
  - Dependencies between tasks
  - Project and category assignments
  - Due dates, priorities, energy levels
  - Archived and completed states

- **Projects**: All projects with colors and descriptions

- **Categories**: All custom categories with colors

- **Recurring Tasks**: All recurring task templates with their patterns

- **Daily Plans**: All daily time blocks with updated task references

- **Journal Entries**: All weekly review entries

- **Work Schedules**: All work shifts and schedules

- **Settings**: Your personal preferences (font size, colors, etc.)

## Important Notes

1. **Data Safety**: Your localStorage data is NOT deleted during migration. It remains as a backup.

2. **One-Time Process**: You only need to migrate once. After that, all data is automatically synced to the cloud.

3. **Offline Access**: Currently, the app requires an internet connection when using Supabase. The localStorage version still works offline.

4. **Multiple Devices**: Once migrated, you can access your data from any device by signing in.

## Troubleshooting

### Common Issues

1. **"Too many attempts" error (429)**
   - This happens when you try to sign up too many times in a short period
   - Wait 1-2 minutes before trying again
   - Make sure your password is at least 6 characters long

2. **Email confirmation required**
   - Check your email for a confirmation link from Supabase
   - Click the link to activate your account
   - Then try signing in again

3. **Migration fails**
   - Check your internet connection
   - Verify your Supabase credentials in `.env`
   - Make sure the database schema was created correctly
   - Check the browser console for specific error messages

### Supabase Configuration

Make sure your Supabase project has:
1. **Email confirmations** - Can be disabled in Authentication → Settings → Email Auth
2. **Rate limiting** - Default settings should work, but can be adjusted if needed
3. **RLS policies** - Already included in the schema file

## Switching Between Modes

The app automatically detects whether to use Supabase or localStorage:
- If `.env` has valid Supabase credentials → Uses Supabase (with auth)
- If no credentials or invalid → Falls back to localStorage (no auth)

To switch back to localStorage mode, simply remove or rename the `.env` file.