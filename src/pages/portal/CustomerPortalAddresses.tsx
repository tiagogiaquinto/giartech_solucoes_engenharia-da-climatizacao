import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Clock, ClipboardList, RefreshCw, X, ChevronRight,
  Calendar, Wrench, CheckCircle2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface AddressEntry {
  address_full: string
  label: string
  os_count: number
  last_service: string | null
}

interface AddressOS {
  id: string
  order_number: string
  title: string
  status: string
  created_at: string
  completed_at: string | null
  technician_name: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  aberto:       { label: 'Aberto',       color: 'bg-blue-100 text-blue-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-700' },
  concluido:    { label: 'Concluído',    color: 'bg-green-100 text-green-700' },
  cancelado:    { label: 'Cancelado',    color: 'bg-red-100 text-red-700' },
  aguardando:   { label: 'Aguardando',   color: 'bg-gray-100 text-gray-600' },
  pausado:      { label: 'Pausado',      color: 'bg-orange-100 text-orange-700' },
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

interface AddressDetailModalProps {
  address: AddressEntry
  customerId: string
  onClose: () => void
}

function AddressDetailModal({ address, customerId, onClose }: AddressDetailModalProps) {
  const [orders, setOrders] = useState<AddressOS[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data } = await supabase
        .from('service_orders')
        .select('id, order_number, title, status, created_at, completed_date, technician_name')
        .eq('customer_id', customerId)
        .or(`address_full.eq.${address.address_full},local_atendimento.ilike.%${address.address_full.substring(0, 30)}%`)
        .order('created_at', { ascending: false })
        .limit(20)
      setOrders(data?.map((o: any) => ({
        id: o.id,
        order_number: o.order_number,
        title: o.title,
        status: o.status,
        created_at: o.created_at,
        completed_at: o.completed_date,
        technician_name: o.technician_name,
      })) || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={18} className="text-blue-600" />
            </div>
            <div>
              {address.label && (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-0.5">{address.label}</p>
              )}
              <p className="text-sm font-semibold text-gray-900 leading-snug">{address.address_full}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <ClipboardList size={11} /> {address.os_count} OS
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> Último: {formatDate(address.last_service)}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Wrench size={12} /> Serviços realizados neste endereço
          </p>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw size={22} className="animate-spin text-blue-500" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ClipboardList size={32} className="mx-auto mb-2 opacity-25" />
              <p className="text-sm">Nenhuma OS encontrada para este endereço</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(o => {
                const st = STATUS_MAP[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={o.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-gray-400">{o.order_number}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{o.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(o.created_at)}</span>
                      {o.completed_at && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 size={10} /> {formatDate(o.completed_at)}
                        </span>
                      )}
                      {o.technician_name && <span>{o.technician_name}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function CustomerPortalAddresses() {
  const { portalUser } = usePortal()
  const [addresses, setAddresses] = useState<AddressEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AddressEntry | null>(null)

  useEffect(() => {
    if (portalUser?.linked_customer_id) loadAddresses()
  }, [portalUser])

  const loadAddresses = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_customer_portal_addresses', {
        p_customer_id: portalUser!.linked_customer_id
      })
      if (!error && data) setAddresses(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Endereços de Serviço</h1>
          <p className="text-gray-500 text-sm mt-1">Locais onde serviços foram realizados</p>
        </div>
        <button onClick={loadAddresses} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {addresses.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3">
            <MapPin size={20} className="text-blue-600 shrink-0" />
            <div>
              <p className="text-xl font-bold text-blue-700">{addresses.length}</p>
              <p className="text-xs text-blue-600">Endereço{addresses.length !== 1 ? 's' : ''} cadastrado{addresses.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 flex items-center gap-3">
            <ClipboardList size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="text-xl font-bold text-green-700">{addresses.reduce((s, a) => s + a.os_count, 0)}</p>
              <p className="text-xs text-green-600">OS realizadas no total</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <MapPin size={44} className="mx-auto mb-3 opacity-25" />
          <p className="font-medium text-gray-500">Nenhum endereço registrado</p>
          <p className="text-sm mt-1">Os endereços aparecem aqui após a realização de serviços</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(addr)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 text-left hover:shadow-md hover:border-blue-200 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                <MapPin size={18} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                {addr.label && (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{addr.label}</p>
                )}
                <p className="text-sm font-semibold text-gray-900 leading-snug">{addr.address_full}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <ClipboardList size={11} />
                    {addr.os_count} OS
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatDate(addr.last_service)}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0 mt-2" />
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selected && portalUser?.linked_customer_id && (
          <AddressDetailModal
            address={selected}
            customerId={portalUser.linked_customer_id}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
