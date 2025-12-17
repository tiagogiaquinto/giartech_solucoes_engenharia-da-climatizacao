import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, TrendingUp, Users, Plus, Filter, Calendar,
  Clock, Star, Phone, Mail, MessageSquare, CheckCircle,
  AlertCircle, ThumbsUp, Award, Package, BarChart3,
  RefreshCw, Search, Eye, Edit, AlertTriangle, Smile,
  Frown, Meh, Target, DollarSign, ArrowRight, Bell
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { formatDateSafe, formatCurrency } from '../utils/format'
import { useToast } from '../hooks/useToast'

interface PosVendaCard {
  id: string
  customer_id: string
  service_order_id: string
  customer_name: string
  customer_whatsapp?: string
  customer_celular?: string
  customer_email?: string
  service_title: string
  data_conclusao: string
  dias_desde_conclusao: number
  garantia_ate?: string
  garantia_ativa: boolean
  satisfaction_score?: number
  feedback?: string
  proxima_acao: string
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente'
  status: 'pendente' | 'em_andamento' | 'concluido'
  valor_os: number
  data_proximo_contato?: string
}

interface Stats {
  total_clientes: number
  clientes_satisfeitos: number
  garantias_ativas: number
  followups_pendentes: number
  taxa_satisfacao: number
  valor_total_periodo: number
  indicacoes_potenciais: number
}

const PosVenda = () => {
  const [cards, setCards] = useState<PosVendaCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('todos')
  const [filterPriority, setFilterPriority] = useState('todos')
  const [stats, setStats] = useState<Stats>({
    total_clientes: 0,
    clientes_satisfeitos: 0,
    garantias_ativas: 0,
    followups_pendentes: 0,
    taxa_satisfacao: 0,
    valor_total_periodo: 0,
    indicacoes_potenciais: 0
  })
  const { showToast } = useToast()

  useEffect(() => {
    loadPosVendaData()
  }, [])

  const loadPosVendaData = async () => {
    try {
      setLoading(true)

      const { data: posVendaData, error } = await supabase
        .from('v_pos_venda_dashboard')
        .select('*')
        .order('prioridade', { ascending: false })
        .order('dias_desde_conclusao', { ascending: false })

      if (error) throw error

      setCards(posVendaData || [])
      calculateStats(posVendaData || [])
    } catch (error) {
      console.error('Erro ao carregar pós-venda:', error)
      showToast('Erro ao carregar dados de pós-venda', 'error')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: PosVendaCard[]) => {
    const satisfied = data.filter(d => d.satisfaction_score && d.satisfaction_score >= 4)
    const garantias = data.filter(d => d.garantia_ativa)
    const pendentes = data.filter(d => d.status === 'pendente')
    const potenciais = data.filter(d => d.satisfaction_score && d.satisfaction_score === 5)

    setStats({
      total_clientes: data.length,
      clientes_satisfeitos: satisfied.length,
      garantias_ativas: garantias.length,
      followups_pendentes: pendentes.length,
      taxa_satisfacao: data.length > 0 ? (satisfied.length / data.length) * 100 : 0,
      valor_total_periodo: data.reduce((sum, d) => sum + (d.valor_os || 0), 0),
      indicacoes_potenciais: potenciais.length
    })
  }

  const handleWhatsAppClick = (card: PosVendaCard) => {
    const whatsapp = card.customer_whatsapp || card.customer_celular
    if (!whatsapp) {
      showToast('Cliente não possui WhatsApp cadastrado', 'error')
      return
    }

    const phoneNumber = whatsapp.replace(/\D/g, '')
    const message = encodeURIComponent(
      `Olá ${card.customer_name}! Tudo bem?\n\nPassando para saber como está ${card.service_title}. Ficou tudo certo? Alguma dúvida ou necessidade?`
    )
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  const handleEmailClick = (card: PosVendaCard) => {
    if (!card.customer_email) {
      showToast('Cliente não possui email cadastrado', 'error')
      return
    }

    const subject = encodeURIComponent(`Follow-up: ${card.service_title}`)
    const body = encodeURIComponent(
      `Olá ${card.customer_name},\n\nEsperamos que esteja tudo bem!\n\nGostaríamos de saber sua opinião sobre ${card.service_title}.\n\nFicou satisfeito(a) com o serviço? Há algo que possamos melhorar?\n\nAguardamos seu retorno.\n\nAtenciosamente,`
    )
    window.location.href = `mailto:${card.customer_email}?subject=${subject}&body=${body}`
  }

  const registrarFeedback = async (cardId: string, score: number) => {
    try {
      const { error } = await supabase.rpc('registrar_feedback_posvenda', {
        p_card_id: cardId,
        p_satisfaction_score: score
      })

      if (error) throw error

      showToast('Feedback registrado com sucesso!', 'success')
      loadPosVendaData()
    } catch (error: any) {
      console.error('Erro ao registrar feedback:', error)
      showToast('Erro ao registrar feedback', 'error')
    }
  }

  const getSatisfactionIcon = (score?: number) => {
    if (!score) return <Meh className="w-5 h-5 text-gray-400" />
    if (score >= 4) return <Smile className="w-5 h-5 text-green-600" />
    if (score >= 3) return <Meh className="w-5 h-5 text-yellow-600" />
    return <Frown className="w-5 h-5 text-red-600" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-700 border-red-300'
      case 'alta': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'media': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'baixa': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-700'
      case 'em_andamento': return 'bg-yellow-100 text-yellow-700'
      case 'pendente': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredCards = cards.filter(card => {
    const matchesSearch = card.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.service_title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'todos' || card.status === filterStatus
    const matchesPriority = filterPriority === 'todos' || card.prioridade === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

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
            <Heart className="w-8 h-8 text-pink-600" />
            Pós-Venda Inteligente
          </h1>
          <p className="text-gray-600 mt-1">Cuide dos seus clientes e maximize recorrência</p>
        </div>

        <button
          onClick={loadPosVendaData}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-8 h-8 opacity-80" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">{stats.total_clientes}</div>
          <div className="text-sm opacity-90 mt-1">Clientes em Follow-up</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Smile className="w-8 h-8 opacity-80" />
            <ArrowRight className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">{stats.taxa_satisfacao.toFixed(1)}%</div>
          <div className="text-sm opacity-90 mt-1">Taxa de Satisfação</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <Target className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">{stats.garantias_ativas}</div>
          <div className="text-sm opacity-90 mt-1">Garantias Ativas</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Bell className="w-8 h-8 opacity-80" />
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-3xl font-bold">{stats.followups_pendentes}</div>
          <div className="text-sm opacity-90 mt-1">Follow-ups Pendentes</div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar cliente ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os Status</option>
            <option value="pendente">Pendente</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="concluido">Concluído</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todas as Prioridades</option>
            <option value="urgente">Urgente</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-blue-300"
            >
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{card.customer_name}</h3>
                  <p className="text-sm text-gray-600">{card.service_title}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getSatisfactionIcon(card.satisfaction_score)}
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getPriorityColor(card.prioridade)}`}>
                  {card.prioridade.toUpperCase()}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(card.status)}`}>
                  {card.status === 'em_andamento' ? 'Em Andamento' : card.status.charAt(0).toUpperCase() + card.status.slice(1)}
                </span>
                {card.garantia_ativa && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">
                    <Award className="w-3 h-3 inline mr-1" />
                    Garantia
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{card.dias_desde_conclusao} dias desde conclusão</span>
                </div>
                {card.garantia_ate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>Garantia até {formatDateSafe(card.garantia_ate)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">{formatCurrency(card.valor_os)}</span>
                </div>
              </div>

              {/* Próxima Ação */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-medium text-blue-900 mb-1">Próxima Ação:</p>
                <p className="text-sm text-blue-700">{card.proxima_acao}</p>
              </div>

              {/* Rating */}
              {!card.satisfaction_score && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Avaliar Satisfação:</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        key={score}
                        onClick={() => registrarFeedback(card.id, score)}
                        className="flex-1 p-2 rounded-lg border-2 border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                        title={`${score} estrelas`}
                      >
                        <Star className={`w-5 h-5 mx-auto ${score <= 3 ? 'text-gray-400' : 'text-yellow-500'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                {(card.customer_whatsapp || card.customer_celular) && (
                  <button
                    onClick={() => handleWhatsAppClick(card)}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                    title="WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm font-medium">WhatsApp</span>
                  </button>
                )}
                {card.customer_email && (
                  <button
                    onClick={() => handleEmailClick(card)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                    <span className="text-sm font-medium">Email</span>
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">Nenhum cliente para follow-up no momento</p>
        </div>
      )}
    </div>
  )
}

export default PosVenda
