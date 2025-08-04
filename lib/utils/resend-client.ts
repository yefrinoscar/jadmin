import { Resend } from 'resend';

// Create a Resend client instance
export const createResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  
  return new Resend(apiKey);
};

// Default sender email address
export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'no-reply@dashboard.underla.lat';
