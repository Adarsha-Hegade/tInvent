/*
  # Initial Schema Setup for Inventory Management System

  1. New Tables
    - `admins`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `username` (text)
      - `created_at` (timestamp)
    
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `username` (text)
      - `assigned_columns` (text[])
      - `access_level` (text)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `model_no` (text)
      - `name` (text)
      - `description` (text)
      - `size` (text)
      - `finish` (text)
      - `manufacturer` (text)
      - `total_stock` (integer)
      - `bad_stock` (integer)
      - `bookings` (integer)
      - `available_stock` (integer)
      - `created_at` (timestamp)
    
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `contact_info` (text)
      - `created_at` (timestamp)
    
    - `bookings`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key)
      - `product_id` (uuid, foreign key)
      - `quantity` (integer)
      - `booking_date` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create tables
CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text NOT NULL,
  assigned_columns text[] NOT NULL DEFAULT '{}',
  access_level text NOT NULL CHECK (access_level IN ('read', 'read-write')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE products (
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
  created_at timestamptz DEFAULT now()
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_info text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  booking_date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all data"
  ON admins
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Users can read their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage products"
  ON products
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Users can read products"
  ON products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users with write access can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE access_level = 'read-write'
    )
  );

CREATE POLICY "Admins can manage customers"
  ON customers
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Users can read customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage bookings"
  ON bookings
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM admins));

CREATE POLICY "Users can read bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users with write access can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE access_level = 'read-write'
    )
  );