import { TRPCError } from '@trpc/server';

import { createTRPCRouter, protectedProcedure } from '../../init';
import {
  CreateServiceTagInputSchema,
  UpdateServiceTagInputSchema,
  IdParamSchema,
  ClientIdParamSchema,
  SuccessResponseSchema,
  ServiceTagSchema
} from '@/lib/schemas';
import { z } from 'zod';
import { ServiceTagErrorCode, SERVICE_TAG_ERROR_MESSAGES } from '@/lib/errors';

// Output schema for service tag list endpoints
export const SerialNumberListOutputSchema = z.array(ServiceTagSchema);

// Schema for ticket ID parameter
const TicketIdParamSchema = z.object({
  ticketId: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format")
});
export type SerialNumber = z.infer<typeof ServiceTagSchema>;

export const serviceTagsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const role = ctx.user?.publicMetadata.role as string;
    if (!['superadmin', 'admin', 'technician'].includes(role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view service tags.'
      });
    }
    const { data, error } = await ctx.supabase
      .from('service_tags')
      .select(`
        *,
        clients (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }),

  getByClientId: protectedProcedure
    .input(ClientIdParamSchema)
    .output(SerialNumberListOutputSchema)
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('service_tags')
        .select('*')
        .eq('client_id', input.clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return SerialNumberListOutputSchema.parse(data);
    }),
    
  getByTicketId: protectedProcedure
    .input(TicketIdParamSchema)
    .output(SerialNumberListOutputSchema)
    .query(async ({ ctx, input }) => {
      // First get the service tag IDs associated with this ticket
      const { data: ticketServiceTags, error: junctionError } = await ctx.supabase
        .from('ticket_service_tags')
        .select('service_tag_id')
        .eq('ticket_id', input.ticketId);

      if (junctionError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch ticket service tags: ${junctionError.message}`,
          cause: junctionError
        });
      }

      // If no service tags found for this ticket, return empty array
      if (!ticketServiceTags || ticketServiceTags.length === 0) {
        return [];
      }

      // Get the service tag IDs
      const serviceTagIds = ticketServiceTags.map(item => item.service_tag_id);

      // Then get the service tags with those IDs
      const { data, error } = await ctx.supabase
        .from('service_tags')
        .select('*')
        .in('id', serviceTagIds);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch service tags: ${error.message}`,
          cause: error
        });
      }

      return SerialNumberListOutputSchema.parse(data);
    }),

  create: protectedProcedure
    .input(CreateServiceTagInputSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create service tags.'
        });
      }
      // Primero verificamos si ya existe un tag con el mismo nombre para este cliente
      const { data: existingTags, error: checkError } = await ctx.supabase
        .from('service_tags')
        .select('id')
        .eq('tag', input.tag)
        .eq('client_id', input.client_id);

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: SERVICE_TAG_ERROR_MESSAGES[ServiceTagErrorCode.UNKNOWN_ERROR](checkError.message),
          cause: ServiceTagErrorCode.UNKNOWN_ERROR
        });
      }

      // Si encontramos tags con el mismo nombre, lanzamos un error
      if (existingTags && existingTags.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: SERVICE_TAG_ERROR_MESSAGES[ServiceTagErrorCode.DUPLICATE_TAG](input.tag),
          cause: ServiceTagErrorCode.DUPLICATE_TAG
        });
      }

      // Si no hay duplicados, procedemos con la inserción
      const { data, error } = await ctx.supabase
        .from('service_tags')
        .insert([input])
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: SERVICE_TAG_ERROR_MESSAGES[ServiceTagErrorCode.UNKNOWN_ERROR](error.message),
          cause: ServiceTagErrorCode.UNKNOWN_ERROR
        });
      }
      
      return data;
    }),

  update: protectedProcedure
    .input(UpdateServiceTagInputSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update service tags.'
        });
      }
      const { id, ...updateData } = input;
      const { data, error } = await ctx.supabase
        .from('service_tags')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  delete: protectedProcedure
    .input(IdParamSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete service tags.'
        });
      }
      // Check if service tag has any tickets
      const { count: ticketsCount, error: ticketsError } = await ctx.supabase
        .from('ticket_service_tags')
        .select('*', { count: 'exact', head: true })
        .eq('service_tag_id', input.id);

      if (ticketsError) throw ticketsError;

      if (ticketsCount && ticketsCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No se puede eliminar el número de serie porque tiene tickets asociados'
        });
      }

      // If no related records, proceed with deletion
      const { error } = await ctx.supabase
        .from('service_tags')
        .delete()
        .eq('id', input.id);

      if (error) throw error;
      return SuccessResponseSchema.parse({ success: true });
    }),
});
