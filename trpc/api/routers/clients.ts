import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../init';
import {
  CreateClientInputSchema,
  UpdateClientInputSchema,
  IdParamSchema,
  ClientIdParamSchema,
  SuccessResponseSchema
} from '@/lib/schemas';


// Helper function to check user role from database to avoid RLS recursion
async function checkUserRole(ctx: any, allowedRoles: string[]) {
  // This initial query is necessary to avoid RLS recursion
  const { data: currentUser, error: userError } = await ctx.supabase
    .from('users')
    .select('role')
    .eq('id', ctx.session!.user.id)
    .single();
  
  if (userError || !currentUser || !allowedRoles.includes(currentUser.role)) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: `Access requires one of these roles: ${allowedRoles.join(', ')}` 
    });
  }
  return currentUser.role;
}

export const clientsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Get clients with service tags and tickets count
    const { data: clients, error: clientsError } = await ctx.supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (clientsError) throw clientsError;

    // Get service tags count for each client
    const clientsWithCounts = await Promise.all(
      clients.map(async (client) => {
        // Count service tags
        const { count: serviceTagsCount, error: serviceTagsError } = await ctx.supabase
          .from('service_tags')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);

        if (serviceTagsError) throw serviceTagsError;

        // Count tickets
        const { count: ticketsCount, error: ticketsError } = await ctx.supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);

        if (ticketsError) throw ticketsError;

        return {
          ...client,
          service_tags_count: serviceTagsCount,
          tickets_count: ticketsCount
        };
      })
    );

    return clientsWithCounts;
  }),

  getById: protectedProcedure
    .input(ClientIdParamSchema)
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('clients')
        .select('*')
        .eq('id', input.clientId)
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
      // Check if client has any service tags or tickets
      const { count: serviceTagsCount, error: serviceTagsError } = await ctx.supabase
        .from('service_tags')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', input.id);

      if (serviceTagsError) throw serviceTagsError;

      if (serviceTagsCount && serviceTagsCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete client with associated service tags'
        });
      }

      const { count: ticketsCount, error: ticketsError } = await ctx.supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', input.id);

      if (ticketsError) throw ticketsError;

      if (ticketsCount && ticketsCount > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete client with associated tickets'
        });
      }

      // If no related records, proceed with deletion
      const { error } = await ctx.supabase
        .from('clients')
        .delete()
        .eq('id', input.id);

      if (error) throw error;
      return SuccessResponseSchema.parse({ success: true });
    }),
});
