export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '')
  return cleanPhone.length >= 10 && cleanPhone.length <= 11
}

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '')

  if (cleanCPF.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleanCPF.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit >= 10) digit = 0
  if (digit !== parseInt(cleanCPF.charAt(10))) return false

  return true
}

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '')

  if (cleanCNPJ.length !== 14) return false
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false

  let size = cleanCNPJ.length - 2
  let numbers = cleanCNPJ.substring(0, size)
  const digits = cleanCNPJ.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(0))) return false

  size = size + 1
  numbers = cleanCNPJ.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== parseInt(digits.charAt(1))) return false

  return true
}

export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

export const validateMinLength = (value: string, min: number): boolean => {
  return value.length >= min
}

export const validateMaxLength = (value: string, max: number): boolean => {
  return value.length <= max
}

export const validateNumeric = (value: string): boolean => {
  return /^\d+$/.test(value)
}

export const validatePrice = (value: number): boolean => {
  return value >= 0 && !isNaN(value)
}

export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime())
}

export const validateFutureDate = (date: string): boolean => {
  const parsedDate = new Date(date)
  return parsedDate > new Date()
}

interface ValidationRule {
  validator: (value: any) => boolean
  message: string
}

export class FormValidator {
  private errors: Record<string, string> = {}

  validate(field: string, value: any, rules: ValidationRule[]): boolean {
    for (const rule of rules) {
      if (!rule.validator(value)) {
        this.errors[field] = rule.message
        return false
      }
    }
    delete this.errors[field]
    return true
  }

  getError(field: string): string | undefined {
    return this.errors[field]
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0
  }

  getErrors(): Record<string, string> {
    return { ...this.errors }
  }

  clearErrors(): void {
    this.errors = {}
  }
}
