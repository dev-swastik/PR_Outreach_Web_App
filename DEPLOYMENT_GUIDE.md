# Deployment Guide: Netlify + Render

This guide walks you through deploying the PR Outreach App to Netlify (frontend) and Render (backend + scraper).

---

## Prerequisites

- GitHub/GitLab account with your code pushed
- Netlify account (free tier works)
- Render account (free tier works)
- All API keys ready:
  - Supabase URL & Service Role Key
  - OpenAI API Key
  - Resend API Key
  - Hunter API Key (optional)

---

## Step 1: Deploy Backend & Scraper to Render

### Option A: Using render.yaml (Recommended)

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub/GitLab repository
4. Render will detect `render.yaml` and show both services:
   - `pr-outreach-backend` (Node.js)
   - `pr-outreach-scraper` (Python)
5. Click **"Apply"**
6. Add environment variables for **BOTH services**:

**Backend Service Environment Variables:**
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
OPENAI_API_KEY=<your-openai-key>
RESEND_API_KEY=<your-resend-key>
HUNTER_API_KEY=<your-hunter-key>
NODE_ENV=production
```

**Scraper Service Environment Variables:**
```
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Option B: Manual Setup

**Backend:**
1. New Web Service
2. Connect repository
3. Settings:
   - **Name:** pr-outreach-backend
   - **Runtime:** Node
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && node src/server.js`
   - Add environment variables (see above)

**Scraper:**
1. New Web Service
2. Connect repository
3. Settings:
   - **Name:** pr-outreach-scraper
   - **Runtime:** Python
   - **Build Command:** `cd email-scraper-service && pip install -r requirements.txt`
   - **Start Command:** `cd email-scraper-service && python app.py`
   - Add environment variables (see above)

### Get Your Backend URLs

After deployment, Render will give you URLs like:
- Backend: `https://pr-outreach-backend.onrender.com`
- Scraper: `https://pr-outreach-scraper.onrender.com`

**Save the backend URL** - you'll need it for Netlify!

---

## Step 2: Deploy Frontend to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub/GitLab repository
4. Configure build settings:
   - **Base directory:** `frontend`
   - **Build command:** `npm install && npm run build`
   - **Publish directory:** `frontend/dist`

5. Add environment variables:
   - Go to **Site settings** → **Environment variables**
   - Add these variables:

```
VITE_BACKEND_API_URL=https://pr-outreach-backend.onrender.com
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

**Important:** Use your actual backend URL from Render!

6. Click **"Deploy site"**

---

## Step 3: Update Backend with Scraper URL

Your backend needs to know where the scraper service is hosted.

1. Go to Render → Backend Service → Environment
2. Add this variable:
```
SCRAPER_SERVICE_URL=https://pr-outreach-scraper.onrender.com
```
3. The backend will auto-redeploy

---

## Step 4: Configure CORS (if needed)

If you get CORS errors, update your backend's CORS settings to allow your Netlify domain.

In `backend/src/server.js`, the CORS is already configured to allow all origins in production. If you want to restrict it:

```javascript
const allowedOrigins = [
  'https://your-app-name.netlify.app',
  'http://localhost:3000'
];
```

---

## Step 5: Test Everything

1. Visit your Netlify URL
2. Test the campaign flow:
   - Create a campaign
   - Verify scraper runs
   - Check email generation
   - Test email sending

---

## Troubleshooting

### Render Services Keep Sleeping (Free Tier)
- Render's free tier sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds to wake up
- Consider upgrading to paid tier for production use

### Build Fails on Render
- Check build logs in Render dashboard
- Verify all dependencies are in package.json/requirements.txt
- Ensure environment variables are set

### Frontend Can't Connect to Backend
- Verify `VITE_BACKEND_API_URL` is set correctly in Netlify
- Check backend service is running in Render
- Verify CORS settings allow your Netlify domain

### Database Connection Issues
- Verify Supabase credentials are correct
- Check Supabase project isn't paused (free tier pauses after inactivity)
- Ensure RLS policies allow service role access

---

## Cost Estimate

**Free Tier:**
- Netlify: 100GB bandwidth/month (plenty for most apps)
- Render: 750 hours/month per service (but services sleep after 15min inactivity)
- Supabase: 500MB database, 2GB bandwidth/month

**Paid Tier (Recommended for Production):**
- Netlify Pro: $19/month (1TB bandwidth)
- Render: $7/month per service ($14 total for 2 services)
- Supabase Pro: $25/month (8GB database, 50GB bandwidth)

Total: ~$58/month for production-ready setup

---

## Environment Variables Quick Reference

### Backend (Render)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
HUNTER_API_KEY
SCRAPER_SERVICE_URL
NODE_ENV=production
```

### Scraper (Render)
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### Frontend (Netlify)
```
VITE_BACKEND_API_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

---

## Next Steps

After deployment:
1. Set up custom domain (optional)
2. Configure email sender domain in Resend
3. Set up monitoring/alerts
4. Consider upgrading to paid tiers for production use
5. Implement CI/CD for automatic deployments

---

Need help? Check the logs in Render and Netlify dashboards for detailed error messages.
