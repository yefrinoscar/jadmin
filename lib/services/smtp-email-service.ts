import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Service for sending emails using SMTP via Nodemailer
 */
export class SmtpEmailService {
  private static transporter: Transporter | null = null;

  /**
   * Creates and configures the SMTP transporter
   */
  private static getTransporter(): Transporter {
    if (!this.transporter) {
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

      this.transporter = nodemailer.createTransport({
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

    return this.transporter;
  }

  /**
   * Sends an email via SMTP
   */
  static async sendEmail({
    to,
    subject,
    html,
    from,
  }: SendEmailParams) {
    try {
      const transporter = this.getTransporter();
      
      // Use provided 'from' or default from environment
      const fromEmail = from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

      if (!fromEmail) {
        throw new Error('No sender email configured. Set SMTP_FROM_EMAIL or SMTP_USER.');
      }

      // Send email
      const info = await transporter.sendMail({
        from: fromEmail,
        to,
        subject,
        html,
      });

      console.log('Email sent successfully:', info.messageId);
      
      return { 
        success: true, 
        data: {
          messageId: info.messageId,
          accepted: info.accepted,
          rejected: info.rejected,
        }
      };
    } catch (error) {
      console.error('Error sending SMTP email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error sending email' 
      };
    }
  }

  /**
   * Verifies SMTP connection
   */
  static async verifyConnection(): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      console.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}
