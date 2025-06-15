# Supabase Setup Guide

## Fixing Email Confirmation Redirects

When using GitHub Codespaces or any non-localhost development environment, you need to update Supabase's redirect URLs.

### Steps to Fix:

1. **Get your Codespace URL**
   - Your current URL looks like: `https://refactored-space-garbanzo-g4rrj4xjqrx7cjrj-5173.app.github.dev`
   - Copy this base URL

2. **Update Supabase Redirect URLs**
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Navigate to **Authentication** → **URL Configuration**
   
3. **Add Redirect URLs**
   Add these URLs to the "Redirect URLs" section:
   ```
   http://localhost:5173/*
   http://localhost:5173
   https://*.app.github.dev/*
   https://your-codespace-url-5173.app.github.dev/*
   https://nicunursekatie.github.io/ADHDPlannerWorking/*
   ```
   
   Replace `your-codespace-url` with your actual Codespace URL.

4. **Update Site URL**
   In the same section, update the "Site URL" to:
   - For Codespaces: `https://your-codespace-url-5173.app.github.dev/ADHDPlannerWorking/`
   - For production: `https://nicunursekatie.github.io/ADHDPlannerWorking/`

5. **Save Changes**
   Click "Save" at the bottom of the page

## Alternative: Disable Email Confirmations (Development Only)

For easier development testing:

1. Go to **Authentication** → **Settings** → **Email Auth**
2. Toggle OFF "Enable email confirmations"
3. Save changes

⚠️ **Note**: Only disable email confirmations for development. Keep them enabled for production.

## Testing Your Setup

1. After updating the URLs, try signing up again
2. The confirmation email should now redirect to your Codespace URL
3. You should be automatically logged in after confirmation

## Production Setup

When deploying to production at `https://nicunursekatie.github.io/ADHDPlannerWorking/`:

1. Add the production URL to Redirect URLs
2. Update the Site URL to the production URL
3. Re-enable email confirmations if disabled

## Common Issues

### "Invalid Redirect URL" Error
- Make sure you've added your exact Codespace URL to the allowed redirects
- Include both with and without trailing slashes
- Use wildcards (`*`) for dynamic Codespace URLs

### Still Redirecting to Localhost
- Clear your browser cache
- Try in an incognito/private window
- Double-check that you saved the URL configuration changes

### Can't Access Supabase Dashboard
- Make sure you're logged into Supabase
- Check that you have admin access to the project