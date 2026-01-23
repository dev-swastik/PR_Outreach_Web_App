# Complete Setup Guide

Step-by-step guide to set up the PR Outreach App from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Resend Setup](#resend-setup)
4. [Google AI Setup](#google-ai-setup)
5. [Backend Configuration](#backend-configuration)
6. [Testing the Setup](#testing-the-setup)
7. [Common Issues](#common-issues)

---

## Prerequisites

### Required Software

- **Node.js 18+**: [Download](https://nodejs.org/)
- **Python 3.8+**: [Download](https://www.python.org/downloads/)
- **Git**: [Download](https://git-scm.com/)

### Required Accounts

- **Supabase** (free tier): [Sign up](https://supabase.com/)
- **Resend** (free tier, 100 emails/day): [Sign up](https://resend.com/)
- **Google AI Studio** (free tier): [Sign up](https://makersuite.google.com/)

---

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: pr-outreach-app
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### Step 2: Get API Credentials

1. In your project dashboard, click "Settings" (gear icon)
2. Go to "API" section
3. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Service Role Key**: (under "Service role" - click "Reveal" to show)

**Important**: Use the **Service Role Key**, NOT the anon/public key!

### Step 3: Database Migrations

The database schema will be automatically created when you start the backend. The migration includes:

- `journalists` table
- `campaigns` table
- `emails` table
- All necessary indexes and Row Level Security policies

### Step 4: Verify Database

After starting the backend for the first time:

1. Go to Supabase Dashboard > Table Editor
2. You should see three tables: `journalists`, `campaigns`, `emails`
3. Check that Row Level Security is enabled (green shield icon)

---

## Resend Setup

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com/)
2. Sign up with your email
3. Verify your email address

### Step 2: Verify Your Domain (Recommended)

For production use, verify your domain:

1. Go to "Domains" in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually 10-30 minutes)

**For Testing**: You can skip this and use `onboarding@resend.dev` as the sender

### Step 3: Get API Key

1. Go to "API Keys" in Resend dashboard
2. Click "Create API Key"
3. Name it: `pr-outreach-app`
4. Copy the API key (starts with `re_`)
5. **Save it immediately** - you won't see it again!

### Step 4: Configure Webhook (Optional but Recommended)

For production tracking:

1. Go to "Webhooks" in Resend dashboard
2. Click "Add Webhook"
3. Enter your webhook URL: `https://your-domain.com/webhooks/resend`
4. Select these events:
   - `email.delivered`
   - `email.bounced`
   - `email.complained`
   - `email.delivery_delayed`
5. Click "Create Webhook"

**For Local Testing**: Use [ngrok](https://ngrok.com/) to create a public URL:
```bash
ngrok http 5000
# Use the ngrok URL: https://xxxxx.ngrok.io/webhooks/resend
```

---

## Google AI Setup

### Step 1: Get API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select or create a Google Cloud project
5. Copy the API key (starts with `AIza`)

### Step 2: Test the API Key

You can test it with curl:

```bash
curl "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

If it works, you'll get a JSON response.

---

## Backend Configuration

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd PR_Outreach-App
```

### Step 2: Create Environment File

Copy the example file:

```bash
cp .env.example .env
```

### Step 3: Edit .env File

Open `.env` in a text editor and fill in your credentials:

```env
# Google AI (Gemini)
GOOGLE_API_KEY=AIza...your_key_here

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh...your_service_role_key_here

# Resend
RESEND_API_KEY=re_...your_key_here

# Email Configuration
FROM_EMAIL=yourname@yourdomain.com
# OR for testing:
# FROM_EMAIL=onboarding@resend.dev

# Backend URL (for tracking)
BACKEND_URL=http://localhost:5000
# In production, use your actual domain:
# BACKEND_URL=https://api.yourdomain.com
```

### Step 4: Install Dependencies

```bash
# Backend
cd backend
npm install

# Scraper
cd ../scraper
pip install feedparser
```

### Step 5: Start the Backend

```bash
cd backend
npm start
```

You should see:

```
CWD: /path/to/backend
Environment variables loaded:
- GOOGLE_API_KEY: true
- SUPABASE_URL: true
- SUPABASE_SERVICE_ROLE_KEY: true
- RESEND_API_KEY: true
Backend running on http://localhost:5000
```

If any variables show `false`, check your `.env` file.

---

## Testing the Setup

### Test 1: Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T10:00:00Z",
  "environment": {
    "googleAI": true,
    "supabase": true,
    "resend": true
  }
}
```

All values should be `true`.

### Test 2: Rate Limiter Status

```bash
curl http://localhost:5000/rate-limiter/status
```

Expected response:
```json
{
  "queueLength": 0,
  "processing": false,
  "emailsSentToday": 0,
  "dailyLimit": 100,
  "remainingToday": 100,
  "currentlySending": 0
}
```

### Test 3: Scraper

```bash
cd scraper
python run_scraper.py "AI Teaching Tools"
```

Expected output: JSON array with journalist data

### Test 4: AI Email Generation

```bash
cd backend
node src/test.email.js
```

Expected output: Generated personalized email

### Test 5: Start a Test Campaign

**Important**: This will actually send emails!

```bash
curl -X POST http://localhost:5000/start-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Test Company",
    "topic": "AI Teaching Tools",
    "senderName": "Test User",
    "senderTitle": "Testing"
  }'
```

Expected response:
```json
{
  "success": true,
  "campaign": {
    "id": "uuid",
    "company": "Test Company",
    "topic": "AI Teaching Tools",
    "totalEmails": 5
  },
  "emails": [...],
  "rateLimiter": {
    "queueLength": 5,
    "processing": true,
    ...
  }
}
```

### Test 6: Check Database

1. Go to Supabase Dashboard > Table Editor
2. Check `campaigns` table - you should see your test campaign
3. Check `journalists` table - you should see discovered journalists
4. Check `emails` table - you should see queued emails

---

## Common Issues

### Issue: "Missing Supabase credentials"

**Solution**:
- Check that `.env` file is in the project root
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Make sure you're using the Service Role Key, not the anon key

### Issue: "Scraper output invalid"

**Solution**:
- Test scraper directly: `python scraper/run_scraper.py "test topic"`
- Check Python version: `python --version` (should be 3.8+)
- Install feedparser: `pip install feedparser`

### Issue: "Failed to send email"

**Possible causes**:
1. Invalid `RESEND_API_KEY`
   - Check the key in Resend dashboard
   - Make sure it's not expired

2. Invalid `FROM_EMAIL`
   - Use `onboarding@resend.dev` for testing
   - Or verify your domain in Resend dashboard

3. Daily limit reached
   - Check `/rate-limiter/status`
   - Free tier: 100 emails/day

### Issue: "AI email generation failed"

**Solution**:
- Check `GOOGLE_API_KEY` is valid
- Test the API key with curl (see Google AI Setup)
- Check Google AI Studio quotas

### Issue: Database tables not created

**Solution**:
- Check Supabase dashboard for migration errors
- The tables should auto-create on first backend start
- Check console logs for error messages

### Issue: Rate limiter not working

**Solution**:
- Check `/rate-limiter/status` endpoint
- Review console logs for queue processing messages
- Verify emails are in "queued" status in database

---

## Production Deployment

### Checklist

- [ ] Domain verified in Resend
- [ ] Webhook URL configured in Resend
- [ ] Environment variables set in production
- [ ] Database migrations applied
- [ ] Rate limits adjusted for your sender reputation
- [ ] Monitoring and alerts configured
- [ ] Backup strategy for database

### Recommended Rate Limits for New Domains

**Week 1**: 20-30 emails/day
**Week 2**: 40-50 emails/day
**Week 3**: 70-80 emails/day
**Week 4+**: 100+ emails/day (monitor bounce rates)

### Monitoring Metrics

- **Bounce rate**: Keep under 5%
- **Spam complaints**: Keep under 0.1%
- **Open rate**: Industry average 15-25%
- **Click rate**: Industry average 2-5%

---

## Support

For issues:
1. Check this guide first
2. Review console logs
3. Check Supabase logs
4. Review Resend dashboard for email status

## Next Steps

Once setup is complete:
1. Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. Review [README.md](./README.md) for usage examples
3. Start with a small test campaign (5-10 emails)
4. Monitor analytics and adjust as needed
