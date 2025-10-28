import React, { useState, useEffect, useCallback } from 'react'
import {
  Upload,
  File,
  Image as ImageIcon,
  FileText,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Camera,
  X,
  Check,
  AlertCircle,
  Folder,
  Plus,
  Search,
  Filter
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'

interface ServiceOrderDocument {
  id: string
  service_order_id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  category: string
  subcategory?: string
  title?: string
  description?: string
  tags?: string[]
  is_visible_to_client: boolean
  status: string
  uploaded_by?: string
  uploaded_at: string
  created_at: string
}

interface DocumentStats {
  category: string
  count: number
}

interface ServiceOrderDocumentsProps {
  serviceOrderId: string
  readOnly?: boolean
  onDocumentsChange?: () => void
}

const DOCUMENT_CATEGORIES = [
  { value: 'fotos_antes', label: 'Fotos Antes', icon: Camera, color: 'blue' },
  { value: 'fotos_durante', label: 'Fotos Durante', icon: Camera, color: 'yellow' },
  { value: 'fotos_depois', label: 'Fotos Depois', icon: Camera, color: 'green' },
  { value: 'assinaturas', label: 'Assinaturas', icon: FileText, color: 'purple' },
  { value: 'contratos', label: 'Contratos', icon: FileText, color: 'indigo' },
  { value: 'notas_fiscais', label: 'Notas Fiscais', icon: FileText, color: 'red' },
  { value: 'laudos', label: 'Laudos', icon: FileText, color: 'orange' },
  { value: 'projetos', label: 'Projetos', icon: Folder, color: 'cyan' },
  { value: 'orcamentos', label: 'Orçamentos', icon: FileText, color: 'teal' },
  { value: 'outros', label: 'Outros', icon: File, color: 'gray' }
]

export function ServiceOrderDocuments({
  serviceOrderId,
  readOnly = false,
  onDocumentsChange
}: ServiceOrderDocumentsProps) {
  const [documents, setDocuments] = useState<ServiceOrderDocument[]>([])
  const [stats, setStats] = useState<DocumentStats[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [previewDocument, setPreviewDocument] = useState<ServiceOrderDocument | null>(null)
  const toast = useToast()

  useEffect(() => {
    loadDocuments()
    loadStats()
  }, [serviceOrderId])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('service_order_documents')
        .select('*')
        .eq('service_order_id', serviceOrderId)
        .eq('status', 'active')
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      toast.error('Erro ao carregar documentos')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_service_order_documents_count', {
          p_service_order_id: serviceOrderId
        })

      if (error) throw error
      setStats(data || [])
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleFileUpload = async (files: FileList, category: string) => {
    if (!files.length) return

    setUploading(true)
    let successCount = 0

    try {
      for (const file of Array.from(files)) {
        // Validar tamanho (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} excede 10MB`)
          continue
        }

        // Converter para base64
        const base64 = await fileToBase64(file)

        // Inserir no banco
        const { error } = await supabase
          .from('service_order_documents')
          .insert({
            service_order_id: serviceOrderId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: base64,
            category: category,
            title: file.name.split('.')[0],
            is_visible_to_client: false,
            status: 'active'
          })

        if (error) throw error
        successCount++
      }

      toast.success(`${successCount} arquivo(s) enviado(s) com sucesso!`)
      loadDocuments()
      loadStats()
      onDocumentsChange?.()
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Erro ao enviar arquivo(s)')
    } finally {
      setUploading(false)
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm('Deseja realmente excluir este documento?')) return

    try {
      const { error } = await supabase
        .from('service_order_documents')
        .update({ status: 'deleted' })
        .eq('id', documentId)

      if (error) throw error

      toast.success('Documento excluído com sucesso!')
      loadDocuments()
      loadStats()
      onDocumentsChange?.()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Erro ao excluir documento')
    }
  }

  const toggleVisibility = async (documentId: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('service_order_documents')
        .update({ is_visible_to_client: !currentVisibility })
        .eq('id', documentId)

      if (error) throw error

      const message = !currentVisibility ? 'Documento visível para cliente' : 'Documento oculto do cliente'
      toast.success(message)
      loadDocuments()
    } catch (error) {
      console.error('Error toggling visibility:', error)
      toast.error('Erro ao alterar visibilidade')
    }
  }

  const downloadDocument = (doc: ServiceOrderDocument) => {
    const link = document.createElement('a')
    link.href = doc.file_url
    link.download = doc.file_name
    link.click()
  }

  const getStatsForCategory = (category: string) => {
    return stats.find(s => s.category === category)?.count || 0
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = !selectedCategory || doc.category === selectedCategory
    const matchesSearch = !searchTerm ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return ImageIcon
    return FileText
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {DOCUMENT_CATEGORIES.slice(0, 5).map(cat => {
          const count = getStatsForCategory(cat.value)
          const Icon = cat.icon
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedCategory === cat.value
                  ? `border-${cat.color}-500 bg-${cat.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-5 w-5 text-${cat.color}-600`} />
                <span className={`text-2xl font-bold text-${cat.color}-600`}>{count}</span>
              </div>
              <p className="text-sm text-gray-600">{cat.label}</p>
            </button>
          )
        })}
      </div>

      {/* Barra de busca e ações */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar documentos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            {DOCUMENT_CATEGORIES.map(cat => {
              const Icon = cat.icon
              return (
                <label
                  key={cat.value}
                  className={`flex items-center gap-2 px-4 py-2 bg-${cat.color}-500 text-white rounded-lg hover:bg-${cat.color}-600 cursor-pointer transition-colors`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium hidden md:inline">{cat.label}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files, cat.value)}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Lista de documentos */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <Folder className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Nenhum documento encontrado</p>
          {!readOnly && (
            <p className="text-sm text-gray-400">
              Clique em uma categoria acima para adicionar documentos
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map(doc => {
            const Icon = getFileIcon(doc.file_type)
            const category = DOCUMENT_CATEGORIES.find(c => c.value === doc.category)

            return (
              <div
                key={doc.id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Preview */}
                <div
                  className="relative h-48 bg-gray-100 flex items-center justify-center cursor-pointer"
                  onClick={() => setPreviewDocument(doc)}
                >
                  {doc.file_type.startsWith('image/') ? (
                    <img
                      src={doc.file_url}
                      alt={doc.file_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="h-16 w-16 text-gray-400" />
                  )}
                  <div className={`absolute top-2 right-2 px-2 py-1 bg-${category?.color}-500 text-white text-xs rounded`}>
                    {category?.label}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h4 className="font-medium text-sm text-gray-900 truncate mb-1">
                    {doc.title || doc.file_name}
                  </h4>
                  <p className="text-xs text-gray-500 mb-3">
                    {formatFileSize(doc.file_size)} • {new Date(doc.uploaded_at).toLocaleDateString('pt-BR')}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => downloadDocument(doc)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-xs"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Baixar
                    </button>

                    {!readOnly && (
                      <>
                        <button
                          onClick={() => toggleVisibility(doc.id, doc.is_visible_to_client)}
                          className={`p-1.5 rounded ${
                            doc.is_visible_to_client
                              ? 'bg-green-50 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                          } hover:bg-opacity-80`}
                          title={doc.is_visible_to_client ? 'Visível para cliente' : 'Oculto do cliente'}
                        >
                          {doc.is_visible_to_client ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Preview Modal */}
      {previewDocument && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewDocument(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h3 className="font-semibold text-lg">{previewDocument.title || previewDocument.file_name}</h3>
              <button
                onClick={() => setPreviewDocument(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              {previewDocument.file_type.startsWith('image/') ? (
                <img
                  src={previewDocument.file_url}
                  alt={previewDocument.file_name}
                  className="w-full h-auto"
                />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-24 w-24 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Visualização não disponível para este tipo de arquivo</p>
                  <button
                    onClick={() => downloadDocument(previewDocument)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Baixar Arquivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Indicator */}
      {uploading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          <span>Enviando arquivo(s)...</span>
        </div>
      )}
    </div>
  )
}
