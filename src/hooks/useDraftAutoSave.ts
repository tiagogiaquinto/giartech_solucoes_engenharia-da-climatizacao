/**
 * Hook de Auto-Save para Rascunhos
 *
 * Salva automaticamente o formulário de OS a cada 30 segundos
 * Recupera rascunho ao abrir a página
 * Mostra indicador visual de salvamento
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useDebounce } from './useDebounce'

export interface DraftData {
  formData: Record<string, any>
  serviceItems: any[]
  totals: Record<string, number>
}

export interface UseDraftAutoSaveOptions {
  userId?: string
  customerId?: string
  draftId?: string
  autoSaveInterval?: number // ms (default: 30000 = 30s)
  enabled?: boolean
}

export interface DraftStatus {
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
  draftId: string | null
}

export const useDraftAutoSave = (
  data: DraftData,
  options: UseDraftAutoSaveOptions = {}
) => {
  const {
    userId,
    customerId,
    draftId: initialDraftId,
    autoSaveInterval = 30000,
    enabled = true
  } = options

  const [status, setStatus] = useState<DraftStatus>({
    isSaving: false,
    lastSaved: null,
    error: null,
    draftId: initialDraftId || null
  })

  const [isInitialized, setIsInitialized] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const lastSaveDataRef = useRef<string>('')

  // Debounce dos dados para evitar salvamentos desnecessários
  const debouncedData = useDebounce(data, 2000)

  /**
   * Salvar rascunho no banco
   */
  const saveDraft = useCallback(async (forceCreate = false) => {
    if (!enabled) return

    try {
      setStatus(prev => ({ ...prev, isSaving: true, error: null }))

      // Verificar se os dados mudaram
      const currentDataString = JSON.stringify(debouncedData)
      if (currentDataString === lastSaveDataRef.current && !forceCreate) {
        setStatus(prev => ({ ...prev, isSaving: false }))
        return
      }

      const payload = {
        user_id: userId || null,
        customer_id: customerId || null,
        draft_data: debouncedData.formData,
        items_data: debouncedData.serviceItems,
        totals_data: debouncedData.totals,
        last_saved_at: new Date().toISOString()
      }

      if (status.draftId && !forceCreate) {
        // Atualizar rascunho existente
        const { error } = await supabase
          .from('service_order_drafts')
          .update(payload)
          .eq('id', status.draftId)

        if (error) throw error
      } else {
        // Criar novo rascunho
        const { data: newDraft, error } = await supabase
          .from('service_order_drafts')
          .insert([payload])
          .select()
          .single()

        if (error) throw error

        setStatus(prev => ({ ...prev, draftId: newDraft.id }))
      }

      lastSaveDataRef.current = currentDataString

      setStatus(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        error: null
      }))
    } catch (error: any) {
      console.error('Erro ao salvar rascunho:', error)
      setStatus(prev => ({
        ...prev,
        isSaving: false,
        error: error.message || 'Erro ao salvar rascunho'
      }))
    }
  }, [enabled, userId, customerId, status.draftId, debouncedData])

  /**
   * Carregar último rascunho do usuário
   */
  const loadDraft = useCallback(async () => {
    if (!enabled || !userId) return null

    try {
      const query = supabase
        .from('service_order_drafts')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (customerId) {
        query.eq('customer_id', customerId)
      }

      const { data: drafts, error } = await query

      if (error) throw error

      if (drafts && drafts.length > 0) {
        const draft = drafts[0]

        setStatus(prev => ({
          ...prev,
          draftId: draft.id,
          lastSaved: draft.last_saved_at ? new Date(draft.last_saved_at) : null
        }))

        return {
          id: draft.id,
          formData: draft.draft_data || {},
          serviceItems: draft.items_data || [],
          totals: draft.totals_data || {},
          lastSaved: draft.last_saved_at
        }
      }

      return null
    } catch (error: any) {
      console.error('Erro ao carregar rascunho:', error)
      setStatus(prev => ({
        ...prev,
        error: error.message || 'Erro ao carregar rascunho'
      }))
      return null
    }
  }, [enabled, userId, customerId])

  /**
   * Deletar rascunho
   */
  const deleteDraft = useCallback(async (draftIdToDelete?: string) => {
    const id = draftIdToDelete || status.draftId
    if (!id) return

    try {
      const { error } = await supabase
        .from('service_order_drafts')
        .delete()
        .eq('id', id)

      if (error) throw error

      setStatus({
        isSaving: false,
        lastSaved: null,
        error: null,
        draftId: null
      })
    } catch (error: any) {
      console.error('Erro ao deletar rascunho:', error)
      setStatus(prev => ({
        ...prev,
        error: error.message || 'Erro ao deletar rascunho'
      }))
    }
  }, [status.draftId])

  /**
   * Criar novo rascunho (útil para "Salvar Como")
   */
  const createNewDraft = useCallback(async () => {
    setStatus(prev => ({ ...prev, draftId: null }))
    await saveDraft(true)
  }, [saveDraft])

  /**
   * Inicializar: Carregar rascunho se existir
   */
  useEffect(() => {
    if (!isInitialized && enabled) {
      setIsInitialized(true)
      // Não carrega automaticamente, deixa componente decidir
    }
  }, [isInitialized, enabled])

  /**
   * Auto-save periódico
   */
  useEffect(() => {
    if (!enabled) return

    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Agendar próximo salvamento
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft()
    }, autoSaveInterval)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [enabled, debouncedData, autoSaveInterval, saveDraft])

  /**
   * Salvar antes de sair da página
   */
  useEffect(() => {
    if (!enabled) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Tentar salvar (pode não completar)
      saveDraft()

      // Avisar usuário se há mudanças não salvas
      if (status.isSaving) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [enabled, status.isSaving, saveDraft])

  return {
    // Estado
    status,

    // Ações
    saveDraft: () => saveDraft(),
    loadDraft,
    deleteDraft,
    createNewDraft,

    // Helpers
    getTimeSinceLastSave: () => {
      if (!status.lastSaved) return null
      const diff = Date.now() - status.lastSaved.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)

      if (minutes > 0) return `${minutes}m atrás`
      return `${seconds}s atrás`
    },

    // Status checks
    hasUnsavedChanges: () => {
      const currentDataString = JSON.stringify(data)
      return currentDataString !== lastSaveDataRef.current
    }
  }
}

export default useDraftAutoSave
