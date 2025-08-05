import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../init';
import { EmailService } from '../../../lib/services/email-service';
import {
  UpdateUserInputSchema,
  IdParamSchema,
  SuccessResponseSchema,
  UserRoleSchema,
  ClerkUserSchema,
  ClerkUser,
} from '@/lib/schemas';
import { clerkClient } from '@/lib/utils/clerk-backend';

export const usersRouter = createTRPCRouter({
  getCurrentUser: protectedProcedure.output(ClerkUserSchema).query(async ({ ctx }) => {
    // Return the user as ClerkUserWithMetadata to ensure proper typing
    const user: ClerkUser = {
      id: ctx.user?.id || '',
      publicMetadata: ctx.user?.publicMetadata || {},
      privateMetadata: ctx.user?.privateMetadata || {},
      unsafeMetadata: ctx.user?.unsafeMetadata || {}, 
      lastActiveAt: ctx.user?.lastActiveAt || 0,
      createOrganizationEnabled: ctx.user?.createOrganizationEnabled || false,
      createOrganizationsLimit: ctx.user?.createOrganizationsLimit || 0,
      deleteSelfEnabled: ctx.user?.deleteSelfEnabled || false,
      legalAcceptedAt: ctx.user?.legalAcceptedAt || 0,
      passwordEnabled: ctx.user?.passwordEnabled || false,
      totpEnabled: ctx.user?.totpEnabled || false,
      backupCodeEnabled: ctx.user?.backupCodeEnabled || false,
      twoFactorEnabled: ctx.user?.twoFactorEnabled || false,
      banned: ctx.user?.banned || false,
      locked: ctx.user?.locked || false,
      createdAt: ctx.user?.createdAt || 0,
      updatedAt: ctx.user?.updatedAt || 0,
      imageUrl: ctx.user?.imageUrl || '',
      hasImage: ctx.user?.hasImage || false,
      primaryEmailAddressId: ctx.user?.primaryEmailAddressId || '',
      primaryPhoneNumberId: ctx.user?.primaryPhoneNumberId || '',
      primaryWeb3WalletId: ctx.user?.primaryWeb3WalletId || '',
      lastSignInAt: ctx.user?.lastSignInAt || 0,
      externalId: ctx.user?.externalId || '',
      username: ctx.user?.username || '',
      firstName: ctx.user?.firstName || '',
      lastName: ctx.user?.lastName || '',
    }
    return user as ClerkUser;
  }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const role = ctx.user?.publicMetadata.role as string;

    if (!['superadmin', 'admin', 'technician'].includes(role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to view all users.',
      });
    }

    try {
      const { data, error } = await ctx.supabase
        .from('users')
        .select('*, clients:client_id (id, name, company_name)')
        .order('created_at', { ascending: false });

        console.warn('data', data)
        console.warn('data1', ctx.supabase)
        console.warn('errortry', error)
  
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      
      return data;
    } catch (error) {
      console.warn('error', error);
      throw new TRPCError(error as TRPCError);
    }
  }),

  create: protectedProcedure
    .input(
      z
        .object({
          email: z.string().email('Please enter a valid email address'),
          name: z.string().min(1, 'Name is required'),
          role: UserRoleSchema,
          password: z.string().min(6, 'Password must be at least 6 characters').optional(),
          client_id: z.string().uuid('Please select a valid client').optional()
        })
        .refine(
          (data) => {
            if (data.role === 'client') {
              return !!data.client_id;
            }
            return true;
          },
          {
            message: "Client selection is required for users with 'client' role",
            path: ['client_id'],
          }
        )
    )
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create users.',
        });
      }

      if (role !== 'superadmin' && input.role === 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only a superadmin can create superadmin users.',
        });
      }

      
      try {
        let clientId = input.client_id;

        if (input.role === 'client') {

          const { data: newClient, error: clientError } = await ctx.supabase
            .from('clients')
            .insert([
              {
                name: input.name,
                email: input.email,
              },
            ])
            .select()
            .single();

          if (clientError) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Error creating client: ${clientError.message}`,
            });
          }
          clientId = newClient?.id;
        }

        const response = await clerkClient.users.createUser({
          emailAddress: [input.email],
          password: input.password,
          publicMetadata: {
            role: input.role,
            is_disabled: false,
            ...(input.role === 'client' && clientId ? { client_id: clientId } : {}),
          }
        })  

        if (!response.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error registering user`,
          });
        }

        const userId = response.id;

        const userData = {
          id: userId,
          email: input.email,
          name: input.name,
          role: input.role,
          is_disabled: false,
          ...(input.role === 'client' && clientId ? { client_id: clientId } : {}),
        };

        const { data, error } = await ctx.supabase.from('users').insert([userData]).select().single();

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Error creating user in database: ${error.message}`,
          });
        }

        console.log('User created successfully:', data, input.password);

        // Send welcome email with login credentials if password was provided
        if (input.password) {
          const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
          const companyName = process.env.COMPANY_NAME || 'JAdmin';
          
          console.log('Sending email to', input.email, 'with login URL', loginUrl, 'and company name', companyName);
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

          // Call the email API endpoint asynchronously to not block the response
          fetch(`${baseUrl}/api/email-access`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: input.email,
              password: input.password,
              loginUrl: `${loginUrl}/login`,
              companyName
            }),
          }).then(async (response) => {
            console.log('response', response);
            
            if (!response.ok) {
              const errorData = await response.json();
              console.error('Failed to send user access email:', errorData.error);
            }
          }).catch(error => {
            console.error('Error calling email API:', error);
          });
        }
        
        return { success: true, user: data };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    }),

  update: protectedProcedure.input(UpdateUserInputSchema).mutation(async ({ ctx, input }) => {
    const role = ctx.user?.publicMetadata.role as string;
    if (!['superadmin', 'admin'].includes(role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to update users.',
      });
    }

    try {

      const { data: targetUser, error: targetUserError } = await ctx.supabase
        .from('users')
        .select('role')
        .eq('id', input.id)
        .single();

      if (targetUserError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Error fetching user info: ${targetUserError.message}`,
        });
      }

      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }

      if (role !== 'superadmin' && targetUser.role === 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify superadmin users.',
        });
      }

      if (input.role && input.role !== targetUser.role) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'User role cannot be changed after creation.',
        });
      }

      if (role !== 'superadmin' && input.role === 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only a superadmin can assign the superadmin role.',
        });
      }

      const user = await clerkClient.users.getUser(
        input.id
      );

      if (!user) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Error fetching user info`,
        });
      }

      const currentMetadata = user.publicMetadata || {};

      const updateUser = await clerkClient.users.updateUser(input.id, {
        publicMetadata: {
          ...currentMetadata,
          display_name: input.name,
        },
      });

      if (!updateUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Error updating user in authentication`,
        });
      }

      const { id, ...updateData } = input;
      const { data, error: dbError } = await ctx.supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (dbError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Error updating user in database: ${dbError.message}`,
        });
      }

      return data;
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }),

  delete: protectedProcedure.input(IdParamSchema).mutation(async ({ ctx, input }) => {
    const role = ctx.user?.publicMetadata.role as string;
    if (!['superadmin', 'admin'].includes(role)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete users.',
      });
    }

    try {
      const { data: targetUser, error: targetUserError } = await ctx.supabase
        .from('users')
        .select('role')
        .eq('id', input.id)
        .single();

      if (targetUserError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Error fetching user info: ${targetUserError.message}`,
        });
      }

      if (!targetUser) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }

      if (role !== 'superadmin' && targetUser.role === 'superadmin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete superadmin users.',
        });
      }

      const { count, error: countError } = await ctx.supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', input.id);

      if (countError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Error checking for assigned tickets: ${countError.message}`,
        });
      }

      if (count && count > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete user with assigned tickets. Please reassign them first.',
        });
      }

      const deleteUser = await clerkClient.users.deleteUser(input.id);

      if (!deleteUser) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Error deleting user from authentication`,
        });
      }

      const { error: dbError } = await ctx.supabase.from('users').delete().eq('id', input.id);

      if (dbError) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Error deleting user from database: ${dbError.message}`,
        });
      }

      return SuccessResponseSchema.parse({ success: true });
    } catch (error) {
      if (error instanceof TRPCError) throw error;

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  }),

  getAssignableUsers: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('users')
      .select('id, name, email, role')
      .in('role', ['admin', 'technician'])
      .order('name', { ascending: true });

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }
    return data;
  }),

  toggleUserStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        isDisabled: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const role = ctx.user?.publicMetadata.role as string;
      if (!['superadmin', 'admin'].includes(role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify user status.',
        });
      }

      try {
        const { data: targetUser, error: targetUserError } = await ctx.supabase
          .from('users')
          .select('role')
          .eq('id', input.id)
          .single();

        if (targetUserError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error fetching user info: ${targetUserError.message}`,
          });
        }

        if (!targetUser) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }

        const authUserData = await clerkClient.users.getUser(
          input.id
        );

        if (!authUserData) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error fetching user info`,
          });
        }

        const currentMetadata = authUserData.publicMetadata || {};

        const updateUser = await clerkClient.users.updateUser(input.id, {
          publicMetadata: { ...currentMetadata, is_disabled: input.isDisabled },
        });

        console.log(updateUser);
        

        if (!updateUser) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error ${input.isDisabled ? 'disabling' : 'enabling'} user`,
          });
        }

        const { data, error: dbError } = await ctx.supabase
          .from('users')
          .update({ is_disabled: input.isDisabled })
          .eq('id', input.id)
          .select();

        if (dbError) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Error updating user status in database: ${dbError.message}`,
          });
        }

        return data;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'An unknown error occurred',
        });
      }
    }),
});
