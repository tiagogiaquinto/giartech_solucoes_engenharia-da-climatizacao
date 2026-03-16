import React, { useState, useEffect } from 'react'
import { User, Search, Building2, Phone, Mail, Plus, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Customer {
  id: string
  nome_razao: string
  nome_fantasia?: string
  cpf?: string
  cnpj?: string
  email?: string
  telefone?: string
  celular?: string
}

interface CustomerSelectorProps {
  customers: Customer[]
  selectedCustomer: Customer | null
  onSelect: (customer: Customer | null) => void
  onAddNew?: () => void
  onCustomerCreated?: (customer: Customer) => void
}

const EMPTY_FORM = {
  tipo_pessoa: 'F' as 'F' | 'J',
  nome_razao: '',
  nome_fantasia: '',
  cpf: '',
  cnpj: '',
  email: '',
  telefone: '',
  celular: ''
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomer,
  onSelect,
  onCustomerCreated
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const filtered = customers.filter(c =>
    c.nome_razao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.includes(searchTerm) ||
    c.cnpj?.includes(searchTerm) ||
    c.telefone?.includes(searchTerm) ||
    c.celular?.includes(searchTerm)
  )

  useEffect(() => {
    if (selectedCustomer) {
      setSearchTerm(selectedCustomer.nome_razao)
      setShowDropdown(false)
    }
  }, [selectedCustomer])

  const openNew = () => {
    setForm(EMPTY_FORM)
    setSaveError('')
    setShowNewModal(true)
  }

  const handleSave = async () => {
    if (!form.nome_razao.trim()) {
      setSaveError('Nome é obrigatório')
      return
    }
    setSaveError('')
    setSaving(true)
    try {
      const payload: any = {
        tipo_pessoa: form.tipo_pessoa,
        nome_razao: form.nome_razao.trim(),
        email: form.email || null,
        telefone: form.telefone || null,
        celular: form.celular || null
      }
      if (form.tipo_pessoa === 'F') {
        payload.cpf = form.cpf || null
      } else {
        payload.cnpj = form.cnpj || null
        payload.nome_fantasia = form.nome_fantasia || null
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      setShowNewModal(false)
      onSelect(data)
      if (onCustomerCreated) onCustomerCreated(data)
    } catch (err: any) {
      setSaveError(err.message || 'Erro ao salvar cliente')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Cliente
          </h2>
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </button>
        </div>

        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowDropdown(true)
                if (!e.target.value) onSelect(null)
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
            />
          </div>

          {showDropdown && filtered.length > 0 && (
            <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {filtered.slice(0, 10).map(c => (
                <button
                  key={c.id}
                  onClick={() => { onSelect(c); setShowDropdown(false) }}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{c.nome_razao}</p>
                      {c.nome_fantasia && <p className="text-sm text-gray-500 truncate">{c.nome_fantasia}</p>}
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-400">
                        {(c.cnpj || c.cpf) && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {c.cnpj || c.cpf}
                          </span>
                        )}
                        {(c.telefone || c.celular) && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {c.telefone || c.celular}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {c.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedCustomer && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{selectedCustomer.nome_razao}</p>
                {selectedCustomer.nome_fantasia && (
                  <p className="text-sm text-gray-600">{selectedCustomer.nome_fantasia}</p>
                )}
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {(selectedCustomer.cnpj || selectedCustomer.cpf) && (
                    <p className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      {selectedCustomer.cnpj || selectedCustomer.cpf}
                    </p>
                  )}
                  {(selectedCustomer.telefone || selectedCustomer.celular) && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {selectedCustomer.telefone || selectedCustomer.celular}
                    </p>
                  )}
                  {selectedCustomer.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {selectedCustomer.email}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => { onSelect(null); setSearchTerm('') }}
                className="text-gray-400 hover:text-red-500 transition-colors p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold text-gray-900">Novo Cliente</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pessoa</label>
                <div className="flex gap-3">
                  {(['F', 'J'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(p => ({ ...p, tipo_pessoa: t }))}
                      className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-colors ${
                        form.tipo_pessoa === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t === 'F' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {form.tipo_pessoa === 'F' ? 'Nome Completo' : 'Razão Social'} *
                </label>
                <input
                  type="text"
                  value={form.nome_razao}
                  onChange={(e) => setForm(p => ({ ...p, nome_razao: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={form.tipo_pessoa === 'F' ? 'Nome completo' : 'Razão social'}
                />
              </div>

              {form.tipo_pessoa === 'J' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={form.nome_fantasia}
                    onChange={(e) => setForm(p => ({ ...p, nome_fantasia: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome fantasia"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {form.tipo_pessoa === 'F' ? 'CPF' : 'CNPJ'}
                  </label>
                  <input
                    type="text"
                    value={form.tipo_pessoa === 'F' ? form.cpf : form.cnpj}
                    onChange={(e) => {
                      const v = e.target.value
                      setForm(p => form.tipo_pessoa === 'F' ? { ...p, cpf: v } : { ...p, cnpj: v })
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={form.tipo_pessoa === 'F' ? '000.000.000-00' : '00.000.000/0001-00'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm(p => ({ ...p, telefone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                  <input
                    type="text"
                    value={form.celular}
                    onChange={(e) => setForm(p => ({ ...p, celular: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{saveError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Salvando...' : 'Salvar Cliente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
