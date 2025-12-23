-- Migration 006: Add helper functions for queue_tickets
-- queue_tickets table already exists from migration 002
-- This migration only adds the required functions

-- Function: Get next queue number for today
CREATE OR REPLACE FUNCTION get_next_queue_number()
RETURNS INTEGER AS $$
DECLARE
  next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) + 1 INTO next_number
  FROM queue_tickets
  WHERE DATE(created_at) = CURRENT_DATE;
  
  RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Function: Get least busy loket (load balancing)
CREATE OR REPLACE FUNCTION get_least_busy_loket()
RETURNS INTEGER AS $$
DECLARE
  selected_loket INTEGER;
BEGIN
  -- Count active queue tickets per loket
  SELECT loket_id INTO selected_loket
  FROM (
    SELECT 
      loket_id,
      COUNT(*) as active_count
    FROM queue_tickets
    WHERE status IN ('waiting', 'called')
      AND DATE(created_at) = CURRENT_DATE
    GROUP BY loket_id
    ORDER BY active_count ASC, loket_id ASC
    LIMIT 1
  ) AS counts;
  
  -- If no loket has active queues, default to loket 1
  IF selected_loket IS NULL THEN
    selected_loket := 1;
  END IF;
  
  RETURN selected_loket;
END;
$$ LANGUAGE plpgsql;

-- Add 'no_show' status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%queue_tickets%status%'
    AND check_clause LIKE '%no_show%'
  ) THEN
    ALTER TABLE queue_tickets DROP CONSTRAINT IF EXISTS queue_tickets_status_check;
    ALTER TABLE queue_tickets ADD CONSTRAINT queue_tickets_status_check 
      CHECK (status IN ('waiting', 'called', 'completed', 'cancelled', 'no_show'));
  END IF;
END $$;

-- Add comments
COMMENT ON FUNCTION get_next_queue_number() IS 'Get next queue number for today (resets daily)';
COMMENT ON FUNCTION get_least_busy_loket() IS 'Get loket with least active queue tickets for load balancing';

-- Display success message
SELECT 'Migration 006 completed: Helper functions added to queue_tickets' AS status;
