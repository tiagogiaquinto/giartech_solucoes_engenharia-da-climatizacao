import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Package, MapPin, Calendar, AlertTriangle, CheckCircle2,
  RefreshCw, Plus, X, Loader2, Wrench, BarChart2,
  Thermometer, Wind, Zap, Settings
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface Equipment {
  id: string
  name: string
  equipment_type: string
  model: string
  brand: string
  serial_number: string
  location: string
  floor_area: string
  installed_at: string | null
  useful_life_years: number
  capacity: string
  notes: string
  is_active: boolean
  intervention_count: number
  last_intervention_date: string | null
  depreciation_percent: number
  remaining_life_years: number
  age_years: number
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'Ar Condicionado': <Wind size={18} />,
  'Chiller': <Thermometer size={18} />,
  'Elétrico': <Zap size={18} />,
  'Mecânico': <Settings size={18} />,
}

const getDepreciationColor = (pct: number) => {
  if (pct >= 80) return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Crítico' }
  if (pct >= 60) return { bar: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700', label: 'Atenção' }
  if (pct >= 40) return { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', label: 'Regular' }
  return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700', label: 'Bom' }
}

export default function CustomerPortalInventory() {
  const { portalUser } = usePortal()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [filterLocation, setFilterLocation] = useState('')

  useEffect(() => {
    if (portalUser?.linked_customer_id) loadEquipment()
  }, [portalUser])

  const loadEquipment = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_customer_portal_equipment', {
        p_customer_id: portalUser!.linked_customer_id
      })
      if (!error) setEquipment(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const locations = Array.from(new Set(equipment.map(e => e.location).filter(Boolean)))

  const filtered = filterLocation
    ? equipment.filter(e => e.location === filterLocation)
    : equipment

  const stats = {
    total: equipment.length,
    critical: equipment.filter(e => e.depreciation_percent >= 80).length,
    attention: equipment.filter(e => e.depreciation_percent >= 60 && e.depreciation_percent < 80).length,
    good: equipment.filter(e => e.depreciation_percent < 60).length,
    totalInterventions: equipment.reduce((acc, e) => acc + e.intervention_count, 0),
  }

  const topByInterventions = [...equipment]
    .sort((a, b) => b.intervention_count - a.intervention_count)
    .slice(0, 5)

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventário de Equipamentos</h1>
          <p className="text-gray-500 text-sm mt-1">Ativos instalados, depreciação e histórico de manutenções</p>
        </div>
        <button onClick={loadEquipment} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Ativos', value: stats.total, icon: Package, color: 'blue' },
          { label: 'Em Bom Estado', value: stats.good, icon: CheckCircle2, color: 'green' },
          { label: 'Requer Atenção', value: stats.attention, icon: AlertTriangle, color: 'yellow' },
          { label: 'Estado Crítico', value: stats.critical, icon: AlertTriangle, color: 'red' },
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
            >
              <div className={`w-10 h-10 rounded-xl bg-${stat.color}-100 flex items-center justify-center mb-3`}>
                <Icon size={20} className={`text-${stat.color}-600`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {topByInterventions.length > 0 && topByInterventions[0].intervention_count > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={18} className="text-blue-600" />
            <h2 className="font-bold text-gray-900">Equipamentos com Mais Intervenções</h2>
          </div>
          <div className="space-y-3">
            {topByInterventions.filter(e => e.intervention_count > 0).map((e, i) => {
              const maxCount = topByInterventions[0].intervention_count || 1
              const pct = (e.intervention_count / maxCount) * 100
              return (
                <div key={e.id} className="flex items-center gap-3">
                  <div className="w-5 text-xs text-gray-400 font-bold text-right">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800 truncate">{e.name}</span>
                      <span className="text-xs text-gray-500 ml-2 shrink-0">{e.intervention_count} intervenções</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{e.location}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {locations.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterLocation('')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              !filterLocation ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          {locations.map(loc => (
            <button
              key={loc}
              onClick={() => setFilterLocation(loc)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                filterLocation === loc ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <MapPin size={12} />
              {loc}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center py-16 text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum equipamento cadastrado</p>
          <p className="text-sm mt-1">Entre em contato para registrar seus ativos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((eq, i) => {
            const dep = getDepreciationColor(eq.depreciation_percent)
            const TypeIcon = TYPE_ICONS[eq.equipment_type]
            return (
              <motion.div
                key={eq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => setSelectedEquipment(eq)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${dep.bg} flex items-center justify-center shrink-0 ${dep.text}`}>
                        {TypeIcon || <Package size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 leading-tight">{eq.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{eq.equipment_type}{eq.model ? ` · ${eq.model}` : ''}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-semibold ${dep.badge}`}>
                      {dep.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                    <MapPin size={12} className="shrink-0" />
                    <span>{eq.location}{eq.floor_area ? ` — ${eq.floor_area}` : ''}</span>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-500">Depreciação</span>
                      <span className={`font-semibold ${dep.text}`}>{eq.depreciation_percent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${dep.bar}`}
                        style={{ width: `${eq.depreciation_percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1 text-gray-400">
                      <span>{eq.age_years > 0 ? `${eq.age_years} anos de uso` : 'Novo'}</span>
                      <span>{eq.remaining_life_years > 0 ? `${eq.remaining_life_years} anos restantes` : 'Vida útil encerrada'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Wrench size={12} />
                      <span>{eq.intervention_count} intervenções</span>
                    </div>
                    {eq.last_intervention_date && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={12} />
                        <span>Última: {formatDate(eq.last_intervention_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {selectedEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="font-bold text-gray-900">{selectedEquipment.name}</h3>
              <button
                onClick={() => setSelectedEquipment(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const dep = getDepreciationColor(selectedEquipment.depreciation_percent)
                return (
                  <>
                    <div className={`p-4 rounded-xl ${dep.bg}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-700">Depreciação Estimada</span>
                        <span className={`text-lg font-bold ${dep.text}`}>{selectedEquipment.depreciation_percent}%</span>
                      </div>
                      <div className="h-3 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${dep.bar}`}
                          style={{ width: `${selectedEquipment.depreciation_percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs mt-2 text-gray-500">
                        <span>Novo</span>
                        <span>Vida útil encerrada</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Tipo', value: selectedEquipment.equipment_type || '—' },
                        { label: 'Marca/Modelo', value: [selectedEquipment.brand, selectedEquipment.model].filter(Boolean).join(' ') || '—' },
                        { label: 'Localização', value: selectedEquipment.location || '—' },
                        { label: 'Área/Sala', value: selectedEquipment.floor_area || '—' },
                        { label: 'Capacidade', value: selectedEquipment.capacity || '—' },
                        { label: 'Nº de Série', value: selectedEquipment.serial_number || '—' },
                        { label: 'Instalado em', value: selectedEquipment.installed_at ? formatDate(selectedEquipment.installed_at) : '—' },
                        { label: 'Vida Útil', value: `${selectedEquipment.useful_life_years} anos` },
                        { label: 'Idade', value: selectedEquipment.age_years > 0 ? `${selectedEquipment.age_years} anos` : 'Novo' },
                        { label: 'Vida Restante', value: selectedEquipment.remaining_life_years > 0 ? `${selectedEquipment.remaining_life_years} anos` : 'Encerrada' },
                        { label: 'Intervenções', value: String(selectedEquipment.intervention_count) },
                        { label: 'Última Manutenção', value: formatDate(selectedEquipment.last_intervention_date) },
                      ].map(item => (
                        <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-400 mb-0.5">{item.label}</p>
                          <p className="text-sm font-semibold text-gray-800">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {selectedEquipment.notes && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 mb-1">Observações</p>
                        <p className="text-sm text-gray-700">{selectedEquipment.notes}</p>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
