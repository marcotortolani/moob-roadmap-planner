/**
 * TypeScript types for Resend email service
 */

export interface SendInvitationEmailParams {
  email: string
  role: 'ADMIN' | 'USER' | 'GUEST'
  inviteLink: string
  inviterName: string
  expiresAt: Date
}

export interface SendWelcomeEmailParams {
  email: string
  firstName: string
  role: 'ADMIN' | 'USER' | 'GUEST'
}

export interface ProductLiveRecipient {
  email: string
  name: string
}

export interface SendProductLiveEmailParams {
  productName: string
  productUrl?: string
  operator: string
  country: string
  language: string
  goLiveDate: Date
  recipients: ProductLiveRecipient[]
}

export interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
  metadata?: Record<string, unknown>
}
