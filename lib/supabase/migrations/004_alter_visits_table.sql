-- Add missing columns to visits table to support counter features
ALTER TABLE visits 
ADD COLUMN IF NOT EXISTS penjamin_id UUID REFERENCES penjamin(id),
ADD COLUMN IF NOT EXISTS harga NUMERIC(15, 2) DEFAULT 0;

-- Optional: Add index for penjamin
CREATE INDEX IF NOT EXISTS idx_visits_penjamin_id ON visits(penjamin_id);
