import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, User, Phone, Mail, FileText, TrendingUp, Package,
  Calendar, DollarSign, Clock, CheckCircle, XCircle, AlertCircle,
  Loader2, BarChart2, ShoppingBag, Repeat, ShoppingCart
} from 'lucide-react'
import { OSPipelineStepper } from '../components/ServiceOrder/OSPipelineStepper'
import { CustomerTimeline } from '../components/CustomerTimeline'

interface Customer360Data {
  customer: any
  os_summary: {
    total: number
    abertas: number
    concluidas: number
    canceladas: number
    total_gasto: number
    ticket_medio: number
    ultima_os: string | null
  }
  recurrence: any | null
  timeline: any[]
  recent_orders: any[]
  crm_opportunities: any[]
  materials_used: any[]
  agenda_events: any[]
  purchase_requests: any[]
  finance_summary: {
    total_receitas: number
    total_pendente: number
  }
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const formatDate = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  aberta: { label: 'Aberta', color: 'bg-blue-100 text-blue-700', icon: <Clock className="h-3.5 w-3.5" /> },
  agendada: { label: 'Agendada', color: 'bg-amber-100 text-amber-700', icon: <Calendar className="h-3.5 w-3.5" /> },
  em_andamento: { label: 'Em Andamento', color: 'bg-orange-100 text-orange-700', icon: <AlertCircle className="h-3.5 w-3.5" /> },
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3.5 w-3.5" /> },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3.5 w-3.5" /> },
}

export default function Customer360() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Customer360Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'orders' | 'crm' | 'materials' | 'agenda' | 'purchases'>('timeline')

  useEffect(() => {
    if (id) loadData(id)
  }, [id])

  const loadData = async (customerId: string) => {
    setLoading(true)
    try {
      const { data: result, error } = await supabase.rpc('fn_customer_360', {
        p_customer_id: customerId
      })
      if (error) throw error
      setData(result as Customer360Data)
    } catch (err) {
      console.error('Erro ao carregar perfil do cliente:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!data || !data.customer) {
    return (
      <div className="p-8 text-center text-gray-500">
        <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Cliente não encontrado.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">Voltar</button>
      </div>
    )
  }

  const { customer, os_summary, recurrence, timeline, recent_orders, crm_opportunities, materials_used, agenda_events, purchase_requests, finance_summary } = data

  const TABS = [
    { key: 'overview', label: 'Visão Geral', icon: <BarChart2 className="h-4 w-4" /> },
    { key: 'timeline', label: 'Histórico', icon: <Repeat className="h-4 w-4" /> },
    { key: 'orders', label: `Ordens (${os_summary?.total || 0})`, icon: <FileText className="h-4 w-4" /> },
    { key: 'crm', label: `CRM (${crm_opportunities?.length || 0})`, icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'materials', label: 'Materiais', icon: <Package className="h-4 w-4" /> },
    { key: 'agenda', label: 'Agenda', icon: <Calendar className="h-4 w-4" /> },
    { key: 'purchases', label: `Compras (${purchase_requests?.length || 0})`, icon: <ShoppingCart className="h-4 w-4" /> },
  ]

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil 360° do Cliente</h1>
          <p className="text-gray-500 text-sm">Visão consolidada de todas as interações</p>
        </div>
      </div>

      {/* Customer card */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{customer.nome_razao}</h2>
                {customer.nome_fantasia && (
                  <p className="text-sm text-gray-500">{customer.nome_fantasia}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {os_summary?.abertas > 0 && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {os_summary.abertas} OS em aberto
                  </span>
                )}
                {finance_summary?.total_pendente > 0 && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">
                    {formatCurrency(finance_summary.total_pendente)} pendente
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              {customer.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-gray-400" /> {customer.email}
                </span>
              )}
              {(customer.telefone || customer.celular) && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-gray-400" /> {customer.celular || customer.telefone}
                </span>
              )}
              {customer.cpf && <span className="text-gray-400">CPF: {customer.cpf}</span>}
              {customer.cnpj && <span className="text-gray-400">CNPJ: {customer.cnpj}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total de OS</p>
          <p className="text-2xl font-bold text-gray-900">{os_summary?.total || 0}</p>
          <p className="text-xs text-gray-400 mt-1">{os_summary?.concluidas || 0} concluídas</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Total Gasto</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(os_summary?.total_gasto)}</p>
          <p className="text-xs text-gray-400 mt-1">em OS concluídas</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Ticket Médio</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(os_summary?.ticket_medio)}</p>
          <p className="text-xs text-gray-400 mt-1">por OS concluída</p>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Última OS</p>
          <p className="text-lg font-bold text-gray-700">{formatDate(os_summary?.ultima_os)}</p>
          <p className="text-xs text-gray-400 mt-1">data de criação</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="flex border-b overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <CustomerTimeline
              timeline={timeline || []}
              recurrence={recurrence}
            />
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" /> Últimas Ordens de Serviço
                </h3>
                <div className="space-y-2">
                  {(recent_orders || []).slice(0, 5).map((order: any) => {
                    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['aberta']
                    return (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{order.order_number}</p>
                          <p className="text-xs text-gray-500 truncate">{order.description || '—'}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                          <span className="text-sm font-semibold text-gray-700">{formatCurrency(order.total_value)}</span>
                        </div>
                      </div>
                    )
                  })}
                  {(!recent_orders || recent_orders.length === 0) && (
                    <p className="text-gray-400 text-sm text-center py-4">Nenhuma OS encontrada</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-amber-500" /> Materiais Mais Usados
                  </h3>
                  <div className="space-y-2">
                    {(materials_used || []).slice(0, 5).map((mat: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                        <span className="text-sm text-gray-700 font-medium truncate">{mat.material_name || mat.nome_material}</span>
                        <div className="flex items-center gap-2 shrink-0 ml-3 text-xs text-gray-500">
                          <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded font-medium">
                            {mat.total_usado} un.
                          </span>
                          <span>{mat.vezes_usado}x usado</span>
                        </div>
                      </div>
                    ))}
                    {(!materials_used || materials_used.length === 0) && (
                      <p className="text-gray-400 text-sm text-center py-4">Nenhum material registrado</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" /> Financeiro
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                      <p className="text-xs text-green-600 font-medium">Receitas Pagas</p>
                      <p className="text-lg font-bold text-green-700 mt-1">{formatCurrency(finance_summary?.total_receitas)}</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs text-amber-600 font-medium">A Receber</p>
                      <p className="text-lg font-bold text-amber-700 mt-1">{formatCurrency(finance_summary?.total_pendente)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {(recent_orders || []).map((order: any) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG['aberta']
                return (
                  <div key={order.id} className="bg-gray-50 rounded-xl border p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-700">{order.order_number}</span>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{order.description || 'Sem descrição'}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(order.total_value)}</p>
                      </div>
                    </div>
                    {order.pipeline_stage && (
                      <OSPipelineStepper
                        currentStage={order.pipeline_stage}
                        readonly
                        compact
                      />
                    )}
                  </div>
                )
              })}
              {(!recent_orders || recent_orders.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p>Nenhuma ordem de serviço encontrada</p>
                </div>
              )}
            </div>
          )}

          {/* CRM Tab */}
          {activeTab === 'crm' && (
            <div className="space-y-3">
              {(crm_opportunities || []).map((opp: any) => (
                <div key={opp.id} className="bg-gray-50 rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-800">{opp.titulo}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          opp.temperatura === 'quente' ? 'bg-red-100 text-red-700' :
                          opp.temperatura === 'morno' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {opp.temperatura === 'quente' ? 'Quente' : opp.temperatura === 'morno' ? 'Morno' : 'Frio'}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(opp.created_at)}</span>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-gray-900 shrink-0">{formatCurrency(opp.valor)}</p>
                  </div>
                </div>
              ))}
              {(!crm_opportunities || crm_opportunities.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p>Nenhuma oportunidade CRM</p>
                </div>
              )}
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(materials_used || []).map((mat: any, i: number) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Package className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">{mat.material_name || mat.nome_material}</p>
                      <p className="text-xs text-gray-500">Usado em {mat.vezes_usado} OS</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{mat.total_usado}</p>
                      <p className="text-xs text-gray-400">unidades</p>
                    </div>
                  </div>
                ))}
              </div>
              {(!materials_used || materials_used.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p>Nenhum material registrado para este cliente</p>
                </div>
              )}
            </div>
          )}

          {/* Agenda Tab */}
          {activeTab === 'agenda' && (
            <div className="space-y-3">
              {(agenda_events || []).map((ev: any) => (
                <div key={ev.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{ev.title}</p>
                    <p className="text-xs text-gray-500">{ev.event_type} — {formatDate(ev.start_date)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                    ev.status === 'concluido' ? 'bg-green-100 text-green-700' :
                    ev.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {ev.status || 'a_fazer'}
                  </span>
                </div>
              ))}
              {(!agenda_events || agenda_events.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p>Nenhum evento na agenda</p>
                </div>
              )}
            </div>
          )}

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="space-y-3">
              {(purchase_requests || []).map((pr: any) => (
                <div key={pr.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    pr.urgency === 'urgente' || pr.urgency === 'critica' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    <ShoppingCart className={`h-5 w-5 ${
                      pr.urgency === 'urgente' || pr.urgency === 'critica' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{pr.material_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      OS: {pr.order_number} — Qtd: {pr.quantity_to_order}
                    </p>
                    <p className="text-xs text-gray-400">{formatDate(pr.created_at)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      pr.status === 'recebido' ? 'bg-green-100 text-green-700' :
                      pr.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                      pr.status === 'pedido_feito' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {pr.status === 'pendente' ? 'Pendente' :
                       pr.status === 'aprovado' ? 'Aprovado' :
                       pr.status === 'em_cotacao' ? 'Em Cotação' :
                       pr.status === 'pedido_feito' ? 'Pedido Feito' :
                       pr.status === 'recebido' ? 'Recebido' :
                       pr.status === 'cancelado' ? 'Cancelado' : pr.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!purchase_requests || purchase_requests.length === 0) && (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                  <p>Nenhuma requisição de compra gerada</p>
                  <p className="text-sm mt-1">Aparecem aqui quando materiais da OS estão em falta no estoque</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
