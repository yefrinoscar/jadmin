import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '../../../lib/services/email-service';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Manejar preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}
 
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { email, password, loginUrl, companyName, clientName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use the provided login URL or default
    const finalLoginUrl = loginUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login`;
    const finalCompanyName = companyName || process.env.COMPANY_NAME || 'JAdmin';
    
    // Send the access email
    const emailResult = await EmailService.sendUserAccessEmail({
      to: email,
      email,
      password,
      loginUrl: finalLoginUrl,
      companyName: finalCompanyName,
      clientName
    });

    console.log('Email result:', emailResult);
    

    if (!emailResult.success) {
      console.error('Failed to send user access email:', emailResult.error);
      return NextResponse.json(
        { success: false, error: `Failed to send email: ${emailResult.error}` },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error sending access email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
