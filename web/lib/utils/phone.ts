/**
 * Нормализует номер телефона в международном формате
 */
export function normalizePhoneNumber(phone: string): string | null {
  if (!phone) return null
  
  // Удаляем все нецифровые символы
  const digits = phone.replace(/\D/g, '')
  
  // Российские номера
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`
  }
  
  if (digits.length === 10 && digits.startsWith('9')) {
    return `+7${digits}`
  }
  
  // Международные номера
  if (digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`
  }
  
  return null
}

/**
 * Проверяет валидность номера телефона
 */
export function validatePhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return false
  
  // Минимальная валидация формата
  return /^\+\d{10,15}$/.test(normalized)
}

/**
 * Маскирует номер телефона для отображения
 */
export function maskPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone)
  if (!normalized) return phone
  
  // Пример: +79991234567 -> +7 (999) ***-**-67
  const countryCode = normalized.substring(0, 2)
  const operatorCode = normalized.substring(2, 5)
  const lastDigits = normalized.substring(normalized.length - 2)
  
  return `${countryCode} (${operatorCode}) ***-**-${lastDigits}`
}