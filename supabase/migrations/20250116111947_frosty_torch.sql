/*
  # Fix bookings schema

  1. Changes
    - Remove quantity from bookings table as it's now in booking_items
    - Add missing default for status
    - Update status values
*/

-- Remove quantity from bookings as it's now in booking_items
ALTER TABLE bookings 
DROP COLUMN IF EXISTS quantity,
DROP COLUMN IF EXISTS product_id;

-- Update status constraint
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings
ALTER COLUMN status SET DEFAULT 'pending',
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'advance_paid', 'full_paid'));