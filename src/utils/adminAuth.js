/**
 * Normalizes an email address for robust comparison:
 * - Trims whitespace and converts to lowercase
 * - Strips dots and alias plus-tags for Gmail addresses
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  const clean = email.trim().toLowerCase();
  const parts = clean.split('@');
  if (parts.length !== 2) return clean;

  const [local, domain] = parts;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const baseLocal = local.split('+')[0].replace(/\./g, '');
    return `${baseLocal}@gmail.com`;
  }
  return `${local}@${domain}`;
};

export const ADMIN_EMAILS = [
  'alikhoudjazakariia@gmail.com',
  'alikhoudjazakaria@gmail.com',
  'alikoudjazakariia@gmail.com',
  'alikoudjazakaria@gmail.com',
  'zakariaalikhoudja@gmail.com',
  'zakariaalikoudja@gmail.com',
  'botadmin@darkoum.com'
];

/**
 * Robust check if a given user object has admin privileges.
 */
export const isUserAdmin = (user) => {
  if (!user) return false;

  // 1. Check explicit role flag in user profile
  if (user.role === 'admin' || user.role === 'botadmin' || user.role === 'superadmin') {
    return true;
  }

  // 2. Extract email from all possible properties on user / proxy / firebaseUser
  const rawEmail = user.email || 
                   user.profile?.email || 
                   user._firebaseUser?.email || 
                   user.firebaseUser?.email || 
                   '';

  if (!rawEmail) return false;

  const userNorm = normalizeEmail(rawEmail);
  const rawLower = rawEmail.trim().toLowerCase();

  // 3. Check normalized and raw lists
  const normalizedAllowed = ADMIN_EMAILS.map(normalizeEmail);
  if (normalizedAllowed.includes(userNorm) || ADMIN_EMAILS.some(e => e.toLowerCase() === rawLower)) {
    return true;
  }

  // 4. Check environment variable list
  const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (envAdmins.some(e => normalizeEmail(e) === userNorm || e === rawLower)) {
    return true;
  }

  return false;
};
