/**
 * OutcomeIntel Local Prototype Authentication Service
 *
 * NOTE: This service provides safe, local-only authentication for the hackathon prototype.
 * It strictly avoids storing real credentials, exposing API secrets, or transmitting PII.
 * Sessions are safely persisted in localStorage / sessionStorage under the namespace 'outcomeintel_auth'.
 */

import { AuthenticatedUser, AuthSession, LoginCredentials, UserRole } from '../types/authTypes';

export const AUTH_STORAGE_KEY = 'outcomeintel_auth';

// Pre-configured safe prototype accounts
export const DEMO_ACCOUNTS: Record<UserRole, { email: string; defaultPassword: string; user: AuthenticatedUser }> = {
  FACULTY: {
    email: 'faculty@demo.edu',
    defaultPassword: 'faculty@demo',
    user: {
      id: 'USR-FAC-001',
      displayName: 'Dr. Sarah Jenkins',
      email: 'faculty@demo.edu',
      role: 'FACULTY',
      roleTitle: 'Course Instructor / Faculty',
      department: 'Department of Computer Science & Engineering',
      institution: 'Apex Institute of Technology',
      sessionTimestamp: Date.now(),
      isDemoAccount: true
    }
  },
  HOD: {
    email: 'hod@demo.edu',
    defaultPassword: 'hod@demo',
    user: {
      id: 'USR-HOD-001',
      displayName: 'Prof. Rajesh Sharma',
      email: 'hod@demo.edu',
      role: 'HOD',
      roleTitle: 'Head of Department / Academic Administrator',
      department: 'Academic Council & Accreditation Committee',
      institution: 'Apex Institute of Technology',
      sessionTimestamp: Date.now(),
      isDemoAccount: true
    }
  }
};

/**
 * Helper to safely access storage (localStorage or sessionStorage)
 */
function getStorage(rememberMe: boolean = true): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return rememberMe ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Retrieve the active stored session from localStorage or sessionStorage
 */
export function getStoredSession(): AuthSession | null {
  try {
    if (typeof window === 'undefined') return null;

    // Check localStorage first
    const localRaw = window.localStorage?.getItem(AUTH_STORAGE_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw) as AuthSession;
      if (parsed && parsed.user && parsed.user.role) {
        return parsed;
      }
    }

    // Check sessionStorage
    const sessionRaw = window.sessionStorage?.getItem(AUTH_STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw) as AuthSession;
      if (parsed && parsed.user && parsed.user.role) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[OutcomeIntel Auth] Error reading session from storage:', err);
  }
  return null;
}

/**
 * Check whether a user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return getStoredSession() !== null;
}

/**
 * Get the currently logged-in user profile
 */
export function getCurrentUser(): AuthenticatedUser | null {
  const session = getStoredSession();
  return session ? session.user : null;
}

/**
 * Log in using credentials (Prototype validation)
 */
export async function login(
  credentials: LoginCredentials
): Promise<{ success: boolean; user?: AuthenticatedUser; error?: string }> {
  // Simulate minimal async dispatch for realistic UI feedback
  await new Promise(resolve => setTimeout(resolve, 300));

  const email = (credentials.email || '').trim().toLowerCase();
  const password = (credentials.password || '').trim();
  const role = credentials.role;
  const rememberMe = credentials.rememberMe ?? true;

  if (!email) {
    return { success: false, error: 'Institutional email is required.' };
  }

  if (!password) {
    return { success: false, error: 'Password is required.' };
  }

  const demoConfig = DEMO_ACCOUNTS[role];

  // Accept demo account or any validly formatted institutional email for that role
  let user: AuthenticatedUser;

  if (email === demoConfig.email.toLowerCase()) {
    // Exact demo match
    user = {
      ...demoConfig.user,
      sessionTimestamp: Date.now()
    };
  } else if (email.includes('@')) {
    // Prototype permissive matching for custom institutional emails
    const localName = email.split('@')[0].replace(/[._-]/g, ' ');
    const formattedName = localName.replace(/\b\w/g, c => c.toUpperCase());

    user = {
      id: `USR-${role}-${Math.floor(1000 + Math.random() * 9000)}`,
      displayName: role === 'HOD' ? `Prof. ${formattedName}` : `Dr. ${formattedName}`,
      email,
      role,
      roleTitle: role === 'HOD'
        ? 'Head of Department / Academic Administrator'
        : 'Course Instructor / Faculty',
      department: role === 'HOD'
        ? 'Academic Council & Accreditation Office'
        : 'Department of Computer Science & Engineering',
      institution: 'Apex Institute of Technology',
      sessionTimestamp: Date.now(),
      isDemoAccount: false
    };
  } else {
    return {
      success: false,
      error: `Invalid email address. Use ${demoConfig.email} for instant ${role} prototype access.`
    };
  }

  // Create session object
  const session: AuthSession = {
    user,
    createdAt: Date.now(),
    rememberMe,
    tokenType: 'LOCAL_PROTOTYPE_TOKEN'
  };

  // Persist session
  try {
    const storage = getStorage(rememberMe);
    if (storage) {
      storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.error('[OutcomeIntel Auth] Storage write failed:', err);
  }

  return { success: true, user };
}

/**
 * Log out and clear stored session across both localStorage and sessionStorage
 */
export function logout(): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem(AUTH_STORAGE_KEY);
      window.sessionStorage?.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('[OutcomeIntel Auth] Logout error clearing storage:', err);
  }
}

/**
 * Retrieve demo credentials for UI convenience
 */
export function getDemoCredentials(role: UserRole): { email: string; password: string; role: UserRole } {
  const account = DEMO_ACCOUNTS[role];
  return {
    email: account.email,
    password: account.defaultPassword,
    role
  };
}

