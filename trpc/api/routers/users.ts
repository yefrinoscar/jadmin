import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../init';
import {
  CreateUserInputSchema,
  UpdateUserInputSchema,
  IdParamSchema,
  SuccessResponseSchema,
} from '@/lib/schemas';
import { createAdminClient } from '@/lib/utils/supabase-client';
import { User } from '@supabase/supabase-js';

// Helper function to check user role from database to avoid RLS recursion
async function checkUserRole(ctx: any, allowedRoles: string[]) {
  // This initial query is necessary to avoid RLS recursion
  const { data: currentUser, error: userError } = await ctx.supabase
    .from('users')
    .select('role')
    .eq('id', ctx.user.id)
    .single();
  
  if (userError || !currentUser || !allowedRoles.includes(currentUser.role)) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: `Access requires one of these roles: ${allowedRoles.join(', ')}` 
    });
  }
  return currentUser.role;
}

export const usersRouter = createTRPCRouter({
  // Get current user information including role
  getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
    const { data: currentUser, error } = await ctx.supabase
      .from('users')
      .select('*')
      .eq('id', ctx.user.id)
      .single();
    
    if (error) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No se pudo obtener la información del usuario actual'
      });
    }
    
    return currentUser;
  }),

  // Get all users
  getAll: protectedProcedure.query(async ({ ctx }) => {
    // Check if user has admin or technician role
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
    // Check if user has admin role
    const userRole = await checkUserRole(ctx, ['superadmin', 'admin']);
    
    // Only superadmin can create superadmin users
    if (userRole !== 'superadmin' && input.role === 'superadmin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Solo un superadmin puede crear usuarios con rol de superadmin'
      });
    }
    
    // Create a Supabase admin client for privileged operations
    const supabaseAdmin = await createAdminClient();
    try {
      // Create the user in Supabase Auth using admin client
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        
        user_metadata: {
          name: input.name,
          role: input.role,
          is_disabled: false, // Add is_disabled field to user metadata
          display_name: input.name,
          // Include client_id in metadata if role is client and client_id is provided
          ...(input.role === 'client' && input.client_id ? { client_id: input.client_id } : {})
        },
        email_confirm: true
      });

      if (authError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Error al registrar usuario: ${authError.message}`
        });
      }
      
      // Extract the user ID from the response safely
      const authUserAny = authUser as any;
      const userId = authUserAny?.user?.id || authUserAny?.id;

      // Create the user in the users table
      const userData = {
        id: userId, // Use the auth user ID as the primary key
        email: input.email,
        name: input.name,
        role: input.role,
        is_disabled: false, // Add is_disabled field to database record
        // Add client_id if role is client and client_id is provided
        ...(input.role === 'client' && input.client_id ? { client_id: input.client_id } : {})
      };
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('Error al crear usuario en la base de datos:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Error al crear usuario en la base de datos: ${error.message}`
        });
      }

      return {
        success: true,
        user: data
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Ocurrió un error desconocido'
      });
    }
  }),


  update: protectedProcedure
    .input(UpdateUserInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin role
      const userRole = await checkUserRole(ctx, ['superadmin', 'admin']);

      try {
        // Create a Supabase admin client for privileged operations
        const supabaseAdmin = await createAdminClient();
        
        // Get the target user's role to check permissions
        const { data: targetUser, error: targetUserError } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', input.id)
          .single();
          
        if (targetUserError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al obtener información del usuario: ${targetUserError.message}`
          });
        }
        
        // Admin users cannot modify superadmin users
        if (userRole !== 'superadmin' && targetUser.role === 'superadmin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No tienes permisos para modificar usuarios con rol de superadmin'
          });
        }
        
        // Prevent changing the role after user creation
        if (input.role && input.role !== targetUser.role) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No se puede cambiar el rol después de crear un usuario'
          });
        }
        
        // Admin users cannot promote users to superadmin
        if (userRole !== 'superadmin' && input.role === 'superadmin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Solo un superadmin puede asignar el rol de superadmin'
          });
        }
        
        // Get current user metadata
        const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(input.id);
        
        if (getUserError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al obtener información del usuario: ${getUserError.message}`
          });
        }
        
        const currentMetadata = userData?.user?.user_metadata || {};
        
        // Update Supabase Auth metadata
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          input.id,
          { 
            user_metadata: {
              ...currentMetadata,
              // Keep the existing role, don't update it
              display_name: input.name
            }
          }
        );

        if (authError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al actualizar usuario en autenticación: ${authError.message}`
          });
        }
        
        // Update user in database
        const { id, ...updateData } = input;
        const { data, error: dbError } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (dbError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al actualizar usuario en la base de datos: ${dbError.message}`
          });
        }

        return data;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      }
    }),

  delete: protectedProcedure
    .input(IdParamSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin role
      await checkUserRole(ctx, ['superadmin', 'admin']);

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

  toggleUserStatus: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      isDisabled: z.boolean()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin role
      const userRole = await checkUserRole(ctx, ['superadmin', 'admin']);
      
      try {
        // Use the admin client to update user status
        const supabaseAdmin = await createAdminClient();
        
        // Get the target user's role to check permissions
        const { data: targetUser, error: targetUserError } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', input.id)
          .single();
          
        if (targetUserError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al obtener información del usuario: ${targetUserError.message}`
          });
        }
        
        // Admin users cannot modify superadmin users
        if (userRole !== 'superadmin' && targetUser.role === 'superadmin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No tienes permisos para modificar usuarios con rol de superadmin'
          });
        }
        
        // Update user in Supabase Auth - both ban_duration and user_metadata
        const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(input.id);
        
        if (getUserError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al obtener información del usuario: ${getUserError.message}`
          });
        }
        
        // Get current user metadata
        const currentMetadata = userData?.user?.user_metadata || {};
        
        // Update user with both ban_duration and updated metadata
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          input.id,
          { 
            ban_duration: input.isDisabled ? '87600h' : undefined, // ~10 years if disabling, undefined to enable
            user_metadata: {
              ...currentMetadata,
              is_disabled: input.isDisabled
            }
          }
        );

        if (authError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al ${input.isDisabled ? 'desactivar' : 'activar'} usuario: ${authError.message}`
          });
        }

        // Also update the is_disabled field in our database to track the disabled status
        const { data, error: dbError } = await supabaseAdmin
          .from('users')
          .update({ is_disabled: input.isDisabled })
          .eq('id', input.id)
          .select()
          .single();

        if (dbError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al actualizar estado en la base de datos: ${dbError.message}`
          });
        }

        return data;
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      }
    }),

  deleteUser: protectedProcedure
    .input(z.object({
      id: z.string().uuid()
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user has admin role
      const userRole = await checkUserRole(ctx, ['superadmin', 'admin']);
      
      try {
        const supabaseAdmin = await createAdminClient();
        
        // Get the target user's role to check permissions
        const { data: targetUser, error: targetUserError } = await supabaseAdmin
          .from('users')
          .select('role')
          .eq('id', input.id)
          .single();
          
        if (targetUserError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al obtener información del usuario: ${targetUserError.message}`
          });
        }
        
        // Admin users cannot delete superadmin users
        if (userRole !== 'superadmin' && targetUser.role === 'superadmin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No tienes permisos para eliminar usuarios con rol de superadmin'
          });
        }
        console.log(input);
        
        // First, check if the user has any assigned tickets
        const { count, error: countError } = await ctx.supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', input.id);

          console.log(count, countError);
        
        if (countError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al verificar tickets asignados: ${countError.message}`
          });
        }
        
        // If user has tickets, don't allow deletion
        if (count && count > 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No se puede eliminar un usuario con tickets asignados'
          });
        }
        
        // Delete user from Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(input.id);
        
        if (authError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error al eliminar usuario de autenticación: ${authError.message}`
          });
        }
        
        // The database record should be deleted automatically via cascade delete
        // but we can verify it was deleted
        const { data: checkUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', input.id)
          .single();
          
        if (checkUser) {
          // If the user still exists in the database, delete it manually
          const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', input.id);
            
          if (dbError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Error al eliminar usuario de la base de datos: ${dbError.message}`
            });
          }
        }
        
        return { success: true, message: 'Usuario eliminado correctamente' };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred'
        });
      }
    }),
});
