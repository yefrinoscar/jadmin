# SMTP Email API

This API endpoint allows you to send emails via SMTP using Nodemailer.

## Endpoint

`POST /api/email-smtp`

## Request Body

```json
{
  "to": "recipient@example.com",
  "subject": "Your email subject",
  "html": "<h1>Your HTML content</h1><p>Email body goes here</p>"
}
```

### Parameters

- `to` (required): Recipient email address
- `subject` (required): Email subject line
- `html` (required): HTML content of the email

## Response

### Success Response (200)

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<message-id>",
    "accepted": ["recipient@example.com"],
    "rejected": []
  }
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": "Error message description"
}
```

## Environment Variables

You need to configure the following environment variables in your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com              # Your SMTP server host
SMTP_PORT=587                          # SMTP port (587 for TLS, 465 for SSL)
SMTP_SECURE=false                      # true for 465, false for other ports
SMTP_USER=your-email@gmail.com        # SMTP username (usually your email)
SMTP_PASSWORD=your-app-password       # SMTP password or app-specific password
SMTP_FROM_EMAIL=your-email@gmail.com  # Default sender email (optional, defaults to SMTP_USER)
```

## Example Usage

### Using fetch

```javascript
const response = await fetch('/api/email-smtp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'user@example.com',
    subject: 'Welcome to Our Platform',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h1>Welcome!</h1>
        <p>Thank you for joining our platform.</p>
        <a href="https://example.com" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Get Started
        </a>
      </div>
    `
  })
});

const result = await response.json();
console.log(result);
```

### Using cURL

```bash
curl -X POST http://localhost:3000/api/email-smtp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello World</h1><p>This is a test email.</p>"
  }'
```

## Common SMTP Providers

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Generate at https://myaccount.google.com/apppasswords
```

### Outlook/Office365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
```

## Error Handling

The API handles various error scenarios:

- **Missing required fields**: Returns 400 with error message
- **Invalid email format**: Returns 400 with validation error
- **SMTP configuration issues**: Returns 500 with configuration error
- **Email sending failures**: Returns 500 with detailed error message

## Security Notes

1. Never commit your `.env` file to version control
2. Use app-specific passwords for Gmail (not your main password)
3. Consider rate limiting for production use
4. Validate and sanitize HTML content to prevent XSS attacks
5. Implement authentication/authorization for the API endpoint in production
