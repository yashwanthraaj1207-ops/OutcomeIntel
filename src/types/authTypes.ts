/**
 * OutcomeIntel Authentication Types
 * Institutional Role-Based Access Control Models (Prototype / Demo)
 */

export type UserRole = 'FACULTY' | 'HOD';

export interface AuthenticatedUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  roleTitle: string; // e.g., 'Course Instructor / Faculty' vs 'Head of Department / Academic Administrator'
  department: string;
  institution: string;
  sessionTimestamp: number;
  isDemoAccount: boolean;
}

export interface LoginCredentials {
  email: string;
  password?: string;
  role: UserRole;
  rememberMe?: boolean;
}

export interface AuthSession {
  user: AuthenticatedUser;
  createdAt: number;
  rememberMe: boolean;
  tokenType: 'LOCAL_PROTOTYPE_TOKEN';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthenticatedUser | null;
  loading: boolean;
  error: string | null;
}

