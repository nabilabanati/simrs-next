-- Migration 012: Simplified load balancing - round robin style
-- Much simpler logic: find loket with least total queues

DROP FUNCTION IF EXISTS get_least_busy_loket();

CREATE OR REPLACE FUNCTION get_least_busy_loket()
RETURNS INTEGER AS $$
DECLARE
  selected_loket INTEGER;
BEGIN
  -- Count active queues per loket and select the one with minimum
  -- Include all lokets (1-5) even if they have 0 queues
  SELECT loket_id INTO selected_loket
  FROM (
    -- Generate all loket IDs (1-5)
    SELECT generate_series(1, 5) AS loket_id
  ) all_lokets
  LEFT JOIN (
    -- Count active queues per loket
    SELECT loket_id, COUNT(*) as queue_count
    FROM queue_tickets
    WHERE status IN ('waiting', 'called')
      AND DATE(created_at) = CURRENT_DATE
    GROUP BY loket_id
  ) active_queues USING (loket_id)
  ORDER BY COALESCE(queue_count, 0) ASC, loket_id ASC
  LIMIT 1;
  
  -- Fallback to loket 1 if somehow NULL
  RETURN COALESCE(selected_loket, 1);
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT 'Migration 012 completed: Simplified load balancing function' AS status;

-- Test: should return loket with least queues
SELECT get_least_busy_loket() as recommended_loket;

-- Show current distribution
SELECT 
  loket_id,
  COUNT(*) as total_queues
FROM queue_tickets
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY loket_id
ORDER BY loket_id;
