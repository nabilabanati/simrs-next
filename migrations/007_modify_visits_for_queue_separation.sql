-- Migration 007: Modify visits table for new structure
-- Remove queue-related columns, add reference to queue_tickets

-- Add queue_ticket_id reference (optional - can be NULL for walk-in patients)
ALTER TABLE visits ADD COLUMN IF NOT EXISTS queue_ticket_id UUID REFERENCES queue_tickets(id);

-- Drop triggers that depend on queue_status column
DROP TRIGGER IF EXISTS before_update_no_reg ON visits;
DROP TRIGGER IF EXISTS before_insert_no_reg ON visits;

-- Remove queue-related columns from visits (they're now in queue_tickets)
ALTER TABLE visits DROP COLUMN IF EXISTS queue_number CASCADE;
ALTER TABLE visits DROP COLUMN IF EXISTS loket_id CASCADE;
ALTER TABLE visits DROP COLUMN IF EXISTS queue_status CASCADE;
ALTER TABLE visits DROP COLUMN IF EXISTS called_at CASCADE;

-- Recreate trigger for INSERT (visits created at registration, not at queue)
CREATE TRIGGER before_insert_no_reg
BEFORE INSERT ON visits
FOR EACH ROW
WHEN (NEW.no_reg IS NULL AND NEW.poli_id IS NOT NULL)
EXECUTE FUNCTION generate_no_reg();

-- Add index on queue_ticket_id
CREATE INDEX IF NOT EXISTS idx_visits_queue_ticket_id ON visits(queue_ticket_id);

-- Add comments
COMMENT ON COLUMN visits.queue_ticket_id IS 'Reference to queue ticket (NULL for walk-in patients without queue)';
COMMENT ON TABLE visits IS 'Patient visits - created only when registration is completed';

-- Display success message
SELECT 'Migration 007 completed: visits table modified to reference queue_tickets' AS status;
