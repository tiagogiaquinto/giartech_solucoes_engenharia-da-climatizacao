import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, User, Mail, Phone, MapPin, Briefcase, Calendar, DollarSign, FileText, Users, Building } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface EmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  employeeId?: string
}

const EmployeeModal = ({ isOpen, onClose, onSave, employeeId }: EmployeeModalProps) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'documentos' | 'contrato'>('dados')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    rg: '',
    email: '',
    phone: '',
    birth_date: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    position: '',
    department: '',
    admission_date: '',
    salary: '',
    contract_type: 'clt' as 'clt' | 'pj' | 'estagiario' | 'temporario',
    work_schedule: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
    active: true
  })

  useEffect(() => {
    if (employeeId) {
      loadEmployeeData()
    } else {
      resetForm()
    }
  }, [employeeId, isOpen])

  const loadEmployeeData = async () => {
    if (!employeeId) return

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .maybeSingle()

      if (employee) {
        setFormData({
          name: employee.name || '',
          cpf: employee.cpf || '',
          rg: employee.rg || '',
          email: employee.email || '',
          phone: employee.phone || '',
          birth_date: employee.birth_date || '',
          address: employee.address || '',
          city: employee.city || '',
          state: employee.state || '',
          zip_code: employee.zip_code || '',
          position: employee.position || '',
          department: employee.department || '',
          admission_date: employee.admission_date || '',
          salary: employee.salary || '',
          contract_type: employee.contract_type || 'clt',
          work_schedule: employee.work_schedule || '',
          emergency_contact_name: employee.emergency_contact_name || '',
          emergency_contact_phone: employee.emergency_contact_phone || '',
          notes: employee.notes || '',
          active: employee.active ?? true
        })
      }
    } catch (error) {
      console.error('Error loading employee:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      cpf: '',
      rg: '',
      email: '',
      phone: '',
      birth_date: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      position: '',
      department: '',
      admission_date: '',
      salary: '',
      contract_type: 'clt',
      work_schedule: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      notes: '',
      active: true
    })
  }

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.cpf) {
        alert('Nome e CPF são obrigatórios!')
        return
      }

      setLoading(true)

      const dataToSave = {
        name: formData.name,
        cpf: formData.cpf,
        rg: formData.rg || null,
        email: formData.email || null,
        phone: formData.phone || null,
        birth_date: formData.birth_date || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        position: formData.position || null,
        department: formData.department || null,
        admission_date: formData.admission_date || null,
        salary: formData.salary || null,
        contract_type: formData.contract_type,
        work_schedule: formData.work_schedule || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        notes: formData.notes || null,
        active: formData.active
      }

      if (employeeId) {
        const { error } = await supabase
          .from('employees')
          .update(dataToSave)
          .eq('id', employeeId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([dataToSave])
        if (error) throw error
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Erro ao salvar funcionário!')
    } finally {
      setLoading(false)
    }
  }

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{opacity: 0, scale: 0.95}}
        animate={{opacity: 1, scale: 1}}
        className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">{employeeId ? 'Editar Funcionário' : 'Novo Funcionário'}</h2>
            <p className="text-blue-100 text-sm">Cadastro completo de colaboradores</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex border-b bg-gray-50">
          {[
            { id: 'dados', label: 'Dados Pessoais', icon: User },
            { id: 'documentos', label: 'Documentos', icon: FileText },
            { id: 'contrato', label: 'Contrato', icon: Briefcase }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dados' && (
              <motion.div
                key="dados"
                initial={{opacity: 0, x: -20}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: 20}}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome completo do funcionário"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      CPF *
                    </label>
                    <input
                      type="text"
                      value={formData.cpf}
                      maxLength={14}
                      onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      RG
                    </label>
                    <input
                      type="text"
                      value={formData.rg}
                      onChange={(e) => setFormData({...formData, rg: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00.000.000-0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="email@exemplo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.zip_code}
                      maxLength={9}
                      onChange={(e) => setFormData({...formData, zip_code: formatCEP(e.target.value)})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="00000-000"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Rua, número, complemento"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      Estado
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      maxLength={2}
                      onChange={(e) => setFormData({...formData, state: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SP"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'documentos' && (
              <motion.div
                key="documentos"
                initial={{opacity: 0, x: -20}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: 20}}
                className="space-y-6"
              >
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Os documentos são armazenados de forma segura e podem ser anexados através do módulo de gestão de documentos.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      Contato de Emergência
                    </label>
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nome do contato"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      Telefone de Emergência
                    </label>
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Observações
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Informações adicionais sobre o funcionário"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'contrato' && (
              <motion.div
                key="contrato"
                initial={{opacity: 0, x: -20}}
                animate={{opacity: 1, x: 0}}
                exit={{opacity: 0, x: 20}}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      Cargo
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Técnico, Gerente, etc"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Operacional, Administrativo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Data de Admissão
                    </label>
                    <input
                      type="date"
                      value={formData.admission_date}
                      onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Tipo de Contrato
                    </label>
                    <select
                      value={formData.contract_type}
                      onChange={(e) => setFormData({...formData, contract_type: e.target.value as any})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="clt">CLT</option>
                      <option value="pj">PJ</option>
                      <option value="estagiario">Estagiário</option>
                      <option value="temporario">Temporário</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      Salário
                    </label>
                    <input
                      type="text"
                      value={formData.salary}
                      onChange={(e) => setFormData({...formData, salary: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="R$ 0,00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      Horário de Trabalho
                    </label>
                    <input
                      type="text"
                      value={formData.work_schedule}
                      onChange={(e) => setFormData({...formData, work_schedule: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 08:00 - 17:00"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({...formData, active: e.target.checked})}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">Funcionário Ativo</span>
                    </label>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Funcionário
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default EmployeeModal
