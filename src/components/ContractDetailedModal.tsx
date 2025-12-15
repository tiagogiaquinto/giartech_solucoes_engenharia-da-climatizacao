import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FileText, Download, Printer, Check, Calendar, DollarSign,
  Users, Shield, ClipboardList, Building2, Wrench, FileCheck,
  AlertTriangle, Phone, Award, Book, Save
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import jsPDF from 'jspdf'
import { formatDateSafe } from '../utils/format'

interface ContractDetailedModalProps {
  isOpen: boolean
  onClose: () => void
  contractId?: string
  serviceOrderId?: string
  customerId?: string
}

interface ContractData {
  id?: string
  contract_number?: string
  contract_type: string
  is_pmoc: boolean
  customer_id?: string
  service_order_id?: string

  contractor_name: string
  contractor_document: string
  contractor_address: string
  contractor_representative: string

  start_date: string
  end_date: string
  renewal_type: string
  renewal_period_months: number

  contract_value: number
  payment_frequency: string
  payment_day: number
  late_fee_percentage: number
  interest_rate_monthly: number

  services_included: string[]
  services_excluded: string[]
  scope_description: string

  warranty_period_days: number
  warranty_coverage: string

  pmoc_system_type?: string
  pmoc_total_btu?: number
  pmoc_equipment_count?: number
  pmoc_equipment_list?: any

  pmoc_responsible_technician?: string
  pmoc_technician_crea?: string
  pmoc_technician_art?: string

  pmoc_maintenance_frequency?: string
  pmoc_maintenance_schedule?: any
  pmoc_emergency_attendance?: boolean
  pmoc_attendance_sla_hours?: number

  pmoc_compliance_law?: string
  pmoc_environmental_standards?: string[]
  pmoc_inspection_reports?: boolean

  pmoc_filter_change_frequency?: string
  pmoc_air_quality_monitoring?: boolean

  termination_notice_days: number
  termination_penalty: string

  special_clauses: string
  confidentiality_clause: string
  jurisdiction: string

  status: string

  contract_text?: string
  contract_clauses?: string
  warranty_terms?: string
  payment_conditions?: string
}

const ContractDetailedModal: React.FC<ContractDetailedModalProps> = ({
  isOpen,
  onClose,
  contractId,
  serviceOrderId,
  customerId
}) => {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'geral' | 'financeiro' | 'servicos' | 'pmoc' | 'clausulas'>('geral')
  const [contract, setContract] = useState<ContractData>({
    contract_type: 'servico',
    is_pmoc: false,
    contractor_name: '',
    contractor_document: '',
    contractor_address: '',
    contractor_representative: '',
    start_date: '',
    end_date: '',
    renewal_type: 'manual',
    renewal_period_months: 12,
    contract_value: 0,
    payment_frequency: 'mensal',
    payment_day: 10,
    late_fee_percentage: 2,
    interest_rate_monthly: 1,
    services_included: [],
    services_excluded: [],
    scope_description: '',
    warranty_period_days: 90,
    warranty_coverage: '',
    termination_notice_days: 30,
    termination_penalty: '',
    special_clauses: '',
    confidentiality_clause: '',
    jurisdiction: '',
    status: 'rascunho'
  })

  useEffect(() => {
    if (isOpen) {
      if (contractId) {
        loadContract()
      } else {
        loadNewContractData()
      }
    }
  }, [isOpen, contractId, serviceOrderId, customerId])

  const loadContract = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single()

      if (error) throw error
      if (data) {
        setContract(data)
      }
    } catch (error) {
      console.error('Error loading contract:', error)
      showToast('Erro ao carregar contrato', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadNewContractData = async () => {
    try {
      setLoading(true)
      const newContract: any = { ...contract }

      if (customerId) {
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single()

        if (customer) {
          newContract.customer_id = customerId
          newContract.contractor_name = customer.nome_razao
          newContract.contractor_document = customer.cnpj
          newContract.contractor_address = customer.endereco || ''
        }
      }

      if (serviceOrderId) {
        newContract.service_order_id = serviceOrderId
      }

      const { data: company } = await supabase
        .from('company_settings')
        .select('*')
        .single()

      if (company) {
        newContract.jurisdiction = company.city + ', ' + company.state
      }

      const contractNumber = await generateContractNumber()
      newContract.contract_number = contractNumber

      setContract(newContract)
    } catch (error) {
      console.error('Error loading new contract data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateContractNumber = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_contract_number')
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error generating contract number:', error)
      return 'CT' + new Date().getFullYear() + '-0001'
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      if (contractId) {
        const { error } = await supabase
          .from('contracts')
          .update(contract)
          .eq('id', contractId)

        if (error) throw error
        showToast('Contrato atualizado com sucesso', 'success')
      } else {
        const { error } = await supabase
          .from('contracts')
          .insert([contract])

        if (error) throw error
        showToast('Contrato criado com sucesso', 'success')
      }

      onClose()
    } catch (error) {
      console.error('Error saving contract:', error)
      showToast('Erro ao salvar contrato', 'error')
    } finally {
      setSaving(false)
    }
  }

  const generatePDF = () => {
    const doc = new jsPDF()
    const margin = 15
    const pageWidth = doc.internal.pageSize.width
    let y = margin

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS', pageWidth / 2, y, { align: 'center' })
    y += 10

    doc.setFontSize(10)
    doc.text(`Contrato nº: ${contract.contract_number || 'N/A'}`, margin, y)
    y += 7

    doc.setFont('helvetica', 'bold')
    doc.text('CONTRATANTE:', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(contract.contractor_name, margin, y)
    y += 5
    doc.text(`${contract.contractor_document}`, margin, y)
    y += 5
    doc.text(contract.contractor_address, margin, y)
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.text('VIGÊNCIA:', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(`De ${formatDateSafe(contract.start_date)} até ${formatDateSafe(contract.end_date)}`, margin, y)
    y += 10

    doc.setFont('helvetica', 'bold')
    doc.text('VALOR DO CONTRATO:', margin, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.text(`R$ ${contract.contract_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - Pagamento ${contract.payment_frequency}`, margin, y)
    y += 15

    if (contract.is_pmoc) {
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMAÇÕES PMOC:', margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.text(`Responsável Técnico: ${contract.pmoc_responsible_technician || 'N/A'}`, margin, y)
      y += 5
      doc.text(`CREA: ${contract.pmoc_technician_crea || 'N/A'}`, margin, y)
      y += 5
      doc.text(`Equipamentos: ${contract.pmoc_equipment_count || 0} unidades`, margin, y)
      y += 5
      doc.text(`Frequência de Manutenção: ${contract.pmoc_maintenance_frequency || 'N/A'}`, margin, y)
    }

    doc.save(`contrato-${contract.contract_number}.pdf`)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">
                  {contractId ? 'Editar Contrato' : 'Novo Contrato'}
                </h2>
                {contract.contract_number && (
                  <p className="text-sm text-blue-100">Nº {contract.contract_number}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Carregando...</p>
            </div>
          ) : (
            <>
              <div className="flex border-b border-gray-200 px-6 bg-gray-50">
                <button
                  onClick={() => setActiveTab('geral')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'geral'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  Dados Gerais
                </button>
                <button
                  onClick={() => setActiveTab('financeiro')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'financeiro'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Financeiro
                </button>
                <button
                  onClick={() => setActiveTab('servicos')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'servicos'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  Serviços
                </button>
                {contract.is_pmoc && (
                  <button
                    onClick={() => setActiveTab('pmoc')}
                    className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === 'pmoc'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <FileCheck className="w-4 h-4" />
                    PMOC
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('clausulas')}
                  className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === 'clausulas'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Book className="w-4 h-4" />
                  Cláusulas
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* ABA GERAL */}
                {activeTab === 'geral' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Contrato
                        </label>
                        <select
                          value={contract.contract_type}
                          onChange={(e) => setContract({ ...contract, contract_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="servico">Serviço</option>
                          <option value="pmoc">PMOC</option>
                          <option value="manutencao">Manutenção</option>
                          <option value="venda">Venda</option>
                          <option value="locacao">Locação</option>
                          <option value="consultoria">Consultoria</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contract.is_pmoc}
                            onChange={(e) => setContract({ ...contract, is_pmoc: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Contrato PMOC (Lei 13.589/2018)
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Dados do Contratante
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome/Razão Social
                          </label>
                          <input
                            type="text"
                            value={contract.contractor_name}
                            onChange={(e) => setContract({ ...contract, contractor_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CPF/CNPJ
                          </label>
                          <input
                            type="text"
                            value={contract.contractor_document}
                            onChange={(e) => setContract({ ...contract, contractor_document: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Representante Legal
                          </label>
                          <input
                            type="text"
                            value={contract.contractor_representative}
                            onChange={(e) => setContract({ ...contract, contractor_representative: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Endereço Completo
                          </label>
                          <input
                            type="text"
                            value={contract.contractor_address}
                            onChange={(e) => setContract({ ...contract, contractor_address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Vigência do Contrato
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Início
                          </label>
                          <input
                            type="date"
                            value={contract.start_date}
                            onChange={(e) => setContract({ ...contract, start_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Data de Término
                          </label>
                          <input
                            type="date"
                            value={contract.end_date}
                            onChange={(e) => setContract({ ...contract, end_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Renovação
                          </label>
                          <select
                            value={contract.renewal_type}
                            onChange={(e) => setContract({ ...contract, renewal_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="manual">Manual</option>
                            <option value="automatica">Automática</option>
                            <option value="negociacao">Negociação</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Período de Renovação (meses)
                          </label>
                          <input
                            type="number"
                            value={contract.renewal_period_months}
                            onChange={(e) => setContract({ ...contract, renewal_period_months: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA FINANCEIRO */}
                {activeTab === 'financeiro' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor Total do Contrato
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={contract.contract_value}
                          onChange={(e) => setContract({ ...contract, contract_value: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0,00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequência de Pagamento
                        </label>
                        <select
                          value={contract.payment_frequency}
                          onChange={(e) => setContract({ ...contract, payment_frequency: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="mensal">Mensal</option>
                          <option value="bimestral">Bimestral</option>
                          <option value="trimestral">Trimestral</option>
                          <option value="semestral">Semestral</option>
                          <option value="anual">Anual</option>
                          <option value="a_vista">À Vista</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dia do Vencimento
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={contract.payment_day}
                          onChange={(e) => setContract({ ...contract, payment_day: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Multa por Atraso (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={contract.late_fee_percentage}
                          onChange={(e) => setContract({ ...contract, late_fee_percentage: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Juros Mensais (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={contract.interest_rate_monthly}
                          onChange={(e) => setContract({ ...contract, interest_rate_monthly: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <div className="flex items-start">
                        <DollarSign className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Resumo Financeiro</h4>
                          <div className="text-sm text-blue-800 space-y-1">
                            <p>Valor mensal aproximado: R$ {(contract.contract_value / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p>Pagamento: Todo dia {contract.payment_day} - {contract.payment_frequency}</p>
                            <p>Encargos de atraso: {contract.late_fee_percentage}% de multa + {contract.interest_rate_monthly}% ao mês</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA SERVIÇOS */}
                {activeTab === 'servicos' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição do Escopo
                      </label>
                      <textarea
                        value={contract.scope_description}
                        onChange={(e) => setContract({ ...contract, scope_description: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Descreva detalhadamente os serviços incluídos no contrato..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Período de Garantia (dias)
                        </label>
                        <input
                          type="number"
                          value={contract.warranty_period_days}
                          onChange={(e) => setContract({ ...contract, warranty_period_days: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prazo para Rescisão (dias)
                        </label>
                        <input
                          type="number"
                          value={contract.termination_notice_days}
                          onChange={(e) => setContract({ ...contract, termination_notice_days: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cobertura da Garantia
                      </label>
                      <textarea
                        value={contract.warranty_coverage}
                        onChange={(e) => setContract({ ...contract, warranty_coverage: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Descreva o que está coberto pela garantia..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Penalidade por Rescisão Antecipada
                      </label>
                      <textarea
                        value={contract.termination_penalty}
                        onChange={(e) => setContract({ ...contract, termination_penalty: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Descreva as penalidades aplicáveis..."
                      />
                    </div>
                  </div>
                )}

                {/* ABA PMOC */}
                {activeTab === 'pmoc' && contract.is_pmoc && (
                  <div className="space-y-6">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-6">
                      <div className="flex items-start">
                        <FileCheck className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-900 mb-1">PMOC - Lei 13.589/2018</h4>
                          <p className="text-sm text-green-800">
                            Plano de Manutenção, Operação e Controle de Sistemas de Climatização
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600" />
                        Responsável Técnico
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            value={contract.pmoc_responsible_technician}
                            onChange={(e) => setContract({ ...contract, pmoc_responsible_technician: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CREA/CAU
                          </label>
                          <input
                            type="text"
                            value={contract.pmoc_technician_crea}
                            onChange={(e) => setContract({ ...contract, pmoc_technician_crea: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Número da ART
                          </label>
                          <input
                            type="text"
                            value={contract.pmoc_technician_art}
                            onChange={(e) => setContract({ ...contract, pmoc_technician_art: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-blue-600" />
                        Dados dos Equipamentos
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Sistema
                          </label>
                          <select
                            value={contract.pmoc_system_type}
                            onChange={(e) => setContract({ ...contract, pmoc_system_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Selecione...</option>
                            <option value="split">Split</option>
                            <option value="vrf">VRF/VRV</option>
                            <option value="self">Self Contained</option>
                            <option value="chiller">Chiller</option>
                            <option value="fancoil">Fan Coil</option>
                            <option value="cassete">Cassete</option>
                            <option value="janela">Janela</option>
                            <option value="misto">Misto</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Capacidade Total (BTU)
                          </label>
                          <input
                            type="number"
                            value={contract.pmoc_total_btu}
                            onChange={(e) => setContract({ ...contract, pmoc_total_btu: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantidade de Equipamentos
                          </label>
                          <input
                            type="number"
                            value={contract.pmoc_equipment_count}
                            onChange={(e) => setContract({ ...contract, pmoc_equipment_count: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frequência de Manutenção
                          </label>
                          <select
                            value={contract.pmoc_maintenance_frequency}
                            onChange={(e) => setContract({ ...contract, pmoc_maintenance_frequency: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="quinzenal">Quinzenal</option>
                            <option value="mensal">Mensal</option>
                            <option value="bimestral">Bimestral</option>
                            <option value="trimestral">Trimestral</option>
                            <option value="semestral">Semestral</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Troca de Filtros
                          </label>
                          <select
                            value={contract.pmoc_filter_change_frequency}
                            onChange={(e) => setContract({ ...contract, pmoc_filter_change_frequency: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="mensal">Mensal</option>
                            <option value="bimestral">Bimestral</option>
                            <option value="trimestral">Trimestral</option>
                            <option value="semestral">Semestral</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            SLA Atendimento Emergencial (horas)
                          </label>
                          <input
                            type="number"
                            value={contract.pmoc_attendance_sla_hours}
                            onChange={(e) => setContract({ ...contract, pmoc_attendance_sla_hours: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contract.pmoc_emergency_attendance}
                            onChange={(e) => setContract({ ...contract, pmoc_emergency_attendance: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Atendimento Emergencial 24/7</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contract.pmoc_air_quality_monitoring}
                            onChange={(e) => setContract({ ...contract, pmoc_air_quality_monitoring: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Monitoramento de Qualidade do Ar</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={contract.pmoc_inspection_reports}
                            onChange={(e) => setContract({ ...contract, pmoc_inspection_reports: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Laudos e Relatórios de Inspeção</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA CLÁUSULAS */}
                {activeTab === 'clausulas' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cláusulas Especiais
                      </label>
                      <textarea
                        value={contract.special_clauses}
                        onChange={(e) => setContract({ ...contract, special_clauses: e.target.value })}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Adicione cláusulas específicas para este contrato..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cláusula de Confidencialidade
                      </label>
                      <textarea
                        value={contract.confidentiality_clause}
                        onChange={(e) => setContract({ ...contract, confidentiality_clause: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Defina os termos de confidencialidade..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foro/Jurisdição
                      </label>
                      <input
                        type="text"
                        value={contract.jurisdiction}
                        onChange={(e) => setContract({ ...contract, jurisdiction: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Comarca de São Paulo, SP"
                      />
                    </div>

                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-amber-900 mb-1">Atenção</h4>
                          <p className="text-sm text-amber-800">
                            Revise todas as cláusulas com atenção. Recomenda-se consulta jurídica antes da assinatura.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between gap-3 border-t">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className={`px-3 py-1 rounded-full font-medium ${
                    contract.status === 'ativo' ? 'bg-green-100 text-green-800' :
                    contract.status === 'rascunho' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {contract.status?.toUpperCase() || 'RASCUNHO'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {contractId && (
                    <button
                      onClick={generatePDF}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Baixar PDF
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Contrato'}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ContractDetailedModal
