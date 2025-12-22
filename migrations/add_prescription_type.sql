-- Migration: Add type column to prescription_items table
-- This allows distinguishing between regular pharmacy medicines and compounded (racikan) medicines

ALTER TABLE prescription_items 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'regular' 
CHECK (type IN ('regular', 'compounded'));

-- Add composition column for compounded medicines
ALTER TABLE prescription_items
ADD COLUMN IF NOT EXISTS composition TEXT;

COMMENT ON COLUMN prescription_items.type IS 'Type of prescription: regular (from pharmacy stock) or compounded (racikan)';
COMMENT ON COLUMN prescription_items.composition IS 'Composition/formula for compounded medicines';
