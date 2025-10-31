import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Search, Filter, Download, Eye, Edit, Trash2, Clock, CheckCircle, FileCheck, Archive, X, Save, Tag, Users, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateDocumentPDF } from '../utils/generateDocumentPDF'

interface Document {
  id: string
  title: string
  description?: string
  content: string
  department: string
  category?: string
  template_type?: string
  status: string
  version: number
  created_by?: string
  approved_by?: string
  approved_at?: string
  tags: string[]
  metadata: any
  created_at: string
  updated_at: string
}

interface Template {
  id: string
  name: string
  description?: string
  department: string
  category?: string
  content_template: string
  fields: any[]
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    department: 'Operacional',
    category: '',
    status: 'draft',
    tags: [] as string[],
    template_type: ''
  })

  const [tagInput, setTagInput] = useState('')

  const departments = [
    'Operacional',
    'Financeiro',
    'Comercial',
    'RH',
    'TI',
    'Geral'
  ]

  const statusOptions = [
    { value: 'draft', label: 'Rascunho', color: 'gray', icon: Clock },
    { value: 'review', label: 'Em Revisão', color: 'yellow', icon: Eye },
    { value: 'approved', label: 'Aprovado', color: 'green', icon: CheckCircle },
    { value: 'archived', label: 'Arquivado', color: 'blue', icon: Archive }
  ]

  useEffect(() => {
    loadDocuments()
    loadTemplates()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const handleCreateFromTemplate = (template: Template) => {
    setFormData({
      ...formData,
      content: template.content_template,
      department: template.department,
      category: template.category || '',
      template_type: template.name
    })
    setShowTemplateSelector(false)
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      if (editingDocument) {
        const { error } = await supabase
          .from('documents')
          .update({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            department: formData.department,
            category: formData.category,
            status: formData.status,
            tags: formData.tags,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingDocument.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('documents')
          .insert({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            department: formData.department,
            category: formData.category,
            status: formData.status,
            tags: formData.tags,
            template_type: formData.template_type,
            version: 1
          })

        if (error) throw error
      }

      await loadDocuments()
      handleCloseModal()
    } catch (error) {
      console.error('Erro ao salvar documento:', error)
      alert('Erro ao salvar documento')
    }
  }

  const handleEdit = (doc: Document) => {
    setEditingDocument(doc)
    setFormData({
      title: doc.title,
      description: doc.description || '',
      content: doc.content,
      department: doc.department,
      category: doc.category || '',
      status: doc.status,
      tags: doc.tags || [],
      template_type: doc.template_type || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadDocuments()
    } catch (error) {
      console.error('Erro ao excluir documento:', error)
      alert('Erro ao excluir documento')
    }
  }

  const handleDownloadPDF = (doc: Document) => {
    const pdf = generateDocumentPDF({
      title: doc.title,
      description: doc.description,
      content: doc.content,
      department: doc.department,
      category: doc.category,
      version: doc.version,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
      status: doc.status,
      tags: doc.tags
    })

    pdf.save(`${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_v${doc.version}.pdf`)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingDocument(null)
    setFormData({
      title: '',
      description: '',
      content: '',
      department: 'Operacional',
      category: '',
      status: 'draft',
      tags: [],
      template_type: ''
    })
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesDepartment = selectedDepartment === 'all' || doc.department === selectedDepartment
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    return option ? option.icon : Clock
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      archived: 'bg-blue-100 text-blue-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Documentação</h1>
            <p className="text-indigo-100">
              Gerencie documentos departamentais e gere PDFs
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2"
            >
              <FileCheck className="h-5 w-5" />
              Usar Template
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-400 transition-colors flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Novo Documento
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar documentos, tags..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os Departamentos</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos os Status</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Carregando documentos...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Nenhum documento encontrado</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Criar primeiro documento
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => {
              const StatusIcon = getStatusIcon(doc.status)
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{doc.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(doc.status)}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusOptions.find(opt => opt.value === doc.status)?.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {doc.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCheck className="h-3 w-3" />
                      v{doc.version}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(doc.updated_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {doc.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewingDocument(doc)}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleEdit(doc)}
                      className="flex-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(doc)}
                      className="px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showTemplateSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div>
                  <h2 className="text-2xl font-bold">Selecionar Template</h2>
                  <p className="text-indigo-100 text-sm mt-1">Escolha um template para começar</p>
                </div>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleCreateFromTemplate(template)}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-100 rounded">{template.department}</span>
                        {template.category && (
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">{template.category}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingDocument ? 'Editar Documento' : 'Novo Documento'}
                  </h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    {editingDocument ? 'Atualize as informações do documento' : 'Preencha as informações do documento'}
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Título do documento"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      rows={2}
                      placeholder="Breve descrição do documento"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento *
                      </label>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Relatório, Procedimento, etc"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Adicionar tag..."
                      />
                      <button
                        onClick={handleAddTag}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <Tag className="h-5 w-5" />
                      </button>
                    </div>
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map(tag => (
                          <span
                            key={tag}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-2"
                          >
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-indigo-900"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conteúdo * (suporta Markdown)
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                      rows={15}
                      placeholder="# Título do Documento&#10;&#10;## Seção 1&#10;&#10;Conteúdo da seção...&#10;&#10;- Item 1&#10;- Item 2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Dicas: Use # para títulos, ## para subtítulos, - para listas
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formData.title || !formData.content}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-5 w-5" />
                  {editingDocument ? 'Atualizar Documento' : 'Criar Documento'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingDocument && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <div>
                  <h2 className="text-2xl font-bold">{viewingDocument.title}</h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    {viewingDocument.department} • Versão {viewingDocument.version}
                  </p>
                </div>
                <button
                  onClick={() => setViewingDocument(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {viewingDocument.description && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2">Descrição</h3>
                    <p className="text-gray-600">{viewingDocument.description}</p>
                  </div>
                )}

                <div className="prose max-w-none">
                  {viewingDocument.content.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) {
                      return <h1 key={idx} className="text-3xl font-bold mt-6 mb-4">{line.substring(2)}</h1>
                    } else if (line.startsWith('## ')) {
                      return <h2 key={idx} className="text-2xl font-bold mt-5 mb-3">{line.substring(3)}</h2>
                    } else if (line.startsWith('### ')) {
                      return <h3 key={idx} className="text-xl font-bold mt-4 mb-2">{line.substring(4)}</h3>
                    } else if (line.startsWith('- ')) {
                      return <li key={idx} className="ml-6">{line.substring(2)}</li>
                    } else if (line.trim() === '') {
                      return <br key={idx} />
                    } else {
                      return <p key={idx} className="mb-2">{line}</p>
                    }
                  })}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3">
                <button
                  onClick={() => handleDownloadPDF(viewingDocument)}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Baixar PDF
                </button>
                <button
                  onClick={() => {
                    setViewingDocument(null)
                    handleEdit(viewingDocument)
                  }}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="h-5 w-5" />
                  Editar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Documents
