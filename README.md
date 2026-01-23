# PR Outreach App

Automated PR outreach platform with AI-powered email personalization, journalist discovery, rate limiting, and comprehensive tracking.

## Features

- **Journalist Discovery**: Scrapes journalists based on topics (AI Tech, AI in Education, etc.)
- **Detailed Metadata Storage**: First/last name, email, location, publication, topics covered
- **AI Email Generation**: Personalized emails using Google Gemini AI
- **Rate Limiting**: Smart email pacing (30 seconds between emails, 100/day max)
- **Email Tracking**: Track opens, clicks, deliveries, and bounces
- **Supabase Database**: Persistent storage for journalists, campaigns, and analytics
- **Resend Integration**: Professional email delivery with webhook support

## Architecture

- **Backend**: Node.js/Express API
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend API with tracking
- **AI**: Google Gemini 2.5 Flash Lite
- **Scraper**: Python with RSS feed parsing

## Setup

### 1. Prerequisites

- Node.js 18+ installed
- Python 3.8+ installed
- Supabase account (free tier works)
- Resend account (free tier: 100 emails/day)
- Google AI API key

### 2. Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `GOOGLE_API_KEY`: Get from https://makersuite.google.com/app/apikey
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key from Supabase dashboard
- `RESEND_API_KEY`: Get from https://resend.com/api-keys
- `FROM_EMAIL`: Your verified sender email in Resend

### 3. Database Setup

The database schema is automatically created via Supabase migrations. It includes:

- `journalists` table: Stores journalist profiles and metadata
- `campaigns` table: Tracks PR campaigns
- `emails` table: Logs all emails with tracking status

### 4. Backend Setup

```bash
cd backend
npm install
npm start
```

The backend will run on http://localhost:5000

### 5. Scraper Setup

```bash
cd scraper
pip install feedparser
```

Test the scraper:
```bash
python run_scraper.py "AI Teaching Tools"
```

### 6. Frontend Setup (if applicable)

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Campaign Management

- `POST /start-campaign` - Start a new PR campaign
- `GET /campaigns` - List all campaigns
- `GET /campaigns/:campaignId` - Get campaign details
- `GET /campaigns/:campaignId/analytics` - Get campaign analytics

### Rate Limiter

- `GET /rate-limiter/status` - Check rate limiter status

### Email Tracking

- `GET /track/open/:emailId` - Email open tracking (tracking pixel)
- `GET /track/click/:emailId?url=...` - Click tracking with redirect
- `POST /webhooks/resend` - Resend webhook for delivery events

### Health Check

- `GET /health` - Check API status and environment variables

## Rate Limiting

The system implements smart rate limiting to protect sender reputation:

- **2 emails per minute** (conservative)
- **30 second delay** between individual emails
- **100 emails per day** maximum
- **1 concurrent send** at a time

## Email Tracking

All emails include tracking pixels and webhook integration for:
- Sent
- Delivered
- Opened
- Clicked
- Bounced

## Usage Example

### Start a Campaign

```bash
curl -X POST http://localhost:5000/start-campaign \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Drumm",
    "topic": "AI Teaching Tools",
    "senderName": "Sarah Johnson",
    "senderTitle": "Communications Director"
  }'
```

## Best Practices

### Email Deliverability

1. **Warm up your domain**: Start with 20-30 emails/day for new domains
2. **Monitor bounce rates**: Keep under 5%
3. **Track spam complaints**: Keep under 0.1%
4. **Use verified sender email**: Configure in Resend
5. **Gradually increase volume**: Add 10-20% more emails per week
