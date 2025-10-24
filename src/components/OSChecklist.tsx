import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Square, Camera, Clock, User, X, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

interface ChecklistItem {
  id: string
  title: string
  description?: string
  is_completed: boolean
  is_required: boolean
  requires_photo: boolean
  photo_url?: string
  completed_at?: string
  completed_by_name?: string
  notes?: string
  order_position: number
}

interface Checklist {
  id: string
  name: string
  description?: string
  progress_percentage: number
  total_items: number
  completed_items: number
}

interface OSChecklistProps {
  serviceOrderId: string
  category?: string
  onComplete?: () => void
}

export const OSChecklist = ({ serviceOrderId, category = 'geral', onComplete }: OSChecklistProps) => {
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const [newItemTitle, setNewItemTitle] = useState('')

  useEffect(() => {
    loadChecklist()
  }, [serviceOrderId])

  const loadChecklist = async () => {
    try {
      setLoading(true)

      let { data: existingChecklist, error: checklistError } = await supabase
        .from('service_order_checklists')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .maybeSingle()

      if (checklistError) throw checklistError

      if (!existingChecklist) {
        const { data: newChecklist, error: createError } = await supabase
          .rpc('create_default_checklist', {
            p_service_order_id: serviceOrderId,
            p_category: category
          })

        if (createError) throw createError

        const { data: createdChecklist } = await supabase
          .from('service_order_checklists')
          .select('*')
          .eq('service_order_id', serviceOrderId)
          .single()

        existingChecklist = createdChecklist
      }

      setChecklist(existingChecklist)

      const { data: itemsData, error: itemsError } = await supabase
        .from('service_order_checklist_items')
        .select('*')
        .eq('checklist_id', existingChecklist.id)
        .order('order_position')

      if (itemsError) throw itemsError
      setItems(itemsData || [])
    } catch (err) {
      console.error('Erro ao carregar checklist:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = async (item: ChecklistItem) => {
    setSavingItemId(item.id)

    try {
      const newCompleted = !item.is_completed

      const { error } = await supabase
        .from('service_order_checklist_items')
        .update({
          is_completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
          completed_by_name: newCompleted ? 'Usuário' : null
        })
        .eq('id', item.id)

      if (error) throw error

      setItems(prev =>
        prev.map(i =>
          i.id === item.id
            ? {
                ...i,
                is_completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : undefined,
                completed_by_name: newCompleted ? 'Usuário' : undefined
              }
            : i
        )
      )

      if (checklist) {
        const { data: updated } = await supabase
          .from('service_order_checklists')
          .select('*')
          .eq('id', checklist.id)
          .single()

        if (updated) {
          setChecklist(updated)
          if (updated.progress_percentage === 100 && onComplete) {
            onComplete()
          }
        }
      }
    } catch (err) {
      console.error('Erro ao atualizar item:', err)
      alert('Erro ao atualizar item')
    } finally {
      setSavingItemId(null)
    }
  }

  const addCustomItem = async () => {
    if (!newItemTitle.trim() || !checklist) return

    try {
      const maxPosition = Math.max(...items.map(i => i.order_position), 0)

      const { data, error } = await supabase
        .from('service_order_checklist_items')
        .insert({
          checklist_id: checklist.id,
          service_order_id: serviceOrderId,
          title: newItemTitle.trim(),
          is_required: false,
          requires_photo: false,
          order_position: maxPosition + 1
        })
        .select()
        .single()

      if (error) throw error

      setItems(prev => [...prev, data])
      setNewItemTitle('')
    } catch (err) {
      console.error('Erro ao adicionar item:', err)
      alert('Erro ao adicionar item')
    }
  }

  const deleteItem = async (itemId: string) => {
    if (!confirm('Deseja realmente excluir este item?')) return

    try {
      const { error } = await supabase
        .from('service_order_checklist_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch (err) {
      console.error('Erro ao excluir item:', err)
      alert('Erro ao excluir item')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!checklist) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold">{checklist.name}</h3>
            {checklist.description && (
              <p className="text-blue-100 text-sm mt-1">{checklist.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {checklist.progress_percentage.toFixed(0)}%
            </div>
            <div className="text-sm text-blue-100">
              {checklist.completed_items}/{checklist.total_items} concluídos
            </div>
          </div>
        </div>

        <div className="w-full bg-blue-800 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${checklist.progress_percentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-green-400 to-green-500 shadow-lg"
          />
        </div>
      </div>

      <div className="divide-y">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.03 }}
              className={`p-4 hover:bg-gray-50 transition-all ${
                item.is_completed ? 'bg-green-50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleItem(item)}
                  disabled={savingItemId === item.id}
                  className={`flex-shrink-0 mt-1 transition-all ${
                    savingItemId === item.id ? 'opacity-50' : ''
                  }`}
                >
                  {item.is_completed ? (
                    <CheckSquare className="w-6 h-6 text-green-600" />
                  ) : (
                    <Square className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${
                          item.is_completed
                            ? 'text-gray-500 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {item.title}
                        {item.is_required && (
                          <span className="ml-2 text-xs text-red-600">*obrigatório</span>
                        )}
                      </h4>

                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      )}

                      {item.is_completed && (item.completed_at || item.completed_by_name) && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {item.completed_by_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.completed_by_name}
                            </span>
                          )}
                          {item.completed_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(item.completed_at), 'dd/MM/yyyy HH:mm')}
                            </span>
                          )}
                        </div>
                      )}

                      {item.requires_photo && !item.photo_url && !item.is_completed && (
                        <div className="mt-2">
                          <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm">
                            <Camera className="w-4 h-4" />
                            Adicionar Foto
                          </button>
                        </div>
                      )}
                    </div>

                    {!item.is_required && (
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
            placeholder="Adicionar item personalizado..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={addCustomItem}
            disabled={!newItemTitle.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {checklist.progress_percentage === 100 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-green-50 border-t-4 border-green-500"
        >
          <div className="flex items-center gap-3 text-green-800">
            <CheckSquare className="w-8 h-8" />
            <div>
              <div className="font-bold text-lg">Checklist Concluído! 🎉</div>
              <div className="text-sm">
                Todos os itens foram verificados com sucesso
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
