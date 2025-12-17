import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, Edit, Trash2, Save, X, Eye, Copy, Mail, Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

interface MessageTemplate {
  id: string
  tipo: string
  categoria: string
  nome: string
  mensagem: string
  assunto?: string
  canal: string
  pipeline_tipo: string
  variaveis_disponiveis: string[]
  is_ativo: boolean
  ordem: number
}

const CRMMessageTemplates = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    tipo: '',
    categoria: 'primeiro_contato',
    nome: '',
    mensagem: '',
    assunto: '',
    canal: 'whatsapp',
    pipeline_tipo: 'vendas',
    is_ativo: true
  })

  useEffect(() => {
    loadTemplates()

    const templatesChannel = supabase
      .channel('crm-templates-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'crm_message_templates' },
        () => {
          loadTemplates()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(templatesChannel)
    }
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('crm_message_templates')
        .select('*')
        .order('pipeline_tipo', { ascending: true })
        .order('ordem', { ascending: true })

      if (error) throw error
      setTemplates(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar templates:', error)
      showToast('Erro ao carregar templates de mensagem', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.nome || !formData.mensagem) {
        showToast('Preencha o nome e a mensagem', 'error')
        return
      }

      const dataToSave = {
        ...formData,
        tipo: formData.tipo || `${formData.canal}_${formData.categoria}`,
        variaveis_disponiveis: getVariaveisDisponiveis(formData.canal, formData.pipeline_tipo)
      }

      if (editingTemplate) {
        const { error } = await supabase
          .from('crm_message_templates')
          .update(dataToSave)
          .eq('id', editingTemplate.id)

        if (error) throw error
        showToast('Template atualizado com sucesso!', 'success')
      } else {
        const { error } = await supabase
          .from('crm_message_templates')
          .insert([dataToSave])

        if (error) throw error
        showToast('Template criado com sucesso!', 'success')
      }

      await loadTemplates()
      handleCloseModal()
    } catch (error: any) {
      console.error('Erro ao salvar template:', error)
      showToast('Erro ao salvar template', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      const { error } = await supabase
        .from('crm_message_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
      showToast('Template excluído com sucesso!', 'success')
      await loadTemplates()
    } catch (error: any) {
      console.error('Erro ao excluir template:', error)
      showToast('Erro ao excluir template', 'error')
    }
  }

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template)
    setFormData({
      tipo: template.tipo,
      categoria: template.categoria,
      nome: template.nome,
      mensagem: template.mensagem,
      assunto: template.assunto || '',
      canal: template.canal,
      pipeline_tipo: template.pipeline_tipo,
      is_ativo: template.is_ativo
    })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTemplate(null)
    setPreviewMode(false)
    setFormData({
      tipo: '',
      categoria: 'primeiro_contato',
      nome: '',
      mensagem: '',
      assunto: '',
      canal: 'whatsapp',
      pipeline_tipo: 'vendas',
      is_ativo: true
    })
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('mensagem-textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = formData.mensagem
    const before = text.substring(0, start)
    const after = text.substring(end, text.length)

    setFormData({
      ...formData,
      mensagem: before + `{${variable}}` + after
    })

    setTimeout(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + variable.length + 2
    }, 10)
  }

  const getVariaveisDisponiveis = (canal: string, pipeline: string) => {
    const base = ['cliente_nome', 'vendedor_nome', 'data_hoje', 'hora_agora']

    if (pipeline === 'vendas') {
      return [...base, 'oportunidade_titulo', 'oportunidade_valor', 'dias_no_stage']
    } else {
      return [...base, 'dias_no_stage', 'health_score', 'proxima_acao']
    }
  }

  const getPreviewMessage = () => {
    return formData.mensagem
      .replace(/{cliente_nome}/g, 'João Silva')
      .replace(/{vendedor_nome}/g, 'Maria Santos')
      .replace(/{oportunidade_titulo}/g, 'Instalação de Ar Condicionado')
      .replace(/{oportunidade_valor}/g, 'R$ 5.000,00')
      .replace(/{dias_no_stage}/g, '5')
      .replace(/{data_hoje}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{hora_agora}/g, new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      .replace(/{health_score}/g, '85%')
      .replace(/{proxima_acao}/g, 'Ligar para agendar manutenção')
  }

  const categorias = [
    { value: 'primeiro_contato', label: 'Primeiro Contato' },
    { value: 'followup', label: 'Acompanhamento' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'proposta_enviada', label: 'Proposta Enviada' },
    { value: 'venda_ganha', label: 'Venda Ganha' },
    { value: 'pos_venda', label: 'Pós-Venda' },
    { value: 'retencao', label: 'Retenção' },
    { value: 'upsell', label: 'Upsell/Cross-sell' },
    { value: 'churn_risk', label: 'Risco de Churn' },
    { value: 'reativacao', label: 'Reativação' },
    { value: 'aniversario', label: 'Aniversário' },
    { value: 'pesquisa_satisfacao', label: 'Pesquisa de Satisfação' }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando templates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-600" />
              Mensagens Personalizáveis
            </h1>
            <p className="text-gray-600 mt-1">
              Configure mensagens automáticas para WhatsApp, Email e SMS
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Template
          </button>
        </div>
      </div>

      {/* Templates por Pipeline */}
      <div className="space-y-6">
        {/* Vendas */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            Pipeline de Vendas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.filter(t => t.pipeline_tipo === 'vendas').map(template => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {template.canal === 'whatsapp' && <MessageSquare className="w-5 h-5 text-green-600" />}
                    {template.canal === 'email' && <Mail className="w-5 h-5 text-blue-600" />}
                    {template.canal === 'sms' && <Phone className="w-5 h-5 text-purple-600" />}
                    <h3 className="font-semibold text-gray-900">{template.nome}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    template.is_ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {template.is_ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {template.mensagem}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pós-Venda */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            Pipeline de Pós-Venda
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.filter(t => t.pipeline_tipo === 'pos_venda').map(template => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {template.canal === 'whatsapp' && <MessageSquare className="w-5 h-5 text-green-600" />}
                    {template.canal === 'email' && <Mail className="w-5 h-5 text-blue-600" />}
                    {template.canal === 'sms' && <Phone className="w-5 h-5 text-purple-600" />}
                    <h3 className="font-semibold text-gray-900">{template.nome}</h3>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    template.is_ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {template.is_ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {template.mensagem}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Configurações Básicas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Template *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: WhatsApp - Primeiro Contato"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canal *
                  </label>
                  <select
                    value={formData.canal}
                    onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pipeline *
                  </label>
                  <select
                    value={formData.pipeline_tipo}
                    onChange={(e) => setFormData({ ...formData, pipeline_tipo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="vendas">Vendas</option>
                    <option value="pos_venda">Pós-Venda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categorias.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assunto (apenas para email) */}
              {formData.canal === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assunto do Email
                  </label>
                  <input
                    type="text"
                    value={formData.assunto}
                    onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Proposta Comercial - {cliente_nome}"
                  />
                </div>
              )}

              {/* Variáveis Disponíveis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Variáveis Disponíveis (Clique para Inserir)
                </label>
                <div className="flex flex-wrap gap-2">
                  {getVariaveisDisponiveis(formData.canal, formData.pipeline_tipo).map(variable => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-mono"
                    >
                      {`{${variable}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mensagem */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Mensagem *
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    {previewMode ? 'Editar' : 'Visualizar'}
                  </button>
                </div>

                {previewMode ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 min-h-[200px] whitespace-pre-wrap">
                    {getPreviewMessage()}
                  </div>
                ) : (
                  <textarea
                    id="mensagem-textarea"
                    value={formData.mensagem}
                    onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Digite sua mensagem aqui. Use as variáveis acima para personalizar."
                  />
                )}
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_ativo"
                  checked={formData.is_ativo}
                  onChange={(e) => setFormData({ ...formData, is_ativo: e.target.checked })}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_ativo" className="text-sm font-medium text-gray-700">
                  Template ativo
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar Template
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CRMMessageTemplates
