import React, { useState, useEffect } from 'react'
import { User, Search, Building2, Phone, Mail, Plus, X, Loader2, MapPin, ChevronDown, ChevronUp } from 'lucide-react'
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
  tipo_pessoa: 'pf' as 'pf' | 'pj',
  nome_razao: '',
  nome_fantasia: '',
  cpf: '',
  rg: '',
  cnpj: '',
  inscricao_estadual: '',
  inscricao_municipal: '',
  data_nascimento: '',
  data_fundacao: '',
  email: '',
  telefone: '',
  celular: '',
  whatsapp: '',
  observacoes: ''
}

const EMPTY_ADDRESS = {
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: ''
}

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomer,
  onSelect,
  onCustomerCreated
}) => {
  const [searchTerm, setSearchTerm] = useState(selectedCustomer?.nome_razao || '')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (selectedCustomer) {
      setSearchTerm(selectedCustomer.nome_razao || '')
      setShowDropdown(false)
    } else {
      setSearchTerm('')
    }
  }, [selectedCustomer?.id])

  const [showNewModal, setShowNewModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [address, setAddress] = useState(EMPTY_ADDRESS)
  const [showAddress, setShowAddress] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const filtered = customers.filter(c =>
    c.nome_razao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cpf?.includes(searchTerm) ||
    c.cnpj?.includes(searchTerm) ||
    c.telefone?.includes(searchTerm) ||
    c.celular?.includes(searchTerm)
  )

  const openNew = () => {
    setForm(EMPTY_FORM)
    setAddress(EMPTY_ADDRESS)
    setShowAddress(false)
    setSaveError('')
    setShowNewModal(true)
  }

  const fetchCep = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, '')
    if (cleaned.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || ''
        }))
      }
    } catch {
    } finally {
      setCepLoading(false)
    }
  }

  const handleCepChange = (value: string) => {
    const masked = value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9)
    setAddress(prev => ({ ...prev, cep: masked }))
    if (masked.replace(/\D/g, '').length === 8) {
      fetchCep(masked)
    }
  }

  const maskCpf = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4').slice(0, 14)

  const maskCnpj = (v: string) =>
    v.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5').slice(0, 18)

  const maskPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '')
  }

  const hasAddressData = address.logradouro.trim() !== ''

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
        nome_razao: form.nome_razao.trim()
      }

      if (form.email) payload.email = form.email
      if (form.telefone) payload.telefone = form.telefone
      if (form.celular) payload.celular = form.celular
      if (form.whatsapp) payload.whatsapp = form.whatsapp
      if (form.observacoes) payload.observacoes = form.observacoes

      if (form.tipo_pessoa === 'pf') {
        if (form.cpf) payload.cpf = form.cpf
        if (form.rg) payload.rg = form.rg
        if (form.data_nascimento) payload.data_nascimento = form.data_nascimento
      } else {
        if (form.cnpj) payload.cnpj = form.cnpj
        if (form.nome_fantasia) payload.nome_fantasia = form.nome_fantasia
        if (form.inscricao_estadual) payload.inscricao_estadual = form.inscricao_estadual
        if (form.inscricao_municipal) payload.inscricao_municipal = form.inscricao_municipal
        if (form.data_fundacao) payload.data_fundacao = form.data_fundacao
      }

      const { data, error } = await supabase
        .from('customers')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      if (hasAddressData) {
        await supabase.from('customer_addresses').insert({
          customer_id: data.id,
          tipo: 'principal',
          nome_identificacao: 'Principal',
          cep: address.cep || null,
          logradouro: address.logradouro || null,
          numero: address.numero || null,
          complemento: address.complemento || null,
          bairro: address.bairro || null,
          cidade: address.cidade || null,
          estado: address.estado || null,
          principal: true
        })
      }

      setShowNewModal(false)
      onSelect(data)
      if (onCustomerCreated) onCustomerCreated(data)
    } catch (err: any) {
      setSaveError(err.message || 'Erro ao salvar cliente')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

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

        {!selectedCustomer && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setShowDropdown(true)
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
        )}

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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b shrink-0">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Novo Cliente</h3>
                <p className="text-xs text-gray-500 mt-0.5">Apenas o nome é obrigatório — os demais campos podem ser preenchidos depois.</p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div>
                <label className={labelCls}>Tipo de Pessoa</label>
                <div className="flex gap-3">
                  {(['pf', 'pj'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(p => ({ ...p, tipo_pessoa: t }))}
                      className={`flex-1 py-2 rounded-lg border font-medium text-sm transition-colors ${
                        form.tipo_pessoa === t
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>
                  {form.tipo_pessoa === 'pf' ? 'Nome Completo' : 'Razão Social'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.nome_razao}
                  onChange={(e) => setForm(p => ({ ...p, nome_razao: e.target.value }))}
                  className={inputCls}
                  placeholder={form.tipo_pessoa === 'F' ? 'Nome completo do cliente' : 'Razão social da empresa'}
                  autoFocus
                />
              </div>

              {form.tipo_pessoa === 'pj' && (
                <div>
                  <label className={labelCls}>Nome Fantasia</label>
                  <input
                    type="text"
                    value={form.nome_fantasia}
                    onChange={(e) => setForm(p => ({ ...p, nome_fantasia: e.target.value }))}
                    className={inputCls}
                    placeholder="Nome fantasia (opcional)"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{form.tipo_pessoa === 'pf' ? 'CPF' : 'CNPJ'}</label>
                  <input
                    type="text"
                    value={form.tipo_pessoa === 'pf' ? form.cpf : form.cnpj}
                    onChange={(e) => {
                      const v = form.tipo_pessoa === 'pf' ? maskCpf(e.target.value) : maskCnpj(e.target.value)
                      setForm(p => form.tipo_pessoa === 'pf' ? { ...p, cpf: v } : { ...p, cnpj: v })
                    }}
                    className={inputCls}
                    placeholder={form.tipo_pessoa === 'pf' ? '000.000.000-00' : '00.000.000/0001-00'}
                  />
                </div>
                <div>
                  <label className={labelCls}>{form.tipo_pessoa === 'pf' ? 'RG' : 'Inscrição Estadual'}</label>
                  <input
                    type="text"
                    value={form.tipo_pessoa === 'pf' ? form.rg : form.inscricao_estadual}
                    onChange={(e) => {
                      const v = e.target.value
                      setForm(p => form.tipo_pessoa === 'pf' ? { ...p, rg: v } : { ...p, inscricao_estadual: v })
                    }}
                    className={inputCls}
                    placeholder={form.tipo_pessoa === 'pf' ? 'RG' : 'Inscrição estadual'}
                  />
                </div>
              </div>

              {form.tipo_pessoa === 'pj' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Inscrição Municipal</label>
                    <input
                      type="text"
                      value={form.inscricao_municipal}
                      onChange={(e) => setForm(p => ({ ...p, inscricao_municipal: e.target.value }))}
                      className={inputCls}
                      placeholder="Inscrição municipal"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Data de Fundação</label>
                    <input
                      type="date"
                      value={form.data_fundacao}
                      onChange={(e) => setForm(p => ({ ...p, data_fundacao: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {form.tipo_pessoa === 'pf' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Data de Nascimento</label>
                    <input
                      type="date"
                      value={form.data_nascimento}
                      onChange={(e) => setForm(p => ({ ...p, data_nascimento: e.target.value }))}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) => setForm(p => ({ ...p, telefone: maskPhone(e.target.value) }))}
                    className={inputCls}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <label className={labelCls}>Celular</label>
                  <input
                    type="text"
                    value={form.celular}
                    onChange={(e) => setForm(p => ({ ...p, celular: maskPhone(e.target.value) }))}
                    className={inputCls}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp</label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm(p => ({ ...p, whatsapp: maskPhone(e.target.value) }))}
                    className={inputCls}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                  className={inputCls}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <label className={labelCls}>Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => setForm(p => ({ ...p, observacoes: e.target.value }))}
                  className={`${inputCls} resize-none`}
                  rows={2}
                  placeholder="Observações internas sobre o cliente"
                />
              </div>

              <div className="border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAddress(p => !p)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    Endereço
                    <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                  </span>
                  {showAddress ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </button>

                {showAddress && (
                  <div className="p-4 space-y-3 border-t">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>CEP</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={address.cep}
                            onChange={(e) => handleCepChange(e.target.value)}
                            className={inputCls}
                            placeholder="00000-000"
                          />
                          {cepLoading && (
                            <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Logradouro</label>
                        <input
                          type="text"
                          value={address.logradouro}
                          onChange={(e) => setAddress(p => ({ ...p, logradouro: e.target.value }))}
                          className={inputCls}
                          placeholder="Rua, Avenida..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Número</label>
                        <input
                          type="text"
                          value={address.numero}
                          onChange={(e) => setAddress(p => ({ ...p, numero: e.target.value }))}
                          className={inputCls}
                          placeholder="Nº"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Complemento</label>
                        <input
                          type="text"
                          value={address.complemento}
                          onChange={(e) => setAddress(p => ({ ...p, complemento: e.target.value }))}
                          className={inputCls}
                          placeholder="Apto, sala, bloco..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Bairro</label>
                        <input
                          type="text"
                          value={address.bairro}
                          onChange={(e) => setAddress(p => ({ ...p, bairro: e.target.value }))}
                          className={inputCls}
                          placeholder="Bairro"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Cidade</label>
                        <input
                          type="text"
                          value={address.cidade}
                          onChange={(e) => setAddress(p => ({ ...p, cidade: e.target.value }))}
                          className={inputCls}
                          placeholder="Cidade"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Estado</label>
                        <select
                          value={address.estado}
                          onChange={(e) => setAddress(p => ({ ...p, estado: e.target.value }))}
                          className={inputCls}
                        >
                          <option value="">UF</option>
                          {ESTADOS.map(uf => (
                            <option key={uf} value={uf}>{uf}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {saveError && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{saveError}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50 rounded-b-xl shrink-0">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
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
