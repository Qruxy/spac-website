#!/usr/bin/env node

/**
 * PayPal Subscription Plans Setup Script
 *
 * Creates the product and subscription plans in PayPal.
 * Run once to get plan IDs, then paste them into .env.local
 *
 * Usage: node scripts/setup-paypal-plans.mjs
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PAYPAL_API = 'https://api-m.sandbox.paypal.com';
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env.local first');
  process.exit(1);
}

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function createProduct(token) {
  const res = await fetch(`${PAYPAL_API}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'SPAC Membership',
      description: 'St. Petersburg Astronomy Club Membership Subscription',
      type: 'SERVICE',
      category: 'SOFTWARE',
    }),
  });
  if (!res.ok) throw new Error(`Product creation failed: ${await res.text()}`);
  return res.json();
}

async function createPlan(token, productId, plan) {
  const res = await fetch(`${PAYPAL_API}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: productId,
      name: plan.name,
      description: plan.description,
      billing_cycles: [
        {
          frequency: {
            interval_unit: plan.interval,
            interval_count: 1,
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0, // infinite
          pricing_scheme: {
            fixed_price: {
              value: plan.price,
              currency_code: 'USD',
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: { value: '0', currency_code: 'USD' },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3,
      },
    }),
  });
  if (!res.ok) throw new Error(`Plan creation failed (${plan.name}): ${await res.text()}`);
  return res.json();
}

async function main() {
  console.log('Authenticating with PayPal sandbox...');
  const token = await getAccessToken();
  console.log('Authenticated successfully!\n');

  console.log('Creating SPAC Membership product...');
  const product = await createProduct(token);
  console.log(`Product created: ${product.id}\n`);

  const plans = [
    { name: 'Individual Monthly', description: 'SPAC Individual Membership - Monthly', interval: 'MONTH', price: '5.00', envKey: 'PAYPAL_PLAN_INDIVIDUAL_MONTHLY' },
    { name: 'Individual Annual', description: 'SPAC Individual Membership - Annual', interval: 'YEAR', price: '40.00', envKey: 'PAYPAL_PLAN_INDIVIDUAL_ANNUAL' },
    { name: 'Family Monthly', description: 'SPAC Family Membership - Monthly', interval: 'MONTH', price: '7.00', envKey: 'PAYPAL_PLAN_FAMILY_MONTHLY' },
    { name: 'Family Annual', description: 'SPAC Family Membership - Annual', interval: 'YEAR', price: '60.00', envKey: 'PAYPAL_PLAN_FAMILY_ANNUAL' },
    { name: 'Student Annual', description: 'SPAC Student Membership - Annual', interval: 'YEAR', price: '20.00', envKey: 'PAYPAL_PLAN_STUDENT_ANNUAL' },
  ];

  console.log('Creating subscription plans...\n');
  const results = [];

  for (const plan of plans) {
    const created = await createPlan(token, product.id, plan);
    results.push({ ...plan, planId: created.id });
    console.log(`  ${plan.name}: ${created.id}`);
  }

  console.log('\n========================================');
  console.log('Add these to your .env.local:');
  console.log('========================================\n');

  for (const r of results) {
    console.log(`${r.envKey}=${r.planId}`);
  }

  console.log('\n========================================');
  console.log('Done! Copy the plan IDs above into .env.local');
  console.log('and also set them on Amplify via:');
  console.log('aws amplify update-branch --environment-variables ...');
  console.log('========================================');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
