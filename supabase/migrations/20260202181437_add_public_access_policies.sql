/*
  # Add Public Access Policies for Frontend

  This migration adds RLS policies to allow the frontend (using anon key) to:
  - Read campaigns
  - Read journalists
  - Read emails
  - Create campaigns
  - Create journalists
  - Create emails

  ## Security Notes
  - These policies are permissive for MVP purposes
  - In production, you should add user authentication and restrict access
*/

-- Allow anon users to read campaigns
CREATE POLICY "Allow anon read access to campaigns"
  ON campaigns
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon users to create campaigns
CREATE POLICY "Allow anon create access to campaigns"
  ON campaigns
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon users to read journalists
CREATE POLICY "Allow anon read access to journalists"
  ON journalists
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon users to create/update journalists
CREATE POLICY "Allow anon create access to journalists"
  ON journalists
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update access to journalists"
  ON journalists
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anon users to read emails
CREATE POLICY "Allow anon read access to emails"
  ON emails
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon users to create emails
CREATE POLICY "Allow anon create access to emails"
  ON emails
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon users to read company_info
CREATE POLICY "Allow anon read access to company_info"
  ON company_info
  FOR SELECT
  TO anon
  USING (true);

-- Allow anon users to create/update company_info
CREATE POLICY "Allow anon create access to company_info"
  ON company_info
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon update access to company_info"
  ON company_info
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);