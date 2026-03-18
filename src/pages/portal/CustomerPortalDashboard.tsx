import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle, Calendar,
  FileSignature, RefreshCw, FileText, ChevronRight, TrendingUp
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'
import { OSSignatureModal } from './OSSignatureModal'

interface CustomerOrder {
  id: string
  order_number: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  scheduled_date: string | null
  completed_date: string | null
  total_value: number
  has_signature: boolean
  technician_name: string
}

interface Budget {
  id: string
  budget_number: string
  title: string
  description: string
  status: string
  total_value: number
  created_at: string
  valid_until: string | null
  approved_at: string | null
  items_count: number
}

const ORDER_STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-700', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  aguardando: { label: 'Aguardando', color: 'bg-gray-100 text-gray-700', icon: Clock },
  pausado: { label: 'Pausado', color: 'bg-orange-100 text-orange-700', icon: Clock },
}

const BUDGET_STATUS_MAP: Record<string, { label: string; color: string }> = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-100 text-gray-600' },
  enviado: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
  reprovado: { label: 'Reprovado', color: 'bg-red-100 text-red-700' },
  vencido: { label: 'Vencido', color: 'bg-orange-100 text-orange-700' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-600' },
}

type Tab = 'os' | 'orcamentos'

export default function CustomerPortalDashboard() {
  const { portalUser } = usePortal()
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [budgetsLoading, setBudgetsLoading] = useState(true)
  const [signingOrder, setSigningOrder] = useState<CustomerOrder | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('os')

  useEffect(() => {
    if (portalUser?.linked_customer_id) {
      loadOrders()
      loadBudgets()
    }
  }, [portalUser])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_customer_portal_orders', {
        p_customer_id: portalUser!.linked_customer_id
      })
      if (!error) setOrders(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadBudgets = async () => {
    setBudgetsLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_customer_portal_budgets', {
        p_customer_id: portalUser!.linked_customer_id
      })
      if (!error) setBudgets(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setBudgetsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadOrders()
    loadBudgets()
  }

  const osStats = {
    total: orders.length,
    emAndamento: orders.filter(o => o.status === 'em_andamento').length,
    concluidas: orders.filter(o => o.status === 'concluido').length,
    aguardandoAssinatura: orders.filter(o => o.status === 'concluido' && !o.has_signature).length,
  }

  const budgetStats = {
    total: budgets.length,
    pendentes: budgets.filter(b => b.status === 'enviado').length,
    aprovados: budgets.filter(b => b.status === 'aprovado').length,
    totalAprovado: budgets.filter(b => b.status === 'aprovado').reduce((acc, b) => acc + (b.total_value || 0), 0),
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo, {portalUser?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Acompanhe suas ordens de serviço e orçamentos</p>
        </div>
        <button onClick={handleRefresh} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className="text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de OS', value: osStats.total, icon: ClipboardList, color: 'blue' },
          { label: 'Em Andamento', value: osStats.emAndamento, icon: Clock, color: 'yellow' },
          { label: 'Orçamentos Pendentes', value: budgetStats.pendentes, icon: FileText, color: 'orange' },
          { label: 'Orçamentos Aprovados', value: budgetStats.aprovados, icon: CheckCircle2, color: 'green' },
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

      {osStats.aguardandoAssinatura > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3">
          <FileSignature size={20} className="text-orange-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">
              {osStats.aguardandoAssinatura} OS aguardando sua assinatura digital
            </p>
            <p className="text-xs text-orange-600">Clique em "Assinar" na OS concluída para finalizar.</p>
          </div>
        </div>
      )}

      {budgetStats.pendentes > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
          <FileText size={20} className="text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-800">
              {budgetStats.pendentes} orçamento{budgetStats.pendentes > 1 ? 's' : ''} aguardando sua análise
            </p>
            <p className="text-xs text-blue-600">Consulte a aba "Orçamentos" para ver os detalhes.</p>
          </div>
          <button
            onClick={() => setActiveTab('orcamentos')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900 shrink-0"
          >
            Ver <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('os')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'os'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ClipboardList size={16} />
            Ordens de Serviço
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'os' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              {osStats.total}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('orcamentos')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-colors ${
              activeTab === 'orcamentos'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FileText size={16} />
            Orçamentos
            {budgetStats.pendentes > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
                {budgetStats.pendentes} pendente{budgetStats.pendentes > 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'os' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
                <p>Nenhuma ordem de serviço encontrada</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {orders.map(order => {
                  const statusInfo = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.aberto
                  const StatusIcon = statusInfo.icon
                  const canSign = order.status === 'concluido' && !order.has_signature
                  return (
                    <div key={order.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-gray-400">{order.order_number}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              <StatusIcon size={10} />
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900 truncate">{order.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {formatDate(order.created_at)}
                            </span>
                            {order.technician_name && <span>Técnico: {order.technician_name}</span>}
                            {order.total_value > 0 && (
                              <span className="font-medium text-gray-600">{formatCurrency(order.total_value)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {order.has_signature && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg font-medium">
                              <CheckCircle2 size={11} /> Assinado
                            </span>
                          )}
                          {canSign && (
                            <button
                              onClick={() => setSigningOrder(order)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              <FileSignature size={12} /> Assinar
                            </button>
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

        {activeTab === 'orcamentos' && (
          <>
            {budgetStats.aprovados > 0 && (
              <div className="px-6 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                <span className="text-sm text-green-700">
                  Total aprovado: <strong>{formatCurrency(budgetStats.totalAprovado)}</strong>
                </span>
              </div>
            )}
            {budgetsLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw size={24} className="animate-spin text-blue-500" />
              </div>
            ) : budgets.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p>Nenhum orçamento encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {budgets.map(budget => {
                  const statusInfo = BUDGET_STATUS_MAP[budget.status] || { label: budget.status, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <div key={budget.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {budget.budget_number && (
                              <span className="text-xs font-mono text-gray-400">#{budget.budget_number}</span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="font-semibold text-gray-900 truncate">{budget.title}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar size={11} /> {formatDate(budget.created_at)}
                            </span>
                            {budget.valid_until && <span>Válido até: {formatDate(budget.valid_until)}</span>}
                            {budget.items_count > 0 && (
                              <span>{budget.items_count} item{budget.items_count !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                          {budget.approved_at && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Aprovado em {formatDate(budget.approved_at)}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-gray-900">{formatCurrency(budget.total_value)}</p>
                          {budget.status === 'enviado' && (
                            <p className="text-xs text-orange-600 font-medium mt-0.5">Aguarda aprovação</p>
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

      {signingOrder && (
        <OSSignatureModal
          orderId={signingOrder.id}
          orderNumber={signingOrder.order_number}
          orderTitle={signingOrder.title}
          onClose={() => setSigningOrder(null)}
          onSigned={() => { setSigningOrder(null); loadOrders() }}
        />
      )}
    </div>
  )
}
