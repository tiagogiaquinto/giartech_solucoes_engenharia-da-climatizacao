import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, CreditCard as Edit, Trash2, Search, UserCheck, DollarSign, X, Check, MapPin, Phone, Mail, Briefcase, CreditCard, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DocumentUpload } from '../components/DocumentUpload'

interface Staff {
  id: string
  nome: string
  cargo: string
  data_nascimento?: string
  rg?: string
  cpf?: string
  estado_civil?: string
  nome_mae?: string
  telefone?: string
  email?: string
  telefone_emergencia?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  salario_mensal: number
  salario_quinzenal: number
  salario_semanal: number
  salario_diario: number
  salario_hora: number
  dias_mes: number
  horas_dia: number
  banco?: string
  agencia?: string
  conta?: string
  pix?: string
  doc_rg_url?: string
  doc_cpf_url?: string
  doc_comprovante_endereco_url?: string
  doc_cnh_url?: string
  status: string
  created_at: string
}

const StaffManagement = () => {
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [activeTab, setActiveTab] = useState<'pessoal' | 'endereco' | 'salario' | 'banco' | 'documentos'>('pessoal')
  const [formData, setFormData] = useState({
    nome: '', cargo: '', data_nascimento: '', rg: '', cpf: '', estado_civil: '', nome_mae: '',
    telefone: '', email: '', telefone_emergencia: '', endereco: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', cep: '', salario_mensal: 0, dias_mes: 22, horas_dia: 8,
    banco: '', agencia: '', conta: '', pix: ''
  })

  useEffect(() => { loadStaff() }, [])

  const loadStaff = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('staff').select('*').order('nome')
      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.nome || !formData.cargo) {
        alert('Nome e Cargo são obrigatórios!')
        return
      }
      if (editingStaff) {
        const { error } = await supabase.from('staff').update(formData).eq('id', editingStaff.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('staff').insert([formData])
        if (error) throw error
      }
      setShowModal(false)
      setEditingStaff(null)
      resetForm()
      loadStaff()
    } catch (error) {
      console.error('Error:', error)
      alert('Erro ao salvar funcionário!')
    }
  }

  const handleEdit = (member: Staff) => {
    setEditingStaff(member)
    setFormData({
      nome: member.nome, cargo: member.cargo, data_nascimento: member.data_nascimento || '',
      rg: member.rg || '', cpf: member.cpf || '', estado_civil: member.estado_civil || '',
      nome_mae: member.nome_mae || '', telefone: member.telefone || '', email: member.email || '',
      telefone_emergencia: member.telefone_emergencia || '', endereco: member.endereco || '',
      numero: member.numero || '', complemento: member.complemento || '', bairro: member.bairro || '',
      cidade: member.cidade || '', estado: member.estado || '', cep: member.cep || '',
      salario_mensal: Number(member.salario_mensal), dias_mes: member.dias_mes, horas_dia: Number(member.horas_dia),
      banco: member.banco || '', agencia: member.agencia || '', conta: member.conta || '',
      pix: member.pix || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir funcionário?')) return
    try {
      const { error } = await supabase.from('staff').delete().eq('id', id)
      if (error) throw error
      loadStaff()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '', cargo: '', data_nascimento: '', rg: '', cpf: '', estado_civil: '', nome_mae: '',
      telefone: '', email: '', telefone_emergencia: '', endereco: '', numero: '', complemento: '',
      bairro: '', cidade: '', estado: '', cep: '', salario_mensal: 0, dias_mes: 22, horas_dia: 8,
      banco: '', agencia: '', conta: '', pix: ''
    })
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  const filteredStaff = staff.filter(m => m.nome.toLowerCase().includes(searchTerm.toLowerCase()) || m.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
  const stats = {
    totalAtivos: staff.filter(s => s.status === 'active' || s.status === 'ativo').length,
    custoTotal: staff.filter(s => s.status === 'active' || s.status === 'ativo').reduce((sum, s) => sum + Number(s.salario_mensal), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-8 w-8 text-blue-600" />
            Gestão Completa de Funcionários
          </h1>
          <p className="text-gray-600 mt-1">Cadastro completo com documentos e dados bancários</p>
        </div>
        <button onClick={() => { setEditingStaff(null); resetForm(); setShowModal(true) }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Plus className="h-4 w-4" />Novo Funcionário
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg"><UserCheck className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Funcionários Ativos</p>
              <p className="text-2xl font-bold">{stats.totalAtivos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg"><DollarSign className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-600">Custo Total Mensal</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.custoTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <motion.div key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-6 rounded-xl border-2 bg-white hover:border-gray-300 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{member.nome}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />{member.cargo}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${member.status === 'active' || member.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                  {member.status === 'active' || member.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="space-y-2 mb-4 text-sm">
                {member.telefone && <div className="flex items-center gap-2 text-gray-600"><Phone className="h-3 w-3" />{member.telefone}</div>}
                {member.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="h-3 w-3" /><span className="truncate">{member.email}</span></div>}
                <div className="pt-2 border-t">
                  <p className="text-gray-500 text-xs">Salário Mensal</p>
                  <p className="font-bold">{formatCurrency(Number(member.salario_mensal))}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><p className="text-gray-500">Quinzenal</p><p className="font-semibold">{formatCurrency(Number(member.salario_quinzenal))}</p></div>
                  <div><p className="text-gray-500">Por Hora</p><p className="font-semibold">{formatCurrency(Number(member.salario_hora))}</p></div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(member)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm flex items-center justify-center gap-1">
                  <Edit className="h-4 w-4" />Editar
                </button>
                <button onClick={() => handleDelete(member.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {filteredStaff.length === 0 && <div className="text-center py-12"><Users className="h-16 w-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-600">Nenhum funcionário encontrado</p></div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editingStaff ? 'Editar' : 'Novo'} Funcionário</h2>
              <button onClick={() => { setShowModal(false); setEditingStaff(null) }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-6 border-b overflow-x-auto">
              {[
                { id: 'pessoal', label: 'Pessoal', icon: Users },
                { id: 'endereco', label: 'Endereço', icon: MapPin },
                { id: 'salario', label: 'Salário', icon: DollarSign },
                { id: 'banco', label: 'Banco', icon: CreditCard },
                { id: 'documentos', label: 'Documentos', icon: FileText }
              ].map(tab => {
                const Icon = tab.icon
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 font-medium text-sm flex items-center gap-2 border-b-2 whitespace-nowrap ${
                      activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
                    }`}>
                    <Icon className="h-4 w-4" />{tab.label}
                  </button>
                )
              })}
            </div>

            <div className="space-y-4 mb-6">
              {activeTab === 'pessoal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                    <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="João da Silva" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cargo *</label>
                    <input type="text" value={formData.cargo} onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Técnico" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Data Nascimento</label>
                    <input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">RG</label>
                    <input type="text" value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="00.000.000-0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CPF</label>
                    <input type="text" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado Civil</label>
                    <select value={formData.estado_civil} onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecione</option>
                      <option value="Solteiro">Solteiro(a)</option>
                      <option value="Casado">Casado(a)</option>
                      <option value="Divorciado">Divorciado(a)</option>
                      <option value="Viúvo">Viúvo(a)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Nome da Mãe</label>
                    <input type="text" value={formData.nome_mae} onChange={(e) => setFormData({ ...formData, nome_mae: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <input type="text" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@exemplo.com" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Telefone Emergência</label>
                    <input type="text" value={formData.telefone_emergencia} onChange={(e) => setFormData({ ...formData, telefone_emergencia: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="(00) 00000-0000" />
                  </div>
                </div>
              )}

              {activeTab === 'endereco' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Endereço</label>
                    <input type="text" value={formData.endereco} onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Rua, Avenida..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Número</label>
                    <input type="text" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Complemento</label>
                    <input type="text" value={formData.complemento} onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Apto, Sala..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bairro</label>
                    <input type="text" value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cidade</label>
                    <input type="text" value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Estado</label>
                    <input type="text" value={formData.estado} onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="SP" maxLength={2} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">CEP</label>
                    <input type="text" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="00000-000" />
                  </div>
                </div>
              )}

              {activeTab === 'salario' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Salário Mensal *</label>
                    <input type="number" value={formData.salario_mensal || ''} onChange={(e) => setFormData({ ...formData, salario_mensal: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" step="0.01" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dias/Mês</label>
                    <input type="number" value={formData.dias_mes} onChange={(e) => setFormData({ ...formData, dias_mes: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Horas/Dia</label>
                    <input type="number" value={formData.horas_dia} onChange={(e) => setFormData({ ...formData, horas_dia: Number(e.target.value) })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" step="0.1" />
                  </div>
                  <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">Cálculos Automáticos:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-blue-700">Quinzenal:</p><p className="font-bold text-blue-900">{formatCurrency(formData.salario_mensal / 2)}</p></div>
                      <div><p className="text-blue-700">Semanal:</p><p className="font-bold text-blue-900">{formatCurrency((formData.salario_mensal / formData.dias_mes) * 6)}</p></div>
                      <div><p className="text-blue-700">Diário:</p><p className="font-bold text-blue-900">{formatCurrency(formData.salario_mensal / formData.dias_mes)}</p></div>
                      <div><p className="text-blue-700">Hora:</p><p className="font-bold text-blue-900">{formatCurrency(formData.salario_mensal / (formData.dias_mes * formData.horas_dia))}</p></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'banco' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Banco</label>
                    <input type="text" value={formData.banco} onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Nome do Banco" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Agência</label>
                    <input type="text" value={formData.agencia} onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="0000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Conta</label>
                    <input type="text" value={formData.conta} onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="00000-0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Chave PIX</label>
                    <input type="text" value={formData.pix} onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="CPF, Email ou Celular" />
                  </div>
                </div>
              )}

              {activeTab === 'documentos' && editingStaff && (
                <div className="space-y-4">
                  <DocumentUpload staffId={editingStaff.id} documentType="rg" currentUrl={editingStaff.doc_rg_url}
                    onUploadComplete={() => loadStaff()} label="RG - Registro Geral" />
                  <DocumentUpload staffId={editingStaff.id} documentType="cpf" currentUrl={editingStaff.doc_cpf_url}
                    onUploadComplete={() => loadStaff()} label="CPF - Cadastro de Pessoa Física" />
                  <DocumentUpload staffId={editingStaff.id} documentType="comprovante_endereco" currentUrl={editingStaff.doc_comprovante_endereco_url}
                    onUploadComplete={() => loadStaff()} label="Comprovante de Endereço" />
                  <DocumentUpload staffId={editingStaff.id} documentType="cnh" currentUrl={editingStaff.doc_cnh_url}
                    onUploadComplete={() => loadStaff()} label="CNH - Carteira Nacional de Habilitação" />
                </div>
              )}

              {activeTab === 'documentos' && !editingStaff && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Salve o funcionário primeiro para fazer upload de documentos</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <input type="checkbox" id="ativo" checked={true} disabled readOnly
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                <label htmlFor="ativo" className="text-sm font-medium">Funcionário ativo</label>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowModal(false); setEditingStaff(null) }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">Cancelar</button>
              <button onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />Salvar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default StaffManagement
