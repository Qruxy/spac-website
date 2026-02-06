'use client';

/**
 * Demo Authentication for GitHub Pages Static Export
 *
 * Client-side auth using sessionStorage. Used when the site
 * is deployed as a static export without server-side auth.
 */

const DEMO_SESSION_KEY = 'spac-demo-session';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
  membershipType: string;
  membershipStatus: string;
}

const DEMO_CREDENTIALS = {
  username: 'demo',
  password: 'Sp@C2025!',
};

export const DEMO_USER: DemoUser = {
  id: 'demo-user-001',
  name: 'Demo Admin',
  email: 'demo@spac.local',
  role: 'ADMIN',
  membershipType: 'INDIVIDUAL',
  membershipStatus: 'ACTIVE',
};

export function demoLogin(username: string, password: string): boolean {
  if (
    username === DEMO_CREDENTIALS.username &&
    password === DEMO_CREDENTIALS.password
  ) {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(DEMO_USER));
    }
    return true;
  }
  return false;
}

export function demoLogout(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  }
}

export function getDemoSession(): DemoUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = sessionStorage.getItem(DEMO_SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}
