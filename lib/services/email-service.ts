import { createResendClient, DEFAULT_FROM_EMAIL } from '../utils/resend-client';
import UserAccessEmail from '../../components/emails/UserAccessEmail';
import { ReactElement } from 'react';

interface SendUserAccessEmailParams {
  to: string;
  email: string;
  password: string;
  loginUrl: string;
  companyName?: string;
  clientName?: string;
}

/**
 * Service for sending emails using Resend
 */
export class EmailService {
  /**
   * Sends a user access email with login credentials
   */
  static async sendUserAccessEmail({
    to,
    email,
    password,
    loginUrl,
    companyName,
    clientName,
  }: SendUserAccessEmailParams) {
    try {
      const resend = createResendClient();
      
      const result = await resend.emails.send({
        from: DEFAULT_FROM_EMAIL,
        to,
        subject: `Your ${companyName || 'JAdmin'} Account Access`,
        react: UserAccessEmail({
          email,
          password,
          loginUrl,
          companyName,
          clientName,
        }) as ReactElement,
      });
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Error sending user access email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error sending email' 
      };
    }
  }
}
