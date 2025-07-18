import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../init';
import { z } from 'zod';

// Define schemas
const CommentIdSchema = z.object({
  id: z.string().uuid("Invalid comment ID format")
});

const TicketIdSchema = z.object({
  ticket_id: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format")
});

const AddCommentSchema = z.object({
  ticket_id: z.string().regex(/^TK-\d{6}$/, "Invalid ticket ID format"),
  content: z.string().min(1, "Comment content cannot be empty"),
  photo_urls: z.array(z.string().url("Invalid URL format")).optional()
});

const DeleteCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID format")
});

// Define output schema for comments
export const CommentSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string(),
  user_id: z.string().uuid(),
  user_name: z.string(),
  user_role: z.enum(['admin', 'technician', 'client']),
  content: z.string(),
  photo_urls: z.array(z.string().url()).nullable(),
  created_at: z.string(),
  updated_at: z.string()
});

// Export type for use in components
export type Comment = z.infer<typeof CommentSchema>;
export type CommentsListOutput = z.infer<typeof CommentsListOutputSchema>;

const CommentsListOutputSchema = z.array(CommentSchema);

export const commentsRouter = createTRPCRouter({
  // Get all comments for a ticket
  getByTicketId: protectedProcedure
    .input(TicketIdSchema)
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('active_ticket_comments')
        .select('*')
        .eq('ticket_id', input.ticket_id)
        .order('created_at', { ascending: true });

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch comments: ${error.message}`,
        cause: error
      });

      return CommentsListOutputSchema.parse(data);
    }),

  // Add a new comment
  add: protectedProcedure
    .input(AddCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the current user's ID
      const userId = ctx.user.id;
      
      // Call the database function to add a comment
      const { data, error } = await ctx.supabase.rpc('add_ticket_comment', {
        p_ticket_id: input.ticket_id,
        p_user_id: userId,
        p_content: input.content,
        p_photo_urls: input.photo_urls || null
      });

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to add comment: ${error.message}`,
        cause: error
      });

      return { success: true, comment_id: data };
    }),

  // Delete a comment (soft delete)
  delete: protectedProcedure
    .input(DeleteCommentSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the current user's ID
      const userId = ctx.user.id;
      
      // Call the database function to delete a comment
      const { data, error } = await ctx.supabase.rpc('delete_ticket_comment', {
        p_comment_id: input.comment_id,
        p_user_id: userId
      });

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to delete comment: ${error.message}`,
        cause: error
      });

      return { success: true };
    }),
});
