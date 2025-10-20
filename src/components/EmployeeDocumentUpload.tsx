import React, { useState } from 'react'
import { Upload, File, X, Download, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { EmployeeDocument } from '../lib/database-services'

interface EmployeeDocumentUploadProps {
  employeeId?: string
  documents: EmployeeDocument[]
  onDocumentAdd: (document: Omit<EmployeeDocument, 'id' | 'employee_id'>) => void
  onDocumentRemove: (documentId: string) => void
}

const documentTypes = [
  { value: 'driver_license', label: 'CNH - Carteira de Habilitação' },
  { value: 'certificate', label: 'Certificado / Diploma' },
  { value: 'training', label: 'Comprovante de Treinamento' },
  { value: 'contract', label: 'Contrato de Trabalho' },
  { value: 'other', label: 'Outro Documento' }
]

export const EmployeeDocumentUpload: React.FC<EmployeeDocumentUploadProps> = ({
  documents,
  onDocumentAdd,
  onDocumentRemove
}) => {
  const [selectedType, setSelectedType] = useState<string>('driver_license')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert('Arquivo muito grande! Tamanho máximo: 10MB')
      return
    }

    setUploading(true)

    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string

        onDocumentAdd({
          document_type: selectedType as any,
          file_name: file.name,
          file_url: base64String,
          file_size: file.size,
          notes: notes || undefined
        })

        setNotes('')
        e.target.value = ''
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Erro ao fazer upload do arquivo')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-3">Upload de Documento</h4>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Documento
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {documentTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Válida até 2026, Curso concluído em 2023..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo (PDF, JPG, PNG - Máx. 10MB)
            </label>
            <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Upload className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">
                {uploading ? 'Enviando...' : 'Clique para selecionar arquivo'}
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>

      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Documentos Anexados</h4>
          <AnimatePresence>
            {documents.map((doc, index) => (
              <motion.div
                key={doc.id || index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <File className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.file_name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>
                        {documentTypes.find(t => t.value === doc.document_type)?.label}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-gray-600 mt-1">{doc.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={doc.file_url}
                    download={doc.file_name}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => doc.id && onDocumentRemove(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
