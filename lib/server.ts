import { createTRPCRouter } from './trpc';
import { protectedProcedure, publicProcedure } from './trpc';
import { TRPCError } from '@trpc/server';
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
      const { data, error } = await ctx.supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
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

  // Service Tags routes
  serviceTags: createTRPCRouter({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from('service_tags')
        .select(`
          *,
          clients (
            id,
            name,
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }),

    getByClientId: protectedProcedure
      .input(ClientIdParamSchema)
      .query(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('service_tags')
          .select('*')
          .eq('client_id', input.clientId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
      }),

    create: protectedProcedure
      .input(CreateServiceTagInputSchema)
      .mutation(async ({ ctx, input }) => {
        const { data, error } = await ctx.supabase
          .from('service_tags')
          .insert([input])
          .select()
          .single();

        if (error) throw error;
        return data;
      }),

    update: protectedProcedure
      .input(UpdateServiceTagInputSchema)
      .mutation(async ({ ctx, input }) => {
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
        const { error } = await ctx.supabase
          .from('service_tags')
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
      const { data, error } = await ctx.supabase
        .from('tickets')
        .select(`
          *,
          service_tags (
            *,
            clients (
              id,
              name,
              company_name
            )
          ),
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

        console.log(data);

      if (error) throw error;
      return data;
    }),

    getMyTickets: protectedProcedure.query(async ({ ctx }) => {
      const { data, error } = await ctx.supabase
        .from('tickets')
        .select(`
          *,
          service_tags (
            *,
            clients (
              id,
              name,
              company_name
            )
          ),
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
        const { data, error } = await ctx.supabase
          .from('tickets')
          .select(`
            *,
            service_tags (
              *,
              clients (
                id,
                name,
                company_name
              )
            ),
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
});

export type AppRouter = typeof appRouter; 