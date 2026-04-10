import {eq, sql, asc, and, or, isNull, gt} from 'drizzle-orm';
import {authorizedProcedure, createTRPCRouter} from '../init.js';
import {
  featuresTable,
  organizationsTable,
  organizationSubscriptionsTable,
  planFeaturesTable,
  plansTable,
} from '../../db/schema.js';
import z from 'zod';
import {TRPCError} from '@trpc/server';
import {stripe} from '../../lib/stripe.js';

const PLAN_ORDER = {
  free_org: 0,
  basic: 1,
  growth: 2,
  enterprise: 3,
} as const;

export const billingsRouter = createTRPCRouter({
  listPlans: authorizedProcedure(
    {permission: 'org:job_listing:read'},
    "You don't have permission",
  ).query(async ({ctx}) => {
    const plans = await ctx.db
      .select({
        id: plansTable.id,
        name: plansTable.name,
        amount: plansTable.amountInPaise,
        annualMonthlyAmount: plansTable.annualMonthlyAmountInPaise,
        annualAmount: plansTable.annualAmount,
        description: sql<string>`coalesce(${plansTable.description}, '')`.as(
          'description',
        ),
        isDefault: plansTable.isDefault,
        isRecurring: plansTable.isRecurring,
        publiclyVisible: plansTable.publiclyVisible,
        key: plansTable.key,
        features: sql<{name: string; key: string}[]>`
          json_agg(
            json_build_object(
              'name', ${featuresTable.name},
              'key', ${featuresTable.key}
            )
          )
        `.as('features'),
        freeTrialEnabled: plansTable.freeTrialEnabled,
        freeTrialDays: plansTable.freeTrialDays,
      })
      .from(plansTable)
      .innerJoin(planFeaturesTable, eq(planFeaturesTable.planID, plansTable.id))
      .innerJoin(
        featuresTable,
        and(
          eq(featuresTable.id, planFeaturesTable.featureID),
          eq(featuresTable.publiclyVisible, true),
        ),
      )
      .where(eq(plansTable.publiclyVisible, true))
      .groupBy(plansTable.id)
      .orderBy(asc(plansTable.id));

    return plans;
  }),

  subscribe: authorizedProcedure(
    {permission: 'org:billing:manage'},
    "You don't have permission to manage billing",
  )
    .input(
      z.object({planID: z.bigint(), planPeriod: z.enum(['monthly', 'annual'])}),
    )
    .mutation(async ({ctx, input}) => {
      const orgID = ctx.organization.id;
      const plan = await ctx.db.query.plansTable.findFirst({
        where: (fields, {eq}) => eq(fields.id, input.planID),
      });
      if (!plan) {
        throw new TRPCError({code: 'NOT_FOUND'});
      }
      const existing =
        await ctx.db.query.organizationSubscriptionsTable.findFirst({
          where: (fields, {eq, and}) =>
            and(eq(fields.organizationID, orgID), eq(fields.status, 'active')),
        });
      if (existing) {
        await ctx.db
          .update(organizationSubscriptionsTable)
          .set({status: 'canceled', canceledAt: new Date()})
          .where(and(eq(organizationSubscriptionsTable.id, existing.id)));
      }
      const amount =
        input.planPeriod === 'monthly'
          ? plan.amountInPaise
          : (plan.annualAmount ?? plan.amountInPaise * 12);
      let customerID = ctx.organization._stripeCustomerID;
      if (!customerID) {
        const customer = await stripe.customers.create({
          name: ctx.organization.name,
          metadata: {
            organizationID: orgID.toString(),
          },
        });
        customerID = customer.id;
        await ctx.db
          .update(organizationsTable)
          .set({stripeCustomerID: customerID})
          .where(eq(organizationsTable.id, orgID));
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerID,
        line_items: [
          {
            price_data: {
              currency: plan.currency,
              product_data: {
                name: plan.name,
                description: (plan.description ?? undefined) as any,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          setup_future_usage: 'off_session',
        },
        success_url: 'http://localhost:5173/employer',
        cancel_url: 'http://localhost:5173/employer/pricing',
        metadata: {
          organizationID: orgID.toString(),
          planID: plan.id.toString(),
          planPeriod: input.planPeriod,
        },
      });

      return {url: session.url};
    }),

  listSubscriptions: authorizedProcedure(
    {permission: 'org:billing:read'},
    "You don't have permission",
  ).query(async ({ctx, input}) => {
    // const subscriptions = await ctx.db
    //   .select({
    //     id: organizationSubscriptionsTable.id,
    //     status: organizationSubscriptionsTable.status,
    //     planID: organizationSubscriptionsTable.planID,
    //     planPeriod: organizationSubscriptionsTable.planPeriod,
    //     currentPeriodStart: organizationSubscriptionsTable.currentPeriodStart,
    //     currentPeriodEnd: organizationSubscriptionsTable.currentPeriodEnd,
    //     canceledAt: organizationSubscriptionsTable.canceledAt,
    //     pastDueAt: organizationSubscriptionsTable.pastDueAt,
    //     endedAt: organizationSubscriptionsTable.endedAt,
    //     createdAt: organizationSubscriptionsTable.createdAt,
    //     updatedAt: organizationSubscriptionsTable.updatedAt,
    //   })
    //   .from(organizationSubscriptionsTable)
    //   .where(
    //     and(
    //       eq(
    //         organizationSubscriptionsTable.organizationID,
    //         ctx.organization.id,
    //       ),
    //       or(
    //         eq(organizationSubscriptionsTable.status, 'active'),
    //         eq(organizationSubscriptionsTable.status, 'upcoming'),
    //       ),
    //       or(
    //         isNull(organizationSubscriptionsTable.canceledAt),
    //         gt(organizationSubscriptionsTable.canceledAt, new Date()),
    //       ),
    //     ),
    //   );

    const subscriptions =
      await ctx.db.query.organizationSubscriptionsTable.findMany({
        where: and(
          eq(
            organizationSubscriptionsTable.organizationID,
            ctx.organization.id,
          ),
          or(
            eq(organizationSubscriptionsTable.status, 'active'),
            eq(organizationSubscriptionsTable.status, 'upcoming'),
          ),
          or(
            isNull(organizationSubscriptionsTable.canceledAt),
            gt(organizationSubscriptionsTable.canceledAt, new Date()),
          ),
        ),
        columns: {
          organizationID: false,
          currency: false,
          amount: false,
          cancelAtPeriodEnd: false
        },
      });

    return subscriptions;
  }),
});
