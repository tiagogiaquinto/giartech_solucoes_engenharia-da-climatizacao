import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, AlertTriangle, Clock, ChevronRight, RefreshCw, Wrench } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PMOCEntry {
  asset_id: string
  customer_id: string
  customer_name: string
  asset_description: string
  next_maintenance: string
  days_until_maintenance: number
  periodicity_months: number
  is_urgent: boolean
}

export default function PMOCSchedulePanel() {
  const [entries, setEntries] = useState<PMOCEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [daysAhead, setDaysAhead] = useState(30)

  useEffect(() => { load() }, [daysAhead])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.rpc('fn_get_pmoc_schedule', { p_days_ahead: daysAhead })
      setEntries(data || [])
    } finally {
      setLoading(false)
    }
  }

  const urgentCount = entries.filter(e => e.is_urgent).length

  const urgencyColor = (days: number) => {
    if (days <= 0) return { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'Vencido' }
    if (days <= 7) return { bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: `${days}d` }
    if (days <= 15) return { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', label: `${days}d` }
    return { bg: 'bg-white border-gray-100', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400', label: `${days}d` }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">PMOC — Preventivas Programadas</h3>
            <p className="text-xs text-gray-500">Próximas manutenções agendadas automaticamente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {urgentCount > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
            </span>
          )}
          <select
            value={daysAhead}
            onChange={e => setDaysAhead(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600"
          >
            <option value={15}>15 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>
          <button onClick={load} className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10">
          <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">Nenhuma preventiva nos próximos {daysAhead} dias</p>
          <p className="text-xs text-gray-400 mt-1">As preventivas aparecem aqui automaticamente ao finalizar OSs com equipamento</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {entries.map((entry, i) => {
            const colors = urgencyColor(entry.days_until_maintenance)
            return (
              <motion.div
                key={entry.asset_id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`px-5 py-3.5 flex items-center gap-4 border-l-4 ${colors.bg} ${
                  entry.is_urgent ? 'border-l-red-400' : 'border-l-transparent'
                }`}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{entry.customer_name}</p>
                  <p className="text-xs text-gray-500 truncate">{entry.asset_description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${colors.badge}`}>
                    {colors.label}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(entry.next_maintenance).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
