/**
 * SendGrid email service
 * Provides functions to send different types of emails using SendGrid
 */

import * as React from 'react'
import { render } from '@react-email/render'
import { getSendGridClient } from './client'
import {
  EmailResult,
  SendInvitationEmailParams,
  SendWelcomeEmailParams,
  SendProductLiveEmailParams,
} from '../resend/types' // Reusing same types
import { InvitationEmail } from '../resend/templates/invitation-email'
import { WelcomeEmail } from '../resend/templates/welcome-email'
import { ProductLiveEmail } from '../resend/templates/product-live-email'

// Email configuration
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'noreply@example.com'
const REPLY_TO = process.env.SENDGRID_REPLY_TO || process.env.RESEND_REPLY_TO || 'support@example.com'

/**
 * Helper function to delay execution
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Send invitation email with signup link
 */
export async function sendInvitationEmail(
  params: SendInvitationEmailParams
): Promise<EmailResult> {
  try {
    const sendgrid = getSendGridClient()

    // Render React Email template to HTML using JSX
    // In @react-email/render v2.x, render() returns a Promise
    const html = await render(<InvitationEmail {...params} />, {
      pretty: false,
    })

    console.log('🔍 [SendGrid] Rendered HTML type:', typeof html)
    console.log('🔍 [SendGrid] HTML length:', html?.length || 0)
    console.log('🔍 [SendGrid] HTML preview:', typeof html === 'string' ? html.substring(0, 100) : 'NOT A STRING')

    const msg = {
      to: params.email,
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      subject: `Invitación a Roadmap Planner - Rol: ${params.role}`,
      html,
    }

    const [response] = await sendgrid.send(msg)

    console.log('✅ [Email] invitation to', params.email, {
      success: true,
      statusCode: response.statusCode,
    })

    return {
      success: true,
      emailId: response.headers['x-message-id'] as string,
      metadata: { role: params.role },
    }
  } catch (error: any) {
    const errorMessage = error?.response?.body?.errors?.[0]?.message || error.message || 'Unknown error'
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
  params: SendWelcomeEmailParams
): Promise<EmailResult> {
  try {
    const sendgrid = getSendGridClient()

    // Render React Email template to HTML using JSX
    // In @react-email/render v2.x, render() returns a Promise
    const html = await render(<WelcomeEmail {...params} />, {
      pretty: false,
    })

    const msg = {
      to: params.email,
      from: FROM_EMAIL,
      replyTo: REPLY_TO,
      subject: '¡Bienvenido a Roadmap Planner!',
      html,
    }

    const [response] = await sendgrid.send(msg)

    console.log('✅ [Email] welcome to', params.email, {
      success: true,
      statusCode: response.statusCode,
    })

    return {
      success: true,
      emailId: response.headers['x-message-id'] as string,
      metadata: { firstName: params.firstName, role: params.role },
    }
  } catch (error: any) {
    const errorMessage = error?.response?.body?.errors?.[0]?.message || error.message || 'Unknown error'
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
 * Send product LIVE notification to all active users
 * Sends emails sequentially with delay to respect rate limits
 */
export async function sendProductLiveEmail(
  params: SendProductLiveEmailParams
): Promise<EmailResult> {
  try {
    const sendgrid = getSendGridClient()

    const results: Array<{ success: boolean; email: string; emailId?: string; error?: string }> = []

    // Send to recipients sequentially with 100ms delay between each
    // SendGrid free tier: 100 req/sec (much more generous than Resend)
    for (let i = 0; i < params.recipients.length; i++) {
      const recipient = params.recipients[i]

      // Add small delay between emails (except for the first email)
      if (i > 0) {
        await delay(100) // 100ms = 0.1 seconds
      }

      try {
        // Render React Email template to HTML using JSX
        // In @react-email/render v2.x, render() returns a Promise
        const html = await render(
          <ProductLiveEmail
            {...params}
            recipientName={recipient.name}
          />,
          {
            pretty: false,
          }
        )

        const msg = {
          to: recipient.email,
          from: FROM_EMAIL,
          replyTo: REPLY_TO,
          subject: `🚀 Producto en Producción: ${params.productName}`,
          html,
        }

        const [response] = await sendgrid.send(msg)

        console.log('✅ [Email] product-live to', recipient.email, {
          success: true,
          statusCode: response.statusCode,
        })
        results.push({
          success: true,
          email: recipient.email,
          emailId: response.headers['x-message-id'] as string,
        })
      } catch (error: any) {
        const errorMessage = error?.response?.body?.errors?.[0]?.message || error.message || 'Unknown error'
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
      `📊 [Email] product-live batch complete: ${successful} successful, ${failed} failed`
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
  } catch (error: any) {
    const errorMessage = error?.response?.body?.errors?.[0]?.message || error.message || 'Unknown error'
    console.error('❌ [Email] product-live batch failed:', errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}
