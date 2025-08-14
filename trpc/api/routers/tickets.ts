import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../init';
import {
  CreateTicketSchema as CreateTicketInputSchema,
  UpdateTicketSchema as UpdateTicketInputSchema,
  TicketWithRelationsSchema,
  TicketStatusEnum,
  TicketPriorityEnum,
  TicketSourceEnum,
  ServiceTagSchema
} from '@/lib/schemas/ticket';
import { SuccessResponseSchema } from '@/lib/schemas';
import { z } from 'zod';

// Define schemas
const IdParamSchema = z.object({
  id: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format")
});

// Define schema for ticket history items
const TicketHistoryItemSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string(),
  user_id: z.string(),
  message: z.string(),
  created_at: z.string(),
  user_name: z.string().optional(),
  type: z.string().optional()
});

const TicketHistoryOutputSchema = z.array(TicketHistoryItemSchema);

// Export type for use in components
export type TicketHistoryItem = z.infer<typeof TicketHistoryItemSchema>;

const ClientIdParamSchema = z.object({
  clientId: z.string().uuid("Invalid client ID")
});

const ServiceTagIdSchema = z.object({
  id: z.string().uuid()
});

const RemoveServiceTagSchema = z.object({
  ticketId: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format"),
  serviceTagId: z.string()
});

const AddServiceTagSchema = z.object({
  ticketId: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format"),
  serviceTagId: z.string()
});

const TicketStatusUpdateSchema = z.object({
  id: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format"),
  status: TicketStatusEnum
});

const TicketAssignmentSchema = z.object({
  id: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format"),
  assigned_user_id: z.string().uuid().nullable()
});

// Define output schema for getAll tickets
// Schema for ticket list items that will be used in the UI
export const TicketListItemSchema = z.object({
  id: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format"),
  title: z.string(),
  description: z.string(),
  status: TicketStatusEnum,
  priority: TicketPriorityEnum,
  source: TicketSourceEnum,
  created_at: z.string(),
  updated_at: z.string(),
  client_id: z.string(),
  client_company_name: z.string(),
  photo_url: z.array(z.string()).nullable(),
  reported_by: z.object({
    id: z.string(),
    name: z.string()
  }),
  assigned_user: z.object({
    id: z.string(),
    name: z.string()
  }).nullable(),
  ticket_service_tags: z.array(
    z.object({
      id: z.string(),
      tag: z.string(),
      description: z.string()
    })
  )
});

const TicketsListOutputSchema = z.array(TicketListItemSchema);

// Export type for use in components
export type TicketListItem = z.infer<typeof TicketListItemSchema>;

export const ticketsRouter = createTRPCRouter({
  // Get ticket history
  getTicketHistory: protectedProcedure
    .input(IdParamSchema)
    .query(async ({ ctx, input }) => {
      // Get ticket history from ticket_updates table with user information
      const { data, error } = await ctx.supabase
        .from('ticket_updates')
        .select(`
          *,
          users:user_id (name)
        `)
        .eq('ticket_id', input.id)
        .order('created_at', { ascending: false });

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch ticket history: ${error.message}`,
        cause: error
      });

      // Transform the data to match the schema
      const transformedData = data.map(item => ({
        ...item,
        user_name: item.users?.name || 'Unknown User',
        // Determine the type based on the message content
        type: item.message.includes('status') ? 'status_change' :
              item.message.includes('Comment') ? 'comment_added' :
              item.message.includes('assigned') ? 'assigned_change' :
              'other'
      }));

      return TicketHistoryOutputSchema.parse(transformedData);
    }),
  // NOTE: The following authorization rules are assumptions and may need to be refined
  // based on specific business logic for client users.
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const role = ctx.user?.publicMetadata.role as string;
    if (!['superadmin', 'admin', 'technician'].includes(role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view all tickets.'
      });
    }
    const { data, error } = await ctx.supabase
      .from('tickets')
      .select(`
        *,
        clients:client_id (
          id,
          name
        ),
        ticket_service_tags!ticket_id (
          service_tag:service_tag_id (
            id,
            tag,
            description
          )
        ),
        assigned:users!assigned_to (
          id,
          name
        ),
        reported:users!reported_by (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to fetch tickets: ${error.message}`,
      cause: error
    });

    // Transform the data to match our schema
    const formattedTickets = data.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      source: ticket.source,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      client_id: ticket.client_id,
      client_company_name: ticket.clients?.name || '',
      reported_by: {
        id: ticket.reported?.id || '',
        name: ticket.reported?.name || ''
      },
      assigned_user: ticket.assigned ? {
        id: ticket.assigned.id,
        name: ticket.assigned.name
      } : null,
      ticket_service_tags: ticket.ticket_service_tags?.map((tag: { service_tag: { id: string, tag: string, description: string } }) => ({
        id: tag.service_tag.id,
        tag: tag.service_tag.tag,
        description: tag.service_tag.description
      })) || [],
      photo_url: ticket.photo_url || null,
    }));

    console.log("formattedTickets", formattedTickets);
    
    // Validate the output using our schema
    return TicketsListOutputSchema.parse(formattedTickets);
  }),

  getById: protectedProcedure
    .input(IdParamSchema)
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      // Allow admins/techs to see any ticket. Logic for client users would be more complex.
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this ticket.'
        });
      }
      const { data, error } = await ctx.supabase
        .from('tickets')
        .select(`
          *,
          clients:client_id (
            id,
            name
          ),
        ticket_service_tags!ticket_id (
          service_tag:service_tag_id (
            id,
            tag,
            description
          )
        ),
        assigned:users!assigned_to (
          id,
          name
        ),
        reported:users!reported_by (
          id,
          name
        )
        `)
        .eq('id', input.id)
        .single();

      if (error) throw error;
      return data;
    }),

  getByClientId: protectedProcedure
    .input(ClientIdParamSchema)
    .query(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      const userId = ctx.auth.userId;
      // Allow admins/techs to see any client's tickets.
      // For client users, check if they belong to the requested client.
      if (!['superadmin', 'admin', 'technician'].includes(role) && userId !== input.clientId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view tickets for this client.'
        });
      }
      const { data, error } = await ctx.supabase
        .from('tickets')
        .select(`
          *,
          ticket_service_tags!ticket_id (
            service_tag:service_tag_id (
              id,
              tag,
              description
            )
          ),
          assigned_to:assigned_user_id (
            id,
            name
          ),
          created_by:user_id (
            id,
            name
          )
        `)
        .eq('client_id', input.clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }),

  getByServiceTagId: protectedProcedure
    .input(ServiceTagIdSchema)
    .query(async ({ ctx, input }) => {
      // This procedure is likely used by technicians and admins, so we restrict it.
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action.'
        });
      }
      // First get the ticket IDs that have this service tag
      const { data: ticketServiceTags, error: junctionError } = await ctx.supabase
        .from('ticket_service_tags')
        .select('ticket_id')
        .eq('service_tag_id', input.id);

      if (junctionError) throw junctionError;

      // If no tickets found with this service tag, return empty array
      if (!ticketServiceTags || ticketServiceTags.length === 0) {
        return [];
      }

      // Get the ticket IDs
      const ticketIds = ticketServiceTags.map(item => item.ticket_id);

      // Then get the tickets with those IDs
      const { data, error } = await ctx.supabase
        .from('tickets')
        .select(`
          *,
          clients:client_id (
            id,
            name
          ),
          ticket_service_tags!ticket_id (
            service_tag:service_tag_id (
              id,
              tag,
              description
            )
          ),
          assigned_to:assigned_user_id (
            id,
            name
          ),
          created_by:user_id (
            id,
            name
          )
        `)
        .in('id', ticketIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }),

  create: protectedProcedure
    .input(CreateTicketInputSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      // Add the current user as the creator
      const ticketData = {
        ...input,
        user_id: ctx.auth.userId,
        status: 'open'
      };

      const { data, error } = await ctx.supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  update: protectedProcedure
    .input(UpdateTicketInputSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update tickets.'
        });
      }
      const { id, ...updateData } = input;
      const { data, error } = await ctx.supabase
        .from('tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  updateStatus: protectedProcedure
    .input(TicketStatusUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update ticket status.'
        });
      }
      const { id, status } = input;
      const { data, error } = await ctx.supabase
        .from('tickets')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  assignTicket: protectedProcedure
    .input(TicketAssignmentSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to assign tickets.'
        });
      }
      const { id, assigned_user_id } = input;
      const { data, error } = await ctx.supabase
        .from('tickets')
        .update({ assigned_user_id })
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
      if (!['superadmin', 'admin'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete tickets.'
        });
      }
      const { error } = await ctx.supabase
        .from('tickets')
        .delete()
        .eq('id', input.id);

      if (error) throw error;
      return SuccessResponseSchema.parse({ success: true });
    }),

  removeServiceTag: protectedProcedure
    .input(RemoveServiceTagSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify service tags on a ticket.'
        });
      }
      const { error } = await ctx.supabase
        .from('ticket_service_tags')
        .delete()
        .eq('ticket_id', input.ticketId)
        .eq('service_tag_id', input.serviceTagId);

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to remove service tag: ${error.message}`,
        cause: error
      });

      return SuccessResponseSchema.parse({ success: true });
    }),
    
  addServiceTag: protectedProcedure
    .input(AddServiceTagSchema)
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin', 'technician'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify service tags on a ticket.'
        });
      }
      // First check if the association already exists to avoid duplicates
      const { data: existingAssociation, error: checkError } = await ctx.supabase
        .from('ticket_service_tags')
        .select('*')
        .eq('ticket_id', input.ticketId)
        .eq('service_tag_id', input.serviceTagId)
        .maybeSingle();

      if (checkError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to check existing service tag association: ${checkError.message}`,
          cause: checkError
        });
      }

      // If association already exists, return success without creating a duplicate
      if (existingAssociation) {
        return SuccessResponseSchema.parse({ success: true });
      }

      // Create the association
      const { error } = await ctx.supabase
        .from('ticket_service_tags')
        .insert({
          ticket_id: input.ticketId,
          service_tag_id: input.serviceTagId
        });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add service tag to ticket: ${error.message}`,
          cause: error
        });
      }

      return SuccessResponseSchema.parse({ success: true });
    }),
});
