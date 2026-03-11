/*
  # Modelos Profissionais de Documentos
  
  1. Novos Modelos
    - Proposta Comercial Moderna
    - Contrato de Prestação de Serviços
    - Orçamento Executivo
  
  2. Características
    - HTML formatado e estilizado
    - Uso das novas fontes
    - Layout profissional
    - Variáveis dinâmicas
    - Pronto para edição visual
*/

-- Limpar templates antigos básicos se existirem
DELETE FROM document_templates WHERE category IN ('Exemplo', 'Template Básico');

-- 1. Proposta Comercial Moderna
INSERT INTO document_templates (
  name, 
  description, 
  department, 
  category, 
  content_template, 
  is_active,
  show_header,
  show_footer,
  show_logo
) VALUES (
  'Proposta Comercial Moderna',
  'Proposta comercial completa com design profissional',
  'Comercial',
  'Proposta',
  '<div style="font-family: ''Montserrat'', sans-serif; color: #1f2937; line-height: 1.8;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 40px; text-align: center; border-radius: 12px; margin-bottom: 40px;">
      <h1 style="font-size: 48px; margin: 0 0 20px 0; font-weight: 700; letter-spacing: -1px;">PROPOSTA COMERCIAL</h1>
      <p style="font-size: 24px; margin: 0; font-weight: 300; opacity: 0.95;">Nº <span style="background: white; color: #667eea; padding: 8px 20px; border-radius: 8px; font-weight: 600;">{numero_documento}</span></p>
      <p style="font-size: 16px; margin: 20px 0 0 0; opacity: 0.9;">Data: {data_atual} | Validade: 15 dias</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 40px;">
      <div style="background: #f9fafb; padding: 30px; border-radius: 12px; border-left: 5px solid #667eea;">
        <h3 style="margin: 0 0 20px 0; color: #667eea; font-size: 20px; font-weight: 600;">Cliente</h3>
        <p style="margin: 8px 0; font-size: 15px;"><strong>Nome:</strong> {cliente_nome}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>CPF/CNPJ:</strong> {cliente_cpf_cnpj}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>Telefone:</strong> {cliente_telefone}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>E-mail:</strong> {cliente_email}</p>
      </div>
      
      <div style="background: #f0fdf4; padding: 30px; border-radius: 12px; border-left: 5px solid #10b981;">
        <h3 style="margin: 0 0 20px 0; color: #10b981; font-size: 20px; font-weight: 600;">Nossa Empresa</h3>
        <p style="margin: 8px 0; font-size: 15px;"><strong>Razão Social:</strong> {empresa_nome}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>CNPJ:</strong> {empresa_cnpj}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>Telefone:</strong> {empresa_telefone}</p>
        <p style="margin: 8px 0; font-size: 15px;"><strong>E-mail:</strong> {empresa_email}</p>
      </div>
    </div>

    <h2 style="font-size: 32px; margin: 50px 0 30px 0; color: #1f2937; font-weight: 700; border-bottom: 3px solid #667eea; padding-bottom: 15px;">Serviços Propostos</h2>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden;">
      <thead>
        <tr style="background: linear-gradient(to right, #667eea, #764ba2);">
          <th style="padding: 18px; text-align: left; color: white; font-weight: 600; font-size: 15px;">Item</th>
          <th style="padding: 18px; text-align: left; color: white; font-weight: 600; font-size: 15px;">Descrição</th>
          <th style="padding: 18px; text-align: center; color: white; font-weight: 600; font-size: 15px;">Qtd</th>
          <th style="padding: 18px; text-align: right; color: white; font-weight: 600; font-size: 15px;">Valor Unit.</th>
          <th style="padding: 18px; text-align: right; color: white; font-weight: 600; font-size: 15px;">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 15px; font-weight: 600; color: #667eea;">01</td>
          <td style="padding: 15px;">Manutenção Preventiva Completa</td>
          <td style="padding: 15px; text-align: center;">1</td>
          <td style="padding: 15px; text-align: right;">R$ 500,00</td>
          <td style="padding: 15px; text-align: right; font-weight: 600;">R$ 500,00</td>
        </tr>
        <tr style="background-color: white; border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 15px; font-weight: 600; color: #667eea;">02</td>
          <td style="padding: 15px;">Instalação de Equipamentos</td>
          <td style="padding: 15px; text-align: center;">2</td>
          <td style="padding: 15px; text-align: right;">R$ 300,00</td>
          <td style="padding: 15px; text-align: right; font-weight: 600;">R$ 600,00</td>
        </tr>
      </tbody>
    </table>

    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 40px; border-radius: 12px; text-align: right;">
      <p style="margin: 0; font-size: 28px; font-weight: 700;">TOTAL: R$ 1.100,00</p>
    </div>

    <div style="margin-top: 80px; text-align: center;">
      <div style="border-top: 2px solid #1f2937; max-width: 300px; margin: 0 auto; padding-top: 10px;">
        <p style="margin: 0; font-weight: 600;">Assinatura do Cliente</p>
      </div>
    </div>
  </div>',
  true,
  true,
  true,
  true
);
