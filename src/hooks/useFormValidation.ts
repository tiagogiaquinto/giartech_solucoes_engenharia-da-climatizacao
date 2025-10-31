import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface ValidationError {
  field: string
  message: string
  type: 'error' | 'warning' | 'info'
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  suggestions: ValidationError[]
}

export const useFormValidation = (serviceOrderId?: string) => {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  })
  const [isValidating, setIsValidating] = useState(false)

  const validate = useCallback(async (data: any) => {
    setIsValidating(true)

    const errors: ValidationError[] = []
    const warnings: ValidationError[] = []
    const suggestions: ValidationError[] = []

    try {
      // 1. Validar Cliente
      if (!data.customer_id) {
        errors.push({
          field: 'customer_id',
          message: 'Selecione um cliente',
          type: 'error'
        })
      }

      // 2. Validar Descrição
      if (!data.description || data.description.trim().length < 10) {
        errors.push({
          field: 'description',
          message: 'Descrição deve ter no mínimo 10 caracteres',
          type: 'error'
        })
      }

      // 3. Validar Data Agendada
      if (!data.scheduled_at) {
        warnings.push({
          field: 'scheduled_at',
          message: 'Data de agendamento não definida',
          type: 'warning'
        })
      } else if (new Date(data.scheduled_at) < new Date()) {
        warnings.push({
          field: 'scheduled_at',
          message: 'Data agendada já passou',
          type: 'warning'
        })
      }

      // 4. Validar Prazo
      if (!data.prazo_execucao_dias || data.prazo_execucao_dias < 1) {
        suggestions.push({
          field: 'prazo_execucao_dias',
          message: 'Defina um prazo de execução (recomendado: 15 dias)',
          type: 'info'
        })
      } else if (data.prazo_execucao_dias < 3) {
        warnings.push({
          field: 'prazo_execucao_dias',
          message: 'Prazo muito curto para execução do serviço',
          type: 'warning'
        })
      }

      // 5. Validar Valores
      if (!data.total_value || data.total_value <= 0) {
        warnings.push({
          field: 'total_value',
          message: 'Valor total não calculado. Adicione serviços e materiais.',
          type: 'warning'
        })
      }

      // 6. Validar Margem de Lucro
      if (data.profit_margin !== undefined && data.profit_margin !== null) {
        if (data.profit_margin < 15) {
          warnings.push({
            field: 'profit_margin',
            message: `Margem de lucro baixa (${data.profit_margin.toFixed(1)}%). Recomendado: mínimo 30%`,
            type: 'warning'
          })
        } else if (data.profit_margin >= 30) {
          suggestions.push({
            field: 'profit_margin',
            message: `Margem excelente (${data.profit_margin.toFixed(1)}%)!`,
            type: 'info'
          })
        }
      }

      // 7. Se tiver ID, validar no banco também
      if (serviceOrderId) {
        const { data: alerts } = await supabase
          .from('service_order_validation_alerts')
          .select('*')
          .eq('service_order_id', serviceOrderId)
          .eq('is_resolved', false)

        if (alerts) {
          alerts.forEach(alert => {
            const validation: ValidationError = {
              field: alert.field_name || 'geral',
              message: alert.message,
              type: alert.alert_type as 'error' | 'warning' | 'info'
            }

            if (alert.alert_type === 'error') {
              errors.push(validation)
            } else if (alert.alert_type === 'warning') {
              warnings.push(validation)
            } else {
              suggestions.push(validation)
            }
          })
        }
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions
      }

      setValidationResult(result)
      return result
    } catch (error) {
      console.error('Erro na validação:', error)
      return {
        isValid: false,
        errors: [{ field: 'geral', message: 'Erro ao validar formulário', type: 'error' }],
        warnings: [],
        suggestions: []
      }
    } finally {
      setIsValidating(false)
    }
  }, [serviceOrderId])

  const validateField = useCallback((field: string, value: any) => {
    const fieldErrors: ValidationError[] = []

    switch (field) {
      case 'customer_id':
        if (!value) {
          fieldErrors.push({
            field,
            message: 'Cliente é obrigatório',
            type: 'error'
          })
        }
        break

      case 'description':
        if (!value || value.trim().length < 10) {
          fieldErrors.push({
            field,
            message: 'Descrição deve ter no mínimo 10 caracteres',
            type: 'error'
          })
        }
        break

      case 'total_value':
        if (!value || value <= 0) {
          fieldErrors.push({
            field,
            message: 'Valor deve ser maior que zero',
            type: 'error'
          })
        }
        break

      case 'prazo_execucao_dias':
        if (!value || value < 1) {
          fieldErrors.push({
            field,
            message: 'Prazo deve ser de pelo menos 1 dia',
            type: 'error'
          })
        } else if (value < 3) {
          fieldErrors.push({
            field,
            message: 'Prazo muito curto',
            type: 'warning'
          })
        }
        break
    }

    return fieldErrors
  }, [])

  const clearValidation = useCallback(() => {
    setValidationResult({
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    })
  }, [])

  return {
    validationResult,
    isValidating,
    validate,
    validateField,
    clearValidation
  }
}

export default useFormValidation
