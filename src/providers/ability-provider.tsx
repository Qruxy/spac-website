'use client';

/**
 * CASL Ability Provider
 *
 * Provides authorization abilities to client components.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { defineAbilitiesFor, type AppAbility, type UserContext } from '@/lib/casl';

// Create ability context with a default guest ability
const defaultAbility = defineAbilitiesFor(null);
const AbilityContext = createContext<AppAbility>(defaultAbility);

interface AbilityProviderProps {
  children: ReactNode;
}

export function AbilityProvider({ children }: AbilityProviderProps) {
  const { data: session } = useSession();

  const ability = useMemo(() => {
    if (!session?.user) {
      return defineAbilitiesFor(null);
    }

    const userContext: UserContext = {
      id: session.user.id,
      role: session.user.role,
      membershipStatus: session.user.membershipStatus,
    };

    return defineAbilitiesFor(userContext);
  }, [session]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}

/**
 * Hook to access the current ability instance
 */
export function useAbility(): AppAbility {
  return useContext(AbilityContext);
}

/**
 * Hook to check if user can perform an action
 */
export function useCan(
  action: 'create' | 'read' | 'update' | 'delete' | 'manage',
  subject: string
): boolean {
  const ability = useAbility();
  return ability.can(action, subject as any);
}
