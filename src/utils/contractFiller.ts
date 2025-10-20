import { supabase } from '../lib/supabase'

interface ContractData {
  serviceOrderId: string
  customerId?: string
  companyId?: string
}

interface FilledContract {
  contract_text: string
  contract_clauses: string
  warranty_terms: string
  payment_conditions: string
  bank_details_template: string
}

export const fillContractTemplate = async (
  templateId: string,
  data: ContractData
): Promise<FilledContract | null> => {
  try {
    const { data: template, error: templateError } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      console.error('Template not found:', templateError)
      return null
    }

    const { data: serviceOrder, error: orderError } = await supabase
      .from('service_orders')
      .select(`
        *,
        customers (
          id,
          name,
          cpf_cnpj,
          email,
          phone,
          customer_addresses (
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            zip_code
          )
        )
      `)
      .eq('id', data.serviceOrderId)
      .single()

    if (orderError || !serviceOrder) {
      console.error('Service order not found:', orderError)
      return null
    }

    const { data: serviceItems } = await supabase
      .from('service_order_items')
      .select('service_name, description, quantity, unit_price, total_price')
      .eq('service_order_id', data.serviceOrderId)

    const { data: companyData } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single()

    const { data: bankAccount } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_default', true)
      .limit(1)
      .maybeSingle()

    const customer = serviceOrder.customers
    const address = customer?.customer_addresses?.[0]

    const fullAddress = address
      ? `${address.street}, ${address.number}${address.complement ? ' - ' + address.complement : ''}, ${address.neighborhood}, ${address.city}/${address.state}, CEP: ${address.zip_code}`
      : 'Endereço não cadastrado'

    const servicesDescription = serviceItems
      ?.map((item: any) =>
        `- ${item.service_name}${item.description ? ': ' + item.description : ''} (${item.quantity}x R$ ${item.unit_price.toFixed(2)} = R$ ${item.total_price.toFixed(2)})`
      )
      .join('\n') || 'Serviços conforme OS'

    const paymentMethod =
      serviceOrder.payment_method === 'cash' ? 'Dinheiro' :
      serviceOrder.payment_method === 'credit_card' ? 'Cartão de Crédito' :
      serviceOrder.payment_method === 'debit_card' ? 'Cartão de Débito' :
      serviceOrder.payment_method === 'pix' ? 'PIX' :
      serviceOrder.payment_method === 'bank_transfer' ? 'Transferência Bancária' :
      serviceOrder.payment_method === 'bank_slip' ? 'Boleto Bancário' :
      serviceOrder.payment_method === 'promissory_note' ? 'Nota Promissória' : 'A definir'

    const warrantyPeriod = serviceOrder.warranty_period || 90
    const warrantyType = serviceOrder.warranty_type || 'days'
    const warrantyText =
      warrantyType === 'days' ? `${warrantyPeriod} dias` :
      warrantyType === 'months' ? `${warrantyPeriod} meses` :
      `${warrantyPeriod} anos`

    const scheduledDate = serviceOrder.scheduled_at
      ? new Date(serviceOrder.scheduled_at).toLocaleDateString('pt-BR')
      : 'A definir'

    const completionDate = serviceOrder.completed_at
      ? new Date(serviceOrder.completed_at).toLocaleDateString('pt-BR')
      : 'A definir'

    const warrantyEndDate = serviceOrder.scheduled_at && warrantyPeriod
      ? new Date(new Date(serviceOrder.scheduled_at).getTime() +
          (warrantyPeriod * (
            warrantyType === 'days' ? 86400000 :
            warrantyType === 'months' ? 2592000000 : 31536000000
          ))).toLocaleDateString('pt-BR')
      : 'A calcular'

    const replacements: Record<string, string> = {
      '[NOME_CLIENTE]': customer?.name || 'Cliente não informado',
      '[CPF_CNPJ_CLIENTE]': customer?.cpf_cnpj || 'Não informado',
      '[EMAIL_CLIENTE]': customer?.email || 'Não informado',
      '[TELEFONE_CLIENTE]': customer?.phone || 'Não informado',
      '[ENDERECO_CLIENTE]': fullAddress,
      '[NUMERO_OS]': serviceOrder.order_number || serviceOrder.id.substring(0, 8),
      '[DATA_OS]': scheduledDate,
      '[DATA_CONCLUSAO]': completionDate,
      '[VALOR_TOTAL]': `R$ ${(serviceOrder.total_amount || 0).toFixed(2)}`,
      '[VALOR_SUBTOTAL]': `R$ ${(serviceOrder.subtotal || 0).toFixed(2)}`,
      '[DESCONTO]': `R$ ${(serviceOrder.discount_amount || 0).toFixed(2)}`,
      '[DESCRICAO_SERVICOS]': servicesDescription,
      '[PRAZO_EXECUCAO]': `${serviceOrder.estimated_duration || 0} horas`,
      '[GARANTIA_PERIODO]': warrantyText,
      '[GARANTIA_ATE]': warrantyEndDate,
      '[FORMA_PAGAMENTO]': paymentMethod,
      '[CONDICOES_PAGAMENTO]': paymentMethod,
      '[NOME_EMPRESA]': companyData?.company_name || 'Nome da Empresa',
      '[CNPJ_EMPRESA]': companyData?.cnpj || 'CNPJ não informado',
      '[ENDERECO_EMPRESA]': companyData?.address || 'Endereço não informado',
      '[TELEFONE_EMPRESA]': companyData?.phone || 'Telefone não informado',
      '[EMAIL_EMPRESA]': companyData?.email || 'E-mail não informado',
      '[CIDADE]': companyData?.city || address?.city || 'Cidade não informada',
      '[ESTADO]': companyData?.state || address?.state || 'Estado não informado',
      '[BANCO]': bankAccount?.bank_name || 'Banco não informado',
      '[AGENCIA]': bankAccount?.agency || '0000',
      '[CONTA]': bankAccount?.account_number || '00000-0',
      '[TIPO_CONTA]': bankAccount?.account_type === 'checking' ? 'Conta Corrente' : 'Conta Poupança',
      '[TITULAR]': bankAccount?.account_holder || companyData?.company_name || 'Titular não informado',
      '[CPF_CNPJ_TITULAR]': companyData?.cnpj || 'Não informado',
      '[CHAVE_PIX]': bankAccount?.pix_key || 'Não informado',
      '[TIPO_CHAVE_PIX]':
        bankAccount?.pix_key_type === 'cpf' ? 'CPF' :
        bankAccount?.pix_key_type === 'cnpj' ? 'CNPJ' :
        bankAccount?.pix_key_type === 'email' ? 'E-mail' :
        bankAccount?.pix_key_type === 'phone' ? 'Telefone' :
        bankAccount?.pix_key_type === 'random' ? 'Chave Aleatória' : 'Não informado',
      '[EMAIL_COMPROVANTE]': companyData?.email || 'Email não informado',
      '[WHATSAPP_CONTATO]': companyData?.phone || 'WhatsApp não informado',
      '[DADOS_BANCARIOS]': bankAccount
        ? `Banco: ${bankAccount.bank_name}\nAgência: ${bankAccount.agency}\nConta: ${bankAccount.account_number}\nPIX: ${bankAccount.pix_key || 'Não disponível'}`
        : 'Dados bancários não cadastrados',
      '[VALOR_ENTRADA]': `R$ ${((serviceOrder.total_amount || 0) * 0.3).toFixed(2)}`,
      '[NUMERO_PARCELAS]': '3',
      '[VALOR_PARCELA]': `R$ ${((serviceOrder.total_amount || 0) * 0.7 / 3).toFixed(2)}`,
      '[DIA_VENCIMENTO]': '10'
    }

    const replaceVariables = (text: string): string => {
      let result = text
      Object.entries(replacements).forEach(([key, value]) => {
        result = result.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
      })
      return result
    }

    return {
      contract_text: replaceVariables(template.contract_text || ''),
      contract_clauses: replaceVariables(template.contract_clauses || ''),
      warranty_terms: replaceVariables(template.warranty_terms || ''),
      payment_conditions: replaceVariables(template.payment_conditions || ''),
      bank_details_template: replaceVariables(template.bank_details_template || '')
    }
  } catch (error) {
    console.error('Error filling contract:', error)
    return null
  }
}

export const getDefaultTemplate = async () => {
  try {
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('is_default', true)
      .eq('active', true)
      .single()

    if (error || !data) {
      const { data: fallback } = await supabase
        .from('contract_templates')
        .select('*')
        .eq('active', true)
        .limit(1)
        .single()

      return fallback
    }

    return data
  } catch (error) {
    console.error('Error getting default template:', error)
    return null
  }
}
