import { createTRPCRouter } from '../init'
import { usersRouter } from './routers/users'
import { clientsRouter } from './routers/clients'
import { serviceTagsRouter } from './routers/service-tags'
import { ticketsRouter } from './routers/tickets'
import { authRouter } from './routers/auth'
import { commentsRouter } from './routers/comments'

export const appRouter = createTRPCRouter({
  users: usersRouter,
  clients: clientsRouter,
  serviceTags: serviceTagsRouter,
  tickets: ticketsRouter,
  auth: authRouter,
  comments: commentsRouter
})

export type AppRouter = typeof appRouter