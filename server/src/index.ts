
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createFriendInputSchema, 
  updateFriendInputSchema, 
  deleteByIdInputSchema,
  createBirthdayInputSchema,
  updateBirthdayInputSchema,
  getCalendarDataInputSchema
} from './schema';

import { createFriend } from './handlers/create_friend';
import { getFriends } from './handlers/get_friends';
import { updateFriend } from './handlers/update_friend';
import { deleteFriend } from './handlers/delete_friend';
import { createBirthday } from './handlers/create_birthday';
import { getBirthdays } from './handlers/get_birthdays';
import { updateBirthday } from './handlers/update_birthday';
import { deleteBirthday } from './handlers/delete_birthday';
import { getCalendarData } from './handlers/get_calendar_data';
import { getBirthdaysByMonth } from './handlers/get_birthdays_by_month';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Friend management
  createFriend: publicProcedure
    .input(createFriendInputSchema)
    .mutation(({ input }) => createFriend(input)),
  
  getFriends: publicProcedure
    .query(() => getFriends()),
  
  updateFriend: publicProcedure
    .input(updateFriendInputSchema)
    .mutation(({ input }) => updateFriend(input)),
  
  deleteFriend: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteFriend(input)),
  
  // Birthday management
  createBirthday: publicProcedure
    .input(createBirthdayInputSchema)
    .mutation(({ input }) => createBirthday(input)),
  
  getBirthdays: publicProcedure
    .query(() => getBirthdays()),
  
  updateBirthday: publicProcedure
    .input(updateBirthdayInputSchema)
    .mutation(({ input }) => updateBirthday(input)),
  
  deleteBirthday: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteBirthday(input)),
  
  // Calendar specific queries
  getCalendarData: publicProcedure
    .input(getCalendarDataInputSchema)
    .query(({ input }) => getCalendarData(input)),
  
  getBirthdaysByMonth: publicProcedure
    .input(getCalendarDataInputSchema.omit({ month: true }).extend({ month: getCalendarDataInputSchema.shape.month.unwrap() }))
    .query(({ input }) => getBirthdaysByMonth(input.year, input.month)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
