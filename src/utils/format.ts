export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
export const capitalizeProperName = (str: string) => capitalize(str)
export const capitalizeCompanyName = (str: string) => str.toUpperCase()
export const capitalizeAddress = (str: string) => capitalize(str)
export const capitalizeFirstLetter = (str: string) => capitalize(str)

export const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  try {
    const dateOnly = dateString.split('T')[0]
    const [year, month, day] = dateOnly.split('-')
    if (!year || !month || !day) return '-'
    return `${day}/${month}/${year}`
  } catch {
    return '-'
  }
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
