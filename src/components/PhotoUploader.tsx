import { useState, useRef } from 'react'
import { Upload, User, X, Camera, Loader2, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PhotoUploaderProps {
  currentPhotoUrl?: string
  employeeId?: string
  employeeName: string
  onPhotoUploaded: (url: string) => void
  size?: 'small' | 'medium' | 'large'
}

const PhotoUploader = ({
  currentPhotoUrl,
  employeeId,
  employeeName,
  onPhotoUploaded,
  size = 'medium'
}: PhotoUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    small: 'w-16 h-16',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  }

  const iconSizes = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(false)

    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB.')
      return
    }

    if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
      setError('Formato inválido. Use JPG, PNG ou WEBP.')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    await uploadPhoto(file)
  }

  const uploadPhoto = async (file: File) => {
    setIsUploading(true)
    setError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const sanitizedName = employeeName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')

      const fileName = `${employeeId || Date.now()}-${sanitizedName}.${fileExt}`
      const filePath = `${fileName}`

      const { data: existingFiles } = await supabase.storage
        .from('employee-photos')
        .list('', {
          search: employeeId || sanitizedName
        })

      if (existingFiles && existingFiles.length > 0) {
        for (const existingFile of existingFiles) {
          await supabase.storage
            .from('employee-photos')
            .remove([existingFile.name])
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('employee-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('employee-photos')
        .getPublicUrl(filePath)

      onPhotoUploaded(publicUrl)
      setSuccess(true)

      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Erro ao fazer upload:', err)
      setError(err.message || 'Erro ao fazer upload da foto')
      setPreviewUrl(currentPhotoUrl || null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemovePhoto = async () => {
    setPreviewUrl(null)
    onPhotoUploaded('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div
          className={`${sizeClasses[size]} rounded-2xl overflow-hidden border-4 border-gray-300 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center cursor-pointer transition-all hover:border-blue-500 relative ${
            isUploading ? 'opacity-50' : ''
          }`}
          onClick={!isUploading ? handleClick : undefined}
        >
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt={employeeName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className={`${iconSizes[size]} text-white opacity-70`} />
              </div>
            </>
          ) : (
            <User className={`${iconSizes[size]} text-white opacity-70`} />
          )}

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            ) : (
              <Camera className="h-8 w-8 text-white" />
            )}
          </div>

          {success && (
            <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center">
              <Check className="h-12 w-12 text-white" />
            </div>
          )}
        </div>

        {previewUrl && !isUploading && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleRemovePhoto()
            }}
            className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {previewUrl ? 'Trocar Foto' : 'Adicionar Foto'}
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600 text-center max-w-xs">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600 text-center font-medium">
          Foto enviada com sucesso!
        </p>
      )}

      <p className="text-xs text-gray-500 text-center max-w-xs">
        Formatos: JPG, PNG, WEBP • Máximo: 5MB
        <br />
        Recomendado: 400x400px (quadrado)
      </p>
    </div>
  )
}

export default PhotoUploader
