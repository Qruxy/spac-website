'use client';

/**
 * Application Providers
 *
 * Combines all providers into a single component for the root layout.
 */

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { SessionProvider } from './session-provider';
import { AbilityProvider } from './ability-provider';
import { TopLoader } from '@/components/top-loader';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <AbilityProvider>
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        {children}
      </AbilityProvider>
    </SessionProvider>
  );
}

export { SessionProvider } from './session-provider';
export { AbilityProvider, useAbility, useCan } from './ability-provider';
