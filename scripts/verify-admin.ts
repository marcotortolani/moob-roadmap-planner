#!/usr/bin/env tsx

import { config } from 'dotenv'
import { join } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load .env.local file
config({ path: join(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing Supabase environment variables')
  console.error('   Please ensure .env.local contains:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('🔍 Verifying admin user in Supabase...\n')

  // Check if admin user exists in users table
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('id, email, role, auth_user_id')
    .eq('role', 'ADMIN')
    .maybeSingle()

  if (adminError) {
    console.error('   ❌ Error checking admin user:', adminError)
    process.exit(1)
  }

  if (!adminUser) {
    console.log('   ⚠️  No admin user found in users table\n')
    console.log('   📝 To create an admin user, follow these steps:\n')
    console.log('   1. Go to Supabase Dashboard → Authentication → Users')
    console.log('   2. Click "Add User" and create with email: admin@example.com')
    console.log('   3. Then run this SQL in Supabase SQL Editor:\n')
    console.log(`
      -- Update the user's role to ADMIN
      UPDATE users
      SET role = 'ADMIN'
      WHERE email = 'admin@example.com';
    `)
    process.exit(1)
  }

  console.log('   ✅ Admin user found!\n')
  console.log(`   Email: ${adminUser.email}`)
  console.log(`   Role: ${adminUser.role}`)
  console.log(`   ID: ${adminUser.id}`)
  console.log(`   Auth User ID: ${adminUser.auth_user_id}\n`)

  // Check if the auth user exists
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
    adminUser.auth_user_id
  )

  if (authError || !authUser) {
    console.log('   ⚠️  Warning: Auth user not found for this admin user')
    console.log('   The admin user exists in the users table but not in auth.users')
    console.log('   This user will not be able to log in.\n')
  } else {
    console.log('   ✅ Auth user is valid and can log in')
    console.log(`   Auth Email: ${authUser.user.email}\n`)
  }

  // List all users with their roles
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('email, role')
    .order('email')

  if (usersError) {
    console.error('   ❌ Error fetching users:', usersError)
  } else {
    console.log('   📋 All users in database:')
    allUsers?.forEach((u) => {
      console.log(`      - ${u.email} (${u.role})`)
    })
  }
}

main()
  .then(() => {
    console.log('\n✅ Verification complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
