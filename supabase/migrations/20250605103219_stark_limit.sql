/*
  # Fix testimonials status handling

  1. Changes
    - Add UPDATE policy for admin users
    - Ensure proper status column constraints
    - Fix existing policies
    
  2. Security
    - Maintain RLS protection
    - Allow admins to manage testimonials
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public can view approved testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can view testimonials" ON testimonials;
DROP POLICY IF EXISTS "Users can submit testimonials" ON testimonials;

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

-- Add admin update policy
CREATE POLICY "Admins can update testimonials"
ON testimonials FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_super_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Add admin delete policy
CREATE POLICY "Admins can delete testimonials"
ON testimonials FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admin_users
    WHERE id = auth.uid() AND is_super_admin = true
  )
);