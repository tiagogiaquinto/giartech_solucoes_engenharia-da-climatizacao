import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, UserPlus, Building2, Search, Plus, FileEdit as Edit2, Trash2, Eye, Phone, Mail, MapPin, FileText, CheckCircle, XCircle, Filter, ChevronDown, ChevronUp, Star, Award, MoreVertical, X, Save, User, Briefcase, Hash, Calendar, Globe, MessageCircle, Building, Shield, AlertCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import CustomerModal from '../components/CustomerModal'
import { CnpjSearchField } from '../components/CnpjSearchField'

type TabType = 'clientes' | 'parceiros'
type PersonType = 'fisica' | 'juridica'

interface Customer {
  id: string
  tipo_pessoa: PersonType
  nome_razao: string
  nome_fantasia?: string
  cpf?: string
  cnpj?: string
  email?: string
  telefone?: string
  celular?: string
  whatsapp?: string
  observacoes?: string
  created_at: string
  _os_count?: number
  _contract_count?: number
}

interface Partner {
  id: string
  email: string
  full_name: string
  role: 'parceiro'
  document_cpf_cnpj?: string
  phone?: string
  is_active: boolean
  created_at: string
  linked_customer_id?: string
  _referral_count?: number
}

interface PartnerForm {
  full_name: string
  email: string
  document_cpf_cnpj: string
  phone: string
  password: string
  linked_customer_id: string
  is_active: boolean
}

const EMPTY_PARTNER: PartnerForm = {
  full_name: '',
  email: '',
  document_cpf_cnpj: '',
  phone: '',
  password: '',
  linked_customer_id: '',
  is_active: true
}

export default function CadastroClientesParceiros() {
  const [activeTab, setActiveTab] = useState<TabType>('clientes')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'fisica' | 'juridica'>('all')
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [editingCustomerId, setEditingCustomerId] = useState<string | undefined>()
  const [partnerModalOpen, setPartnerModalOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [partnerForm, setPartnerForm] = useState<PartnerForm>(EMPTY_PARTNER)
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [partnerError, setPartnerError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'customer' | 'partner'; id: string } | null>(null)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [allCustomers, setAllCustomers] = useState<{ id: string; nome_razao: string }[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<'nome_razao' | 'created_at'>('nome_razao')
  const [sortAsc, setSortAsc] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    await Promise.all([loadCustomers(), loadPartners(), loadAllCustomersList()])
    setLoading(false)
  }

  const loadCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('nome_razao')

    if (!data) return

    const ids = data.map(c => c.id)
    const [{ data: osData }, { data: contractData }] = await Promise.all([
      supabase.from('service_orders').select('customer_id').in('customer_id', ids),
      supabase.from('contracts').select('customer_id').in('customer_id', ids)
    ])

    const osCount: Record<string, number> = {}
    const contractCount: Record<string, number> = {}
    osData?.forEach(o => { osCount[o.customer_id] = (osCount[o.customer_id] || 0) + 1 })
    contractData?.forEach(c => { contractCount[c.customer_id] = (contractCount[c.customer_id] || 0) + 1 })

    setCustomers(data.map(c => ({
      ...c,
      _os_count: osCount[c.id] || 0,
      _contract_count: contractCount[c.id] || 0
    })))
  }

  const loadPartners = async () => {
    const { data } = await supabase
      .from('portal_accounts')
      .select('*')
      .eq('role', 'parceiro')
      .order('full_name')

    if (!data) return

    const ids = data.map(p => p.id)
    const { data: refData } = await supabase
      .from('partner_referrals')
      .select('portal_account_id')
      .in('portal_account_id', ids)

    const refCount: Record<string, number> = {}
    refData?.forEach(r => { refCount[r.portal_account_id] = (refCount[r.portal_account_id] || 0) + 1 })

    setPartners(data.map(p => ({ ...p, _referral_count: refCount[p.id] || 0 })))
  }

  const loadAllCustomersList = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, nome_razao')
      .order('nome_razao')
    setAllCustomers(data || [])
  }

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const handleOpenNewCustomer = () => {
    setEditingCustomerId(undefined)
    setCustomerModalOpen(true)
  }

  const handleOpenEditCustomer = (id: string) => {
    setEditingCustomerId(id)
    setCustomerModalOpen(true)
  }

  const handleCustomerSaved = async () => {
    setCustomerModalOpen(false)
    await loadCustomers()
    await loadAllCustomersList()
    showToast('Cliente salvo com sucesso!')
  }

  const handleDeleteCustomer = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) { showToast('Erro ao excluir cliente.', false); return }
    setDeleteConfirm(null)
    await loadCustomers()
    await loadAllCustomersList()
    showToast('Cliente excluído.')
  }

  const handleOpenNewPartner = () => {
    setEditingPartner(null)
    setPartnerForm(EMPTY_PARTNER)
    setPartnerError('')
    setPartnerModalOpen(true)
  }

  const handleOpenEditPartner = (p: Partner) => {
    setEditingPartner(p)
    setPartnerForm({
      full_name: p.full_name,
      email: p.email,
      document_cpf_cnpj: p.document_cpf_cnpj || '',
      phone: p.phone || '',
      password: '',
      linked_customer_id: p.linked_customer_id || '',
      is_active: p.is_active
    })
    setPartnerError('')
    setPartnerModalOpen(true)
  }

  const handleSavePartner = async () => {
    if (!partnerForm.full_name || !partnerForm.email) {
      setPartnerError('Nome e email são obrigatórios.')
      return
    }
    setPartnerLoading(true)
    setPartnerError('')
    try {
      if (editingPartner) {
        const upd: Record<string, unknown> = {
          full_name: partnerForm.full_name,
          document_cpf_cnpj: partnerForm.document_cpf_cnpj || null,
          phone: partnerForm.phone || null,
          is_active: partnerForm.is_active,
          linked_customer_id: partnerForm.linked_customer_id || null
        }
        const { error } = await supabase.from('portal_accounts').update(upd).eq('id', editingPartner.id)
        if (error) throw error
        showToast('Parceiro atualizado!')
      } else {
        if (!partnerForm.password || partnerForm.password.length < 6) {
          setPartnerError('Senha obrigatória (mínimo 6 caracteres).')
          setPartnerLoading(false)
          return
        }
        const { error } = await supabase.from('portal_accounts').insert([{
          full_name: partnerForm.full_name,
          email: partnerForm.email,
          password_hash: partnerForm.password,
          role: 'parceiro',
          document_cpf_cnpj: partnerForm.document_cpf_cnpj || null,
          phone: partnerForm.phone || null,
          is_active: partnerForm.is_active,
          linked_customer_id: partnerForm.linked_customer_id || null
        }])
        if (error) throw error
        showToast('Parceiro cadastrado!')
      }
      setPartnerModalOpen(false)
      await loadPartners()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar parceiro.'
      setPartnerError(msg.includes('duplicate') ? 'Email já cadastrado.' : msg)
    } finally {
      setPartnerLoading(false)
    }
  }

  const handleDeletePartner = async (id: string) => {
    const { error } = await supabase.from('portal_accounts').delete().eq('id', id)
    if (error) { showToast('Erro ao excluir parceiro.', false); return }
    setDeleteConfirm(null)
    await loadPartners()
    showToast('Parceiro excluído.')
  }

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSort = (field: 'nome_razao' | 'created_at') => {
    if (sortField === field) setSortAsc(a => !a)
    else { setSortField(field); setSortAsc(true) }
  }

  const filteredCustomers = customers
    .filter(c => {
      const q = search.toLowerCase()
      const match = c.nome_razao?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.cpf?.includes(q) ||
        c.cnpj?.includes(q) ||
        c.telefone?.includes(q)
      const typeMatch = filterType === 'all' || c.tipo_pessoa === filterType
      return match && typeMatch
    })
    .sort((a, b) => {
      const va = sortField === 'nome_razao' ? a.nome_razao : a.created_at
      const vb = sortField === 'nome_razao' ? b.nome_razao : b.created_at
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va)
    })

  const filteredPartners = partners.filter(p => {
    const q = search.toLowerCase()
    return p.full_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.document_cpf_cnpj?.includes(q) ||
      p.phone?.includes(q)
  })

  const stats = {
    totalClientes: customers.length,
    pf: customers.filter(c => c.tipo_pessoa === 'fisica').length,
    pj: customers.filter(c => c.tipo_pessoa === 'juridica').length,
    totalParceiros: partners.length,
    parceirosAtivos: partners.filter(p => p.is_active).length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
        >
          {toast.ok ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Cadastro de Clientes e Parceiros</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie clientes pessoas físicas, jurídicas e parceiros comerciais</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Clientes', value: stats.totalClientes, color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: <Users size={18} className="text-blue-500" /> },
            { label: 'Pessoa Física', value: stats.pf, color: 'bg-sky-50 border-sky-200', text: 'text-sky-700', icon: <User size={18} className="text-sky-500" /> },
            { label: 'Pessoa Jurídica', value: stats.pj, color: 'bg-teal-50 border-teal-200', text: 'text-teal-700', icon: <Building size={18} className="text-teal-500" /> },
            { label: 'Total Parceiros', value: stats.totalParceiros, color: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <Award size={18} className="text-amber-500" /> },
            { label: 'Parceiros Ativos', value: stats.parceirosAtivos, color: 'bg-green-50 border-green-200', text: 'text-green-700', icon: <CheckCircle size={18} className="text-green-500" /> }
          ].map(s => (
            <div key={s.label} className={`border rounded-xl p-3 ${s.color} flex items-center gap-3`}>
              <div className="shrink-0">{s.icon}</div>
              <div>
                <div className={`text-xl font-bold ${s.text}`}>{s.value}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 flex items-center justify-between px-4 py-3 gap-3 flex-wrap">
            <div className="flex gap-1">
              {(['clientes', 'parceiros'] as TabType[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSearch('') }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {tab === 'clientes' ? <span className="flex items-center gap-1.5"><Users size={14} />Clientes</span> : <span className="flex items-center gap-1.5"><Award size={14} />Parceiros</span>}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={activeTab === 'clientes' ? 'Buscar clientes...' : 'Buscar parceiros...'}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {activeTab === 'clientes' && (
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value as typeof filterType)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="fisica">Pessoa Física</option>
                  <option value="juridica">Pessoa Jurídica</option>
                </select>
              )}

              <button
                onClick={loadAll}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
                title="Atualizar"
              >
                <RefreshCw size={14} />
              </button>

              <button
                onClick={activeTab === 'clientes' ? handleOpenNewCustomer : handleOpenNewPartner}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={14} />
                {activeTab === 'clientes' ? 'Novo Cliente' : 'Novo Parceiro'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <RefreshCw size={22} className="animate-spin mr-2" />
              Carregando...
            </div>
          ) : activeTab === 'clientes' ? (
            <ClientesTable
              customers={filteredCustomers}
              onEdit={handleOpenEditCustomer}
              onDelete={id => setDeleteConfirm({ type: 'customer', id })}
              expandedRows={expandedRows}
              toggleExpand={toggleExpand}
              sortField={sortField}
              sortAsc={sortAsc}
              onSort={handleSort}
            />
          ) : (
            <ParceirosTable
              partners={filteredPartners}
              allCustomers={allCustomers}
              onEdit={handleOpenEditPartner}
              onDelete={id => setDeleteConfirm({ type: 'partner', id })}
            />
          )}
        </div>
      </div>

      <CustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSave={handleCustomerSaved}
        customerId={editingCustomerId}
      />

      <AnimatePresence>
        {partnerModalOpen && (
          <PartnerFormModal
            form={partnerForm}
            setForm={setPartnerForm}
            onSave={handleSavePartner}
            onClose={() => setPartnerModalOpen(false)}
            isEditing={!!editingPartner}
            loading={partnerLoading}
            error={partnerError}
            allCustomers={allCustomers}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirm && (
          <DeleteConfirmModal
            type={deleteConfirm.type}
            onConfirm={() => {
              if (deleteConfirm.type === 'customer') handleDeleteCustomer(deleteConfirm.id)
              else handleDeletePartner(deleteConfirm.id)
            }}
            onCancel={() => setDeleteConfirm(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ClientesTable({
  customers, onEdit, onDelete, expandedRows, toggleExpand, sortField, sortAsc, onSort
}: {
  customers: Customer[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  expandedRows: Set<string>
  toggleExpand: (id: string) => void
  sortField: 'nome_razao' | 'created_at'
  sortAsc: boolean
  onSort: (f: 'nome_razao' | 'created_at') => void
}) {
  if (customers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Users size={40} className="opacity-30" />
        <p className="text-sm">Nenhum cliente encontrado</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3 w-8"></th>
            <th className="px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => onSort('nome_razao')}>
              <span className="flex items-center gap-1">
                Nome / Razão Social
                {sortField === 'nome_razao' && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </span>
            </th>
            <th className="px-4 py-3">Tipo</th>
            <th className="px-4 py-3">Documento</th>
            <th className="px-4 py-3">Contato</th>
            <th className="px-4 py-3">OS</th>
            <th className="px-4 py-3">Contratos</th>
            <th className="px-4 py-3 cursor-pointer hover:text-gray-700" onClick={() => onSort('created_at')}>
              <span className="flex items-center gap-1">
                Cadastro
                {sortField === 'created_at' && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
              </span>
            </th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {customers.map(c => (
            <>
              <tr key={c.id} className="hover:bg-gray-50/70 transition-colors">
                <td className="px-4 py-3">
                  <button onClick={() => toggleExpand(c.id)} className="text-gray-400 hover:text-gray-600">
                    {expandedRows.has(c.id) ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${c.tipo_pessoa === 'fisica' ? 'bg-sky-100 text-sky-700' : 'bg-teal-100 text-teal-700'}`}>
                      {c.nome_razao?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{c.nome_razao}</div>
                      {c.nome_fantasia && <div className="text-xs text-gray-400">{c.nome_fantasia}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.tipo_pessoa === 'fisica' ? 'bg-sky-50 text-sky-700' : 'bg-teal-50 text-teal-700'}`}>
                    {c.tipo_pessoa === 'fisica' ? <User size={10} /> : <Building size={10} />}
                    {c.tipo_pessoa === 'fisica' ? 'Física' : 'Jurídica'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                  {c.tipo_pessoa === 'fisica' ? (c.cpf || '—') : (c.cnpj || '—')}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-0.5">
                    {c.email && <div className="flex items-center gap-1 text-xs text-gray-500"><Mail size={10} />{c.email}</div>}
                    {(c.telefone || c.celular) && <div className="flex items-center gap-1 text-xs text-gray-500"><Phone size={10} />{c.celular || c.telefone}</div>}
                    {!c.email && !c.telefone && !c.celular && <span className="text-gray-300 text-xs">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(c._os_count || 0) > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                    {c._os_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(c._contract_count || 0) > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {c._contract_count || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => onEdit(c.id)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="Editar">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(c.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors" title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
              {expandedRows.has(c.id) && (
                <tr key={`${c.id}-expand`} className="bg-blue-50/30">
                  <td colSpan={9} className="px-8 py-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                      {c.whatsapp && <div><span className="font-medium text-gray-400">WhatsApp:</span> {c.whatsapp}</div>}
                      {c.tipo_pessoa === 'juridica' && c.cnpj && <div><span className="font-medium text-gray-400">CNPJ:</span> {c.cnpj}</div>}
                      {c.tipo_pessoa === 'fisica' && c.rg && <div><span className="font-medium text-gray-400">RG:</span> {(c as any).rg}</div>}
                      {c.observacoes && <div className="col-span-2"><span className="font-medium text-gray-400">Obs:</span> {c.observacoes}</div>}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ParceirosTable({
  partners, allCustomers, onEdit, onDelete
}: {
  partners: Partner[]
  allCustomers: { id: string; nome_razao: string }[]
  onEdit: (p: Partner) => void
  onDelete: (id: string) => void
}) {
  if (partners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
        <Award size={40} className="opacity-30" />
        <p className="text-sm">Nenhum parceiro encontrado</p>
      </div>
    )
  }

  const getCustomerName = (id?: string) => {
    if (!id) return null
    return allCustomers.find(c => c.id === id)?.nome_razao
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Documento</th>
            <th className="px-4 py-3">Telefone</th>
            <th className="px-4 py-3">Cliente vinculado</th>
            <th className="px-4 py-3">Indicações</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Cadastro</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {partners.map(p => (
            <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {p.full_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{p.full_name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{p.email}</td>
              <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.document_cpf_cnpj || '—'}</td>
              <td className="px-4 py-3 text-gray-500 text-xs">{p.phone || '—'}</td>
              <td className="px-4 py-3">
                {getCustomerName(p.linked_customer_id) ? (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{getCustomerName(p.linked_customer_id)}</span>
                ) : <span className="text-gray-300 text-xs">—</span>}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${(p._referral_count || 0) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                  {p._referral_count || 0}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {p.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">
                {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1 justify-end">
                  <button onClick={() => onEdit(p)} className="p-1.5 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-lg transition-colors" title="Editar">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => onDelete(p.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors" title="Excluir">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PartnerFormModal({
  form, setForm, onSave, onClose, isEditing, loading, error, allCustomers
}: {
  form: PartnerForm
  setForm: (f: PartnerForm) => void
  onSave: () => void
  onClose: () => void
  isEditing: boolean
  loading: boolean
  error: string
  allCustomers: { id: string; nome_razao: string }[]
}) {
  const set = (key: keyof PartnerForm, val: string | boolean) =>
    setForm({ ...form, [key]: val })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Editar Parceiro' : 'Novo Parceiro'}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Parceiros têm acesso ao portal externo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo *</label>
              <input
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do parceiro"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                disabled={isEditing}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="email@empresa.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">CPF / CNPJ</label>
              <input
                value={form.document_cpf_cnpj}
                onChange={e => set('document_cpf_cnpj', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefone</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(11) 99999-9999"
              />
            </div>

            {!isEditing && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Senha de acesso ao portal *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Vincular a cliente</label>
              <select
                value={form.linked_customer_id}
                onChange={e => set('linked_customer_id', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhum (independente)</option>
                {allCustomers.map(c => (
                  <option key={c.id} value={c.id}>{c.nome_razao}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => set('is_active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-checked:bg-green-500 rounded-full peer-focus:ring-2 peer-focus:ring-green-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
              <span className="text-sm text-gray-600">Parceiro ativo</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {isEditing ? 'Salvar' : 'Cadastrar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function DeleteConfirmModal({
  type, onConfirm, onCancel
}: {
  type: 'customer' | 'partner'
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirmar exclusão</h3>
        <p className="text-sm text-gray-500 mb-6">
          Deseja excluir este {type === 'customer' ? 'cliente' : 'parceiro'}? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={onCancel} className="px-5 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-5 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium">
            Excluir
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
