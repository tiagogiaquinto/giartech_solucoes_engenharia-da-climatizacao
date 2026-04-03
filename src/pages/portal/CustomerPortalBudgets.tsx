import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, RefreshCw, X, ChevronRight, Calendar, CheckCircle2,
  Clock, AlertCircle, Package, DollarSign, Tag, FileSignature,
  Building2, Phone, Mail, MapPin, Percent
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { usePortal } from '../../contexts/PortalContext'

interface BudgetListItem {
  id: string
  budget_number: string
  title: string
  status: string
  total_value: number
  created_at: string
  valid_until: string | null
  approved_at: string | null
  items_count: number
}

interface BudgetItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  total: number
  category?: string
}

interface BudgetData {
  number: string
  date: string
  validUntil: string
  customer: {
    name: string
    document: string
    email?: string
    phone?: string
    address?: string
  }
  company: {
    name: string
    document: string
    email: string
    phone: string
    address: string
  }
  items: BudgetItem[]
  subtotal: number
  discount?: number
  discountType?: 'percentage' | 'fixed'
  taxes?: number
  total: number
  notes?: string
  paymentTerms?: string
  observations?: string
}

interface FullBudget {
  id: string
  number: string
  status: string
  data: BudgetData | null
  created_at: string
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-100 text-gray-600', icon: FileText },
  enviado:  { label: 'Aguardando Aprovação', color: 'bg-blue-100 text-blue-700', icon: Clock },
  aprovado: { label: 'Aprovado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  reprovado:{ label: 'Reprovado', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  vencido:  { label: 'Vencido', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  cancelado:{ label: 'Cancelado', color: 'bg-red-100 text-red-600', icon: X },
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—'

interface BudgetDetailModalProps {
  budgetId: string
  onClose: () => void
}

function BudgetDetailModal({ budgetId, onClose }: BudgetDetailModalProps) {
  const [budget, setBudget] = useState<FullBudget | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBudget()
  }, [budgetId])

  const loadBudget = async () => {
    try {
      const { data } = await supabase
        .from('budgets')
        .select('id, number, status, data, created_at')
        .eq('id', budgetId)
        .maybeSingle()
      if (data) setBudget(data as FullBudget)
    } finally {
      setLoading(false)
    }
  }

  const bd = budget?.data

  const discountAmount = bd?.discount && bd.discount > 0
    ? bd.discountType === 'percentage'
      ? (bd.subtotal * bd.discount) / 100
      : bd.discount
    : 0

  const statusInfo = budget ? (STATUS_MAP[budget.status] || STATUS_MAP.rascunho) : STATUS_MAP.rascunho
  const StatusIcon = statusInfo.icon

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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <FileText size={18} className="text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                {budget?.data?.number && (
                  <span className="text-xs font-mono text-gray-400">#{budget.data.number}</span>
                )}
                {budget && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                    <StatusIcon size={10} />
                    {statusInfo.label}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-gray-900 leading-snug">
                {bd ? `Orçamento ${bd.number}` : 'Carregando...'}
              </p>
              {budget && (
                <p className="text-xs text-gray-400 mt-0.5">Emitido em {formatDate(budget.created_at)}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-xl shrink-0">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={24} className="animate-spin text-blue-500" />
            </div>
          ) : !bd ? (
            <div className="text-center py-16 text-gray-400">
              <FileText size={40} className="mx-auto mb-3 opacity-30" />
              <p>Detalhes do orçamento não disponíveis</p>
            </div>
          ) : (
            <div className="p-5 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Calendar size={10} /> Data de Emissão
                  </p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(bd.date)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Clock size={10} /> Válido até
                  </p>
                  <p className="text-sm font-semibold text-gray-800">{formatDate(bd.validUntil)}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Building2 size={11} /> Empresa Emissora
                </p>
                <p className="text-sm font-semibold text-gray-900">{bd.company.name}</p>
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Phone size={10} /> {bd.company.phone}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Mail size={10} /> {bd.company.email}
                  </p>
                  {bd.company.address && (
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin size={10} /> {bd.company.address}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Package size={11} /> Itens do Orçamento
                </p>
                <div className="space-y-2">
                  {bd.items.map((item, i) => (
                    <div key={item.id || i} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono text-gray-400 shrink-0">#{i + 1}</span>
                            {item.category && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Tag size={9} /> {item.category}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-800 leading-snug">{item.description}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-gray-900 shrink-0">{formatCurrency(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(bd.subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Percent size={12} />
                      Desconto {bd.discountType === 'percentage' ? `(${bd.discount}%)` : ''}
                    </span>
                    <span className="font-semibold text-red-600">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {bd.taxes && bd.taxes > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Impostos</span>
                    <span className="font-semibold text-gray-800">{formatCurrency(bd.taxes)}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                    <DollarSign size={14} /> Valor Total
                  </span>
                  <span className="text-lg font-bold text-blue-700">{formatCurrency(bd.total)}</span>
                </div>
              </div>

              {bd.paymentTerms && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <FileSignature size={11} /> Condições de Pagamento
                  </p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">{bd.paymentTerms}</p>
                </div>
              )}

              {(bd.observations || bd.notes) && (
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Observações</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 leading-relaxed">
                    {bd.observations || bd.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function CustomerPortalBudgets() {
  const { portalUser } = usePortal()
  const [budgets, setBudgets] = useState<BudgetListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'enviado' | 'aprovado' | 'reprovado'>('all')

  useEffect(() => {
    if (portalUser?.linked_customer_id) loadBudgets()
  }, [portalUser])

  const loadBudgets = async () => {
    setLoading(true)
    try {
      const { data } = await supabase.rpc('get_customer_portal_budgets', {
        p_customer_id: portalUser!.linked_customer_id
      })
      if (data) setBudgets(data)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all' ? budgets : budgets.filter(b => b.status === filter)

  const counts = {
    all: budgets.length,
    enviado: budgets.filter(b => b.status === 'enviado').length,
    aprovado: budgets.filter(b => b.status === 'aprovado').length,
    reprovado: budgets.filter(b => b.status === 'reprovado').length,
  }

  const totalAprovado = budgets
    .filter(b => b.status === 'aprovado')
    .reduce((s, b) => s + (b.total_value || 0), 0)

  const tabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'enviado', label: 'Pendentes' },
    { key: 'aprovado', label: 'Aprovados' },
    { key: 'reprovado', label: 'Reprovados' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 text-sm mt-1">Visualize e acompanhe seus orçamentos</p>
        </div>
        <button onClick={loadBudgets} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw size={18} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {budgets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-2xl p-4 flex items-center gap-3">
            <FileText size={20} className="text-blue-600 shrink-0" />
            <div>
              <p className="text-xl font-bold text-blue-700">{counts.all}</p>
              <p className="text-xs text-blue-600">Total de orçamentos</p>
            </div>
          </div>
          <div className="bg-orange-50 rounded-2xl p-4 flex items-center gap-3">
            <Clock size={20} className="text-orange-600 shrink-0" />
            <div>
              <p className="text-xl font-bold text-orange-700">{counts.enviado}</p>
              <p className="text-xs text-orange-600">Aguardando aprovação</p>
            </div>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 col-span-2 sm:col-span-1 flex items-center gap-3">
            <DollarSign size={20} className="text-green-600 shrink-0" />
            <div>
              <p className="text-lg font-bold text-green-700">{formatCurrency(totalAprovado)}</p>
              <p className="text-xs text-green-600">Total aprovado</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FileText size={44} className="mx-auto mb-3 opacity-25 text-gray-400" />
          <p className="font-medium text-gray-500">Nenhum orçamento encontrado</p>
          <p className="text-sm text-gray-400 mt-1">
            {filter !== 'all' ? 'Tente outro filtro' : 'Os orçamentos aparecerão aqui quando emitidos'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((budget, i) => {
            const statusInfo = STATUS_MAP[budget.status] || STATUS_MAP.rascunho
            const StatusIcon = statusInfo.icon
            return (
              <motion.button
                key={budget.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedId(budget.id)}
                className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4 text-left hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <FileText size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {budget.budget_number && (
                      <span className="text-xs font-mono text-gray-400">#{budget.budget_number}</span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon size={9} />
                      {statusInfo.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                    {budget.title || `Orçamento #${budget.budget_number}`}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(budget.created_at)}
                    </span>
                    {budget.valid_until && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> Válido até {formatDate(budget.valid_until)}
                      </span>
                    )}
                    {budget.items_count > 0 && (
                      <span>{budget.items_count} item{budget.items_count !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  {budget.approved_at && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={10} /> Aprovado em {formatDate(budget.approved_at)}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right flex flex-col items-end gap-2">
                  <p className="text-base font-bold text-gray-900">{formatCurrency(budget.total_value)}</p>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <BudgetDetailModal
            budgetId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
