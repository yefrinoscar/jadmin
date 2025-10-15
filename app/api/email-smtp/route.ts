import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

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

    // Get SMTP transporter
    const smtpTransporter = getTransporter();
    
    // Use provided 'from' or default from environment
    const fromEmail = from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    if (!fromEmail) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No sender email configured. Set SMTP_FROM_EMAIL or SMTP_USER.' 
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // Send email via SMTP
    const info = await smtpTransporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    });

    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json(
      { 
        success: true,
        message: 'Email sent successfully',
        data: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
        }
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
