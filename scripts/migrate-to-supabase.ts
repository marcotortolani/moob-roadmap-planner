/**
 * Data Migration Script: localStorage → Supabase
 *
 * This script migrates all products, milestones, custom URLs, and holidays
 * from localStorage to Supabase PostgreSQL database.
 *
 * Usage:
 *   npx tsx scripts/migrate-to-supabase.ts
 *
 * Prerequisites:
 *   - Supabase project configured with schema
 *   - Admin user created in Supabase
 *   - .env.local configured with Supabase credentials
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { join } from 'path'

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

// Types matching localStorage structure
interface LocalStorageProduct {
  id: string
  name: string
  operator: string
  country: string
  language: string
  startDate: string // ISO date string
  endDate: string
  productiveUrl?: string
  vercelDemoUrl?: string
  wpContentProdUrl?: string
  wpContentTestUrl?: string
  chatbotUrl?: string
  comments?: string
  cardColor: string
  status: 'PLANNED' | 'IN_PROGRESS' | 'DEMO_OK' | 'LIVE'
  milestones: Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  }>
  customUrls: Array<{
    id: string
    label: string
    url: string
  }>
  createdBy: string
  updatedBy: string
  createdAt: string
  updatedAt: string
}

interface LocalStorageHoliday {
  id: string
  name: string
  date: string
}

// Transform localStorage data to Supabase format
function transformProduct(product: LocalStorageProduct, adminUserId: string) {
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
    card_color: product.cardColor,
    status: product.status,
    created_by_id: adminUserId,
    updated_by_id: adminUserId,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
  }
}

function transformMilestone(milestone: any, productId: string) {
  return {
    id: milestone.id,
    name: milestone.name,
    start_date: milestone.startDate,
    end_date: milestone.endDate,
    status: milestone.status,
    product_id: productId,
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

function transformHoliday(holiday: LocalStorageHoliday) {
  return {
    id: holiday.id,
    name: holiday.name,
    date: holiday.date,
  }
}

async function main() {
  console.log('🚀 Starting data migration from localStorage to Supabase...\n')

  // Step 1: Read data from localStorage (simulate reading from backup)
  console.log('📖 Step 1: Reading localStorage data...')

  // In a real scenario, this would read from localStorage in browser
  // For this script, we assume data is exported to JSON files
  let products: LocalStorageProduct[] = []
  let holidays: LocalStorageHoliday[] = []

  try {
    // Try to load from backup files if they exist
    const productsPath = join(process.cwd(), 'scripts', 'backup-products.json')
    const holidaysPath = join(process.cwd(), 'scripts', 'backup-holidays.json')

    try {
      products = require(productsPath)
      console.log(`   ✓ Loaded ${products.length} products from backup`)
    } catch {
      console.log('   ⚠️  No backup-products.json found - skipping products')
    }

    try {
      holidays = require(holidaysPath)
      console.log(`   ✓ Loaded ${holidays.length} holidays from backup`)
    } catch {
      console.log('   ⚠️  No backup-holidays.json found - skipping holidays')
    }
  } catch (error) {
    console.error('   ❌ Error reading backup files:', error)
    console.log('\n📝 To use this script:')
    console.log('   1. Export your localStorage data to JSON files:')
    console.log('      - scripts/backup-products.json')
    console.log('      - scripts/backup-holidays.json')
    console.log('   2. Run: npx tsx scripts/migrate-to-supabase.ts')
    process.exit(1)
  }

  // Step 2: Create backup before migration
  console.log('\n💾 Step 2: Creating backup...')
  const backupData = {
    timestamp: new Date().toISOString(),
    products,
    holidays,
  }
  const backupPath = join(
    process.cwd(),
    'scripts',
    `backup-${Date.now()}.json`
  )
  writeFileSync(backupPath, JSON.stringify(backupData, null, 2))
  console.log(`   ✓ Backup created: ${backupPath}`)

  // Step 3: Verify admin user exists
  console.log('\n👤 Step 3: Verifying admin user...')
  const { data: adminUser, error: adminError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('role', 'ADMIN')
    .single()

  if (adminError || !adminUser) {
    console.error('   ❌ No admin user found in Supabase!')
    console.log('   Please create an admin user first.')
    console.log('   Run this SQL in Supabase SQL Editor:')
    console.log(`
      -- Create auth user
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
      VALUES (
        gen_random_uuid(),
        'admin@example.com',
        crypt('your-password', gen_salt('bf')),
        now()
      );

      -- The trigger will create the users table record automatically
    `)
    process.exit(1)
  }

  console.log(`   ✓ Admin user found: ${adminUser.email} (${adminUser.id})`)

  // Step 4: Migrate holidays (no dependencies)
  console.log('\n🎉 Step 4: Migrating holidays...')
  let holidaysMigrated = 0
  let holidaysSkipped = 0

  for (const holiday of holidays) {
    const transformed = transformHoliday(holiday)

    const { error } = await supabase
      .from('holidays')
      .upsert(transformed, { onConflict: 'date' })

    if (error) {
      console.error(`   ❌ Error migrating holiday ${holiday.name}:`, error.message)
      holidaysSkipped++
    } else {
      holidaysMigrated++
    }
  }

  console.log(`   ✓ Migrated: ${holidaysMigrated}/${holidays.length} holidays`)
  if (holidaysSkipped > 0) {
    console.log(`   ⚠️  Skipped: ${holidaysSkipped} holidays (errors)`)
  }

  // Step 5: Migrate products with milestones and custom URLs
  console.log('\n📦 Step 5: Migrating products...')
  let productsMigrated = 0
  let productsSkipped = 0
  let milestonesMigrated = 0
  let customUrlsMigrated = 0

  for (const product of products) {
    // 5.1: Insert product
    const transformedProduct = transformProduct(product, adminUser.id)

    const { error: productError } = await supabase
      .from('products')
      .upsert(transformedProduct)

    if (productError) {
      console.error(`   ❌ Error migrating product ${product.name}:`, productError.message)
      productsSkipped++
      continue
    }

    productsMigrated++

    // 5.2: Insert milestones
    if (product.milestones && product.milestones.length > 0) {
      const transformedMilestones = product.milestones.map((m) =>
        transformMilestone(m, product.id)
      )

      const { error: milestonesError } = await supabase
        .from('milestones')
        .upsert(transformedMilestones)

      if (milestonesError) {
        console.error(
          `   ⚠️  Error migrating milestones for ${product.name}:`,
          milestonesError.message
        )
      } else {
        milestonesMigrated += transformedMilestones.length
      }
    }

    // 5.3: Insert custom URLs
    if (product.customUrls && product.customUrls.length > 0) {
      const transformedUrls = product.customUrls.map((u) =>
        transformCustomUrl(u, product.id)
      )

      const { error: urlsError } = await supabase
        .from('custom_urls')
        .upsert(transformedUrls)

      if (urlsError) {
        console.error(
          `   ⚠️  Error migrating custom URLs for ${product.name}:`,
          urlsError.message
        )
      } else {
        customUrlsMigrated += transformedUrls.length
      }
    }
  }

  console.log(`   ✓ Migrated: ${productsMigrated}/${products.length} products`)
  console.log(`   ✓ Migrated: ${milestonesMigrated} milestones`)
  console.log(`   ✓ Migrated: ${customUrlsMigrated} custom URLs`)
  if (productsSkipped > 0) {
    console.log(`   ⚠️  Skipped: ${productsSkipped} products (errors)`)
  }

  // Step 6: Validate migration
  console.log('\n✅ Step 6: Validating migration...')

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

  console.log('\n📊 Final Counts:')
  console.log(`   Products: ${productsCount} (expected: ${productsMigrated})`)
  console.log(`   Milestones: ${milestonesCount} (expected: ${milestonesMigrated})`)
  console.log(`   Custom URLs: ${customUrlsCount} (expected: ${customUrlsMigrated})`)
  console.log(`   Holidays: ${holidaysCount} (expected: ${holidaysMigrated})`)

  // Summary
  console.log('\n🎉 Migration completed successfully!')
  console.log(`\n📝 Backup saved: ${backupPath}`)
  console.log('\n⚠️  Next steps:')
  console.log('   1. Verify data in Supabase Dashboard')
  console.log('   2. Test the app with Supabase data')
  console.log('   3. Update app to use Supabase instead of localStorage')
}

// Run migration
main()
  .then(() => {
    console.log('\n✅ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
