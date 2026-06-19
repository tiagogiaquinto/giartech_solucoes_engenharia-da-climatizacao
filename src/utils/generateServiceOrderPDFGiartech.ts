interface MaterialItem {
  nome_material?: string; material_name?: string
  quantidade?: number; quantity?: number
  material_unit?: string
  preco_venda?: number; unit_sale_price?: number; unit_price?: number
  observacoes_tecnicas?: string
}
interface ServiceItem {
  service_name?: string; descricao?: string; description?: string
  scope?: string; service_scope?: string; escopo_detalhado?: string
  unit?: string
  unit_price?: number; preco_unitario?: number
  quantity?: number; quantidade?: number
  total_price?: number; preco_total?: number
  materials?: MaterialItem[]
}
interface ServiceOrderData {
  order_number: string; date: string; title?: string
  client: { name: string; company_name?: string; cnpj?: string; cpf?: string; address?: string; city?: string; state?: string; cep?: string; email?: string; phone?: string }
  basic_info?: { deadline: string; brand?: string; model?: string; equipment?: string }
  items: ServiceItem[]
  subtotal: number; discount: number; total: number
  payment: { methods: string; pix?: string; bank_details?: { bank: string; agency: string; account: string; account_type: string; holder: string }; conditions: string }
  warranty?: { period?: string; conditions: string | string[] }
  contract_clauses?: Array<{ title: string; items: string[] }>
  additional_info?: string
}

const EMPRESA = {
  nome: 'Giartech Soluções', proprietario: 'TIAGO BRUNO GIAQUINTO',
  cnpj: '37.509.897/0001-93', endereco: 'Rua Quito, 14, comercial',
  bairro: 'Nossa Senhora do Ó, São Paulo-SP', cep: 'CEP 02734-010',
  email: 'giartechsolucoes@gmail.com', tel1: '+55 (35) 1511-9666',
  tel2: '+351 511 943 985', whatsapp: '11966617631',
  instagram: '@tg.arconnection', facebook: '@tgarconnection',
  site: 'tgarconnection.com.br',
  slogan: 'Sua satisfação é o que motiva a nossa dedicação.',
  cargo: 'Diretor Técnico',
  pix: '37.509.897/0001-93', banco: 'Cora', agencia: '0001',
  conta: '1412009-3', tipo_conta: 'Corrente',
}

const GARANTIA_PADRAO = `Garantias referentes a sistemas novos em tubulações antigas só serão válidas com os processos de descontaminação das tubulações antigas.

Garantia de equipamentos novos (5 a 10 anos) só é válida com manutenção semestral comprovada com laudo técnico.

Garantias estendidas pela nossa empresa são concedidas em caso de compra das máquinas conosco e podem ter até 12 meses, mediante manutenção nos prazos estipulados pelo fabricante.`

const CLAUSULAS_PADRAO = [
  { title: '1. Obrigações do Cliente', items: [
    '1.1. O cliente deve fornecer todas as informações necessárias para a execução adequada dos serviços, incluindo especificações técnicas, localização e horários preferenciais, como também a planta do imóvel e projeto arquitetônico.',
    '1.2. O cliente deve garantir o acesso seguro e adequado às instalações onde os serviços serão realizados.',
    '1.3. O cliente deve comunicar prontamente qualquer problema ou defeito observado nos serviços prestados.',
    '1.4. É de responsabilidade do cliente o destelhamento e reinstalação do telhado.',
  ]},
  { title: '2. Obrigações do Contratante', items: [
    '2.1. O contratante deve realizar os serviços de acordo com as especificações técnicas e com os padrões da indústria.',
    '2.2. O contratante deve cumprir todos os prazos acordados para a execução dos serviços.',
    '2.3. O contratante deve manter o cliente informado sobre o progresso dos serviços e quaisquer problemas ou atrasos.',
  ]},
  { title: '3. Regras de Rescisão', items: [
    '3.1. Ambas as partes têm o direito de rescindir o contrato a qualquer momento, com aviso prévio de 30 dias.',
    '3.2. Em caso de violação das obrigações, a parte não infratora pode rescindir imediatamente, sem aviso prévio.',
  ]},
  { title: '4. Regras Gerais', items: [
    '4.1. Este contrato não cria relação de parceria, joint venture, emprego ou agência entre as partes.',
    '4.2. Nenhuma das partes pode ceder seus direitos sem consentimento prévio por escrito da outra parte.',
    '4.3. Este contrato constitui o acordo completo entre as partes e substitui todos os acordos anteriores.',
  ]},
]

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}
function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
}
function aplicarVariaveis(texto: string, data: ServiceOrderData): string {
  return texto
    .replace(/\[NOME_CLIENTE\]/g, data.client.name || '')
    .replace(/\[CNPJ\]/g, data.client.cnpj || data.client.cpf || '')
    .replace(/\[VALOR_TOTAL\]/g, fmt(data.total))
    .replace(/\[FORMA_PAGAMENTO\]/g, data.payment.methods || '')
    .replace(/\[BANCO\]/g, data.payment.bank_details?.bank || EMPRESA.banco)
    .replace(/\[AGENCIA\]/g, data.payment.bank_details?.agency || EMPRESA.agencia)
    .replace(/\[CONTA\]/g, data.payment.bank_details?.account || EMPRESA.conta)
    .replace(/\[TITULAR\]/g, data.payment.bank_details?.holder || EMPRESA.proprietario)
    .replace(/\[DATA\]/g, fmtDate(data.date))
    .replace(/\[CIDADE\]/g, data.client.city || 'São Paulo')
}

const LOGO_SVG = `
<svg width="54" height="42" viewBox="0 0 54 42" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="b1" x1="0" y1="1" x2="0.7" y2="0">
      <stop offset="0%" stop-color="#e8402a"/>
      <stop offset="100%" stop-color="#ff8149"/>
    </linearGradient>
    <linearGradient id="b2" x1="0" y1="1" x2="0.7" y2="0">
      <stop offset="0%" stop-color="#0062f6"/>
      <stop offset="100%" stop-color="#00d1ff"/>
    </linearGradient>
    <linearGradient id="b3" x1="0" y1="1" x2="0.7" y2="0">
      <stop offset="0%" stop-color="#003db8"/>
      <stop offset="100%" stop-color="#0062f6"/>
    </linearGradient>
  </defs>
  <g transform="rotate(-32, 27, 21)">
    <rect x="2"  y="4"  width="10" height="32" rx="3.5" fill="url(#b1)"/>
    <rect x="20" y="1"  width="10" height="32" rx="3.5" fill="url(#b2)"/>
    <rect x="38" y="4"  width="10" height="32" rx="3.5" fill="url(#b3)"/>
  </g>
</svg>`

export async function generateServiceOrderPDFGiartech(data: ServiceOrderData): Promise<void> {
  const c = data.client
  const p = data.payment
  const bd = p.bank_details
  const clauses = data.contract_clauses?.length ? data.contract_clauses : CLAUSULAS_PADRAO
  const warrantyText = data.warranty?.conditions
    ? (Array.isArray(data.warranty.conditions) ? data.warranty.conditions.join('\n\n') : data.warranty.conditions)
    : GARANTIA_PADRAO

  const todosMateriais = data.items.flatMap(i => i.materials || [])
  const totalMateriais = todosMateriais.reduce((a, m) => a + (m.quantidade || m.quantity || 1) * (m.preco_venda || m.unit_sale_price || 0), 0)

  const servicosRows = data.items.map(item => {
    const nome = item.service_name || item.descricao || item.description || 'Serviço'
    const escopo = item.scope || item.service_scope || item.escopo_detalhado || ''
    const unit = item.unit || 'un.'
    const qty = item.quantity || item.quantidade || 1
    const pUn = item.unit_price || item.preco_unitario || 0
    const total = item.total_price || item.preco_total || pUn * qty
    return `<tr>
      <td style="padding:9px 10px;border-bottom:0.5px solid rgba(0,98,246,0.07);vertical-align:top;">
        <div style="font-weight:600;color:#191919;margin-bottom:2px;">${nome}</div>
        ${escopo ? `<div style="font-size:10px;color:#8a95a8;line-height:1.6;">${escopo.replace(/\n/g, ' · ')}</div>` : ''}
      </td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;white-space:nowrap;">${unit}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;white-space:nowrap;">${fmt(pUn)}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;white-space:nowrap;">${qty > 1 ? qty : '—'}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);font-weight:600;color:#191919;white-space:nowrap;">${fmt(total)}</td>
    </tr>`
  }).join('')

  const materiaisRows = todosMateriais.map(m => {
    const nome = m.nome_material || m.material_name || 'Material'
    const qty = m.quantidade || m.quantity || 1
    const pUn = m.preco_venda || m.unit_sale_price || m.unit_price || 0
    const unit = m.material_unit || 'un.'
    return `<tr>
      <td style="padding:9px 10px;border-bottom:0.5px solid rgba(0,98,246,0.07);vertical-align:top;">
        <div style="font-weight:600;color:#191919;">${nome}</div>
        ${m.observacoes_tecnicas ? `<div style="font-size:10px;color:#8a95a8;">${m.observacoes_tecnicas}</div>` : ''}
      </td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;">${unit}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;">${fmt(pUn)}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;">${qty}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);font-weight:600;color:#191919;">${fmt(qty * pUn)}</td>
    </tr>`
  }).join('')

  const thStyle = 'padding:7px 10px;text-align:left;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#0062f6;border-bottom:1px solid rgba(0,98,246,0.22);background:#eef3ff;'
  const thR = thStyle + 'text-align:right;'

  const clausulasHTML = clauses.map(cl => `
    <div style="margin-bottom:10px;">
      <div style="font-size:11px;font-weight:600;color:#191919;margin-bottom:3px;">${cl.title}</div>
      ${cl.items.map(it => `<div style="font-size:10px;color:#4a5568;line-height:1.8;">${aplicarVariaveis(it, data)}</div>`).join('')}
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>OS ${data.order_number} — ${c.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Questrial&display=swap" rel="stylesheet"/>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Questrial', system-ui, Arial, sans-serif; color: #191919; background: #fff; padding: 32px; font-size: 12px; line-height: 1.5; }
table { border-collapse: collapse; width: 100%; }
@media print { body { padding: 0; } @page { margin: 12mm; size: A4; } }
</style>
</head>
<body>

<!-- CABEÇALHO -->
<div style="padding-bottom:14px;margin-bottom:0;border-bottom:0.5px solid rgba(0,98,246,0.12);">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
    <div>
      <div style="display:flex;align-items:center;gap:14px;">
        ${LOGO_SVG}
        <div>
          <div style="font-family:'Questrial',system-ui,sans-serif;font-size:26px;font-weight:400;color:#191919;letter-spacing:-0.5px;line-height:1;">Giartech</div>
          <div style="font-size:11px;color:#8a95a8;letter-spacing:1px;margin-top:2px;">Soluções</div>
        </div>
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:0.5px solid rgba(0,98,246,0.1);font-size:10px;color:#8a95a8;line-height:1.9;">
        <div>${EMPRESA.proprietario} · CNPJ: ${EMPRESA.cnpj}</div>
        <div>${EMPRESA.endereco} · ${EMPRESA.bairro} · ${EMPRESA.cep}</div>
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0;">
      <div style="font-size:11px;font-weight:600;color:#0062f6;margin-bottom:5px;">${fmtDate(data.date)}</div>
      <div style="font-size:10px;color:#8a95a8;line-height:1.9;">
        <div>${EMPRESA.email}</div>
        <div>${EMPRESA.tel1}</div>
        <div>${EMPRESA.tel2}</div>
        <div>${EMPRESA.whatsapp}</div>
      </div>
    </div>
  </div>
  <div style="margin-top:12px;padding-top:10px;border-top:0.5px solid rgba(0,98,246,0.1);display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:10px;color:#8a95a8;font-style:italic;">${EMPRESA.slogan}</div>
    <div style="display:flex;gap:12px;font-size:10px;color:#8a95a8;">
      <span>${EMPRESA.instagram}</span><span>${EMPRESA.facebook}</span><span>${EMPRESA.site}</span>
    </div>
  </div>
</div>

<!-- BANNER OS -->
<div style="background:#0062f6;padding:13px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:0;">
  <div>
    <div style="font-size:15px;color:#fff;font-weight:400;letter-spacing:0.3px;">Ordem de Serviço ${data.order_number}</div>
    ${data.title ? `<div style="font-size:11px;color:rgba(255,255,255,0.75);margin-top:3px;">${data.title}</div>` : ''}
  </div>
  <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:10px;padding:4px 12px;border-radius:20px;">Emitida em ${fmtDate(data.date)}</div>
</div>

<div style="padding:20px 0;">

<!-- CLIENTE -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Dados do Cliente</div>
  <div style="display:flex;gap:28px;">
    <div style="flex:1;font-size:11px;color:#4a5568;line-height:1.85;">
      <div style="font-size:13px;font-weight:600;color:#191919;margin-bottom:4px;">${c.name}</div>
      ${c.company_name ? `<div>${c.company_name}</div>` : ''}
      ${c.cnpj ? `<div>CNPJ: ${c.cnpj}</div>` : ''}
      ${c.cpf ? `<div>CPF: ${c.cpf}</div>` : ''}
      ${c.address ? `<div>${c.address}</div>` : ''}
      ${c.city ? `<div>${c.city}${c.state ? `, ${c.state}` : ''}</div>` : ''}
      ${c.cep ? `<div>CEP ${c.cep}</div>` : ''}
    </div>
    <div style="min-width:160px;text-align:right;font-size:11px;color:#4a5568;line-height:1.85;">
      ${c.email ? `<div>${c.email}</div>` : ''}
      ${c.phone ? `<div>${c.phone}</div>` : ''}
    </div>
  </div>
</div>

<!-- INFO TÉCNICAS -->
${data.basic_info ? `
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Informações Técnicas</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
    ${[['Prazo', data.basic_info.deadline],['Marca',data.basic_info.brand||'—'],['Modelo',data.basic_info.model||'—'],['Capacidade',data.basic_info.equipment||'—']]
      .map(([l,v]) => `<div style="background:#eef3ff;border:0.5px solid rgba(0,98,246,0.14);border-left:2.5px solid #0062f6;border-radius:7px;padding:8px 10px;"><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#8a95a8;">${l}</div><div style="font-size:12px;font-weight:600;color:#191919;margin-top:2px;">${v}</div></div>`).join('')}
  </div>
</div>` : ''}

<!-- SERVIÇOS -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Serviços</div>
  <table><thead><tr>
    <th style="${thStyle}">Descrição</th>
    <th style="${thR}width:52px;">Un.</th>
    <th style="${thR}width:86px;">Unitário</th>
    <th style="${thR}width:40px;">Qtd.</th>
    <th style="${thR}width:86px;">Total</th>
  </tr></thead><tbody>${servicosRows}</tbody></table>
</div>

${todosMateriais.length > 0 ? `
<!-- MATERIAIS -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Materiais</div>
  <table><thead><tr>
    <th style="${thStyle}">Descrição</th>
    <th style="${thR}width:52px;">Un.</th>
    <th style="${thR}width:86px;">Unitário</th>
    <th style="${thR}width:40px;">Qtd.</th>
    <th style="${thR}width:86px;">Total</th>
  </tr></thead><tbody>${materiaisRows}</tbody></table>
</div>` : ''}

<!-- TOTAIS -->
<div style="display:flex;justify-content:flex-end;margin-bottom:18px;">
  <div style="min-width:220px;">
    <div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;color:#4a5568;border-bottom:0.5px solid rgba(0,98,246,0.08);"><span>Serviços</span><span>${fmt(data.subtotal)}</span></div>
    ${totalMateriais > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;color:#4a5568;border-bottom:0.5px solid rgba(0,98,246,0.08);"><span>Materiais</span><span>${fmt(totalMateriais)}</span></div>` : ''}
    ${data.discount > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;color:#4a5568;"><span>Desconto</span><span>- ${fmt(data.discount)}</span></div>` : ''}
    <div style="display:flex;justify-content:space-between;background:#0062f6;padding:10px 14px;border-radius:7px;margin-top:6px;">
      <span style="font-size:12px;color:rgba(255,255,255,0.8);">Total</span>
      <span style="font-size:17px;color:#fff;font-weight:600;">${fmt(data.total)}</span>
    </div>
  </div>
</div>

<!-- PAGAMENTO -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Pagamento</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:11px;">
    <div>
      <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#0062f6;margin-bottom:6px;">Meios de pagamento</div>
      <div style="color:#4a5568;line-height:1.9;">${p.methods || EMPRESA.pix}</div>
      <div style="margin-top:8px;">
        <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#0062f6;margin-bottom:4px;">Chave PIX</div>
        <div style="display:inline-block;background:#eef3ff;border:0.5px solid rgba(0,98,246,0.25);border-radius:5px;padding:4px 10px;font-family:monospace;color:#0062f6;">${p.pix || EMPRESA.pix}</div>
      </div>
    </div>
    <div>
      <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#0062f6;margin-bottom:6px;">Dados bancários</div>
      <table style="font-size:11px;color:#4a5568;border-collapse:collapse;">
        <tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Banco</td><td>${bd?.bank || EMPRESA.banco}</td></tr>
        <tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Agência</td><td>${bd?.agency || EMPRESA.agencia}</td></tr>
        <tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Conta</td><td>${bd?.account || EMPRESA.conta} (${bd?.account_type || EMPRESA.tipo_conta})</td></tr>
        <tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Titular</td><td>${bd?.holder || EMPRESA.cnpj}</td></tr>
        ${p.conditions ? `<tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Condições</td><td>${p.conditions}</td></tr>` : ''}
      </table>
    </div>
  </div>
</div>

<!-- GARANTIA -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Garantia</div>
  <div style="font-size:10px;color:#4a5568;line-height:1.85;white-space:pre-line;">${aplicarVariaveis(warrantyText as string, data)}</div>
</div>

<!-- CLÁUSULAS -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Cláusulas Contratuais</div>
  ${clausulasHTML}
</div>

${data.additional_info ? `
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Informações Adicionais</div>
  <div style="font-size:11px;color:#4a5568;line-height:1.85;">${data.additional_info}</div>
</div>` : ''}

<!-- ASSINATURAS -->
<div style="margin-top:24px;padding-top:14px;border-top:0.5px solid rgba(0,98,246,0.12);">
  <div style="text-align:center;font-size:11px;color:#4a5568;margin-bottom:4px;font-style:italic;">Trabalhamos para que seus projetos se tornem realidade. Obrigado pela confiança.</div>
  <div style="text-align:center;font-size:11px;color:#8a95a8;font-style:italic;margin-bottom:28px;">obrigado pela confiança, estaremos à disposição.</div>
  <div style="text-align:center;font-size:11px;font-weight:600;color:#191919;margin-bottom:36px;">São Paulo, ${fmtDate(data.date)}</div>
  <div style="display:flex;justify-content:space-around;">
    <div style="text-align:center;min-width:200px;">
      <div style="border-top:1px solid #b0bcd0;padding-top:8px;margin-top:52px;">
        <div style="font-size:12px;font-weight:600;color:#191919;">${EMPRESA.nome}</div>
        <div style="font-size:10px;color:#8a95a8;margin-top:2px;">${EMPRESA.proprietario}</div>
        <div style="font-size:10px;color:#8a95a8;">${EMPRESA.cargo}</div>
      </div>
    </div>
    <div style="text-align:center;min-width:200px;">
      <div style="border-top:1px solid #b0bcd0;padding-top:8px;margin-top:52px;">
        <div style="font-size:12px;font-weight:600;color:#191919;">${c.name}</div>
        ${c.cnpj ? `<div style="font-size:10px;color:#8a95a8;margin-top:2px;">CNPJ ${c.cnpj}</div>` : ''}
        ${c.cpf ? `<div style="font-size:10px;color:#8a95a8;margin-top:2px;">CPF ${c.cpf}</div>` : ''}
      </div>
    </div>
  </div>
</div>

</div>

<!-- ACENTO GRADIENTE -->
<div style="height:3px;background:linear-gradient(to right,#ff8149,#00d1ff,#0062f6);"></div>

<!-- RODAPÉ -->
<div style="background:#f4f7ff;border-top:1px solid rgba(0,98,246,0.12);padding:10px 20px;display:flex;justify-content:space-between;align-items:center;">
  <div style="font-size:9px;color:#8a95a8;line-height:1.85;">
    <div style="font-size:11px;font-weight:600;color:#0062f6;margin-bottom:1px;">${EMPRESA.nome}</div>
    <div>${EMPRESA.proprietario} · CNPJ: ${EMPRESA.cnpj}</div>
    <div>${EMPRESA.endereco} · ${EMPRESA.bairro} · ${EMPRESA.cep}</div>
    <div style="display:flex;gap:10px;margin-top:2px;"><span>${EMPRESA.instagram}</span><span>${EMPRESA.facebook}</span><span>${EMPRESA.site}</span></div>
  </div>
  <div style="text-align:right;font-size:9px;color:#8a95a8;line-height:1.85;">
    <div>${EMPRESA.email}</div>
    <div>${EMPRESA.tel1}</div>
    <div>${EMPRESA.tel2}</div>
    <div>${EMPRESA.whatsapp}</div>
  </div>
</div>

</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=750')
  if (!win) { alert('Permita pop-ups para este site e tente novamente.'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { setTimeout(() => { win.focus(); win.print() }, 600) }
}

export const generateServiceOrderPDF = generateServiceOrderPDFGiartech
