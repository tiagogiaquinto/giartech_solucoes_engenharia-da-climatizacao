import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Edit, Trash2, Save, X, Check, AlertCircle, Star, Upload, Image, Eye, Copy, ArrowUp, ArrowDown, Palette } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface DocumentTemplate {
  id: string
  name: string
  template_type: 'contract' | 'service_order' | 'proposal' | 'budget' | 'receipt' | 'invoice'
  is_default: boolean
  contract_text?: string
  contract_clauses?: string
  warranty_terms?: string
  payment_conditions?: string
  bank_details_template?: string
  logo_url?: string
  header_text?: string
  footer_text?: string
  layout_config: LayoutConfig
  field_order: string[]
  show_fields: Record<string, boolean>
  custom_styles: CustomStyles
  active: boolean
  created_at: string
  updated_at: string
}

interface LayoutConfig {
  margins?: { top: number; bottom: number; left: number; right: number }
  fontSize?: number
  lineHeight?: number
}

interface CustomStyles {
  primaryColor?: string
  secondaryColor?: string
  headerBg?: string
  borderColor?: string
}

const templateTypeLabels = {
  contract: 'Contrato',
  service_order: 'Ordem de Serviço',
  proposal: 'Proposta',
  budget: 'Orçamento',
  receipt: 'Recibo',
  invoice: 'Nota Fiscal'
}

const serviceOrderFields = [
  { id: 'order_number', label: 'Número da OS' },
  { id: 'customer', label: 'Cliente' },
  { id: 'date', label: 'Data' },
  { id: 'services', label: 'Serviços' },
  { id: 'materials', label: 'Materiais' },
  { id: 'team', label: 'Equipe' },
  { id: 'costs', label: 'Custos' },
  { id: 'total', label: 'Total' },
  { id: 'notes', label: 'Observações' },
  { id: 'signature', label: 'Assinatura' }
]

const DocumentTemplates = () => {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<DocumentTemplate['template_type']>('service_order')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<DocumentTemplate>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [selectedType])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('os_templates')
        .select('*')
        .eq('template_type', selectedType)
        .eq('active', true)
        .order('is_default', { ascending: false })
        .order('name')

      if (error) throw error

      setTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      alert('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setEditingId('new')
    setFormData({
      name: '',
      template_type: selectedType,
      is_default: false,
      logo_url: '',
      header_text: 'ORDEM DE SERVIÇO',
      footer_text: 'Obrigado pela preferência!',
      layout_config: {
        margins: { top: 20, bottom: 20, left: 20, right: 20 },
        fontSize: 10,
        lineHeight: 1.2
      },
      field_order: ['order_number', 'customer', 'date', 'services', 'materials', 'team', 'costs', 'total', 'signature'],
      show_fields: {
        order_number: true,
        customer: true,
        date: true,
        services: true,
        materials: true,
        team: true,
        costs: true,
        total: true,
        notes: true,
        signature: true
      },
      custom_styles: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        headerBg: '#f8fafc',
        borderColor: '#e2e8f0'
      },
      active: true
    })
  }

  const handleEdit = (template: DocumentTemplate) => {
    setEditingId(template.id)
    setFormData(template)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      if (!formData.name || !formData.template_type) {
        alert('Preencha o nome do template')
        return
      }

      if (editingId === 'new') {
        const { error } = await supabase
          .from('os_templates')
          .insert([formData])

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('os_templates')
          .update(formData)
          .eq('id', editingId)

        if (error) throw error
      }

      await loadTemplates()
      setEditingId(null)
      setFormData({})
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Erro ao salvar template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este template?')) return

    try {
      const { error} = await supabase
        .from('os_templates')
        .update({ active: false })
        .eq('id', id)

      if (error) throw error

      await loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Erro ao excluir template')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const { error } = await supabase
        .from('os_templates')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error

      await loadTemplates()
    } catch (error) {
      console.error('Error setting default:', error)
      alert('Erro ao definir como padrão')
    }
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione uma imagem')
        return
      }

      // Validar tamanho (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB')
        return
      }

      // Converter para base64
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        setFormData(prev => ({ ...prev, logo_url: base64 }))
        setUploadingLogo(false)
      }
      reader.onerror = () => {
        alert('Erro ao carregar imagem')
        setUploadingLogo(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Erro ao fazer upload da logo')
      setUploadingLogo(false)
    }
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...(formData.field_order || [])]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newOrder.length) return

    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]]
    setFormData(prev => ({ ...prev, field_order: newOrder }))
  }

  const toggleFieldVisibility = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      show_fields: {
        ...prev.show_fields,
        [fieldId]: !prev.show_fields?.[fieldId]
      }
    }))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Templates de Documentos</h1>
        <p className="text-gray-600">Gerencie e personalize templates de documentos</p>
      </div>

      {/* Filtro por tipo */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Tipo:</span>
          {Object.entries(templateTypeLabels).map(([type, label]) => (
            <button
              key={type}
              onClick={() => setSelectedType(type as DocumentTemplate['template_type'])}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de templates */}
      {!editingId && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">
              Templates de {templateTypeLabels[selectedType]}
            </h2>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Template
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              Nenhum template encontrado
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {templates.map(template => (
                <div key={template.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        {template.is_default && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                            Padrão
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Atualizado em {new Date(template.updated_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!template.is_default && (
                        <button
                          onClick={() => handleSetDefault(template.id)}
                          className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Definir como padrão"
                        >
                          <Star className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      {!template.is_default && (
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Editor de template */}
      <AnimatePresence>
        {editingId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-lg shadow-sm"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">
                {editingId === 'new' ? 'Novo Template' : 'Editar Template'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  {previewMode ? 'Editor' : 'Visualizar'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setFormData({})
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Nome do Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Template
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Template Profissional OS"
                />
              </div>

              {/* Upload de Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo/Imagem
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    {uploadingLogo ? 'Carregando...' : 'Fazer Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      className="hidden"
                      disabled={uploadingLogo}
                    />
                  </label>
                  {formData.logo_url && (
                    <div className="flex items-center gap-2">
                      <img
                        src={formData.logo_url}
                        alt="Logo"
                        className="h-12 w-auto object-contain border border-gray-200 rounded"
                      />
                      <button
                        onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 2MB
                </p>
              </div>

              {/* Texto de Cabeçalho */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto do Cabeçalho
                </label>
                <input
                  type="text"
                  value={formData.header_text || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, header_text: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: ORDEM DE SERVIÇO"
                />
              </div>

              {/* Texto de Rodapé */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto do Rodapé
                </label>
                <input
                  type="text"
                  value={formData.footer_text || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer_text: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Obrigado pela preferência!"
                />
              </div>

              {/* Ordem dos Campos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordem e Visibilidade dos Campos
                </label>
                <div className="border border-gray-200 rounded-lg divide-y">
                  {(formData.field_order || []).map((fieldId, index) => {
                    const field = serviceOrderFields.find(f => f.id === fieldId)
                    if (!field) return null

                    const isVisible = formData.show_fields?.[fieldId] !== false

                    return (
                      <div
                        key={fieldId}
                        className={`p-3 flex items-center justify-between ${
                          !isVisible ? 'bg-gray-50 opacity-60' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-500">
                            {index + 1}
                          </span>
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleFieldVisibility(fieldId)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900">{field.label}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveField(index, 'up')}
                            disabled={index === 0}
                            className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-600"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveField(index, 'down')}
                            disabled={index === (formData.field_order || []).length - 1}
                            className="p-1 text-gray-600 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-gray-600"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Cores Personalizadas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" />
                  Cores Personalizadas
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Cor Primária</label>
                    <input
                      type="color"
                      value={formData.custom_styles?.primaryColor || '#2563eb'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        custom_styles: {
                          ...prev.custom_styles,
                          primaryColor: e.target.value
                        }
                      }))}
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Cor Secundária</label>
                    <input
                      type="color"
                      value={formData.custom_styles?.secondaryColor || '#64748b'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        custom_styles: {
                          ...prev.custom_styles,
                          secondaryColor: e.target.value
                        }
                      }))}
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Cor do Cabeçalho</label>
                    <input
                      type="color"
                      value={formData.custom_styles?.headerBg || '#f8fafc'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        custom_styles: {
                          ...prev.custom_styles,
                          headerBg: e.target.value
                        }
                      }))}
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Cor das Bordas</label>
                    <input
                      type="color"
                      value={formData.custom_styles?.borderColor || '#e2e8f0'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        custom_styles: {
                          ...prev.custom_styles,
                          borderColor: e.target.value
                        }
                      }))}
                      className="w-full h-10 rounded border border-gray-300"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewMode && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="max-w-2xl mx-auto bg-white shadow-lg">
                    {/* Header */}
                    <div
                      className="p-6 text-center border-b-2"
                      style={{
                        backgroundColor: formData.custom_styles?.headerBg,
                        borderColor: formData.custom_styles?.borderColor
                      }}
                    >
                      {formData.logo_url && (
                        <img
                          src={formData.logo_url}
                          alt="Logo"
                          className="h-16 w-auto mx-auto mb-4 object-contain"
                        />
                      )}
                      <h1
                        className="text-2xl font-bold"
                        style={{ color: formData.custom_styles?.primaryColor }}
                      >
                        {formData.header_text || 'ORDEM DE SERVIÇO'}
                      </h1>
                    </div>

                    {/* Content Preview */}
                    <div className="p-6 space-y-4">
                      {(formData.field_order || []).map(fieldId => {
                        const field = serviceOrderFields.find(f => f.id === fieldId)
                        const isVisible = formData.show_fields?.[fieldId] !== false

                        if (!field || !isVisible) return null

                        return (
                          <div
                            key={fieldId}
                            className="flex items-center gap-2 py-2 border-b"
                            style={{ borderColor: formData.custom_styles?.borderColor }}
                          >
                            <span
                              className="font-medium"
                              style={{ color: formData.custom_styles?.primaryColor }}
                            >
                              {field.label}:
                            </span>
                            <span className="text-gray-600">[Conteúdo]</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Footer */}
                    <div
                      className="p-4 text-center text-sm border-t-2"
                      style={{
                        borderColor: formData.custom_styles?.borderColor,
                        color: formData.custom_styles?.secondaryColor
                      }}
                    >
                      {formData.footer_text || 'Obrigado pela preferência!'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DocumentTemplates
