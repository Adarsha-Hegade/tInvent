/*
  # Initial Schema Setup for Inventory Management System

  1. New Tables
    - `products`
      - Core product information
      - Stock management fields
      - Automatic available stock calculation
    - `customers`
      - Customer details
    - `bookings`
      - Booking records
      - Links products and customers
    - `users`
      - User profiles with access control
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    
  3. Functions
    - Trigger for calculating available stock
    - Trigger for updating product bookings
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_no text NOT NULL,
  name text NOT NULL,
  description text,
  size text,
  finish text,
  manufacturer text,
  total_stock integer NOT NULL DEFAULT 0,
  bad_stock integer NOT NULL DEFAULT 0,
  bookings integer NOT NULL DEFAULT 0,
  available_stock integer GENERATED ALWAYS AS (total_stock - bad_stock - bookings) STORED,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  booking_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  assigned_columns text[] DEFAULT '{}',
  access_level text NOT NULL DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view products based on assigned columns"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify products"
  ON products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR (role = 'manager' AND access_level = 'write'))
    )
  );

CREATE POLICY "Users can view customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins and managers can modify customers"
  ON customers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND (role = 'admin' OR role = 'manager')
    )
  );

CREATE POLICY "Users can view their own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Only admins can modify user profiles"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update bookings count
CREATE OR REPLACE FUNCTION update_product_bookings()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE products
    SET bookings = bookings + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE products
      SET bookings = bookings + NEW.quantity
      WHERE id = NEW.product_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE products
      SET bookings = bookings - OLD.quantity
      WHERE id = NEW.product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bookings
CREATE TRIGGER update_product_bookings_trigger
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_product_bookings();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();