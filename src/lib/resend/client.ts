/**
 * Resend client singleton
 * Initializes and exports a reusable Resend client instance
 */

import { Resend } from 'resend'

let resendClient: Resend | null = null

/**
 * Get or create the Resend client instance
 * Uses singleton pattern to reuse the same connection
 */
export function getResendClient(): Resend {
  if (resendClient) {
    return resendClient
  }

  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not defined in environment variables. ' +
      'Please add it to .env.local for development or Vercel environment variables for production.'
    )
  }

  resendClient = new Resend(apiKey)
  return resendClient
}

/**
 * Verify that the Resend client can be initialized
 * Useful for debugging and health checks
 */
export function verifyResendClient(): { success: boolean; error?: string } {
  try {
    getResendClient()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
