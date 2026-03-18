import React, { useState, useEffect } from 'react'
import {
  AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown,
  Package, ChevronDown, ChevronUp, Loader2, RefreshCw, DollarSign
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

interface Proposal {
  id: string
  item_name: string
  current_cost: number
  proposed_cost: number
  cost_change_pct: number
  affected_services: any[]
  margin_impact: any[]
  status: 'pending' | 'approved' | 'rejected' | 'applied'
  created_at: string
  extraction_id: string
  inventory_item_id: string | null
}

interface PriceUpdateConfirmationCardProps {
  serviceOrderId?: string
  onProposalHandled?: () => void
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export function PriceUpdateConfirmationCard({
  serviceOrderId,
  onProposalHandled
}: PriceUpdateConfirmationCardProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({})
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({})
  const toast = useToast()

  useEffect(() => {
    loadProposals()
  }, [serviceOrderId])

  const loadProposals = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('price_update_proposals')
        .select(`
          *,
          quotation_extractions!inner(service_order_id, supplier_detected, quote_date)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (serviceOrderId) {
        query = query.eq('quotation_extractions.service_order_id', serviceOrderId)
      }

      const { data, error } = await query
      if (error) throw error
      setProposals(data || [])
    } catch (err) {
      console.error('Error loading proposals:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (proposal: Proposal) => {
    setProcessingId(proposal.id)
    try {
      await supabase
        .from('price_update_proposals')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', proposal.id)

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/process-quotation-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ apply_proposal_id: proposal.id })
        }
      )

      const { data: applyResult } = await supabase
        .rpc('apply_price_update_proposal', { p_proposal_id: proposal.id })

      if (applyResult?.success === false) throw new Error(applyResult.error)

      toast.success(`Preco de "${proposal.item_name}" atualizado com sucesso!`)
      setProposals(prev => prev.filter(p => p.id !== proposal.id))
      onProposalHandled?.()
    } catch (err: any) {
      toast.error('Erro ao aplicar atualizacao: ' + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (proposal: Proposal) => {
    if (!showRejectInput[proposal.id]) {
      setShowRejectInput(prev => ({ ...prev, [proposal.id]: true }))
      return
    }

    setProcessingId(proposal.id)
    try {
      await supabase
        .from('price_update_proposals')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason[proposal.id] || 'Rejeitado pelo diretor'
        })
        .eq('id', proposal.id)

      toast.info(`Proposta para "${proposal.item_name}" rejeitada.`)
      setProposals(prev => prev.filter(p => p.id !== proposal.id))
      onProposalHandled?.()
    } catch (err: any) {
      toast.error('Erro: ' + err.message)
    } finally {
      setProcessingId(null)
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  if (loading) return null
  if (proposals.length === 0) return null

  return (
    <div className="border border-orange-200 rounded-xl bg-orange-50 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-orange-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-600" />
          <span className="text-sm font-semibold text-orange-800">
            Atualizacoes de Preco Aguardando Aprovacao
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-200 text-orange-800">
            {proposals.length}
          </span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-orange-600" /> : <ChevronDown size={16} className="text-orange-600" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-orange-700">
            A IA detectou mudancas de custo em materiais do seu catalogo.
            Confirme se deseja atualizar o preco padrao para toda a empresa.
          </p>

          {proposals.map(proposal => {
            const isIncrease = proposal.cost_change_pct > 0
            const isProcessing = processingId === proposal.id

            return (
              <div key={proposal.id} className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                <div className="p-3 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{proposal.item_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Material do catalogo de estoque</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                      isIncrease ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {isIncrease ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {isIncrease ? '+' : ''}{proposal.cost_change_pct.toFixed(1)}%
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-gray-50 rounded-lg text-center">
                      <p className="text-xs text-gray-500">Custo Atual</p>
                      <p className="text-sm font-bold text-gray-700">{formatCurrency(proposal.current_cost)}</p>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${isIncrease ? 'bg-red-50' : 'bg-green-50'}`}>
                      <p className="text-xs text-gray-500">Novo Custo (Cotacao)</p>
                      <p className={`text-sm font-bold ${isIncrease ? 'text-red-700' : 'text-green-700'}`}>
                        {formatCurrency(proposal.proposed_cost)}
                      </p>
                    </div>
                  </div>

                  {proposal.margin_impact && proposal.margin_impact.length > 0 && (
                    <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
                      <p className="font-semibold flex items-center gap-1">
                        <AlertTriangle size={11} /> Impacto na margem detectado:
                      </p>
                      {proposal.margin_impact.slice(0, 2).map((impact: any, i: number) => (
                        <p key={i} className="text-amber-700">
                          {impact.service_name}: {impact.current_margin?.toFixed(1)}% → {impact.new_margin?.toFixed(1)}%
                          {impact.new_margin < 0 && <span className="text-red-600 font-semibold"> (NEGATIVO)</span>}
                        </p>
                      ))}
                    </div>
                  )}

                  {showRejectInput[proposal.id] && (
                    <div>
                      <input
                        type="text"
                        placeholder="Motivo da rejeicao (opcional)"
                        value={rejectionReason[proposal.id] || ''}
                        onChange={e => setRejectionReason(prev => ({ ...prev, [proposal.id]: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs border border-orange-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-400"
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(proposal)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      Aprovar e Atualizar
                    </button>
                    <button
                      onClick={() => handleReject(proposal)}
                      disabled={isProcessing}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      {isProcessing ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                      {showRejectInput[proposal.id] ? 'Confirmar Rejeicao' : 'Rejeitar'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          <button
            onClick={loadProposals}
            className="flex items-center gap-1.5 text-xs text-orange-600 hover:text-orange-800 transition-colors"
          >
            <RefreshCw size={12} /> Atualizar lista
          </button>
        </div>
      )}
    </div>
  )
}
