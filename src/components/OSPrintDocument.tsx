import { forwardRef } from 'react'

interface PrintItem {
  name: string
  description?: string
  quantity: number
  unit?: string
  unit_price: number
  total: number
}

interface PrintMaterial {
  name: string
  quantity: number
  unit?: string
  unit_cost: number
  total_cost: number
}

interface PrintTeamMember {
  name: string
  role?: string
}

export interface OSPrintData {
  order_number: string
  status: string
  created_at: string
  scheduled_date?: string
  execution_deadline?: string
  priority?: string
  description?: string
  instructions?: string
  report?: string
  customer_name: string
  customer_phone?: string
  customer_email?: string
  customer_cpf_cnpj?: string
  address?: string
  address_complement?: string
  city?: string
  state?: string
  items: PrintItem[]
  materials?: PrintMaterial[]
  team?: PrintTeamMember[]
  labor_value?: number
  materials_value?: number
  discount?: number
  total_value: number
  net_value?: number
  payment_method?: string
  payment_installments?: number
  payment_conditions?: string
  pix_key?: string
  company?: {
    name?: string
    cnpj?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    phone?: string
    email?: string
    website?: string
    logo_url?: string
  }
}

interface OSPrintDocumentProps {
  data: OSPrintData
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  open: 'Aberta',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  pausado: 'Pausada',
  cotacao: 'Cotação',
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

function fmtDate(date?: string) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('pt-BR')
  } catch {
    return date
  }
}

const OSPrintDocument = forwardRef<HTMLDivElement, OSPrintDocumentProps>(({ data }, ref) => {
  const company = data.company || {}
  const companyName = company.name || 'Giartech Soluções'
  const cnpj = company.cnpj || ''
  const companyPhone = company.phone || ''
  const companyEmail = company.email || ''
  const companyAddress = [company.address, company.city, company.state].filter(Boolean).join(' — ')

  const allItems = data.items || []
  const materials = data.materials || []
  const team = data.team || []

  const itemsSubtotal = allItems.reduce((s, i) => s + i.total, 0)
  const materialsTotal = materials.reduce((s, m) => s + m.total_cost, 0)
  const laborValue = data.labor_value || 0
  const discount = data.discount || 0
  const finalTotal = data.net_value || data.total_value || 0

  const generatedAt = new Date().toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  const customerAddress = [
    data.address,
    data.address_complement,
    data.city,
    data.state
  ].filter(Boolean).join(', ')

  return (
    <div ref={ref} className="os-print-document" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#111', background: 'white' }}>

      {/* CABEÇALHO DA EMPRESA */}
      <div style={{ borderBottom: '2px solid #1e3a5f', paddingBottom: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          {company.logo_url && (
            <img src={company.logo_url} alt="Logo" style={{ height: '48px', marginBottom: '6px', objectFit: 'contain' }} />
          )}
          <div style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e3a5f' }}>{companyName}</div>
          {cnpj && <div style={{ fontSize: '8.5pt', color: '#555' }}>CNPJ: {cnpj}</div>}
          {companyAddress && <div style={{ fontSize: '8.5pt', color: '#555' }}>{companyAddress}</div>}
          <div style={{ fontSize: '8.5pt', color: '#555' }}>
            {companyPhone && <span>{companyPhone}</span>}
            {companyPhone && companyEmail && <span> | </span>}
            {companyEmail && <span>{companyEmail}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#1e3a5f', border: '2px solid #1e3a5f', padding: '6px 12px', borderRadius: '6px' }}>
            ORDEM DE SERVIÇO
          </div>
          <div style={{ fontSize: '13pt', fontWeight: 'bold', marginTop: '4px', color: '#1e3a5f' }}>#{data.order_number}</div>
          <div style={{ fontSize: '8.5pt', color: '#555', marginTop: '2px' }}>
            Status: <strong>{STATUS_LABELS[data.status] || data.status}</strong>
          </div>
        </div>
      </div>

      {/* DADOS DA OS + CLIENTE */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }} className="os-print-no-break">
        {/* Dados da OS */}
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
          <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Dados da OS
          </div>
          <table style={{ width: '100%', fontSize: '8.5pt', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: '#666', paddingBottom: '2px', width: '45%' }}>Data de Abertura:</td>
                <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{fmtDate(data.created_at)}</td>
              </tr>
              {data.scheduled_date && (
                <tr>
                  <td style={{ color: '#666', paddingBottom: '2px' }}>Data Agendada:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{fmtDate(data.scheduled_date)}</td>
                </tr>
              )}
              {data.execution_deadline && (
                <tr>
                  <td style={{ color: '#666', paddingBottom: '2px' }}>Prazo:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{fmtDate(data.execution_deadline)}</td>
                </tr>
              )}
              <tr>
                <td style={{ color: '#666', paddingBottom: '2px' }}>Prioridade:</td>
                <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{data.priority || 'Normal'}</td>
              </tr>
              {team.length > 0 && (
                <tr>
                  <td style={{ color: '#666', paddingBottom: '2px' }}>Técnico(s):</td>
                  <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{team.map(t => t.name).join(', ')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dados do cliente */}
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
          <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Dados do Cliente
          </div>
          <table style={{ width: '100%', fontSize: '8.5pt', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: '#666', paddingBottom: '2px', width: '35%' }}>Nome/Razão:</td>
                <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{data.customer_name}</td>
              </tr>
              {data.customer_cpf_cnpj && (
                <tr>
                  <td style={{ color: '#666', paddingBottom: '2px' }}>CPF/CNPJ:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{data.customer_cpf_cnpj}</td>
                </tr>
              )}
              {data.customer_phone && (
                <tr>
                  <td style={{ color: '#666', paddingBottom: '2px' }}>Telefone:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{data.customer_phone}</td>
                </tr>
              )}
              {data.customer_email && (
                <tr>
                  <td style={{ color: '#666', paddingBottom: '2px' }}>E-mail:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{data.customer_email}</td>
                </tr>
              )}
              {customerAddress && (
                <tr>
                  <td style={{ color: '#666', paddingBottom: '2px' }}>Endereço:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '2px' }}>{customerAddress}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DESCRIÇÃO DO SERVIÇO */}
      {data.description && (
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px', marginBottom: '12px' }} className="os-print-no-break">
          <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Descrição do Serviço / Problema Relatado
          </div>
          <p style={{ fontSize: '8.5pt', lineHeight: '1.6', margin: 0 }}>{data.description}</p>
        </div>
      )}

      {/* TABELA DE SERVIÇOS */}
      {allItems.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Serviços Executados
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'left' }}>Descrição</th>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'center', width: '50px' }}>Qtd</th>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'center', width: '35px' }}>Un</th>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'right', width: '90px' }}>Vl. Unit.</th>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'right', width: '90px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px' }}>
                    <div style={{ fontWeight: '600' }}>{item.name}</div>
                    {item.description && <div style={{ fontSize: '7.5pt', color: '#666', marginTop: '1px' }}>{item.description}</div>}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px', textAlign: 'center' }}>{item.unit || 'un'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px', textAlign: 'right' }}>{fmt(item.unit_price)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px', textAlign: 'right', fontWeight: '600' }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TABELA DE MATERIAIS */}
      {materials.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Materiais / Peças Utilizados
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'left' }}>Material / Peça</th>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'center', width: '50px' }}>Qtd</th>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'center', width: '35px' }}>Un</th>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'right', width: '90px' }}>Vl. Unit.</th>
                <th style={{ border: '1px solid #ccc', padding: '5px 7px', textAlign: 'right', width: '90px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((mat, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px' }}>{mat.name}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px', textAlign: 'center' }}>{mat.quantity}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px', textAlign: 'center' }}>{mat.unit || 'un'}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px', textAlign: 'right' }}>{fmt(mat.unit_cost)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '4px 7px', textAlign: 'right', fontWeight: '600' }}>{fmt(mat.total_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SOLUÇÃO EXECUTADA */}
      {data.report && (
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px', marginBottom: '12px' }} className="os-print-no-break">
          <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Solução / Relatório Técnico
          </div>
          <p style={{ fontSize: '8.5pt', lineHeight: '1.6', margin: 0 }}>{data.report}</p>
        </div>
      )}

      {/* RESUMO FINANCEIRO */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }} className="os-print-no-break">
        <table style={{ width: '240px', fontSize: '9pt', borderCollapse: 'collapse' }}>
          <tbody>
            {itemsSubtotal > 0 && (
              <tr>
                <td style={{ padding: '3px 8px', color: '#555' }}>Subtotal Serviços:</td>
                <td style={{ padding: '3px 8px', textAlign: 'right' }}>{fmt(itemsSubtotal)}</td>
              </tr>
            )}
            {materialsTotal > 0 && (
              <tr>
                <td style={{ padding: '3px 8px', color: '#555' }}>Materiais:</td>
                <td style={{ padding: '3px 8px', textAlign: 'right' }}>{fmt(materialsTotal)}</td>
              </tr>
            )}
            {laborValue > 0 && (
              <tr>
                <td style={{ padding: '3px 8px', color: '#555' }}>Mão de Obra:</td>
                <td style={{ padding: '3px 8px', textAlign: 'right' }}>{fmt(laborValue)}</td>
              </tr>
            )}
            {discount > 0 && (
              <tr>
                <td style={{ padding: '3px 8px', color: '#d00' }}>Desconto:</td>
                <td style={{ padding: '3px 8px', textAlign: 'right', color: '#d00' }}>- {fmt(discount)}</td>
              </tr>
            )}
            <tr style={{ borderTop: '2px solid #1e3a5f' }}>
              <td style={{ padding: '5px 8px', fontWeight: 'bold', fontSize: '10pt', color: '#1e3a5f' }}>TOTAL A PAGAR:</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', fontSize: '10pt', color: '#1e3a5f' }}>{fmt(finalTotal)}</td>
            </tr>
            {data.payment_conditions && (
              <tr>
                <td colSpan={2} style={{ padding: '3px 8px', fontSize: '8pt', color: '#555', textAlign: 'right' }}>
                  {data.payment_conditions}
                  {data.payment_method && ` — ${data.payment_method}`}
                </td>
              </tr>
            )}
            {data.pix_key && (
              <tr>
                <td colSpan={2} style={{ padding: '2px 8px', fontSize: '8pt', color: '#555', textAlign: 'right' }}>
                  Chave PIX: <strong>{data.pix_key}</strong>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ASSINATURAS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px', marginBottom: '16px' }} className="os-print-no-break">
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #555', paddingTop: '6px', marginTop: '40px', fontSize: '8.5pt', color: '#333' }}>
            <div style={{ fontWeight: '600' }}>Assinatura do Técnico Responsável</div>
            {team.length > 0 && <div style={{ marginTop: '2px', fontSize: '8pt', color: '#666' }}>{team[0].name}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #555', paddingTop: '6px', marginTop: '40px', fontSize: '8.5pt', color: '#333' }}>
            <div style={{ fontWeight: '600' }}>Assinatura do Cliente</div>
            <div style={{ marginTop: '2px', fontSize: '8pt', color: '#666' }}>{data.customer_name}</div>
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '6px', textAlign: 'center', fontSize: '7.5pt', color: '#888' }}>
        Documento gerado em {generatedAt} pelo sistema {companyName} — OS #{data.order_number}
      </div>
    </div>
  )
})

OSPrintDocument.displayName = 'OSPrintDocument'

export default OSPrintDocument
