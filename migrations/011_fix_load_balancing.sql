-- Migration 011: Fix get_least_busy_loket function
-- Improve logic to properly distribute across all 5 lokets

DROP FUNCTION IF EXISTS get_least_busy_loket();

CREATE OR REPLACE FUNCTION get_least_busy_loket()
RETURNS INTEGER AS $$
DECLARE
  selected_loket INTEGER;
  min_count INTEGER;
BEGIN
  -- Get the minimum count of active queues
  SELECT COALESCE(MIN(active_count), 0) INTO min_count
  FROM (
    SELECT loket_id, COUNT(*) as active_count
    FROM queue_tickets
    WHERE status IN ('waiting', 'called')
      AND DATE(created_at) = CURRENT_DATE
    GROUP BY loket_id
  ) AS counts;
  
  -- If no active queues at all, start with loket 1
  IF min_count = 0 THEN
    -- Check if there are any lokets with 0 queues
    -- Return the first loket (1-5) that has no active queues
    FOR selected_loket IN 1..5 LOOP
      IF NOT EXISTS (
        SELECT 1 FROM queue_tickets
        WHERE loket_id = selected_loket
          AND status IN ('waiting', 'called')
          AND DATE(created_at) = CURRENT_DATE
      ) THEN
        RETURN selected_loket;
      END IF;
    END LOOP;
    
    -- If all lokets have queues, return loket 1
    RETURN 1;
  END IF;
  
  -- Get loket with minimum active queues
  SELECT loket_id INTO selected_loket
  FROM (
    SELECT loket_id, COUNT(*) as active_count
    FROM queue_tickets
    WHERE status IN ('waiting', 'called')
      AND DATE(created_at) = CURRENT_DATE
    GROUP BY loket_id
    HAVING COUNT(*) = min_count
    ORDER BY loket_id ASC
    LIMIT 1
  ) AS min_loket;
  
  -- If still NULL, default to loket 1
  IF selected_loket IS NULL THEN
    selected_loket := 1;
  END IF;
  
  RETURN selected_loket;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'Migration 011 completed: get_least_busy_loket function improved' AS status;

-- Show current distribution
SELECT 
  loket_id,
  COUNT(*) as queue_count,
  status
FROM queue_tickets
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY loket_id, status
ORDER BY loket_id, status;
