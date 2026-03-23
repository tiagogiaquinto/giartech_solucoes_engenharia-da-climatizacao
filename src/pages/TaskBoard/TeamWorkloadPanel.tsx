import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronDown, BarChart2, X, User, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Task, COLUMNS } from './types'

interface MemberLoad {
  name: string
  email?: string
  total: number
  urgent: number
  done: number
  byColumn: Record<string, number>
}

interface TeamWorkloadPanelProps {
  tasks: Task[]
  selectedMember: string | null
  onSelectMember: (name: string | null) => void
}

const COL_COLORS: Record<string, string> = {
  todo: 'bg-gray-400',
  in_progress: 'bg-blue-500',
  review: 'bg-amber-400',
  blocked: 'bg-red-500',
  done: 'bg-teal-500',
}

export function TeamWorkloadPanel({ tasks, selectedMember, onSelectMember }: TeamWorkloadPanelProps) {
  const [open, setOpen] = useState(false)

  const memberLoads = useMemo<MemberLoad[]>(() => {
    const map: Record<string, MemberLoad> = {}

    tasks.forEach(t => {
      if (!t.assignee_name) return
      if (!map[t.assignee_name]) {
        map[t.assignee_name] = {
          name: t.assignee_name,
          email: t.assignee_email,
          total: 0,
          urgent: 0,
          done: 0,
          byColumn: {},
        }
      }
      const m = map[t.assignee_name]
      m.total++
      if (t.priority === 'urgent' && t.column_id !== 'done') m.urgent++
      if (t.column_id === 'done') m.done++
      m.byColumn[t.column_id] = (m.byColumn[t.column_id] || 0) + 1
    })

    return Object.values(map).sort((a, b) => b.total - a.total)
  }, [tasks])

  const unassigned = useMemo(() => tasks.filter(t => !t.assignee_name && t.column_id !== 'done').length, [tasks])
  const maxLoad = useMemo(() => Math.max(...memberLoads.map(m => m.total), 1), [memberLoads])

  const initials = (name: string) =>
    name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border transition-all ${
          open || selectedMember
            ? 'bg-blue-600 text-white border-blue-600 shadow'
            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 shadow-sm'
        }`}
      >
        <Users className="h-4 w-4" />
        <span>{selectedMember || 'Visao da Equipe'}</span>
        {selectedMember && (
          <span
            onClick={e => { e.stopPropagation(); onSelectMember(null) }}
            className="ml-1 opacity-70 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[940]"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-0 z-[941] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden"
              style={{ minWidth: 340, maxWidth: 400 }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-bold text-gray-800">Carga de Trabalho da Equipe</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-3 max-h-80 overflow-y-auto space-y-2">
                <button
                  onClick={() => { onSelectMember(null); setOpen(false) }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition text-left ${
                    !selectedMember ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">Toda a Equipe</p>
                    <p className="text-xs text-gray-500">{tasks.filter(t => t.column_id !== 'done').length} tarefas ativas</p>
                  </div>
                </button>

                {memberLoads.map(m => {
                  const activeTasks = m.total - m.done
                  const pct = Math.round((activeTasks / maxLoad) * 100)
                  const isSelected = selectedMember === m.name
                  const isOverloaded = activeTasks >= 5

                  return (
                    <button
                      key={m.name}
                      onClick={() => { onSelectMember(m.name); setOpen(false) }}
                      className={`w-full px-3 py-2.5 rounded-xl text-left transition border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-200'
                          : 'border-transparent hover:bg-gray-50 hover:border-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {initials(m.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                            {isOverloaded && (
                              <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0" title="Alta carga" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{activeTasks} ativa{activeTasks !== 1 ? 's' : ''} · {m.done} concluida{m.done !== 1 ? 's' : ''}</p>
                        </div>
                        {m.urgent > 0 && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 rounded-full px-1.5 py-0.5">
                            {m.urgent} urg
                          </span>
                        )}
                      </div>

                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4 }}
                          className={`h-full rounded-full ${isOverloaded ? 'bg-orange-500' : 'bg-blue-500'}`}
                        />
                      </div>

                      <div className="flex gap-1 mt-1.5">
                        {COLUMNS.filter(c => c.id !== 'done').map(col => {
                          const count = m.byColumn[col.id] || 0
                          if (count === 0) return null
                          return (
                            <span key={col.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${COL_COLORS[col.id]}`}>
                              {col.label.split(' ')[0]} {count}
                            </span>
                          )
                        })}
                      </div>
                    </button>
                  )
                })}

                {memberLoads.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">
                    Nenhum membro com tarefas atribuidas
                  </div>
                )}
              </div>

              {unassigned > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-amber-50 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">{unassigned}</span> tarefa{unassigned !== 1 ? 's' : ''} sem responsavel atribuido
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
