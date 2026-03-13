import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, X, Search, Eye, Download, Printer } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { fillTemplate, TemplateData } from '../services/templateFillService'

interface Template {
  id: string
  name: string
  description: string
  category: string
  template_type: string
  content_template: string
  thumbnail_url?: string
}

interface TemplateSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  templateType?: string
  data: TemplateData
  onSelect?: (filledHtml: string, template: Template) => void
  title?: string
}

const TemplateSelectorModal = ({
  isOpen,
  onClose,
  templateType,
  data,
  onSelect,
  title = 'Selecionar Template'
}: TemplateSelectorModalProps) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, templateType])

  useEffect(() => {
    filterTemplates()
  }, [searchTerm, templates])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })

      if (templateType) {
        query = query.eq('template_type', templateType)
      }

      const { data: templatesData, error } = await query

      if (error) throw error
      setTemplates(templatesData || [])
      setFilteredTemplates(templatesData || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTemplates = () => {
    if (!searchTerm) {
      setFilteredTemplates(templates)
      return
    }

    const filtered = templates.filter(t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredTemplates(filtered)
  }

  const handlePreview = (template: Template) => {
    setSelectedTemplate(template)
    const filled = fillTemplate(template.content_template, data)
    setPreviewHtml(filled)
    setShowPreview(true)
  }

  const handleSelectTemplate = async (template: Template) => {
    try {
      const filled = fillTemplate(template.content_template, data)

      await supabase
        .from('document_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', template.id)

      if (onSelect) {
        onSelect(filled, template)
      }

      onClose()
    } catch (error) {
      console.error('Error selecting template:', error)
      alert('Erro ao selecionar template')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${selectedTemplate?.name || 'Documento'}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            ${previewHtml}
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleDownloadPDF = () => {
    alert('Funcionalidade de download PDF será implementada em breve!')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {!showPreview ? (
            <>
              <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">{title}</h2>
                      <p className="text-blue-100 text-sm">
                        Escolha um template profissional para seu documento
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 border-b bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar templates..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Nenhum template encontrado
                    </h3>
                    <p className="text-gray-500">
                      Ajuste sua busca ou crie um novo template
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template) => (
                      <motion.div
                        key={template.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 overflow-hidden transition-all shadow-sm hover:shadow-lg cursor-pointer"
                      >
                        <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {template.thumbnail_url ? (
                            <img
                              src={template.thumbnail_url}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <FileText className="w-12 h-12 text-white opacity-80" />
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {template.description || 'Sem descrição'}
                          </p>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handlePreview(template)}
                              className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Visualizar</span>
                            </button>
                            <button
                              onClick={() => handleSelectTemplate(template)}
                              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                            >
                              Usar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTemplate?.name}</h2>
                    <p className="text-blue-100 text-sm">
                      Preview com dados preenchidos automaticamente
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrint}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Imprimir"
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleDownloadPDF}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setShowPreview(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] bg-gray-50">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-medium"
                >
                  Voltar
                </button>
                <button
                  onClick={() => selectedTemplate && handleSelectTemplate(selectedTemplate)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Usar Este Template
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default TemplateSelectorModal
