import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  Package,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Download,
  Eye
} from 'lucide-react'
import { supabase, getServiceOrderById, deleteServiceOrder } from '../lib/supabase'
import { TabContainer } from '../components/TabContainer'

const ServiceOrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadOrderData()
    }
  }, [id])

  const loadOrderData = async () => {
    try {
      setLoading(true)
      setError(null)

      const orderData = await getServiceOrderById(id!)

      if (!orderData) {
        setError('Ordem de serviço não encontrada')
        setLoading(false)
        return
      }

      setOrder(orderData)

      const [customerRes, itemsRes, materialsRes, teamRes, documentsRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*, customer_addresses(*)')
          .eq('id', orderData.client_id)
          .single(),

        supabase
          .from('service_order_items')
          .select('*, service_catalog:service_catalog_id(*)')
          .eq('service_order_id', id)
          .order('created_at', { ascending: true }),

        supabase
          .from('service_order_materials')
          .select('*, inventory_items(*)')
          .eq('service_order_id', id)
          .order('created_at', { ascending: true }),

        supabase
          .from('service_order_labor')
          .select('*, employees(*)')
          .eq('service_order_id', id)
          .order('created_at', { ascending: true }),

        supabase
          .from('service_order_documents')
          .select('*')
          .eq('service_order_id', id)
          .order('created_at', { ascending: false })
      ])

      setCustomer(customerRes.data)
      setItems(itemsRes.data || [])
      setMaterials(materialsRes.data || [])
      setTeam(teamRes.data || [])
      setDocuments(documentsRes.data || [])

    } catch (err) {
      console.error('Error loading order:', err)
      setError('Erro ao carregar ordem de serviço')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      return
    }

    try {
      await deleteServiceOrder(id!)
      navigate('/service-orders')
    } catch (err) {
      console.error('Error deleting order:', err)
      alert('Erro ao excluir ordem de serviço')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      quotation: 'bg-purple-100 text-purple-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_progress: 'Em Andamento',
      paused: 'Pausado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      quotation: 'Orçamento'
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando ordem de serviço...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro</h2>
          <p className="text-gray-600 mb-4">{error || 'Ordem de serviço não encontrada'}</p>
          <button
            onClick={() => navigate('/service-orders')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para Ordens de Serviço
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: FileText },
    { id: 'items', label: 'Serviços', icon: Package, badge: items.length },
    { id: 'materials', label: 'Materiais', icon: Package, badge: materials.length },
    { id: 'team', label: 'Equipe', icon: Users, badge: team.length },
    { id: 'financial', label: 'Financeiro', icon: DollarSign },
    { id: 'documents', label: 'Documentos', icon: FileText, badge: documents.length },
    { id: 'timeline', label: 'Histórico', icon: Clock }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/service-orders')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/service-orders/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>

              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                OS #{order.order_number}
              </h1>
              <p className="text-gray-600">
                {customer?.name || 'Cliente não identificado'}
              </p>
            </div>

            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {getStatusLabel(order.status)}
              </span>
              <p className="text-sm text-gray-600 mt-2">
                Criado em {new Date(order.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <OverviewTab order={order} customer={customer} />
            )}

            {activeTab === 'items' && (
              <ItemsTab items={items} orderId={id!} onUpdate={loadOrderData} />
            )}

            {activeTab === 'materials' && (
              <MaterialsTab materials={materials} orderId={id!} onUpdate={loadOrderData} />
            )}

            {activeTab === 'team' && (
              <TeamTab team={team} orderId={id!} onUpdate={loadOrderData} />
            )}

            {activeTab === 'financial' && (
              <FinancialTab order={order} items={items} materials={materials} team={team} />
            )}

            {activeTab === 'documents' && (
              <DocumentsTab documents={documents} orderId={id!} onUpdate={loadOrderData} />
            )}

            {activeTab === 'timeline' && (
              <TimelineTab orderId={id!} />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const OverviewTab = ({ order, customer }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Informações do Cliente</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Nome:</span> {customer?.name}</p>
          <p><span className="font-medium">Email:</span> {customer?.email}</p>
          <p><span className="font-medium">Telefone:</span> {customer?.phone}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Detalhes da OS</h3>
        <div className="space-y-2">
          <p><span className="font-medium">Número:</span> {order.order_number}</p>
          <p><span className="font-medium">Data:</span> {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
          <p><span className="font-medium">Prazo:</span> {order.execution_deadline ? new Date(order.execution_deadline).toLocaleDateString('pt-BR') : 'Não definido'}</p>
        </div>
      </div>
    </div>

    {order.description && (
      <div>
        <h3 className="text-lg font-semibold mb-2">Descrição</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{order.description}</p>
      </div>
    )}

    {order.notes && (
      <div>
        <h3 className="text-lg font-semibold mb-2">Observações</h3>
        <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
      </div>
    )}
  </div>
)

const ItemsTab = ({ items, orderId, onUpdate }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Serviços da Ordem</h3>
    {items.length === 0 ? (
      <p className="text-gray-500">Nenhum serviço adicionado</p>
    ) : (
      <div className="space-y-4">
        {items.map((item: any) => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{item.service_catalog?.name || item.service_name}</h4>
                {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
              </div>
              <div className="text-right">
                <p className="font-semibold">R$ {parseFloat(item.unit_price || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Qtd: {item.quantity || 1}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const MaterialsTab = ({ materials, orderId, onUpdate }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Materiais Utilizados</h3>
    {materials.length === 0 ? (
      <p className="text-gray-500">Nenhum material adicionado</p>
    ) : (
      <div className="space-y-4">
        {materials.map((material: any) => (
          <div key={material.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{material.inventory_items?.name || material.material_name}</h4>
                <p className="text-sm text-gray-600">SKU: {material.inventory_items?.sku}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">R$ {parseFloat(material.unit_cost || 0).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Qtd: {material.quantity}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const TeamTab = ({ team, orderId, onUpdate }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Equipe Alocada</h3>
    {team.length === 0 ? (
      <p className="text-gray-500">Nenhum funcionário alocado</p>
    ) : (
      <div className="space-y-4">
        {team.map((member: any) => (
          <div key={member.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{member.employees?.name}</h4>
                <p className="text-sm text-gray-600">{member.employees?.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">{member.hours_worked || 0}h trabalhadas</p>
                <p className="font-semibold">R$ {parseFloat(member.labor_cost || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const FinancialTab = ({ order, items, materials, team }: any) => {
  const subtotal = parseFloat(order.subtotal_value || 0)
  const discount = parseFloat(order.discount_value || 0)
  const total = parseFloat(order.total_value || 0)

  const itemsTotal = items.reduce((sum: number, item: any) =>
    sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 1)), 0
  )

  const materialsTotal = materials.reduce((sum: number, mat: any) =>
    sum + (parseFloat(mat.unit_cost || 0) * parseFloat(mat.quantity || 1)), 0
  )

  const laborTotal = team.reduce((sum: number, member: any) =>
    sum + parseFloat(member.labor_cost || 0), 0
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Serviços</p>
          <p className="text-2xl font-bold text-blue-600">R$ {itemsTotal.toFixed(2)}</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Materiais</p>
          <p className="text-2xl font-bold text-orange-600">R$ {materialsTotal.toFixed(2)}</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Mão de Obra</p>
          <p className="text-2xl font-bold text-green-600">R$ {laborTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold">R$ {subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-red-600">
            <span>Desconto</span>
            <span>- R$ {discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-xl font-bold border-t pt-2">
          <span>Total</span>
          <span className="text-green-600">R$ {total.toFixed(2)}</span>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Informações de Pagamento</h4>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Forma de Pagamento:</span> {order.payment_method || 'Não definido'}</p>
          <p><span className="font-medium">Status:</span> {order.payment_status || 'Pendente'}</p>
        </div>
      </div>
    </div>
  )
}

const DocumentsTab = ({ documents, orderId, onUpdate }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Documentos</h3>
    {documents.length === 0 ? (
      <p className="text-gray-500">Nenhum documento anexado</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc: any) => (
          <div key={doc.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-semibold">{doc.document_name}</h4>
                <p className="text-sm text-gray-600">{doc.document_type}</p>
                <p className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Download className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)

const TimelineTab = ({ orderId }: any) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">Histórico de Alterações</h3>
    <div className="space-y-4">
      <p className="text-gray-500">Funcionalidade de histórico em desenvolvimento</p>
    </div>
  </div>
)

export default ServiceOrderDetails
