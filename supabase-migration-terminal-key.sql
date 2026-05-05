-- Add terminal_key column to profiles table
-- This stores the user's approved Open Terminal API key

-- Add the column (nullable, encrypted storage recommended in production)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terminal_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.terminal_key IS 'User-approved Open Terminal API key for secure terminal access';

-- Optional: Create index for faster lookups (if needed)
-- CREATE INDEX IF NOT EXISTS idx_profiles_terminal_key ON profiles(terminal_key) WHERE terminal_key IS NOT NULL;

-- Note: In production, consider using Supabase Vault for encrypted storage:
-- https://supabase.com/docs/guides/database/vault
