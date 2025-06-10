-- Update existing testimonials to have approved status
UPDATE testimonials 
SET status = 'approved' 
WHERE status IS NULL OR status = '';

-- Add user_id and status columns
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON testimonials;

-- Add policies for authenticated users
CREATE POLICY "Users can create testimonials"
ON testimonials FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own testimonials"
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

-- Add policy for public read access to approved testimonials only
CREATE POLICY "Public can view approved testimonials"
ON testimonials FOR SELECT
TO public
USING (status = 'approved');