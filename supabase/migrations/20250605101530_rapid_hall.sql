/*
  # Fix Testimonials Status and Policies

  1. Changes
    - Add status column to testimonials
    - Add user_id column to testimonials
    - Update existing testimonials to approved status
    - Fix policies for proper access control

  2. Security
    - Only approved testimonials visible to public
    - Users can view their own testimonials
    - Admins can view all testimonials
*/

-- Update existing testimonials to have approved status
UPDATE testimonials 
SET status = 'approved' 
WHERE status IS NULL OR status = '';

-- Add user_id and status columns if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'testimonials' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE testimonials
    ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'testimonials' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE testimonials
    ADD COLUMN status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access" ON testimonials;
DROP POLICY IF EXISTS "Users can create testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can view their own testimonials" ON testimonials;
DROP POLICY IF EXISTS "Public can view approved testimonials" ON testimonials;

-- Create new policies
CREATE POLICY "Public can view approved testimonials"
ON testimonials FOR SELECT
TO public
USING (status = 'approved');

CREATE POLICY "Users can view testimonials"
ON testimonials FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR
  status = 'approved' OR
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

CREATE POLICY "Users can submit testimonials"
ON testimonials FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);