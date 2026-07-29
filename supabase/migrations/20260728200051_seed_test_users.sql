/*
# Seed test users

## Overview
Creates 3 test accounts directly in auth.users with bcrypt-hashed
passwords via pgcrypto's crypt() function (blowfish, cost 10).
GoTrue accepts these hashes in encrypted_password.

## 1. Test accounts
| Email              | Password     | Role     |
| creator@vaultstream.dev | creator123 | creator |
| viewer@vaultstream.dev  | viewer123  | viewer  |
| admin@vaultstream.dev   | admin123   | admin   |

## 2. Security
- Idempotent: checks for existing email before inserting.
- email_confirmed_at set so no email verification needed.
- All three get 'authenticated' role.
*/

-- pgcrypto is pre-installed in the 'extensions' schema on Supabase Cloud
-- Use fully-qualified names: extensions.gen_salt() / extensions.crypt()

DO $$
DECLARE
  u record;
  existing_id uuid;
  new_id uuid;
BEGIN
  FOR u IN
    SELECT * FROM (VALUES
      ('creator@vaultstream.dev', extensions.crypt('creator123', extensions.gen_salt('bf', 10)), 'Content Creator', 'creator'),
      ('viewer@vaultstream.dev',  extensions.crypt('viewer123',  extensions.gen_salt('bf', 10)), 'Casual Viewer',  'viewer'),
      ('admin@vaultstream.dev',   extensions.crypt('admin123',   extensions.gen_salt('bf', 10)), 'Platform Admin',  'admin')
    ) AS t(email, enc_pass, name, role)
  LOOP
    -- check if user already exists
    SELECT id INTO existing_id FROM auth.users WHERE email = u.email LIMIT 1;

    IF existing_id IS NULL THEN
      new_id := gen_random_uuid();
      INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        last_sign_in_at
      ) VALUES (
        new_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        u.email,
        u.enc_pass,
        now(),
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object('name', u.name, 'role', u.role),
        now(),
        now(),
        now()
      );

      RAISE NOTICE 'Created user % with id %', u.email, new_id;

      -- GoTrue requires an identity record for email/password login
      INSERT INTO auth.identities (
        id,
        user_id,
        provider_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        new_id,
        new_id::text,
        jsonb_build_object('sub', new_id::text, 'email', u.email),
        'email',
        now(),
        now(),
        now()
      );
    ELSE
      RAISE NOTICE 'User % already exists (id %)', u.email, existing_id;
    END IF;
  END LOOP;
END $$;
