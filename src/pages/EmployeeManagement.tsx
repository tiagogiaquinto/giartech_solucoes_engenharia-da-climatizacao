import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Search, Edit2, Trash2, Mail, Phone, Briefcase, UserCheck, UserX, X, Save, User, MapPin, CreditCard, Car, AlertTriangle, FileText } from 'lucide-react'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, type Employee, type EmployeeDocument } from '../lib/database-services'
import { EmployeeDocumentUpload } from '../components/EmployeeDocumentUpload'
import { maskCPF, maskPhone, maskCEP, validateCPF, validateEmail, unmask } from '../utils/masks'

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [activeTab, setActiveTab] = useState<'personal' | 'address' | 'bank' | 'license' | 'emergency' | 'documents'>('personal')
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [loadingCEP, setLoadingCEP] = useState(false)

  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    email: '',
    phone: '',
    role: '',
    salary: 0,
    active: true,
    cpf: '',
    rg: '',
    birth_date: '',
    admission_date: '',
    department: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zip_code: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: 'checking',
    pix_key: '',
    driver_license_number: '',
    driver_license_category: '',
    driver_license_expiry: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  })

  useEffect(() => {
    loadEmployees()
  }, [])

  const loadEmployees = async () => {
    try {
      setLoading(true)
      const data = await getEmployees()
      setEmployees(data)
    } catch (error) {
      console.error('Error loading employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee)
      setFormData(employee)
    } else {
      setEditingEmployee(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        salary: 0,
        active: true,
        cpf: '',
        rg: '',
        birth_date: '',
        admission_date: '',
        department: '',
        address_street: '',
        address_number: '',
        address_complement: '',
        address_neighborhood: '',
        address_city: '',
        address_state: '',
        address_zip_code: '',
        bank_name: '',
        bank_agency: '',
        bank_account: '',
        bank_account_type: 'checking',
        pix_key: '',
        driver_license_number: '',
        driver_license_category: '',
        driver_license_expiry: '',
        emergency_contact_name: '',
        emergency_contact_phone: ''
      })
      setDocuments([])
    }
    setActiveTab('personal')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEmployee(null)
    setDocuments([])
  }

  const handleCEPSearch = async (cep: string) => {
    const cleanCEP = unmask(cep)
    if (cleanCEP.length !== 8) return

    setLoadingCEP(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address_street: data.logradouro || prev.address_street,
          address_neighborhood: data.bairro || prev.address_neighborhood,
          address_city: data.localidade || prev.address_city,
          address_state: data.uf || prev.address_state
        }))
      }
    } catch (error) {
      console.error('Error fetching CEP:', error)
    } finally {
      setLoadingCEP(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      alert('Por favor, preencha o nome do funcionário')
      return
    }

    if (formData.cpf && !validateCPF(formData.cpf)) {
      alert('CPF inválido')
      return
    }

    if (formData.email && !validateEmail(formData.email)) {
      alert('E-mail inválido')
      return
    }

    try {
      const dataToSave = {
        ...formData,
        cpf: formData.cpf ? unmask(formData.cpf) : undefined,
        phone: formData.phone ? unmask(formData.phone) : undefined,
        address_zip_code: formData.address_zip_code ? unmask(formData.address_zip_code) : undefined,
        emergency_contact_phone: formData.emergency_contact_phone ? unmask(formData.emergency_contact_phone) : undefined,
        birth_date: formData.birth_date || null,
        admission_date: formData.admission_date || null,
        driver_license_expiry: formData.driver_license_expiry || null
      }

      if (editingEmployee?.id) {
        await updateEmployee(editingEmployee.id, dataToSave)
      } else {
        await createEmployee(dataToSave as Employee)
      }
      await loadEmployees()
      handleCloseModal()
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Erro ao salvar funcionário')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar este funcionário?')) return

    try {
      await deleteEmployee(id)
      await loadEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
      alert('Erro ao desativar funcionário')
    }
  }

  const handleDocumentAdd = (doc: Omit<EmployeeDocument, 'id' | 'employee_id'>) => {
    setDocuments(prev => [...prev, { ...doc, id: Date.now().toString(), employee_id: editingEmployee?.id || 'temp' }])
  }

  const handleDocumentRemove = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.cpf?.includes(searchTerm) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const tabs = [
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'address', label: 'Endereço', icon: MapPin },
    { id: 'bank', label: 'Dados Bancários', icon: CreditCard },
    { id: 'license', label: 'CNH', icon: Car },
    { id: 'emergency', label: 'Emergência', icon: AlertTriangle },
    { id: 'documents', label: 'Documentos', icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Gerenciamento de Funcionários
            </h1>
            <p className="text-gray-600 mt-2">Gerencie a equipe da sua empresa</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Novo Funcionário
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, CPF, departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Carregando funcionários...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredEmployees.map(employee => (
                <motion.div
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                        {employee.role && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <Briefcase className="h-3 w-3" />
                            <span>{employee.role}</span>
                          </div>
                        )}
                        {employee.department && (
                          <div className="text-xs text-gray-500 mt-1">{employee.department}</div>
                        )}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      employee.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {employee.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                    )}
                    {employee.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{maskPhone(employee.phone)}</span>
                      </div>
                    )}
                    {employee.cpf && (
                      <div className="text-xs text-gray-500">
                        CPF: {maskCPF(employee.cpf)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(employee)}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => employee.id && handleDelete(employee.id)}
                      className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
                  </h2>
                  <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex border-b border-gray-200 overflow-x-auto">
                  {tabs.map(tab => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                          activeTab === tab.id
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                  {activeTab === 'personal' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Pessoais</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Completo *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CPF
                          </label>
                          <input
                            type="text"
                            value={formData.cpf ? maskCPF(formData.cpf) : ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, cpf: unmask(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="000.000.000-00"
                            maxLength={14}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            RG
                          </label>
                          <input
                            type="text"
                            value={formData.rg || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, rg: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Nascimento
                          </label>
                          <input
                            type="date"
                            value={formData.birth_date || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, birth_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Admissão
                          </label>
                          <input
                            type="date"
                            value={formData.admission_date || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, admission_date: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            E-mail
                          </label>
                          <input
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone
                          </label>
                          <input
                            type="text"
                            value={formData.phone ? maskPhone(formData.phone) : ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: unmask(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cargo
                          </label>
                          <input
                            type="text"
                            value={formData.role || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Técnico, Supervisor..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Departamento
                          </label>
                          <input
                            type="text"
                            value={formData.department || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Manutenção, Instalação..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Salário (R$)
                          </label>
                          <input
                            type="number"
                            value={formData.salary || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            step="0.01"
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={formData.active ? 'true' : 'false'}
                            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.value === 'true' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="true">Ativo</option>
                            <option value="false">Inativo</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'address' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço Residencial</h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            CEP
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={formData.address_zip_code ? maskCEP(formData.address_zip_code) : ''}
                              onChange={(e) => {
                                const cep = unmask(e.target.value)
                                setFormData(prev => ({ ...prev, address_zip_code: cep }))
                                if (cep.length === 8) handleCEPSearch(cep)
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="00000-000"
                              maxLength={9}
                            />
                            {loadingCEP && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rua
                          </label>
                          <input
                            type="text"
                            value={formData.address_street || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número
                          </label>
                          <input
                            type="text"
                            value={formData.address_number || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Complemento
                          </label>
                          <input
                            type="text"
                            value={formData.address_complement || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, address_complement: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Apto, bloco, casa..."
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Bairro
                          </label>
                          <input
                            type="text"
                            value={formData.address_neighborhood || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, address_neighborhood: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                          </label>
                          <select
                            value={formData.address_state || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, address_state: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cidade
                          </label>
                          <input
                            type="text"
                            value={formData.address_city || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'bank' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações Bancárias</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Banco
                          </label>
                          <input
                            type="text"
                            value={formData.bank_name || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Banco do Brasil, Caixa Econômica..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Agência
                          </label>
                          <input
                            type="text"
                            value={formData.bank_agency || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, bank_agency: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="0000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Conta
                          </label>
                          <input
                            type="text"
                            value={formData.bank_account || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, bank_account: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="00000-0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo de Conta
                          </label>
                          <select
                            value={formData.bank_account_type || 'checking'}
                            onChange={(e) => setFormData(prev => ({ ...prev, bank_account_type: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="checking">Conta Corrente</option>
                            <option value="savings">Conta Poupança</option>
                            <option value="salary">Conta Salário</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chave PIX
                          </label>
                          <input
                            type="text"
                            value={formData.pix_key || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, pix_key: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="CPF, e-mail, telefone ou chave aleatória"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'license' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Carteira de Habilitação (CNH)</h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Número da CNH
                          </label>
                          <input
                            type="text"
                            value={formData.driver_license_number || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, driver_license_number: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="00000000000"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoria
                          </label>
                          <select
                            value={formData.driver_license_category || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, driver_license_category: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione</option>
                            <option value="A">A - Moto</option>
                            <option value="B">B - Carro</option>
                            <option value="C">C - Caminhão</option>
                            <option value="D">D - Ônibus</option>
                            <option value="E">E - Carreta</option>
                            <option value="AB">AB - Moto e Carro</option>
                            <option value="AC">AC - Moto e Caminhão</option>
                            <option value="AD">AD - Moto e Ônibus</option>
                            <option value="AE">AE - Moto e Carreta</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Validade
                          </label>
                          <input
                            type="date"
                            value={formData.driver_license_expiry || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, driver_license_expiry: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'emergency' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contato de Emergência</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Contato
                          </label>
                          <input
                            type="text"
                            value={formData.emergency_contact_name || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Nome completo"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Telefone do Contato
                          </label>
                          <input
                            type="text"
                            value={formData.emergency_contact_phone ? maskPhone(formData.emergency_contact_phone) : ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact_phone: unmask(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                          />
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                        <div className="flex gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-yellow-900">Informação Importante</p>
                            <p className="text-sm text-yellow-700 mt-1">
                              Este contato será acionado em caso de emergências envolvendo o funcionário.
                              Certifique-se de que os dados estão corretos e atualizados.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'documents' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentos Anexados</h3>
                      <EmployeeDocumentUpload
                        employeeId={editingEmployee?.id}
                        documents={documents}
                        onDocumentAdd={handleDocumentAdd}
                        onDocumentRemove={handleDocumentRemove}
                      />
                    </div>
                  )}
                </form>

                <div className="flex gap-3 p-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Salvar Funcionário
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default EmployeeManagement
