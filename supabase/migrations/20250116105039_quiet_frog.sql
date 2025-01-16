/*
  # Update Booking System

  1. New Tables
    - `booking_items`
      - `id` (uuid, primary key)
      - `booking_id` (uuid, references bookings)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes
    - Modify `bookings` table status enum
    - Add total_amount column to bookings
    - Update triggers for stock management

  3. Security
    - Enable RLS on new table
    - Add policies for authenticated users
*/

-- Modify bookings table to update status options
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'advance_paid', 'full_paid'));

-- Add total_amount to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS total_amount decimal(10,2) DEFAULT 0.00;

-- Create booking_items table
CREATE TABLE IF NOT EXISTS booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;

-- Create policies for booking_items
CREATE POLICY "Authenticated users can read booking_items"
ON booking_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert booking_items"
ON booking_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update booking_items"
ON booking_items FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete booking_items"
ON booking_items FOR DELETE
TO authenticated
USING (true);

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_product_bookings_trigger ON bookings;
DROP FUNCTION IF EXISTS update_product_bookings();

-- Create new function to update bookings count
CREATE OR REPLACE FUNCTION update_product_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- When a booking item is inserted
  IF (TG_OP = 'INSERT') THEN
    UPDATE products
    SET bookings = bookings + NEW.quantity
    WHERE id = NEW.product_id;
  -- When a booking item is updated
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Decrease the old quantity
    UPDATE products
    SET bookings = bookings - OLD.quantity
    WHERE id = OLD.product_id;
    -- Increase with new quantity
    UPDATE products
    SET bookings = bookings + NEW.quantity
    WHERE id = NEW.product_id;
  -- When a booking item is deleted
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE products
    SET bookings = bookings - OLD.quantity
    WHERE id = OLD.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking_items
CREATE TRIGGER update_product_bookings_trigger
AFTER INSERT OR UPDATE OR DELETE ON booking_items
FOR EACH ROW
EXECUTE FUNCTION update_product_bookings();