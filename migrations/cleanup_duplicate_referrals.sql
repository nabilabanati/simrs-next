-- Cleanup Duplicate Referrals and Visits
-- This script removes duplicate referrals created due to a bug
-- Keeps only the LATEST referral per from_visit_id

-- Step 1: Identify duplicate referrals (for verification)
-- Uncomment to see what will be deleted
/*
SELECT 
    from_visit_id,
    COUNT(*) as referral_count,
    ARRAY_AGG(id ORDER BY created_at DESC) as referral_ids,
    ARRAY_AGG(to_visit_id ORDER BY created_at DESC) as visit_ids
FROM referrals
WHERE from_visit_id IS NOT NULL
GROUP BY from_visit_id
HAVING COUNT(*) > 1
ORDER BY referral_count DESC;
*/

-- Step 2: Delete duplicate VISITS created by duplicate referrals
-- Keep only the visit from the LATEST referral
WITH duplicate_referrals AS (
    SELECT 
        id as referral_id,
        to_visit_id,
        from_visit_id,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY from_visit_id 
            ORDER BY created_at DESC
        ) as rn
    FROM referrals
    WHERE from_visit_id IS NOT NULL
      AND to_visit_id IS NOT NULL
      AND referral_type = 'internal'
),
visits_to_delete AS (
    SELECT to_visit_id
    FROM duplicate_referrals
    WHERE rn > 1  -- Keep rn=1 (latest), delete rn>1
)
DELETE FROM visits
WHERE id IN (SELECT to_visit_id FROM visits_to_delete);

-- Step 3: Delete duplicate REFERRAL records
-- Keep only the LATEST referral per from_visit_id
WITH duplicate_referrals AS (
    SELECT 
        id,
        from_visit_id,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY from_visit_id 
            ORDER BY created_at DESC
        ) as rn
    FROM referrals
    WHERE from_visit_id IS NOT NULL
)
DELETE FROM referrals
WHERE id IN (
    SELECT id 
    FROM duplicate_referrals 
    WHERE rn > 1  -- Keep rn=1 (latest), delete rn>1
);

-- Step 4: Verify cleanup (should return 0 rows)
SELECT 
    from_visit_id,
    COUNT(*) as referral_count
FROM referrals
WHERE from_visit_id IS NOT NULL
GROUP BY from_visit_id
HAVING COUNT(*) > 1;

-- Expected result: No rows (all duplicates removed)
