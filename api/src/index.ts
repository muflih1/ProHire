import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import trpcRoutes from './routes/trpc.route.js';
import authRoutes from './routes/auth.route.js';
// import uploadRoutes from './routes/upload.route.js';
// import organizationRoutes from './routes/organization.route.js';
import {errorHandler} from './middlewares/error-handler.middleware.js';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import {env, getEnv} from './env.js';
import {requestContextHandler} from './utils/request-response.js';
import {deserializeSession} from './lib/session.js';
import type {appRouter} from './trpc/routers/_app.js';
import {stripe} from './lib/stripe.js';
import {addMonths, addYears} from 'date-fns';
import {db} from './db/index.js';
import catchAsync from './utils/catch-async.js';
import {
  organizationPaymentsTable,
  organizationSubscriptionsTable,
} from './db/schema.js';

const app = express();

app
  .post(
    '/webhook',
    express.raw({type: 'application/json'}),
    catchAsync(async (req, res) => {
      const sig = req.headers['stripe-signature'];
      let event: ReturnType<typeof stripe.webhooks.constructEvent>;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig!,
          env.STRIPE_WEBHOOK_SECRET,
        );
      } catch (error) {
        console.log({error});
        return res.status(400).send(`Webhook error`);
      }
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orgID = session.metadata!.organizationID;
        const planID = session.metadata!.planID;
        const planPeriod = session.metadata!.planPeriod as 'monthly' | 'annual';

        const amount = session.amount_total!;
        const currency = session.currency!;

        const now = new Date();

        const periodEnd =
          planPeriod === 'monthly' ? addMonths(now, 1) : addYears(now, 1);

        const [subscription] = await db
          .insert(organizationSubscriptionsTable)
          .values({
            organizationID: BigInt(orgID!),
            planID: BigInt(planID!),
            planPeriod,
            amount,
            currency,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          })
          .returning();

        await db.insert(organizationPaymentsTable).values({
          subscriptionID: subscription!.id,
          stripePaymentIntentID: session.payment_intent as string,
          amount,
          currency,
          status: 'paid',
          paidAt: now,
        });
      }
      return res.json({received: true});
    }),
  )
  .use(express.json())
  .use(express.urlencoded({extended: true}))
  .use(cors({origin: 'http://localhost:5173', credentials: true}))
  .use(cookieParser())
  .use(morgan('dev'))
  .use(requestContextHandler)
  .use(deserializeSession);

app.use('/api/auth', authRoutes);
// app.use('/api/organizations', organizationRoutes);
// app.use('/api/upload', uploadRoutes);
app.use('/api/trpc', trpcRoutes);

app.use(errorHandler);

const PORT = Number(getEnv('PORT', '5000'));
app.listen(PORT, async () => {
  console.log(`Listening at http://localhost:${PORT}`);
});

export type AppRouter = typeof appRouter;
