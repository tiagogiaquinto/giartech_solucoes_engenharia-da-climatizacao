import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image, FileText, File, Trash2, Eye, Download, FolderOpen } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '../lib/supabase'

interface MediaFile {
  id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  category: string
  description?: string
  created_at: string
}

interface MediaUploaderProps {
  serviceOrderId: string
  onUploadComplete?: () => void
}

export const MediaUploader = ({ serviceOrderId, onUploadComplete }: MediaUploaderProps) => {
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<MediaFile[]>([])
  const [selectedCategory, setSelectedCategory] = useState('geral')
  const [description, setDescription] = useState('')

  const categories = [
    { value: 'foto_antes', label: 'Foto Antes', icon: '📸' },
    { value: 'foto_depois', label: 'Foto Depois', icon: '✅' },
    { value: 'nota_fiscal', label: 'Nota Fiscal', icon: '📄' },
    { value: 'contrato', label: 'Contrato', icon: '📝' },
    { value: 'laudo', label: 'Laudo Técnico', icon: '🔧' },
    { value: 'geral', label: 'Geral', icon: '📁' }
  ]

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true)

    try {
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${serviceOrderId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `service-orders/${fileName}`

        const { data, error } = await supabase
          .from('service_order_attachments')
          .insert({
            service_order_id: serviceOrderId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'document',
            file_size: file.size,
            mime_type: file.type,
            category: selectedCategory,
            description: description || null
          })
          .select()
          .single()

        if (error) throw error

        setFiles(prev => [data, ...prev])
      }

      setDescription('')
      onUploadComplete?.()
    } catch (err) {
      console.error('Erro ao fazer upload:', err)
      alert('Erro ao fazer upload dos arquivos')
    } finally {
      setUploading(false)
    }
  }, [serviceOrderId, selectedCategory, description, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx']
    },
    maxSize: 10 * 1024 * 1024
  })

  const deleteFile = async (fileId: string) => {
    if (!confirm('Deseja realmente excluir este arquivo?')) return

    try {
      const { error } = await supabase
        .from('service_order_attachments')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      setFiles(prev => prev.filter(f => f.id !== fileId))
    } catch (err) {
      console.error('Erro ao excluir arquivo:', err)
      alert('Erro ao excluir arquivo')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    if (type === 'image') return <Image className="w-5 h-5" />
    if (type === 'pdf') return <FileText className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria do Arquivo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição (opcional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Vista frontal do equipamento"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />

          {uploading ? (
            <div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Enviando arquivos...</p>
            </div>
          ) : isDragActive ? (
            <p className="text-blue-600 font-medium">Solte os arquivos aqui...</p>
          ) : (
            <div>
              <p className="text-gray-700 font-medium mb-2">
                Arraste arquivos aqui ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500">
                Suporta: Imagens (PNG, JPG), PDF, DOC (máx. 10MB)
              </p>
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Arquivos Anexados ({files.length})
            </h3>
          </div>

          <div className="divide-y">
            <AnimatePresence>
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      {getFileIcon(file.file_type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {file.file_name}
                        </h4>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {categories.find(c => c.value === file.category)?.label || file.category}
                        </span>
                      </div>

                      {file.description && (
                        <p className="text-sm text-gray-600 mb-1">{file.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{formatFileSize(file.file_size)}</span>
                        <span>•</span>
                        <span>{new Date(file.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.file_type === 'image' && (
                        <button
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteFile(file.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
