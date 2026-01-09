import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Phone, Mail, MapPin, Building, Star, ExternalLink, Check, X, UserPlus, MessageCircle, Calendar, Tag } from 'lucide-react'
import { useToast } from '../hooks/useToast'

interface Lead {
  id: string
  campaign_id: string
  company_name: string
  cnpj: string
  email: string
  phone: string
  whatsapp: string
  address: string
  cep: string
  city: string
  state: string
  neighborhood: string
  business_type: string
  google_place_id: string
  google_rating: number
  google_reviews_count: number
  website: string
  social_media: any
  source: string
  status: 'novo' | 'contatado' | 'qualificado' | 'convertido' | 'descartado'
  priority: 'baixa' | 'média' | 'alta'
  notes: string
  tags: string[]
  converted_to_customer_id: string
  assigned_to: string
  last_contact_at: string
  next_follow_up: string
  metadata: any
  captured_at: string
  created_at: string
}

export default function CapturedLeadsManagement() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterSource, setFilterSource] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const { showToast } = useToast()

  const [employees, setEmployees] = useState<any[]>([])

  useEffect(() => {
    loadLeads()
    loadEmployees()
  }, [])

  const loadLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('captured_leads')
        .select('*')
        .order('captured_at', { ascending: false })

      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Error loading leads:', error)
      showToast('Erro ao carregar leads', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, nome')
        .order('nome')

      setEmployees(data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
    }
  }

  const updateLeadStatus = async (leadId: string, status: Lead['status']) => {
    try {
      const { error } = await supabase
        .from('captured_leads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error
      showToast('Status atualizado!', 'success')
      loadLeads()
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('Erro ao atualizar status', 'error')
    }
  }

  const updateLeadPriority = async (leadId: string, priority: Lead['priority']) => {
    try {
      const { error } = await supabase
        .from('captured_leads')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error
      showToast('Prioridade atualizada!', 'success')
      loadLeads()
    } catch (error) {
      console.error('Error updating priority:', error)
      showToast('Erro ao atualizar prioridade', 'error')
    }
  }

  const assignLead = async (leadId: string, employeeId: string) => {
    try {
      const { error } = await supabase
        .from('captured_leads')
        .update({ assigned_to: employeeId, updated_at: new Date().toISOString() })
        .eq('id', leadId)

      if (error) throw error
      showToast('Lead atribuído!', 'success')
      loadLeads()
    } catch (error) {
      console.error('Error assigning lead:', error)
      showToast('Erro ao atribuir lead', 'error')
    }
  }

  const convertToCustomer = async (leadId: string) => {
    if (!confirm('Deseja converter este lead em cliente?')) return

    try {
      const { data } = await supabase.auth.getUser()
      const userId = data?.user?.id

      if (!userId) throw new Error('User not authenticated')

      const { data: customerId, error } = await supabase
        .rpc('convert_lead_to_customer', {
          p_lead_id: leadId,
          p_converted_by: userId
        })

      if (error) throw error

      showToast('Lead convertido em cliente com sucesso!', 'success')
      loadLeads()
    } catch (error: any) {
      console.error('Error converting lead:', error)
      showToast(error.message || 'Erro ao converter lead', 'error')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      novo: 'bg-blue-100 text-blue-800',
      contatado: 'bg-yellow-100 text-yellow-800',
      qualificado: 'bg-purple-100 text-purple-800',
      convertido: 'bg-green-100 text-green-800',
      descartado: 'bg-red-100 text-red-800'
    }
    return badges[status as keyof typeof badges] || badges.novo
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      baixa: 'bg-gray-100 text-gray-800',
      média: 'bg-blue-100 text-blue-800',
      alta: 'bg-red-100 text-red-800'
    }
    return badges[priority as keyof typeof badges] || badges.média
  }

  const getSourceBadge = (source: string) => {
    const badges = {
      google_maps: 'bg-green-100 text-green-800',
      correios: 'bg-blue-100 text-blue-800',
      manual: 'bg-gray-100 text-gray-800',
      api: 'bg-purple-100 text-purple-800'
    }
    return badges[source as keyof typeof badges] || badges.manual
  }

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filterStatus === 'all' || lead.status === filterStatus
    const matchesPriority = filterPriority === 'all' || lead.priority === filterPriority
    const matchesSource = filterSource === 'all' || lead.source === filterSource
    const matchesSearch =
      lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm) ||
      lead.cnpj?.includes(searchTerm)

    return matchesStatus && matchesPriority && matchesSource && matchesSearch
  })

  if (loading) {
    return <div className="p-6">Carregando...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Capturados</h1>
          <p className="text-gray-600 mt-1">Gerencie e qualifique seus leads</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Buscar por nome, email, telefone ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">Todos Status</option>
            <option value="novo">Novo</option>
            <option value="contatado">Contatado</option>
            <option value="qualificado">Qualificado</option>
            <option value="convertido">Convertido</option>
            <option value="descartado">Descartado</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">Todas Prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="média">Média</option>
            <option value="alta">Alta</option>
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="all">Todas Fontes</option>
            <option value="google_maps">Google Maps</option>
            <option value="correios">Correios</option>
            <option value="api">API</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Localização</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fonte</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2">
                    <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{lead.company_name}</div>
                      {lead.business_type && (
                        <div className="text-sm text-gray-500">{lead.business_type}</div>
                      )}
                      {lead.google_rating > 0 && (
                        <div className="flex items-center gap-1 text-sm mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span>{lead.google_rating}</span>
                          <span className="text-gray-400">({lead.google_reviews_count})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    {lead.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{lead.phone}</span>
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{lead.email}</span>
                      </div>
                    )}
                    {lead.whatsapp && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageCircle className="w-4 h-4" />
                        <span>{lead.whatsapp}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      {lead.city && <div>{lead.city} - {lead.state}</div>}
                      {lead.neighborhood && <div className="text-gray-500">{lead.neighborhood}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getSourceBadge(lead.source)}`}>
                    {lead.source.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value as Lead['status'])}
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(lead.status)} border-0 cursor-pointer`}
                  >
                    <option value="novo">Novo</option>
                    <option value="contatado">Contatado</option>
                    <option value="qualificado">Qualificado</option>
                    <option value="convertido">Convertido</option>
                    <option value="descartado">Descartado</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={lead.priority}
                    onChange={(e) => updateLeadPriority(lead.id, e.target.value as Lead['priority'])}
                    className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(lead.priority)} border-0 cursor-pointer`}
                  >
                    <option value="baixa">Baixa</option>
                    <option value="média">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedLead(lead)
                        setShowDetailModal(true)
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Ver detalhes"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    {lead.status !== 'convertido' && (
                      <button
                        onClick={() => convertToCustomer(lead.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Converter em cliente"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Nenhum lead encontrado com os filtros selecionados
          </div>
        )}
      </div>

      {showDetailModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold">{selectedLead.company_name}</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Informações de Contato</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedLead.phone && (
                      <div>
                        <span className="text-gray-600">Telefone:</span>
                        <div className="font-medium">{selectedLead.phone}</div>
                      </div>
                    )}
                    {selectedLead.email && (
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <div className="font-medium">{selectedLead.email}</div>
                      </div>
                    )}
                    {selectedLead.whatsapp && (
                      <div>
                        <span className="text-gray-600">WhatsApp:</span>
                        <div className="font-medium">{selectedLead.whatsapp}</div>
                      </div>
                    )}
                    {selectedLead.website && (
                      <div>
                        <span className="text-gray-600">Website:</span>
                        <div className="font-medium">
                          <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {selectedLead.website}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Endereço</h3>
                  <div className="text-sm">
                    <div>{selectedLead.address}</div>
                    <div>{selectedLead.neighborhood}</div>
                    <div>{selectedLead.city} - {selectedLead.state}</div>
                    <div>CEP: {selectedLead.cep}</div>
                  </div>
                </div>

                {selectedLead.cnpj && (
                  <div>
                    <h3 className="font-semibold mb-2">CNPJ</h3>
                    <div className="text-sm font-medium">{selectedLead.cnpj}</div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Atribuir a:</h3>
                  <select
                    value={selectedLead.assigned_to || ''}
                    onChange={(e) => assignLead(selectedLead.id, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Não atribuído</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Observações</h3>
                  <textarea
                    value={selectedLead.notes || ''}
                    onChange={async (e) => {
                      const newNotes = e.target.value
                      setSelectedLead({ ...selectedLead, notes: newNotes })
                      await supabase
                        .from('captured_leads')
                        .update({ notes: newNotes })
                        .eq('id', selectedLead.id)
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={4}
                    placeholder="Adicione observações sobre este lead..."
                  />
                </div>

                {selectedLead.status !== 'convertido' && (
                  <button
                    onClick={() => {
                      convertToCustomer(selectedLead.id)
                      setShowDetailModal(false)
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Converter em Cliente
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
