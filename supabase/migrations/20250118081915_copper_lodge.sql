/*
  # Add new fields to products table

  1. New Fields
    - `remarks` (text) - For general remarks about the product
    - `internal_notes` (text) - For internal notes and comments
    - `dead_stock` (integer) - For tracking dead stock items

  2. Changes
    - Modified available_stock calculation to include dead_stock
*/

ALTER TABLE products
ADD COLUMN IF NOT EXISTS remarks text,
ADD COLUMN IF NOT EXISTS internal_notes text,
ADD COLUMN IF NOT EXISTS dead_stock integer NOT NULL DEFAULT 0;

-- Drop the existing available_stock generated column
ALTER TABLE products DROP COLUMN IF EXISTS available_stock;

-- Recreate available_stock with new calculation
ALTER TABLE products
ADD COLUMN available_stock integer 
GENERATED ALWAYS AS (total_stock - bad_stock - dead_stock - bookings) STORED;