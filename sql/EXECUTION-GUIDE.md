# SQL Scripts Execution Guide

This guide provides step-by-step instructions for executing the SQL scripts to fix the signup/invitation user creation issue.

---

## Prerequisites

- ✅ Access to Supabase Dashboard
- ✅ SQL Editor permissions
- ✅ Knowledge of affected user's auth_user_id (if applicable)

---

## Quick Start

### Option A: Fix Specific User (Fastest)

If you know a specific user is affected:

1. Open Supabase SQL Editor
2. Copy contents of `sql/repair-orphaned-user.sql`
3. **Replace** the UUID `6590eb51-2a05-4fac-ba85-6e1457df1b17` with the affected user's ID
4. Execute
5. User can now login at `/login`

**Time:** 2 minutes

---

### Option B: Full Diagnostic & Repair (Recommended)

Complete fix for all users:

#### Step 1: Verify System Status (5 min)

```sql
-- Copy and paste contents of: sql/verify-trigger-status.sql
```

**Expected Output:**

| check_type | Result |
|------------|--------|
| TRIGGER STATUS | on_auth_user_created (ENABLED) |
| FUNCTION EXISTS | handle_new_user (security_definer: true) |
| RLS INSERT POLICY | Users can insert with NULL auth.uid() |
| ORPHANED USER CHECK | Shows if user is orphaned |

**What to check:**
- ✅ Trigger exists and is enabled
- ✅ Function exists with `security_definer = true`
- ✅ RLS policy allows INSERT when `auth.uid() IS NULL`
- ✅ Orphaned user is confirmed

**If trigger or function is missing:**
→ Run `sql/fix-signup-complete.sql` first

---

#### Step 2: Repair Specific User (2 min)

```sql
-- Copy and paste contents of: sql/repair-orphaned-user.sql
-- IMPORTANT: Replace the UUID with the actual affected user ID
```

**Expected Output:**
```
status: ✅ USER REPAIRED
id: [25-char cuid]
auth_user_id: 6590eb51-2a05-4fac-ba85-6e1457df1b17
email: user@example.com
role: USER
first_name: John
last_name: Doe
```

**Verification:**
- User should now be able to login at `/login`
- No more PGRST116 errors

---

#### Step 3: Repair All Orphaned Users (5 min)

```sql
-- Copy and paste contents of: sql/repair-all-orphaned-users.sql
```

**Expected Output:**
```
BEFORE REPAIR: orphaned_count = 3
[... INSERT executes ...]
AFTER REPAIR: orphaned_count = 0
✅ REPAIRED USERS:
  - user1@example.com (repaired_at: 2026-02-05 ...)
  - user2@example.com (repaired_at: 2026-02-05 ...)
  - user3@example.com (repaired_at: 2026-02-05 ...)
```

**What this does:**
- Finds ALL auth.users without corresponding public.users records
- Creates public.users records for them using auth metadata
- Uses `ON CONFLICT DO NOTHING` to be idempotent (safe to run multiple times)

---

## Finding the Auth User ID

If you don't know the affected user's auth_user_id:

### Method 1: From Email

```sql
SELECT id, email, created_at
FROM auth.users
WHERE email = 'user@example.com';
```

### Method 2: Find All Orphaned Users

```sql
SELECT
  au.id as auth_user_id,
  au.email,
  au.created_at,
  'ORPHANED' as status
FROM auth.users au
LEFT JOIN public.users u ON au.id::text = u.auth_user_id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;
```

---

## Troubleshooting

### Issue: Script returns 0 rows affected

**Cause:** User already exists in `public.users`

**Solution:** Check if user record exists:
```sql
SELECT * FROM public.users WHERE email = 'user@example.com';
```

If record exists, the issue is something else (not an orphaned user).

---

### Issue: "Permission denied" error

**Cause:** Insufficient SQL Editor permissions

**Solution:**
1. Check you're logged in as admin in Supabase
2. Verify your Supabase role has `USAGE` on schemas
3. Contact Supabase project owner for permissions

---

### Issue: Trigger not found

**Cause:** Trigger was never created or was deleted

**Solution:** Run the comprehensive fix:
```sql
-- Copy and paste contents of: sql/fix-signup-complete.sql
```

This will:
1. Create/recreate the trigger function
2. Create/recreate the trigger
3. Fix the RLS INSERT policy

---

### Issue: User still can't login after repair

**Possible causes:**

1. **User is BLOCKED**
   ```sql
   SELECT role FROM public.users WHERE email = 'user@example.com';
   -- If role = 'BLOCKED', user cannot login
   ```

2. **Wrong password**
   - User needs to use "Forgot password" flow
   - Or admin can delete and resend invitation

3. **Email not confirmed**
   ```sql
   SELECT email_confirmed_at FROM auth.users WHERE email = 'user@example.com';
   -- If NULL, email not confirmed (but shouldn't block login)
   ```

---

## Post-Execution Verification

### Verify Specific User

```sql
SELECT
  u.id as public_user_id,
  u.auth_user_id,
  u.email,
  u.role,
  u.first_name,
  u.last_name,
  u.created_at,
  u.updated_at,
  CASE
    WHEN u.updated_at > u.created_at + interval '1 minute' THEN 'REPAIRED'
    ELSE 'ORIGINAL'
  END as record_status
FROM public.users u
WHERE u.email = 'user@example.com';
```

### Verify No Orphans Remain

```sql
SELECT count(*) as orphaned_count
FROM auth.users au
LEFT JOIN public.users u ON au.id::text = u.auth_user_id
WHERE u.id IS NULL;
-- Should return: 0
```

### Test Login

1. Go to `/login`
2. Enter user credentials
3. Should successfully login and redirect to `/`

---

## Monitoring for Future Issues

### Daily Health Check

Run this query to monitor for new orphaned users:

```sql
-- Check for orphans created in last 24 hours
SELECT
  au.id,
  au.email,
  au.created_at,
  'ORPHANED - NEW' as status
FROM auth.users au
LEFT JOIN public.users u ON au.id::text = u.auth_user_id
WHERE u.id IS NULL
  AND au.created_at > now() - interval '24 hours'
ORDER BY au.created_at DESC;
```

**Expected:** 0 rows (if retry logic is working)

**If rows found:**
- Check Supabase logs for trigger errors
- Check if trigger is still enabled
- Consider increasing retry delays in frontend

---

## Emergency Rollback

If repairs cause issues:

### Delete Repaired Records

```sql
-- Show recently repaired users
SELECT * FROM public.users
WHERE updated_at > created_at + interval '1 minute'
  AND created_at < now() - interval '1 hour'
ORDER BY updated_at DESC;

-- Delete specific repaired user (CAUTION)
DELETE FROM public.users
WHERE email = 'user@example.com'
  AND updated_at > created_at + interval '1 minute';
```

**Note:** This will make them orphaned again. Only use if repair caused data corruption.

---

## Script Execution Checklist

Use this checklist when executing the fix:

- [ ] **Backup Check**: Verify Supabase has automatic backups enabled
- [ ] **Step 1**: Run `verify-trigger-status.sql` and review output
- [ ] **Step 2**: Confirm orphaned user(s) identified
- [ ] **Step 3**: Run `repair-orphaned-user.sql` for specific user OR
- [ ] **Step 3 Alt**: Run `repair-all-orphaned-users.sql` for all users
- [ ] **Step 4**: Verify repair with post-execution queries
- [ ] **Step 5**: Test login with affected user account
- [ ] **Step 6**: Monitor for new orphans over next 24 hours
- [ ] **Documentation**: Update internal docs with any findings

---

## Getting Help

If you encounter issues not covered in this guide:

1. **Check Supabase Logs**
   - Dashboard → Database → Logs
   - Look for trigger execution errors

2. **Review Implementation Summary**
   - `sql/IMPLEMENTATION-SUMMARY.md`
   - Contains full technical details

3. **Check Browser Console**
   - During signup, look for retry messages
   - `⏳ Retrying...` indicates trigger latency
   - `❌ User record not found after all retries` indicates trigger failure

4. **Contact Development Team**
   - Provide: User email, auth_user_id, timestamp, browser console logs
   - Include: Supabase logs for the time period
   - Attach: Results of `verify-trigger-status.sql`

---

## Success Indicators

You'll know the fix worked when:

- ✅ `verify-trigger-status.sql` shows all systems operational
- ✅ Repair scripts create `public.users` records successfully
- ✅ Affected users can login without errors
- ✅ New signups work without PGRST116 errors
- ✅ Browser console shows retry logic working (if needed)
- ✅ No new orphaned users appear in monitoring queries

---

**Last Updated:** February 5, 2026
**Version:** 1.0
**Related Files:**
- `sql/verify-trigger-status.sql`
- `sql/repair-orphaned-user.sql`
- `sql/repair-all-orphaned-users.sql`
- `sql/fix-signup-complete.sql`
- `sql/IMPLEMENTATION-SUMMARY.md`
