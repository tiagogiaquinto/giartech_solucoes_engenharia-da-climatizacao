import { PostgrestError } from '@supabase/supabase-js'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const handleSupabaseError = (error: PostgrestError | Error): AppError => {
  if ('code' in error && 'message' in error) {
    const postgrestError = error as PostgrestError

    const errorMessages: Record<string, string> = {
      '23505': 'Este registro já existe no sistema',
      '23503': 'Não é possível excluir este registro pois existem dados vinculados',
      '23502': 'Campos obrigatórios não foram preenchidos',
      '42P01': 'Tabela não encontrada no banco de dados',
      'PGRST116': 'Nenhum registro encontrado',
      '42501': 'Você não tem permissão para realizar esta ação'
    }

    const message = errorMessages[postgrestError.code] || postgrestError.message
    return new AppError(message, postgrestError.code, 400)
  }

  return new AppError(error.message || 'Erro desconhecido', undefined, 500)
}

export const showErrorNotification = (error: AppError | Error) => {
  const message = error instanceof AppError ? error.message : 'Ocorreu um erro inesperado'

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Erro', {
      body: message,
      icon: '/error-icon.png'
    })
  }

  console.error('Error:', error)
  return message
}

export const handleAsyncOperation = async <T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Erro ao realizar operação'
): Promise<{ data: T | null; error: string | null }> => {
  try {
    const data = await operation()
    return { data, error: null }
  } catch (error) {
    const appError = error instanceof AppError
      ? error
      : handleSupabaseError(error as Error)

    const message = showErrorNotification(appError)
    return { data: null, error: message }
  }
}
