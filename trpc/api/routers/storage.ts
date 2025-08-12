import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../../init';
import { z } from 'zod';

// Define schemas
const UploadFileSchema = z.object({
  bucket: z.string(),
  path: z.string(),
  file: z.string(), // base64 encoded file content
  contentType: z.string()
});

export const storageRouter = createTRPCRouter({
  // Upload a file to Supabase Storage
  uploadFile: protectedProcedure
    .input(UploadFileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(input.file, 'base64');
        
        // Upload file to Supabase Storage
        const { data, error } = await ctx.supabase.storage
          .from(input.bucket)
          .upload(input.path, buffer, {
            contentType: input.contentType,
            upsert: true
          });
          
        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to upload file: ${error.message}`,
            cause: error
          });
        }
        
        // Get public URL for the uploaded file
        const { data: urlData } = ctx.supabase.storage
          .from(input.bucket)
          .getPublicUrl(data.path);
          
        return {
          success: true,
          url: urlData.publicUrl,
          path: data.path
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `File upload failed: ${error.message}`,
          cause: error
        });
      }
    }),
});
