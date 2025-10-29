export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export const formatDate = (date: string | Date): string => {
  if (!date) return '-'
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  const day = String(parsedDate.getDate()).padStart(2, '0')
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const year = parsedDate.getFullYear()
  return `${day}/${month}/${year}`
}

export const formatDateTime = (date: string | Date): string => {
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsedDate)
}

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  return phone
}

export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '')

  if (cleaned.length !== 11) return cpf

  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
}

export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) return cnpj

  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`
}

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const capitalizeWords = (text: string): string => {
  if (!text) return ''

  const exceptions = ['de', 'da', 'do', 'das', 'dos', 'e', 'ou', 'para', 'com', 'em', 'a', 'o']

  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0 || !exceptions.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      return word
    })
    .join(' ')
}

export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const capitalizeProperName = (text: string): string => {
  if (!text) return ''

  const particles = ['da', 'de', 'do', 'das', 'dos']

  return text
    .toLowerCase()
    .trim()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && particles.includes(word)) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export const capitalizeAddress = (text: string): string => {
  if (!text) return ''

  const prepositions = ['de', 'da', 'do', 'das', 'dos', 'com', 'em', 'para']

  return text
    .toLowerCase()
    .trim()
    .split(' ')
    .map((word, index) => {
      if (index > 0 && prepositions.includes(word)) {
        return word
      }
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export const capitalizeCompanyName = (text: string): string => {
  if (!text) return ''

  const words = text.trim().split(' ')

  return words
    .map((word) => {
      const upperWord = word.toUpperCase()
      if (upperWord === 'LTDA' ||
          upperWord === 'LTDA.' ||
          upperWord === 'ME' ||
          upperWord === 'EPP' ||
          upperWord === 'EIRELI' ||
          upperWord === 'S/A' ||
          upperWord === 'SA') {
        return upperWord
      }

      const lowerWord = word.toLowerCase()
      if (['de', 'da', 'do', 'das', 'dos', 'e'].includes(lowerWord)) {
        return lowerWord
      }

      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
