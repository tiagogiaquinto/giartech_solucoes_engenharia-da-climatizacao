import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, TrendingUp, Users, Plus, Filter, Calendar,
  Clock, DollarSign, Phone, Mail, MessageSquare,
  BarChart3, ArrowRight, ChevronRight, Search, Eye,
  GripVertical, Bell, AlertTriangle, Heart, Star,
  Package, RefreshCw, Zap, Shield, Activity
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
  customer?: {
    customer_name: string
    customer_whatsapp?: string
    customer_celular?: string
  }
  owner?: {
    owner_name: string
  }
  num_interacoes: number
  dias_no_pipeline: number
  is_rotting?: boolean
  dias_sem_atividade?: number
  proxima_acao_sugerida?: string
  cliente_health_score?: number
}

const CRMEsteiraIntegrada = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<string>('all')
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
    health_score_medio: 0,
    por_pipeline: {}
  })

  useEffect(() => {
    loadEsteiraCompleta()
  }, [selectedPipeline])

  const loadEsteiraCompleta = async () => {
    try {
      setLoading(true)

      // Carregar estatísticas gerais
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_esteira_stats')

      if (!statsError && statsData) {
        setStats(statsData)
      }

      // Carregar pipelines ativos
      const { data: pipelineData, error: pipelineError } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('is_ativo', true)
        .order('ordem')

      if (pipelineError) throw pipelineError

      // Carregar todos os dados da esteira
      const { data: esteiraData, error: esteiraError } = await supabase
        .from('v_crm_esteira_completa')
        .select('*')

      if (esteiraError) throw esteiraError

      // Organizar dados por pipeline e stage
      const organizedPipelines = (pipelineData || []).map(pipeline => {
        // Filtrar por pipeline se selecionado
        const pipelineOpps = (esteiraData || []).filter(
          opp => selectedPipeline === 'all' || opp.pipeline_id === selectedPipeline
        ).filter(opp => opp.pipeline_id === pipeline.id)

        // Agrupar por stages
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

        // Converter Map para Array e ordenar por ordem
        const stages = Array.from(stagesMap.values()).sort((a, b) => a.ordem - b.ordem)

        return {
          ...pipeline,
          stages
        }
      })

      setPipelines(organizedPipelines)

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
    const whatsapp = opp.customer?.customer_whatsapp || opp.customer?.customer_celular
    if (!whatsapp) {
      showToast('Cliente não possui WhatsApp cadastrado', 'error')
      return
    }

    const phoneNumber = whatsapp.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Olá! ${opp.proxima_acao_sugerida || 'Entrando em contato sobre ' + opp.titulo}`
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
      case 'quente': return 'text-red-500'
      case 'morno': return 'text-yellow-500'
      case 'frio': return 'text-blue-500'
      default: return 'text-gray-500'
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-50'
    if (score >= 60) return 'text-yellow-500 bg-yellow-50'
    if (score >= 40) return 'text-orange-500 bg-orange-50'
    return 'text-red-500 bg-red-50'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header com Estatísticas */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-600" />
              Esteira Integrada de Clientes
            </h1>
            <p className="text-gray-600 mt-1">
              Gestão completa do ciclo de vida: Lead → Venda → Pós-Venda → Retenção
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={executarAutomacao}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Executar Automação
            </button>

            <button
              onClick={() => {
                setSelectedOpportunity(null)
                setIsModalOpen(true)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nova Oportunidade
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total na Esteira</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_na_esteira}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.total_valor)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Alertas Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{stats.alertas_urgentes}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Health Score Médio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(stats.health_score_medio)}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <select
          value={selectedPipeline}
          onChange={(e) => setSelectedPipeline(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Todos os Pipelines</option>
          {pipelines.map(pipeline => (
            <option key={pipeline.id} value={pipeline.id}>
              {pipeline.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Esteira de Clientes (Kanban) */}
      <div className="space-y-8">
        {pipelines.map(pipeline => (
          <div key={pipeline.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: pipeline.cor }}
              />
              <h2 className="text-xl font-bold text-gray-900">{pipeline.nome}</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                {pipeline.stages.reduce((acc, stage) => acc + stage.opportunities.length, 0)} cards
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4">
              {pipeline.stages.map(stage => (
                <div
                  key={stage.id}
                  className={`flex-shrink-0 w-80 ${
                    draggedOverStage === stage.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e, stage.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div
                    className="rounded-lg p-3 mb-3"
                    style={{ backgroundColor: stage.cor + '20' }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">{stage.nome}</h3>
                      <span className="px-2 py-1 bg-white rounded-full text-xs font-medium">
                        {stage.opportunities.length}
                      </span>
                    </div>
                    {stage.probabilidade > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {stage.probabilidade}% probabilidade
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    <AnimatePresence>
                      {stage.opportunities.map(opp => (
                        <motion.div
                          key={opp.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          draggable
                          onDragStart={() => handleDragStart(opp)}
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-move"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 flex-1 text-sm">
                              {opp.titulo}
                            </h4>
                            <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </div>

                          {opp.customer?.customer_name && (
                            <p className="text-xs text-gray-600 mb-2">
                              {opp.customer.customer_name}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(opp.valor)}
                            </span>
                            <span className={`${getTemperaturaColor(opp.temperatura)}`}>
                              {opp.temperatura}
                            </span>
                          </div>

                          {opp.cliente_health_score !== null && opp.cliente_health_score !== undefined && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600">Health Score</span>
                                <span className={`font-semibold ${getHealthScoreColor(opp.cliente_health_score).split(' ')[0]}`}>
                                  {Math.round(opp.cliente_health_score)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    opp.cliente_health_score >= 80 ? 'bg-green-500' :
                                    opp.cliente_health_score >= 60 ? 'bg-yellow-500' :
                                    opp.cliente_health_score >= 40 ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  style={{ width: `${opp.cliente_health_score}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {opp.proxima_acao_sugerida && (
                            <div className={`text-xs px-2 py-1 rounded ${
                              opp.proxima_acao_sugerida.includes('URGENTE')
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            } mb-2`}>
                              {opp.proxima_acao_sugerida}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {opp.dias_no_stage_atual}d
                            </div>

                            <div className="flex gap-1">
                              <button
                                onClick={() => handleWhatsAppClick(opp)}
                                className="p-1 hover:bg-green-50 rounded"
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedOpportunity(opp)
                                  setIsModalOpen(true)
                                }}
                                className="p-1 hover:bg-blue-50 rounded"
                                title="Ver detalhes"
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

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
