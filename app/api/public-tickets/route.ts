import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { CreatePublicTicketSchema, TicketResponseSchema } from '@/lib/types/ticket';

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

// Función para convertir base64 a File
async function base64ToFile(base64Data: string, filename: string): Promise<File> {
  // Remove the data URL prefix and get just the base64 data
  const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, '');
  
  // Convert base64 to binary
  const binaryStr = atob(base64WithoutPrefix);
  const len = binaryStr.length;
  const arr = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    arr[i] = binaryStr.charCodeAt(i);
  }
  
  // Get mime type from data URL
  const mimeType = base64Data.match(/^data:([^;]+);/)?.[1] || 'image/png';
  
  // Create Blob and File
  const blob = new Blob([arr], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

// Endpoint para crear tickets públicos
export async function POST(request: NextRequest) {
  try {
    // Verificar Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content-Type no válido',
          message: 'El Content-Type debe ser "application/json".'
        },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    // Crear cliente de Supabase (anónimo - no requiere auth)
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Parse JSON data
    const jsonData = await request.json();
    const ticketData = {
      ...jsonData,
      priority: jsonData.priority || 'medium',
      source: jsonData.source || 'web'
    };

    // Validar input usando el schema
    const validationResult = CreatePublicTicketSchema.safeParse(ticketData);
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Error de validación',
          details: validationResult.error.errors,
          message: 'Por favor revisa los datos enviados.'
        },
        { 
          status: 400,
          headers: corsHeaders 
        }
      );
    }

    const input = validationResult.data;
    const photoUrls: string[] = [];

    // Convert and upload base64 images if present
    if (jsonData.images?.length > 0) {
      for (const img of jsonData.images) {
        try {
          const photo = await base64ToFile(img.data, img.filename);

          // Validate file type
          if (!photo.type.startsWith('image/')) {
            return NextResponse.json(
              {
                success: false,
                error: 'Tipo de archivo inválido',
                message: 'Por favor sube solo imágenes.'
              },
              { 
                status: 400,
                headers: corsHeaders 
              }
            );
          }

          // Generate unique filename
          const timestamp = Date.now();
          const extension = photo.name.split('.').pop();
          const filename = `tickets/${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('images')
            .upload(filename, photo);

          if (uploadError) {
            console.error('Error al subir imagen:', uploadError);
            return NextResponse.json(
              {
                success: false,
                error: 'Error al subir imagen',
                message: 'No se pudo subir la imagen. Por favor intenta de nuevo.',
                details: process.env.NODE_ENV === 'development' ? uploadError.message : undefined
              },
              { 
                status: 500,
                headers: corsHeaders 
              }
            );
          }

          // Get public URL
          const { data: { publicUrl } } = supabase
            .storage
            .from('images')
            .getPublicUrl(filename);

          photoUrls.push(publicUrl);
        } catch (error) {
          console.error('Error procesando imagen base64:', error);
          return NextResponse.json(
            {
              success: false,
              error: 'Error procesando imagen',
              message: 'Error al procesar la imagen base64. Verifica el formato.',
              details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
            },
            { 
              status: 400,
              headers: corsHeaders 
            }
          );
        }
      }
    }

    // Llamar a la función de base de datos para crear el ticket
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
      p_photo_url: photoUrls.length > 0 ? photoUrls : null,
    });

    if (error) {
      console.error('Error de base de datos:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error de base de datos',
          message: 'Error al crear el ticket. Por favor intenta de nuevo.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    // Validar la respuesta
    const responseValidation = TicketResponseSchema.safeParse(data);
    if (!responseValidation.success) {
      console.error('Error de validación de respuesta:', responseValidation.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Formato de respuesta inválido',
          message: 'El servidor retornó un formato de respuesta inválido.',
          details: process.env.NODE_ENV === 'development' ? responseValidation.error.errors : undefined
        },
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    // Respuesta exitosa
    return NextResponse.json(
      responseValidation.data,
      { 
        status: 201,
        headers: corsHeaders 
      }
    );

  } catch (error) {
    console.error('Error inesperado:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        message: 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
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
        body_format: {
          required_fields: {
            title: 'string',
            description: 'string',
            company_name: 'string',
            service_tag_names: 'string[]',
            contact_name: 'string',
            contact_email: 'string',
            contact_phone: 'string'
          },
          optional_fields: {
            priority: '"low" | "medium" | "high"',
            source: '"web" | "email" | "phone" | "in_person"',
            images: 'Array<{ filename: string, data: string }>' // base64 images
          }
        }
      }
    },
    { 
      status: 405,
      headers: corsHeaders 
    }
  );
} 