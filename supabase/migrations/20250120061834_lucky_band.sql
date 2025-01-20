/*
  # Add manufacturer_id to products table

  1. Changes
    - Add manufacturer_id column to products table
    - Add foreign key constraint to manufacturers table
*/

-- Add manufacturer_id column
ALTER TABLE products
ADD COLUMN manufacturer_id uuid REFERENCES manufacturers(id);

-- Create index for better query performance
CREATE INDEX idx_products_manufacturer_id ON products(manufacturer_id);

-- Migrate existing manufacturer data
DO $$
BEGIN
  -- Update products with new manufacturer_id
  UPDATE products p
  SET manufacturer_id = m.id
  FROM manufacturers m
  WHERE p.manufacturer = m.factory_name;
END $$;