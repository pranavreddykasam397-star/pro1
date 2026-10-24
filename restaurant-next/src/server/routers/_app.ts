import { router } from '../trpc';
import { menuRouter } from './menu';
import { orderRouter } from './order';
import { customerRouter } from './customer';
import { settingsRouter } from './settings';
import { authRouter } from './auth';

export const appRouter = router({
  menu: menuRouter,
  order: orderRouter,
  customer: customerRouter,
  settings: settingsRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
