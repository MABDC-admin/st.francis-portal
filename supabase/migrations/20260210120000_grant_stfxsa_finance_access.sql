-- Migration: Grant STFXSA school access to finance user ivyan@stfxsa.org
-- This ensures the finance user has proper access to STFXSA school data

-- First, get the user ID for ivyan@stfxsa.org
-- Note: This will need to be run after the user is created in the system

-- Get STFXSA school ID
DO $$
DECLARE
    stfxsa_school_id UUID;
    finance_user_id UUID;
BEGIN
    -- Get STFXSA school ID
    SELECT id INTO stfxsa_school_id 
    FROM schools 
    WHERE code = 'STFXSA' AND is_active = true
    LIMIT 1;
    
    -- If STFXSA school exists
    IF stfxsa_school_id IS NOT NULL THEN
        -- Try to get the user ID for ivyan@stfxsa.org
        -- This assumes the user exists in auth.users table
        SELECT id INTO finance_user_id
        FROM auth.users 
        WHERE email = 'ivyan@stfxsa.org'
        LIMIT 1;
        
        -- If user exists, grant school access
        IF finance_user_id IS NOT NULL THEN
            -- Insert or update user_school_access record
            INSERT INTO user_school_access (user_id, school_id, role, is_active)
            VALUES (finance_user_id, stfxsa_school_id, 'finance', true)
            ON CONFLICT (user_id, school_id) 
            DO UPDATE SET 
                role = 'finance',
                is_active = true,
                granted_at = NOW();
                
            RAISE NOTICE 'Granted STFXSA access to finance user ivyan@stfxsa.org';
        ELSE
            RAISE NOTICE 'User ivyan@stfxsa.org not found in auth.users table';
        END IF;
    ELSE
        RAISE NOTICE 'STFXSA school not found in schools table';
    END IF;
END $$;

-- Also ensure the user has finance role in user_roles table
DO $$
DECLARE
    finance_user_id UUID;
BEGIN
    -- Get user ID for ivyan@stfxsa.org
    SELECT id INTO finance_user_id
    FROM auth.users 
    WHERE email = 'ivyan@stfxsa.org'
    LIMIT 1;
    
    -- If user exists, ensure they have finance role
    IF finance_user_id IS NOT NULL THEN
        -- Delete any existing role for this user first
        DELETE FROM user_roles WHERE user_id = finance_user_id;
        
        -- Insert the new finance role
        INSERT INTO user_roles (user_id, role)
        VALUES (finance_user_id, 'finance');
        
        RAISE NOTICE 'Set finance role for user ivyan@stfxsa.org';
    END IF;
END $$;