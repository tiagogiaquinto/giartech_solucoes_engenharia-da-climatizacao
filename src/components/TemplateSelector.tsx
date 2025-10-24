import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Star, Clock, X, Copy, Trash2, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Template {
  id: string
  name: string
  description?: string
  category: string
  usage_count: number
  template_data: any
  is_public: boolean
  created_at: string
}

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (templateData: any) => void
}

export const TemplateSelector = ({ isOpen, onClose, onSelect }: TemplateSelectorProps) => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('service_order_templates')
        .select('*')
        .order('usage_count', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (err) {
      console.error('Erro ao carregar templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTemplate = async (template: Template) => {
    try {
      await supabase.rpc('increment_template_usage', {
        template_id: template.id
      })

      onSelect(template.template_data)
      onClose()
    } catch (err) {
      console.error('Erro ao usar template:', err)
      onSelect(template.template_data)
      onClose()
    }
  }

  const categories = [...new Set(templates.map(t => t.category))]

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      search === '' ||
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.description?.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Templates de OS</h2>
              <p className="text-sm text-gray-600 mt-1">
                Escolha um template para começar rapidamente
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 border-b bg-gray-50">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar template..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Todos
                </button>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Nenhum template encontrado</p>
                <p className="text-gray-500 text-sm mt-2">
                  Tente buscar com outros termos ou categorias
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template, index) => (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectTemplate(template)}
                    className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-lg p-4 text-left transition-all hover:shadow-lg group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                          <FileText className="w-5 h-5 text-blue-600 group-hover:text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                            {template.name}
                          </h3>
                          <span className="text-xs text-gray-500 capitalize">
                            {template.category.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {template.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          {template.usage_count} usos
                        </span>
                        {template.is_public && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                            Público
                          </span>
                        )}
                      </div>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>

                    {template.template_data.serviceItems && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <span className="text-xs text-gray-600">
                          {template.template_data.serviceItems.length} serviços inclusos
                        </span>
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
