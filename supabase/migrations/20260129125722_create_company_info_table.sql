/*
  # Create company_info table

  This table stores company information used for email personalization and AI prompts.

  1. New Tables
    - `company_info`
      - `id` (uuid, primary key)
      - `company_name` (text)
      - `description` (text)
      - `website` (text)
      - `industry` (text)
      - `target_topics` (text array)
      - `brand_tone` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `company_info` table
    - Add policy for public access (single company configuration)
*/

CREATE TABLE IF NOT EXISTS company_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  description text DEFAULT '',
  website text DEFAULT '',
  industry text DEFAULT '',
  target_topics text[] DEFAULT '{}',
  brand_tone text DEFAULT 'Professional',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE company_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view company info"
  ON company_info FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert company info"
  ON company_info FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update company info"
  ON company_info FOR UPDATE
  USING (true)
  WITH CHECK (true);
