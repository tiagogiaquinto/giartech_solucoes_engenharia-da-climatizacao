import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Plus,
  X,
  Save,
  Trash2,
  Upload,
  Calendar,
  Clock,
  Book,
  File,
  FileCheck,
  Folder,
  Tag,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  Info,
  AlertTriangle,
  User,
  Shield
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { supabase } from '../lib/supabase'

interface Document {
  id: string
  title: string
  description: string
  category: 'manual' | 'corporate' | 'educational'
  subcategory: string
  fileUrl: string
  file_url?: string
  fileSize: string
  file_size?: number
  fileType: string
  file_type?: string
  uploadDate: string
  created_at?: string
  lastViewed?: string
  author?: string
  tags: string[]
  isDownloaded: boolean
  isFavorite: boolean
  thumbnailUrl?: string
  category_name?: string
  virus_scan_status?: string
  is_verified?: boolean
  view_count?: number
  download_count?: number
}

const DigitalLibrary = () => {
  const { isPremium, isAdmin } = useUser()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [realDbDocs, setRealDbDocs] = useState<any[]>([])

  // Carregar documentos do banco de dados REAL
  useEffect(() => {
    loadRealDocuments()
  }, [])

  const loadRealDocuments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('digital_library')
        .select(`
          *,
          category:library_categories(name, icon)
        `)
        .eq('is_public', true)
        .eq('virus_scan_status', 'clean')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        setRealDbDocs(data)
        // Converter para formato antigo + adicionar dados reais
        const converted = data.map(d => ({
          id: d.id,
          title: d.title,
          description: d.description || '',
          category: 'manual' as const,
          subcategory: d.category?.name || 'Geral',
          fileUrl: d.file_url,
          file_url: d.file_url,
          fileSize: formatFileSize(d.file_size),
          file_size: d.file_size,
          fileType: getFileExtension(d.file_type),
          file_type: d.file_type,
          uploadDate: d.created_at,
          created_at: d.created_at,
          tags: d.tags || [],
          isDownloaded: false,
          isFavorite: false,
          category_name: d.category?.name,
          virus_scan_status: d.virus_scan_status,
          is_verified: d.is_verified,
          view_count: d.view_count || 0,
          download_count: d.download_count || 0
        }))
        setDocuments(converted)
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const getFileExtension = (type: string) => {
    if (type.includes('pdf')) return 'PDF'
    if (type.includes('word')) return 'DOCX'
    if (type.includes('excel') || type.includes('spreadsheet')) return 'XLSX'
    if (type.includes('powerpoint') || type.includes('presentation')) return 'PPTX'
    if (type.includes('image')) return 'IMG'
    return 'FILE'
  }

  // Adicionar documentos demo se não houver documentos reais
  useEffect(() => {
    if (!loading && documents.length === 0) {
      setDocuments([
        {
          id: '1',
          title: 'Manual de Instalação - Split 12.000 BTUs',
          description: 'Guia completo para instalação de ar condicionado split 12.000 BTUs',
          category: 'manual',
          subcategory: 'Instalação',
          fileUrl: '/documents/manual_instalacao_split.pdf',
          file_url: '/documents/manual_instalacao_split.pdf',
          fileSize: '2.5 MB',
          file_size: 2621440,
          fileType: 'PDF',
          file_type: 'application/pdf',
          uploadDate: '2024-01-10',
          created_at: '2024-01-10',
          lastViewed: '2024-01-15',
          author: 'Equipe Técnica',
          tags: ['ar condicionado', 'split', 'instalação', '12000 BTUs'],
          isDownloaded: true,
          isFavorite: true,
          thumbnailUrl: 'https://images.pexels.com/photos/4489734/pexels-photo-4489734.jpeg?auto=compress&cs=tinysrgb&w=150'
        },
        {
          id: '2',
          title: 'Manual Técnico - Dual Inverter',
          description: 'Especificações técnicas e procedimentos de manutenção para ar condicionado Dual Inverter',
          category: 'manual',
          subcategory: 'Manutenção',
          fileUrl: '/documents/manual_tecnico_dual_inverter.pdf',
          file_url: '/documents/manual_tecnico_dual_inverter.pdf',
          fileSize: '3.1 MB',
          file_size: 3250585,
          fileType: 'PDF',
          file_type: 'application/pdf',
          uploadDate: '2024-01-08',
          created_at: '2024-01-08',
          author: 'Departamento Técnico',
          tags: ['ar condicionado', 'dual inverter', 'manutenção'],
          isDownloaded: false,
          isFavorite: false
        },
        {
          id: '3',
          title: 'Política de Segurança da Informação',
          description: 'Documento corporativo com diretrizes de segurança da informação',
          category: 'corporate',
          subcategory: 'Políticas',
          fileUrl: '/documents/politica_seguranca_informacao.pdf',
          file_url: '/documents/politica_seguranca_informacao.pdf',
          fileSize: '1.2 MB',
          file_size: 1258291,
          fileType: 'PDF',
          file_type: 'application/pdf',
          uploadDate: '2023-12-15',
          created_at: '2023-12-15',
          lastViewed: '2024-01-05',
          author: 'Departamento de TI',
          tags: ['segurança', 'política', 'corporativo'],
          isDownloaded: true,
          isFavorite: false
        },
        {
          id: '4',
          title: 'Apostila de Treinamento - Refrigeração Básica',
          description: 'Material didático para treinamento de novos técnicos',
          category: 'educational',
          subcategory: 'Treinamento',
          fileUrl: '/documents/apostila_refrigeracao_basica.pdf',
          file_url: '/documents/apostila_refrigeracao_basica.pdf',
          fileSize: '5.8 MB',
          file_size: 6082560,
          fileType: 'PDF',
          file_type: 'application/pdf',
          uploadDate: '2023-11-20',
          created_at: '2023-11-20',
          author: 'Departamento de Treinamento',
          tags: ['refrigeração', 'treinamento', 'básico'],
          isDownloaded: false,
          isFavorite: true
        }
      ])
    }
  }, [loading, documents.length])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<{start?: string, end?: string}>({})
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState<Document | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'size'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  
  const [newDocument, setNewDocument] = useState({
    title: '',
    description: '',
    category: 'manual',
    subcategory: '',
    tags: '',
    file: null as File | null
  })

  // Get unique subcategories based on selected category
  const getSubcategories = () => {
    if (selectedCategory === 'all') {
      return ['all', ...new Set(documents.map(doc => doc.subcategory))]
    }
    return ['all', ...new Set(documents
      .filter(doc => selectedCategory === 'all' || doc.category === selectedCategory)
      .map(doc => doc.subcategory))]
  }

  // Get all unique tags
  const getAllTags = () => {
    const allTags = documents.flatMap(doc => doc.tags)
    return [...new Set(allTags)]
  }

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    // Search term filter
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    
    // Subcategory filter
    const matchesSubcategory = selectedSubcategory === 'all' || doc.subcategory === selectedSubcategory
    
    // Tags filter
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => doc.tags.includes(tag))
    
    // Date range filter
    const matchesDateRange = 
      (!dateRange.start || new Date(doc.uploadDate) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(doc.uploadDate) <= new Date(dateRange.end))
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesTags && matchesDateRange
  })

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'date') {
      return sortOrder === 'asc' 
        ? new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()
        : new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    } else if (sortBy === 'title') {
      return sortOrder === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title)
    } else if (sortBy === 'size') {
      const sizeA = parseFloat(a.fileSize.split(' ')[0])
      const sizeB = parseFloat(b.fileSize.split(' ')[0])
      return sortOrder === 'asc' ? sizeA - sizeB : sizeB - sizeA
    }
    return 0
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewDocument({...newDocument, file})
    }
  }

  const handleUpload = () => {
    if (!newDocument.title || !newDocument.category || !newDocument.file) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }
    
    // Simulate upload
    setIsUploading(true)
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            completeUpload()
          }, 500)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const completeUpload = () => {
    if (!newDocument.file) {
      alert('Por favor, selecione um arquivo')
      return
    }

    // Create new document
    const newDoc: Document = {
      id: Date.now().toString(),
      title: newDocument.title,
      description: newDocument.description,
      category: newDocument.category as 'manual' | 'corporate' | 'educational',
      subcategory: newDocument.subcategory || 'Geral',
      fileUrl: URL.createObjectURL(newDocument.file),
      fileSize: `${((newDocument.file.size || 0) / (1024 * 1024)).toFixed(1)} MB`,
      fileType: newDocument.file.type.split('/')[1]?.toUpperCase() || 'PDF',
      uploadDate: new Date().toISOString().split('T')[0],
      tags: newDocument.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      isDownloaded: false,
      isFavorite: false
    }
    
    setDocuments([newDoc, ...documents])
    setNewDocument({
      title: '',
      description: '',
      category: 'manual',
      subcategory: '',
      tags: '',
      file: null
    })
    setIsUploading(false)
    setUploadProgress(0)
    setShowUploadModal(false)
    
    // Show success message
    alert('Documento enviado com sucesso!')
  }

  const handleDownload = (doc: Document) => {
    // Simulate download
    console.log(`Downloading ${doc.title}...`)
    
    // In a real app, you would trigger the download here
    // For demo purposes, we'll just update the document state
    setDocuments(documents.map(d => 
      d.id === doc.id ? {...d, isDownloaded: true, lastViewed: new Date().toISOString().split('T')[0]} : d
    ))
    
    // Show success message
    alert(`Download de "${doc.title}" iniciado!`)
  }

  const handleToggleFavorite = (id: string) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? {...doc, isFavorite: !doc.isFavorite} : doc
    ))
  }

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
    setShowDeleteConfirm(null)
  }

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'manual': return FileText
      case 'corporate': return File
      case 'educational': return Book
      default: return FileText
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'manual': return 'from-blue-500 to-cyan-500'
      case 'corporate': return 'from-purple-500 to-pink-500'
      case 'educational': return 'from-green-500 to-emerald-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'manual': return 'Manual Técnico'
      case 'corporate': return 'Documento Corporativo'
      case 'educational': return 'Material Didático'
      default: return category
    }
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-100"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              Biblioteca Digital
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Acesse manuais, documentos corporativos e materiais didáticos
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all text-sm"
            >
              <Upload className="h-4 w-4" />
              <span>Enviar Documento</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar documentos por título, descrição ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Basic Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value)
                  setSelectedSubcategory('all') // Reset subcategory when category changes
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todas as Categorias</option>
                <option value="manual">Manuais Técnicos</option>
                <option value="corporate">Documentos Corporativos</option>
                <option value="educational">Material Didático</option>
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subcategoria
              </label>
              <select
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {getSubcategories().map(subcategory => (
                  <option key={subcategory} value={subcategory}>
                    {subcategory === 'all' ? 'Todas as Subcategorias' : subcategory}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ordenar por
              </label>
              <div className="flex">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'size')}
                  className="flex-1 px-3 py-2 border-y border-l border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Data</option>
                  <option value="title">Título</option>
                  <option value="size">Tamanho</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-r-lg bg-gray-50 hover:bg-gray-100"
                >
                  {sortOrder === 'asc' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Advanced Filters Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros avançados</span>
              {showAdvancedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          
          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Período de Upload
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">De</label>
                        <input
                          type="date"
                          value={dateRange.start || ''}
                          onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Até</label>
                        <input
                          type="date"
                          value={dateRange.end || ''}
                          onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg min-h-[42px]">
                      {getAllTags().map(tag => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                      {getAllTags().length === 0 && (
                        <span className="text-sm text-gray-500">Nenhuma tag disponível</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Filter Actions */}
                <div className="flex justify-end mt-4 space-x-2">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('all')
                      setSelectedSubcategory('all')
                      setSelectedTags([])
                      setDateRange({})
                      setSortBy('date')
                      setSortOrder('desc')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Documentos ({sortedDocuments.length})
          </h2>
          <div className="text-sm text-gray-500">
            {sortedDocuments.length} de {documents.length} documentos
          </div>
        </div>
        
        {sortedDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedDocuments.map((doc) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
              >
                {/* Document Header */}
                <div className="relative h-32 bg-gray-100 overflow-hidden">
                  {doc.thumbnailUrl ? (
                    <img 
                      src={doc.thumbnailUrl} 
                      alt={doc.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-r ${getCategoryColor(doc.category)} flex items-center justify-center`}>
                      {React.createElement(getCategoryIcon(doc.category), { className: "h-16 w-16 text-white/50" })}
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm text-white rounded text-xs">
                    {getCategoryName(doc.category)}
                  </div>
                  
                  {/* Favorite Button */}
                  <button
                    onClick={() => handleToggleFavorite(doc.id)}
                    className={`absolute top-2 right-2 p-1 rounded-full ${
                      doc.isFavorite 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-white/70 text-gray-600 hover:bg-white'
                    }`}
                    aria-label={doc.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={doc.isFavorite ? "currentColor" : "none"} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                </div>
                
                {/* Document Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{doc.title}</h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
                  
                  {/* Document Metadata */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="flex items-center text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{new Date(doc.uploadDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <FileText className="h-3 w-3 mr-1" />
                      <span>{doc.fileSize} • {doc.fileType}</span>
                    </div>
                    {doc.lastViewed && (
                      <div className="flex items-center text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Visto: {new Date(doc.lastViewed).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {doc.isDownloaded && (
                      <div className="flex items-center text-green-600">
                        <FileCheck className="h-3 w-3 mr-1" />
                        <span>Baixado</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {doc.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{doc.tags.length - 3}
                      </span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowViewModal(doc)}
                      className="flex-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs flex items-center justify-center"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Visualizar
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs flex items-center justify-center"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      {doc.isDownloaded ? 'Baixado' : 'Baixar'}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setShowDeleteConfirm(doc.id)}
                        className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs flex items-center justify-center"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum documento encontrado</h3>
            <p className="text-gray-600 mb-6">
              Não encontramos documentos com os filtros selecionados.
            </p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                setSelectedSubcategory('all')
                setSelectedTags([])
                setDateRange({})
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isUploading && setShowUploadModal(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Enviar Novo Documento</h2>
                {!isUploading && (
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arquivo PDF
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {newDocument.file ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText className="h-8 w-8 text-blue-500 mr-3" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">{newDocument.file.name}</p>
                            <p className="text-xs text-gray-500">
                              {(newDocument.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setNewDocument({...newDocument, file: null})}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Arraste e solte um arquivo PDF ou</p>
                        <label className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer inline-block">
                          Selecionar Arquivo
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newDocument.title}
                    onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Título do documento"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={newDocument.description}
                    onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Breve descrição do documento"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newDocument.category}
                      onChange={(e) => setNewDocument({...newDocument, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="manual">Manual Técnico</option>
                      <option value="corporate">Documento Corporativo</option>
                      <option value="educational">Material Didático</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subcategoria
                    </label>
                    <input
                      type="text"
                      value={newDocument.subcategory}
                      onChange={(e) => setNewDocument({...newDocument, subcategory: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Instalação"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={newDocument.tags}
                    onChange={(e) => setNewDocument({...newDocument, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: manual, ar condicionado, instalação"
                  />
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Enviando...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => !isUploading && setShowUploadModal(false)}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !newDocument.title || !newDocument.file}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </span>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2 inline" />
                      Enviar Documento
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Document Modal */}
      <AnimatePresence>
        {showViewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewModal(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${getCategoryColor(showViewModal.category)} flex items-center justify-center`}>
                    {React.createElement(getCategoryIcon(showViewModal.category), { className: "h-5 w-5 text-white" })}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{showViewModal.title}</h3>
                    <p className="text-xs text-gray-500">{getCategoryName(showViewModal.category)} • {showViewModal.subcategory}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(showViewModal)
                    }}
                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setShowViewModal(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Document Viewer */}
              <div className="flex-1 overflow-hidden bg-gray-100 p-4">
                <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Visualizador de PDF</h4>
                    <p className="text-gray-600 mb-6">
                      Em um ambiente real, o PDF seria exibido aqui usando um visualizador integrado.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(showViewModal)
                        }}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(showViewModal.fileUrl, '_blank')
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Abrir em Nova Aba
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Document Info */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Detalhes</h4>
                    <div className="space-y-1 text-sm">
                      <p className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        Enviado em {new Date(showViewModal.uploadDate).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="flex items-center text-gray-600">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        {showViewModal.fileSize} • {showViewModal.fileType}
                      </p>
                      {showViewModal.author && (
                        <p className="flex items-center text-gray-600">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          Autor: {showViewModal.author}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Descrição</h4>
                    <p className="text-sm text-gray-600">{showViewModal.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {showViewModal.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center space-x-4 mb-4 text-red-600">
                <AlertTriangle className="h-8 w-8" />
                <h3 className="text-xl font-bold">Confirmar Exclusão</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteDocument(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DigitalLibrary