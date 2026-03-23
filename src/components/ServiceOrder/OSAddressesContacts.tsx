import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, MapPin, User, Phone, Mail, Briefcase, Star, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface OSAddress {
  id?: string
  service_order_id?: string
  label: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  referencia: string
  is_primary: boolean
}

interface OSContact {
  id?: string
  service_order_id?: string
  nome: string
  telefone: string
  email: string
  cargo: string
  is_primary: boolean
}

interface Props {
  serviceOrderId?: string
  onAddressesChange?: (addresses: OSAddress[]) => void
  onContactsChange?: (contacts: OSContact[]) => void
}

const emptyAddress = (): OSAddress => ({
  label: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  referencia: '',
  is_primary: false,
})

const emptyContact = (): OSContact => ({
  nome: '',
  telefone: '',
  email: '',
  cargo: '',
  is_primary: false,
})

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

export function OSAddressesContacts({ serviceOrderId, onAddressesChange, onContactsChange }: Props) {
  const [addresses, setAddresses] = useState<OSAddress[]>([emptyAddress()])
  const [contacts, setContacts] = useState<OSContact[]>([emptyContact()])
  const [openAddressIdx, setOpenAddressIdx] = useState<number | null>(0)
  const [openContactIdx, setOpenContactIdx] = useState<number | null>(0)
  const [cepLoading, setCepLoading] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!serviceOrderId) return
    loadData()
  }, [serviceOrderId])

  async function loadData() {
    if (!serviceOrderId) return
    const [{ data: addrs }, { data: conts }] = await Promise.all([
      supabase.from('service_order_addresses').select('*').eq('service_order_id', serviceOrderId).order('is_primary', { ascending: false }),
      supabase.from('service_order_contacts').select('*').eq('service_order_id', serviceOrderId).order('is_primary', { ascending: false }),
    ])
    if (addrs && addrs.length > 0) setAddresses(addrs)
    if (conts && conts.length > 0) setContacts(conts)
  }

  const notifyAddresses = useCallback((list: OSAddress[]) => {
    onAddressesChange?.(list)
  }, [onAddressesChange])

  const notifyContacts = useCallback((list: OSContact[]) => {
    onContactsChange?.(list)
  }, [onContactsChange])

  async function fetchCep(cep: string, idx: number) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setCepLoading(idx)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (!data.erro) {
        updateAddress(idx, {
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          estado: data.uf || '',
          cep: clean,
        })
      }
    } catch { /* ignore */ } finally {
      setCepLoading(null)
    }
  }

  function updateAddress(idx: number, partial: Partial<OSAddress>) {
    setAddresses(prev => {
      const next = prev.map((a, i) => i === idx ? { ...a, ...partial } : a)
      notifyAddresses(next)
      return next
    })
  }

  function updateContact(idx: number, partial: Partial<OSContact>) {
    setContacts(prev => {
      const next = prev.map((c, i) => i === idx ? { ...c, ...partial } : c)
      notifyContacts(next)
      return next
    })
  }

  function addAddress() {
    const next = [...addresses, emptyAddress()]
    setAddresses(next)
    setOpenAddressIdx(next.length - 1)
    notifyAddresses(next)
  }

  function removeAddress(idx: number) {
    if (addresses.length === 1) return
    const next = addresses.filter((_, i) => i !== idx)
    setAddresses(next)
    setOpenAddressIdx(Math.min(openAddressIdx ?? 0, next.length - 1))
    notifyAddresses(next)
  }

  function addContact() {
    const next = [...contacts, emptyContact()]
    setContacts(next)
    setOpenContactIdx(next.length - 1)
    notifyContacts(next)
  }

  function removeContact(idx: number) {
    if (contacts.length === 1) return
    const next = contacts.filter((_, i) => i !== idx)
    setContacts(next)
    setOpenContactIdx(Math.min(openContactIdx ?? 0, next.length - 1))
    notifyContacts(next)
  }

  function setPrimaryAddress(idx: number) {
    setAddresses(prev => {
      const next = prev.map((a, i) => ({ ...a, is_primary: i === idx }))
      notifyAddresses(next)
      return next
    })
  }

  function setPrimaryContact(idx: number) {
    setContacts(prev => {
      const next = prev.map((c, i) => ({ ...c, is_primary: i === idx }))
      notifyContacts(next)
      return next
    })
  }

  async function saveAll(osId: string) {
    setSaving(true)
    try {
      await supabase.from('service_order_addresses').delete().eq('service_order_id', osId)
      await supabase.from('service_order_contacts').delete().eq('service_order_id', osId)

      if (addresses.some(a => a.logradouro || a.cep || a.cidade)) {
        const addrRows = addresses
          .filter(a => a.logradouro || a.cep || a.cidade)
          .map(({ id: _, service_order_id: __, ...rest }) => ({ ...rest, service_order_id: osId }))
        if (addrRows.length > 0) {
          await supabase.from('service_order_addresses').insert(addrRows)
        }
      }

      if (contacts.some(c => c.nome || c.telefone)) {
        const contactRows = contacts
          .filter(c => c.nome || c.telefone)
          .map(({ id: _, service_order_id: __, ...rest }) => ({ ...rest, service_order_id: osId }))
        if (contactRows.length > 0) {
          await supabase.from('service_order_contacts').insert(contactRows)
        }
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Endereços de Instalação</h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{addresses.length}</span>
          </div>
          <button
            type="button"
            onClick={addAddress}
            className="flex items-center gap-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} /> Adicionar Endereço
          </button>
        </div>

        <div className="space-y-2">
          {addresses.map((addr, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                onClick={() => setOpenAddressIdx(openAddressIdx === idx ? null : idx)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {addr.is_primary && <Star size={13} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                  <MapPin size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {addr.label || (addr.logradouro ? `${addr.logradouro}${addr.numero ? ', ' + addr.numero : ''}` : `Endereço ${idx + 1}`)}
                  </span>
                  {addr.cidade && <span className="text-xs text-gray-400 shrink-0">{addr.cidade}/{addr.estado}</span>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!addr.is_primary && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPrimaryAddress(idx) }}
                      className="text-xs text-yellow-600 hover:text-yellow-700 px-2 py-0.5 rounded border border-yellow-300 hover:bg-yellow-50 transition-colors"
                    >
                      Principal
                    </button>
                  )}
                  {addresses.length > 1 && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeAddress(idx) }}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {openAddressIdx === idx ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </button>

              {openAddressIdx === idx && (
                <div className="p-4 bg-white dark:bg-gray-900 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Identificação (ex: Sede, Filial, Obra)</label>
                    <input
                      type="text"
                      value={addr.label}
                      onChange={e => updateAddress(idx, { label: e.target.value })}
                      placeholder="Nome/identificação do local"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">CEP</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={addr.cep}
                        onChange={e => updateAddress(idx, { cep: e.target.value })}
                        onBlur={e => fetchCep(e.target.value, idx)}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 pr-8"
                      />
                      {cepLoading === idx && (
                        <Search size={13} className="absolute right-2 top-2.5 text-blue-400 animate-pulse" />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Estado</label>
                    <select
                      value={addr.estado}
                      onChange={e => updateAddress(idx, { estado: e.target.value })}
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">UF</option>
                      {ESTADOS_BR.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Logradouro</label>
                    <input
                      type="text"
                      value={addr.logradouro}
                      onChange={e => updateAddress(idx, { logradouro: e.target.value })}
                      placeholder="Rua, Avenida, etc."
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Número</label>
                    <input
                      type="text"
                      value={addr.numero}
                      onChange={e => updateAddress(idx, { numero: e.target.value })}
                      placeholder="Nº"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Complemento</label>
                    <input
                      type="text"
                      value={addr.complemento}
                      onChange={e => updateAddress(idx, { complemento: e.target.value })}
                      placeholder="Apto, Bloco, Sala..."
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bairro</label>
                    <input
                      type="text"
                      value={addr.bairro}
                      onChange={e => updateAddress(idx, { bairro: e.target.value })}
                      placeholder="Bairro"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                    <input
                      type="text"
                      value={addr.cidade}
                      onChange={e => updateAddress(idx, { cidade: e.target.value })}
                      placeholder="Cidade"
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Ponto de Referência / Observação de Acesso</label>
                    <input
                      type="text"
                      value={addr.referencia}
                      onChange={e => updateAddress(idx, { referencia: e.target.value })}
                      placeholder="Ex: Portaria B, interfone 204, falar com segurança..."
                      className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User size={18} className="text-green-500" />
            <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Contatos no Local</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{contacts.length}</span>
          </div>
          <button
            type="button"
            onClick={addContact}
            className="flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={13} /> Adicionar Contato
          </button>
        </div>

        <div className="space-y-2">
          {contacts.map((contact, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                onClick={() => setOpenContactIdx(openContactIdx === idx ? null : idx)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {contact.is_primary && <Star size={13} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                  <User size={14} className="text-gray-400 shrink-0" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {contact.nome || `Contato ${idx + 1}`}
                  </span>
                  {contact.cargo && <span className="text-xs text-gray-400 shrink-0 truncate">— {contact.cargo}</span>}
                  {contact.telefone && (
                    <span className="text-xs text-gray-400 shrink-0 flex items-center gap-1">
                      <Phone size={11} />{contact.telefone}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!contact.is_primary && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPrimaryContact(idx) }}
                      className="text-xs text-yellow-600 hover:text-yellow-700 px-2 py-0.5 rounded border border-yellow-300 hover:bg-yellow-50 transition-colors"
                    >
                      Principal
                    </button>
                  )}
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeContact(idx) }}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {openContactIdx === idx ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </button>

              {openContactIdx === idx && (
                <div className="p-4 bg-white dark:bg-gray-900 grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Nome Completo</label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={contact.nome}
                        onChange={e => updateContact(idx, { nome: e.target.value })}
                        placeholder="Nome do contato"
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Telefone / WhatsApp</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={contact.telefone}
                        onChange={e => updateContact(idx, { telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cargo / Função</label>
                    <div className="relative">
                      <Briefcase size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        value={contact.cargo}
                        onChange={e => updateContact(idx, { cargo: e.target.value })}
                        placeholder="Ex: Responsável, Porteiro..."
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">E-mail</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="email"
                        value={contact.email}
                        onChange={e => updateContact(idx, { email: e.target.value })}
                        placeholder="email@exemplo.com"
                        className="w-full border border-gray-200 dark:border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {saving && (
        <p className="text-xs text-gray-400 text-center animate-pulse">Salvando...</p>
      )}
    </div>
  )
}

export type { OSAddress, OSContact }
export { emptyAddress, emptyContact }

export default OSAddressesContacts
