/**
 * SendGrid client singleton
 * Initializes and exports a reusable SendGrid client instance
 */

import sendgrid from '@sendgrid/mail'

let isInitialized = false

/**
 * Initialize and get the SendGrid client
 * Uses singleton pattern to initialize once
 */
export function getSendGridClient() {
  if (!isInitialized) {
    const apiKey = process.env.SENDGRID_API_KEY

    if (!apiKey) {
      throw new Error(
        'SENDGRID_API_KEY is not defined in environment variables. ' +
        'Please add it to .env.local for development or Vercel environment variables for production.'
      )
    }

    sendgrid.setApiKey(apiKey)
    isInitialized = true
  }

  return sendgrid
}

/**
 * Verify that the SendGrid client can be initialized
 * Useful for debugging and health checks
 */
export function verifySendGridClient(): { success: boolean; error?: string } {
  try {
    getSendGridClient()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
