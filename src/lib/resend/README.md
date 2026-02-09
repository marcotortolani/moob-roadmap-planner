# Resend Email Integration

This directory contains the Resend email service integration for Roadmap Planner. It provides automated email notifications for invitations, welcome messages, and product launches.

## Overview

The integration sends three types of emails:

1. **Invitation Emails**: Sent when an admin creates an invitation with a signup link
2. **Welcome Emails**: Sent after a user successfully completes signup
3. **Product LIVE Notifications**: Sent to all active users when a product changes to LIVE status

All emails use a consistent neobrutalism design that matches the application's visual identity.

## Directory Structure

```
src/lib/resend/
├── client.ts              # Resend client singleton
├── service.ts             # Email sending functions
├── types.ts               # TypeScript interfaces
└── templates/             # React Email templates
    ├── components/
    │   └── email-layout.tsx       # Base layout with header/footer
    ├── invitation-email.tsx       # Invitation template
    ├── welcome-email.tsx          # Welcome template
    └── product-live-email.tsx     # Product LIVE template
```

## Setup

### 1. Install Dependencies

```bash
npm install resend @react-email/components
```

### 2. Get Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Go to [API Keys](https://resend.com/api-keys)
3. Create a new API key

### 3. Configure Environment Variables

Add to `.env.local`:

```bash
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_REPLY_TO=marco-ext@memoob.com
```

**Important**: For production, verify your domain in Resend dashboard. For development, use `onboarding@resend.dev`.

### 4. Verify Domain (Production Only)

1. Go to [Resend Domains](https://resend.com/domains)
2. Add your domain (e.g., `moob-roadmap.com`)
3. Add DNS records (SPF, DKIM, DMARC)
4. Wait for verification (1-24 hours)

## Usage

### Sending Invitation Email

```typescript
import { sendInvitationEmail } from '@/lib/resend/service'

const result = await sendInvitationEmail({
  email: 'user@example.com',
  role: 'USER',
  inviteLink: 'https://app.com/signup?token=abc123',
  inviterName: 'Juan Pérez',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
})

if (result.success) {
  console.log('Email sent:', result.emailId)
} else {
  console.error('Email failed:', result.error)
}
```

### Sending Welcome Email

```typescript
import { sendWelcomeEmail } from '@/lib/resend/service'

const result = await sendWelcomeEmail({
  email: 'user@example.com',
  firstName: 'María',
  role: 'USER',
})
```

### Sending Product LIVE Email

```typescript
import { sendProductLiveEmail } from '@/lib/resend/service'

const result = await sendProductLiveEmail({
  productName: 'Casino Online España',
  productUrl: 'https://ejemplo.com/casino',
  operator: 'BetClic',
  country: 'España',
  language: 'Español',
  goLiveDate: new Date(),
  recipients: [
    { email: 'user1@example.com', name: 'User 1' },
    { email: 'user2@example.com', name: 'User 2' },
  ],
})
```

## Email Templates Preview

You can preview email templates in your browser during development:

```bash
npm run dev
```

Then visit:

- http://localhost:9002/api/emails/preview?template=invitation
- http://localhost:9002/api/emails/preview?template=welcome
- http://localhost:9002/api/emails/preview?template=product-live

This helps you see how emails will look before sending them.

## Integration Points

The email service is integrated at three critical points in the application:

### 1. Invitation Creation

**File**: `src/lib/email/send-invitation.ts`
**Trigger**: When an admin creates a new invitation
**Email**: Invitation email with signup link

```typescript
// After creating invitation in database (line 84+)
const emailResult = await sendInvitationEmail({
  email,
  role,
  inviteLink,
  inviterName,
  expiresAt,
})
```

### 2. User Signup

**File**: `src/context/auth-context.tsx`
**Trigger**: After a user successfully completes signup
**Email**: Welcome email with app overview

```typescript
// After user record is created (line 240+)
sendWelcomeEmail({
  email,
  firstName: metadata.firstName,
  role: metadata.role as 'ADMIN' | 'USER' | 'GUEST',
}).catch((error) => {
  console.error('❌ Failed to send welcome email:', error)
})
```

### 3. Product Goes LIVE

**File**: `src/hooks/queries/use-products.ts`
**Trigger**: When a product status changes to LIVE
**Email**: Product LIVE notification to all active users

```typescript
// In useUpdateProduct onSuccess callback (line 415+)
if (statusChangedToLive) {
  const users = await fetchActiveUsers()
  sendProductLiveEmail({
    productName: data.name,
    productUrl: data.productiveUrl,
    operator: data.operator,
    country: data.country,
    language: data.language,
    goLiveDate: new Date(),
    recipients: users,
  })
}
```

## Fire-and-Forget Pattern

All email sending operations use the **fire-and-forget** pattern:

```typescript
// ❌ BAD - blocks operation if email fails
await sendEmail()

// ✅ GOOD - doesn't block
sendEmail().catch((error) => console.error('Email failed:', error))
```

This ensures that:

- Invitation creation succeeds even if email fails (admin can share link manually)
- User signup succeeds even if welcome email fails
- Product update succeeds even if notification emails fail

## Error Handling

All email functions return an `EmailResult` object:

```typescript
interface EmailResult {
  success: boolean
  emailId?: string // Resend email ID for tracking
  error?: string // Error message if failed
  metadata?: Record<string, unknown> // Additional data
}
```

Errors are logged with emojis for easy debugging:

- ✅ `[Email] invitation to user@example.com { success: true, emailId: 'abc123' }`
- ❌ `[Email] welcome to user2@example.com { success: false, error: 'Rate limit exceeded' }`

## Resend Quota

**Free Tier Limits**:

- 100 emails/day
- 3000 emails/month

**Estimated Usage** (5-6 internal users):

- Invitations: ~2/month
- Welcome emails: ~2/month
- Product LIVE: ~10 products/month × 6 users = 60/month
- **Total**: ~65 emails/month → Well within limits

Monitor usage at: https://resend.com/overview

## Testing

### Local Testing

1. Start dev server: `npm run dev`
2. Use Resend test mode (emails only sent to verified addresses)
3. Preview templates: http://localhost:9002/api/emails/preview?template=invitation

### End-to-End Testing

**Invitation Email**:

1. Create invitation from `/invitations` page
2. Check logs for `✅ [Email] invitation to...`
3. Verify email received in inbox
4. Test link functionality

**Welcome Email**:

1. Complete signup with invitation token
2. Check logs for `✅ [Email] welcome to...`
3. Verify email received within 30 seconds

**Product LIVE Email**:

1. Edit a product
2. Change status to LIVE
3. Check logs for `🚀 Product status changed to LIVE...`
4. Verify all active users received email

## Troubleshooting

### Email not sending

1. Check `RESEND_API_KEY` in environment variables
2. Verify API key is valid in [Resend dashboard](https://resend.com/api-keys)
3. Check server logs for error messages
4. Verify domain is verified (production only)

### Email going to spam

1. Verify domain DNS records (SPF, DKIM, DMARC)
2. Check Resend deliverability insights
3. Avoid spam trigger words in subject/content
4. Ensure "from" email matches verified domain

### Rate limit exceeded

1. Check usage in Resend dashboard
2. Upgrade to Pro plan ($20/month, 50k emails) if needed
3. Reduce recipients for product LIVE notifications (e.g., only admins)

### Template not rendering

1. Check email preview API: http://localhost:9002/api/emails/preview
2. Verify all React Email components are imported correctly
3. Check browser console for React errors

## Monitoring

Check Resend dashboard regularly:

- **Emails**: https://resend.com/emails
- **Deliverability**: Delivery rate, bounce rate, spam rate
- **Quota**: Usage vs. limits
- **Logs**: Detailed logs for each email sent

## Future Improvements

1. **Email Preferences**: Allow users to opt-out of product LIVE notifications
2. **Digest Mode**: Send daily/weekly summaries instead of real-time
3. **Rich Content**: Add product screenshots to emails
4. **Email Logs**: Store email history in database for auditing
5. **Unsubscribe Links**: Add GDPR-compliant unsubscribe options
6. **Unified SMTP**: Configure Resend as SMTP provider in Supabase for password reset emails

## Support

For issues or questions:

- Resend Documentation: https://resend.com/docs
- React Email Documentation: https://react.email/docs
- Internal support: marco-ext@memoob.com
