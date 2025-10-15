# SMTP Email Configuration

Add these variables to your `.env` file to enable SMTP email sending:

```env
# SMTP Server Configuration
SMTP_HOST=smtp.gmail.com              # Your SMTP server host
SMTP_PORT=587                          # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                      # true for 465, false for other ports
SMTP_USER=your-email@gmail.com        # SMTP username (usually your email)
SMTP_PASSWORD=your-app-password       # SMTP password or app-specific password
SMTP_FROM_EMAIL=your-email@gmail.com  # Default sender email (optional, defaults to SMTP_USER)
```

## Quick Setup for Gmail

1. Go to your Google Account settings
2. Enable 2-Step Verification
3. Generate an App Password at: https://myaccount.google.com/apppasswords
4. Use the generated password as `SMTP_PASSWORD`

## Testing the API

After configuring your environment variables, restart your development server and test with:

```bash
curl -X POST http://localhost:3000/api/email-smtp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello!</h1><p>This is a test email via SMTP.</p>"
  }'
```
