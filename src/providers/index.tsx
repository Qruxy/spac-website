'use client';

/**
 * Application Providers
 *
 * Combines all providers into a single component for the root layout.
 */

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { MantineProvider, createTheme } from '@mantine/core';
import { SessionProvider } from './session-provider';
import { AbilityProvider } from './ability-provider';
import { TopLoader } from '@/components/top-loader';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'var(--font-sans), sans-serif',
  defaultRadius: 'md',
  colors: {
    dark: [
      '#C1C2C5', '#A6A7AB', '#909296', '#5C5F66',
      '#373A40', '#2C2E33', '#25262B', '#1A1B1E',
      '#141517', '#101113',
    ],
  },
});

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <SessionProvider>
        <AbilityProvider>
          <Suspense fallback={null}>
            <TopLoader />
          </Suspense>
          {children}
        </AbilityProvider>
      </SessionProvider>
    </MantineProvider>
  );
}

export { SessionProvider } from './session-provider';
export { AbilityProvider, useAbility, useCan } from './ability-provider';
