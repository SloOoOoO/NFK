// German Tax ID (Steuer-ID) validation using ISO 7064, MOD 11, 10 algorithm
export function validateSteuerID(steuerID: string): boolean {
  if (!/^\d{11}$/.test(steuerID)) return false;
  
  const digits = steuerID.split('').map(Number);
  let product = 10;
  
  for (let i = 0; i < 10; i++) {
    let sum = (digits[i] + product) % 10;
    if (sum === 0) sum = 10;
    product = (sum * 2) % 11;
  }
  
  const checksum = (11 - product) % 10;
  return checksum === digits[10];
}

// Validate German VAT ID (USt-IdNr.)
export function validateVatID(vatId: string): boolean {
  return /^DE\d{9}$/.test(vatId);
}

// Validate Commercial Register number (Handelsregister)
export function validateCommercialRegister(register: string): boolean {
  return /^HR[AB]\s*\d+/.test(register);
}

// Validate German postal code (PLZ)
export function validatePostalCode(plz: string): boolean {
  return /^\d{5}$/.test(plz);
}
