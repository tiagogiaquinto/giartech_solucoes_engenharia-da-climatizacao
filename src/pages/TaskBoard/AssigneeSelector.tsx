import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, ChevronDown, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role?: string
  user_type?: string
  department?: string
  is_active?: boolean
}

interface AssigneeSelectorProps {
  value: { id?: string; name: string } | null
  onChange: (user: UserProfile | null) => void
  placeholder?: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Gestor',
  financial: 'Financeiro',
  sales: 'Comercial',
  technician: 'Tecnico',
  viewer: 'Visualizador',
  super_admin: 'Super Admin',
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-teal-100 text-teal-700',
  financial: 'bg-green-100 text-green-700',
  sales: 'bg-orange-100 text-orange-700',
  technician: 'bg-slate-100 text-slate-700',
  viewer: 'bg-gray-100 text-gray-600',
  super_admin: 'bg-red-100 text-red-700',
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export function AssigneeSelector({ value, onChange, placeholder = 'Buscar responsável...' }: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchUsers = useCallback(async (q: string, role: string) => {
    setLoading(true)
    let builder = supabase
      .from('user_profiles')
      .select('id, full_name, email, role, user_type, is_active')
      .eq('is_active', true)
      .order('full_name')
      .limit(30)

    if (q.trim()) {
      builder = builder.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
    }

    if (role !== 'all') {
      builder = builder.eq('role', role)
    }

    const { data } = await builder
    setUsers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) {
      fetchUsers(query, roleFilter)
    }
  }, [open, query, roleFilter, fetchUsers])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (user: UserProfile) => {
    onChange(user)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(null)
  }

  const availableRoles = ['all', 'admin', 'manager', 'financial', 'sales', 'technician']

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="w-full flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition text-left"
      >
        {value?.name ? (
          <>
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
              {initials(value.name)}
            </div>
            <span className="flex-1 text-gray-800 truncate">{value.name}</span>
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-red-400 transition shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="flex-1 text-gray-400">{placeholder}</span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.13 }}
            className="absolute z-[950] top-full mt-1.5 left-0 right-0 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
            style={{ minWidth: 280 }}
          >
            <div className="p-2 border-b border-gray-100">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar por nome ou email..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="flex gap-1 flex-wrap">
                {availableRoles.map(r => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition ${
                      roleFilter === r
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {r === 'all' ? 'Todos' : (ROLE_LABELS[r] || r)}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-5 text-xs text-gray-400">
                  Nenhum usuario encontrado
                </div>
              ) : (
                users.map(u => {
                  const isSelected = value?.id === u.id
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50 transition text-left ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {initials(u.full_name || u.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{u.full_name || u.email}</p>
                        <p className="text-xs text-gray-400 truncate">{u.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {u.role && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        )}
                        {isSelected && <Check className="h-3.5 w-3.5 text-blue-600" />}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
