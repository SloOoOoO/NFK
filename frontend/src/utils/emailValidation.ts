/**
 * Email validation utilities including disposable email domain blocking
 */

// Common disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'temp-mail.org',
  'throwaway.email',
  'yopmail.com',
  'fakeinbox.com',
  'tempmail.com',
  'trashmail.com',
  'discard.email',
  'getnada.com',
  'maildrop.cc',
  'mintemail.com',
  'sharklasers.com',
  'spam4.me',
  'tempinbox.com',
  'mohmal.com',
  'emailondeck.com',
];

/**
 * Validates if an email domain is not from a disposable email provider
 * @param email - The email address to check
 * @returns true if email is from a valid domain, false if from disposable domain
 */
export function isNotDisposableEmail(email: string): boolean {
  if (!email) return true; // Empty emails are handled by required validation
  
  const emailLower = email.toLowerCase();
  const domain = emailLower.split('@')[1];
  
  if (!domain) return true; // Malformed emails are handled by email format validation
  
  // Check if domain is in blocklist
  return !DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Gets a user-friendly error message for disposable email domains
 * @returns Error message string
 */
export function getDisposableEmailError(): string {
  return 'Bitte verwenden Sie eine geschäftliche oder persönliche E-Mail-Adresse. Wegwerf-E-Mail-Adressen sind nicht zulässig.';
}
