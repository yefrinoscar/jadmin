import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../init';
import { z } from 'zod';
import { base64ToFile } from '../../../app/api/public-tickets/utils';

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
  files: z.array(z.object({
    data: z.string(), // base64 encoded file content
    name: z.string(),
    type: z.string()
  })).optional()
});

const DeleteCommentSchema = z.object({
  comment_id: z.string().uuid("Invalid comment ID format")
});

// Define output schema for comments
export const CommentSchema = z.object({
  id: z.string().uuid(),
  ticket_id: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  user_role: z.string(),
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
      let photo_urls: string[] = [];
      
      // Handle file uploads if files are provided
      if (input.files && input.files.length > 0) {
        try {
          // Upload each file to Supabase Storage
          const uploadPromises = input.files.map(async (file) => {
            // Convert base64 to File object using the base64ToFile function
            const fileObj = await base64ToFile(file.data, file.name);
            
            // Convert File to buffer for storage
            const arrayBuffer = await fileObj.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Generate a unique filename
            const fileExt = file.name.split('.').pop() || 'file';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `/tickets-comments/${input.ticket_id}/${fileName}`;
            
            // Upload file to Supabase Storage
            const { data, error } = await ctx.supabase.storage
              .from('images')
              .upload(filePath, buffer, {
                contentType: fileObj.type,
                upsert: true
              });
              
            if (error) {
              throw new Error(`Failed to upload file: ${error.message}`);
            }
            
            // Get public URL for the uploaded file
            const { data: urlData } = ctx.supabase.storage
              .from('images')
              .getPublicUrl(data.path);
              
            return urlData.publicUrl;
          });
          
          // Wait for all uploads to complete
          photo_urls = await Promise.all(uploadPromises);
        } catch (error: any) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `File upload failed: ${error.message}`,
            cause: error
          });
        }
      }
      
      // Call the database function to add a comment
      const { data, error } = await ctx.supabase.rpc('add_ticket_comment', {
        p_ticket_id: input.ticket_id,
        p_user_id: ctx.auth.userId,
        p_content: input.content,
        p_photo_urls: photo_urls.length > 0 ? photo_urls : null
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
      
      // Call the database function to delete a comment
      const { data, error } = await ctx.supabase.rpc('delete_ticket_comment', {
        p_comment_id: input.comment_id,
        p_user_id: ctx.auth.userId
      });

      if (error) throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to delete comment: ${error.message}`,
        cause: error
      });

      return { success: true };
    }),
});
