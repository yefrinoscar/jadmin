# Email Setup with Resend

This document explains how to set up email functionality for sending user access credentials.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Resend API key - get this from https://resend.com
RESEND_API_KEY=your_resend_api_key_here

# Default sender email address
RESEND_FROM_EMAIL=your-email@yourdomain.com

# Company name used in emails
COMPANY_NAME=JAdmin

# App URL for login links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting a Resend API Key

1. Sign up at [Resend](https://resend.com)
2. Verify your domain or use a free testing domain
3. Create an API key from the dashboard
4. Add the API key to your `.env.local` file

## Testing Email Functionality

You can test the email functionality by:

1. Creating a new user with a password
2. Using the "Show & Share Access" button in the user management interface
3. Clicking "Send Email" to send the access credentials

## Email Templates

The email templates are React components located in:
- `components/emails/UserAccessEmail.tsx`

You can customize the design and content of these templates as needed.
