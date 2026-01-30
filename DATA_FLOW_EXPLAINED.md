# Data Flow: Scraper → Email Verification → Supabase

## Complete Flow Diagram

```
1. Scraper Service (Python)
   ↓
2. Email Enrichment (Hunter API)
   ↓
3. Backend Controller
   ↓
4. Supabase Database
```

---

## 1️⃣ SCRAPER SERVICE (Python)

**File:** `/email-scraper-service/run_scraper.py`

### What it does:
- Scrapes RSS feeds from publishers (NY Times, Reuters, etc.)
- **FIXED:** Now splits co-authored articles into individual journalists
  - ✅ "Cade Metz and Karen Weise" → 2 separate people
  - ✅ "A, B and C" → 3 separate people

### Data returned:
```javascript
{
  first_name: "Cade",
  last_name: "Metz",
  publication_name: "New York Times",
  domain: "nytimes.com",  // ⚠️ Note: field is "domain" not "publication_domain"
  topics: [],
  recent_articles: [
    {
      title: "Article Title",
      url: "https://...",
      published: "..."
    }
  ]
}
```

---

## 2️⃣ EMAIL ENRICHMENT (Hunter API)

**File:** `/backend/src/enrichment/hunter.service.js`

### What it does:
- Takes `firstName`, `lastName`, `domain` from scraper
- Queries Hunter.io API to find verified email
- Returns email with confidence score

### Data returned:
```javascript
{
  email: "cade.metz@nytimes.com",
  confidence: 99,  // 0-100 score
  source: "hunter"
}
```

---

## 3️⃣ BACKEND CONTROLLER

**File:** `/backend/src/controller.js` (Line 74-133)

### What it does:

```javascript
for (const j of journalists) {
    // Step 1: Get email from Hunter
    const emailData = await findJournalistEmail({
        firstName: j.first_name,
        lastName: j.last_name,
        domain: j.domain  // ✅ FIXED: was j.publication_domain
    });

    // Step 2: Skip if no verified email (confidence < 70%)
    if (!emailData?.email || emailData.confidence < 70) {
        console.log(`Skipping ${j.first_name} ${j.last_name} — no verified email`);
        continue;
    }

    // Step 3: Save to Supabase
    const journalist = await upsertJournalist({
        ...j,                              // All scraper data
        email: emailData.email,            // Verified email
        email_confidence: emailData.confidence,
        email_source: emailData.source
    });

    // Step 4: Create email record
    await createEmailRecord(
        campaign.id,
        journalist.id,
        subject,
        emailBody
    );
}
```

---

## 4️⃣ SUPABASE DATABASE

**File:** `/backend/src/supabase.js`

### `upsertJournalist()` function (Line 40-69)

```javascript
export async function upsertJournalist(journalistData) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('journalists')
    .upsert({
      email: journalistData.email,             // ✅ UNIQUE KEY
      first_name: journalistData.first_name,
      last_name: journalistData.last_name,
      city: journalistData.city || '',
      state: journalistData.state || '',
      country: journalistData.country || '',
      publication_name: journalistData.publication_name,
      topics: journalistData.topics || [],
      recent_articles: journalistData.recent_articles || [],
      email_confidence: journalistData.email_confidence,
      email_source: journalistData.email_source
    }, {
      onConflict: 'email'  // ✅ Update if email exists
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Database Schema

**Table: `journalists`**
```sql
CREATE TABLE journalists (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,        -- ✅ UNIQUE constraint
  first_name text,
  last_name text,
  publication_name text,
  email_confidence integer,
  email_source text,
  topics text[],
  recent_articles jsonb,
  created_at timestamptz,
  updated_at timestamptz
);
```

### How `upsert` works:
- **INSERT** if email doesn't exist
- **UPDATE** if email already exists
- Returns the journalist record with `id`

---

## 🐛 BUG FIXED

### Issue:
```javascript
// ❌ BEFORE: Line 78 in controller.js
domain: j.publication_domain  // Field doesn't exist!
```

### Fix:
```javascript
// ✅ AFTER
domain: j.domain  // Correct field name
```

---

## ✅ Testing the Flow

Run the test script:
```bash
cd backend
node src/test-data-flow.js
```

This will:
1. Simulate scraper data
2. Simulate Hunter email data
3. Attempt to save to Supabase
4. Show you the exact data being saved

---

## 🔍 Verification Checklist

### Check Supabase credentials:
```bash
# .env file should have:
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Check data in Supabase:
```sql
-- View all journalists
SELECT first_name, last_name, email, email_confidence
FROM journalists
ORDER BY created_at DESC;

-- View campaign emails
SELECT
  e.subject,
  j.first_name,
  j.last_name,
  j.email,
  e.status
FROM emails e
JOIN journalists j ON e.journalist_id = j.id
WHERE e.campaign_id = 'YOUR_CAMPAIGN_ID';
```

---

## 🎯 Summary

| Step | File | Function | What Saves |
|------|------|----------|------------|
| 1 | `run_scraper.py` | `scrape_journalists_from_publishers()` | Nothing (returns data) |
| 2 | `hunter.service.js` | `findJournalistEmail()` | Nothing (returns data) |
| 3 | `controller.js` | `startCampaign()` | Orchestrates everything |
| 4 | `supabase.js` | **`upsertJournalist()`** | **✅ SAVES TO DATABASE** |
| 5 | `supabase.js` | **`createEmailRecord()`** | **✅ SAVES EMAIL RECORDS** |

**The actual saving happens in `supabase.js`** using the Supabase client library.
