import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../../init';

// Register functionality has been moved to the usersRouter

export const authRouter = createTRPCRouter({
  getSession: publicProcedure.query(async ({ ctx }) => {      
    return ctx.auth;
  }),
});
