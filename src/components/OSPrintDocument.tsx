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
  warranty_period?: number
  warranty_terms?: string
  // Informacoes tecnicas
  title?: string
  brand?: string
  model?: string
  equipment?: string
  company?: {
    name?: string
    cnpj?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    phone?: string
    phone2?: string
    email?: string
    website?: string
    logo_url?: string
    instagram?: string
    slogan?: string
    bank_name?: string
    bank_agency?: string
    bank_account?: string
    bank_account_type?: string
    bank_holder?: string
  }
}

interface OSPrintDocumentProps {
  data: OSPrintData
}

const ORANGE = '#E07B20'
const ORANGE_LIGHT = '#FDF3E7'
const GRAY_BORDER = '#d1d5db'
const GRAY_TEXT = '#374151'
const GRAY_MUTED = '#6b7280'
const GRAY_LABEL = '#9ca3af'
const TEXT_DARK = '#111827'

function fmt(value: number | undefined | null) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)
}

function fmtDate(date?: string | null) {
  if (!date) return '—'
  try {
    return new Date(date).toLocaleDateString('pt-BR')
  } catch { return date }
}

const pageStyle: React.CSSProperties = {
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
  fontSize: '9pt',
  color: TEXT_DARK,
  background: 'white',
  width: '210mm',
  minHeight: '297mm',
  margin: '0 auto',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
}

const contentPad: React.CSSProperties = {
  padding: '0 18mm',
  flex: 1,
}

/* ── HEADER COMPONENT ─────────────────────────────── */
function DocHeader({ company, date, orderNumber, subtitle }: {
  company: OSPrintData['company']
  date: string
  orderNumber: string
  subtitle?: string
}) {
  const name = company?.name || 'Giartech Soluções'
  const cnpj = company?.cnpj || ''
  const addr = [company?.address, company?.city, company?.state].filter(Boolean).join(', ')
  const zip = company?.zip ? `CEP ${company.zip}` : ''
  const phone = company?.phone || ''
  const phone2 = company?.phone2 || ''
  const email = company?.email || ''
  const website = company?.website || ''
  const instagram = company?.instagram || ''
  const slogan = company?.slogan || 'Sua satisfação é o que motiva a nossa dedicação.'

  return (
    <div style={{ padding: '14mm 18mm 0', borderBottom: `1px solid ${GRAY_BORDER}`, paddingBottom: '6mm' }}>
      {/* Top row: logo + company info + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5mm' }}>
        {/* Left: logo or company name */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
          {company?.logo_url ? (
            <img src={company.logo_url} alt="Logo" style={{ height: '52px', width: '52px', objectFit: 'contain', borderRadius: '4px' }} />
          ) : (
            <div style={{
              width: '52px', height: '52px', borderRadius: '6px',
              background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20pt', fontWeight: '800', color: 'white', flexShrink: 0,
            }}>
              G
            </div>
          )}
          <div>
            <div style={{ fontSize: '13pt', fontWeight: '800', color: ORANGE, letterSpacing: '-0.3px' }}>{name}</div>
            {cnpj && <div style={{ fontSize: '7.5pt', color: GRAY_MUTED, marginTop: '1px' }}>CNPJ: {cnpj}</div>}
            {addr && <div style={{ fontSize: '7.5pt', color: GRAY_MUTED }}>{addr}</div>}
            {zip && <div style={{ fontSize: '7.5pt', color: GRAY_MUTED }}>{zip}</div>}
          </div>
        </div>
        {/* Right: contact + date */}
        <div style={{ textAlign: 'right', fontSize: '7.5pt', color: GRAY_MUTED, lineHeight: '1.7' }}>
          <div style={{ fontSize: '8pt', color: GRAY_TEXT, fontWeight: '600', marginBottom: '2px' }}>{date}</div>
          {email && <div>{email}</div>}
          {phone && <div>{phone}</div>}
          {phone2 && <div>{phone2}</div>}
        </div>
      </div>
      {/* Slogan */}
      {slogan && (
        <div style={{ fontSize: '7.5pt', color: GRAY_MUTED, fontStyle: 'italic', marginBottom: '4mm' }}>
          {slogan}
        </div>
      )}
      {/* Social + website row */}
      {(instagram || website) && (
        <div style={{ display: 'flex', gap: '16px', fontSize: '7.5pt', color: ORANGE, marginBottom: '5mm' }}>
          {instagram && <span>@{instagram.replace('@', '')}</span>}
          {website && <span>{website}</span>}
        </div>
      )}
      {/* OS Title bar */}
      <div style={{
        background: ORANGE,
        borderRadius: '4px',
        padding: '7px 12px',
        marginBottom: '3mm',
      }}>
        <div style={{ fontSize: '12pt', fontWeight: '800', color: 'white' }}>
          Ordem de serviço {orderNumber}
        </div>
        {subtitle && (
          <div style={{ fontSize: '8.5pt', color: 'rgba(255,255,255,0.85)', marginTop: '1px' }}>{subtitle}</div>
        )}
      </div>
    </div>
  )
}

/* ── FOOTER COMPONENT ─────────────────────────────── */
function DocFooter({ company, pageNum, totalPages }: {
  company: OSPrintData['company']
  pageNum: number
  totalPages: number
}) {
  const name = company?.name || 'Giartech Soluções'
  const cnpj = company?.cnpj || ''
  const addr = [company?.address, company?.city, company?.state].filter(Boolean).join(', ')
  const zip = company?.zip ? `CEP ${company.zip}` : ''
  const phone = company?.phone || ''
  const phone2 = company?.phone2 || ''
  const email = company?.email || ''
  const instagram = company?.instagram || ''
  const website = company?.website || ''

  return (
    <div style={{
      marginTop: 'auto',
      borderTop: `1px solid ${GRAY_BORDER}`,
      padding: '6mm 18mm 8mm',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '7pt', color: GRAY_MUTED, lineHeight: '1.7' }}>
          <div style={{ fontWeight: '600', color: GRAY_TEXT }}>{name}</div>
          {cnpj && <div>CNPJ: {cnpj}</div>}
          {addr && <div>{addr}</div>}
          {zip && <div>{zip}</div>}
        </div>
        <div style={{ fontSize: '7pt', color: GRAY_MUTED, lineHeight: '1.7', textAlign: 'right' }}>
          {email && <div>{email}</div>}
          {phone && <div>{phone}</div>}
          {phone2 && <div>{phone2}</div>}
        </div>
      </div>
      {(instagram || website) && (
        <div style={{ display: 'flex', gap: '16px', fontSize: '7pt', color: ORANGE, marginTop: '3mm' }}>
          {instagram && <span>@{instagram.replace('@', '')}</span>}
          {website && <span>{website}</span>}
        </div>
      )}
      <div style={{ textAlign: 'right', fontSize: '7pt', color: GRAY_LABEL, marginTop: '2mm' }}>
        Página {pageNum}/{totalPages}
      </div>
    </div>
  )
}

/* ── SECTION HEADING ──────────────────────────────── */
function SectionHeading({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: '10pt', fontWeight: '700', color: ORANGE,
      borderBottom: `1.5px solid ${ORANGE}`,
      paddingBottom: '3px',
      marginBottom: '5mm',
      marginTop: '5mm',
    }}>
      {title}
    </div>
  )
}

/* ── LABEL/VALUE PAIR ─────────────────────────────── */
function LV({ label, value, bold }: { label: string; value?: string | null; bold?: boolean }) {
  if (!value) return null
  return (
    <div style={{ marginBottom: '2px', fontSize: '8.5pt' }}>
      <span style={{ fontWeight: '700', color: GRAY_TEXT }}>{label}</span>{' '}
      <span style={{ color: bold ? TEXT_DARK : GRAY_MUTED, fontWeight: bold ? '600' : '400' }}>{value}</span>
    </div>
  )
}

const WARRANTY_DEFAULT = (days: number) =>
  `Garantia técnica de ${days} dias contra defeitos de mão de obra, conforme o Código de Defesa do Consumidor (CDC — Lei 8.078/90). A garantia cobre exclusivamente os serviços realizados, não se estendendo a peças/equipamentos de terceiros, danos por mau uso, quedas de energia, falta de manutenção preventiva ou intervenções de terceiros após a conclusão.`

const CLAUSES_DEFAULT = `1. Obrigações do Cliente
1.1. O cliente deve fornecer todas as informações necessárias para a execução adequada dos serviços contratados.
1.2. O cliente deve garantir o acesso seguro e adequado às instalações onde os serviços serão realizados.
1.3. O cliente deve comunicar prontamente qualquer problema ou defeito observado nos serviços prestados.

2. Obrigações do Contratante
2.1. O contratante deve realizar os serviços de acordo com as especificações técnicas e os padrões da indústria.
2.2. O contratante deve cumprir todos os prazos acordados para a execução dos serviços.
2.3. O contratante deve manter o cliente informado sobre o progresso dos serviços.

3. Regras de Rescisão
3.1. Ambas as partes têm o direito de rescindir o contrato a qualquer momento, com aviso prévio de 30 dias.
3.2. Em caso de violação das obrigações, a parte não infratora pode rescindir imediatamente.

4. Regras Gerais
4.1. Este contrato não cria relação de parceria, joint venture, emprego ou agência entre as partes.
4.2. Este contrato constitui o acordo completo entre as partes e substitui todos os acordos anteriores.`

const OSPrintDocument = forwardRef<HTMLDivElement, OSPrintDocumentProps>(({ data }, ref) => {
  const company = data.company || {}
  const items = data.items || []
  const materials = data.materials || []
  const team = data.team || []

  const itemsTotal = items.reduce((s, i) => s + i.total, 0)
  const discount = data.discount || 0
  const finalTotal = data.net_value || data.total_value || Math.max(itemsTotal - discount, 0)
  const warrantyDays = data.warranty_period || 90

  const todayStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const orderNumber = data.order_number || 'S/N'

  const customerAddress = [data.address, data.address_complement].filter(Boolean).join(', ')
  const customerCityState = data.city || ''

  const paymentMethod = (() => {
    const m = data.payment_method || ''
    const map: Record<string, string> = {
      pix: 'PIX', boleto: 'Boleto Bancário',
      credito: 'Cartão de Crédito', cartao_credito: 'Cartão de Crédito',
      debito: 'Cartão de Débito', cartao_debito: 'Cartão de Débito',
      dinheiro: 'Dinheiro', transferencia: 'Transferência Bancária',
    }
    return map[m] || m || 'Transferência bancária, dinheiro, cartão de crédito, cartão de débito ou pix.'
  })()

  const hasBankInfo = company.bank_name || company.bank_agency || company.bank_account

  return (
    <div ref={ref} style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", color: TEXT_DARK, background: 'white' }}>

      {/* ═══════════════ PÁGINA 1 ═══════════════ */}
      <div style={{ ...pageStyle }}>
        <DocHeader
          company={company}
          date={todayStr}
          orderNumber={orderNumber}
          subtitle={data.title || data.description?.split('\n')[0]?.slice(0, 80) || ''}
        />

        <div style={contentPad}>
          {/* Cliente */}
          <div style={{ marginTop: '5mm', paddingBottom: '5mm', borderBottom: `1px solid ${GRAY_BORDER}` }}>
            <div style={{ fontSize: '9pt', fontWeight: '700', color: TEXT_DARK, marginBottom: '3px' }}>
              Cliente: {data.customer_name}
            </div>
            {data.customer_cpf_cnpj && (
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED }}>{data.customer_cpf_cnpj.length > 14 ? 'CNPJ: ' : 'CPF: '}{data.customer_cpf_cnpj}</div>
            )}
            {customerAddress && (
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED }}>{customerAddress}</div>
            )}
            {customerCityState && (
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED }}>{customerCityState}</div>
            )}
            {data.customer_phone && (
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED, marginTop: '2px' }}>{data.customer_phone}</div>
            )}
            {data.customer_email && (
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED }}>{data.customer_email}</div>
            )}
          </div>

          {/* Informacoes tecnicas do equipamento */}
          {(data.brand || data.model || data.equipment || data.title) && (
            <div style={{ marginTop: '4mm', marginBottom: '4mm' }}>
              <SectionHeading title="Informacoes do Equipamento" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '2mm' }}>
                {data.execution_deadline && (
                  <div style={{ background: ORANGE_LIGHT, borderLeft: `3px solid ${ORANGE}`, borderRadius: '4px', padding: '6px 8px' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: GRAY_LABEL, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prazo</div>
                    <div style={{ fontSize: '9pt', fontWeight: '700', color: TEXT_DARK, marginTop: '2px' }}>{fmtDate(data.execution_deadline)}</div>
                  </div>
                )}
                {data.brand && (
                  <div style={{ background: ORANGE_LIGHT, borderLeft: `3px solid ${ORANGE}`, borderRadius: '4px', padding: '6px 8px' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: GRAY_LABEL, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marca</div>
                    <div style={{ fontSize: '9pt', fontWeight: '700', color: TEXT_DARK, marginTop: '2px' }}>{data.brand}</div>
                  </div>
                )}
                {data.model && (
                  <div style={{ background: ORANGE_LIGHT, borderLeft: `3px solid ${ORANGE}`, borderRadius: '4px', padding: '6px 8px' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: GRAY_LABEL, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modelo</div>
                    <div style={{ fontSize: '9pt', fontWeight: '700', color: TEXT_DARK, marginTop: '2px' }}>{data.model}</div>
                  </div>
                )}
                {data.equipment && (
                  <div style={{ background: ORANGE_LIGHT, borderLeft: `3px solid ${ORANGE}`, borderRadius: '4px', padding: '6px 8px' }}>
                    <div style={{ fontSize: '7pt', fontWeight: '700', color: GRAY_LABEL, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capacidade</div>
                    <div style={{ fontSize: '9pt', fontWeight: '700', color: TEXT_DARK, marginTop: '2px' }}>{data.equipment}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informações básicas */}
          <SectionHeading title="Informações básicas" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: '4mm' }}>
            {data.execution_deadline && (
              <>
                <LV label="Prazo de execução" value={fmtDate(data.execution_deadline)} />
                <LV label="Data agendada" value={fmtDate(data.scheduled_date)} />
              </>
            )}
            {data.priority && data.priority !== 'Normal' && (
              <LV label="Prioridade" value={data.priority} />
            )}
            {team.length > 0 && (
              <LV label="Técnico(s)" value={team.map(t => t.name).join(', ')} />
            )}
          </div>

          {/* Observações (full description) */}
          {data.description && (
            <div style={{ marginBottom: '4mm' }}>
              <div style={{ fontSize: '8pt', fontWeight: '700', color: GRAY_TEXT, marginBottom: '3px' }}>Observações</div>
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED, lineHeight: '1.6', whiteSpace: 'pre-line' }}>{data.description}</div>
            </div>
          )}

          {data.instructions && (
            <div style={{ marginBottom: '4mm' }}>
              <div style={{ fontSize: '8pt', fontWeight: '700', color: GRAY_TEXT, marginBottom: '3px' }}>Instruções técnicas</div>
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED, lineHeight: '1.6', whiteSpace: 'pre-line' }}>{data.instructions}</div>
            </div>
          )}

          {/* Serviços */}
          {items.length > 0 && (
            <>
              <SectionHeading title="Serviços" />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '4mm' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${GRAY_BORDER}` }}>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: GRAY_LABEL, fontWeight: '500', fontSize: '8pt' }}>Descrição</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: GRAY_LABEL, fontWeight: '500', fontSize: '8pt', width: '50px' }}>Unidade</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right', color: GRAY_LABEL, fontWeight: '500', fontSize: '8pt', width: '90px' }}>Preço unitário</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: GRAY_LABEL, fontWeight: '500', fontSize: '8pt', width: '40px' }}>Qtd.</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right', color: GRAY_LABEL, fontWeight: '500', fontSize: '8pt', width: '90px' }}>Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid #f3f4f6` }}>
                      <td style={{ padding: '5px 6px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '700', color: TEXT_DARK }}>{item.name}</div>
                        {item.description && (
                          <div style={{ fontSize: '7.5pt', color: GRAY_MUTED, marginTop: '2px', whiteSpace: 'pre-line' }}>{item.description}</div>
                        )}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: GRAY_TEXT, verticalAlign: 'top' }}>{item.unit || 'un.'}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: GRAY_TEXT, verticalAlign: 'top' }}>{fmt(item.unit_price)}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: GRAY_TEXT, verticalAlign: 'top' }}>{item.quantity}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: '700', color: TEXT_DARK, verticalAlign: 'top' }}>{fmt(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total row */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6mm' }}>
                <table style={{ fontSize: '8.5pt', borderCollapse: 'collapse' }}>
                  {discount > 0 && (
                    <tr>
                      <td style={{ padding: '3px 10px', color: GRAY_MUTED, textAlign: 'right' }}>Subtotal</td>
                      <td style={{ padding: '3px 10px', textAlign: 'right', color: GRAY_TEXT }}>{fmt(itemsTotal)}</td>
                    </tr>
                  )}
                  {discount > 0 && (
                    <tr>
                      <td style={{ padding: '3px 10px', color: '#dc2626', textAlign: 'right' }}>Desconto</td>
                      <td style={{ padding: '3px 10px', textAlign: 'right', color: '#dc2626' }}>− {fmt(discount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '5px 10px 3px', textAlign: 'right', fontWeight: '700', color: TEXT_DARK, borderTop: `1px solid ${GRAY_BORDER}`, fontSize: '9pt' }}>Total</td>
                    <td style={{ padding: '5px 10px 3px', textAlign: 'right', fontWeight: '800', color: TEXT_DARK, borderTop: `1px solid ${GRAY_BORDER}`, fontSize: '9pt' }}>{fmt(finalTotal)}</td>
                  </tr>
                </table>
              </div>
            </>
          )}

          {/* Materiais */}
          {materials.length > 0 && (
            <>
              <SectionHeading title="Materiais utilizados" />
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5pt', marginBottom: '4mm' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${GRAY_BORDER}` }}>
                    <th style={{ padding: '4px 6px', textAlign: 'left', color: GRAY_LABEL, fontWeight: '500' }}>Material</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: GRAY_LABEL, fontWeight: '500', width: '50px' }}>Un.</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right', color: GRAY_LABEL, fontWeight: '500', width: '90px' }}>Vl. Unit.</th>
                    <th style={{ padding: '4px 6px', textAlign: 'center', color: GRAY_LABEL, fontWeight: '500', width: '40px' }}>Qtd</th>
                    <th style={{ padding: '4px 6px', textAlign: 'right', color: GRAY_LABEL, fontWeight: '500', width: '90px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '5px 6px', color: GRAY_TEXT }}>{m.name}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: GRAY_MUTED }}>{m.unit || 'un'}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', color: GRAY_TEXT }}>{fmt(m.unit_cost)}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'center', color: GRAY_TEXT }}>{m.quantity}</td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: '700', color: TEXT_DARK }}>{fmt(m.total_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* Relatório técnico */}
          {data.report && (
            <>
              <SectionHeading title="Relatório de execução" />
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED, lineHeight: '1.6', marginBottom: '4mm', whiteSpace: 'pre-line' }}>
                {data.report}
              </div>
            </>
          )}
        </div>

        <DocFooter company={company} pageNum={1} totalPages={3} />
      </div>

      {/* ═══════════════ PÁGINA 2 ═══════════════ */}
      <div style={{ ...pageStyle, pageBreakBefore: 'always' }}>
        <DocHeader
          company={company}
          date={todayStr}
          orderNumber={orderNumber}
        />

        <div style={contentPad}>
          {/* Pagamento */}
          <SectionHeading title="Pagamento" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: '4mm' }}>
            <div>
              <div style={{ fontSize: '8pt', fontWeight: '700', color: GRAY_TEXT, marginBottom: '2px' }}>Meios de pagamento</div>
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED }}>{paymentMethod}</div>
            </div>
            {data.pix_key && (
              <div>
                <div style={{ fontSize: '8pt', fontWeight: '700', color: GRAY_TEXT, marginBottom: '2px' }}>PIX</div>
                <div style={{ fontSize: '8.5pt', color: GRAY_MUTED }}>{data.pix_key}</div>
              </div>
            )}
          </div>
          {hasBankInfo && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px', marginBottom: '4mm' }}>
              <div>
                <div style={{ fontSize: '8pt', fontWeight: '700', color: GRAY_TEXT, marginBottom: '2px' }}>Dados bancários</div>
                <div style={{ fontSize: '8.5pt', color: GRAY_MUTED, lineHeight: '1.7' }}>
                  {company.bank_name && <div>Banco: {company.bank_name}</div>}
                  {company.bank_agency && <div>Agência: {company.bank_agency}</div>}
                  {company.bank_account && <div>Conta: {company.bank_account}</div>}
                  {company.bank_account_type && <div>Tipo de conta: {company.bank_account_type}</div>}
                  {company.bank_holder && <div>Titular: {company.bank_holder}</div>}
                </div>
              </div>
              {data.payment_conditions && (
                <div>
                  <div style={{ fontSize: '8pt', fontWeight: '700', color: GRAY_TEXT, marginBottom: '2px' }}>Condições de pagamento</div>
                  <div style={{ fontSize: '8.5pt', color: GRAY_MUTED }}>{data.payment_conditions}</div>
                </div>
              )}
            </div>
          )}
          {!hasBankInfo && data.payment_conditions && (
            <div style={{ marginBottom: '4mm' }}>
              <div style={{ fontSize: '8pt', fontWeight: '700', color: GRAY_TEXT, marginBottom: '2px' }}>Condições de pagamento</div>
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED }}>{data.payment_conditions}</div>
            </div>
          )}

          {/* Garantia */}
          <SectionHeading title="Garantia" />
          <div style={{ marginBottom: '3mm' }}>
            <div style={{ fontSize: '8pt', fontWeight: '700', color: GRAY_TEXT, marginBottom: '2px' }}>Período de garantia</div>
            <div style={{ fontSize: '8.5pt', color: GRAY_MUTED }}>{warrantyDays} meses</div>
          </div>
          <div style={{ marginBottom: '4mm' }}>
            <div style={{ fontSize: '8pt', fontWeight: '700', color: GRAY_TEXT, marginBottom: '2px' }}>Condições da garantia</div>
            <div style={{ fontSize: '8.5pt', color: GRAY_MUTED, lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {data.warranty_terms || WARRANTY_DEFAULT(warrantyDays)}
            </div>
          </div>

          {/* Cláusulas contratuais */}
          <SectionHeading title="Cláusulas contratuais" />
          <div style={{ fontSize: '8.5pt', color: GRAY_MUTED, lineHeight: '1.65', whiteSpace: 'pre-line', marginBottom: '4mm' }}>
            {CLAUSES_DEFAULT}
          </div>

          {/* Informações adicionais */}
          {data.instructions && (
            <>
              <SectionHeading title="Informações adicionais" />
              <div style={{ fontSize: '8.5pt', color: GRAY_MUTED, lineHeight: '1.6', marginBottom: '2mm' }}>
                {data.instructions}
              </div>
            </>
          )}
        </div>

        <DocFooter company={company} pageNum={2} totalPages={3} />
      </div>

      {/* ═══════════════ PÁGINA 3 — ASSINATURAS ═══════════════ */}
      <div style={{ ...pageStyle, pageBreakBefore: 'always' }}>
        <DocHeader
          company={company}
          date={todayStr}
          orderNumber={orderNumber}
        />

        <div style={{ ...contentPad, paddingTop: '16mm' }}>
          {/* Date line */}
          <div style={{ textAlign: 'center', fontSize: '9pt', fontWeight: '600', color: TEXT_DARK, marginBottom: '14mm' }}>
            {(() => {
              const d = new Date()
              const city = company?.city || 'São Paulo'
              return `${city.split('-')[0].trim()}, ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
            })()}
          </div>

          {/* Signature blocks */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '14mm' }}>
            {/* Company signature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '36px', marginBottom: '6px' }} />
              <div style={{ borderTop: `1px solid ${GRAY_BORDER}`, paddingTop: '6px' }}>
                <div style={{ fontSize: '8.5pt', fontWeight: '700', color: TEXT_DARK }}>{company.name || 'Giartech Soluções'}</div>
                {team.length > 0 && (
                  <>
                    <div style={{ fontSize: '8pt', color: GRAY_MUTED, marginTop: '2px' }}>{team[0].name}</div>
                    {team[0].role && <div style={{ fontSize: '8pt', color: GRAY_MUTED }}>{team[0].role}</div>}
                  </>
                )}
              </div>
            </div>
            {/* Client signature */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ height: '36px', marginBottom: '6px' }} />
              <div style={{ borderTop: `1px solid ${GRAY_BORDER}`, paddingTop: '6px' }}>
                <div style={{ fontSize: '8.5pt', fontWeight: '700', color: TEXT_DARK }}>{data.customer_name}</div>
              </div>
            </div>
          </div>
        </div>

        <DocFooter company={company} pageNum={3} totalPages={3} />
      </div>

    </div>
  )
})

OSPrintDocument.displayName = 'OSPrintDocument'
export default OSPrintDocument
