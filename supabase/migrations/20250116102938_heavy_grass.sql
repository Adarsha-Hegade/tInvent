/*
  # Simplify table policies

  1. Changes
    - Remove complex role-based policies
    - Add simple authenticated user policies
    - Ensure no circular dependencies

  2. Security
    - All authenticated users can perform CRUD operations
    - Maintain basic security while avoiding recursion
*/

-- Drop existing complex policies
DROP POLICY IF EXISTS "Users can view products based on assigned columns" ON products;
DROP POLICY IF EXISTS "Only admins can modify products" ON products;
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Only admins and managers can modify customers" ON customers;

-- Create simplified policies for products
CREATE POLICY "Authenticated users can read products"
ON products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
ON products FOR DELETE
TO authenticated
USING (true);

-- Create simplified policies for customers
CREATE POLICY "Authenticated users can read customers"
ON customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert customers"
ON customers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
ON customers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
ON customers FOR DELETE
TO authenticated
USING (true);

-- Create simplified policies for bookings
CREATE POLICY "Authenticated users can read bookings"
ON bookings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update bookings"
ON bookings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete bookings"
ON bookings FOR DELETE
TO authenticated
USING (true);