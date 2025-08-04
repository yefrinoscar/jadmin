import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import type { TRPCError } from '@trpc/server';
import { appRouter } from '@/trpc/api/root';
import { createTRPCContext } from '@/trpc/context';


const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }: { path: string | undefined; error: TRPCError }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST }; 