/*
  # Add Categories and Price Features

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to Products Table
    - Add `price` column (decimal)
    - Add `category_id` column (uuid, foreign key)

  3. Security
    - Enable RLS on categories table
    - Add policies for authenticated users
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories
CREATE POLICY "Authenticated users can read categories"
ON categories FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
ON categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
ON categories FOR DELETE
TO authenticated
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add new columns to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price decimal(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);