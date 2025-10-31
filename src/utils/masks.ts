export const phoneMask = (value: string) => value
export const cpfMask = (value: string) => value
export const cnpjMask = (value: string) => value
export const cepMask = (value: string) => value
export const maskCPF = (value: string) => value
export const maskPhone = (value: string) => value
export const maskCEP = (value: string) => value
export const validateCPF = (value: string) => true
export const validateEmail = (value: string) => true
export const unmask = (value: string) => value.replace(/\D/g, '')
