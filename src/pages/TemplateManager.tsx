import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Plus, FileEdit as Edit, Trash2, Copy, Eye, Download, Search, Filter, Star, Tag, Grid2x2 as Grid, List, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AdvancedTemplateEditor from '../components/AdvancedTemplateEditor'

interface Template {
  id: string
  name: string
  description: string
  category: string
  template_type: string
  tags: string[]
  usage_count: number
  rating: number
  is_public: boolean
  thumbnail_url?: string
  created_at: string
  content_template?: string
}

const TemplateManager = () => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showEditor, setShowEditor] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>()
  const [showPreview, setShowPreview] = useState<Template | null>(null)

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'operational', label: 'Operacional' },
    { value: 'commercial', label: 'Comercial' },
    { value: 'technical', label: 'Técnico' },
    { value: 'financial', label: 'Financeiro' },
    { value: 'legal', label: 'Jurídico' }
  ]

  const types = [
    { value: 'all', label: 'Todos os tipos' },
    { value: 'service_order', label: 'Ordem de Serviço' },
    { value: 'proposal', label: 'Proposta' },
    { value: 'contract', label: 'Contrato' },
    { value: 'report', label: 'Relatório' },
    { value: 'certificate', label: 'Certificado' },
    { value: 'budget', label: 'Orçamento' }
  ]

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [searchTerm, selectedCategory, selectedType, templates])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
      setFilteredTemplates(data || [])
    } catch (error) {
      console.error('Error loading templates:', error)
      alert('Erro ao carregar templates')
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = [...templates]

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.template_type === selectedType)
    }

    setFilteredTemplates(filtered)
  }

  const handleCreate = () => {
    setSelectedTemplate(undefined)
    setShowEditor(true)
  }

  const handleEdit = (templateId: string) => {
    setSelectedTemplate(templateId)
    setShowEditor(true)
  }

  const handleDuplicate = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('document_templates')
        .insert([{
          name: `${template.name} (Cópia)`,
          description: template.description,
          category: template.category,
          template_type: template.template_type,
          content_template: template.content_template,
          tags: template.tags,
          is_public: false
        }])

      if (error) throw error
      alert('Template duplicado com sucesso!')
      loadTemplates()
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Erro ao duplicar template')
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      const { error } = await supabase
        .from('document_templates')
        .update({ is_active: false })
        .eq('id', templateId)

      if (error) throw error
      alert('Template excluído com sucesso!')
      loadTemplates()
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Erro ao excluir template')
    }
  }

  const handleUseTemplate = async (template: Template) => {
    alert('Template selecionado! Redirecionando para criação de documento...')
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      operational: 'bg-blue-100 text-blue-700',
      commercial: 'bg-green-100 text-green-700',
      technical: 'bg-purple-100 text-purple-700',
      financial: 'bg-yellow-100 text-yellow-700',
      legal: 'bg-red-100 text-red-700'
    }
    return colors[category] || 'bg-gray-100 text-gray-700'
  }

  if (showEditor) {
    return (
      <AdvancedTemplateEditor
        templateId={selectedTemplate}
        onSave={() => {
          setShowEditor(false)
          loadTemplates()
        }}
        onCancel={() => setShowEditor(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-600" />
              Templates HVAC Profissionais
            </h1>
            <p className="text-gray-600 mt-2">
              Modelos específicos para refrigeração e climatização - 100% editáveis
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Template</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar templates..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {types.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
              <span className="ml-auto text-sm text-gray-600">
                {filteredTemplates.length} templates
              </span>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhum template encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            Crie seu primeiro template ou ajuste os filtros de busca
          </p>
          <button
            onClick={handleCreate}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Criar Primeiro Template</span>
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredTemplates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="h-40 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                {template.thumbnail_url ? (
                  <img src={template.thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="w-16 h-16 text-white opacity-80" />
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description || 'Sem descrição'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}>
                    {template.category}
                  </span>
                  {template.tags.slice(0, 2).map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {template.usage_count || 0}
                    </span>
                    {template.rating > 0 && (
                      <span className="flex items-center">
                        <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                        {template.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {template.is_public && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Público
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    Usar
                  </button>
                  <button
                    onClick={() => setShowPreview(template)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(template.id)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Duplicar"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-2xl font-bold">{showPreview.name}</h2>
              <button
                onClick={() => setShowPreview(null)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
              <p className="text-gray-600 mb-6 text-lg">{showPreview.description}</p>
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-inner">
                <div
                  dangerouslySetInnerHTML={{ __html: showPreview.content_template || '' }}
                  className="prose max-w-none"
                />
              </div>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowPreview(null)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setShowPreview(null)
                  handleEdit(showPreview.id)
                }}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Editar Template</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default TemplateManager
