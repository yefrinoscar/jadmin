import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { CreatePublicTicketInputSchema } from '../../../lib/schemas';
import type { Database } from '../../../lib/database.types';

// CORS headers for external website access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In production, specify allowed domains
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Create public ticket endpoint
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate input using existing schema
    const validationResult = CreatePublicTicketInputSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.errors,
          message: 'Please check the submitted data and try again.'
        },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    const input = validationResult.data;

    // Create Supabase client (anonymous - no auth required)
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // No cookies for anonymous requests
          },
        },
      }
    );

    // Call the database function to create public ticket
    const { data, error } = await supabase.rpc('create_public_ticket', {
      p_title: input.title,
      p_description: input.description,
      p_company_name: input.company_name,
      p_service_tag_names: input.service_tag_names,
      p_contact_name: input.contact_name,
      p_contact_email: input.contact_email,
      p_contact_phone: input.contact_phone,
      p_priority: input.priority,
      p_source: input.source,
      p_photo_url: input.photo_url || null,
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Database error',
          message: 'Failed to create ticket. Please try again later.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    // Check if the function returned an error
    if (data && !data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || 'Unknown error',
          message: data.message || 'Failed to create ticket'
        },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          ticket_id: data.ticket_id,
          company_name: data.company_name,
          client_was_new: data.client_was_new,
          service_tags: data.service_tags,
          message: data.message || 'Ticket created successfully and is pending admin approval'
        }
      },
      { 
        status: 201,
        headers: corsHeaders 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { 
        status: 500,
        headers: corsHeaders 
      }
    );
  }
}

// Prevent other HTTP methods
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      error: 'Method not allowed',
      message: 'This endpoint only accepts POST requests.',
      usage: {
        method: 'POST',
        endpoint: '/api/public-tickets',
        content_type: 'application/json',
        required_fields: [
          'title',
          'description', 
          'company_name',
          'service_tag_names',
          'contact_name',
          'contact_email',
          'contact_phone'
        ],
        optional_fields: [
          'priority',
          'source',
          'photo_url'
        ]
      }
    },
    { 
      status: 405,
      headers: corsHeaders 
    }
  );
} 