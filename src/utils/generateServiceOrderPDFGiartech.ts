interface MaterialItem {
  nome_material?: string
  material_name?: string
  quantidade?: number
  quantity?: number
  material_unit?: string
  preco_venda?: number
  unit_sale_price?: number
  observacoes_tecnicas?: string
}

interface ServiceItem {
  service_name?: string
  descricao?: string
  description?: string
  scope?: string
  service_scope?: string
  escopo_detalhado?: string
  unit?: string
  unit_price?: number
  preco_unitario?: number
  quantity?: number
  quantidade?: number
  total_price?: number
  preco_total?: number
  materials?: MaterialItem[]
}

interface ServiceOrderData {
  order_number: string
  date: string
  title?: string
  client: {
    name: string
    company_name?: string
    cnpj?: string
    cpf?: string
    address?: string
    city?: string
    state?: string
    cep?: string
    email?: string
    phone?: string
  }
  basic_info?: {
    deadline: string
    brand?: string
    model?: string
    equipment?: string
  }
  items: ServiceItem[]
  subtotal: number
  discount: number
  total: number
  payment: {
    methods: string
    pix?: string
    bank_details?: {
      bank: string
      agency: string
      account: string
      account_type: string
      holder: string
    }
    conditions: string
  }
  warranty?: { period?: string; conditions: string | string[] }
  contract_clauses?: Array<{ title: string; items: string[] }>
  additional_info?: string
}

const EMPRESA = {
  nome: 'Giartech Soluções',
  proprietario: 'TIAGO BRUNO GIAQUINTO',
  cnpj: '37.509.897/0001-93',
  endereco: 'Rua Quito, 14, comercial',
  bairro: 'Nossa Senhora do Ó, São Paulo-SP',
  cep: 'CEP 02734-010',
  email: 'giartechsolucoes@gmail.com',
  tel1: '+55 (35) 1511-9666',
  tel2: '+351 511 943 985',
  whatsapp: '11966617631',
  instagram: '@tg.arconnection',
  facebook: '@tgarconnection',
  site: 'tgarconnection.com.br',
  slogan: 'Sua satisfação é o que motiva a nossa dedicação.',
  cargo: 'diretor técnico',
  pix: '37.509.897/0001-93',
  banco: 'Cora',
  agencia: '0001',
  conta: '1412009-3',
  tipo_conta: 'Corrente',
}

const GARANTIA = `Garantias referentes à sistemas de novo em tubulações antigas, só serão válidas, com os processos de descontaminação das tubulações antigas.

Garantia de (EQUIPAMENTOS NOVOS) que podem ser de 5 a 10 anos, só são válidas com manutenção semestral comprovada COM LAUDO TÉCNICO.

Garantias extendidas pela nossa empresa, são concedidas em caso de compra das máquinas conosco, as mesmas deixam de ter validade legal de 3 meses e podem ter até 12 meses de acordo com o tipo e capacidade do sistema, mediante a manutenção dos equipamentos realizadas conosco nos prazos estipulados pelo fabricante...`

const CLAUSULAS = [
  { title: '1. Obrigações do Cliente', items: ['1.1. O cliente deve fornecer todas as informações necessárias para a execução adequada dos serviços contratados, incluindo especificações técnicas, localização e horários preferenciais, como também a planta do imóvel e projeto arquitetônico.', '1.2. O cliente deve garantir o acesso seguro e adequado às instalações onde os serviços serão realizados.', '1.3. O cliente deve comunicar prontamente qualquer problema ou defeito observado nos serviços prestados.', '1.4. É de responsabilidade do cliente o destelhamento e reinstalação do telhado.'] },
  { title: '2. Obrigações do Contratante', items: ['2.1. O contratante deve realizar os serviços de acordo com as especificações técnicas fornecidas pelo cliente e com os padrões da indústria.', '2.2. O contratante deve cumprir todos os prazos acordados para a execução dos serviços.', '2.3. O contratante deve manter o cliente informado sobre o progresso dos serviços e quaisquer problemas ou atrasos que possam surgir.'] },
  { title: '3. Regras de Rescisão', items: ['3.1. Ambas as partes têm o direito de rescindir o contrato a qualquer momento, com aviso prévio de 30 dias.', '3.2. Em caso de violação das obrigações, a parte não infratora pode rescindir imediatamente, sem aviso prévio.'] },
  { title: '4. Regras Gerais', items: ['4.1. Este contrato não cria relação de parceria, joint venture, emprego ou agência entre as partes.', '4.2. Nenhuma das partes pode ceder seus direitos sem consentimento prévio por escrito da outra parte.', '4.3. Este contrato constitui o acordo completo entre as partes e substitui todos os acordos anteriores.'] },
]

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('pt-BR') } catch { return d }
}

export async function generateServiceOrderPDFGiartech(data: ServiceOrderData): Promise<void> {
  const c = data.client
  const p = data.payment
  const bd = p.bank_details
  const clauses = data.contract_clauses?.length ? data.contract_clauses : CLAUSULAS

  const todosMateriais = data.items.flatMap(i => i.materials || [])
  const totalMateriais = todosMateriais.reduce((a, m) => a + (m.quantidade || m.quantity || 1) * (m.preco_venda || m.unit_sale_price || 0), 0)

  const servicosRows = data.items.map(item => {
    const nome = item.service_name || item.descricao || item.description || 'Serviço'
    const escopo = item.scope || item.service_scope || item.escopo_detalhado || ''
    const unit = item.unit || 'un.'
    const qty = item.quantity || item.quantidade || 1
    const pUn = item.unit_price || item.preco_unitario || 0
    const total = item.total_price || item.preco_total || pUn * qty
    const escopoHtml = escopo ? escopo.split('\n').map(l => `<div style="color:#666;font-size:10px;margin-top:1px;">${l}</div>`).join('') : ''
    return `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;vertical-align:top;"><div style="font-weight:700;color:#1a1a2e;">${nome}</div>${escopoHtml}</td><td style="padding:8px;text-align:right;vertical-align:top;white-space:nowrap;">${unit}</td><td style="padding:8px;text-align:right;vertical-align:top;white-space:nowrap;">${fmt(pUn)}</td><td style="padding:8px;text-align:right;vertical-align:top;white-space:nowrap;">${qty > 1 ? qty : '—'}</td><td style="padding:8px;text-align:right;vertical-align:top;font-weight:700;white-space:nowrap;">${fmt(total)}</td></tr>`
  }).join('')

  const materiaisRows = todosMateriais.map(m => {
    const nome = m.nome_material || m.material_name || 'Material'
    const qty = m.quantidade || m.quantity || 1
    const pUn = m.preco_venda || m.unit_sale_price || 0
    const unit = m.material_unit || 'un.'
    return `<tr style="border-bottom:1px solid #eee;"><td style="padding:8px;vertical-align:top;"><div style="font-weight:700;color:#1a1a2e;">${nome}</div>${m.observacoes_tecnicas ? `<div style="color:#666;font-size:10px;">${m.observacoes_tecnicas}</div>` : ''}</td><td style="padding:8px;text-align:right;vertical-align:top;">${unit}</td><td style="padding:8px;text-align:right;vertical-align:top;">${fmt(pUn)}</td><td style="padding:8px;text-align:right;vertical-align:top;">${qty}</td><td style="padding:8px;text-align:right;vertical-align:top;font-weight:700;">${fmt(qty * pUn)}</td></tr>`
  }).join('')

  const clausulasHtml = clauses.map(cl => `<div style="margin-bottom:14px;"><div style="font-weight:700;font-size:11px;color:#1a1a2e;margin-bottom:4px;">${cl.title}</div>${cl.items.map(it => `<div style="font-size:11px;color:#444;line-height:1.8;">${it}</div>`).join('')}</div>`).join('')

  const rodape = `<div style="border-top:1px solid #d0d7de;padding-top:10px;margin-top:28px;display:flex;justify-content:space-between;font-size:10px;color:#777;"><div style="line-height:1.8;"><div>${EMPRESA.proprietario} | CNPJ: ${EMPRESA.cnpj}</div><div>${EMPRESA.endereco} — ${EMPRESA.bairro} — ${EMPRESA.cep}</div><div style="color:#1a6fa8;margin-top:3px;">📷 ${EMPRESA.instagram} &nbsp; 👍 ${EMPRESA.facebook} &nbsp; 🌐 ${EMPRESA.site}</div></div><div style="text-align:right;line-height:1.8;"><div>✉ ${EMPRESA.email}</div><div>☎ ${EMPRESA.tel1} &nbsp; ☎ ${EMPRESA.tel2}</div><div>💬 ${EMPRESA.whatsapp}</div></div></div>`

  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/><title>OS ${data.order_number}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',Arial,sans-serif;color:#1a1a2e;background:#fff;padding:32px;font-size:12px;line-height:1.5;}table{border-collapse:collapse;width:100%;}@media print{body{padding:0;}@page{margin:12mm;size:A4;}}</style></head><body>
<div style="border-bottom:2px solid #d0d7de;padding-bottom:14px;margin-bottom:18px;"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;"><div style="display:flex;gap:14px;align-items:flex-start;"><div style="width:70px;height:70px;background:#e4f0f9;border-radius:8px;border:2px solid #1a6fa8;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><div style="color:#1a6fa8;font-weight:900;font-size:11px;text-align:center;line-height:1.3;">Giartech<br/>Soluções</div></div><div><div style="color:#1a6fa8;font-weight:800;font-size:17px;margin-bottom:3px;">${EMPRESA.nome}</div><div style="font-size:11px;color:#444;line-height:1.7;"><div>${EMPRESA.proprietario}</div><div>CNPJ: ${EMPRESA.cnpj}</div><div>${EMPRESA.endereco}</div><div>${EMPRESA.bairro}</div><div>${EMPRESA.cep}</div></div></div></div><div style="text-align:right;font-size:11px;color:#444;line-height:1.8;flex-shrink:0;"><div style="margin-bottom:4px;font-weight:600;">📅 ${fmtDate(data.date)}</div><div>✉ ${EMPRESA.email}</div><div>☎ ${EMPRESA.tel1}</div><div>☎ ${EMPRESA.tel2}</div><div>💬 ${EMPRESA.whatsapp}</div></div></div><div style="margin-top:10px;padding-top:8px;border-top:1px solid #d0d7de;"><div style="font-size:11px;color:#777;font-style:italic;margin-bottom:5px;">${EMPRESA.slogan}</div><div style="display:flex;gap:20px;font-size:11px;color:#1a6fa8;"><span>📷 ${EMPRESA.instagram}</span><span>👍 ${EMPRESA.facebook}</span><span>🌐 ${EMPRESA.site}</span></div></div></div>

<div style="background:#1a6fa8;color:#fff;padding:10px 16px;border-radius:7px;margin-bottom:18px;"><div style="font-weight:800;font-size:17px;">Ordem de serviço ${data.order_number}</div>${data.title ? `<div style="font-size:12px;opacity:.88;margin-top:3px;">${data.title}</div>` : ''}</div>

<div style="margin-bottom:18px;"><div style="font-weight:700;font-size:13px;margin-bottom:6px;">Cliente: ${c.name}</div><div style="display:flex;gap:32px;"><div style="font-size:11px;color:#444;line-height:1.8;">${c.company_name ? `<div>${c.company_name}</div>` : ''}${c.cnpj ? `<div>CNPJ: ${c.cnpj}</div>` : ''}${c.cpf ? `<div>CPF: ${c.cpf}</div>` : ''}${c.address ? `<div>${c.address}</div>` : ''}${c.city ? `<div>${c.city}${c.state ? `, ${c.state}` : ''}</div>` : ''}${c.cep ? `<div>CEP ${c.cep}</div>` : ''}</div><div style="font-size:11px;color:#444;line-height:1.8;">${c.email ? `<div>✉ ${c.email}</div>` : ''}${c.phone ? `<div>☎ ${c.phone}</div>` : ''}</div></div></div>

${data.basic_info ? `<div style="margin-top:22px;"><div style="color:#1a6fa8;font-weight:700;font-size:14px;border-bottom:2px solid #1a6fa8;padding-bottom:4px;margin-bottom:12px;">Informações básicas</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 40px;">${[['Prazo de execução', data.basic_info.deadline], ['Marca', data.basic_info.brand], ['Modelo', data.basic_info.model], ['Aparelho', data.basic_info.equipment]].filter(([, v]) => v).map(([l, v]) => `<div><div style="font-weight:700;font-size:11px;color:#1a1a2e;">${l}</div><div style="font-size:11px;color:#555;">${v}</div></div>`).join('')}</div></div>` : ''}

<div style="margin-top:22px;"><div style="color:#1a6fa8;font-weight:700;font-size:14px;border-bottom:2px solid #1a6fa8;padding-bottom:4px;margin-bottom:12px;">Serviços</div><table><thead><tr style="background:#f5f7fa;">${['Descrição','Unidade','Preço unitário','Qtd.','Preço'].map((h,i) => `<th style="padding:7px 8px;text-align:${i===0?'left':'right'};color:#1a6fa8;font-weight:700;border-bottom:1px solid #d0d7de;">${h}</th>`).join('')}</tr></thead><tbody>${servicosRows}</tbody></table></div>

${materiaisRows ? `<div style="margin-top:22px;"><div style="color:#1a6fa8;font-weight:700;font-size:14px;border-bottom:2px solid #1a6fa8;padding-bottom:4px;margin-bottom:12px;">Materiais</div><table><thead><tr style="background:#f5f7fa;">${['Descrição','Unidade','Preço unitário','Qtd.','Preço'].map((h,i) => `<th style="padding:7px 8px;text-align:${i===0?'left':'right'};color:#1a6fa8;font-weight:700;border-bottom:1px solid #d0d7de;">${h}</th>`).join('')}</tr></thead><tbody>${materiaisRows}</tbody></table></div>` : ''}

<div style="margin-top:16px;"><table style="margin-left:auto;font-size:12px;"><tbody><tr><td style="padding:4px 16px;color:#555;">Serviços</td><td style="padding:4px 16px;text-align:right;">${fmt(data.subtotal)}</td></tr>${totalMateriais > 0 ? `<tr><td style="padding:4px 16px;color:#555;">Materiais</td><td style="padding:4px 16px;text-align:right;">${fmt(totalMateriais)}</td></tr>` : ''}${data.discount > 0 ? `<tr><td style="padding:4px 16px;color:#555;">Desconto</td><td style="padding:4px 16px;text-align:right;">- ${fmt(data.discount)}</td></tr>` : ''}<tr style="border-top:2px solid #1a6fa8;"><td style="padding:7px 16px;font-weight:800;color:#1a1a2e;">Total</td><td style="padding:7px 16px;text-align:right;font-weight:800;color:#1a1a2e;font-size:15px;">${fmt(data.total)}</td></tr></tbody></table></div>

<div style="margin-top:22px;"><div style="color:#1a6fa8;font-weight:700;font-size:14px;border-bottom:2px solid #1a6fa8;padding-bottom:4px;margin-bottom:12px;">Pagamento</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:11px;"><div><div style="font-weight:700;margin-bottom:4px;">Meios de pagamento</div><div style="color:#555;">${p.methods}</div>${p.conditions ? `<div style="margin-top:8px;"><span style="font-weight:700;">Condições: </span><span style="color:#555;">${p.conditions}</span></div>` : ''}</div><div><div style="font-weight:700;margin-bottom:4px;">PIX</div><div style="color:#555;margin-bottom:8px;">${p.pix || EMPRESA.pix}</div><div style="font-weight:700;margin-bottom:4px;">Dados bancários</div><div style="color:#555;line-height:1.8;"><div>Banco: ${bd?.bank || EMPRESA.banco}</div><div>Agência: ${bd?.agency || EMPRESA.agencia}</div><div>Conta: ${bd?.account || EMPRESA.conta}</div><div>Tipo de conta: ${bd?.account_type || EMPRESA.tipo_conta}</div><div>Titular (CPF/CNPJ): ${bd?.holder || EMPRESA.cnpj}</div></div></div></div></div>

<div style="margin-top:22px;"><div style="color:#1a6fa8;font-weight:700;font-size:14px;border-bottom:2px solid #1a6fa8;padding-bottom:4px;margin-bottom:12px;">Garantia</div><div style="font-weight:700;font-size:12px;margin-bottom:6px;">Condições da garantia</div><div style="font-size:11px;color:#444;line-height:1.8;white-space:pre-line;">${data.warranty?.conditions ? (Array.isArray(data.warranty.conditions) ? data.warranty.conditions.join('\n\n') : data.warranty.conditions) : GARANTIA}</div></div>

<div style="margin-top:22px;"><div style="color:#1a6fa8;font-weight:700;font-size:14px;border-bottom:2px solid #1a6fa8;padding-bottom:4px;margin-bottom:12px;">Cláusulas contratuais</div>${clausulasHtml}</div>

${data.additional_info ? `<div style="margin-top:22px;"><div style="color:#1a6fa8;font-weight:700;font-size:14px;border-bottom:2px solid #1a6fa8;padding-bottom:4px;margin-bottom:12px;">Informações adicionais</div><div style="font-size:11px;color:#444;line-height:1.8;">${data.additional_info}</div></div>` : ''}

<div style="margin-top:36px;"><div style="text-align:center;font-size:11px;color:#555;margin-bottom:6px;font-style:italic;">Trabalhamos para que seus projetos, se tornem realidade.. Obrigado pela confiança</div><div style="text-align:center;font-style:italic;font-size:11px;color:#555;margin-bottom:28px;">obrigado pela confiança, estaremos à disposição.</div><div style="text-align:center;font-weight:700;font-size:12px;margin-bottom:36px;">São Paulo, ${fmtDate(data.date)}</div><div style="display:flex;justify-content:space-around;"><div style="text-align:center;min-width:220px;"><div style="border-top:1px solid #555;padding-top:8px;"><div style="font-weight:700;font-size:12px;">${EMPRESA.nome}</div><div style="font-size:11px;color:#555;">${EMPRESA.proprietario}</div><div style="font-size:11px;color:#555;">${EMPRESA.cargo}</div></div></div><div style="text-align:center;min-width:220px;"><div style="border-top:1px solid #555;padding-top:8px;"><div style="font-weight:700;font-size:12px;">${c.name}</div>${c.cnpj ? `<div style="font-size:11px;color:#555;">CNPJ ${c.cnpj}</div>` : ''}${c.cpf ? `<div style="font-size:11px;color:#555;">CPF ${c.cpf}</div>` : ''}</div></div></div></div>

${rodape}
</body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Permita pop-ups para este site e tente novamente.'); return }
  win.document.write(html)
  win.document.close()
  win.onload = () => { setTimeout(() => { win.focus(); win.print() }, 500) }
}

export const generateServiceOrderPDF = generateServiceOrderPDFGiartech
