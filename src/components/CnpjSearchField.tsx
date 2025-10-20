import { useState } from 'react'
import { Search, Loader as Loader2, Building2 } from 'lucide-react'
import { fetchCnpjData, formatCnpj } from '../utils/externalApis'

interface CnpjSearchFieldProps {
  cnpj: string
  onCnpjChange: (cnpj: string) => void
  onDataFilled: (data: {
    razao_social: string
    nome_fantasia: string
    email: string
    telefone: string
    logradouro: string
    numero: string
    complemento: string
    bairro: string
    cidade: string
    estado: string
    cep: string
  }) => void
}

export const CnpjSearchField = ({
  cnpj,
  onCnpjChange,
  onDataFilled
}: CnpjSearchFieldProps) => {
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSearch = async () => {
    if (!cnpj || cnpj.replace(/\D/g, '').length !== 14) {
      setError('CNPJ deve conter 14 dígitos')
      return
    }

    setSearching(true)
    setError('')
    setSuccess(false)

    try {
      const data = await fetchCnpjData(cnpj)

      if (data) {
        onDataFilled({
          razao_social: data.razao_social,
          nome_fantasia: data.nome_fantasia,
          email: data.email,
          telefone: data.telefone,
          logradouro: data.logradouro,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.municipio,
          estado: data.uf,
          cep: data.cep
        })

        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao buscar CNPJ')
    } finally {
      setSearching(false)
    }
  }

  const handleCnpjChange = (value: string) => {
    const formatted = formatCnpj(value)
    onCnpjChange(formatted)
    setError('')
    setSuccess(false)
  }

  const handleBlur = () => {
    if (cnpj && cnpj.replace(/\D/g, '').length === 14) {
      handleSearch()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        CNPJ <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Building2 className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={cnpj}
          onChange={(e) => handleCnpjChange(e.target.value)}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder="00.000.000/0000-00"
          maxLength={18}
          className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !cnpj}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          title="Buscar dados da empresa"
        >
          {searching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
          <Building2 className="w-4 h-4" />
          Dados da empresa preenchidos automaticamente
        </p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Digite o CNPJ e pressione Enter ou clique na lupa para buscar os dados automaticamente
      </p>
    </div>
  )
}
