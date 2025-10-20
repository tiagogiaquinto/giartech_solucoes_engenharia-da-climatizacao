import { useState } from 'react'
import { Upload, FileText, CircleCheck as CheckCircle, Circle as XCircle, Loader } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface DocumentUploadProps {
  staffId: string
  documentType: 'rg' | 'cpf' | 'comprovante_endereco' | 'cnh'
  currentUrl?: string
  onUploadComplete: (url: string) => void
  label: string
}

export const DocumentUpload = ({ staffId, documentType, currentUrl, onUploadComplete, label }: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setError('')
      setSuccess(false)

      const file = event.target.files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo: 5MB')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${staffId}_${documentType}_${Date.now()}.${fileExt}`
      const filePath = `${staffId}/${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      const fieldName = `doc_${documentType}_url`
      const { error: updateError } = await supabase
        .from('staff')
        .update({ [fieldName]: publicUrl })
        .eq('id', staffId)

      if (updateError) throw updateError

      setSuccess(true)
      onUploadComplete(publicUrl)

      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className={`p-4 border-2 border-dashed rounded-lg transition-all ${
        success ? 'border-green-500 bg-green-50' :
        error ? 'border-red-500 bg-red-50' :
        'border-gray-300 hover:border-blue-500 bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className={`h-5 w-5 ${success ? 'text-green-600' : 'text-gray-400'}`} />
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">PDF, JPG ou PNG - Máx. 5MB</p>
              {currentUrl && (
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Ver documento atual
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {uploading && <Loader className="h-5 w-5 text-blue-600 animate-spin" />}
            {success && <CheckCircle className="h-5 w-5 text-green-600" />}
            {error && <XCircle className="h-5 w-5 text-red-600" />}

            <label className={`px-4 py-2 rounded-lg cursor-pointer transition-colors flex items-center gap-2 ${
              uploading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}>
              <Upload className="h-4 w-4" />
              {uploading ? 'Enviando...' : currentUrl ? 'Substituir' : 'Upload'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}
        {success && (
          <p className="mt-2 text-sm text-green-600">Documento enviado com sucesso!</p>
        )}
      </div>
    </div>
  )
}
