import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, ClipboardList, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface AddressEntry {
  address_full: string
  label: string
  os_count: number
  last_service: string
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR')
}

export default function CustomerPortalAddresses() {
  const { portalUser } = usePortal()
  const [addresses, setAddresses] = useState<AddressEntry[]>([])
  const [loading, setLoading] = useState(true)

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
        <button
          onClick={loadAddresses}
          className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <MapPin size={44} className="mx-auto mb-3 opacity-25" />
          <p className="font-medium">Nenhum endereço registrado</p>
          <p className="text-sm mt-1">Os endereços aparecem aqui após a realização de serviços</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
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
                    {addr.os_count} OS realizada{addr.os_count !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    Último serviço: {formatDate(addr.last_service)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
