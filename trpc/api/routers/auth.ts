import { createTRPCRouter, publicProcedure } from '../../init';
// Register functionality has been moved to users router


export const authRouter = createTRPCRouter({
  // Auth routes
  getSession: publicProcedure.query(async ({ ctx }) => {
    return ctx.user;
  })
  
  // Register functionality has been moved to usersRouter
});
