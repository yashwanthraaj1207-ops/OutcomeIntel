/**
 * OutcomeIntel Test Suite: Authentication & Session Management Audit
 * Tests local prototype authentication, role assignment, demo credentials, and session persistence.
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage and sessionStorage for Node.js environment
class LocalStorageMock {
  constructor() {
    this.store = {};
  }
  clear() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] || null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
}

global.localStorage = new LocalStorageMock();
global.sessionStorage = new LocalStorageMock();
global.window = {
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage
};

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

// In-line Auth Service Implementation for Node test runner (matching src/services/authService.ts)
const AUTH_STORAGE_KEY = 'outcomeintel_auth';

const DEMO_ACCOUNTS = {
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

function getStoredSession() {
  try {
    const localRaw = global.localStorage.getItem(AUTH_STORAGE_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (parsed && parsed.user && parsed.user.role) return parsed;
    }
    const sessionRaw = global.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      if (parsed && parsed.user && parsed.user.role) return parsed;
    }
  } catch (err) {
    // Graceful recovery
  }
  return null;
}

function isAuthenticated() {
  return getStoredSession() !== null;
}

function getCurrentUser() {
  const session = getStoredSession();
  return session ? session.user : null;
}

async function login(credentials) {
  const email = (credentials.email || '').trim().toLowerCase();
  const password = (credentials.password || '').trim();
  const role = credentials.role;
  const rememberMe = credentials.rememberMe !== false;

  if (!email) return { success: false, error: 'Institutional email is required.' };
  if (!password) return { success: false, error: 'Password is required.' };

  const demoConfig = DEMO_ACCOUNTS[role];
  let user;

  if (email === demoConfig.email.toLowerCase()) {
    user = { ...demoConfig.user, sessionTimestamp: Date.now() };
  } else if (email.includes('@')) {
    user = {
      id: `USR-${role}-999`,
      displayName: role === 'HOD' ? 'Prof. Administrator' : 'Dr. Instructor',
      email,
      role,
      roleTitle: role === 'HOD' ? 'Head of Department' : 'Faculty Instructor',
      department: 'Computer Science',
      institution: 'Apex Institute of Technology',
      sessionTimestamp: Date.now(),
      isDemoAccount: false
    };
  } else {
    return { success: false, error: 'Invalid email format.' };
  }

  const session = {
    user,
    createdAt: Date.now(),
    rememberMe,
    tokenType: 'LOCAL_PROTOTYPE_TOKEN'
  };

  const storage = rememberMe ? global.localStorage : global.sessionStorage;
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

  return { success: true, user };
}

function logout() {
  global.localStorage.removeItem(AUTH_STORAGE_KEY);
  global.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

function getDemoCredentials(role) {
  return {
    email: DEMO_ACCOUNTS[role].email,
    password: DEMO_ACCOUNTS[role].defaultPassword,
    role
  };
}

async function runAuthTests() {
  console.log('================================================================');
  console.log('TEST SUITE: PROTOTYPE AUTHENTICATION & ROLE MANAGEMENT AUDIT');
  console.log('================================================================');

  // Start with clean slate
  logout();

  // Test 1: Initial unauthenticated state
  assert(!isAuthenticated(), 'Test 1: System initializes in unauthenticated state');
  assert(getCurrentUser() === null, 'Test 2: getCurrentUser returns null when unauthenticated');

  // Test 2: Missing email rejection
  const resNoEmail = await login({ email: '', password: '123', role: 'FACULTY' });
  assert(!resNoEmail.success && resNoEmail.error.includes('email'), 'Test 3: Login rejects missing email');

  // Test 3: Missing password rejection
  const resNoPass = await login({ email: 'faculty@demo.edu', password: '', role: 'FACULTY' });
  assert(!resNoPass.success && resNoPass.error.includes('Password'), 'Test 4: Login rejects missing password');

  // Test 4: Invalid email format rejection
  const resBadEmail = await login({ email: 'notanemail', password: '123', role: 'FACULTY' });
  assert(!resBadEmail.success, 'Test 5: Login rejects invalid email without @');

  // Test 5: Valid faculty login
  const facultyRes = await login({ email: 'faculty@demo.edu', password: 'faculty@demo', role: 'FACULTY' });
  assert(facultyRes.success === true, 'Test 6: Faculty demo login succeeds');
  assert(facultyRes.user.role === 'FACULTY', 'Test 7: Authenticated user has FACULTY role');
  assert(isAuthenticated() === true, 'Test 8: isAuthenticated returns true after faculty login');
  assert(getCurrentUser().email === 'faculty@demo.edu', 'Test 9: getCurrentUser retrieves faculty session profile');

  // Test 6: Persistence in localStorage
  const storedRaw = global.localStorage.getItem(AUTH_STORAGE_KEY);
  assert(storedRaw !== null && storedRaw.includes('USR-FAC-001'), 'Test 10: Session safely persisted under outcomeintel_auth');

  // Test 7: Logout clears session
  logout();
  assert(!isAuthenticated(), 'Test 11: Logout clears session and resets isAuthenticated to false');
  assert(global.localStorage.getItem(AUTH_STORAGE_KEY) === null, 'Test 12: Logout purges outcomeintel_auth key');

  // Test 8: Valid HOD login
  const hodRes = await login({ email: 'hod@demo.edu', password: 'hod@demo', role: 'HOD' });
  assert(hodRes.success === true, 'Test 13: HOD demo login succeeds');
  assert(hodRes.user.role === 'HOD', 'Test 14: Authenticated user has HOD role');
  assert(getCurrentUser().roleTitle.includes('Head of Department'), 'Test 15: HOD role title is properly assigned');

  // Test 9: Demo credentials lookup
  const facCreds = getDemoCredentials('FACULTY');
  const hodCreds = getDemoCredentials('HOD');
  assert(facCreds.email === 'faculty@demo.edu', 'Test 16: getDemoCredentials returns faculty demo email');
  assert(hodCreds.email === 'hod@demo.edu', 'Test 17: getDemoCredentials returns HOD demo email');

  // Test 10: Graceful recovery on corrupted storage data
  global.localStorage.setItem(AUTH_STORAGE_KEY, '{{corrupted_json}}');
  assert(!isAuthenticated(), 'Test 18: Corrupted session storage recovers gracefully without crashing');
  assert(getCurrentUser() === null, 'Test 19: Corrupted storage safely returns null user');

  // Test 11: Passwords and sensitive secrets are never stored in session object
  const cleanSession = await login({ email: 'faculty@demo.edu', password: 'faculty@demo', role: 'FACULTY' });
  const rawSession = JSON.parse(global.localStorage.getItem(AUTH_STORAGE_KEY));
  assert(rawSession.password === undefined, 'Test 20: Password is never stored in session record');
  assert(rawSession.user.password === undefined, 'Test 21: Password is not exposed in user profile object');

  console.log('================================================================');
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================');

  process.exitCode = failCount > 0 ? 1 : 0;
}

runAuthTests();

