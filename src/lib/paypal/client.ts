/**
 * PayPal Client-Side Configuration
 *
 * Client-side utilities for PayPal JavaScript SDK integration.
 */

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

interface PayPalNamespace {
  Buttons: (config: PayPalButtonConfig) => PayPalButtons;
  FUNDING: {
    PAYPAL: string;
    CARD: string;
  };
}

interface PayPalButtons {
  render: (container: string | HTMLElement) => Promise<void>;
  close: () => Promise<void>;
  isEligible: () => boolean;
}

interface PayPalButtonConfig {
  fundingSource?: string;
  createOrder?: () => Promise<string>;
  createSubscription?: () => Promise<string>;
  onApprove?: (data: PayPalApprovalData) => Promise<void>;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  style?: {
    layout?: 'vertical' | 'horizontal';
    color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
    shape?: 'rect' | 'pill';
    label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'donate' | 'subscribe';
    height?: number;
  };
}

interface PayPalApprovalData {
  orderID?: string;
  subscriptionID?: string;
  payerID: string;
  facilitatorAccessToken?: string;
}

let scriptPromise: Promise<void> | null = null;

/**
 * Load the PayPal JavaScript SDK
 */
export function loadPayPalScript(options?: {
  components?: string[];
  intent?: 'capture' | 'subscription';
  vault?: boolean;
}): Promise<void> {
  if (scriptPromise) {
    return scriptPromise;
  }

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    return Promise.reject(new Error('NEXT_PUBLIC_PAYPAL_CLIENT_ID is not set'));
  }

  scriptPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.paypal) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    const components = options?.components?.join(',') || 'buttons';
    const params = new URLSearchParams({
      'client-id': clientId,
      'components': components,
      'currency': 'USD',
    });

    if (options?.intent) {
      params.set('intent', options.intent);
    }
    if (options?.vault) {
      params.set('vault', 'true');
    }

    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));

    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Get the PayPal SDK namespace
 */
export function getPayPal(): PayPalNamespace | null {
  return window.paypal || null;
}

/**
 * Create PayPal buttons configuration for one-time payments
 */
export function createPaymentButtonConfig({
  createOrderEndpoint,
  captureEndpoint,
  onSuccess,
  onError,
  onCancel,
  amount,
  metadata,
}: {
  createOrderEndpoint: string;
  captureEndpoint: string;
  onSuccess: (details: Record<string, unknown>) => void;
  onError: (error: Error) => void;
  onCancel?: () => void;
  amount?: number;
  metadata?: Record<string, string>;
}): PayPalButtonConfig {
  return {
    createOrder: async () => {
      const response = await fetch(createOrderEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, ...metadata }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create order');
      }

      const data = await response.json();
      return data.orderId;
    },
    onApprove: async (data) => {
      const response = await fetch(captureEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: data.orderID }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to capture payment');
      }

      const details = await response.json();
      onSuccess(details);
    },
    onError,
    onCancel,
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'paypal',
    },
  };
}

/**
 * Create PayPal buttons configuration for subscriptions
 */
export function createSubscriptionButtonConfig({
  createSubscriptionEndpoint,
  onSuccess,
  onError,
  onCancel,
  metadata,
}: {
  createSubscriptionEndpoint: string;
  onSuccess: (subscriptionId: string) => void;
  onError: (error: Error) => void;
  onCancel?: () => void;
  metadata?: Record<string, string>;
}): PayPalButtonConfig {
  return {
    createSubscription: async () => {
      const response = await fetch(createSubscriptionEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create subscription');
      }

      const data = await response.json();
      return data.subscriptionId;
    },
    onApprove: async (data) => {
      if (data.subscriptionID) {
        onSuccess(data.subscriptionID);
      }
    },
    onError,
    onCancel,
    style: {
      layout: 'vertical',
      color: 'gold',
      shape: 'rect',
      label: 'subscribe',
    },
  };
}

export type { PayPalButtonConfig, PayPalApprovalData };
