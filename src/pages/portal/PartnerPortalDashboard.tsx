import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, DollarSign, CheckCircle2, Clock, TrendingUp,
  Plus, RefreshCw, X, Loader2
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface Referral {
  referral_id: string
  service_order_id: string | null
  order_number: string | null
  customer_name: string
  status: string
  commission_value: number
  commission_type: string
  commission_paid: boolean
  created_at: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  concluido: { label: 'Concluido', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

export default function PartnerPortalDashboard() {
  const { portalUser } = usePortal()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewForm, setShowNewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_document: '',
    notes: '',
    commission_type: 'fixed' as 'fixed' | 'percentage',
    commission_value: ''
  })

  useEffect(() => {
    if (portalUser) loadReferrals()
  }, [portalUser])

  const loadReferrals = async () => {
    if (!portalUser) return
    setLoading(true)
    try {
      const { data } = await supabase.rpc('get_partner_portal_orders', {
        p_partner_account_id: portalUser.account_id
      })
      setReferrals(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!portalUser) return
    setSubmitting(true)
    try {
      await supabase.from('partner_referrals').insert({
        partner_account_id: portalUser.account_id,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_document: form.customer_document,
        notes: form.notes,
        commission_type: form.commission_type,
        commission_value: parseFloat(form.commission_value) || 0,
        status: 'pendente'
      })
      setForm({ customer_name: '', customer_phone: '', customer_document: '', notes: '', commission_type: 'fixed', commission_value: '' })
      setShowNewForm(false)
      loadReferrals()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const totalCommission = referrals
    .filter(r => r.commission_paid)
    .reduce((acc, r) => acc + (r.commission_value || 0), 0)

  const pendingCommission = referrals
    .filter(r => !r.commission_paid && r.status === 'concluido')
    .reduce((acc, r) => acc + (r.commission_value || 0), 0)

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {portalUser?.full_name?.split(' ')[0]}</h1>
          <p className="text-gray-500 text-sm">Portal do Parceiro - Indicacoes e Comissoes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadReferrals} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <RefreshCw size={18} className="text-gray-500" />
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={16} /> Nova Indicacao
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Indicacoes', value: referrals.length, icon: Users, color: 'green', display: String(referrals.length) },
          { label: 'Em Andamento', value: referrals.filter(r => r.status === 'em_andamento').length, icon: Clock, color: 'yellow', display: String(referrals.filter(r => r.status === 'em_andamento').length) },
          { label: 'Comissoes Pagas', value: totalCommission, icon: CheckCircle2, color: 'blue', display: formatCurrency(totalCommission) },
          { label: 'A Receber', value: pendingCommission, icon: DollarSign, color: 'orange', display: formatCurrency(pendingCommission) },
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
              <p className="text-xl font-bold text-gray-900">{stat.display}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Nova Indicacao de Cliente</h3>
              <button onClick={() => setShowNewForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Cliente *</label>
                <input
                  type="text" required value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nome completo ou razao social"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
                  <input
                    type="text" value={form.customer_phone}
                    onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF/CNPJ</label>
                  <input
                    type="text" value={form.customer_document}
                    onChange={e => setForm(f => ({ ...f, customer_document: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Documento"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Observacoes</label>
                <textarea
                  value={form.notes} rows={2}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  placeholder="Informacoes adicionais..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo Comissao</label>
                  <select
                    value={form.commission_type}
                    onChange={e => setForm(f => ({ ...f, commission_type: e.target.value as any }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="fixed">Valor Fixo</option>
                    <option value="percentage">Percentual (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {form.commission_type === 'fixed' ? 'Valor (R$)' : 'Percentual (%)'}
                  </label>
                  <input
                    type="number" min="0" step="0.01" value={form.commission_value}
                    onChange={e => setForm(f => ({ ...f, commission_value: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  {submitting ? 'Enviando...' : 'Registrar Indicacao'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Minhas Indicacoes</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw size={24} className="animate-spin text-green-500" /></div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma indicacao registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {referrals.map(ref => {
              const statusInfo = STATUS_MAP[ref.status] || STATUS_MAP.pendente
              return (
                <div key={ref.referral_id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {ref.order_number && (
                          <span className="text-xs font-mono text-gray-400">OS {ref.order_number}</span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{ref.customer_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(ref.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {ref.commission_type === 'percentage'
                          ? `${ref.commission_value}%`
                          : formatCurrency(ref.commission_value)
                        }
                      </p>
                      {ref.commission_paid ? (
                        <span className="text-xs text-green-600 font-medium">Pago</span>
                      ) : ref.status === 'concluido' ? (
                        <span className="text-xs text-orange-600 font-medium">A Receber</span>
                      ) : (
                        <span className="text-xs text-gray-400">Pendente</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
