import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../init';
import {
  CreateServiceTagInputSchema,
  UpdateServiceTagInputSchema,
  IdParamSchema,
  ClientIdParamSchema,
  SuccessResponseSchema
} from '@/lib/schemas';

export const serviceTagsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
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
