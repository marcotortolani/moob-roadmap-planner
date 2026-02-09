# Quick Start: Resend Email Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your Resend API Key

1. Go to [resend.com/signup](https://resend.com/signup)
2. Create an account (free tier: 100 emails/day, 3000/month)
3. Navigate to [API Keys](https://resend.com/api-keys)
4. Click "Create API Key"
5. Copy the key (starts with `re_`)

### Step 2: Add API Key to Your Project

Open `.env.local` and replace the placeholder:

```bash
# Find this line:
RESEND_API_KEY=your_resend_api_key_here

# Replace with your actual key:
RESEND_API_KEY=re_AbCdEf123456789
```

### Step 3: Test It Works

Start the dev server:

```bash
npm run dev
```

Open your browser and preview the email templates:

- **Invitation Email**: http://localhost:9002/api/emails/preview?template=invitation
- **Welcome Email**: http://localhost:9002/api/emails/preview?template=welcome
- **Product LIVE Email**: http://localhost:9002/api/emails/preview?template=product-live

If you see styled emails, you're ready! 🎉

### Step 4: Test End-to-End

#### Test Invitation Email

1. Login as admin
2. Go to `/invitations` page
3. Create a new invitation with your email
4. Check your inbox (may take 10-30 seconds)
5. Click the signup link in the email

#### Test Welcome Email

1. Complete the signup from the invitation link
2. Check your inbox for the welcome email
3. Verify it arrives within 30 seconds

#### Test Product LIVE Email

1. Go to the main page
2. Edit any product
3. Change status to "LIVE"
4. Check your inbox (all active users receive notification)

### Step 5: Deploy to Production

#### Vercel (Recommended)

1. Push code to GitHub:

```bash
git add .
git commit -m "feat: add Resend email integration"
git push
```

2. In Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add: `RESEND_API_KEY` = `re_your_key`
   - Add: `RESEND_FROM_EMAIL` = `onboarding@resend.dev` (for now)
   - Add: `RESEND_REPLY_TO` = `marco-ext@memoob.com`

3. Redeploy the project

#### Verify Your Domain (Production Only)

For production emails from your own domain:

1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain: `moob-roadmap.com`
4. Copy the DNS records (SPF, DKIM, DMARC)
5. Add them to your DNS provider
6. Wait for verification (1-24 hours)
7. Update `.env.local`:

```bash
RESEND_FROM_EMAIL=onboarding@moob-roadmap.com
```

---

## 📊 What You Get

### 1. Invitation Emails

**When:** Admin creates invitation from `/invitations`

**Content:**

- Personalized greeting from inviter
- Assigned role (Admin/User/Guest)
- Brief app description
- Big "Complete Registration" button
- Expiration warning (7 days)

**Design:** Neobrutalism style matching the app

### 2. Welcome Emails

**When:** User completes signup

**Content:**

- Personalized greeting with first name
- Assigned role confirmation
- 4 key features overview (with icons)
- "Go to Roadmap Planner" button
- Support contact info

**Design:** Neobrutalism style with feature boxes

### 3. Product LIVE Notifications

**When:** Product status changes to LIVE

**Recipients:** All active users (except BLOCKED role)

**Content:**

- 🚀 Celebration heading
- Product details table (operator, country, language, date)
- "View Product in Production" button (if URL exists)
- Automatic email notice

**Design:** Neobrutalism style with bordered table

---

## 🔍 Troubleshooting

### "Email not received"

1. **Check spam folder** - First time emails often land in spam
2. **Check server logs** - Look for `✅` or `❌` emoji with email status
3. **Verify API key** - Ensure it's correctly set in `.env.local`
4. **Check Resend dashboard** - Go to [resend.com/emails](https://resend.com/emails) to see sent emails

### "Build fails with node:stream error"

✅ **Already fixed!** Resend is now only imported in API routes (server-side).

If you see this error:

- Make sure you're NOT importing from `@/lib/resend/service` in client components
- Use API routes (`/api/emails/send-*`) instead

### "Rate limit exceeded"

Free tier: 100 emails/day, 3000/month

If you hit the limit:

- Check usage in [Resend dashboard](https://resend.com/overview)
- Upgrade to Pro ($20/month, 50k emails)
- Reduce product LIVE recipients (notify only admins)

### "Domain not verified"

For development:

- ✅ Use `onboarding@resend.dev` (no verification needed)

For production:

- Add DNS records in your domain provider
- Wait 1-24 hours for verification
- Check status in [Resend Domains](https://resend.com/domains)

---

## 📚 Full Documentation

For detailed information, see:

- **Integration Summary**: `RESEND-INTEGRATION.md`
- **Resend Service README**: `src/lib/resend/README.md`
- **Resend Docs**: https://resend.com/docs
- **React Email Docs**: https://react.email/docs

---

## 💡 Quick Tips

### Preview Templates Before Sending

Visit http://localhost:9002/api/emails/preview?template=X (where X = invitation, welcome, or product-live)

### Monitor Email Delivery

Check [Resend Dashboard](https://resend.com/emails) for:

- Sent/delivered/bounced status
- Delivery rate
- Spam rate
- Error logs

### Fire-and-Forget Pattern

All emails use async fire-and-forget, so:

- ✅ Invitation created even if email fails
- ✅ Signup succeeds even if welcome email fails
- ✅ Product update succeeds even if notification fails

This ensures core operations never fail due to email issues.

### Test Safely

Use your own email for testing:

- Create invitation with your email
- Complete signup
- Change product to LIVE

All emails are sent only when actual events happen in the app.

---

## ✅ Success Checklist

- [ ] API key added to `.env.local`
- [ ] Dev server running (`npm run dev`)
- [ ] Email preview works (http://localhost:9002/api/emails/preview?template=invitation)
- [ ] Invitation email received in inbox
- [ ] Welcome email received after signup
- [ ] Product LIVE email received when product changes to LIVE
- [ ] Environment variables added to Vercel
- [ ] Production deployment successful

---

## 🆘 Need Help?

- **Resend Support**: [resend.com/support](https://resend.com/support)
- **Internal Support**: marco-ext@memoob.com
- **GitHub Issues**: Check for similar issues in Next.js/Resend repos

---

**You're all set!** 🎉 Emails will now be sent automatically for invitations, signups, and product launches.
