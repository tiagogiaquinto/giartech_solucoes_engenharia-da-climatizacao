import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart2, TrendingUp, DollarSign, CheckCircle2,
  RefreshCw, Calendar, Users, Award
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface HistoryPeriod {
  period_label: string
  referrals_count: number
  completed_count: number
  total_commission: number
  paid_commission: number
}

interface ReferralSummary {
  referral_id: string
  customer_name: string
  status: string
  commission_value: number
  commission_type: string
  commission_paid: boolean
  created_at: string
  order_number: string | null
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
}

export default function PartnerPortalHistory() {
  const { portalUser } = usePortal()
  const [history, setHistory] = useState<HistoryPeriod[]>([])
  const [referrals, setReferrals] = useState<ReferralSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'mensal' | 'detalhado'>('mensal')

  useEffect(() => {
    if (portalUser) loadData()
  }, [portalUser])

  const loadData = async () => {
    setLoading(true)
    try {
      const [histRes, refRes] = await Promise.all([
        supabase.rpc('get_partner_portal_history', {
          p_partner_account_id: portalUser!.account_id
        }),
        supabase.rpc('get_partner_portal_orders', {
          p_partner_account_id: portalUser!.account_id
        })
      ])
      if (!histRes.error) setHistory(histRes.data || [])
      if (!refRes.error) setReferrals(refRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totals = {
    totalReferrals: referrals.length,
    totalCompleted: referrals.filter(r => r.status === 'concluido').length,
    totalPaid: referrals.filter(r => r.commission_paid).reduce((acc, r) => acc + (r.commission_value || 0), 0),
    totalPending: referrals.filter(r => !r.commission_paid && r.status === 'concluido').reduce((acc, r) => acc + (r.commission_value || 0), 0),
    conversionRate: referrals.length > 0
      ? Math.round((referrals.filter(r => r.status === 'concluido').length / referrals.length) * 100)
      : 0,
  }

  const maxReferrals = Math.max(...history.map(h => h.referrals_count), 1)

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Parcerias</h1>
          <p className="text-gray-500 text-sm mt-1">Volume de serviços gerados e comissões</p>
        </div>
        <button onClick={loadData} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Indicações', value: String(totals.totalReferrals), icon: Users, color: 'green' },
          { label: 'Taxa de Conversão', value: `${totals.conversionRate}%`, icon: TrendingUp, color: 'blue' },
          { label: 'Comissões Pagas', value: formatCurrency(totals.totalPaid), icon: CheckCircle2, color: 'green' },
          { label: 'A Receber', value: formatCurrency(totals.totalPending), icon: DollarSign, color: 'orange' },
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
              <p className="text-xl font-bold text-gray-900 leading-tight">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {totals.totalCompleted > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <Award size={20} className="text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              {totals.totalCompleted} indicação{totals.totalCompleted > 1 ? 'ões' : ''} convertida{totals.totalCompleted > 1 ? 's' : ''} em serviço!
            </p>
            <p className="text-xs text-green-600">Taxa de conversão de {totals.conversionRate}% — excelente resultado.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('mensal')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'mensal'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart2 size={16} />
            Volume Mensal
          </button>
          <button
            onClick={() => setActiveTab('detalhado')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'detalhado'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users size={16} />
            Detalhado
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'detalhado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {totals.totalReferrals}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-green-500" />
          </div>
        ) : activeTab === 'mensal' ? (
          <>
            {history.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
                <p>Nenhum dado de histórico disponível</p>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="space-y-3">
                  {history.map((period, i) => (
                    <motion.div
                      key={period.period_label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-gray-50 rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm font-bold text-gray-800">{period.period_label}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{period.referrals_count} indicações</span>
                          <span className="text-green-600 font-medium">{period.completed_count} concluídas</span>
                        </div>
                      </div>

                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Indicações no período</span>
                          <span className="font-semibold text-gray-700">{period.referrals_count}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${(period.referrals_count / maxReferrals) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-white rounded-lg p-2.5">
                          <p className="text-xs text-gray-400">Comissão Total</p>
                          <p className="text-sm font-bold text-gray-800">{formatCurrency(period.total_commission)}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5">
                          <p className="text-xs text-gray-400">Comissão Paga</p>
                          <p className="text-sm font-bold text-green-700">{formatCurrency(period.paid_commission)}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-xl">
                  <p className="text-xs font-semibold text-green-700 mb-2">Resumo dos últimos 12 meses</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {history.reduce((acc, h) => acc + h.referrals_count, 0)}
                      </p>
                      <p className="text-xs text-gray-500">Total indicações</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {history.reduce((acc, h) => acc + h.completed_count, 0)}
                      </p>
                      <p className="text-xs text-gray-500">Concluídas</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(history.reduce((acc, h) => acc + h.paid_commission, 0))}
                      </p>
                      <p className="text-xs text-gray-500">Comissões pagas</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {referrals.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>Nenhuma indicação registrada</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {referrals.map(ref => {
                  const statusInfo = STATUS_MAP[ref.status] || STATUS_MAP.pendente
                  return (
                    <div key={ref.referral_id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {ref.order_number && (
                              <span className="text-xs font-mono text-gray-400">OS {ref.order_number}</span>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900">{ref.customer_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <Calendar size={11} /> {formatDate(ref.created_at)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-800">
                            {ref.commission_type === 'percentage'
                              ? `${ref.commission_value}%`
                              : formatCurrency(ref.commission_value)
                            }
                          </p>
                          {ref.commission_paid ? (
                            <span className="flex items-center justify-end gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle2 size={11} /> Pago
                            </span>
                          ) : ref.status === 'concluido' ? (
                            <span className="text-xs text-orange-600 font-medium">A receber</span>
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
          </>
        )}
      </div>
    </div>
  )
}
