/*
  # Create manufacturers table and update products schema

  1. New Tables
    - `manufacturers`
      - `id` (uuid, primary key)
      - `factory_name` (text, not null)
      - `contact_person` (text)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to products table
    - Add manufacturer_id column with foreign key reference
    - Create index for better query performance

  3. Security
    - Enable RLS on manufacturers table
    - Add policies for authenticated users
*/

-- Create manufacturers table
CREATE TABLE IF NOT EXISTS manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_name text NOT NULL,
  contact_person text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;

-- Create policies for manufacturers
CREATE POLICY "Authenticated users can read manufacturers"
ON manufacturers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert manufacturers"
ON manufacturers FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update manufacturers"
ON manufacturers FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete manufacturers"
ON manufacturers FOR DELETE
TO authenticated
USING (true);

-- Add manufacturer_id to products if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'manufacturer_id'
  ) THEN
    ALTER TABLE products
    ADD COLUMN manufacturer_id uuid REFERENCES manufacturers(id);
    
    -- Create index for better query performance
    CREATE INDEX idx_products_manufacturer_id ON products(manufacturer_id);
  END IF;
END $$;

-- Add updated_at trigger
CREATE TRIGGER update_manufacturers_updated_at
  BEFORE UPDATE ON manufacturers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing manufacturer data
DO $$
BEGIN
  -- Insert manufacturers from existing product manufacturer names
  INSERT INTO manufacturers (factory_name)
  SELECT DISTINCT manufacturer
  FROM products
  WHERE manufacturer IS NOT NULL
  AND manufacturer != ''
  AND NOT EXISTS (
    SELECT 1 FROM manufacturers m 
    WHERE m.factory_name = products.manufacturer
  );
  
  -- Update products with new manufacturer_id
  UPDATE products p
  SET manufacturer_id = m.id
  FROM manufacturers m
  WHERE p.manufacturer = m.factory_name;
END $$;