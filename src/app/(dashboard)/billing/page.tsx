/**
 * Billing Page
 *
 * Membership subscription management and payment history.
 */

import type { Metadata } from 'next';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { membershipProducts, formatPrice } from '@/lib/paypal/products';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Star,
  Users,
  GraduationCap,
  ArrowRight,
  Receipt,
} from 'lucide-react';
import { BillingActions } from './billing-actions';

export const metadata: Metadata = {
  title: 'Billing',
  description: 'Manage your membership and billing',
};

export default async function BillingPage() {
  const session = await getSession();

  // Parallel queries for better performance
  const [membership, payments] = await Promise.all([
    prisma.membership.findUnique({
      where: { userId: session!.user.id },
    }),
    prisma.payment.findMany({
      where: { userId: session!.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const isActive = membership?.status === 'ACTIVE';
  const currentTier = membership?.type || 'NONE';
  const currentProduct =
    membershipProducts[currentTier as keyof typeof membershipProducts];

  const tierIcons: Record<string, typeof Star> = {
    INDIVIDUAL: Star,
    FAMILY: Users,
    STUDENT: GraduationCap,
    LIFETIME: Star,
  };
  const TierIcon = tierIcons[currentTier as keyof typeof tierIcons] || Star;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        Billing & Subscription
      </h1>

      {/* Current Plan */}
      <div className="rounded-xl border border-border bg-card mb-8">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Current Plan
          </h2>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`rounded-full p-3 ${
                  isActive ? 'bg-green-500/20' : 'bg-muted'
                }`}
              >
                <TierIcon
                  className={`h-6 w-6 ${
                    isActive ? 'text-green-400' : 'text-muted-foreground'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">
                    {currentProduct?.name || 'Free'} Membership
                  </h3>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  ) : membership?.status === 'SUSPENDED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-400">
                      <AlertCircle className="h-3 w-3" />
                      Suspended
                    </span>
                  ) : membership?.status === 'EXPIRED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      Expired
                    </span>
                  ) : null}
                </div>
                <p className="text-muted-foreground mt-1">
                  {currentProduct?.description || 'Basic access to SPAC resources'}
                </p>
                {membership?.paypalCurrentPeriodEnd && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {membership.cancelledAt
                      ? 'Cancels on '
                      : 'Next billing date: '}
                    {new Date(membership.paypalCurrentPeriodEnd).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }
                    )}
                  </p>
                )}
              </div>
            </div>

            <BillingActions
              hasSubscription={!!membership?.paypalSubscriptionId}
              isActive={isActive}
              currentTier={currentTier}
            />
          </div>
        </div>

        {/* Plan Features */}
        {currentProduct && (
          <div className="border-t border-border p-6">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              Included in your plan:
            </h4>
            <ul className="grid gap-2 sm:grid-cols-2">
              {currentProduct.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 text-sm text-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Upgrade Options (for free/expired members) */}
      {(!membership || !isActive) && (
        <div className="rounded-xl border border-border bg-card mb-8">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Upgrade Your Membership
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.values(membershipProducts)
                .filter((p) => p.tier !== 'FREE')
                .map((product) => {
                  const Icon =
                    tierIcons[product.tier as keyof typeof tierIcons];
                  return (
                    <div
                      key={product.tier}
                      className={`rounded-lg border p-4 ${
                        product.tier === 'INDIVIDUAL'
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      {product.tier === 'INDIVIDUAL' && (
                        <span className="text-xs font-medium text-primary mb-2 block">
                          Most Popular
                        </span>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-foreground">
                          {product.name}
                        </h3>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {formatPrice(product.prices.annual.amount)}
                        <span className="text-sm font-normal text-muted-foreground">
                          /year
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {product.description}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Payment Method */}
      {membership?.paypalSubscriptionId && (
        <div className="rounded-xl border border-border bg-card mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                Payment Method
              </h2>
              <BillingActions
                hasSubscription={!!membership?.paypalSubscriptionId}
                isActive={isActive}
                currentTier={currentTier}
                showManageOnly
              />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">
                  Managed through PayPal
                </p>
                <p className="text-sm text-muted-foreground">
                  Update payment methods in your PayPal account
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="rounded-xl border border-border bg-card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Payment History
          </h2>

          {payments.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payment history yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        payment.status === 'SUCCEEDED'
                          ? 'bg-green-500/20'
                          : 'bg-red-500/20'
                      }`}
                    >
                      {payment.status === 'SUCCEEDED' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {payment.description || 'Payment'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">
                    {formatPrice(Number(payment.amount) * 100)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
