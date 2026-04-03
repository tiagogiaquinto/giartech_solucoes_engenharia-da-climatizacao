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

const STATUS_COLORS: Record<string, string> = {
  pending: '#b45309',
  open: '#1d4ed8',
  in_progress: '#1d4ed8',
  completed: '#065f46',
  cancelled: '#991b1b',
  pausado: '#92400e',
  cotacao: '#0369a1',
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

const BRAND_DARK = '#0f2d52'
const BRAND_MID = '#1a4a7c'
const BRAND_LIGHT = '#e8f0fb'
const ACCENT = '#2563eb'

const OSPrintDocument = forwardRef<HTMLDivElement, OSPrintDocumentProps>(({ data }, ref) => {
  const company = data.company || {}
  const companyName = company.name || 'Giartech Soluções'
  const cnpj = company.cnpj || ''
  const companyPhone = company.phone || ''
  const companyEmail = company.email || ''
  const companyWebsite = company.website || ''
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

  const statusLabel = STATUS_LABELS[data.status] || data.status
  void STATUS_COLORS

  return (
    <div
      ref={ref}
      className="os-print-document"
      style={{
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        fontSize: '9.5pt',
        color: '#1a1a1a',
        background: 'white',
        maxWidth: '794px',
        margin: '0 auto',
      }}
    >
      {/* ── CABEÇALHO PREMIUM ─────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND_DARK} 0%, ${BRAND_MID} 60%, ${ACCENT} 100%)`,
        borderRadius: '8px 8px 0 0',
        padding: '20px 24px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '0',
      }}>
        <div>
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt="Logo"
              style={{ height: '44px', marginBottom: '8px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
          ) : (
            <div style={{ fontSize: '17pt', fontWeight: '800', color: 'white', letterSpacing: '-0.3px', marginBottom: '4px' }}>
              {companyName}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {cnpj && (
              <div style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.75)' }}>
                CNPJ: {cnpj}
              </div>
            )}
            {companyAddress && (
              <div style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.75)' }}>
                {companyAddress}
              </div>
            )}
            <div style={{ fontSize: '8pt', color: 'rgba(255,255,255,0.75)' }}>
              {[companyPhone, companyEmail, companyWebsite].filter(Boolean).join('  ·  ')}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '6px',
            padding: '6px 14px',
            marginBottom: '8px',
          }}>
            <div style={{ fontSize: '7.5pt', color: 'rgba(255,255,255,0.7)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '2px' }}>
              Ordem de Serviço
            </div>
            <div style={{ fontSize: '16pt', fontWeight: '800', color: 'white', lineHeight: 1 }}>
              #{data.order_number}
            </div>
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.18)',
            border: `1px solid rgba(255,255,255,0.3)`,
            borderRadius: '20px',
            padding: '3px 10px',
          }}>
            <span style={{ fontSize: '7.5pt', fontWeight: '600', color: 'white', letterSpacing: '0.3px' }}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* linha separadora degradê */}
      <div style={{
        height: '3px',
        background: `linear-gradient(90deg, ${ACCENT} 0%, ${BRAND_MID} 50%, transparent 100%)`,
        marginBottom: '16px',
      }} />

      {/* ── DADOS DA OS + CLIENTE ──────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
        {/* Dados da OS */}
        <div style={{
          background: BRAND_LIGHT,
          borderRadius: '6px',
          padding: '10px 12px',
          borderLeft: `3px solid ${ACCENT}`,
        }}>
          <div style={{
            fontSize: '7.5pt', fontWeight: '700', color: BRAND_DARK,
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
          }}>
            Dados da OS
          </div>
          <table style={{ width: '100%', fontSize: '8.5pt', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: '#64748b', paddingBottom: '4px', width: '50%', verticalAlign: 'top' }}>Abertura:</td>
                <td style={{ fontWeight: '600', paddingBottom: '4px', color: '#1e293b' }}>{fmtDate(data.created_at)}</td>
              </tr>
              {data.scheduled_date && (
                <tr>
                  <td style={{ color: '#64748b', paddingBottom: '4px' }}>Agendamento:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '4px', color: '#1e293b' }}>{fmtDate(data.scheduled_date)}</td>
                </tr>
              )}
              {data.execution_deadline && (
                <tr>
                  <td style={{ color: '#64748b', paddingBottom: '4px' }}>Prazo:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '4px', color: '#1e293b' }}>{fmtDate(data.execution_deadline)}</td>
                </tr>
              )}
              <tr>
                <td style={{ color: '#64748b', paddingBottom: '4px' }}>Prioridade:</td>
                <td style={{ fontWeight: '600', paddingBottom: '4px', color: '#1e293b' }}>{data.priority || 'Normal'}</td>
              </tr>
              {team.length > 0 && (
                <tr>
                  <td style={{ color: '#64748b', paddingBottom: '2px' }}>Técnico(s):</td>
                  <td style={{ fontWeight: '600', paddingBottom: '2px', color: '#1e293b' }}>{team.map(t => t.name).join(', ')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Dados do Cliente */}
        <div style={{
          background: '#f0fdf4',
          borderRadius: '6px',
          padding: '10px 12px',
          borderLeft: '3px solid #16a34a',
        }}>
          <div style={{
            fontSize: '7.5pt', fontWeight: '700', color: '#14532d',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
          }}>
            Dados do Cliente
          </div>
          <table style={{ width: '100%', fontSize: '8.5pt', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ color: '#64748b', paddingBottom: '4px', width: '35%', verticalAlign: 'top' }}>Nome:</td>
                <td style={{ fontWeight: '600', paddingBottom: '4px', color: '#1e293b' }}>{data.customer_name}</td>
              </tr>
              {data.customer_cpf_cnpj && (
                <tr>
                  <td style={{ color: '#64748b', paddingBottom: '4px' }}>CPF/CNPJ:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '4px', color: '#1e293b' }}>{data.customer_cpf_cnpj}</td>
                </tr>
              )}
              {data.customer_phone && (
                <tr>
                  <td style={{ color: '#64748b', paddingBottom: '4px' }}>Telefone:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '4px', color: '#1e293b' }}>{data.customer_phone}</td>
                </tr>
              )}
              {data.customer_email && (
                <tr>
                  <td style={{ color: '#64748b', paddingBottom: '4px' }}>E-mail:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '4px', color: '#1e293b' }}>{data.customer_email}</td>
                </tr>
              )}
              {customerAddress && (
                <tr>
                  <td style={{ color: '#64748b', paddingBottom: '2px', verticalAlign: 'top' }}>Endereço:</td>
                  <td style={{ fontWeight: '600', paddingBottom: '2px', color: '#1e293b' }}>{customerAddress}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DESCRIÇÃO ─────────────────────────────────── */}
      {data.description && (
        <div style={{
          background: '#fafafa',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '14px',
        }} className="os-print-no-break">
          <div style={{
            fontSize: '7.5pt', fontWeight: '700', color: BRAND_DARK,
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
          }}>
            Descrição do Serviço / Problema Relatado
          </div>
          <p style={{ fontSize: '8.5pt', lineHeight: '1.65', margin: 0, color: '#374151' }}>{data.description}</p>
        </div>
      )}

      {/* ── TABELA DE SERVIÇOS ─────────────────────────── */}
      {allItems.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            fontSize: '7.5pt', fontWeight: '700', color: BRAND_DARK,
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
            paddingBottom: '4px',
            borderBottom: `2px solid ${ACCENT}`,
            display: 'inline-block',
          }}>
            Serviços Executados
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{
                background: `linear-gradient(90deg, ${BRAND_DARK} 0%, ${BRAND_MID} 100%)`,
              }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '8pt' }}>Descrição</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: '600', fontSize: '8pt', width: '50px' }}>Qtd</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: '600', fontSize: '8pt', width: '38px' }}>Un</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', color: 'white', fontWeight: '600', fontSize: '8pt', width: '88px' }}>Vl. Unit.</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', color: 'white', fontWeight: '600', fontSize: '8pt', width: '88px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#F9FAFB' }}>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.name}</div>
                    {item.description && (
                      <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '1px' }}>{item.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>{item.quantity}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>{item.unit || 'UN'}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>{fmt(item.unit_price)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontWeight: '700', color: BRAND_DARK }}>{fmt(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TABELA DE MATERIAIS ────────────────────────── */}
      {materials.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{
            fontSize: '7.5pt', fontWeight: '700', color: '#065f46',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
            paddingBottom: '4px',
            borderBottom: '2px solid #16a34a',
            display: 'inline-block',
          }}>
            Materiais / Peças Utilizados
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt' }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #064e3b 0%, #065f46 100%)' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left', color: 'white', fontWeight: '600', fontSize: '8pt' }}>Material / Peça</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: '600', fontSize: '8pt', width: '50px' }}>Qtd</th>
                <th style={{ padding: '6px 8px', textAlign: 'center', color: 'white', fontWeight: '600', fontSize: '8pt', width: '38px' }}>Un</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', color: 'white', fontWeight: '600', fontSize: '8pt', width: '88px' }}>Vl. Unit.</th>
                <th style={{ padding: '6px 10px', textAlign: 'right', color: 'white', fontWeight: '600', fontSize: '8pt', width: '88px' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((mat, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#F9FAFB' }}>
                  <td style={{ padding: '6px 10px', borderBottom: '1px solid #f1f5f9', color: '#1e293b' }}>{mat.name}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>{mat.quantity}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>{mat.unit || 'UN'}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', color: '#374151' }}>{fmt(mat.unit_cost)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', borderBottom: '1px solid #f1f5f9', fontWeight: '700', color: '#065f46' }}>{fmt(mat.total_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── RELATÓRIO TÉCNICO ──────────────────────────── */}
      {data.report && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderLeft: '3px solid #d97706',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '14px',
        }} className="os-print-no-break">
          <div style={{
            fontSize: '7.5pt', fontWeight: '700', color: '#92400e',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px',
          }}>
            Solução / Relatório Técnico
          </div>
          <p style={{ fontSize: '8.5pt', lineHeight: '1.65', margin: 0, color: '#451a03' }}>{data.report}</p>
        </div>
      )}

      {/* ── RESUMO FINANCEIRO PREMIUM ──────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }} className="os-print-no-break">
        <div style={{
          width: '260px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(15,45,82,0.08)',
        }}>
          <div style={{
            background: `linear-gradient(90deg, ${BRAND_DARK} 0%, ${BRAND_MID} 100%)`,
            padding: '6px 14px',
          }}>
            <span style={{ fontSize: '7.5pt', fontWeight: '700', color: 'white', letterSpacing: '1px', textTransform: 'uppercase' }}>
              Resumo Financeiro
            </span>
          </div>
          <div style={{ background: 'white', padding: '8px 14px' }}>
            {itemsSubtotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '8.5pt', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                <span>Subtotal Serviços</span>
                <span>{fmt(itemsSubtotal)}</span>
              </div>
            )}
            {materialsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '8.5pt', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                <span>Materiais</span>
                <span>{fmt(materialsTotal)}</span>
              </div>
            )}
            {laborValue > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '8.5pt', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                <span>Mão de Obra</span>
                <span>{fmt(laborValue)}</span>
              </div>
            )}
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '8.5pt', color: '#dc2626', borderBottom: '1px solid #f1f5f9' }}>
                <span>Desconto</span>
                <span>− {fmt(discount)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0 4px',
              marginTop: '2px',
            }}>
              <span style={{ fontSize: '9pt', fontWeight: '700', color: BRAND_DARK }}>Total a Pagar</span>
              <span style={{ fontSize: '14pt', fontWeight: '800', color: ACCENT }}>{fmt(finalTotal)}</span>
            </div>
            {(data.payment_conditions || data.payment_method) && (
              <div style={{ fontSize: '7.5pt', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '5px', marginTop: '2px' }}>
                {data.payment_conditions}{data.payment_method ? ` — ${data.payment_method}` : ''}
              </div>
            )}
            {data.pix_key && (
              <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '2px' }}>
                Chave PIX: <strong>{data.pix_key}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ASSINATURAS ────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '32px',
        marginTop: '28px',
        marginBottom: '14px',
        padding: '0 8px',
      }} className="os-print-no-break">
        <div style={{ textAlign: 'center' }}>
          <div style={{
            height: '40px',
            marginBottom: '0',
          }} />
          <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '5px' }}>
            <div style={{ fontSize: '8pt', fontWeight: '600', color: '#1e293b' }}>Responsável Técnico</div>
            {team.length > 0 && (
              <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '2px' }}>{team[0].name}{team[0].role ? ` — ${team[0].role}` : ''}</div>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ height: '40px', marginBottom: '0' }} />
          <div style={{ borderTop: '1px solid #94a3b8', paddingTop: '5px' }}>
            <div style={{ fontSize: '8pt', fontWeight: '600', color: '#1e293b' }}>Assinatura do Cliente / Recebido</div>
            <div style={{ fontSize: '7.5pt', color: '#64748b', marginTop: '2px' }}>{data.customer_name}</div>
          </div>
        </div>
      </div>

      {/* ── RODAPÉ ─────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid #e2e8f0',
        paddingTop: '8px',
        marginTop: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: '7pt', color: '#94a3b8' }}>
          {companyName} · {cnpj}
        </div>
        <div style={{ fontSize: '7pt', color: '#94a3b8' }}>
          OS #{data.order_number} · Gerado em {generatedAt}
        </div>
      </div>
    </div>
  )
})

OSPrintDocument.displayName = 'OSPrintDocument'

export default OSPrintDocument
