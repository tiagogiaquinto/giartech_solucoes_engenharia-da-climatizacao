import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, ChevronDown, BarChart2, X, User, AlertTriangle, Search, Briefcase, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Task, COLUMNS } from './types'

interface SystemMember {
  id: string
  name: string
  role?: string
  email?: string
  avatarUrl?: string
  source: 'employee' | 'user_profile'
}

interface MemberLoad {
  id: string
  name: string
  role?: string
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

const AVATAR_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-teal-500 to-teal-700',
  'from-slate-500 to-slate-700',
  'from-sky-500 to-sky-700',
  'from-cyan-500 to-cyan-700',
  'from-green-500 to-green-700',
]

function gradientForName(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h) + name.charCodeAt(i)
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length]
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export function TeamWorkloadPanel({ tasks, selectedMember, onSelectMember }: TeamWorkloadPanelProps) {
  const [open, setOpen] = useState(false)
  const [systemMembers, setSystemMembers] = useState<SystemMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const fetchSystemMembers = useCallback(async () => {
    setLoadingMembers(true)
    try {
      const [{ data: employees }, { data: profiles }] = await Promise.all([
        supabase
          .from('employees')
          .select('id, name, role, email')
          .eq('active', true)
          .order('name'),
        supabase
          .from('user_profiles')
          .select('id, full_name, email, role')
          .order('full_name'),
      ])

      const memberMap = new Map<string, SystemMember>()

      employees?.forEach(e => {
        if (!e.name) return
        const key = e.name.toLowerCase().trim()
        memberMap.set(key, {
          id: e.id,
          name: e.name,
          role: e.role,
          email: e.email,
          source: 'employee',
        })
      })

      profiles?.forEach(p => {
        const displayName = p.full_name || p.email || ''
        if (!displayName) return
        const key = displayName.toLowerCase().trim()
        if (!memberMap.has(key)) {
          memberMap.set(key, {
            id: p.id,
            name: displayName,
            role: p.role,
            email: p.email,
            source: 'user_profile',
          })
        }
      })

      setSystemMembers(Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name)))
    } catch {
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  useEffect(() => {
    if (open && systemMembers.length === 0) {
      fetchSystemMembers()
    }
  }, [open, systemMembers.length, fetchSystemMembers])

  const taskLoadByName = useMemo<Record<string, MemberLoad>>(() => {
    const map: Record<string, MemberLoad> = {}
    tasks.forEach(t => {
      if (!t.assignee_name) return
      if (!map[t.assignee_name]) {
        map[t.assignee_name] = {
          id: t.assignee_id || t.assignee_name,
          name: t.assignee_name,
          total: 0, urgent: 0, done: 0, byColumn: {},
        }
      }
      const m = map[t.assignee_name]
      m.total++
      if (t.priority === 'urgent' && t.column_id !== 'done') m.urgent++
      if (t.column_id === 'done') m.done++
      m.byColumn[t.column_id] = (m.byColumn[t.column_id] || 0) + 1
    })
    return map
  }, [tasks])

  const allRoles = useMemo(() => {
    const roles = new Set<string>()
    systemMembers.forEach(m => { if (m.role) roles.add(m.role) })
    return Array.from(roles).sort()
  }, [systemMembers])

  const filteredMembers = useMemo(() => {
    let list = systemMembers
    if (roleFilter !== 'all') {
      list = list.filter(m => m.role === roleFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.role || '').toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [systemMembers, roleFilter, searchQuery])

  const unassigned = useMemo(
    () => tasks.filter(t => !t.assignee_name && t.column_id !== 'done').length,
    [tasks]
  )
  const maxLoad = useMemo(() => {
    const loads = Object.values(taskLoadByName).map(m => m.total - m.done)
    return Math.max(...loads, 1)
  }, [taskLoadByName])

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
        <span className="max-w-[120px] truncate">{selectedMember || 'Equipe'}</span>
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
              style={{ minWidth: 360, maxWidth: 420 }}
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-bold text-gray-800">Filtrar por Membro</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-3 pt-3 space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar por nome ou função..."
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white transition"
                    autoFocus
                  />
                </div>

                {allRoles.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      onClick={() => setRoleFilter('all')}
                      className={`text-xs px-2.5 py-1 rounded-full border transition ${
                        roleFilter === 'all'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      Todos
                    </button>
                    {allRoles.map(r => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition ${
                          roleFilter === r
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 max-h-72 overflow-y-auto space-y-1 mt-1">
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
                    <p className="font-semibold text-gray-800">Toda a Equipe</p>
                    <p className="text-xs text-gray-500">{tasks.filter(t => t.column_id !== 'done').length} tarefas ativas</p>
                  </div>
                  {!selectedMember && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                </button>

                {loadingMembers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">
                    Nenhum membro encontrado
                  </div>
                ) : (
                  filteredMembers.map(member => {
                    const load = taskLoadByName[member.name]
                    const activeTasks = load ? load.total - load.done : 0
                    const doneTasks = load ? load.done : 0
                    const pct = Math.round((activeTasks / maxLoad) * 100)
                    const isSelected = selectedMember === member.name
                    const isOverloaded = activeTasks >= 5
                    const gradient = gradientForName(member.name)

                    return (
                      <button
                        key={member.id}
                        onClick={() => { onSelectMember(member.name); setOpen(false) }}
                        className={`w-full px-3 py-2.5 rounded-xl text-left transition border ${
                          isSelected
                            ? 'bg-blue-50 border-blue-200'
                            : 'border-transparent hover:bg-gray-50 hover:border-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                            {initials(member.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-medium text-gray-800 truncate max-w-[150px]">{member.name}</p>
                              {isOverloaded && (
                                <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0" title="Alta carga de trabalho" />
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {member.role && (
                                <div className="flex items-center gap-0.5">
                                  <Briefcase className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                                  <span className="text-[10px] text-gray-500 truncate max-w-[140px]">{member.role}</span>
                                </div>
                              )}
                              {load && (
                                <span className="text-[10px] text-gray-400">
                                  · {activeTasks} ativa{activeTasks !== 1 ? 's' : ''}
                                  {doneTasks > 0 ? ` · ${doneTasks} concluída${doneTasks !== 1 ? 's' : ''}` : ''}
                                </span>
                              )}
                              {!load && (
                                <span className="text-[10px] text-gray-300">· sem tarefas</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {load?.urgent > 0 && (
                              <span className="text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 rounded-full px-1.5 py-0.5">
                                {load.urgent} urg
                              </span>
                            )}
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                          </div>
                        </div>

                        {load && activeTasks > 0 && (
                          <>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.4 }}
                                className={`h-full rounded-full ${isOverloaded ? 'bg-orange-500' : 'bg-blue-500'}`}
                              />
                            </div>
                            <div className="flex gap-1 mt-1">
                              {COLUMNS.filter(c => c.id !== 'done').map(col => {
                                const count = load.byColumn[col.id] || 0
                                if (count === 0) return null
                                return (
                                  <span key={col.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${COL_COLORS[col.id]}`}>
                                    {col.label.split(' ')[0]} {count}
                                  </span>
                                )
                              })}
                            </div>
                          </>
                        )}
                      </button>
                    )
                  })
                )}
              </div>

              {unassigned > 0 && (
                <div className="px-4 py-2.5 border-t border-gray-100 bg-amber-50 flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-amber-600" />
                  <p className="text-xs text-amber-700">
                    <span className="font-semibold">{unassigned}</span> tarefa{unassigned !== 1 ? 's' : ''} sem responsável atribuído
                  </p>
                </div>
              )}

              {systemMembers.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3 text-gray-400" />
                  <p className="text-[10px] text-gray-400">
                    {systemMembers.length} membro{systemMembers.length !== 1 ? 's' : ''} cadastrado{systemMembers.length !== 1 ? 's' : ''} no sistema
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
