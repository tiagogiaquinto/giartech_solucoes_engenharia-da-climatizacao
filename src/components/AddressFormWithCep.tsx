import { useState } from 'react'
import { Search, Loader as Loader2 } from 'lucide-react'
import { fetchCepData, formatCep } from '../utils/externalApis'

interface AddressFormProps {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  onCepChange: (cep: string) => void
  onAddressDataFound?: (data: any) => void
  onFieldChange: (field: string, value: string) => void
}

export const AddressFormWithCep = ({
  cep,
  logradouro,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  onCepChange,
  onAddressDataFound,
  onFieldChange
}: AddressFormProps) => {
  const [searchingCep, setSearchingCep] = useState(false)
  const [cepError, setCepError] = useState('')
  const [cepSuccess, setCepSuccess] = useState(false)

  const handleCepSearch = async () => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      setCepError('CEP deve conter 8 dígitos')
      return
    }

    setSearchingCep(true)
    setCepError('')
    setCepSuccess(false)

    try {
      const data = await fetchCepData(cep)

      if (data) {
        onFieldChange('logradouro', data.logradouro)
        onFieldChange('bairro', data.bairro)
        onFieldChange('cidade', data.localidade)
        onFieldChange('estado', data.uf)
        if (data.complemento) {
          onFieldChange('complemento', data.complemento)
        }

        if (onAddressDataFound) {
          onAddressDataFound(data)
        }

        setCepSuccess(true)
        setTimeout(() => setCepSuccess(false), 3000)
      }
    } catch (error) {
      setCepError(error instanceof Error ? error.message : 'Erro ao buscar CEP')
    } finally {
      setSearchingCep(false)
    }
  }

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value)
    onCepChange(formatted)
    setCepError('')
    setCepSuccess(false)
  }

  const handleCepBlur = () => {
    if (cep && cep.replace(/\D/g, '').length === 8) {
      handleCepSearch()
    }
  }

  const handleCepKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCepSearch()
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CEP <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={cep}
              onChange={(e) => handleCepChange(e.target.value)}
              onBlur={handleCepBlur}
              onKeyPress={handleCepKeyPress}
              placeholder="00000-000"
              maxLength={9}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                cepError ? 'border-red-500' : cepSuccess ? 'border-green-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={handleCepSearch}
              disabled={searchingCep || !cep}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              title="Buscar CEP"
            >
              {searchingCep ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>
          {cepError && (
            <p className="mt-1 text-sm text-red-600">{cepError}</p>
          )}
          {cepSuccess && (
            <p className="mt-1 text-sm text-green-600">Endereço preenchido automaticamente!</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logradouro <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={logradouro}
            onChange={(e) => onFieldChange('logradouro', e.target.value)}
            placeholder="Rua, Avenida, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={numero}
            onChange={(e) => onFieldChange('numero', e.target.value)}
            placeholder="123"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Complemento
          </label>
          <input
            type="text"
            value={complemento}
            onChange={(e) => onFieldChange('complemento', e.target.value)}
            placeholder="Apto, Sala, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bairro <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={bairro}
            onChange={(e) => onFieldChange('bairro', e.target.value)}
            placeholder="Centro"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cidade <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={cidade}
            onChange={(e) => onFieldChange('cidade', e.target.value)}
            placeholder="São Paulo"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado <span className="text-red-500">*</span>
          </label>
          <select
            value={estado}
            onChange={(e) => onFieldChange('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Selecione</option>
            <option value="AC">AC</option>
            <option value="AL">AL</option>
            <option value="AP">AP</option>
            <option value="AM">AM</option>
            <option value="BA">BA</option>
            <option value="CE">CE</option>
            <option value="DF">DF</option>
            <option value="ES">ES</option>
            <option value="GO">GO</option>
            <option value="MA">MA</option>
            <option value="MT">MT</option>
            <option value="MS">MS</option>
            <option value="MG">MG</option>
            <option value="PA">PA</option>
            <option value="PB">PB</option>
            <option value="PR">PR</option>
            <option value="PE">PE</option>
            <option value="PI">PI</option>
            <option value="RJ">RJ</option>
            <option value="RN">RN</option>
            <option value="RS">RS</option>
            <option value="RO">RO</option>
            <option value="RR">RR</option>
            <option value="SC">SC</option>
            <option value="SP">SP</option>
            <option value="SE">SE</option>
            <option value="TO">TO</option>
          </select>
        </div>
      </div>
    </div>
  )
}
