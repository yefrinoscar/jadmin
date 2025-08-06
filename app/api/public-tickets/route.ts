import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { CreatePublicTicketSchema, TicketResponseSchema } from '@/lib/types/ticket';
import sharp from 'sharp';

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

// Función para comprimir imagen usando Sharp (server-side)
async function compressImage(file: File): Promise<Buffer> {
  try {
    // Convertir File a Buffer para procesamiento con Sharp
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determinar formato de salida basado en el tipo MIME
    let format: keyof sharp.FormatEnum = 'jpeg'; // Por defecto
    if (file.type === 'image/png') format = 'png';
    if (file.type === 'image/webp') format = 'webp';
    if (file.type === 'image/gif') format = 'gif';
    
    // Comprimir la imagen
    return await sharp(buffer)
      .resize({
        width: 1920,
        height: 1080,
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFormat(format, {
        quality: 80,
        progressive: true
      })
      .toBuffer();
  } catch (error) {
    console.error('Error comprimiendo imagen con Sharp:', error);
    // Si hay error en la compresión, devolver el buffer original
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}

// Endpoint para crear tickets públicos
export async function POST(request: NextRequest) {
  try {
    // Verificar Content-Typ

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
      source: jsonData.source || 'web' // Must be one of: 'email', 'phone', 'web', 'in_person', 'integration'
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

    // Convert, compress and upload base64 images if present
    if (input.images && input.images.length > 0) {
      for (const img of input.images) {
        try {
          // Convertir base64 a File
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
          
          // Comprimir la imagen antes de subir
          console.log(`Comprimiendo imagen: ${img.filename}, tamaño original: ${photo.size} bytes`);
          const compressedBuffer = await compressImage(photo);
          console.log(`Imagen comprimida: ${img.filename}, nuevo tamaño: ${compressedBuffer.byteLength} bytes`);

          // Generate unique filename
          const timestamp = Date.now();
          const extension = photo.name.split('.').pop();
          const filename = `tickets/${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('images')
            .upload(filename, compressedBuffer, {
              contentType: photo.type // Mantener el tipo MIME original
            });

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
    // Ensure service_tag_names is an array of strings
    const service_tag_names = Array.isArray(input.service_tag_names) 
      ? input.service_tag_names 
      : [input.service_tag_names].filter(Boolean);
      
    const values = {
      p_title: input.title,
      p_description: input.description,
      p_company_name: input.company_name,
      p_service_tag_names: service_tag_names,
      p_contact_name: input.contact_name,
      p_contact_email: input.contact_email,
      p_contact_phone: input.contact_phone,
      p_priority: input.priority || 'medium',
      p_source: input.source || 'web',
      p_photo_url: photoUrls.length > 0 ? photoUrls : null,
    };
    
    // Log detailed information about the values being sent
    console.log('Sending to create_public_ticket:');
    console.log('Title:', values.p_title);
    console.log('Description:', values.p_description?.substring(0, 50) + '...');
    console.log('Company:', values.p_company_name);
    console.log('Service tags:', values.p_service_tag_names);
    console.log('Contact:', values.p_contact_name, values.p_contact_email, values.p_contact_phone);
    console.log('Priority:', values.p_priority);
    console.log('Source:', values.p_source);
    console.log('Photo URLs:', values.p_photo_url);
    
    try {
      // Check if company exists (non-provisional)
      const { data: existingCompany, error: companyError } = await supabase
        .from('clients')
        .select('id')
        .ilike('company_name', values.p_company_name)
        .eq('is_provisional', false)
        .limit(1);
        
      if (companyError) {
        console.error('Error checking existing company:', companyError);
        return NextResponse.json(
          {
            success: false,
            error: 'Error de base de datos',
            message: 'Error al verificar empresa existente. Por favor intenta de nuevo.',
            details: process.env.NODE_ENV === 'development' ? companyError.message : undefined
          },
          { 
            status: 500,
            headers: corsHeaders 
          }
        );
      }
      
      // Determine if we need company review and create a temporary company if needed
      const needsCompanyReview = !existingCompany || existingCompany.length === 0;
      let clientId;
      
      if (existingCompany && existingCompany.length > 0) {
        // Use existing company
        clientId = existingCompany[0].id;
      } else {
        // Create a temporary company
        const { data: tempCompany, error: tempCompanyError } = await supabase
          .from('clients')
          .insert({
            name: input.contact_name,
            email: input.contact_email,
            phone: input.contact_phone,
            address: 'Pending verification',
            company_name: input.company_name,
            is_provisional: true
          })
          .select('id')
          .single();
          
        if (tempCompanyError) {
          console.error('Error creating temporary company:', tempCompanyError);
          return NextResponse.json(
            {
              success: false,
              error: 'Error de base de datos',
              message: 'Error al crear empresa temporal. Por favor intenta de nuevo.',
              details: process.env.NODE_ENV === 'development' ? tempCompanyError.message : undefined
            },
            { 
              status: 500,
              headers: corsHeaders 
            }
          );
        }
        
        clientId = tempCompany.id;
      }
      
      // Insert directly into tickets table
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          title: values.p_title,
          description: values.p_description,
          status: 'pending_approval',
          priority: values.p_priority,
          client_id: clientId,
          source: values.p_source,
          photo_url: values.p_photo_url,
          needs_company_review: needsCompanyReview
        })
        .select('id')
        .single();
      
      console.log('Database response:', JSON.stringify(ticketData), ticketError?.message, ticketError?.details);
      
      if (ticketError) {
        console.error('Error de base de datos:', ticketError);
        return NextResponse.json(
          {
            success: false,
            error: 'Error de base de datos',
            message: 'Error al crear el ticket. Por favor intenta de nuevo.',
            details: process.env.NODE_ENV === 'development' ? ticketError.message : undefined
          },
          { 
            status: 500,
            headers: corsHeaders 
          }
        );
      }
      
      // Create service tags and link them to the ticket
      const createdServiceTags = [];
      const existingServiceTags = [];
      
      // Process each service tag
      for (const tagName of values.p_service_tag_names) {
        // Check if service tag already exists for this client
        const { data: existingTag, error: tagError } = await supabase
          .from('service_tags')
          .select('id, tag')
          .eq('client_id', clientId)
          .ilike('tag', tagName)
          .limit(1);
          
        if (tagError) {
          console.error('Error checking service tag:', tagError);
          continue; // Continue with next tag if there's an error
        }
        
        let serviceTagId;
        
        if (existingTag && existingTag.length > 0) {
          // Use existing tag
          serviceTagId = existingTag[0].id;
          existingServiceTags.push({
            id: serviceTagId,
            tag: existingTag[0].tag,
            status: 'existing'
          });
        } else {
          // Create new service tag
          const { data: newTag, error: newTagError } = await supabase
            .from('service_tags')
            .insert({
              tag: tagName,
              description: 'Auto-created from ticket submission',
              client_id: clientId,
              hardware_type: 'Pending Review',
              location: 'Pending Review',
              is_auto_created: true
            })
            .select('id, tag')
            .single();
            
          if (newTagError) {
            console.error('Error creating service tag:', newTagError);
            continue; // Continue with next tag if there's an error
          }
          
          serviceTagId = newTag.id;
          createdServiceTags.push({
            id: serviceTagId,
            tag: newTag.tag,
            status: 'created'
          });
        }
        
        // Link service tag to ticket
        const { error: linkError } = await supabase
          .from('ticket_service_tags')
          .insert({
            ticket_id: ticketData.id,
            service_tag_id: serviceTagId
          });
          
        if (linkError) {
          console.error('Error linking service tag to ticket:', linkError);
        }
      }
      
      // Create response object
      const responseData = {
        success: true,
        ticket_id: ticketData.id,
        company_name: values.p_company_name,
        using_provisional_company: needsCompanyReview,
        created_service_tags: createdServiceTags,
        existing_service_tags: existingServiceTags,
        message: needsCompanyReview 
          ? 'Ticket created with provisional company, pending admin review'
          : 'Ticket created successfully, pending admin approval'
      };
      
      // Validar la respuesta
      const responseValidation = TicketResponseSchema.safeParse(responseData);
      if (!responseValidation.success) {
        console.error('Error de validación de respuesta:', responseValidation.error);
        return NextResponse.json(
          {
            success: false,
            error: 'Error de validación',
            message: 'La respuesta del servidor no tiene el formato esperado.',
            details: process.env.NODE_ENV === 'development' ? responseValidation.error.message : undefined
          },
          { 
            status: 500,
            headers: corsHeaders 
          }
        );
      }
      
      return NextResponse.json(responseValidation.data, { headers: corsHeaders });
    } catch (err) {
      // Capturar y registrar el error completo
      console.error('Error completo al crear ticket:', err);
      return NextResponse.json(
        {
          success: false,
          error: 'Error interno',
          message: 'Error al procesar la solicitud.',
          details: process.env.NODE_ENV === 'development' ? (err as Error).message : undefined
        },
        { 
          status: 500,
          headers: corsHeaders 
        }
      );
    }

    // This code is now handled in the try/catch block above

    // Respuesta exitosa ya está manejada en el bloque try

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