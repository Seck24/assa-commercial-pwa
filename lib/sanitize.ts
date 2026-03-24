/**
 * Sanitisation et validation des inputs — première ligne de défense contre SQL injection
 */

// Supprime les caractères dangereux pour SQL
export function sanitizeText(value: string, maxLength = 200): string {
  return value
    .replace(/['"\\;`]/g, '') // Supprime quotes, backslash, semicolons, backticks
    .replace(/--/g, '')       // Supprime commentaires SQL
    .trim()
    .substring(0, maxLength)
}

// Valide un UUID (format standard)
export function isValidUid(uid: string): boolean {
  return /^[a-f0-9-]{36}$/.test(uid)
}

// Valide un numéro de téléphone (chiffres, +, espaces)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '')
  return /^\+?\d{6,15}$/.test(cleaned)
}

// Valide un mot de passe (min 8 chars)
export function isValidPassword(pwd: string): boolean {
  return pwd.length >= 8 && pwd.length <= 128
}

// Sanitise un nom (lettres, espaces, tirets, apostrophes)
export function sanitizeName(value: string, maxLength = 100): string {
  return value
    .replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '')
    .trim()
    .substring(0, maxLength)
}

// Valide un montant (entier positif)
export function isValidAmount(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 999999999
}

// Sanitise une recherche (pour les champs search/filter)
export function sanitizeSearch(value: string, maxLength = 100): string {
  return value
    .replace(/['"\\;`%]/g, '')
    .replace(/--/g, '')
    .trim()
    .substring(0, maxLength)
}
