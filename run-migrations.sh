#!/bin/bash
export PGPASSWORD='kab@jyr0atf4dgv3BJD'
cd /Users/jamiewatters/DevProjects/aimpactscanner-mvp/supabase/migrations

echo "Running migrations..."

psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 003_service_role_policies.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 005_add_missing_columns.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 005_coffee_tier_infrastructure.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 009_phase2_user_tracking.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 010_enable_email_password_auth.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 011_fix_monthly_reset_logic.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 012_add_missing_users.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 013_fix_users_table_schema.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 014_sync_tier_columns.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 015_rename_tiers.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 016_fix_service_role_users_access.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 017_fix_email_verification.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 018_consolidate_user_creation.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 019_diagnostic_helper_functions.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 020_fix_rls_for_signup.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 021_auth_tier_columns.sql
psql -h db.isgzvwpjokcmtizstwru.supabase.co -p 5432 -U postgres -d postgres -f 022_waitlist_table.sql

echo "Migrations complete!"
