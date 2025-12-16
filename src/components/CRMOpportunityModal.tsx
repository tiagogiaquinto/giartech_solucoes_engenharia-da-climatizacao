import { useState, useEffect } from 'react'
import { X, Calendar, DollarSign, Target, Users, FileText, Clock, MapPin, Phone, Mail, MessageCircle, Plus, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import CustomerModal from './CustomerModal'

interface CRMOpportunityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  opportunity?: any
}

const CRMOpportunityModal = ({ isOpen, onClose, onSave, opportunity }: CRMOpportunityModalProps) => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [pipelines, setPipelines] = useState<any[]>([])
  const [stages, setStages] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [selectedCustomerPhone, setSelectedCustomerPhone] = useState('')

  const [formData, setFormData] = useState({
    titulo: '',
    customer_id: '',
    pipeline_id: '',
    stage_id: '',
    owner_id: '',
    valor: '',
    data_fechamento_esperada: '',
    temperatura: 'morno',
    lead_score: '50',
    descricao: '',
    criar_visita: false,
    data_visita: '',
    hora_visita: '',
    local_visita: '',
    observacoes_visita: '',
    criar_orcamento: false,
    descricao_orcamento: '',
    validade_orcamento: '30'
  })

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
      if (opportunity) {
        setFormData({
          ...formData,
          ...opportunity,
          valor: opportunity.valor?.toString() || '',
          lead_score: opportunity.lead_score?.toString() || '50'
        })
      }
    }
  }, [isOpen, opportunity])

  const loadInitialData = async () => {
    try {
      const [customersRes, pipelinesRes, usersRes] = await Promise.all([
        supabase.from('customers').select('id, nome_razao, tipo_pessoa, telefone, celular, whatsapp').order('nome_razao'),
        supabase.from('crm_pipelines').select('*').eq('is_ativo', true).order('ordem'),
        supabase.from('user_profiles').select('id, full_name').order('full_name')
      ])

      if (customersRes.error) {
        console.error('Erro ao carregar clientes:', customersRes.error)
        showToast('Erro ao carregar clientes', 'error')
      } else {
        setCustomers(customersRes.data || [])
      }

      if (pipelinesRes.data) {
        setPipelines(pipelinesRes.data)
        if (pipelinesRes.data.length > 0 && !formData.pipeline_id) {
          const firstPipeline = pipelinesRes.data[0].id
          setFormData(prev => ({ ...prev, pipeline_id: firstPipeline }))
          loadStages(firstPipeline)
        }
      }
      if (usersRes.data) setUsers(usersRes.data)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      showToast('Erro ao carregar dados iniciais', 'error')
    }
  }

  const handleCustomerChange = (customerId: string) => {
    setFormData({ ...formData, customer_id: customerId })
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      const phone = customer.whatsapp || customer.celular || customer.telefone || ''
      setSelectedCustomerPhone(phone)
    } else {
      setSelectedCustomerPhone('')
    }
  }

  const openWhatsApp = async () => {
    if (!selectedCustomerPhone) {
      showToast('Cliente sem número de WhatsApp cadastrado', 'error')
      return
    }

    const cleanPhone = selectedCustomerPhone.replace(/\D/g, '')
    const message = encodeURIComponent(`Olá! Vi sua oportunidade "${formData.titulo}" e gostaria de conversar sobre isso.`)
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank')

    if (opportunity?.id) {
      try {
        await supabase.from('crm_interactions').insert({
          opportunity_id: opportunity.id,
          tipo: 'whatsapp',
          assunto: 'Mensagem via WhatsApp',
          descricao: `Mensagem enviada: "${formData.titulo}"`,
          duracao_minutos: 0,
          resultado: 'enviado',
          data_interacao: new Date().toISOString()
        })
        showToast('Interação registrada!', 'success')
      } catch (error) {
        console.error('Erro ao registrar interação:', error)
      }
    }
  }

  const handleNewCustomerSaved = async () => {
    await loadInitialData()
    setIsCustomerModalOpen(false)
    showToast('Cliente cadastrado! Selecione-o na lista', 'success')
  }

  const loadStages = async (pipelineId: string) => {
    try {
      const { data, error } = await supabase
        .from('crm_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .eq('is_closed', false)
        .order('ordem')

      if (error) throw error
      if (data) {
        setStages(data)
        if (data.length > 0 && !formData.stage_id) {
          setFormData(prev => ({ ...prev, stage_id: data[0].id }))
        }
      }
    } catch (error) {
      console.error('Erro ao carregar stages:', error)
    }
  }

  const handlePipelineChange = (pipelineId: string) => {
    setFormData(prev => ({ ...prev, pipeline_id: pipelineId, stage_id: '' }))
    loadStages(pipelineId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.titulo || !formData.customer_id || !formData.pipeline_id || !formData.stage_id) {
        showToast('Preencha todos os campos obrigatórios', 'error')
        return
      }

      const opportunityData = {
        titulo: formData.titulo,
        customer_id: formData.customer_id,
        pipeline_id: formData.pipeline_id,
        stage_id: formData.stage_id,
        owner_id: formData.owner_id || null,
        valor: parseFloat(formData.valor) || 0,
        data_fechamento_esperada: formData.data_fechamento_esperada || null,
        temperatura: formData.temperatura,
        lead_score: parseInt(formData.lead_score) || 50,
        descricao: formData.descricao,
        status: 'aberto',
        probabilidade: stages.find(s => s.id === formData.stage_id)?.probabilidade || 0
      }

      let opportunityId = opportunity?.id

      if (opportunity) {
        const { error } = await supabase
          .from('crm_opportunities')
          .update(opportunityData)
          .eq('id', opportunity.id)

        if (error) throw error
        showToast('Oportunidade atualizada com sucesso!', 'success')
      } else {
        const { data, error } = await supabase
          .from('crm_opportunities')
          .insert(opportunityData)
          .select()
          .single()

        if (error) throw error
        opportunityId = data.id
        showToast('Oportunidade criada com sucesso!', 'success')
      }

      if (formData.criar_visita && formData.data_visita && opportunityId) {
        const visitaData = {
          customer_id: formData.customer_id,
          titulo: `Visita: ${formData.titulo}`,
          descricao: formData.observacoes_visita,
          data_inicio: `${formData.data_visita}T${formData.hora_visita || '09:00'}:00`,
          data_fim: `${formData.data_visita}T${formData.hora_visita || '09:00'}:00`,
          local: formData.local_visita,
          tipo_evento: 'visita',
          status: 'pendente',
          cor: '#3B82F6'
        }

        const { error: visitaError } = await supabase
          .from('agenda_events')
          .insert(visitaData)

        if (visitaError) {
          console.error('Erro ao criar visita:', visitaError)
          showToast('Oportunidade criada, mas erro ao agendar visita', 'warning')
        } else {
          showToast('Visita agendada com sucesso!', 'success')
        }
      }

      if (formData.criar_orcamento && opportunityId) {
        const orcamentoData = {
          customer_id: formData.customer_id,
          descricao: formData.descricao_orcamento || formData.titulo,
          valor_total: parseFloat(formData.valor) || 0,
          status: 'pendente',
          validade_dias: parseInt(formData.validade_orcamento) || 30,
          observacoes: `Orçamento gerado a partir da oportunidade: ${formData.titulo}`
        }

        const { error: orcamentoError } = await supabase
          .from('service_orders')
          .insert({
            ...orcamentoData,
            customer_id: formData.customer_id,
            titulo: formData.titulo,
            status: 'cotacao',
            tipo: 'orcamento'
          })

        if (orcamentoError) {
          console.error('Erro ao criar orçamento:', orcamentoError)
          showToast('Oportunidade criada, mas erro ao gerar orçamento', 'warning')
        } else {
          showToast('Orçamento gerado com sucesso!', 'success')
        }
      }

      onSave()
      handleClose()
    } catch (error: any) {
      console.error('Erro ao salvar oportunidade:', error)
      showToast(error.message || 'Erro ao salvar oportunidade', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      titulo: '',
      customer_id: '',
      pipeline_id: '',
      stage_id: '',
      owner_id: '',
      valor: '',
      data_fechamento_esperada: '',
      temperatura: 'morno',
      lead_score: '50',
      descricao: '',
      criar_visita: false,
      data_visita: '',
      hora_visita: '',
      local_visita: '',
      observacoes_visita: '',
      criar_orcamento: false,
      descricao_orcamento: '',
      validade_orcamento: '30'
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">
              {opportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}
            </h2>
          </div>
          <button onClick={handleClose} className="text-white hover:bg-white/20 rounded-lg p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Oportunidade *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Implementação de sistema de ar condicionado"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.customer_id}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Selecione o cliente</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.nome_razao} ({customer.tipo_pessoa === 'fisica' ? 'PF' : 'PJ'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomerModalOpen(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 whitespace-nowrap"
                    title="Cadastrar novo cliente"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Cliente
                  </button>
                  {formData.customer_id && selectedCustomerPhone && (
                    <button
                      type="button"
                      onClick={openWhatsApp}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 whitespace-nowrap"
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </button>
                  )}
                </div>
                {formData.customer_id && selectedCustomerPhone && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedCustomerPhone}
                  </p>
                )}
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsável
                </label>
                <select
                  value={formData.owner_id}
                  onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o responsável</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pipeline *
                </label>
                <select
                  value={formData.pipeline_id}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione o pipeline</option>
                  {pipelines.map(pipeline => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estágio *
                </label>
                <select
                  value={formData.stage_id}
                  onChange={(e) => setFormData({ ...formData, stage_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione o estágio</option>
                  {stages.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.nome} ({stage.probabilidade}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Estimado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Prevista de Fechamento
                </label>
                <input
                  type="date"
                  value={formData.data_fechamento_esperada}
                  onChange={(e) => setFormData({ ...formData, data_fechamento_esperada: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperatura
                </label>
                <select
                  value={formData.temperatura}
                  onChange={(e) => setFormData({ ...formData, temperatura: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="frio">❄️ Frio</option>
                  <option value="morno">☀️ Morno</option>
                  <option value="quente">🔥 Quente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lead Score (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.lead_score}
                  onChange={(e) => setFormData({ ...formData, lead_score: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Detalhes sobre a oportunidade..."
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="criar_visita"
                  checked={formData.criar_visita}
                  onChange={(e) => setFormData({ ...formData, criar_visita: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="criar_visita" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendar Visita Técnica
                </label>
              </div>

              {formData.criar_visita && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data da Visita *
                    </label>
                    <input
                      type="date"
                      value={formData.data_visita}
                      onChange={(e) => setFormData({ ...formData, data_visita: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required={formData.criar_visita}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horário
                    </label>
                    <input
                      type="time"
                      value={formData.hora_visita}
                      onChange={(e) => setFormData({ ...formData, hora_visita: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Local da Visita
                    </label>
                    <input
                      type="text"
                      value={formData.local_visita}
                      onChange={(e) => setFormData({ ...formData, local_visita: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Endereço da visita"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Observações da Visita
                    </label>
                    <textarea
                      value={formData.observacoes_visita}
                      onChange={(e) => setFormData({ ...formData, observacoes_visita: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Detalhes adicionais sobre a visita..."
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="criar_orcamento"
                  checked={formData.criar_orcamento}
                  onChange={(e) => setFormData({ ...formData, criar_orcamento: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="criar_orcamento" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Gerar Orçamento/Proposta
                </label>
              </div>

              {formData.criar_orcamento && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descrição do Orçamento
                    </label>
                    <textarea
                      value={formData.descricao_orcamento}
                      onChange={(e) => setFormData({ ...formData, descricao_orcamento: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Descrição dos serviços a serem orçados..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Validade (dias)
                    </label>
                    <input
                      type="number"
                      value={formData.validade_orcamento}
                      onChange={(e) => setFormData({ ...formData, validade_orcamento: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  {opportunity ? 'Atualizar' : 'Criar'} Oportunidade
                </>
              )}
            </button>
          </div>
        </form>

        <CustomerModal
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={handleNewCustomerSaved}
        />
      </div>
    </div>
  )
}

export default CRMOpportunityModal
