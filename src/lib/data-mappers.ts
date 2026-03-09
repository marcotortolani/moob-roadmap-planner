/**
 * Centralized data transformation layer.
 *
 * Converts Supabase snake_case DB rows into camelCase Product/Milestone types.
 * Having a single source of truth prevents drift between fetchProducts() and
 * fetchProduct() transformations in use-products.ts.
 */

import { parseISO, startOfDay } from 'date-fns'
import type { Product } from './types'

interface DbMilestone {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  product_id: string
}

interface DbCustomUrl {
  id: string
  label: string
  url: string
  product_id: string
}

interface DbUserRef {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
}

export interface DbProduct {
  id: string
  name: string
  operator: string
  country: string
  language: string
  status: string
  start_date: string
  end_date: string
  card_color: string | null
  productive_url: string | null
  vercel_demo_url: string | null
  wp_content_prod_url: string | null
  wp_content_test_url: string | null
  chatbot_url: string | null
  comments: string | null
  created_at: string
  updated_at: string
  created_by_id: string | null
  updated_by_id: string | null
  milestones?: DbMilestone[]
  customUrls?: DbCustomUrl[]
  createdBy?: DbUserRef | null
  updatedBy?: DbUserRef | null
}

const FALLBACK_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84',
]

export function generateRandomColor(): string {
  return FALLBACK_COLORS[Math.floor(Math.random() * FALLBACK_COLORS.length)]
}

export function mapDbMilestone(m: DbMilestone) {
  return {
    id: m.id,
    name: m.name,
    startDate: startOfDay(parseISO(m.start_date)),
    endDate: startOfDay(parseISO(m.end_date)),
    status: m.status,
    productId: m.product_id,
  }
}

export function mapDbUserRef(u: DbUserRef) {
  return {
    id: u.id,
    name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
    email: u.email,
    avatarUrl: u.avatar_url ?? undefined,
  }
}

/**
 * Map a Supabase product row (snake_case) to the app Product type (camelCase).
 * Works for both list queries (no createdBy/updatedBy) and detail queries.
 */
export function mapDbProduct(product: DbProduct): Product {
  return {
    id: product.id,
    name: product.name,
    operator: product.operator,
    country: product.country,
    language: product.language,
    status: product.status as Product['status'],
    startDate: startOfDay(parseISO(product.start_date)),
    endDate: startOfDay(parseISO(product.end_date)),
    cardColor: product.card_color ?? generateRandomColor(),
    productiveUrl: product.productive_url ?? null,
    vercelDemoUrl: product.vercel_demo_url ?? null,
    wpContentProdUrl: product.wp_content_prod_url ?? null,
    wpContentTestUrl: product.wp_content_test_url ?? null,
    chatbotUrl: product.chatbot_url ?? null,
    comments: product.comments ?? null,
    milestones: product.milestones?.map(mapDbMilestone) ?? [],
    customUrls: product.customUrls ?? [],
    createdById: product.created_by_id ?? undefined,
    updatedById: product.updated_by_id ?? undefined,
    createdBy: product.createdBy ? mapDbUserRef(product.createdBy) : undefined,
    updatedBy: product.updatedBy ? mapDbUserRef(product.updatedBy) : undefined,
    createdAt: new Date(product.created_at),
    updatedAt: new Date(product.updated_at),
  } as Product
}
