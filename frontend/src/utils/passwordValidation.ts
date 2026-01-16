// Password validation constants and utilities
export const PASSWORD_MIN_LENGTH = 12;

// Password validation regexes
export const PASSWORD_PATTERNS = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  number: /[0-9]/,
  specialChar: /[^a-zA-Z0-9]/,
};

// Password strength levels
export type PasswordStrength = {
  strength: number;
  label: string;
  color: string;
};

// Calculate password strength
export function calculatePasswordStrength(password: string): PasswordStrength {
  let strength = 0;
  
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  if (PASSWORD_PATTERNS.lowercase.test(password)) strength++;
  if (PASSWORD_PATTERNS.uppercase.test(password)) strength++;
  if (PASSWORD_PATTERNS.number.test(password)) strength++;
  if (PASSWORD_PATTERNS.specialChar.test(password)) strength++;
  
  if (strength <= 2) return { strength: 1, label: 'Schwach', color: 'bg-red-500' };
  if (strength <= 4) return { strength: 2, label: 'Mittel', color: 'bg-yellow-500' };
  if (strength <= 5) return { strength: 3, label: 'Stark', color: 'bg-blue-500' };
  return { strength: 4, label: 'Sehr stark', color: 'bg-green-500' };
}

// Validate password meets all requirements
export function validatePassword(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    PASSWORD_PATTERNS.lowercase.test(password) &&
    PASSWORD_PATTERNS.uppercase.test(password) &&
    PASSWORD_PATTERNS.number.test(password) &&
    PASSWORD_PATTERNS.specialChar.test(password)
  );
}
