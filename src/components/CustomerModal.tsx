import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Plus, Trash2, User, Building, MapPin, Phone, Mail, Users, Briefcase, Package, Calendar, CircleAlert as AlertCircle, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { CnpjSearchField } from './CnpjSearchField'

interface Address {
  id: string
  tipo: 'comercial' | 'residencial' | 'filial' | 'outro'
  nome_identificacao: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  principal: boolean
}

interface Contact {
  id: string
  nome: string
  cargo: string
  email: string
  telefone: string
  celular: string
  departamento: string
  principal: boolean
  recebe_notificacoes: boolean
}

interface Equipment {
  id: string
  customer_address_id: string
  tipo_equipamento: string
  marca: string
  modelo: string
  numero_serie: string
  capacidade: string
  data_instalacao: string
}

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  customerId?: string
}

const CustomerModal = ({ isOpen, onClose, onSave, customerId }: CustomerModalProps) => {
  const [activeTab, setActiveTab] = useState<'dados' | 'enderecos' | 'contatos' | 'equipamentos'>('dados')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    tipo_pessoa: 'fisica' as 'fisica' | 'juridica',
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
    observacoes: ''
  })

  const [addresses, setAddresses] = useState<Address[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [equipments, setEquipments] = useState<Equipment[]>([])

  useEffect(() => {
    if (customerId) {
      loadCustomerData()
    }
  }, [customerId])

  const loadCustomerData = async () => {
    if (!customerId) return

    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()

      if (customer) {
        setFormData({
          tipo_pessoa: customer.tipo_pessoa || 'fisica',
          nome_razao: customer.nome_razao || '',
          nome_fantasia: customer.nome_fantasia || '',
          cpf: customer.cpf || '',
          rg: customer.rg || '',
          cnpj: customer.cnpj || '',
          inscricao_estadual: customer.inscricao_estadual || '',
          inscricao_municipal: customer.inscricao_municipal || '',
          data_nascimento: customer.data_nascimento || '',
          data_fundacao: customer.data_fundacao || '',
          email: customer.email || '',
          telefone: customer.telefone || '',
          celular: customer.celular || '',
          observacoes: customer.observacoes || ''
        })
      }

      const { data: addrs } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', customerId)

      const { data: conts } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', customerId)

      const { data: equips } = await supabase
        .from('customer_equipment')
        .select('*')
        .eq('customer_id', customerId)

      setAddresses(addrs || [])
      setContacts(conts || [])
      setEquipments(equips || [])
    } catch (error) {
      console.error('Error loading customer:', error)
    }
  }

  const handleSave = async () => {
    try {
      if (!formData.nome_razao) {
        alert('Nome/Razão Social é obrigatório!')
        return
      }

      setLoading(true)

      let customerIdToUse = customerId

      const dataToSave = {
        nome_razao: formData.nome_razao,
        tipo_pessoa: formData.tipo_pessoa || 'fisica',
        cpf: formData.cpf || null,
        cnpj: formData.cnpj || null,
        rg: formData.rg || null,
        email: formData.email || null,
        telefone: formData.telefone || null,
        celular: formData.celular || null,
        inscricao_estadual: formData.inscricao_estadual || null,
        inscricao_municipal: formData.inscricao_municipal || null,
        nome_fantasia: formData.nome_fantasia || null,
        data_nascimento: formData.data_nascimento || null,
        data_fundacao: formData.data_fundacao || null,
        observacoes: formData.observacoes || null
      }

      if (customerId) {
        const { error } = await supabase
          .from('customers')
          .update(dataToSave)
          .eq('id', customerId)

        if (error) {
          console.error('Error updating customer:', error)
          throw error
        }
      } else {
        const { data, error } = await supabase
          .from('customers')
          .insert([dataToSave])
          .select()
          .single()

        if (error) {
          console.error('Error inserting customer:', error)
          alert(`Erro ao salvar cliente: ${error.message}`)
          throw error
        }
        customerIdToUse = data.id
      }

      for (const addr of addresses) {
        if (addr.id.startsWith('new-')) {
          console.log('🔍 ENDEREÇO ORIGINAL:', JSON.stringify(addr, null, 2))

          const { data, error } = await supabase.rpc('insert_customer_address', {
            p_customer_id: customerIdToUse,
            p_tipo: addr.tipo || 'comercial',
            p_nome_identificacao: addr.nome_identificacao || '',
            p_cep: addr.cep || '',
            p_logradouro: addr.logradouro || '',
            p_numero: addr.numero || '',
            p_complemento: addr.complemento || '',
            p_bairro: addr.bairro || '',
            p_cidade: addr.cidade || '',
            p_estado: addr.estado || '',
            p_principal: addr.principal || false
          })

          if (error) {
            console.error('❌ ERRO ao inserir endereço:', error)
            alert(`Erro ao salvar endereço: ${error.message}`)
            throw error
          }
        } else {
          const { error } = await supabase.rpc('update_customer_address', {
            p_id: addr.id,
            p_tipo: addr.tipo || 'comercial',
            p_nome_identificacao: addr.nome_identificacao || '',
            p_cep: addr.cep || '',
            p_logradouro: addr.logradouro || '',
            p_numero: addr.numero || '',
            p_complemento: addr.complemento || '',
            p_bairro: addr.bairro || '',
            p_cidade: addr.cidade || '',
            p_estado: addr.estado || '',
            p_principal: addr.principal || false
          })

          if (error) {
            console.error('❌ ERRO ao atualizar endereço:', error)
            alert(`Erro ao atualizar endereço: ${error.message}`)
            throw error
          }
        }
      }

      for (const contact of contacts) {
        if (contact.id.startsWith('new-')) {
          const dataToInsert = {
            customer_id: customerIdToUse,
            nome: String(contact.nome || ''),
            cargo: String(contact.cargo || ''),
            email: String(contact.email || ''),
            telefone: String(contact.telefone || ''),
            celular: String(contact.celular || ''),
            departamento: String(contact.departamento || ''),
            principal: Boolean(contact.principal),
            recebe_notificacoes: contact.recebe_notificacoes !== undefined ? Boolean(contact.recebe_notificacoes) : true
          }
          const { error } = await supabase
            .from('customer_contacts')
            .insert([dataToInsert])
          if (error) {
            console.error('❌ ERRO ao inserir contato:', error)
            throw error
          }
        } else {
          const dataToUpdate = {
            nome: String(contact.nome || ''),
            cargo: String(contact.cargo || ''),
            email: String(contact.email || ''),
            telefone: String(contact.telefone || ''),
            celular: String(contact.celular || ''),
            departamento: String(contact.departamento || ''),
            principal: Boolean(contact.principal),
            recebe_notificacoes: contact.recebe_notificacoes !== undefined ? Boolean(contact.recebe_notificacoes) : true
          }
          const { error } = await supabase
            .from('customer_contacts')
            .update(dataToUpdate)
            .eq('id', contact.id)
          if (error) {
            console.error('❌ ERRO ao atualizar contato:', error)
            throw error
          }
        }
      }

      for (const equip of equipments) {
        if (equip.id.startsWith('new-')) {
          const dataToInsert = {
            customer_id: customerIdToUse,
            customer_address_id: equip.customer_address_id || null,
            tipo_equipamento: String(equip.tipo_equipamento || ''),
            marca: String(equip.marca || ''),
            modelo: String(equip.modelo || ''),
            numero_serie: String(equip.numero_serie || ''),
            capacidade: String(equip.capacidade || ''),
            data_instalacao: equip.data_instalacao || null
          }
          const { error } = await supabase
            .from('customer_equipment')
            .insert([dataToInsert])
          if (error) {
            console.error('❌ ERRO ao inserir equipamento:', error)
            throw error
          }
        } else {
          const dataToUpdate = {
            customer_address_id: equip.customer_address_id || null,
            tipo_equipamento: String(equip.tipo_equipamento || ''),
            marca: String(equip.marca || ''),
            modelo: String(equip.modelo || ''),
            numero_serie: String(equip.numero_serie || ''),
            capacidade: String(equip.capacidade || ''),
            data_instalacao: equip.data_instalacao || null
          }
          const { error } = await supabase
            .from('customer_equipment')
            .update(dataToUpdate)
            .eq('id', equip.id)
          if (error) {
            console.error('❌ ERRO ao atualizar equipamento:', error)
            throw error
          }
        }
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Erro ao salvar cliente!')
    } finally {
      setLoading(false)
    }
  }

  const addAddress = () => {
    setAddresses([...addresses, {
      id: `new-${Date.now()}`,
      tipo: 'comercial',
      nome_identificacao: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      principal: addresses.length === 0
    }])
  }

  const addContact = () => {
    setContacts([...contacts, {
      id: `new-${Date.now()}`,
      nome: '',
      cargo: '',
      email: '',
      telefone: '',
      celular: '',
      departamento: '',
      principal: contacts.length === 0,
      recebe_notificacoes: true
    }])
  }

  const addEquipment = () => {
    setEquipments([...equipments, {
      id: `new-${Date.now()}`,
      customer_address_id: addresses[0]?.id || '',
      tipo_equipamento: '',
      marca: '',
      modelo: '',
      numero_serie: '',
      capacidade: '',
      data_instalacao: ''
    }])
  }

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatCNPJ = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatCEP = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const handleCnpjDataFilled = (data: {
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
  }) => {
    setFormData({
      ...formData,
      nome_razao: data.razao_social || formData.nome_razao,
      nome_fantasia: data.nome_fantasia || formData.nome_fantasia,
      email: data.email || formData.email,
      telefone: data.telefone || formData.telefone
    })

    if (data.logradouro && data.cidade && data.estado) {
      const novoEndereco = {
        id: `new-${Date.now()}`,
        tipo: 'comercial' as const,
        nome_identificacao: 'Sede',
        cep: data.cep || '',
        logradouro: data.logradouro || '',
        numero: data.numero || '',
        complemento: data.complemento || '',
        bairro: data.bairro || '',
        cidade: data.cidade || '',
        estado: data.estado || '',
        principal: addresses.length === 0
      }

      setAddresses([...addresses, novoEndereco])
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}}
        className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">{customerId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            <p className="text-blue-100 text-sm">Cadastro completo com endereços, contatos e equipamentos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex border-b bg-gray-50">
          {[
            { id: 'dados', label: 'Dados Principais', icon: User },
            { id: 'enderecos', label: 'Endereços', icon: MapPin },
            { id: 'contatos', label: 'Contatos', icon: Users },
            { id: 'equipamentos', label: 'Equipamentos', icon: Package }
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dados' && (
              <motion.div key="dados" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-6">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.tipo_pessoa === 'fisica'}
                      onChange={() => setFormData({...formData, tipo_pessoa: 'fisica'})}
                      className="w-4 h-4" />
                    <User className="h-4 w-4" />
                    <span>Pessoa Física</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.tipo_pessoa === 'juridica'}
                      onChange={() => setFormData({...formData, tipo_pessoa: 'juridica'})}
                      className="w-4 h-4" />
                    <Building className="h-4 w-4" />
                    <span>Pessoa Jurídica</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      {formData.tipo_pessoa === 'fisica' ? 'Nome Completo *' : 'Razão Social *'}
                    </label>
                    <input type="text" value={formData.nome_razao}
                      onChange={(e) => setFormData({...formData, nome_razao: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {formData.tipo_pessoa === 'juridica' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Nome Fantasia</label>
                      <input type="text" value={formData.nome_fantasia}
                        onChange={(e) => setFormData({...formData, nome_fantasia: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  )}

                  {formData.tipo_pessoa === 'fisica' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">CPF *</label>
                        <input type="text" value={formData.cpf} maxLength={14}
                          onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="000.000.000-00" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">RG</label>
                        <input type="text" value={formData.rg}
                          onChange={(e) => setFormData({...formData, rg: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Data de Nascimento</label>
                        <input type="date" value={formData.data_nascimento}
                          onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </>
                  ) : (
                    <>
                      <CnpjSearchField
                        cnpj={formData.cnpj}
                        onCnpjChange={(cnpj) => setFormData({...formData, cnpj})}
                        onDataFilled={handleCnpjDataFilled}
                      />
                      <div>
                        <label className="block text-sm font-medium mb-1">Inscrição Estadual</label>
                        <input type="text" value={formData.inscricao_estadual}
                          onChange={(e) => setFormData({...formData, inscricao_estadual: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Inscrição Municipal</label>
                        <input type="text" value={formData.inscricao_municipal}
                          onChange={(e) => setFormData({...formData, inscricao_municipal: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Data de Fundação</label>
                        <input type="date" value={formData.data_fundacao}
                          onChange={(e) => setFormData({...formData, data_fundacao: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input type="email" value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: contato@empresa.com.br" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <input type="tel" value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: (11) 3333-4444" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Celular / WhatsApp</label>
                    <input type="tel" value={formData.celular}
                      onChange={(e) => setFormData({...formData, celular: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: (11) 99999-8888" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Observações</label>
                    <textarea value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Ex: Cliente preferencial, Pagamento à vista, Desconto corporativo..." />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'enderecos' && (
              <motion.div key="enderecos" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Endereços do Cliente</h3>
                    <p className="text-sm text-gray-600 mt-1">💡 Digite o CEP e os dados serão preenchidos automaticamente</p>
                  </div>
                  <button onClick={addAddress}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Endereço
                  </button>
                </div>

                {addresses.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum endereço cadastrado</p>
                  </div>
                )}

                {addresses.map((addr, index) => (
                  <div key={addr.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Endereço #{index + 1}</h4>
                      <button onClick={() => setAddresses(addresses.filter(a => a.id !== addr.id))}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select value={addr.tipo}
                          onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, tipo: e.target.value as any} : a))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option value="comercial">Comercial</option>
                          <option value="residencial">Residencial</option>
                          <option value="filial">Filial</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Identificação (Ex: Matriz, Filial Centro)</label>
                        <input type="text" value={addr.nome_identificacao || ''}
                          onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, nome_identificacao: e.target.value} : a))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Matriz, Filial São Paulo, Depósito Centro" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CEP</label>
                        <div className="relative">
                          <input type="text" value={addr.cep || ''} maxLength={9}
                            onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, cep: formatCEP(e.target.value)} : a))}
                            onBlur={async (e) => {
                              const cep = e.target.value.replace(/\D/g, '')
                              if (cep.length === 8) {
                                try {
                                  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
                                  const data = await response.json()
                                  if (!data.erro) {
                                    setAddresses(addresses.map(a => a.id === addr.id ? {
                                      ...a,
                                      logradouro: data.logradouro || a.logradouro,
                                      bairro: data.bairro || a.bairro,
                                      cidade: data.localidade || a.cidade,
                                      estado: data.uf || a.estado,
                                      complemento: data.complemento || a.complemento
                                    } : a))
                                  }
                                } catch (error) {
                                  console.log('CEP não encontrado, preencha manualmente')
                                }
                              }
                            }}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="00000-000" />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Logradouro (Rua/Avenida)</label>
                        <input type="text" value={addr.logradouro || ''}
                          onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, logradouro: e.target.value} : a))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Rua das Flores, Avenida Paulista" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Número</label>
                        <input type="text" value={addr.numero || ''}
                          onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, numero: e.target.value} : a))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: 123, S/N" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Complemento</label>
                        <input type="text" value={addr.complemento || ''}
                          onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, complemento: e.target.value} : a))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Apto 101, Bloco A, Sala 205" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Bairro</label>
                        <input type="text" value={addr.bairro || ''}
                          onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, bairro: e.target.value} : a))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Centro, Vila Mariana" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cidade</label>
                        <input type="text" value={addr.cidade || ''}
                          onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, cidade: e.target.value} : a))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: São Paulo" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Estado</label>
                        <input type="text" value={addr.estado || ''} maxLength={2}
                          onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, estado: e.target.value.toUpperCase()} : a))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="SP" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={addr.principal}
                            onChange={(e) => setAddresses(addresses.map(a => a.id === addr.id ? {...a, principal: e.target.checked} : {...a, principal: false}))}
                            className="w-4 h-4" />
                          <span className="text-sm">Endereço Principal</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'contatos' && (
              <motion.div key="contatos" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Contatos e Responsáveis</h3>
                  <button onClick={addContact}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Contato
                  </button>
                </div>

                {contacts.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum contato cadastrado</p>
                  </div>
                )}

                {contacts.map((contact, index) => (
                  <div key={contact.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Contato #{index + 1}</h4>
                      <button onClick={() => setContacts(contacts.filter(c => c.id !== contact.id))}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nome Completo</label>
                        <input type="text" value={contact.nome}
                          onChange={(e) => setContacts(contacts.map(c => c.id === contact.id ? {...c, nome: e.target.value} : c))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: João da Silva" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Cargo</label>
                        <input type="text" value={contact.cargo}
                          onChange={(e) => setContacts(contacts.map(c => c.id === contact.id ? {...c, cargo: e.target.value} : c))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Gerente de Compras, Diretor" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" value={contact.email}
                          onChange={(e) => setContacts(contacts.map(c => c.id === contact.id ? {...c, email: e.target.value} : c))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: joao@empresa.com.br" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Telefone</label>
                        <input type="tel" value={contact.telefone}
                          onChange={(e) => setContacts(contacts.map(c => c.id === contact.id ? {...c, telefone: e.target.value} : c))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: (11) 3333-4444" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Celular</label>
                        <input type="tel" value={contact.celular}
                          onChange={(e) => setContacts(contacts.map(c => c.id === contact.id ? {...c, celular: e.target.value} : c))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: (11) 99999-8888" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Departamento</label>
                        <input type="text" value={contact.departamento}
                          onChange={(e) => setContacts(contacts.map(c => c.id === contact.id ? {...c, departamento: e.target.value} : c))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Financeiro, Compras, T.I." />
                      </div>
                      <div className="md:col-span-2 flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={contact.principal}
                            onChange={(e) => setContacts(contacts.map(c => c.id === contact.id ? {...c, principal: e.target.checked} : {...c, principal: false}))}
                            className="w-4 h-4" />
                          <span className="text-sm">Contato Principal</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={contact.recebe_notificacoes}
                            onChange={(e) => setContacts(contacts.map(c => c.id === contact.id ? {...c, recebe_notificacoes: e.target.checked} : c))}
                            className="w-4 h-4" />
                          <span className="text-sm">Recebe Notificações</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'equipamentos' && (
              <motion.div key="equipamentos" initial={{opacity: 0, x: -20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: 20}} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Inventário de Equipamentos</h3>
                  <button onClick={addEquipment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Equipamento
                  </button>
                </div>

                {addresses.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">Cadastre endereços primeiro</p>
                      <p className="text-sm text-yellow-700">Para registrar equipamentos, é necessário ter pelo menos um endereço cadastrado.</p>
                    </div>
                  </div>
                )}

                {equipments.length === 0 && addresses.length > 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum equipamento cadastrado</p>
                  </div>
                )}

                {equipments.map((equip, index) => (
                  <div key={equip.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Equipamento #{index + 1}</h4>
                      <button onClick={() => setEquipments(equipments.filter(e => e.id !== equip.id))}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Localização</label>
                        <select value={equip.customer_address_id}
                          onChange={(e) => setEquipments(equipments.map(eq => eq.id === equip.id ? {...eq, customer_address_id: e.target.value} : eq))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option value="">Selecione o endereço...</option>
                          {addresses.map(addr => (
                            <option key={addr.id} value={addr.id}>
                              {addr.nome_identificacao || `${addr.logradouro}, ${addr.numero}`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tipo de Equipamento</label>
                        <input type="text" value={equip.tipo_equipamento}
                          onChange={(e) => setEquipments(equipments.map(eq => eq.id === equip.id ? {...eq, tipo_equipamento: e.target.value} : eq))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Ar Condicionado Split" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Marca</label>
                        <input type="text" value={equip.marca}
                          onChange={(e) => setEquipments(equipments.map(eq => eq.id === equip.id ? {...eq, marca: e.target.value} : eq))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Modelo</label>
                        <input type="text" value={equip.modelo}
                          onChange={(e) => setEquipments(equipments.map(eq => eq.id === equip.id ? {...eq, modelo: e.target.value} : eq))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Número de Série</label>
                        <input type="text" value={equip.numero_serie}
                          onChange={(e) => setEquipments(equipments.map(eq => eq.id === equip.id ? {...eq, numero_serie: e.target.value} : eq))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Capacidade</label>
                        <input type="text" value={equip.capacidade}
                          onChange={(e) => setEquipments(equipments.map(eq => eq.id === equip.id ? {...eq, capacidade: e.target.value} : eq))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: 12000 BTU, 18000 BTU" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Data de Instalação</label>
                        <input type="date" value={equip.data_instalacao}
                          onChange={(e) => setEquipments(equipments.map(eq => eq.id === equip.id ? {...eq, data_instalacao: e.target.value} : eq))}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2">
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Cliente
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default CustomerModal
