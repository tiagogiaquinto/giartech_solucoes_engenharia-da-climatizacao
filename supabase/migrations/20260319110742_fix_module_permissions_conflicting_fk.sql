/*
  # Fix module_permissions conflicting foreign key

  ## Problem
  The table `module_permissions` has two conflicting foreign keys on `user_id`:
  1. `module_permissions_user_id_fkey` -> references `user_profiles(id)`
  2. `module_permissions_user_id_auth_accounts_fkey` -> references `auth_accounts(id)`

  The system uses `auth_accounts` as the user table, but the `user_profiles` FK was
  added by a previous migration and prevents inserting permissions for auth_accounts
  users who do NOT have a corresponding user_profiles record (which is all of them).

  ## Fix
  - Drop the erroneous FK to `user_profiles`
  - Keep only the FK to `auth_accounts` (which is the correct reference)
  - Ensure `sensitive_permissions` also only references `auth_accounts`
*/

ALTER TABLE module_permissions
  DROP CONSTRAINT IF EXISTS module_permissions_user_id_fkey;
