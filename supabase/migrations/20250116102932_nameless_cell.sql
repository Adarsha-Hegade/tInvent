/*
  # Fix user_profiles policies

  1. Changes
    - Remove recursive policies from user_profiles table
    - Simplify access control based on user ID
    - Add basic policies for authenticated users

  2. Security
    - Users can only view and edit their own profile
    - Admins are determined by the role field in their own profile
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Only admins can modify user profiles" ON user_profiles;

-- Create new simplified policies
CREATE POLICY "Users can view their own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Create policy for admin operations based on session user's role
CREATE POLICY "Admins can view all profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  (SELECT role = 'admin' FROM user_profiles WHERE id = auth.uid())
  OR auth.uid() = id
);

CREATE POLICY "Admins can update all profiles"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  (SELECT role = 'admin' FROM user_profiles WHERE id = auth.uid())
  OR auth.uid() = id
)
WITH CHECK (
  (SELECT role = 'admin' FROM user_profiles WHERE id = auth.uid())
  OR auth.uid() = id
);