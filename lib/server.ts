import { createTRPCRouter } from './trpc';
import { protectedProcedure, publicProcedure } from './trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
  // Input schemas
  CreateUserInputSchema,
  UpdateUserInputSchema,
  CreateClientInputSchema,
  UpdateClientInputSchema,
  CreateServiceTagInputSchema,
  UpdateServiceTagInputSchema,
  CreateTicketInputSchema,
  UpdateTicketInputSchema,
  CreateTicketUpdateInputSchema,
  CreatePublicTicketInputSchema,
  AssignUserInputSchema,
  ApproveTicketInputSchema,
  
  // Query schemas
  IdParamSchema,
  ClientIdParamSchema,
  
  // Response schemas
  SuccessResponseSchema,
  TestConnectionResponseSchema,
} from './schemas';

export const appRouter = createTRPCRouter({
  // Auth routes
  auth: createTRPCRouter({
    getSession: publicProcedure.query(async ({ ctx }) => {
      return ctx.session;
    }),
  }),

  // User routes
  users: createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      // Check user role within the procedure to avoid recursion
      const { data: currentUser, error: userError } = await ctx.supabase
        .from('users')
        .select('role')
        .eq('id', ctx.session!.user.id)
        .single();
      
      if (userError || !currentUser || !['admin', 'technician'].includes(currentUser.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin or technician access required' });
      }

      const { data, error } = await ctx.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }),

    create: protectedProcedure
      .input(CreateUserInputSchema)
      .mutation(async ({ ctx, input }) => {
        // Check user role within the procedure
        const { data: currentUser, error: userError } = await ctx.supabase
          .from('users')
          .select('role')
          .eq('id', ctx.session!.user.id)
          .single();
        
        if (userError || !currentUser || currentUser.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }

        const { data, error } = await ctx.supabase
          .from('users')
          .insert([input])
          .select()
          .single();

        if (error) throw error;
        return data;
      }),

    update: protectedProcedure
      .input(UpdateUserInputSchema)
      .mutation(async ({ ctx, input }) => {
        // Check user role within the procedure
        const { data: currentUser, error: userError } = await ctx.supabase
          .from('users')
          .select('role')
          .eq('id', ctx.session!.user.id)
          .single();
        
        if (userError || !currentUser || currentUser.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }

        const { id, ...updateData } = input;
        const { data, error } = await ctx.supabase
          .from('users')
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
        // Check user role within the procedure
        const { data: currentUser, error: userError } = await ctx.supabase
          .from('users')
          .select('role')
          .eq('id', ctx.session!.user.id)
          .single();
        
        if (userError || !currentUser || currentUser.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }

        const { error } = await ctx.supabase
          .from('users')
          .delete()
          .eq('id', input.id);

        if (error) throw error;
        return SuccessResponseSchema.parse({ success: true });
      }),

    getAssignableUsers: protectedProcedure.query(async ({ ctx }) => {
      // Get users who can be assigned tickets (technicians and admins)
      const { data, error } = await ctx.supabase
        .from('users')
        .select('id, name, email, role')
        .in('role', ['admin', 'technician'])
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    }),
  }),

  // Client routes
  clients: createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      // Get clients with service tags and tickets count
      const { data: clients, error: clientsError } = await ctx.supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Get service tags count for each client
      const { data: serviceTagsCount, error: serviceTagsError } = await ctx.supabase
        .from('service_tags')
        .select('client_id');

      if (serviceTagsError) throw serviceTagsError;

      // Get active tickets count for each client
      const { data: activeTicketsCount, error: ticketsError } = await ctx.supabase
        .from('tickets')
        .select('client_id')
        .in('status', ['pending_approval', 'open', 'in_progress']);

      if (ticketsError) throw ticketsError;

      // Count occurrences
      const serviceTagsMap = serviceTagsCount?.reduce((acc, tag) => {
        acc[tag.client_id] = (acc[tag.client_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const activeTicketsMap = activeTicketsCount?.reduce((acc, ticket) => {
        acc[ticket.client_id] = (acc[ticket.client_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Combine data
      const clientsWithStats = clients?.map(client => ({
        ...client,
        service_tags_count: serviceTagsMap[client.id] || 0,
        active_tickets_count: activeTicketsMap[client.id] || 0,
      })) || [];

      return clientsWithStats;
    }),

    getById: protectedProcedure
      .input(IdParamSchema)
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('clients')
          .select('*')
          .eq('id', input.id)
          .single();

        if (error) throw error;
        return data;
      }),

    create: protectedProcedure
      .input(CreateClientInputSchema)
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('clients')
          .insert([input])
          .select()
          .single();

        if (error) throw error;
        return data;
      }),

    update: protectedProcedure
      .input(UpdateClientInputSchema)
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        const { data, error } = await ctx.supabase
          .from('clients')
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
        const { error } = await ctx.supabase
          .from('clients')
          .delete()
          .eq('id', input.id);

        if (error) throw error;
        return SuccessResponseSchema.parse({ success: true });
      }),
  }),

  // Ticket routes
  tickets: createTRPCRouter({
    // Simple test query without joins
    testConnection: protectedProcedure.query(async ({ ctx }) => {
      try {
        const { data, error } = await ctx.supabase
          .from('tickets')
          .select('id, title, status')
          .limit(5);

        if (error) {
          return TestConnectionResponseSchema.parse({ 
            error: error.message, 
            success: false 
          });
        }
        
        return TestConnectionResponseSchema.parse({ 
          data, 
          success: true, 
          count: data?.length || 0 
        });
      } catch (err) {
        return TestConnectionResponseSchema.parse({ 
          error: err instanceof Error ? err.message : 'Unknown error', 
          success: false 
        });
      }
    }),

    getAll: protectedProcedure.query(async ({ ctx }) => {
      // Use the view that includes service tags
      const { data, error } = await ctx.supabase
        .from('tickets_with_service_tags')
        .select(`
          *,
          reported_user:users!tickets_reported_by_fkey (
            id,
            name,
            email
          ),
          assigned_user:users!tickets_assigned_to_fkey (
            id,
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }),

    getMyTickets: protectedProcedure.query(async ({ ctx }) => {
      // Use the view that includes service tags
      const { data, error } = await ctx.supabase
        .from('tickets_with_service_tags')
        .select(`
          *,
          reported_user:users!tickets_reported_by_fkey (
            id,
            name,
            email
          ),
          assigned_user:users!tickets_assigned_to_fkey (
            id,
            name,
            email
          )
        `)
        .eq('assigned_to', ctx.session!.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }),

    getById: protectedProcedure
      .input(IdParamSchema)
      .query(async ({ ctx, input }) => {
        // Use the view that includes service tags
        const { data, error } = await ctx.supabase
          .from('tickets_with_service_tags')
          .select(`
            *,
            reported_user:users!tickets_reported_by_fkey (
              id,
              name,
              email
            ),
            assigned_user:users!tickets_assigned_to_fkey (
              id,
              name,
              email
            ),
            ticket_updates (
              *,
              users (
                id,
                name,
                email
              )
            )
          `)
          .eq('id', input.id)
          .single();

        if (error) throw error;
        return data;
      }),

    create: protectedProcedure
      .input(CreateTicketInputSchema)
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('tickets')
          .insert([
            {
              ...input,
              reported_by: ctx.session!.user.id,
              time_open: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      }),

    update: protectedProcedure
      .input(UpdateTicketInputSchema)
      .mutation(async ({ ctx, input }) => {
        const { id, ...updateData } = input;
        
        // If status is being updated to resolved or closed, set time_closed
        if (updateData.status === 'resolved' || updateData.status === 'closed') {
          (updateData as any).time_closed = new Date().toISOString();
        }

        const { data, error } = await ctx.supabase
          .from('tickets')
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
        const { error } = await ctx.supabase
          .from('tickets')
          .delete()
          .eq('id', input.id);

        if (error) throw error;
        return SuccessResponseSchema.parse({ success: true });
      }),

    addUpdate: protectedProcedure
      .input(CreateTicketUpdateInputSchema)
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('ticket_updates')
          .insert([
            {
              ...input,
              user_id: ctx.session!.user.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      }),

    assignUser: protectedProcedure
      .input(AssignUserInputSchema)
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('tickets')
          .update({ assigned_to: input.user_id })
          .eq('id', input.ticket_id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }),

    approve: protectedProcedure
      .input(ApproveTicketInputSchema)
      .mutation(async ({ ctx, input }) => {
        // Check if user is admin
        const { data: userData, error: userError } = await ctx.supabase
          .from('users')
          .select('role')
          .eq('id', ctx.session!.user.id)
          .single();

        if (userError) throw userError;
        
        if (userData.role !== 'admin') {
          throw new Error('Only administrators can approve tickets');
        }

        // Call the database function to approve the ticket
        const { data, error } = await ctx.supabase.rpc('approve_ticket', {
          ticket_id_param: input.ticket_id,
          admin_user_id: ctx.session!.user.id
        });

        if (error) throw error;
        
        if (!data) {
          throw new Error('Failed to approve ticket - ticket may not be in pending approval status');
        }

        return SuccessResponseSchema.parse({ success: true });
      }),
  }),

  // Public ticket submission routes
  publicTickets: createTRPCRouter({
    create: publicProcedure
      .input(CreatePublicTicketInputSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          // Call the database function to create a public ticket
          const { data, error } = await ctx.supabase.rpc('create_public_ticket', {
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
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: `Database error: ${error.message}` 
            });
          }

          // Check if the function returned an error
          if (data && !data.success) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: data.message || 'Failed to create ticket' 
            });
          }

          return data;
        } catch (err) {
          if (err instanceof TRPCError) {
            throw err;
          }
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` 
          });
        }
      }),

    getPendingApproval: protectedProcedure.query(async ({ ctx }) => {
      // Check user role - only admins and technicians can view pending tickets
      const { data: currentUser, error: userError } = await ctx.supabase
        .from('users')
        .select('role')
        .eq('id', ctx.session!.user.id)
        .single();
      
      if (userError || !currentUser || !['admin', 'technician'].includes(currentUser.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin or technician access required' });
      }

      try {
        const { data, error } = await ctx.supabase.rpc('get_pending_approval_tickets');

        if (error) {
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Database error: ${error.message}` 
          });
        }

        return data || [];
      } catch (err) {
        if (err instanceof TRPCError) {
          throw err;
        }
        throw new TRPCError({ 
          code: 'INTERNAL_SERVER_ERROR', 
          message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` 
        });
      }
    }),

    approve: protectedProcedure
      .input(ApproveTicketInputSchema.extend({
        approved: z.boolean(),
        rejection_reason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check user role - only admins can approve tickets
        const { data: currentUser, error: userError } = await ctx.supabase
          .from('users')
          .select('role')
          .eq('id', ctx.session!.user.id)
          .single();
        
        if (userError || !currentUser || currentUser.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
        }

        try {
          const { data, error } = await ctx.supabase.rpc('approve_public_ticket', {
            p_ticket_id: input.ticket_id,
            p_admin_user_id: ctx.session!.user.id,
            p_approved: input.approved,
            p_rejection_reason: input.rejection_reason || null,
          });

          if (error) {
            throw new TRPCError({ 
              code: 'INTERNAL_SERVER_ERROR', 
              message: `Database error: ${error.message}` 
            });
          }

          // Check if the function returned an error
          if (data && !data.success) {
            throw new TRPCError({ 
              code: 'BAD_REQUEST', 
              message: data.error || 'Failed to process ticket approval' 
            });
          }

          return data;
        } catch (err) {
          if (err instanceof TRPCError) {
            throw err;
          }
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}` 
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter; 