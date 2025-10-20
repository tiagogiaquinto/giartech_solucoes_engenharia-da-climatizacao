import { useCallback } from 'react'
import {
  capitalizeProperName,
  capitalizeCompanyName,
  capitalizeAddress,
  capitalizeFirstLetter
} from '../utils/format'

type CapitalizationType = 'name' | 'company' | 'address' | 'first-letter' | 'none'

interface UseCapitalizedInputProps {
  value: string
  onChange: (value: string) => void
  type?: CapitalizationType
}

export const useCapitalizedInput = ({
  value,
  onChange,
  type = 'first-letter'
}: UseCapitalizedInputProps) => {
  const handleChange = useCallback(
    (newValue: string) => {
      if (type === 'none') {
        onChange(newValue)
        return
      }

      let capitalizedValue = newValue

      switch (type) {
        case 'name':
          capitalizedValue = capitalizeProperName(newValue)
          break
        case 'company':
          capitalizedValue = capitalizeCompanyName(newValue)
          break
        case 'address':
          capitalizedValue = capitalizeAddress(newValue)
          break
        case 'first-letter':
          capitalizedValue = capitalizeFirstLetter(newValue)
          break
      }

      onChange(capitalizedValue)
    },
    [onChange, type]
  )

  return {
    value,
    onChange: handleChange
  }
}

export const capitalizeOnBlur = (value: string, type: CapitalizationType = 'first-letter'): string => {
  if (type === 'none' || !value) return value

  switch (type) {
    case 'name':
      return capitalizeProperName(value)
    case 'company':
      return capitalizeCompanyName(value)
    case 'address':
      return capitalizeAddress(value)
    case 'first-letter':
      return capitalizeFirstLetter(value)
    default:
      return value
  }
}
