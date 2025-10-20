import React from 'react'
import { capitalizeOnBlur } from '../hooks/useCapitalizedInput'

type CapitalizationType = 'name' | 'company' | 'address' | 'first-letter' | 'none'

interface CapitalizedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  capitalizationType?: CapitalizationType
  onValueChange?: (value: string) => void
}

export const CapitalizedInput = React.forwardRef<HTMLInputElement, CapitalizedInputProps>(
  ({ capitalizationType = 'first-letter', onValueChange, onBlur, ...props }, ref) => {
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (capitalizationType !== 'none' && e.target.value) {
        const capitalizedValue = capitalizeOnBlur(e.target.value, capitalizationType)

        if (capitalizedValue !== e.target.value) {
          e.target.value = capitalizedValue

          if (onValueChange) {
            onValueChange(capitalizedValue)
          }
        }
      }

      if (onBlur) {
        onBlur(e)
      }
    }

    return <input ref={ref} {...props} onBlur={handleBlur} />
  }
)

CapitalizedInput.displayName = 'CapitalizedInput'

interface CapitalizedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  capitalizationType?: CapitalizationType
  onValueChange?: (value: string) => void
}

export const CapitalizedTextarea = React.forwardRef<HTMLTextAreaElement, CapitalizedTextareaProps>(
  ({ capitalizationType = 'first-letter', onValueChange, onBlur, ...props }, ref) => {
    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (capitalizationType !== 'none' && e.target.value) {
        const capitalizedValue = capitalizeOnBlur(e.target.value, capitalizationType)

        if (capitalizedValue !== e.target.value) {
          e.target.value = capitalizedValue

          if (onValueChange) {
            onValueChange(capitalizedValue)
          }
        }
      }

      if (onBlur) {
        onBlur(e)
      }
    }

    return <textarea ref={ref} {...props} onBlur={handleBlur} />
  }
)

CapitalizedTextarea.displayName = 'CapitalizedTextarea'
