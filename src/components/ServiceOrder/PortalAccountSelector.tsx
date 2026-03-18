import { useState, useEffect } from 'react'
import { Building2, Users, Search, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface PortalAccount {
  id: string
  full_name: string
  email: string
  document_cpf_cnpj: string
  phone: string
  role: 'cliente' | 'parceiro'
  linked_customer_id: string | null
  is_active: boolean
}

interface CommissionRule {
  commission_type: 'percentage' | 'fixed'
  commission_value: number
}

interface PortalAccountSelectorProps {
  clientPortalAccountId: string
  partnerAccountId: string
  onClientChange: (id: string) => void
  onPartnerChange: (id: string) => void
  disabled?: boolean
  orderTotal?: number
}

export function PortalAccountSelector({
  clientPortalAccountId,
  partnerAccountId,
  onClientChange,
  onPartnerChange,
  disabled = false,
  orderTotal = 0
}: PortalAccountSelectorProps) {
  const [clientAccounts, setClientAccounts] = useState<PortalAccount[]>([])
  const [partnerAccounts, setPartnerAccounts] = useState<PortalAccount[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [partnerSearch, setPartnerSearch] = useState('')
  const [commissionRule, setCommissionRule] = useState<CommissionRule | null>(null)
  const [loading, setLoading] = useState(true)

  const [selectedClient, setSelectedClient] = useState<PortalAccount | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<PortalAccount | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (clientPortalAccountId && clientAccounts.length > 0) {
      const found = clientAccounts.find(a => a.id === clientPortalAccountId) || null
      setSelectedClient(found)
    } else if (!clientPortalAccountId) {
      setSelectedClient(null)
    }
  }, [clientPortalAccountId, clientAccounts])

  useEffect(() => {
    if (partnerAccountId && partnerAccounts.length > 0) {
      const found = partnerAccounts.find(a => a.id === partnerAccountId) || null
      setSelectedPartner(found)
      if (found) loadCommissionRule(found.id)
    } else if (!partnerAccountId) {
      setSelectedPartner(null)
      setCommissionRule(null)
    }
  }, [partnerAccountId, partnerAccounts])

  const loadAccounts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('portal_accounts')
      .select('*')
      .eq('is_active', true)
      .order('full_name')

    if (data) {
      setClientAccounts(data.filter(a => a.role === 'cliente'))
      setPartnerAccounts(data.filter(a => a.role === 'parceiro'))
    }
    setLoading(false)
  }

  const loadCommissionRule = async (partnerId: string) => {
    const { data } = await supabase
      .from('partner_commission_rules')
      .select('commission_type, commission_value')
      .eq('partner_account_id', partnerId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    setCommissionRule(data || null)
  }

  const filteredClients = clientAccounts.filter(a =>
    a.full_name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (a.document_cpf_cnpj || '').includes(clientSearch)
  )

  const filteredPartners = partnerAccounts.filter(a =>
    a.full_name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(partnerSearch.toLowerCase())
  )

  const commissionAmount = commissionRule
    ? commissionRule.commission_type === 'percentage'
      ? orderTotal * commissionRule.commission_value / 100
      : commissionRule.commission_value
    : 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Vinculo com Portal</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Portal Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            <Building2 size={14} className="text-blue-600" />
            Conta no Portal do Cliente
            {disabled && (
              <span className="ml-auto text-xs text-amber-600 font-normal flex items-center gap-1">
                <AlertCircle size={11} />
                Somente diretores podem alterar
              </span>
            )}
          </label>

          {loading ? (
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ) : selectedClient && !disabled ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Building2 size={14} className="text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 truncate">{selectedClient.full_name}</p>
                <p className="text-xs text-blue-600 truncate">{selectedClient.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { onClientChange(''); setClientSearch('') }}
                className="text-blue-400 hover:text-blue-600 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ) : selectedClient && disabled ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Building2 size={14} className="text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900 truncate">{selectedClient.full_name}</p>
                <p className="text-xs text-blue-600 truncate">{selectedClient.email}</p>
              </div>
              <CheckCircle2 size={14} className="text-blue-500 shrink-0" />
            </div>
          ) : (
            <div className={`relative ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={e => setClientSearch(e.target.value)}
                placeholder="Buscar conta de cliente..."
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={disabled}
              />
              {clientSearch && filteredClients.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.map(account => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => { onClientChange(account.id); setClientSearch('') }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-800">{account.full_name}</p>
                      <p className="text-xs text-gray-500">{account.email} {account.document_cpf_cnpj ? `· ${account.document_cpf_cnpj}` : ''}</p>
                    </button>
                  ))}
                </div>
              )}
              {clientSearch && filteredClients.length === 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-sm px-3 py-2 text-sm text-gray-500">
                  Nenhuma conta encontrada
                </div>
              )}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Se preenchido, o cliente verá esta OS no Portal do Cliente
          </p>
        </div>

        {/* Partner Account */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            <Users size={14} className="text-green-600" />
            Parceiro Indicador
            <span className="text-xs text-gray-400 font-normal">(opcional)</span>
            {disabled && (
              <span className="ml-auto text-xs text-amber-600 font-normal flex items-center gap-1">
                <AlertCircle size={11} />
                Somente diretores podem alterar
              </span>
            )}
          </label>

          {loading ? (
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ) : selectedPartner && !disabled ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <Users size={14} className="text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 truncate">{selectedPartner.full_name}</p>
                <p className="text-xs text-green-600 truncate">{selectedPartner.email}</p>
              </div>
              <button
                type="button"
                onClick={() => { onPartnerChange(''); setPartnerSearch('') }}
                className="text-green-400 hover:text-green-600 shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ) : selectedPartner && disabled ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <Users size={14} className="text-green-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900 truncate">{selectedPartner.full_name}</p>
                <p className="text-xs text-green-600 truncate">{selectedPartner.email}</p>
              </div>
              <CheckCircle2 size={14} className="text-green-500 shrink-0" />
            </div>
          ) : (
            <div className={`relative ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={partnerSearch}
                onChange={e => setPartnerSearch(e.target.value)}
                placeholder="Buscar parceiro indicador..."
                className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                disabled={disabled}
              />
              {partnerSearch && filteredPartners.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredPartners.map(account => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => { onPartnerChange(account.id); setPartnerSearch('') }}
                      className="w-full text-left px-3 py-2 hover:bg-green-50 border-b last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-800">{account.full_name}</p>
                      <p className="text-xs text-gray-500">{account.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {partnerSearch && filteredPartners.length === 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-sm px-3 py-2 text-sm text-gray-500">
                  Nenhum parceiro encontrado
                </div>
              )}
            </div>
          )}

          {commissionRule && orderTotal > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
              <Users size={11} />
              Comissao: {commissionRule.commission_type === 'percentage'
                ? `${commissionRule.commission_value}% = R$ ${commissionAmount.toFixed(2)}`
                : `R$ ${commissionRule.commission_value.toFixed(2)} fixo`
              }
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Se preenchido, a OS aparecerá no dashboard do parceiro
          </p>
        </div>
      </div>
    </div>
  )
}
