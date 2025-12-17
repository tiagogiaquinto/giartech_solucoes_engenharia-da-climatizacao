import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, Users, Plus, Clock, DollarSign, Phone, Mail, MessageSquare,
  ArrowRight, Search, Eye, GripVertical, Bell, AlertTriangle,
  Heart, Star, Activity, Zap, TrendingUp, Award, User
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDateSafe, formatCurrency } from '../utils/format'
import { useToast } from '../hooks/useToast'
import CRMOpportunityModal from '../components/CRMOpportunityModal'

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
  customer_email?: string
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

  useEffect(() => {
    loadEsteiraCompleta()
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

  const handleWhatsAppClick = (opp: Opportunity) => {
    const whatsapp = opp.customer_whatsapp || opp.customer_celular
    if (!whatsapp) {
      showToast('Cliente não possui WhatsApp cadastrado', 'error')
      return
    }

    const phoneNumber = whatsapp.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Olá ${opp.customer_name}! ${opp.proxima_acao_sugerida || 'Entrando em contato sobre ' + opp.titulo}`
    )
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
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
          <div className="flex gap-2">
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

      {/* Kanban Board */}
      {activePipeline && (
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
                              </div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {opp.titulo}
                              </p>
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

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <CRMOpportunityModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedOpportunity(null)
            }}
            opportunity={selectedOpportunity}
            onSave={() => {
              loadEsteiraCompleta()
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
