/*
  # Add user testimonials support
  
  1. Changes
    - Add user_id column to testimonials table
    - Add status column for moderation
    - Add RLS policies for user testimonials
    
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Add user_id and status columns
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'approved', 'rejected'));

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