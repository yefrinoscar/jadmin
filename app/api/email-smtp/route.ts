import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Resend } from 'resend';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// SMTP Transporter (singleton)
let transporter: Transporter | null = null;

/**
 * Creates and configures the SMTP transporter
 */
function getTransporter(): Transporter {
  if (!transporter) {
    // Get SMTP configuration from environment variables
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpSecure = process.env.SMTP_SECURE === 'true'; // true for 465, false for other ports

    if (!smtpHost || !smtpUser || !smtpPassword) {
      throw new Error(
        'SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.'
      );
    }

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      // Optional: Add these for better debugging
      logger: process.env.NODE_ENV === 'development',
      debug: process.env.NODE_ENV === 'development',
    });
  }

  return transporter;
}

// Manejar preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {

    console.log('SMTP configuration:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    });
  
    // Parse request body
    const body = await req.json();
    const { to, subject, html, from } = body;

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields. Required: to (email), subject, html' 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email format' 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Try SMTP first, fallback to Resend if it fails
    let emailResult;
    let usedMethod = 'SMTP';

    try {
      // Get SMTP transporter
      const smtpTransporter = getTransporter();
      
      // Use provided 'from' or default from environment
      const fromEmail = from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

      if (!fromEmail) {
        throw new Error('No sender email configured for SMTP');
      }

      // Send email via SMTP
      const info = await smtpTransporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      });

      console.log('Email sent successfully via SMTP:', info.messageId);

      emailResult = {
        success: true,
        data: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
        }
      };
    } catch (smtpError) {
      console.warn('SMTP failed, falling back to Resend:', smtpError);
      usedMethod = 'Resend';

      // Fallback to Resend
      try {
        const resendApiKey = process.env.RESEND_API_KEY;
        
        if (!resendApiKey) {
          throw new Error('Both SMTP and Resend are not configured. Please set either SMTP credentials or RESEND_API_KEY.');
        }

        const resend = new Resend(resendApiKey);
        const fromEmail = from || process.env.RESEND_FROM_EMAIL || 'no-reply@dashboard.underla.lat';

        const resendResult = await resend.emails.send({
          from: fromEmail,
          to,
          subject,
          html,
        });

        console.log('Email sent successfully via Resend:', resendResult.data?.id);

        emailResult = {
          success: true,
          data: {
            messageId: resendResult.data?.id,
            provider: 'Resend',
          }
        };
      } catch (resendError) {
        console.error('Both SMTP and Resend failed:', resendError);
        throw new Error(
          `Failed to send email via both SMTP and Resend. SMTP Error: ${smtpError instanceof Error ? smtpError.message : 'Unknown'}. Resend Error: ${resendError instanceof Error ? resendError.message : 'Unknown'}`
        );
      }
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Email sent successfully',
        method: usedMethod,
        data: emailResult.data
      }, 
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error sending SMTP email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
