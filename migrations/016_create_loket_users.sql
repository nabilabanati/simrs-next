-- Create 5 user accounts for each loket
-- Password format: passloket[N] where N is loket number

-- Loket 1
INSERT INTO public.users (username, password, nama, role, is_active)
VALUES ('loket1', 'pass1', 'Petugas Loket 1', 'loket', true)
ON CONFLICT (username) DO NOTHING;

-- Loket 2
INSERT INTO public.users (username, password, nama, role, is_active)
VALUES ('loket2', 'pass2', 'Petugas Loket 2', 'loket', true)
ON CONFLICT (username) DO NOTHING;

-- Loket 3
INSERT INTO public.users (username, password, nama, role, is_active)
VALUES ('loket3', 'pass3', 'Petugas Loket 3', 'loket', true)
ON CONFLICT (username) DO NOTHING;

-- Loket 4
INSERT INTO public.users (username, password, nama, role, is_active)
VALUES ('loket4', 'pass4', 'Petugas Loket 4', 'loket', true)
ON CONFLICT (username) DO NOTHING;

-- Loket 5
INSERT INTO public.users (username, password, nama, role, is_active)
VALUES ('loket5', 'pass5', 'Petugas Loket 5', 'loket', true)
ON CONFLICT (username) DO NOTHING;

-- Assign each user to their respective loket
-- Get user IDs and assign
DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    user3_id uuid;
    user4_id uuid;
    user5_id uuid;
BEGIN
    -- Get user IDs
    SELECT id INTO user1_id FROM public.users WHERE username = 'loket1';
    SELECT id INTO user2_id FROM public.users WHERE username = 'loket2';
    SELECT id INTO user3_id FROM public.users WHERE username = 'loket3';
    SELECT id INTO user4_id FROM public.users WHERE username = 'loket4';
    SELECT id INTO user5_id FROM public.users WHERE username = 'loket5';
    
    -- Assign to respective lokets
    INSERT INTO public.user_loket_assignment (user_id, loket_id)
    VALUES 
        (user1_id, 1),
        (user2_id, 2),
        (user3_id, 3),
        (user4_id, 4),
        (user5_id, 5)
    ON CONFLICT (user_id, loket_id) DO NOTHING;
END $$;

-- Verify assignments
SELECT 
    u.username,
    u.nama,
    u.role,
    ula.loket_id
FROM users u
LEFT JOIN user_loket_assignment ula ON u.id = ula.user_id
WHERE u.username LIKE 'loket%'
ORDER BY u.username;
