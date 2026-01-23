/*
  # Create PR Outreach Database Schema

  1. New Tables
    - `journalists`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `email` (text, unique)
      - `city` (text)
      - `state` (text)
      - `country` (text)
      - `publication_name` (text)
      - `topics` (text array) - topics they write about
      - `recent_articles` (jsonb) - array of recent articles with titles and URLs
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `campaigns`
      - `id` (uuid, primary key)
      - `company` (text)
      - `topic` (text)
      - `status` (text) - 'draft', 'running', 'paused', 'completed'
      - `total_emails` (integer)
      - `sent_count` (integer)
      - `opened_count` (integer)
      - `clicked_count` (integer)
      - `bounced_count` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `emails`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, foreign key)
      - `journalist_id` (uuid, foreign key)
      - `subject` (text)
      - `body` (text)
      - `resend_email_id` (text) - ID from Resend service
      - `status` (text) - 'queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
      - `sent_at` (timestamptz)
      - `delivered_at` (timestamptz)
      - `opened_at` (timestamptz)
      - `clicked_at` (timestamptz)
      - `bounced_at` (timestamptz)
      - `error_message` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access (for future auth implementation)
    - For now, service role will be used for backend operations
*/

-- Create journalists table
CREATE TABLE IF NOT EXISTS journalists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text DEFAULT '',
  last_name text DEFAULT '',
  email text UNIQUE NOT NULL,
  city text DEFAULT '',
  state text DEFAULT '',
  country text DEFAULT '',
  publication_name text DEFAULT '',
  topics text[] DEFAULT ARRAY[]::text[],
  recent_articles jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  topic text NOT NULL,
  status text DEFAULT 'draft',
  total_emails integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  bounced_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  journalist_id uuid REFERENCES journalists(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  resend_email_id text,
  status text DEFAULT 'queued',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_journalists_email ON journalists(email);
CREATE INDEX IF NOT EXISTS idx_journalists_topics ON journalists USING GIN(topics);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_emails_campaign_id ON emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_journalist_id ON emails(journalist_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_resend_id ON emails(resend_email_id);

-- Enable Row Level Security
ALTER TABLE journalists ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create policies (permissive for service role operations)
-- For now, allow all operations via service role
-- In production, you'd add user-specific policies

CREATE POLICY "Allow service role full access to journalists"
  ON journalists
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to campaigns"
  ON campaigns
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to emails"
  ON emails
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_journalists_updated_at
  BEFORE UPDATE ON journalists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
