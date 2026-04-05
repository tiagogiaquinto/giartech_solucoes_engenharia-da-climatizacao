import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CheckSquare, Square, Plus, Send, Trash2, Calendar,
  Tag, User, Flag, MessageSquare, Bot, History, Clock
} from 'lucide-react'
import { Task, PRIORITY_CONFIG, ColumnId, COLUMNS } from './types'
import { useTaskDetail } from './useTaskBoard'
import { AssigneeSelector, UserProfile } from './AssigneeSelector'
import { supabase } from '../../lib/supabase'

function formatDatetime(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function recordAssignment(
  taskId: string,
  taskTitle: string,
  user: UserProfile,
  assignedByName: string
) {
  await supabase.from('task_assignment_history').insert({
    task_id: taskId,
    task_title: taskTitle,
    assigned_to_id: user.id,
    assigned_to_name: user.full_name || user.email,
    assigned_to_email: user.email,
    assigned_by_name: assignedByName,
  })

  await supabase.from('task_notifications').insert({
    recipient_user_id: user.id,
    recipient_email: user.email,
    task_id: taskId,
    task_title: taskTitle,
    assigned_by_name: assignedByName,
    message: `${assignedByName} atribuiu a tarefa "${taskTitle}" a voce.`,
    read: false,
  })
}

interface Props {
  taskId: string | null
  onClose: () => void
  onUpdate: (id: string, payload: Partial<Task>) => void
  onDelete: (id: string) => void
  currentUserName?: string
}

export function TaskDetailDrawer({ taskId, onClose, onUpdate, onDelete, currentUserName = 'Diretor' }: Props) {
  const { task, subtasks, comments, toggleSubtask, addSubtask, deleteSubtask, addComment, setTask } = useTaskDetail(taskId)
  const [newSubtask, setNewSubtask] = useState('')
  const [commentText, setCommentText] = useState('')
  const [editTitle, setEditTitle] = useState(false)
  const [titleVal, setTitleVal] = useState('')
  const [assigning, setAssigning] = useState(false)

  if (!taskId) return null

  const prio = task ? PRIORITY_CONFIG[task.priority] : null
  const completedCount = subtasks.filter(s => s.completed).length

  const handleAddSubtask = async () => {
    const trimmed = newSubtask.trim()
    if (!trimmed) return
    await addSubtask(trimmed)
    setNewSubtask('')
  }

  const handleComment = async () => {
    const trimmed = commentText.trim()
    if (!trimmed) return
    await addComment(trimmed, currentUserName)
    setCommentText('')
  }

  const handleTitleSave = () => {
    if (titleVal.trim() && task) {
      onUpdate(task.id, { title: titleVal.trim() })
      setTask(prev => prev ? { ...prev, title: titleVal.trim() } : prev)
    }
    setEditTitle(false)
  }

  const handleColumnChange = (col: ColumnId) => {
    if (!task) return
    onUpdate(task.id, { column_id: col, blocked_since: col === 'blocked' ? new Date().toISOString() : undefined })
    setTask(prev => prev ? { ...prev, column_id: col } : prev)
  }

  const handleAssigneeChange = async (user: UserProfile | null) => {
    if (!task) return
    setAssigning(true)

    const payload: Partial<Task> = {
      assignee_id: user?.id,
      assignee_name: user ? (user.full_name || user.email) : undefined,
      assignee_email: user?.email,
      assignee_cargo: user?.cargo || user?.role || undefined,
      assignee_department: user?.department || undefined,
      assigned_by_name: currentUserName,
      assigned_at: user ? new Date().toISOString() : undefined,
    }

    onUpdate(task.id, payload)
    setTask(prev => prev ? { ...prev, ...payload } : prev)

    if (user) {
      await recordAssignment(task.id, task.title, user, currentUserName)
      await addComment(
        `Tarefa atribuida a ${user.full_name || user.email} por ${currentUserName}.`,
        'Sistema',
        true
      )
    }

    setAssigning(false)
  }

  return (
    <AnimatePresence>
      {taskId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-[900]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed top-0 right-0 h-full w-[540px] max-w-full bg-white shadow-2xl z-[901] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
              {editTitle ? (
                <input
                  autoFocus
                  className="flex-1 text-lg font-bold text-gray-800 border-b-2 border-blue-500 outline-none bg-transparent mr-4"
                  value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                />
              ) : (
                <h2
                  className="text-lg font-bold text-gray-800 flex-1 cursor-text hover:text-blue-700 transition-colors truncate mr-4"
                  onClick={() => { setTitleVal(task?.title || ''); setEditTitle(true) }}
                  title="Clique para editar"
                >
                  {task?.title || '...'}
                </h2>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => task && onDelete(task.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                  title="Excluir tarefa"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Flag className="h-3 w-3" /> Coluna
                  </label>
                  <select
                    value={task?.column_id || 'todo'}
                    onChange={e => handleColumnChange(e.target.value as ColumnId)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Flag className="h-3 w-3" /> Prioridade
                  </label>
                  <select
                    value={task?.priority || 'normal'}
                    onChange={e => task && onUpdate(task.id, { priority: e.target.value as any })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <User className="h-3 w-3" /> Responsavel
                    {assigning && <span className="text-blue-500 text-[10px] ml-1">Atribuindo...</span>}
                  </label>
                  <AssigneeSelector
                    value={
                      (task?.assignee_id || task?.assignee_name)
                        ? { id: task?.assignee_id, name: task?.assignee_name || '' }
                        : null
                    }
                    onChange={handleAssigneeChange}
                  />
                  {(task?.assignee_cargo || task?.assignee_department) && (
                    <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                      {task.assignee_cargo && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          {task.assignee_cargo}
                        </span>
                      )}
                      {task.assignee_department && (
                        <span className="text-[10px] text-gray-400">{task.assignee_department}</span>
                      )}
                    </div>
                  )}
                  {task?.assigned_by_name && task?.assigned_at && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400">
                      <History className="h-3 w-3" />
                      <span>
                        Atribuido por <span className="font-medium text-gray-600">{task.assigned_by_name}</span>{' '}
                        em {new Date(task.assigned_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Prazo
                  </label>
                  <input
                    type="date"
                    defaultValue={task?.due_date || ''}
                    onBlur={e => task && onUpdate(task.id, { due_date: e.target.value || undefined })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Categoria
                  </label>
                  <input
                    defaultValue={task?.category || ''}
                    onBlur={e => task && onUpdate(task.id, { category: e.target.value || undefined })}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Ex: Financeiro, Comercial..."
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Tag className="h-3 w-3" /> Descricao
                </label>
                <textarea
                  key={task?.id}
                  defaultValue={task?.description || ''}
                  onBlur={e => task && onUpdate(task.id, { description: e.target.value })}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="Descricao da tarefa..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" />
                    Subtarefas
                    {subtasks.length > 0 && (
                      <span className="ml-1 text-gray-400">({completedCount}/{subtasks.length})</span>
                    )}
                  </span>
                </div>

                {subtasks.length > 0 && (
                  <div className="mb-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${subtasks.length ? Math.round((completedCount / subtasks.length) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      {subtasks.map(s => (
                        <div key={s.id} className="flex items-center gap-2 group">
                          <button onClick={() => toggleSubtask(s.id)} className="shrink-0 text-gray-400 hover:text-teal-600 transition">
                            {s.completed
                              ? <CheckSquare className="h-4 w-4 text-teal-500" />
                              : <Square className="h-4 w-4" />
                            }
                          </button>
                          <span className={`flex-1 text-sm ${s.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{s.title}</span>
                          <button
                            onClick={() => deleteSubtask(s.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddSubtask()}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Nova subtarefa..."
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-3">
                  <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Chat da Tarefa
                  </span>
                </div>

                <div className="space-y-3 mb-3 max-h-52 overflow-y-auto pr-1">
                  {comments.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4">Nenhuma mensagem ainda...</p>
                  )}
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold text-white ${c.is_thomaz ? 'bg-gradient-to-br from-blue-500 to-blue-700' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
                        {c.is_thomaz ? <Bot className="h-3.5 w-3.5" /> : (c.author_name?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-gray-700">{c.author_name}</span>
                          <span className="text-[10px] text-gray-400">{formatDatetime(c.created_at)}</span>
                        </div>
                        <p className={`text-sm leading-relaxed rounded-xl px-3 py-2 ${c.is_thomaz ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-700'}`}>
                          {c.body}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleComment()}
                    className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="Escreva um comentario..."
                  />
                  <button
                    onClick={handleComment}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {prio && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Criado em: {task?.created_at ? new Date(task.created_at).toLocaleDateString('pt-BR') : '-'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium border ${prio.bg} ${prio.text} ${prio.border}`}>
                      {prio.label}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
