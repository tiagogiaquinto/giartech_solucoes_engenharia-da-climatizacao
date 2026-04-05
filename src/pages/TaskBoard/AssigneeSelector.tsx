import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, User, ChevronDown, X, Check, Briefcase } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export interface UserProfile {
  id: string
  full_name: string
  email: string
  role?: string
  cargo?: string
  department?: string
  is_active?: boolean
  source: 'user_profile' | 'employee'
}

interface AssigneeSelectorProps {
  value: { id?: string; name: string } | null
  onChange: (user: UserProfile | null) => void
  placeholder?: string
}

const CARGO_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-green-100 text-green-700',
  'bg-rose-100 text-rose-700',
  'bg-amber-100 text-amber-700',
  'bg-slate-100 text-slate-700',
]

const AVATAR_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-teal-500 to-teal-700',
  'from-orange-500 to-orange-700',
  'from-green-500 to-green-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-600',
  'from-slate-500 to-slate-700',
]

function hashStr(str: string) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return Math.abs(h)
}

function cargoColor(cargo: string) {
  return CARGO_PALETTE[hashStr(cargo) % CARGO_PALETTE.length]
}

function avatarGradient(name: string) {
  return AVATAR_GRADIENTS[hashStr(name) % AVATAR_GRADIENTS.length]
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export function AssigneeSelector({ value, onChange, placeholder = 'Buscar responsável...' }: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cargoFilter, setCargoFilter] = useState<string>('all')
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(false)
  const [availableCargos, setAvailableCargos] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchUsers = useCallback(async (q: string, cargo: string) => {
    setLoading(true)

    const [{ data: employees }, { data: userProfiles }] = await Promise.all([
      supabase
        .from('employees')
        .select('id, name, email, role, department, is_active')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('user_profiles')
        .select('id, full_name, email, role, is_active')
        .eq('is_active', true)
        .order('full_name')
        .limit(20),
    ])

    const empList: UserProfile[] = (employees || [])
      .filter((e: any) => e.name)
      .map((e: any) => ({
        id: e.id,
        full_name: e.name,
        email: e.email || '',
        cargo: (e.role || '').trim(),
        department: (e.department || '').trim(),
        is_active: true,
        source: 'employee' as const,
      }))

    const cargos = Array.from(new Set(empList.map(e => e.cargo).filter(Boolean))) as string[]
    setAvailableCargos(cargos)

    const empIds = new Set(empList.map(e => e.id))
    const profileList: UserProfile[] = (userProfiles || [])
      .filter((u: any) => !empIds.has(u.id) && u.full_name)
      .map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email || '',
        role: u.role || '',
        is_active: true,
        source: 'user_profile' as const,
      }))

    let combined = [...empList, ...profileList]

    if (q.trim()) {
      const lower = q.toLowerCase()
      combined = combined.filter(u =>
        u.full_name.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        (u.cargo || '').toLowerCase().includes(lower) ||
        (u.department || '').toLowerCase().includes(lower)
      )
    }

    if (cargo !== 'all') {
      combined = combined.filter(u =>
        (u.cargo || '').trim().toLowerCase() === cargo.toLowerCase()
      )
    }

    setUsers(combined)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) fetchUsers(query, cargoFilter)
  }, [open, query, cargoFilter, fetchUsers])

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

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="w-full flex items-center gap-2 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition text-left"
      >
        {value?.name ? (
          <>
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarGradient(value.name)} flex items-center justify-center text-[9px] font-bold text-white shrink-0`}>
              {initials(value.name)}
            </div>
            <span className="flex-1 text-gray-800 truncate">{value.name}</span>
            <button onClick={handleClear} className="text-gray-400 hover:text-red-400 transition shrink-0">
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
            style={{ minWidth: 300 }}
          >
            <div className="p-2 border-b border-gray-100">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Buscar por nome, cargo ou departamento..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {availableCargos.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setCargoFilter('all')}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition ${
                      cargoFilter === 'all'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    Todos
                  </button>
                  {availableCargos.map(c => (
                    <button
                      key={c}
                      onClick={() => setCargoFilter(c)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition ${
                        cargoFilter === c
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-5 text-xs text-gray-400">
                  Nenhum funcionário encontrado
                </div>
              ) : (
                users.map(u => {
                  const isSelected = value?.id === u.id
                  const label = u.cargo || u.role || ''
                  const dept = u.department || ''
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelect(u)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50 transition text-left ${isSelected ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGradient(u.full_name)} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                        {initials(u.full_name || u.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{u.full_name || u.email}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {label && (
                            <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cargoColor(label)}`}>
                              <Briefcase className="h-2.5 w-2.5" />
                              {label}
                            </span>
                          )}
                          {dept && (
                            <span className="text-[10px] text-gray-400 truncate">{dept}</span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
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
