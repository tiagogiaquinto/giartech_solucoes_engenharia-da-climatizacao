import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Target, Users, Plus, Clock, DollarSign, Phone, Mail, MessageSquare, ArrowRight, Search, Eye, GripVertical, Bell, AlertTriangle, Heart, Star, Activity, Zap, TrendingUp, Award, User, Send, X, FileEdit as Edit3, Calendar, MapPin, Share2, CheckCircle, XCircle, RefreshCw, Building2, UserCheck, ExternalLink, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDateSafe, formatCurrency } from '../utils/format'
import { useToast } from '../hooks/useToast'
import CRMOpportunityModal from '../components/CRMOpportunityModal'

interface Referral {
  id: string
  type: 'partner' | 'customer'
  referrer_name: string
  referred_name: string
  phone?: string
  document?: string
  notes?: string
  status: string
  commission_type?: string
  commission_value?: number
  commission_paid?: boolean
  cashback_percent?: number
  credit_amount?: number
  order_value?: number
  referral_source?: string
  referral_date?: string
  created_at: string
  partner_account_id?: string
  service_order_id?: string
}

interface Pipeline {
  id: string
  nome: string
  tipo: string
  cor: string
  stages: Stage[]
}

interface Stage {
  id: string
  nome: string
  cor: string
  ordem: number
  probabilidade: number
  opportunities: Opportunity[]
}

interface Opportunity {
  id: string
  titulo: string
  valor: number
  lead_score: number
  temperatura: string
  data_fechamento_esperada: string
  data_proximo_contato?: string
  dias_no_stage_atual: number
  stage_id: string
  pipeline_id: string
  pipeline_nome: string
  pipeline_tipo: string
  customer_name: string
  customer_whatsapp?: string
  customer_celular?: string
  customer_telefone?: string
  customer_email?: string
  customer_endereco?: string
  customer_cidade?: string
  customer_estado?: string
  customer_tipo_pessoa?: string
  owner_name?: string
  num_interacoes: number
  dias_no_pipeline: number
  is_rotting?: boolean
  dias_sem_atividade?: number
  proxima_acao_sugerida?: string
  cliente_health_score?: number
}

const CRMEsteiraIntegrada = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [activeTab, setActiveTab] = useState<string>('vendas')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null)
  const [draggedOpportunity, setDraggedOpportunity] = useState<any>(null)
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null)
  const { showToast } = useToast()

  const [stats, setStats] = useState({
    total_na_esteira: 0,
    total_valor: 0,
    alertas_urgentes: 0,
    health_score_medio: 0
  })

  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralFilter, setReferralFilter] = useState<'all' | 'partner' | 'customer'>('all')
  const [referralStatusFilter, setReferralStatusFilter] = useState<string>('all')
  const [referralStats, setReferralStats] = useState({
    total: 0,
    pendentes: 0,
    concluidos: 0,
    total_comissoes: 0
  })
  const [commissionModal, setCommissionModal] = useState<{
    open: boolean
    referral: Referral | null
  }>({ open: false, referral: null })
  const [commissionForm, setCommissionForm] = useState({
    commission_type: 'fixed',
    commission_value: '',
    commission_paid: false,
    cashback_percent: '',
    credit_amount: '',
    notes: ''
  })

  useEffect(() => {
    loadEsteiraCompleta()
    loadReferrals()

    const opportunitiesChannel = supabase
      .channel('crm-opportunities-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_opportunities' },
        () => {
          loadEsteiraCompleta()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_interactions' },
        () => {
          loadEsteiraCompleta()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(opportunitiesChannel)
    }
  }, [])

  const loadEsteiraCompleta = async () => {
    try {
      setLoading(true)

      const { data: statsData, error: statsError } = await supabase
        .rpc('get_esteira_stats')

      if (!statsError && statsData) {
        setStats(statsData)
      }

      const { data: pipelineData, error: pipelineError } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('is_ativo', true)
        .order('ordem')

      if (pipelineError) throw pipelineError

      const { data: esteiraData, error: esteiraError } = await supabase
        .from('v_crm_esteira_completa')
        .select('*')

      if (esteiraError) throw esteiraError

      const organizedPipelines = (pipelineData || []).map(pipeline => {
        const pipelineOpps = (esteiraData || []).filter(opp => opp.pipeline_id === pipeline.id)

        const stagesMap = new Map<string, any>()

        pipelineOpps.forEach(opp => {
          if (!stagesMap.has(opp.stage_id)) {
            stagesMap.set(opp.stage_id, {
              id: opp.stage_id,
              nome: opp.stage_nome,
              cor: opp.stage_cor,
              ordem: opp.stage_ordem,
              probabilidade: opp.probabilidade,
              opportunities: []
            })
          }
          stagesMap.get(opp.stage_id).opportunities.push(opp)
        })

        const stages = Array.from(stagesMap.values()).sort((a, b) => a.ordem - b.ordem)

        return {
          ...pipeline,
          stages
        }
      })

      setPipelines(organizedPipelines)

      if (organizedPipelines.length > 0 && !activeTab) {
        setActiveTab(organizedPipelines[0].tipo)
      }

    } catch (error) {
      console.error('Erro ao carregar esteira:', error)
      showToast('Erro ao carregar dados da esteira', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadReferrals = async () => {
    try {
      const [partnerRes, customerRes] = await Promise.all([
        supabase
          .from('partner_referrals')
          .select(`
            id,
            customer_name,
            customer_phone,
            customer_document,
            notes,
            status,
            commission_type,
            commission_value,
            commission_paid,
            created_at,
            partner_account_id,
            service_order_id,
            portal_accounts!partner_referrals_partner_account_id_fkey(name)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('customer_referrals')
          .select(`
            id,
            status,
            referral_date,
            referral_source,
            order_value,
            cashback_percent,
            credit_amount,
            created_at,
            service_order_id,
            referrer:customers!customer_referrals_referrer_customer_id_fkey(name, celular),
            referred:customers!customer_referrals_referred_customer_id_fkey(name)
          `)
          .order('created_at', { ascending: false })
      ])

      const partnerList: Referral[] = (partnerRes.data || []).map((r: any) => ({
        id: r.id,
        type: 'partner' as const,
        referrer_name: r.portal_accounts?.name || 'Parceiro',
        referred_name: r.customer_name || '-',
        phone: r.customer_phone,
        document: r.customer_document,
        notes: r.notes,
        status: r.status,
        commission_type: r.commission_type,
        commission_value: r.commission_value,
        commission_paid: r.commission_paid,
        created_at: r.created_at,
        partner_account_id: r.partner_account_id,
        service_order_id: r.service_order_id
      }))

      const customerList: Referral[] = (customerRes.data || []).map((r: any) => ({
        id: r.id,
        type: 'customer' as const,
        referrer_name: r.referrer?.name || '-',
        referred_name: r.referred?.name || '-',
        phone: r.referrer?.celular,
        notes: undefined,
        status: r.status,
        cashback_percent: r.cashback_percent,
        credit_amount: r.credit_amount,
        order_value: r.order_value,
        referral_source: r.referral_source,
        referral_date: r.referral_date,
        created_at: r.created_at,
        service_order_id: r.service_order_id
      }))

      const all = [...partnerList, ...customerList].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setReferrals(all)

      const pendentes = all.filter(r => r.status === 'pendente').length
      const concluidos = all.filter(r => ['concluido', 'credito_gerado', 'confirmada'].includes(r.status)).length
      const totalComissoes = partnerList
        .filter(r => r.commission_paid)
        .reduce((sum, r) => sum + (r.commission_value || 0), 0)

      setReferralStats({
        total: all.length,
        pendentes,
        concluidos,
        total_comissoes: totalComissoes
      })
    } catch (error) {
      console.error('Erro ao carregar indicações:', error)
    }
  }

  const updateReferralStatus = async (referral: Referral, newStatus: string) => {
    try {
      const table = referral.type === 'partner' ? 'partner_referrals' : 'customer_referrals'
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq('id', referral.id)

      if (error) throw error

      showToast('Status atualizado com sucesso!', 'success')
      loadReferrals()
    } catch (error: any) {
      showToast('Erro ao atualizar status', 'error')
    }
  }

  const getReferralStatusInfo = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      pendente:      { label: 'Pendente',     color: 'text-yellow-700', bg: 'bg-yellow-100' },
      em_andamento:  { label: 'Em Andamento', color: 'text-blue-700',   bg: 'bg-blue-100' },
      concluido:     { label: 'Concluído',    color: 'text-green-700',  bg: 'bg-green-100' },
      cancelado:     { label: 'Cancelado',    color: 'text-red-700',    bg: 'bg-red-100' },
      confirmada:    { label: 'Confirmada',   color: 'text-green-700',  bg: 'bg-green-100' },
      credito_gerado:{ label: 'Crédito Gerado', color: 'text-emerald-700', bg: 'bg-emerald-100' },
      expirada:      { label: 'Expirada',     color: 'text-gray-600',   bg: 'bg-gray-100' }
    }
    return map[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100' }
  }

  const openCommissionModal = (referral: Referral) => {
    setCommissionForm({
      commission_type: referral.commission_type || 'fixed',
      commission_value: referral.commission_value != null ? String(referral.commission_value) : '',
      commission_paid: referral.commission_paid || false,
      cashback_percent: referral.cashback_percent != null ? String(referral.cashback_percent) : '',
      credit_amount: referral.credit_amount != null ? String(referral.credit_amount) : '',
      notes: referral.notes || ''
    })
    setCommissionModal({ open: true, referral })
  }

  const saveCommission = async () => {
    const { referral } = commissionModal
    if (!referral) return

    try {
      if (referral.type === 'partner') {
        const { error } = await supabase
          .from('partner_referrals')
          .update({
            commission_type: commissionForm.commission_type,
            commission_value: commissionForm.commission_value ? Number(commissionForm.commission_value) : null,
            commission_paid: commissionForm.commission_paid,
            notes: commissionForm.notes || null
          })
          .eq('id', referral.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('customer_referrals')
          .update({
            cashback_percent: commissionForm.cashback_percent ? Number(commissionForm.cashback_percent) : null,
            credit_amount: commissionForm.credit_amount ? Number(commissionForm.credit_amount) : null
          })
          .eq('id', referral.id)
        if (error) throw error
      }

      showToast('Comissão atualizada com sucesso!', 'success')
      setCommissionModal({ open: false, referral: null })
      loadReferrals()
    } catch (error: any) {
      showToast('Erro ao salvar comissão', 'error')
    }
  }

  const handleDragStart = (opportunity: Opportunity) => {
    setDraggedOpportunity(opportunity)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    setDraggedOverStage(stageId)
  }

  const handleDragLeave = () => {
    setDraggedOverStage(null)
  }

  const handleDrop = async (e: React.DragEvent, newStageId: string) => {
    e.preventDefault()
    setDraggedOverStage(null)

    if (!draggedOpportunity || draggedOpportunity.stage_id === newStageId) {
      setDraggedOpportunity(null)
      return
    }

    try {
      const { data, error } = await supabase
        .rpc('move_opportunity_to_stage_v2', {
          p_opportunity_id: draggedOpportunity.id,
          p_new_stage_id: newStageId,
          p_reason: 'Movido manualmente via drag & drop',
          p_automated: false
        })

      if (error) throw error

      showToast(
        data.created_pos_venda
          ? 'Venda ganha! Card criado automaticamente no Pós-Venda!'
          : 'Oportunidade movida com sucesso!',
        'success'
      )

      loadEsteiraCompleta()
    } catch (error: any) {
      console.error('Erro ao mover oportunidade:', error)
      showToast('Erro ao mover oportunidade', 'error')
    } finally {
      setDraggedOpportunity(null)
    }
  }

  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedOppForMessage, setSelectedOppForMessage] = useState<Opportunity | null>(null)
  const [messageTemplates, setMessageTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [customMessage, setCustomMessage] = useState('')

  const [showAgendamentoModal, setShowAgendamentoModal] = useState(false)
  const [selectedOppForAgendamento, setSelectedOppForAgendamento] = useState<Opportunity | null>(null)
  const [agendamentoData, setAgendamentoData] = useState({
    data: '',
    hora: '',
    tipo: 'whatsapp',
    observacao: ''
  })

  const handleWhatsAppClick = async (opp: Opportunity) => {
    const whatsapp = opp.customer_whatsapp || opp.customer_celular
    if (!whatsapp) {
      showToast('Cliente não possui WhatsApp cadastrado', 'error')
      return
    }

    try {
      const { data: templates, error } = await supabase
        .from('crm_message_templates')
        .select('*')
        .eq('canal', 'whatsapp')
        .eq('pipeline_tipo', opp.pipeline_tipo)
        .eq('is_ativo', true)
        .order('ordem')

      if (error) throw error

      setMessageTemplates(templates || [])
      setSelectedOppForMessage(opp)

      if (templates && templates.length > 0) {
        const firstTemplate = templates[0]
        setSelectedTemplate(firstTemplate)
        setCustomMessage(processTemplate(firstTemplate.mensagem, opp))
      } else {
        setCustomMessage(`Olá ${opp.customer_name}! ${opp.proxima_acao_sugerida || 'Entrando em contato sobre ' + opp.titulo}`)
      }

      setShowMessageModal(true)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
      const phoneNumber = whatsapp.replace(/\D/g, '')
      const message = encodeURIComponent(`Olá ${opp.customer_name}!`)
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
    }
  }

  const processTemplate = (template: string, opp: Opportunity) => {
    return template
      .replace(/{cliente_nome}/g, opp.customer_name || 'Cliente')
      .replace(/{vendedor_nome}/g, opp.owner_name || 'Vendedor')
      .replace(/{oportunidade_titulo}/g, opp.titulo || '')
      .replace(/{oportunidade_valor}/g, formatCurrency(opp.valor || 0))
      .replace(/{dias_no_stage}/g, String(opp.dias_no_stage_atual || 0))
      .replace(/{proxima_acao}/g, opp.proxima_acao_sugerida || '')
      .replace(/{health_score}/g, opp.cliente_health_score ? `${Math.round(opp.cliente_health_score)}%` : '')
      .replace(/{data_hoje}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{hora_agora}/g, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
  }

  const handleSendWhatsApp = () => {
    if (!selectedOppForMessage) return

    const whatsapp = selectedOppForMessage.customer_whatsapp || selectedOppForMessage.customer_celular
    if (!whatsapp) return

    const phoneNumber = whatsapp.replace(/\D/g, '')
    const message = encodeURIComponent(customMessage)
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
    setShowMessageModal(false)
  }

  const handleOpenAgendamento = (opp: Opportunity) => {
    setSelectedOppForAgendamento(opp)

    const hoje = new Date()
    const dataHoje = hoje.toISOString().split('T')[0]
    const horaAtual = hoje.toTimeString().slice(0, 5)

    setAgendamentoData({
      data: dataHoje,
      hora: horaAtual,
      tipo: 'whatsapp',
      observacao: ''
    })

    setShowAgendamentoModal(true)
  }

  const handleSalvarAgendamento = async () => {
    if (!selectedOppForAgendamento) return

    try {
      if (!agendamentoData.data || !agendamentoData.hora) {
        showToast('Preencha a data e hora do contato', 'error')
        return
      }

      const dataHoraCompleta = new Date(`${agendamentoData.data}T${agendamentoData.hora}:00`)

      const { error } = await supabase
        .from('crm_opportunities')
        .update({
          proximo_contato_data: dataHoraCompleta.toISOString(),
          proximo_contato_tipo: agendamentoData.tipo,
          proximo_contato_observacao: agendamentoData.observacao,
          proximo_contato_agendado_em: new Date().toISOString()
        })
        .eq('id', selectedOppForAgendamento.id)

      if (error) throw error

      showToast('Próximo contato agendado com sucesso!', 'success')
      setShowAgendamentoModal(false)
      loadEsteiraCompleta()
    } catch (error: any) {
      console.error('Erro ao agendar contato:', error)
      showToast('Erro ao agendar próximo contato', 'error')
    }
  }

  const executarAutomacao = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('auto_move_pos_venda_by_time')

      if (error) throw error

      showToast(`${data || 0} clientes movidos automaticamente!`, 'success')
      loadEsteiraCompleta()
    } catch (error: any) {
      console.error('Erro ao executar automação:', error)
      showToast('Erro ao executar automação', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getTemperaturaColor = (temperatura: string) => {
    switch (temperatura?.toLowerCase()) {
      case 'quente': return 'bg-red-100 text-red-700'
      case 'morno': return 'bg-yellow-100 text-yellow-700'
      case 'frio': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const activePipeline = pipelines.find(p => p.tipo === activeTab)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando esteira de clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              CRM Integrado
            </h1>
            <p className="text-gray-600 mt-1">
              Gestão completa: Lead → Venda → Pós-Venda → Retenção
            </p>
          </div>

          <div className="flex gap-3">
            {activeTab === 'pos_venda' && (
              <button
                onClick={executarAutomacao}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <Zap className="w-5 h-5" />
                Executar Automação
              </button>
            )}

            <button
              onClick={() => {
                setSelectedOpportunity(null)
                setIsModalOpen(true)
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Nova Oportunidade
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-5 shadow-md border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total na Esteira</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_na_esteira}</p>
              </div>
              <Users className="w-10 h-10 text-blue-500 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-md border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Valor Total</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats.total_valor)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-green-500 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-md border-l-4 border-red-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Alertas Urgentes</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.alertas_urgentes}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500 opacity-80" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-md border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Health Score</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {Math.round(stats.health_score_medio)}%
                </p>
              </div>
              <Activity className="w-10 h-10 text-purple-500 opacity-80" />
            </div>
          </motion.div>
        </div>

        {/* Tabs e Busca */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2 flex-wrap">
            {pipelines.map(pipeline => (
              <button
                key={pipeline.id}
                onClick={() => setActiveTab(pipeline.tipo)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === pipeline.tipo
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {pipeline.nome}
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-black bg-opacity-10">
                  {pipeline.stages.reduce((acc, stage) => acc + stage.opportunities.length, 0)}
                </span>
              </button>
            ))}
            <button
              onClick={() => setActiveTab('indicacoes')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'indicacoes'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
              Indicações
              <span className="px-2 py-0.5 rounded-full text-xs bg-black bg-opacity-10">
                {referralStats.total}
              </span>
            </button>
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Indicações Panel */}
      {activeTab === 'indicacoes' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Indicações</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{referralStats.total}</p>
                </div>
                <Share2 className="w-10 h-10 text-orange-500 opacity-80" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pendentes</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{referralStats.pendentes}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500 opacity-80" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Concluídas</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{referralStats.concluidos}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-500 opacity-80" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-md border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Comissões Pagas</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(referralStats.total_comissoes)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-blue-500 opacity-80" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 flex-wrap">
            <div className="flex gap-2">
              {(['all', 'partner', 'customer'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setReferralFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    referralFilter === f
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'partner' ? 'De Parceiros' : 'De Clientes'}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex gap-2 flex-wrap">
              {['all', 'pendente', 'em_andamento', 'concluido', 'cancelado', 'confirmada', 'credito_gerado'].map(s => {
                const info = s === 'all' ? { label: 'Todos', color: 'text-gray-700', bg: 'bg-gray-100' } : getReferralStatusInfo(s)
                return (
                  <button
                    key={s}
                    onClick={() => setReferralStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                      referralStatusFilter === s
                        ? 'border-orange-400 ring-2 ring-orange-200 ' + info.bg + ' ' + info.color
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {info.label}
                  </button>
                )
              })}
            </div>
            <button
              onClick={loadReferrals}
              className="ml-auto p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {referrals
                .filter(r => referralFilter === 'all' || r.type === referralFilter)
                .filter(r => referralStatusFilter === 'all' || r.status === referralStatusFilter)
                .filter(r =>
                  !searchTerm ||
                  r.referrer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  r.referred_name?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(referral => {
                  const statusInfo = getReferralStatusInfo(referral.status)
                  const isPartner = referral.type === 'partner'
                  const partnerStatuses = ['pendente', 'em_andamento', 'concluido', 'cancelado']
                  const customerStatuses = ['pendente', 'confirmada', 'credito_gerado', 'cancelada', 'expirada']
                  const nextStatuses = isPartner ? partnerStatuses : customerStatuses

                  return (
                    <motion.div
                      key={`${referral.type}-${referral.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all p-5"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${isPartner ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            {isPartner
                              ? <Building2 className="w-4 h-4 text-blue-600" />
                              : <UserCheck className="w-4 h-4 text-orange-600" />
                            }
                          </div>
                          <div>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPartner ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                              {isPartner ? 'Parceiro' : 'Cliente'}
                            </span>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Quem indicou → Quem foi indicado */}
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-bold text-gray-900 truncate">{referral.referrer_name}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-6">
                          <ArrowRight className="w-3 h-3 text-orange-400" />
                          <span className="text-sm text-gray-600 truncate">{referral.referred_name}</span>
                        </div>
                      </div>

                      {/* Contact */}
                      {referral.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                          <Phone className="w-3 h-3" />
                          <span>{referral.phone}</span>
                        </div>
                      )}

                      {/* Financial Info */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {isPartner && referral.commission_value && (
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-blue-600 font-medium">Comissão</p>
                            <p className="text-sm font-bold text-blue-800">
                              {referral.commission_type === 'percentage'
                                ? `${referral.commission_value}%`
                                : formatCurrency(referral.commission_value)}
                            </p>
                          </div>
                        )}
                        {isPartner && (
                          <div className={`rounded-lg p-2 text-center ${referral.commission_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <p className="text-xs text-gray-500 font-medium">Pagamento</p>
                            <p className={`text-sm font-bold ${referral.commission_paid ? 'text-green-700' : 'text-gray-500'}`}>
                              {referral.commission_paid ? 'Pago' : 'Pendente'}
                            </p>
                          </div>
                        )}
                        {!isPartner && referral.order_value && (
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-green-600 font-medium">Valor OS</p>
                            <p className="text-sm font-bold text-green-800">{formatCurrency(referral.order_value)}</p>
                          </div>
                        )}
                        {!isPartner && referral.credit_amount && (
                          <div className="bg-emerald-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-emerald-600 font-medium">Crédito</p>
                            <p className="text-sm font-bold text-emerald-800">{formatCurrency(referral.credit_amount)}</p>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {referral.notes && (
                        <p className="text-xs text-gray-500 italic mb-3 line-clamp-2 bg-gray-50 rounded px-2 py-1.5">
                          {referral.notes}
                        </p>
                      )}

                      {/* Date + Source */}
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span>{new Date(referral.created_at).toLocaleDateString('pt-BR')}</span>
                        {referral.referral_source && (
                          <span className="bg-gray-100 px-2 py-0.5 rounded">{referral.referral_source}</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="border-t border-gray-100 pt-3 space-y-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {nextStatuses
                            .filter(s => s !== referral.status)
                            .slice(0, 3)
                            .map(s => {
                              const si = getReferralStatusInfo(s)
                              return (
                                <button
                                  key={s}
                                  onClick={() => updateReferralStatus(referral, s)}
                                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all hover:opacity-80 ${si.bg} ${si.color}`}
                                >
                                  {si.label}
                                </button>
                              )
                            })
                          }
                          {referral.phone && (
                            <a
                              href={`https://wa.me/${referral.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4 text-green-600" />
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => openCommissionModal(referral)}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          {isPartner
                            ? (referral.commission_value != null ? 'Editar Comissão' : 'Designar Comissão')
                            : (referral.credit_amount != null || referral.cashback_percent != null ? 'Editar Benefício' : 'Designar Benefício')}
                        </button>
                      </div>
                    </motion.div>
                  )
                })
              }
            </AnimatePresence>
          </div>

          {referrals.filter(r =>
            (referralFilter === 'all' || r.type === referralFilter) &&
            (referralStatusFilter === 'all' || r.status === referralStatusFilter)
          ).length === 0 && (
            <div className="bg-white rounded-xl shadow-md p-16 text-center">
              <Share2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 font-medium text-lg">Nenhuma indicação encontrada</p>
              <p className="text-gray-400 text-sm mt-1">As indicações de parceiros e clientes aparecerão aqui</p>
            </div>
          )}
        </div>
      )}

      {/* Kanban Board */}
      {activePipeline && activeTab !== 'indicacoes' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {activePipeline.stages.map(stage => (
              <div
                key={stage.id}
                className={`flex-shrink-0 w-80 ${
                  draggedOverStage === stage.id ? 'ring-2 ring-blue-400 ring-opacity-60' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Stage Header */}
                <div
                  className="rounded-lg p-4 mb-3 shadow-sm"
                  style={{ backgroundColor: stage.cor + '30', borderLeft: `4px solid ${stage.cor}` }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">{stage.nome}</h3>
                    <span className="px-3 py-1 bg-white rounded-full text-sm font-bold text-gray-700 shadow-sm">
                      {stage.opportunities.length}
                    </span>
                  </div>
                  {stage.probabilidade > 0 && (
                    <p className="text-xs text-gray-600 font-medium">
                      {stage.probabilidade}% probabilidade
                    </p>
                  )}
                </div>

                {/* Cards */}
                <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                  <AnimatePresence>
                    {stage.opportunities
                      .filter(opp =>
                        !searchTerm ||
                        opp.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        opp.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map(opp => (
                        <motion.div
                          key={opp.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          draggable
                          onDragStart={() => handleDragStart(opp)}
                          className="bg-white rounded-lg p-4 border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-move group"
                        >
                          {/* Nome do Cliente - BEM VISÍVEL */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-blue-600" />
                                <h4 className="font-bold text-gray-900 text-base">
                                  {opp.customer_name || 'Sem cliente'}
                                </h4>
                                {opp.customer_tipo_pessoa && (
                                  <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                    {opp.customer_tipo_pessoa === 'fisica' ? 'PF' : 'PJ'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                {opp.titulo}
                              </p>

                              {/* Informações de Contato */}
                              <div className="space-y-1 text-xs text-gray-600">
                                {/* Telefone */}
                                {(opp.customer_whatsapp || opp.customer_celular || opp.customer_telefone) && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {opp.customer_whatsapp || opp.customer_celular || opp.customer_telefone}
                                    </span>
                                  </div>
                                )}

                                {/* Email */}
                                {opp.customer_email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{opp.customer_email}</span>
                                  </div>
                                )}

                                {/* Endereço */}
                                {opp.customer_endereco && (
                                  <div className="flex items-start gap-1.5">
                                    <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                    <span className="line-clamp-1">
                                      {opp.customer_endereco}
                                      {opp.customer_cidade && `, ${opp.customer_cidade}`}
                                      {opp.customer_estado && `/${opp.customer_estado}`}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <GripVertical className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </div>

                          {/* Valor e Temperatura */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(opp.valor)}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTemperaturaColor(opp.temperatura)}`}>
                              {opp.temperatura}
                            </span>
                          </div>

                          {/* Health Score (só para Pós-Venda) */}
                          {opp.cliente_health_score !== null && opp.cliente_health_score !== undefined && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-gray-600 font-medium flex items-center gap-1">
                                  <Activity className="w-3 h-3" />
                                  Health Score
                                </span>
                                <span className="font-bold text-gray-900">
                                  {Math.round(opp.cliente_health_score)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all ${getHealthScoreColor(opp.cliente_health_score)}`}
                                  style={{ width: `${opp.cliente_health_score}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Próxima Ação */}
                          {opp.proxima_acao_sugerida && (
                            <div className={`text-xs px-3 py-2 rounded-md mb-3 font-medium ${
                              opp.proxima_acao_sugerida.includes('URGENTE')
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}>
                              {opp.proxima_acao_sugerida}
                            </div>
                          )}

                          {/* Footer com Ações */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span className="font-medium">{opp.dias_no_stage_atual} dias</span>
                            </div>

                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleOpenAgendamento(opp)}
                                className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Agendar próximo contato"
                              >
                                <Calendar className="w-4 h-4 text-purple-600" />
                              </button>
                              {(opp.customer_whatsapp || opp.customer_celular) && (
                                <button
                                  onClick={() => handleWhatsAppClick(opp)}
                                  className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-4 h-4 text-green-600" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedOpportunity(opp)
                                  setIsModalOpen(true)
                                }}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                  </AnimatePresence>

                  {stage.opportunities.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum card neste estágio</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Agendamento de Próximo Contato */}
      <AnimatePresence>
        {showAgendamentoModal && selectedOppForAgendamento && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    Agendar Próximo Contato
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedOppForAgendamento.titulo} - {selectedOppForAgendamento.customer_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowAgendamentoModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data *
                    </label>
                    <input
                      type="date"
                      value={agendamentoData.data}
                      onChange={(e) => setAgendamentoData({ ...agendamentoData, data: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora *
                    </label>
                    <input
                      type="time"
                      value={agendamentoData.hora}
                      onChange={(e) => setAgendamentoData({ ...agendamentoData, hora: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Tipo de Contato */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Contato *
                  </label>
                  <select
                    value={agendamentoData.tipo}
                    onChange={(e) => setAgendamentoData({ ...agendamentoData, tipo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telefone">Ligação Telefônica</option>
                    <option value="email">Email</option>
                    <option value="reuniao">Reunião</option>
                    <option value="visita">Visita Presencial</option>
                  </select>
                </div>

                {/* Observação */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observação / Objetivo do Contato
                  </label>
                  <textarea
                    value={agendamentoData.observacao}
                    onChange={(e) => setAgendamentoData({ ...agendamentoData, observacao: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Ex: Enviar proposta atualizada, esclarecer dúvidas sobre pagamento..."
                  />
                </div>

                {/* Info do Contato */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-xs text-purple-700 font-semibold mb-2">INFORMAÇÕES DO CLIENTE</div>
                  <div className="space-y-1 text-sm">
                    {selectedOppForAgendamento.customer_whatsapp && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <span>{selectedOppForAgendamento.customer_whatsapp}</span>
                      </div>
                    )}
                    {selectedOppForAgendamento.customer_email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>{selectedOppForAgendamento.customer_email}</span>
                      </div>
                    )}
                    {selectedOppForAgendamento.customer_telefone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="w-4 h-4 text-purple-600" />
                        <span>{selectedOppForAgendamento.customer_telefone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowAgendamentoModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarAgendamento}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Agendar Contato
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Mensagem Personalizada */}
      <AnimatePresence>
        {showMessageModal && selectedOppForMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                    Enviar WhatsApp
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Para: {selectedOppForMessage.customer_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Seletor de Template */}
                {messageTemplates.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecionar Template
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {messageTemplates.map(template => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template)
                            setCustomMessage(processTemplate(template.mensagem, selectedOppForMessage))
                          }}
                          className={`p-3 border-2 rounded-lg text-left transition-all ${
                            selectedTemplate?.id === template.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-semibold text-gray-900">{template.nome}</div>
                          <div className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {template.mensagem}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mensagem Personalizada */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Mensagem
                    </label>
                    <span className="text-xs text-gray-500">
                      {customMessage.length} caracteres
                    </span>
                  </div>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Digite sua mensagem..."
                  />
                </div>

                {/* Preview do WhatsApp */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">PREVIEW</div>
                  <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-green-500">
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">
                      {customMessage}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowMessageModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSendWhatsApp}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Enviar WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Comissão / Benefício */}
      <AnimatePresence>
        {commissionModal.open && commissionModal.referral && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    {commissionModal.referral.type === 'partner' ? 'Designar Comissão' : 'Designar Benefício'}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {commissionModal.referral.referrer_name} → {commissionModal.referral.referred_name}
                  </p>
                </div>
                <button
                  onClick={() => setCommissionModal({ open: false, referral: null })}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {commissionModal.referral.type === 'partner' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Comissão</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'fixed', label: 'Valor Fixo (R$)' },
                          { value: 'percentage', label: 'Percentual (%)' }
                        ].map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setCommissionForm(f => ({ ...f, commission_type: opt.value }))}
                            className={`py-3 rounded-lg border-2 text-sm font-semibold transition-all ${
                              commissionForm.commission_type === opt.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {commissionForm.commission_type === 'percentage' ? 'Percentual (%)' : 'Valor (R$)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          {commissionForm.commission_type === 'percentage' ? '%' : 'R$'}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step={commissionForm.commission_type === 'percentage' ? '0.1' : '0.01'}
                          value={commissionForm.commission_value}
                          onChange={e => setCommissionForm(f => ({ ...f, commission_value: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder={commissionForm.commission_type === 'percentage' ? 'Ex: 5' : 'Ex: 150,00'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
                      <textarea
                        value={commissionForm.notes}
                        onChange={e => setCommissionForm(f => ({ ...f, notes: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Observações sobre a comissão..."
                      />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <input
                        type="checkbox"
                        id="commission_paid"
                        checked={commissionForm.commission_paid}
                        onChange={e => setCommissionForm(f => ({ ...f, commission_paid: e.target.checked }))}
                        className="w-5 h-5 rounded text-green-600 border-gray-300 cursor-pointer"
                      />
                      <label htmlFor="commission_paid" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                        Comissão já foi paga ao parceiro
                      </label>
                      {commissionForm.commission_paid && (
                        <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cashback / Desconto (%)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">%</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={commissionForm.cashback_percent}
                          onChange={e => setCommissionForm(f => ({ ...f, cashback_percent: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: 10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Crédito em Conta (R$)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={commissionForm.credit_amount}
                          onChange={e => setCommissionForm(f => ({ ...f, credit_amount: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ex: 50,00"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Você pode definir cashback (%) ou crédito em conta (R$), ou ambos.</p>
                  </>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setCommissionModal({ open: false, referral: null })}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveCommission}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <CheckCircle className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Oportunidade */}
      <AnimatePresence>
        {isModalOpen && (
          <CRMOpportunityModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedOpportunity(null)
            }}
            opportunity={selectedOpportunity}
            onSave={async () => {
              await loadEsteiraCompleta()
              setIsModalOpen(false)
              setSelectedOpportunity(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default CRMEsteiraIntegrada
