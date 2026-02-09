/**
 * Resend email service
 * Provides functions to send different types of emails
 */

import { getResendClient } from './client'
import {
  EmailResult,
  SendInvitationEmailParams,
  SendWelcomeEmailParams,
  SendProductLiveEmailParams,
} from './types'
import { InvitationEmail } from './templates/invitation-email'
import { WelcomeEmail } from './templates/welcome-email'
import { ProductLiveEmail } from './templates/product-live-email'

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
const REPLY_TO = process.env.RESEND_REPLY_TO || 'marco-ext@memoob.com'

/**
 * Send invitation email with signup link
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams,
): Promise<EmailResult> {
  try {
    const resend = getResendClient()

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      replyTo: REPLY_TO,
      subject: `Invitación a Roadmap Planner - Rol: ${params.role}`,
      react: InvitationEmail(params),
    })

    if (error) {
      console.error('❌ [Email] invitation to', params.email, {
        success: false,
        error: error.message,
      })
      return {
        success: false,
        error: error.message,
      }
    }

    console.log('✅ [Email] invitation to', params.email, {
      success: true,
      emailId: data?.id,
    })

    return {
      success: true,
      emailId: data?.id,
      metadata: { role: params.role },
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [Email] invitation to', params.email, {
      success: false,
      error: errorMessage,
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Send welcome email after successful signup
 */
export async function sendWelcomeEmail(
  params: SendWelcomeEmailParams,
): Promise<EmailResult> {
  try {
    const resend = getResendClient()

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.email,
      replyTo: REPLY_TO,
      subject: '¡Bienvenido a Roadmap Planner!',
      react: WelcomeEmail(params),
    })

    if (error) {
      console.error('❌ [Email] welcome to', params.email, {
        success: false,
        error: error.message,
      })
      return {
        success: false,
        error: error.message,
      }
    }

    console.log('✅ [Email] welcome to', params.email, {
      success: true,
      emailId: data?.id,
    })

    return {
      success: true,
      emailId: data?.id,
      metadata: { firstName: params.firstName, role: params.role },
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [Email] welcome to', params.email, {
      success: false,
      error: errorMessage,
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Helper function to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Send product LIVE notification to all active users
 * Sends emails sequentially with delay to respect Resend rate limits (2 requests/second)
 */
export async function sendProductLiveEmail(
  params: SendProductLiveEmailParams,
): Promise<EmailResult> {
  try {
    const resend = getResendClient()

    const results: Array<{ success: boolean; email: string; emailId?: string; error?: string }> = []

    // Send to recipients sequentially with 600ms delay between each (1.67 emails/sec < 2/sec limit)
    for (let i = 0; i < params.recipients.length; i++) {
      const recipient = params.recipients[i]

      // Add delay before sending (except for the first email)
      if (i > 0) {
        await delay(600) // 600ms = 0.6 seconds
      }

      try {
        const { data, error } = await resend.emails.send({
          from: FROM_EMAIL,
          to: recipient.email,
          replyTo: REPLY_TO,
          subject: `🚀 Producto en Producción: ${params.productName}`,
          react: ProductLiveEmail({
            ...params,
            recipientName: recipient.name,
          }),
        })

        if (error) {
          console.error('❌ [Email] product-live to', recipient.email, {
            success: false,
            error: error.message,
          })
          results.push({ success: false, email: recipient.email, error: error.message })
        } else {
          console.log('✅ [Email] product-live to', recipient.email, {
            success: true,
            emailId: data?.id,
          })
          results.push({ success: true, email: recipient.email, emailId: data?.id })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('❌ [Email] product-live to', recipient.email, {
          success: false,
          error: errorMessage,
        })
        results.push({ success: false, email: recipient.email, error: errorMessage })
      }
    }

    // Count successes and failures
    const successful = results.filter(r => r.success).length
    const failed = results.length - successful

    console.log(
      `📊 [Email] product-live batch complete: ${successful} successful, ${failed} failed`,
    )

    return {
      success: successful > 0, // At least one email sent successfully
      metadata: {
        productName: params.productName,
        totalRecipients: params.recipients.length,
        successful,
        failed,
      },
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ [Email] product-live batch failed:', errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
