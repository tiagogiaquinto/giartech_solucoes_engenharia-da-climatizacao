import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target, TrendingUp, Users, Plus, Filter, Calendar,
  Clock, DollarSign, Phone, Mail, Video, MessageSquare,
  FileText, Tag, Award, Zap, BarChart3, Settings,
  ArrowRight, ChevronRight, Search, Eye, Edit, Trash2, GripVertical
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDateSafe, formatCurrency } from '../utils/format'
import { useToast } from '../hooks/useToast'
import CRMOpportunityModal from '../components/CRMOpportunityModal'

interface Pipeline {
  id: string
  nome: string
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
  customer?: {
    nome_razao: string
  }
  owner?: {
    name: string
    role?: string
    department?: string
  }
  num_interacoes: number
  dias_no_pipeline: number
}

const CRMProfessional = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'pipeline' | 'lista' | 'calendario'>('pipeline')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null)
  const [draggedOpportunity, setDraggedOpportunity] = useState<any>(null)
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null)
  const { showToast } = useToast()

  const [stats, setStats] = useState({
    total_oportunidades: 0,
    valor_total: 0,
    valor_medio: 0,
    taxa_conversao: 0,
    meta_mensal: 0,
    realizacao: 0
  })

  useEffect(() => {
    loadCRMData()
  }, [selectedPipeline])

  const loadCRMData = async () => {
    try {
      setLoading(true)

      const { data: pipelineData, error: pipelineError } = await supabase
        .from('crm_pipelines')
        .select('*')
        .eq('is_ativo', true)
        .order('ordem')

      if (pipelineError) throw pipelineError

      if (!selectedPipeline && pipelineData && pipelineData.length > 0) {
        setSelectedPipeline(pipelineData[0].id)
      }

      const pipelineId = selectedPipeline || pipelineData?.[0]?.id

      if (pipelineId) {
        const { data: stagesData, error: stagesError } = await supabase
          .from('crm_stages')
          .select('*')
          .eq('pipeline_id', pipelineId)
          .eq('is_closed', false)
          .order('ordem')

        if (stagesError) throw stagesError

        const stagesWithOpps = await Promise.all(
          (stagesData || []).map(async (stage) => {
            const { data: opps, error: oppsError } = await supabase
              .from('crm_opportunities')
              .select(`
                *,
                customer:customers(nome_razao),
                owner:employees(name, role, department)
              `)
              .eq('stage_id', stage.id)
              .eq('status', 'aberto')
              .order('data_fechamento_esperada')

            if (oppsError) console.error(oppsError)

            return {
              ...stage,
              opportunities: opps || []
            }
          })
        )

        const pipelinesWithStages = (pipelineData || []).map(pipeline => ({
          ...pipeline,
          stages: pipeline.id === pipelineId ? stagesWithOpps : []
        }))

        setPipelines(pipelinesWithStages)

        calculateStats(stagesWithOpps)
      }

    } catch (error) {
      console.error('Erro ao carregar CRM:', error)
      showToast('Erro ao carregar dados do CRM', 'error')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (stages: any[]) => {
    const allOpps = stages.flatMap(s => s.opportunities)

    setStats({
      total_oportunidades: allOpps.length,
      valor_total: allOpps.reduce((sum, opp) => sum + (opp.valor || 0), 0),
      valor_medio: allOpps.length > 0 ? allOpps.reduce((sum, opp) => sum + (opp.valor || 0), 0) / allOpps.length : 0,
      taxa_conversao: 15,
      meta_mensal: 100000,
      realizacao: 45
    })
  }

  const handleDragStart = (e: React.DragEvent, opportunity: any) => {
    setDraggedOpportunity(opportunity)
    e.dataTransfer.effectAllowed = 'move'
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDraggedOpportunity(null)
    setDraggedOverStage(null)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverStage(stageId)
  }

  const handleDragLeave = () => {
    setDraggedOverStage(null)
  }

  const handleDrop = async (e: React.DragEvent, newStageId: string) => {
    e.preventDefault()
    setDraggedOverStage(null)

    if (!draggedOpportunity || draggedOpportunity.stage_id === newStageId) {
      return
    }

    const oldStageId = draggedOpportunity.stage_id
    const oppToMove = { ...draggedOpportunity }

    setPipelines(prevPipelines => {
      const updatedPipelines = prevPipelines.map(pipeline => ({
        ...pipeline,
        stages: pipeline.stages.map(stage => {
          if (stage.id === oldStageId) {
            return {
              ...stage,
              opportunities: stage.opportunities.filter(opp => opp.id !== oppToMove.id)
            }
          }
          if (stage.id === newStageId) {
            return {
              ...stage,
              opportunities: [...stage.opportunities, { ...oppToMove, stage_id: newStageId }]
            }
          }
          return stage
        })
      }))

      const currentPipeline = updatedPipelines.find(p => p.id === selectedPipeline)
      if (currentPipeline) {
        calculateStats(currentPipeline.stages)
      }

      return updatedPipelines
    })

    try {
      const { error } = await supabase
        .from('crm_opportunities')
        .update({ stage_id: newStageId })
        .eq('id', draggedOpportunity.id)

      if (error) throw error

      showToast('Oportunidade movida com sucesso!', 'success')
    } catch (error: any) {
      console.error('Erro ao mover oportunidade:', error)
      showToast('Erro ao mover oportunidade', 'error')
      loadCRMData()
    }
  }

  const getTemperaturaColor = (temp: string) => {
    switch (temp) {
      case 'quente': return 'text-red-600 bg-red-50'
      case 'morno': return 'text-orange-600 bg-orange-50'
      case 'frio': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getTemperaturaIcon = (temp: string) => {
    switch (temp) {
      case 'quente': return '🔥'
      case 'morno': return '☀️'
      case 'frio': return '❄️'
      default: return '⚪'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            CRM Profissional
          </h1>
          <p className="text-gray-600 mt-1">Gestão avançada de relacionamento com clientes</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('pipeline')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'pipeline'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            <Target className="w-4 h-4 inline-block mr-2" />
            Pipeline
          </button>
          <button
            onClick={() => setView('lista')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'lista'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }`}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Lista
          </button>
          <button
            onClick={() => {
              setSelectedOpportunity(null)
              setIsModalOpen(true)
            }}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nova Oportunidade
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">{stats.total_oportunidades}</div>
          <div className="text-sm opacity-90 mt-1">Oportunidades Abertas</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-8 h-8 opacity-80" />
            <ArrowRight className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(stats.valor_total)}</div>
          <div className="text-sm opacity-90 mt-1">Valor Total no Pipeline</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">{formatCurrency(stats.valor_medio)}</div>
          <div className="text-sm opacity-90 mt-1">Ticket Médio</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <ArrowRight className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">{stats.taxa_conversao}%</div>
          <div className="text-sm opacity-90 mt-1">Taxa de Conversão</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">{stats.realizacao}%</div>
          <div className="text-sm opacity-90 mt-1">Realização da Meta</div>
          <div className="mt-2 bg-white/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2" style={{ width: `${stats.realizacao}%` }}></div>
          </div>
        </motion.div>
      </div>

      {/* Pipelines Tabs */}
      <div className="flex items-center gap-2 border-b overflow-x-auto">
        {pipelines.map(pipeline => (
          <button
            key={pipeline.id}
            onClick={() => setSelectedPipeline(pipeline.id)}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              selectedPipeline === pipeline.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            style={{
              borderColor: selectedPipeline === pipeline.id ? pipeline.cor : 'transparent'
            }}
          >
            {pipeline.nome}
          </button>
        ))}
      </div>

      {/* Pipeline View */}
      {view === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {pipelines
              .find(p => p.id === selectedPipeline)
              ?.stages.map((stage, index) => (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex-shrink-0 w-80"
                >
                  {/* Stage Header */}
                  <div
                    className="rounded-t-xl p-4 border-t-4"
                    style={{
                      borderColor: stage.cor,
                      backgroundColor: `${stage.cor}10`
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{stage.nome}</h3>
                      <span className="text-sm text-gray-600">
                        {stage.opportunities.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{stage.probabilidade}% prob.</span>
                      <span className="font-medium">
                        {formatCurrency(
                          stage.opportunities.reduce((sum, opp) => sum + (opp.valor || 0), 0)
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Opportunities Cards */}
                  <div
                    className={`space-y-3 p-4 rounded-b-xl min-h-[500px] transition-colors ${
                      draggedOverStage === stage.id
                        ? 'bg-blue-100 border-2 border-blue-400 border-dashed'
                        : 'bg-gray-50'
                    }`}
                    onDragOver={(e) => handleDragOver(e, stage.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, stage.id)}
                  >
                    <AnimatePresence>
                      {stage.opportunities.map((opp) => (
                        <motion.div
                          key={opp.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, opp)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            if (!draggedOpportunity) {
                              setSelectedOpportunity(opp)
                              setIsModalOpen(true)
                            }
                          }}
                          className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all cursor-move border border-gray-200 hover:border-blue-400 relative group"
                        >
                          {/* Drag Handle */}
                          <div className="absolute left-2 top-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Temperatura Badge */}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getTemperaturaColor(opp.temperatura)}`}>
                              {getTemperaturaIcon(opp.temperatura)} {opp.temperatura}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Award className="w-3 h-3" />
                              {opp.lead_score}
                            </div>
                          </div>

                          {/* Título */}
                          <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                            {opp.titulo}
                          </h4>

                          {/* Cliente */}
                          {opp.customer && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Users className="w-4 h-4" />
                              <span className="truncate">{opp.customer.nome_razao}</span>
                            </div>
                          )}

                          {/* Valor */}
                          <div className="text-2xl font-bold text-blue-600 mb-3">
                            {formatCurrency(opp.valor)}
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateSafe(opp.data_fechamento_esperada)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {opp.num_interacoes}
                            </div>
                          </div>

                          {/* Responsável */}
                          {opp.owner && (
                            <div className="mt-2 text-xs text-gray-600 truncate" title={`${opp.owner.name}${opp.owner.role ? ` - ${opp.owner.role}` : ''}${opp.owner.department ? ` (${opp.owner.department})` : ''}`}>
                              👤 {opp.owner.name}
                              {opp.owner.role && <span className="text-gray-500"> • {opp.owner.role}</span>}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {stage.opportunities.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>Nenhuma oportunidade</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>
      )}

      <CRMOpportunityModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedOpportunity(null)
        }}
        onSave={() => {
          loadCRMData()
        }}
        opportunity={selectedOpportunity}
      />
    </div>
  )
}

export default CRMProfessional
