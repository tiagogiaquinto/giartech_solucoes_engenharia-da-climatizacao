import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  FileText,
  Download,
  Search,
  Eye,
  Star,
  Clock,
  Tag,
  Filter
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const MobileLibrary = () => {
  const [documents, setDocuments] = useState<any[]>([])
  const [filteredDocs, setFilteredDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadDocuments()
  }, [])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, selectedCategory])

  const loadDocuments = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('digital_library')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (data) {
        setDocuments(data)

        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(data.map(d => d.category).filter(Boolean))
        ) as string[]
        setCategories(uniqueCategories)
      }
    } catch (err) {
      console.error('Error loading documents:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(d => d.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredDocs(filtered)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType?.includes('pdf')) return '📄'
    if (fileType?.includes('image')) return '🖼️'
    if (fileType?.includes('video')) return '🎥'
    if (fileType?.includes('word') || fileType?.includes('doc')) return '📝'
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return '📊'
    return '📎'
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'manual': 'bg-blue-500',
      'procedimento': 'bg-green-500',
      'treinamento': 'bg-purple-500',
      'seguranca': 'bg-red-500',
      'tecnico': 'bg-orange-500',
      'administrativo': 'bg-gray-500'
    }
    return colors[category?.toLowerCase()] || 'bg-gray-500'
  }

  const handleDownload = async (doc: any) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank')
    }
  }

  const handleView = async (doc: any) => {
    if (doc.file_url) {
      window.open(doc.file_url, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando biblioteca...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Biblioteca Digital</h1>
        <div className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-bold">
          {filteredDocs.length}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar documentos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 text-base"
        />
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            Todos
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl font-semibold text-sm transition-all capitalize ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Documents List */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
          <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchTerm ? 'Nenhum resultado' : 'Nenhum documento'}
          </h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Tente buscar por outro termo'
              : 'Não há documentos disponíveis no momento'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc: any) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-lg"
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {getFileIcon(doc.file_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {doc.category && (
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold text-white ${
                        getCategoryColor(doc.category)
                      }`}>
                        {doc.category}
                      </span>
                    )}
                    {doc.is_featured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {doc.title}
                  </h3>
                  {doc.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {doc.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Tags */}
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {doc.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                {doc.file_size && (
                  <span>
                    {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
                {doc.created_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleView(doc)}
                  className="px-4 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Visualizar
                </button>
                <button
                  onClick={() => handleDownload(doc)}
                  className="px-4 py-3 border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Baixar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Empty State for New Users */}
      {documents.length === 0 && !loading && (
        <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-8 text-center">
          <BookOpen className="w-20 h-20 text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-purple-900 mb-2">
            Biblioteca em Construção
          </h3>
          <p className="text-purple-800">
            Manuais, procedimentos e documentos técnicos serão disponibilizados em breve.
          </p>
        </div>
      )}
    </div>
  )
}

export default MobileLibrary
