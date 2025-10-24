import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

interface AutoSaveOptions {
  key: string
  data: any
  enabled?: boolean
  interval?: number
  onSave?: (success: boolean) => void
}

export const useAutoSave = ({
  key,
  data,
  enabled = true,
  interval = 30000,
  onSave
}: AutoSaveOptions) => {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const dataRef = useRef(data)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  const saveDraft = useCallback(async () => {
    if (!enabled || !dataRef.current) return

    try {
      setIsSaving(true)
      setError(null)

      const { data: existingDraft } = await supabase
        .from('service_order_drafts')
        .select('id')
        .eq('draft_name', key)
        .maybeSingle()

      if (existingDraft) {
        const { error: updateError } = await supabase
          .from('service_order_drafts')
          .update({
            draft_data: dataRef.current,
            last_saved_at: new Date().toISOString()
          })
          .eq('id', existingDraft.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('service_order_drafts')
          .insert({
            draft_name: key,
            draft_data: dataRef.current,
            user_id: null
          })

        if (insertError) throw insertError
      }

      setLastSaved(new Date())
      onSave?.(true)
    } catch (err: any) {
      console.error('Erro ao salvar rascunho:', err)
      setError(err.message)
      onSave?.(false)
    } finally {
      setIsSaving(false)
    }
  }, [enabled, key, onSave])

  useEffect(() => {
    if (!enabled) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      saveDraft()
    }, interval)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, enabled, interval, saveDraft])

  const manualSave = useCallback(async () => {
    await saveDraft()
  }, [saveDraft])

  const clearDraft = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('service_order_drafts')
        .delete()
        .eq('draft_name', key)

      if (error) throw error
      setLastSaved(null)
    } catch (err: any) {
      console.error('Erro ao limpar rascunho:', err)
      setError(err.message)
    }
  }, [key])

  return {
    isSaving,
    lastSaved,
    error,
    manualSave,
    clearDraft
  }
}

export const loadDraft = async (key: string) => {
  try {
    const { data, error } = await supabase
      .from('service_order_drafts')
      .select('draft_data, last_saved_at')
      .eq('draft_name', key)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Erro ao carregar rascunho:', err)
    return null
  }
}

export const listDrafts = async () => {
  try {
    const { data, error } = await supabase
      .from('service_order_drafts')
      .select('*')
      .order('last_saved_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Erro ao listar rascunhos:', err)
    return []
  }
}
