const t={nome:"Giartech Soluções",proprietario:"TIAGO BRUNO GIAQUINTO",cnpj:"37.509.897/0001-93",endereco:"Rua Quito, 14, comercial",bairro:"Nossa Senhora do Ó, São Paulo-SP",cep:"CEP 02734-010",email:"giartechsolucoes@gmail.com",tel1:"+55 (35) 1511-9666",tel2:"+351 511 943 985",whatsapp:"11966617631",instagram:"@tg.arconnection",facebook:"@tgarconnection",site:"tgarconnection.com.br",slogan:"Sua satisfação é o que motiva a nossa dedicação.",cargo:"Diretor Técnico",pix:"37.509.897/0001-93",banco:"Cora",agencia:"0001",conta:"1412009-3",tipo_conta:"Corrente"},T=`Garantias referentes a sistemas novos em tubulações antigas só serão válidas com os processos de descontaminação das tubulações antigas.

Garantia de equipamentos novos (5 a 10 anos) só é válida com manutenção semestral comprovada com laudo técnico.

Garantias estendidas pela nossa empresa são concedidas em caso de compra das máquinas conosco e podem ter até 12 meses, mediante manutenção nos prazos estipulados pelo fabricante.`,S=[{title:"1. Obrigações do Cliente",items:["1.1. O cliente deve fornecer todas as informações necessárias para a execução adequada dos serviços, incluindo especificações técnicas, localização e horários preferenciais, como também a planta do imóvel e projeto arquitetônico.","1.2. O cliente deve garantir o acesso seguro e adequado às instalações onde os serviços serão realizados.","1.3. O cliente deve comunicar prontamente qualquer problema ou defeito observado nos serviços prestados.","1.4. É de responsabilidade do cliente o destelhamento e reinstalação do telhado."]},{title:"2. Obrigações do Contratante",items:["2.1. O contratante deve realizar os serviços de acordo com as especificações técnicas e com os padrões da indústria.","2.2. O contratante deve cumprir todos os prazos acordados para a execução dos serviços.","2.3. O contratante deve manter o cliente informado sobre o progresso dos serviços e quaisquer problemas ou atrasos."]},{title:"3. Regras de Rescisão",items:["3.1. Ambas as partes têm o direito de rescindir o contrato a qualquer momento, com aviso prévio de 30 dias.","3.2. Em caso de violação das obrigações, a parte não infratora pode rescindir imediatamente, sem aviso prévio."]},{title:"4. Regras Gerais",items:["4.1. Este contrato não cria relação de parceria, joint venture, emprego ou agência entre as partes.","4.2. Nenhuma das partes pode ceder seus direitos sem consentimento prévio por escrito da outra parte.","4.3. Este contrato constitui o acordo completo entre as partes e substitui todos os acordos anteriores."]}];function s(e){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(e||0)}function f(e){try{return new Date(e).toLocaleDateString("pt-BR")}catch{return e}}function w(e,o){var r,a,g,x;return e.replace(/\[NOME_CLIENTE\]/g,o.client.name||"").replace(/\[CNPJ\]/g,o.client.cnpj||o.client.cpf||"").replace(/\[VALOR_TOTAL\]/g,s(o.total)).replace(/\[FORMA_PAGAMENTO\]/g,o.payment.methods||"").replace(/\[BANCO\]/g,((r=o.payment.bank_details)==null?void 0:r.bank)||t.banco).replace(/\[AGENCIA\]/g,((a=o.payment.bank_details)==null?void 0:a.agency)||t.agencia).replace(/\[CONTA\]/g,((g=o.payment.bank_details)==null?void 0:g.account)||t.conta).replace(/\[TITULAR\]/g,((x=o.payment.bank_details)==null?void 0:x.holder)||t.proprietario).replace(/\[DATA\]/g,f(o.date)).replace(/\[CIDADE\]/g,o.client.city||"São Paulo")}const j=`
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
</svg>`;async function N(e){var h,u;const o=e.client,r=e.payment,a=r.bank_details,g=(h=e.contract_clauses)!=null&&h.length?e.contract_clauses:S,x=(u=e.warranty)!=null&&u.conditions?Array.isArray(e.warranty.conditions)?e.warranty.conditions.join(`

`):e.warranty.conditions:T,v=e.items.flatMap(i=>i.materials||[]),y=v.reduce((i,n)=>i+(n.quantidade||n.quantity||1)*(n.preco_venda||n.unit_sale_price||0),0),z=e.items.map(i=>{const n=i.service_name||i.descricao||i.description||"Serviço",l=i.scope||i.service_scope||i.escopo_detalhado||"",m=i.unit||"un.",c=i.quantity||i.quantidade||1,$=i.unit_price||i.preco_unitario||0,C=i.total_price||i.preco_total||$*c;return`<tr>
      <td style="padding:9px 10px;border-bottom:0.5px solid rgba(0,98,246,0.07);vertical-align:top;">
        <div style="font-weight:600;color:#191919;margin-bottom:2px;">${n}</div>
        ${l?`<div style="font-size:10px;color:#8a95a8;line-height:1.6;">${l.replace(/\n/g," · ")}</div>`:""}
      </td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;white-space:nowrap;">${m}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;white-space:nowrap;">${s($)}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;white-space:nowrap;">${c>1?c:"—"}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);font-weight:600;color:#191919;white-space:nowrap;">${s(C)}</td>
    </tr>`}).join(""),A=v.map(i=>{const n=i.nome_material||i.material_name||"Material",l=i.quantidade||i.quantity||1,m=i.preco_venda||i.unit_sale_price||i.unit_price||0,c=i.material_unit||"un.";return`<tr>
      <td style="padding:9px 10px;border-bottom:0.5px solid rgba(0,98,246,0.07);vertical-align:top;">
        <div style="font-weight:600;color:#191919;">${n}</div>
        ${i.observacoes_tecnicas?`<div style="font-size:10px;color:#8a95a8;">${i.observacoes_tecnicas}</div>`:""}
      </td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;">${c}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;">${s(m)}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);color:#4a5568;">${l}</td>
      <td style="padding:9px 10px;text-align:right;border-bottom:0.5px solid rgba(0,98,246,0.07);font-weight:600;color:#191919;">${s(l*m)}</td>
    </tr>`}).join(""),b="padding:7px 10px;text-align:left;font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#0062f6;border-bottom:1px solid rgba(0,98,246,0.22);background:#eef3ff;",d=b+"text-align:right;",_=g.map(i=>`
    <div style="margin-bottom:10px;">
      <div style="font-size:11px;font-weight:600;color:#191919;margin-bottom:3px;">${i.title}</div>
      ${i.items.map(n=>`<div style="font-size:10px;color:#4a5568;line-height:1.8;">${w(n,e)}</div>`).join("")}
    </div>`).join(""),O=`<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>OS ${e.order_number} — ${o.name}</title>
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
        ${j}
        <div>
          <div style="font-family:'Questrial',system-ui,sans-serif;font-size:26px;font-weight:400;color:#191919;letter-spacing:-0.5px;line-height:1;">Giartech</div>
          <div style="font-size:11px;color:#8a95a8;letter-spacing:1px;margin-top:2px;">Soluções</div>
        </div>
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:0.5px solid rgba(0,98,246,0.1);font-size:10px;color:#8a95a8;line-height:1.9;">
        <div>${t.proprietario} · CNPJ: ${t.cnpj}</div>
        <div>${t.endereco} · ${t.bairro} · ${t.cep}</div>
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0;">
      <div style="font-size:11px;font-weight:600;color:#0062f6;margin-bottom:5px;">${f(e.date)}</div>
      <div style="font-size:10px;color:#8a95a8;line-height:1.9;">
        <div>${t.email}</div>
        <div>${t.tel1}</div>
        <div>${t.tel2}</div>
        <div>${t.whatsapp}</div>
      </div>
    </div>
  </div>
  <div style="margin-top:12px;padding-top:10px;border-top:0.5px solid rgba(0,98,246,0.1);display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:10px;color:#8a95a8;font-style:italic;">${t.slogan}</div>
    <div style="display:flex;gap:12px;font-size:10px;color:#8a95a8;">
      <span>${t.instagram}</span><span>${t.facebook}</span><span>${t.site}</span>
    </div>
  </div>
</div>

<!-- BANNER OS -->
<div style="background:#0062f6;padding:13px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:0;">
  <div>
    <div style="font-size:15px;color:#fff;font-weight:400;letter-spacing:0.3px;">Ordem de Serviço ${e.order_number}</div>
    ${e.title?`<div style="font-size:11px;color:rgba(255,255,255,0.75);margin-top:3px;">${e.title}</div>`:""}
  </div>
  <div style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;font-size:10px;padding:4px 12px;border-radius:20px;">Emitida em ${f(e.date)}</div>
</div>

<div style="padding:20px 0;">

<!-- CLIENTE -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Dados do Cliente</div>
  <div style="display:flex;gap:28px;">
    <div style="flex:1;font-size:11px;color:#4a5568;line-height:1.85;">
      <div style="font-size:13px;font-weight:600;color:#191919;margin-bottom:4px;">${o.name}</div>
      ${o.company_name?`<div>${o.company_name}</div>`:""}
      ${o.cnpj?`<div>CNPJ: ${o.cnpj}</div>`:""}
      ${o.cpf?`<div>CPF: ${o.cpf}</div>`:""}
      ${o.address?`<div>${o.address}</div>`:""}
      ${o.city?`<div>${o.city}${o.state?`, ${o.state}`:""}</div>`:""}
      ${o.cep?`<div>CEP ${o.cep}</div>`:""}
    </div>
    <div style="min-width:160px;text-align:right;font-size:11px;color:#4a5568;line-height:1.85;">
      ${o.email?`<div>${o.email}</div>`:""}
      ${o.phone?`<div>${o.phone}</div>`:""}
    </div>
  </div>
</div>

<!-- INFO TÉCNICAS -->
${e.basic_info?`
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Informações Técnicas</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;">
    ${[["Prazo",e.basic_info.deadline],["Marca",e.basic_info.brand||"—"],["Modelo",e.basic_info.model||"—"],["Capacidade",e.basic_info.equipment||"—"]].map(([i,n])=>`<div style="background:#eef3ff;border:0.5px solid rgba(0,98,246,0.14);border-left:2.5px solid #0062f6;border-radius:7px;padding:8px 10px;"><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.07em;color:#8a95a8;">${i}</div><div style="font-size:12px;font-weight:600;color:#191919;margin-top:2px;">${n}</div></div>`).join("")}
  </div>
</div>`:""}

<!-- SERVIÇOS -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Serviços</div>
  <table><thead><tr>
    <th style="${b}">Descrição</th>
    <th style="${d}width:52px;">Un.</th>
    <th style="${d}width:86px;">Unitário</th>
    <th style="${d}width:40px;">Qtd.</th>
    <th style="${d}width:86px;">Total</th>
  </tr></thead><tbody>${z}</tbody></table>
</div>

${v.length>0?`
<!-- MATERIAIS -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Materiais</div>
  <table><thead><tr>
    <th style="${b}">Descrição</th>
    <th style="${d}width:52px;">Un.</th>
    <th style="${d}width:86px;">Unitário</th>
    <th style="${d}width:40px;">Qtd.</th>
    <th style="${d}width:86px;">Total</th>
  </tr></thead><tbody>${A}</tbody></table>
</div>`:""}

<!-- TOTAIS -->
<div style="display:flex;justify-content:flex-end;margin-bottom:18px;">
  <div style="min-width:220px;">
    <div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;color:#4a5568;border-bottom:0.5px solid rgba(0,98,246,0.08);"><span>Serviços</span><span>${s(e.subtotal)}</span></div>
    ${y>0?`<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;color:#4a5568;border-bottom:0.5px solid rgba(0,98,246,0.08);"><span>Materiais</span><span>${s(y)}</span></div>`:""}
    ${e.discount>0?`<div style="display:flex;justify-content:space-between;font-size:11px;padding:4px 0;color:#4a5568;"><span>Desconto</span><span>- ${s(e.discount)}</span></div>`:""}
    <div style="display:flex;justify-content:space-between;background:#0062f6;padding:10px 14px;border-radius:7px;margin-top:6px;">
      <span style="font-size:12px;color:rgba(255,255,255,0.8);">Total</span>
      <span style="font-size:17px;color:#fff;font-weight:600;">${s(e.total)}</span>
    </div>
  </div>
</div>

<!-- PAGAMENTO -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Pagamento</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:11px;">
    <div>
      <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#0062f6;margin-bottom:6px;">Meios de pagamento</div>
      <div style="color:#4a5568;line-height:1.9;">${r.methods||t.pix}</div>
      <div style="margin-top:8px;">
        <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#0062f6;margin-bottom:4px;">Chave PIX</div>
        <div style="display:inline-block;background:#eef3ff;border:0.5px solid rgba(0,98,246,0.25);border-radius:5px;padding:4px 10px;font-family:monospace;color:#0062f6;">${r.pix||t.pix}</div>
      </div>
    </div>
    <div>
      <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#0062f6;margin-bottom:6px;">Dados bancários</div>
      <table style="font-size:11px;color:#4a5568;border-collapse:collapse;">
        <tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Banco</td><td>${(a==null?void 0:a.bank)||t.banco}</td></tr>
        <tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Agência</td><td>${(a==null?void 0:a.agency)||t.agencia}</td></tr>
        <tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Conta</td><td>${(a==null?void 0:a.account)||t.conta} (${(a==null?void 0:a.account_type)||t.tipo_conta})</td></tr>
        <tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Titular</td><td>${(a==null?void 0:a.holder)||t.cnpj}</td></tr>
        ${r.conditions?`<tr><td style="color:#8a95a8;padding-right:10px;font-size:10px;">Condições</td><td>${r.conditions}</td></tr>`:""}
      </table>
    </div>
  </div>
</div>

<!-- GARANTIA -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Garantia</div>
  <div style="font-size:10px;color:#4a5568;line-height:1.85;white-space:pre-line;">${w(x,e)}</div>
</div>

<!-- CLÁUSULAS -->
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Cláusulas Contratuais</div>
  ${_}
</div>

${e.additional_info?`
<div style="margin-bottom:18px;">
  <div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#0062f6;border-bottom:1.5px solid #0062f6;padding-bottom:5px;margin-bottom:10px;">Informações Adicionais</div>
  <div style="font-size:11px;color:#4a5568;line-height:1.85;">${e.additional_info}</div>
</div>`:""}

<!-- ASSINATURAS -->
<div style="margin-top:24px;padding-top:14px;border-top:0.5px solid rgba(0,98,246,0.12);">
  <div style="text-align:center;font-size:11px;color:#4a5568;margin-bottom:4px;font-style:italic;">Trabalhamos para que seus projetos se tornem realidade. Obrigado pela confiança.</div>
  <div style="text-align:center;font-size:11px;color:#8a95a8;font-style:italic;margin-bottom:28px;">obrigado pela confiança, estaremos à disposição.</div>
  <div style="text-align:center;font-size:11px;font-weight:600;color:#191919;margin-bottom:36px;">São Paulo, ${f(e.date)}</div>
  <div style="display:flex;justify-content:space-around;">
    <div style="text-align:center;min-width:200px;">
      <div style="border-top:1px solid #b0bcd0;padding-top:8px;margin-top:52px;">
        <div style="font-size:12px;font-weight:600;color:#191919;">${t.nome}</div>
        <div style="font-size:10px;color:#8a95a8;margin-top:2px;">${t.proprietario}</div>
        <div style="font-size:10px;color:#8a95a8;">${t.cargo}</div>
      </div>
    </div>
    <div style="text-align:center;min-width:200px;">
      <div style="border-top:1px solid #b0bcd0;padding-top:8px;margin-top:52px;">
        <div style="font-size:12px;font-weight:600;color:#191919;">${o.name}</div>
        ${o.cnpj?`<div style="font-size:10px;color:#8a95a8;margin-top:2px;">CNPJ ${o.cnpj}</div>`:""}
        ${o.cpf?`<div style="font-size:10px;color:#8a95a8;margin-top:2px;">CPF ${o.cpf}</div>`:""}
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
    <div style="font-size:11px;font-weight:600;color:#0062f6;margin-bottom:1px;">${t.nome}</div>
    <div>${t.proprietario} · CNPJ: ${t.cnpj}</div>
    <div>${t.endereco} · ${t.bairro} · ${t.cep}</div>
    <div style="display:flex;gap:10px;margin-top:2px;"><span>${t.instagram}</span><span>${t.facebook}</span><span>${t.site}</span></div>
  </div>
  <div style="text-align:right;font-size:9px;color:#8a95a8;line-height:1.85;">
    <div>${t.email}</div>
    <div>${t.tel1}</div>
    <div>${t.tel2}</div>
    <div>${t.whatsapp}</div>
  </div>
</div>

</body>
</html>`,p=window.open("","_blank","width=900,height=750");if(!p){alert("Permita pop-ups para este site e tente novamente.");return}p.document.write(O),p.document.close(),p.onload=()=>{setTimeout(()=>{p.focus(),p.print()},600)}}const R=async()=>({name:"Giartech",cnpj:""});export{R as a,N as g};
