-- Migration 013: Optimize load balancing - count only WAITING status
-- Called patients are being processed or ignored, shouldn't affect load balancing

DROP FUNCTION IF EXISTS get_least_busy_loket();

CREATE OR REPLACE FUNCTION get_least_busy_loket()
RETURNS INTEGER AS $$
DECLARE
  selected_loket INTEGER;
BEGIN
  -- Count ONLY waiting queues per loket
  -- Ignore called, completed, and no_show
  SELECT loket_id INTO selected_loket
  FROM (
    -- Generate all loket IDs (1-5)
    SELECT generate_series(1, 5) AS loket_id
  ) all_lokets
  LEFT JOIN (
    -- Count ONLY waiting queues per loket
    SELECT loket_id, COUNT(*) as queue_count
    FROM queue_tickets
    WHERE status = 'waiting'  -- ONLY waiting, not called
      AND DATE(created_at) = CURRENT_DATE
    GROUP BY loket_id
  ) waiting_queues USING (loket_id)
  ORDER BY COALESCE(queue_count, 0) ASC, loket_id ASC
  LIMIT 1;
  
  RETURN COALESCE(selected_loket, 1);
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION get_least_busy_loket() IS 'Returns loket with least WAITING queues. Only counts waiting status, ignores called/completed/no_show for better load distribution.';

-- Test the function
SELECT 'Migration 013 completed: Load balancing now counts only WAITING status' AS status;

-- Show current distribution
SELECT 
  loket_id,
  status,
  COUNT(*) as count
FROM queue_tickets
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY loket_id, status
ORDER BY loket_id, status;
