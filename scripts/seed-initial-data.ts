/**
 * Seed Initial Data Script
 *
 * Loads test data from initial-products.json and holidays.json into Supabase
 *
 * Usage:
 *   npm run seed
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import initialProducts from '../src/lib/initial-products.json'
import { INITIAL_HOLIDAYS } from '../src/lib/holidays'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

function transformProduct(product: any, adminUserId: string) {
  const now = new Date().toISOString()
  return {
    id: product.id,
    name: product.name,
    operator: product.operator,
    country: product.country,
    language: product.language,
    start_date: product.startDate,
    end_date: product.endDate,
    productive_url: product.productiveUrl || null,
    vercel_demo_url: product.vercelDemoUrl || null,
    wp_content_prod_url: product.wpContentProdUrl || null,
    wp_content_test_url: product.wpContentTestUrl || null,
    chatbot_url: product.chatbotUrl || null,
    comments: product.comments || null,
    card_color: product.cardColor || '#778899',
    status: product.status,
    created_by_id: adminUserId,
    updated_by_id: adminUserId,
    created_at: product.createdAt || now,
    updated_at: product.updatedAt || now,
  }
}

function transformMilestone(milestone: any, productId: string) {
  const now = new Date().toISOString()
  return {
    id: milestone.id,
    name: milestone.name,
    start_date: milestone.startDate,
    end_date: milestone.endDate,
    status: milestone.status,
    product_id: productId,
    created_at: milestone.createdAt || now,
    updated_at: milestone.updatedAt || now,
  }
}

function transformCustomUrl(customUrl: any, productId: string) {
  return {
    id: customUrl.id,
    label: customUrl.label,
    url: customUrl.url,
    product_id: productId,
  }
}

function transformHoliday(holiday: any) {
  // Parse holiday date (format: "YYYY-MM-DD")
  const date = new Date(holiday.date)
  return {
    id: crypto.randomUUID(),
    name: holiday.name,
    date: date.toISOString(),
  }
}

async function main() {
  console.log('🌱 Seeding initial test data to Supabase...\n')

  // Step 1: Verify admin user exists
  console.log('👤 Step 1: Verifying admin user...')
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'ADMIN')
    .single()

  if (adminError || !adminUser) {
    console.error('   ❌ No admin user found in Supabase!')
    console.log('   Please create an admin user first.')
    console.log('\n   Run this SQL in Supabase SQL Editor:')
    console.log(`
      -- Create auth user
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin@mediamobb.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"ADMIN","first_name":"Admin","last_name":"User"}',
        false
      );

      -- Verify it was created
      SELECT id, email, role FROM users WHERE role = 'ADMIN';
    `)
    process.exit(1)
  }

  console.log(`   ✓ Admin user found: ${adminUser.email} (${adminUser.id})\n`)

  // Step 2: Load holidays
  console.log('🎉 Step 2: Loading holidays...')
  let holidaysLoaded = 0
  let holidaysSkipped = 0

  for (const holiday of INITIAL_HOLIDAYS) {
    const transformed = transformHoliday(holiday)

    const { error } = await supabase
      .from('holidays')
      .upsert(transformed, { onConflict: 'date' })

    if (error) {
      console.error(`   ❌ Error loading holiday ${holiday.name}:`, error.message)
      holidaysSkipped++
    } else {
      holidaysLoaded++
    }
  }

  console.log(`   ✓ Loaded: ${holidaysLoaded}/${INITIAL_HOLIDAYS.length} holidays`)
  if (holidaysSkipped > 0) {
    console.log(`   ⚠️  Skipped: ${holidaysSkipped} holidays (errors)\n`)
  } else {
    console.log('')
  }

  // Step 3: Load products with milestones and custom URLs
  console.log('📦 Step 3: Loading products...')
  let productsLoaded = 0
  let productsSkipped = 0
  let milestonesLoaded = 0
  let customUrlsLoaded = 0

  for (const product of initialProducts) {
    // 3.1: Insert product
    const transformedProduct = transformProduct(product, adminUser.id)

    const { error: productError } = await supabase
      .from('products')
      .upsert(transformedProduct)

    if (productError) {
      console.error(`   ❌ Error loading product ${product.name}:`, productError.message)
      productsSkipped++
      continue
    }

    productsLoaded++

    // 3.2: Insert milestones
    if (product.milestones && product.milestones.length > 0) {
      const transformedMilestones = product.milestones.map((m: any) =>
        transformMilestone(m, product.id)
      )

      const { error: milestonesError } = await supabase
        .from('milestones')
        .upsert(transformedMilestones)

      if (milestonesError) {
        console.error(
          `   ⚠️  Error loading milestones for ${product.name}:`,
          milestonesError.message
        )
      } else {
        milestonesLoaded += transformedMilestones.length
      }
    }

    // 3.3: Insert custom URLs
    if (product.customUrls && product.customUrls.length > 0) {
      const transformedUrls = product.customUrls.map((u: any) =>
        transformCustomUrl(u, product.id)
      )

      const { error: urlsError } = await supabase
        .from('custom_urls')
        .upsert(transformedUrls)

      if (urlsError) {
        console.error(
          `   ⚠️  Error loading custom URLs for ${product.name}:`,
          urlsError.message
        )
      } else {
        customUrlsLoaded += transformedUrls.length
      }
    }
  }

  console.log(`   ✓ Loaded: ${productsLoaded}/${initialProducts.length} products`)
  console.log(`   ✓ Loaded: ${milestonesLoaded} milestones`)
  console.log(`   ✓ Loaded: ${customUrlsLoaded} custom URLs`)
  if (productsSkipped > 0) {
    console.log(`   ⚠️  Skipped: ${productsSkipped} products (errors)\n`)
  } else {
    console.log('')
  }

  // Step 4: Validate seeding
  console.log('✅ Step 4: Validating data...')

  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: milestonesCount } = await supabase
    .from('milestones')
    .select('*', { count: 'exact', head: true })

  const { count: customUrlsCount } = await supabase
    .from('custom_urls')
    .select('*', { count: 'exact', head: true })

  const { count: holidaysCount } = await supabase
    .from('holidays')
    .select('*', { count: 'exact', head: true })

  console.log('\n📊 Final Counts in Supabase:')
  console.log(`   Products: ${productsCount}`)
  console.log(`   Milestones: ${milestonesCount}`)
  console.log(`   Custom URLs: ${customUrlsCount}`)
  console.log(`   Holidays: ${holidaysCount}`)

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n🚀 Next steps:')
  console.log('   1. Open http://localhost:9002')
  console.log('   2. Login with your admin credentials')
  console.log('   3. Explore the products and calendar!')
}

// Run seeding
main()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  })
