/*
  # Fix RLS Policies for Products Table

  1. Changes
    - Update RLS policies to allow authenticated users to perform CRUD operations
    - Remove overly restrictive policies that were causing 42501 errors
  
  2. Security
    - Maintain basic authentication check
    - Allow authenticated users to manage products
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view products based on assigned columns" ON products;
DROP POLICY IF EXISTS "Only admins can modify products" ON products;

-- Create new policies that allow authenticated users to perform CRUD operations
CREATE POLICY "Allow authenticated users to view products"
ON products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete products"
ON products FOR DELETE
TO authenticated
USING (true);