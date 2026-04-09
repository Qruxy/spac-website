export const dynamic = 'force-dynamic';
/**
 * Admin PayPal Transactions API
 * Pulls recent transactions directly from PayPal Transaction Search API.
 */
import { NextResponse } from 'next/server';
import { requireAdmin } from '../utils';

const PAYPAL_BASE = 'https://api-m.paypal.com';

async function getAccessToken(): Promise<string> {
  const id  = process.env.PAYPAL_CLIENT_ID!;
  const sec = process.env.PAYPAL_CLIENT_SECRET!;
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${Buffer.from(`${id}:${sec}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const d = await res.json();
  return d.access_token as string;
}

type PP = Record<string, unknown>;

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return auth.error;

  const { searchParams } = new URL(request.url);
  const days = Math.min(365, parseInt(searchParams.get('days') || '90', 10));

  try {
    const token = await getAccessToken();

    const end   = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const fmt   = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, '+0000');

    const p = new URLSearchParams({
      start_date: fmt(start),
      end_date:   fmt(end),
      page_size:  '100',
      fields:     'all',
    });

    const res = await fetch(`${PAYPAL_BASE}/v1/reporting/transactions?${p}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error('PayPal tx error:', txt);
      return NextResponse.json({ error: `PayPal API ${res.status}`, detail: txt }, { status: 502 });
    }

    const data = await res.json();

    const transactions = ((data.transaction_details ?? []) as PP[]).map(t => {
      const info  = (t.transaction_info ?? {})  as PP;
      const payer = (t.payer_info       ?? {})  as PP;
      const pname = (payer.payer_name   ?? {})  as PP;
      const cart  = (t.cart_info        ?? {})  as PP;
      const items = ((cart.item_details ?? [])  as PP[]);
      const amt   = (info.transaction_amount ?? {}) as PP;
      const fee   = (info.fee_amount         ?? {}) as PP;

      return {
        id:          info.transaction_id          as string,
        status:      info.transaction_status      as string,
        date:        info.transaction_initiation_date as string,
        amount:      amt.value                    as string,
        currency:    amt.currency_code            as string,
        fee:         fee.value                    as string ?? '0.00',
        type:        info.transaction_event_code  as string,
        email:       payer.email_address          as string ?? '',
        name:        `${pname.given_name ?? ''} ${pname.surname ?? ''}`.trim(),
        description: (items[0]?.item_description ?? info.transaction_note ?? '') as string,
        paypalRefId: info.paypal_reference_id     as string ?? '',
      };
    });

    // Aggregate totals
    const grossTotal = transactions.reduce((s, t) => s + parseFloat(t.amount || '0'), 0);
    const feeTotal   = transactions.reduce((s, t) => s + parseFloat(t.fee   || '0'), 0);

    return NextResponse.json({
      transactions,
      totalItems: data.total_items ?? transactions.length,
      grossTotal: grossTotal.toFixed(2),
      netTotal:   (grossTotal + feeTotal).toFixed(2), // fee is negative
      feeTotal:   feeTotal.toFixed(2),
      dateRange:  { start: start.toISOString(), end: end.toISOString(), days },
    });
  } catch (e) {
    console.error('PayPal transactions route error:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
