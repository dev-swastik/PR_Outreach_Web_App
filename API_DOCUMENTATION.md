# API Documentation

Complete API reference for the Email Outreach App.

## Base URL

```
http://localhost:5000
```

## Authentication

Currently, the API does not require authentication. In production, we should implement API key authentication or OAuth.

---

## Campaign Endpoints

### Start a New Campaign

Creates a new PR campaign, discovers journalists, generates personalized emails, and queues them for delivery.

**Endpoint**: `POST /start-campaign`

**Request Body**:
```json
{
  "company": "YourCompany",
  "topic": "AI Teaching Tools",
  "senderName": "John Doe",
  "senderTitle": "PR Manager"
}
```

**Parameters**:
- `company` (required): Your company name
- `topic` (required): Topic to search for journalists (e.g., "AI in Education", "EdTech")
- `senderName` (optional): Name to use in email signature (default: "PR Team")
- `senderTitle` (optional): Job title for signature (default: "Communications")

**Response**: `200 OK`
```json
{
  "success": true,
  "campaign": {
    "id": "uuid",
    "company": "YourCompany",
    "topic": "AI Teaching Tools",
    "totalEmails": 10
  },
  "emails": [
    {
      "journalist": {
        "name": "Jane Doe",
        "email": "jane.doe@techpub.com",
        "publication": "TechPub"
      },
      "emailId": "uuid",
      "queueStatus": {
        "queued": true,
        "position": 1,
        "estimatedWaitTime": 30
      }
    }
  ],
  "rateLimiter": {
    "queueLength": 10,
    "processing": true,
    "emailsSentToday": 5,
    "dailyLimit": 100,
    "remainingToday": 95
  }
}
```

**Error Responses**:
- `404 Not Found`: No journalists found for this topic
- `500 Internal Server Error`: Scraper or database error

---

### List All Campaigns

Get a list of all campaigns.

**Endpoint**: `GET /campaigns`

**Response**: `200 OK`
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "company": "YourCompany",
      "topic": "AI Teaching Tools",
      "status": "running",
      "total_emails": 10,
      "sent_count": 8,
      "opened_count": 3,
      "clicked_count": 1,
      "bounced_count": 0,
      "created_at": "2024-01-20T10:00:00Z",
      "updated_at": "2024-01-20T11:30:00Z"
    }
  ]
}
```

---

### Get Campaign Details

Get detailed information about a specific campaign including all emails.

**Endpoint**: `GET /campaigns/:campaignId`

**Parameters**:
- `campaignId` (required): UUID of the campaign

**Response**: `200 OK`
```json
{
  "emails": [
    {
      "id": "uuid",
      "campaign_id": "uuid",
      "journalist_id": "uuid",
      "subject": "Story idea: AI Teaching Tools",
      "body": "Hi Jane...",
      "status": "opened",
      "sent_at": "2024-01-20T10:05:00Z",
      "delivered_at": "2024-01-20T10:05:30Z",
      "opened_at": "2024-01-20T11:20:00Z",
      "journalist": {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane.doe@techpub.com",
        "publication_name": "TechPub"
      }
    }
  ]
}
```

---

### Get Campaign Analytics

Get comprehensive analytics for a campaign including rates and individual email status.

**Endpoint**: `GET /campaigns/:campaignId/analytics`

**Response**: `200 OK`
```json
{
  "campaign": {
    "id": "uuid",
    "company": "YourCompany",
    "topic": "AI Teaching Tools",
    "status": "running",
    "created_at": "2024-01-20T10:00:00Z"
  },
  "totals": {
    "total": 10,
    "sent": 10,
    "delivered": 10,
    "opened": 3,
    "clicked": 1,
    "bounced": 0
  },
  "rates": {
    "deliveryRate": "100.00",
    "openRate": "30.00",
    "clickRate": "10.00",
    "bounceRate": "0.00"
  },
  "emails": [
    {
      "id": "uuid",
      "status": "opened",
      "sent_at": "2024-01-20T10:05:00Z",
      "opened_at": "2024-01-20T11:20:00Z",
      "journalist": {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane.doe@techpub.com",
        "publication_name": "TechPub"
      }
    }
  ]
}
```

---

## Rate Limiter Endpoints

### Get Rate Limiter Status

Check the current status of the email rate limiter.

**Endpoint**: `GET /rate-limiter/status`

**Response**: `200 OK`
```json
{
  "queueLength": 5,
  "processing": true,
  "emailsSentToday": 45,
  "dailyLimit": 100,
  "remainingToday": 55,
  "currentlySending": 0
}
```

---

## Email Tracking Endpoints

### Track Email Open

This endpoint is called automatically when a recipient opens an email (via tracking pixel).

**Endpoint**: `GET /track/open/:emailId`

**Parameters**:
- `emailId` (required): UUID of the email

**Response**: `200 OK`
- Returns a 1x1 transparent GIF image
- Updates email status to "opened"
- Increments campaign open count

---

### Track Email Click

This endpoint is used to track link clicks in emails. Links should be wrapped with this URL.

**Endpoint**: `GET /track/click/:emailId?url=https://example.com`

**Parameters**:
- `emailId` (required): UUID of the email
- `url` (query parameter, required): The actual destination URL

**Response**: `302 Redirect`
- Redirects to the actual URL
- Updates email status to "clicked"
- Increments campaign click count

---

## Webhook Endpoints

### Resend Webhook

Receives webhook events from Resend for email delivery tracking.

**Endpoint**: `POST /webhooks/resend`

**Request Body** (from Resend):
```json
{
  "type": "email.delivered",
  "data": {
    "email_id": "resend-email-id",
    "to": "recipient@example.com",
    "from": "sender@example.com",
    "subject": "Subject"
  }
}
```

**Event Types**:
- `email.delivered`: Email successfully delivered
- `email.bounced`: Email bounced
- `email.complained`: Spam complaint received
- `email.delivery_delayed`: Delivery delayed

**Response**: `200 OK`
```json
{
  "success": true
}
```

**Configuration**:
To set up Resend webhooks:
1. Go to Resend Dashboard > Webhooks
2. Add webhook URL: `https://your-domain.com/webhooks/resend`
3. Select events to track

---

## Health Check

### Check API Health

Verify API is running and check environment configuration.

**Endpoint**: `GET /health`

**Response**: `200 OK`
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

---

## Status Codes

- `200 OK`: Request successful
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting Configuration

The system enforces the following limits:

- **Emails per minute**: 2
- **Delay between emails**: 30 seconds
- **Daily email limit**: 100
- **Concurrent sends**: 1

These can be adjusted in `backend/src/rateLimiter.service.js`

---

## Database Schema

### Journalists Table

```sql
id: uuid
first_name: text
last_name: text
email: text (unique)
city: text
state: text
country: text
publication_name: text
topics: text[]
recent_articles: jsonb
created_at: timestamptz
updated_at: timestamptz
```

### Campaigns Table

```sql
id: uuid
company: text
topic: text
status: text (draft, running, paused, completed)
total_emails: integer
sent_count: integer
opened_count: integer
clicked_count: integer
bounced_count: integer
created_at: timestamptz
updated_at: timestamptz
```

### Emails Table

```sql
id: uuid
campaign_id: uuid (foreign key)
journalist_id: uuid (foreign key)
subject: text
body: text
resend_email_id: text
status: text (queued, sent, delivered, opened, clicked, bounced, failed)
sent_at: timestamptz
delivered_at: timestamptz
opened_at: timestamptz
clicked_at: timestamptz
bounced_at: timestamptz
error_message: text
created_at: timestamptz
updated_at: timestamptz
```

---

## Example Workflow

1. **Start Campaign**
   ```bash
   POST /start-campaign
   Body: { "company": "Drumm", "topic": "AI Teaching Tools" }
   ```

2. **Check Rate Limiter**
   ```bash
   GET /rate-limiter/status
   ```

3. **Monitor Campaign**
   ```bash
   GET /campaigns/:campaignId/analytics
   ```

4. **View All Campaigns**
   ```bash
   GET /campaigns
   ```

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## Best Practices

1. **Monitor Rate Limiter**: Check `/rate-limiter/status` before starting large campaigns
2. **Review Analytics**: Use `/campaigns/:id/analytics` to track campaign performance
3. **Handle Webhooks**: Configure Resend webhooks for real-time tracking
4. **Gradual Scaling**: Start with small campaigns (20-30 emails) and gradually increase
5. **Monitor Bounce Rates**: Keep bounce rate under 5% to maintain sender reputation
