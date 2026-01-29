# PR Outreach Frontend Guide

## Overview

The frontend is a React + Vite application that provides a comprehensive 7-tab dashboard for managing email campaigns, from company setup through email tracking and response management.

## Architecture

### Tech Stack
- **Framework**: React 18 with Vite
- **Styling**: CSS (modular per component)
- **Icons**: Lucide React
- **Backend**: Node.js/Express (Render)
- **Database**: Supabase
- **Deployment**: Netlify

### Directory Structure

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Sidebar.jsx
│   │   ├── Sidebar.css
│   │   ├── RateLimiterStatus.jsx
│   │   └── ...
│   ├── pages/             # Tab pages (one component per tab)
│   │   ├── CompanyInfo.jsx
│   │   ├── CampaignScraper.jsx
│   │   ├── EmailLists.jsx
│   │   ├── EmailGeneration.jsx
│   │   ├── SendCampaign.jsx
│   │   ├── EmailTracking.jsx
│   │   └── RespondResponses.jsx
│   ├── hooks/             # Custom React hooks
│   │   └── useAuth.js
│   ├── lib/               # Utilities and API clients
│   │   └── supabase.js
│   ├── App.jsx            # Main app component
│   ├── App.css
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── package.json
└── .env.example           # Environment variables template
```

## 7-Tab Navigation Structure

### Tab 1: Company Info
**File**: `src/pages/CompanyInfo.jsx`

Store and manage company context used for:
- Email personalization
- AI prompt engineering
- Brand tone selection

**Features**:
- Auto-save on blur
- Company description, website, industry
- Target topics (multi-select)
- Brand tone selector (Professional/Friendly/Informative/Persuasive)

### Tab 2: Campaign & Scraper
**File**: `src/pages/CampaignScraper.jsx`

Create campaigns and scrape journalist contacts:
- Campaign setup form
- Run Outscraper integration
- Results table with contact selection
- Topic match scoring

### Tab 3: Email Lists
**File**: `src/pages/EmailLists.jsx`

Manage email contact lists:
- CSV upload
- List filtering by status
- Bulk actions
- Compliance tracking (unsubscribed/blocked)

### Tab 4: Generate Personalized Emails
**File**: `src/pages/EmailGeneration.jsx`

AI-powered email generation:
- Reference content input
- Email objective selector
- Tone and length controls
- Real-time preview
- Save/copy actions

### Tab 5: Send Email Campaign
**File**: `src/pages/SendCampaign.jsx`

Controlled email sending:
- Campaign selection
- Email account verification (dumroo.ai)
- Sending speed controls (Slow/Medium/Fast)
- Progress tracking
- Pause/Resume controls

### Tab 6: Email Tracking
**File**: `src/pages/EmailTracking.jsx`

Monitor campaign performance:
- KPI cards (Open Rate, Click Rate, Bounce Rate)
- Tracking tabs (Delivered, Opened, Clicked, Bounced, Responses)
- Detailed email tracking table
- Real-time or periodic refresh

### Tab 7: Respond to Responses
**File**: `src/pages/RespondResponses.jsx`

Manage email replies:
- Inbox-style layout
- Email thread view
- Reply composer
- Sentiment tagging (Interested/Not Interested/Follow-up Later)
- Mark action buttons

## Setup & Development

### Installation

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_BACKEND_API_URL=http://localhost:5000
VITE_ENVIRONMENT=development
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm install
npm run preview
```

Output is in the `dist/` directory for Netlify deployment.

## Component Patterns

### Form Groups
Standard form component pattern with validation:

```jsx
<div className="form-group">
  <label htmlFor="field">Label</label>
  <input
    id="field"
    type="text"
    value={value}
    onChange={handleChange}
    disabled={loading}
  />
  <small>Helper text</small>
</div>
```

### Buttons
Primary and secondary button styles:

```jsx
<button className="btn btn-primary">Primary Action</button>
<button className="btn btn-secondary">Secondary Action</button>
```

### Status Badges
Color-coded status indicators:

```jsx
<span className="status-badge status-active">Active</span>
<span className="status-badge status-pending">Pending</span>
```

## Authentication (TODO)

Currently uses mock user. Integrate Supabase Auth:

1. Import Supabase client in `useAuth.js`
2. Set up `onAuthStateChange` listener
3. Protect routes in App.jsx
4. Add login/signup pages

```javascript
// Example from useAuth.js
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);
supabase.auth.onAuthStateChange((event, session) => {
  setUser(session?.user ?? null);
});
```

## API Integration (TODO)

All API calls should go through the backend:

```javascript
// Example: src/api.js
const API_URL = import.meta.env.VITE_BACKEND_API_URL;

export async function startCampaign(data) {
  const response = await fetch(`${API_URL}/campaigns`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

## Deployment to Netlify

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy

## Styling Guidelines

- **Color System**: Blue (#3b82f6) for primary, red (#ef4444) for danger
- **Spacing**: 8px base unit, use rem/em for responsive
- **Typography**: System fonts, 2-3 font weights maximum
- **Responsive**: Mobile-first with breakpoints at 768px and 1024px

## Future Enhancements

- [ ] Real Supabase authentication
- [ ] Backend API integration for all forms
- [ ] Real-time WebSocket updates for tracking
- [ ] Email preview in iframe
- [ ] Recipient segmentation and filtering
- [ ] A/B testing UI
- [ ] Scheduled sending
- [ ] Template library
- [ ] Analytics export
