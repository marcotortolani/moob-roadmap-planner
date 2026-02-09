/**
 * Email Preview API Route
 * Allows previewing email templates in the browser without sending them
 *
 * Usage:
 * - http://localhost:9002/api/emails/preview?template=invitation
 * - http://localhost:9002/api/emails/preview?template=welcome
 * - http://localhost:9002/api/emails/preview?template=product-live
 *
 * Note: Uses SendGrid service (which renders React Email templates to HTML)
 */

import { NextRequest, NextResponse } from 'next/server'
import { render } from '@react-email/render'
import { InvitationEmail } from '@/lib/resend/templates/invitation-email'
import { WelcomeEmail } from '@/lib/resend/templates/welcome-email'
import { ProductLiveEmail } from '@/lib/resend/templates/product-live-email'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const template = searchParams.get('template')

    let emailHtml: string

    switch (template) {
      case 'invitation':
        emailHtml = render(
          InvitationEmail({
            email: 'usuario@ejemplo.com',
            role: 'USER',
            inviteLink: 'https://roadmap-planner.com/signup?token=abc123',
            inviterName: 'Juan Pérez',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          })
        )
        break

      case 'welcome':
        emailHtml = render(
          WelcomeEmail({
            email: 'usuario@ejemplo.com',
            firstName: 'María',
            role: 'USER',
          })
        )
        break

      case 'product-live':
        emailHtml = render(
          ProductLiveEmail({
            productName: 'Casino Online España',
            productUrl: 'https://ejemplo.com/casino',
            operator: 'BetClic',
            country: 'España',
            language: 'Español',
            goLiveDate: new Date(),
            recipientName: 'Carlos García',
            recipients: [], // Not used in single preview
          })
        )
        break

      default:
        return NextResponse.json(
          {
            error: 'Template not found',
            available: ['invitation', 'welcome', 'product-live'],
          },
          { status: 400 }
        )
    }

    return new NextResponse(emailHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Email preview error:', error)
    return NextResponse.json(
      { error: 'Failed to render email template' },
      { status: 500 }
    )
  }
}
