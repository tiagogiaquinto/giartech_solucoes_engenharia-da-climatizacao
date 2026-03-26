import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
  Package,
  Users,
  ClipboardList,
  Calendar,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  Target,
  Warehouse,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart2,
  ArrowRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

interface CompanySnapshot {
  receita_mes_atual: number
  despesa_mes_atual: number
  receitas_a_receber: number
  despesas_a_pagar: number
  receitas_vencidas: number
  despesas_vencidas: number
  os_abertas: number
  os_em_andamento: number
  os_concluidas_mes: number
  faturamento_os_mes: number
  eventos_hoje: number
  eventos_proximos_7_dias: number
  itens_estoque_critico: number
  itens_sem_estoque: number
  valor_estoque_total: number
  total_clientes: number
  novos_clientes_30d: number
  oportunidades_ativas: number
  valor_pipeline_crm: number
  funcionarios_ativos: number
  saldo_contas: number
  pedidos_compra_abertos: number
  snapshot_timestamp: string
}

interface AgendaEvent {
  id: string
  titulo: string
  data_inicio: string
  tipo_evento: string
  status: string
  quando: string
}

interface OSSummary {
  id: string
  order_number: string
  status: string
  cliente_nome: string
  valor_total: number
  dias_em_aberto: number
  descricao: string
}

interface InventoryItem {
  id: string
  nome: string
  categoria: string
  quantidade: number
  estoque_minimo: number
  status_estoque: string
}

const SUGGESTED_QUESTIONS = [
  { category: 'Financeiro', icon: DollarSign, color: 'blue', questions: [
    'Qual o lucro líquido do mês?',
    'Mostre o fluxo de caixa dos próximos 30 dias',
    'Quais receitas estão vencidas?',
    'Como está a margem de lucro?',
    'Quais despesas estão atrasadas?',
  ]},
  { category: 'Ordens de Serviço', icon: ClipboardList, color: 'orange', questions: [
    'Quantas OS estão abertas agora?',
    'Quais OS estão em andamento?',
    'Mostre as OS com mais dias em aberto',
    'Qual o faturamento das OS este mês?',
    'Tem alguma OS com prazo vencido?',
  ]},
  { category: 'Estoque', icon: Package, color: 'green', questions: [
    'Quais itens estão com estoque crítico?',
    'Quais itens estão zerados no estoque?',
    'Qual o valor total do estoque?',
    'O que precisa ser comprado com urgência?',
  ]},
  { category: 'Clientes e CRM', icon: Users, color: 'teal', questions: [
    'Quantos clientes temos no total?',
    'Quantos clientes novos tivemos em 30 dias?',
    'Qual o valor do pipeline do CRM?',
    'Quantas oportunidades estão ativas?',
    'Quais clientes correm risco de churn?',
  ]},
  { category: 'Agenda', icon: Calendar, color: 'purple', questions: [
    'O que temos na agenda hoje?',
    'Quais eventos estão nos próximos 7 dias?',
    'Tem alguma visita técnica agendada?',
  ]},
  { category: 'Análise Geral', icon: BarChart2, color: 'slate', questions: [
    'Mostre o dashboard geral da empresa',
    'Como está a saúde do negócio?',
    'Quais são os principais alertas?',
    'Me dê um resumo executivo do dia',
    'Quais oportunidades de melhoria existem?',
  ]},
]

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  teal: 'bg-teal-50 border-teal-200 text-teal-700',
  purple: 'bg-violet-50 border-violet-200 text-violet-700',
  slate: 'bg-slate-50 border-slate-200 text-slate-700',
}

const iconColorMap: Record<string, string> = {
  blue: 'text-blue-600 bg-blue-100',
  orange: 'text-orange-600 bg-orange-100',
  green: 'text-emerald-600 bg-emerald-100',
  teal: 'text-teal-600 bg-teal-100',
  purple: 'text-violet-600 bg-violet-100',
  slate: 'text-slate-600 bg-slate-100',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default function ThomazDashboard() {
  const navigate = useNavigate()
  const [snapshot, setSnapshot] = useState<CompanySnapshot | null>(null)
  const [agenda, setAgenda] = useState<AgendaEvent[]>([])
  const [osList, setOsList] = useState<OSSummary[]>([])
  const [criticalStock, setCriticalStock] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    setLoading(true)
    try {
      const [snapshotRes, agendaRes, osRes, stockRes] = await Promise.all([
        supabase.from('v_thomaz_company_snapshot').select('*').maybeSingle(),
        supabase.from('v_thomaz_agenda_today').select('*').order('data_inicio').limit(8),
        supabase.from('v_thomaz_os_summary').select('*').in('status', ['aberta', 'em_andamento']).order('dias_em_aberto', { ascending: false }).limit(6),
        supabase.from('v_thomaz_inventory_status').select('*').in('status_estoque', ['sem_estoque', 'critico']).limit(6),
      ])

      if (snapshotRes.data) setSnapshot(snapshotRes.data)
      if (agendaRes.data) setAgenda(agendaRes.data)
      if (osRes.data) setOsList(osRes.data)
      if (stockRes.data) setCriticalStock(stockRes.data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Error loading dashboard:', err)
    }
    setLoading(false)
  }

  const handleAskThomax = (question: string) => {
    sessionStorage.setItem('thomaz_initial_question', question)
    navigate('/thomaz-chat')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 text-sm">Carregando dados em tempo real...</p>
        </div>
      </div>
    )
  }

  const lucroMes = snapshot ? (snapshot.receita_mes_atual - snapshot.despesa_mes_atual) : 0
  const temAlertaFinanceiro = snapshot && (snapshot.receitas_vencidas > 0 || snapshot.despesas_vencidas > 0)

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Thomaz — Painel de Inteligência</h1>
            {lastUpdate && (
              <p className="text-xs text-gray-400">
                Atualizado em {format(lastUpdate, "HH:mm 'de' dd/MM", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadAllData}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={() => navigate('/thomaz-chat')}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Conversar com Thomaz
          </button>
        </div>
      </div>

      {/* KPIs Principais */}
      {snapshot && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Receita do Mês</span>
              <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(snapshot.receita_mes_atual)}</p>
            <p className="text-xs text-gray-400 mt-1">a receber: {formatCurrency(snapshot.receitas_a_receber)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Despesas do Mês</span>
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-red-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(snapshot.despesa_mes_atual)}</p>
            <p className="text-xs text-gray-400 mt-1">a pagar: {formatCurrency(snapshot.despesas_a_pagar)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`border rounded-xl p-4 ${lucroMes >= 0 ? 'bg-white border-gray-200' : 'bg-red-50 border-red-200'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Lucro do Mês</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${lucroMes >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <Activity className={`w-4 h-4 ${lucroMes >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
            <p className={`text-lg font-bold ${lucroMes >= 0 ? 'text-gray-900' : 'text-red-700'}`}>
              {formatCurrency(lucroMes)}
            </p>
            <p className="text-xs text-gray-400 mt-1">saldo contas: {formatCurrency(snapshot.saldo_contas)}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">OS Ativas</span>
              <div className="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-orange-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{snapshot.os_abertas + snapshot.os_em_andamento}</p>
            <p className="text-xs text-gray-400 mt-1">{snapshot.os_abertas} abertas · {snapshot.os_em_andamento} em andamento</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Clientes</span>
              <div className="w-7 h-7 bg-teal-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-teal-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{snapshot.total_clientes}</p>
            <p className="text-xs text-gray-400 mt-1">+{snapshot.novos_clientes_30d} nos últimos 30 dias</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Pipeline CRM</span>
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(snapshot.valor_pipeline_crm)}</p>
            <p className="text-xs text-gray-400 mt-1">{snapshot.oportunidades_ativas} oportunidades ativas</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`border rounded-xl p-4 ${snapshot.itens_estoque_critico > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Estoque Crítico</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${snapshot.itens_estoque_critico > 0 ? 'bg-yellow-200' : 'bg-slate-100'}`}>
                <Warehouse className={`w-4 h-4 ${snapshot.itens_estoque_critico > 0 ? 'text-yellow-700' : 'text-slate-600'}`} />
              </div>
            </div>
            <p className={`text-lg font-bold ${snapshot.itens_estoque_critico > 0 ? 'text-yellow-800' : 'text-gray-900'}`}>
              {snapshot.itens_estoque_critico} itens
            </p>
            <p className="text-xs text-gray-400 mt-1">{snapshot.itens_sem_estoque} zerados · {formatCurrency(snapshot.valor_estoque_total)} total</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white border border-gray-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Agenda</span>
              <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <p className="text-lg font-bold text-gray-900">{snapshot.eventos_hoje} hoje</p>
            <p className="text-xs text-gray-400 mt-1">{snapshot.eventos_proximos_7_dias} nos próximos 7 dias</p>
          </motion.div>
        </div>
      )}

      {/* Alertas */}
      {snapshot && temAlertaFinanceiro && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800 mb-1">Alertas financeiros detectados</p>
            <div className="flex flex-wrap gap-3 text-xs text-red-700">
              {snapshot.receitas_vencidas > 0 && (
                <span>{formatCurrency(snapshot.receitas_vencidas)} em receitas vencidas</span>
              )}
              {snapshot.despesas_vencidas > 0 && (
                <span>{formatCurrency(snapshot.despesas_vencidas)} em despesas vencidas</span>
              )}
            </div>
          </div>
          <button
            onClick={() => handleAskThomax('Mostre detalhes dos lançamentos vencidos e o que fazer')}
            className="text-xs text-red-700 border border-red-300 rounded-lg px-3 py-1.5 hover:bg-red-100 transition-colors flex-shrink-0 flex items-center gap-1"
          >
            Analisar <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* OS Abertas */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-semibold text-gray-900">OS Abertas / Em Andamento</h3>
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{osList.length}</span>
          </div>
          <div className="space-y-2">
            {osList.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-600 py-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Nenhuma OS pendente</span>
              </div>
            ) : osList.map(os => (
              <div key={os.id} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${os.status === 'aberta' ? 'bg-orange-400' : 'bg-blue-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-800 truncate">{os.cliente_nome}</p>
                  <p className="text-xs text-gray-400 truncate">{os.order_number}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-semibold text-gray-700">{formatCurrency(os.valor_total)}</p>
                  <p className="text-xs text-gray-400">{os.dias_em_aberto}d</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleAskThomax('Quais OS abertas precisam de atenção urgente?')}
            className="mt-3 w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
          >
            Perguntar ao Thomaz <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Agenda de Hoje */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">Agenda — Próximos Eventos</h3>
            </div>
          </div>
          <div className="space-y-2">
            {agenda.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">Nenhum evento próximo</p>
            ) : agenda.map(ev => (
              <div key={ev.id} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className={`flex-shrink-0 mt-0.5 ${ev.quando === 'hoje' ? 'text-orange-500' : 'text-gray-400'}`}>
                  {ev.quando === 'hoje' ? <Clock className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-800 leading-tight truncate">{ev.titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(ev.data_inicio), "dd/MM HH:mm", { locale: ptBR })} · {ev.quando === 'hoje' ? 'Hoje' : 'Em breve'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleAskThomax('O que temos na agenda hoje e amanhã?')}
            className="mt-3 w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
          >
            Ver detalhes com Thomaz <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Estoque Crítico */}
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-yellow-600" />
              <h3 className="text-sm font-semibold text-gray-900">Estoque Crítico / Zerado</h3>
            </div>
            {criticalStock.length > 0 && (
              <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{criticalStock.length}</span>
            )}
          </div>
          <div className="space-y-2">
            {criticalStock.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-600 py-2">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Estoque saudável</span>
              </div>
            ) : criticalStock.map(item => (
              <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-gray-50 last:border-0">
                <div className={`flex-shrink-0 mt-0.5 ${item.status_estoque === 'sem_estoque' ? 'text-red-400' : 'text-yellow-500'}`}>
                  <AlertCircle className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-800 truncate leading-tight">{item.nome}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Qtd: {item.quantidade} · Mín: {item.estoque_minimo}
                  </p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${item.status_estoque === 'sem_estoque' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {item.status_estoque === 'sem_estoque' ? 'Zerado' : 'Crítico'}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleAskThomax('O que precisa ser comprado com urgência no estoque?')}
            className="mt-3 w-full text-xs text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
          >
            Analisar com Thomaz <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Guia de Perguntas */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">O que você pode perguntar ao Thomaz</h2>
            <p className="text-xs text-gray-400">Clique em qualquer pergunta para abrir o chat com ela preenchida</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUGGESTED_QUESTIONS.map((group) => {
            const Icon = group.icon
            return (
              <div key={group.category} className={`border rounded-xl p-3 ${colorMap[group.color]}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${iconColorMap[group.color]}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{group.category}</span>
                </div>
                <ul className="space-y-1">
                  {group.questions.map((q) => (
                    <li key={q}>
                      <button
                        onClick={() => handleAskThomax(q)}
                        className="w-full text-left text-xs py-1 px-1.5 rounded hover:bg-white/60 transition-colors flex items-center gap-1 group"
                      >
                        <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-70 flex-shrink-0" />
                        <span>{q}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rodapé informativo */}
      <div className="flex items-center justify-between text-xs text-gray-400 pb-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {snapshot?.funcionarios_ativos} funcionários ativos</span>
          <span className="flex items-center gap-1"><Package className="w-3 h-3" /> {formatCurrency(snapshot?.valor_estoque_total || 0)} em estoque</span>
          <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {snapshot?.oportunidades_ativas} oportunidades CRM</span>
        </div>
        <span>Dados de {lastUpdate ? format(lastUpdate, "HH:mm", { locale: ptBR }) : '—'}</span>
      </div>

    </div>
  )
}
