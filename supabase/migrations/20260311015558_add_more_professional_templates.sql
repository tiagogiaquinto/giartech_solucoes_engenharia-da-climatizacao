/*
  # Modelos Profissionais Adicionais
  
  1. Novos Templates
    - Termo de Garantia
    - Certificado de Conclusão de Serviço
    - Relatório de Visita Técnica
    - Checklist de Manutenção Preventiva
*/

-- 1. Termo de Garantia
INSERT INTO document_templates (
  name, 
  description, 
  department, 
  category, 
  content_template, 
  is_active
) VALUES (
  'Termo de Garantia',
  'Termo de garantia profissional para serviços',
  'Operacional',
  'Garantia',
  '<div style="font-family: ''Raleway'', sans-serif; color: #1f2937; line-height: 1.8;">
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 50px 40px; text-align: center; border-radius: 12px; margin-bottom: 40px;">
      <h1 style="font-size: 42px; margin: 0 0 15px 0; font-weight: 700;">TERMO DE GARANTIA</h1>
      <p style="font-size: 18px; margin: 0; opacity: 0.9;">Certificado Nº {numero_documento}</p>
      <p style="font-size: 14px; margin: 15px 0 0 0; opacity: 0.8;">Emitido em {data_atual}</p>
    </div>

    <div style="background: #f0fdf4; padding: 30px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #10b981;">
      <h3 style="margin: 0 0 20px 0; color: #065f46; font-size: 22px; font-weight: 600;">Dados do Cliente</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
        <p style="margin: 8px 0;"><strong>Nome:</strong> {cliente_nome}</p>
        <p style="margin: 8px 0;"><strong>CPF/CNPJ:</strong> {cliente_cpf_cnpj}</p>
        <p style="margin: 8px 0;"><strong>Telefone:</strong> {cliente_telefone}</p>
        <p style="margin: 8px 0;"><strong>E-mail:</strong> {cliente_email}</p>
      </div>
      <p style="margin: 15px 0 0 0;"><strong>Endereço:</strong> {cliente_endereco}</p>
    </div>

    <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 30px;">
      <h2 style="font-size: 26px; margin: 0 0 25px 0; color: #1f2937; font-weight: 700; border-bottom: 3px solid #10b981; padding-bottom: 15px;">Serviços Cobertos pela Garantia</h2>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 15px 0; font-size: 18px; color: #059669; font-weight: 600;">Serviços Executados</h4>
        <ul style="margin: 0; padding-left: 25px; line-height: 2;">
          <li>Manutenção preventiva completa do sistema</li>
          <li>Instalação e configuração de equipamentos</li>
          <li>Testes de funcionamento e ajustes finais</li>
        </ul>
      </div>

      <div style="background: #dcfce7; padding: 25px; border-radius: 8px; text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 10px 0; font-size: 16px; color: #065f46; font-weight: 600;">PERÍODO DE GARANTIA</p>
        <p style="margin: 0; font-size: 36px; color: #059669; font-weight: 700;">90 DIAS</p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #065f46;">A partir da data de conclusão do serviço</p>
      </div>
    </div>

    <div style="background: #fef3c7; padding: 30px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #f59e0b;">
      <h3 style="margin: 0 0 20px 0; color: #92400e; font-size: 20px; font-weight: 600;">Condições de Cobertura</h3>
      <div style="font-size: 15px; color: #78350f; line-height: 2;">
        <p style="margin: 10px 0;"><strong>✓</strong> Defeitos de fabricação ou instalação</p>
        <p style="margin: 10px 0;"><strong>✓</strong> Mau funcionamento dos equipamentos instalados</p>
        <p style="margin: 10px 0;"><strong>✓</strong> Problemas relacionados à execução do serviço</p>
        <p style="margin: 10px 0;"><strong>✓</strong> Atendimento prioritário durante o período</p>
      </div>
    </div>

    <div style="background: #fee2e2; padding: 30px; border-radius: 12px; margin-bottom: 40px; border-left: 5px solid #ef4444;">
      <h3 style="margin: 0 0 20px 0; color: #991b1b; font-size: 20px; font-weight: 600;">Exclusões da Garantia</h3>
      <div style="font-size: 15px; color: #7f1d1d; line-height: 2;">
        <p style="margin: 10px 0;"><strong>✗</strong> Danos causados por mau uso ou negligência</p>
        <p style="margin: 10px 0;"><strong>✗</strong> Modificações não autorizadas</p>
        <p style="margin: 10px 0;"><strong>✗</strong> Acidentes ou casos fortuitos</p>
        <p style="margin: 10px 0;"><strong>✗</strong> Desgaste natural pelo uso</p>
      </div>
    </div>

    <div style="background: #e0e7ff; padding: 30px; border-radius: 12px; margin-bottom: 40px;">
      <h3 style="margin: 0 0 20px 0; color: #3730a3; font-size: 20px; font-weight: 600;">Como Acionar a Garantia</h3>
      <ol style="margin: 0; padding-left: 25px; color: #312e81; font-size: 15px; line-height: 2;">
        <li>Entre em contato através dos canais oficiais</li>
        <li>Informe o número deste certificado de garantia</li>
        <li>Descreva o problema apresentado</li>
        <li>Aguarde o agendamento da visita técnica</li>
      </ol>
      <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #c7d2fe;">
        <p style="margin: 5px 0; font-size: 15px;"><strong>Telefone:</strong> {empresa_telefone}</p>
        <p style="margin: 5px 0; font-size: 15px;"><strong>E-mail:</strong> {empresa_email}</p>
        <p style="margin: 5px 0; font-size: 15px;"><strong>Horário:</strong> Segunda a Sexta, 8h às 18h</p>
      </div>
    </div>

    <div style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #e5e7eb;">
      <p style="text-align: center; font-size: 14px; color: #6b7280; margin-bottom: 50px;">
        Este termo de garantia é válido em todo território nacional e deve ser apresentado em caso de acionamento.
      </p>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px;">
        <div style="text-align: center;">
          <div style="border-bottom: 2px solid #1f2937; margin-bottom: 10px; padding-top: 30px;"></div>
          <p style="margin: 0; font-weight: 700; color: #1f2937;">Cliente</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">{cliente_nome}</p>
        </div>
        
        <div style="text-align: center;">
          <div style="border-bottom: 2px solid #1f2937; margin-bottom: 10px; padding-top: 30px;"></div>
          <p style="margin: 0; font-weight: 700; color: #1f2937;">{empresa_nome}</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">Prestador de Serviços</p>
        </div>
      </div>
    </div>
  </div>',
  true
);

-- 2. Certificado de Conclusão
INSERT INTO document_templates (
  name, 
  description, 
  department, 
  category, 
  content_template, 
  is_active
) VALUES (
  'Certificado de Conclusão de Serviço',
  'Certificado profissional de conclusão',
  'Operacional',
  'Certificado',
  '<div style="font-family: ''Playfair Display'', serif; color: #1f2937; text-align: center;">
    <div style="border: 8px double #3b82f6; padding: 50px; border-radius: 16px; background: linear-gradient(to bottom, #ffffff, #f9fafb); margin: 20px;">
      
      <div style="margin-bottom: 30px;">
        <div style="width: 100px; height: 100px; background: linear-gradient(135deg, #3b82f6, #1e40af); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 48px; color: white;">✓</div>
        <h1 style="font-size: 48px; margin: 0 0 15px 0; font-weight: 700; color: #1f2937; letter-spacing: 2px;">CERTIFICADO</h1>
        <p style="font-size: 24px; margin: 0; color: #3b82f6; font-weight: 600;">DE CONCLUSÃO DE SERVIÇO</p>
      </div>

      <div style="width: 60px; height: 3px; background: linear-gradient(to right, transparent, #3b82f6, transparent); margin: 40px auto;"></div>

      <div style="font-family: ''Inter'', sans-serif; font-size: 18px; line-height: 2; color: #4b5563; margin: 40px 0;">
        <p style="margin: 20px 0;">Certificamos que os serviços técnicos foram executados com sucesso para:</p>
        
        <div style="background: #f3f4f6; padding: 30px; border-radius: 12px; margin: 30px auto; max-width: 600px; border-left: 5px solid #3b82f6;">
          <p style="font-size: 28px; font-weight: 700; color: #1f2937; margin: 0 0 10px 0; font-family: ''Playfair Display'', serif;">{cliente_nome}</p>
          <p style="margin: 5px 0; font-size: 16px;"><strong>CPF/CNPJ:</strong> {cliente_cpf_cnpj}</p>
          <p style="margin: 5px 0; font-size: 16px;"><strong>Endereço:</strong> {cliente_endereco}</p>
        </div>

        <div style="margin: 40px 0;">
          <p style="font-size: 16px; margin: 0 0 5px 0; color: #6b7280;">Ordem de Serviço Nº</p>
          <p style="font-size: 32px; font-weight: 700; color: #3b82f6; margin: 0; font-family: ''Inter'', sans-serif;">{numero_documento}</p>
        </div>

        <div style="background: #dbeafe; padding: 25px; border-radius: 12px; margin: 30px auto; max-width: 600px;">
          <p style="font-size: 16px; margin: 0 0 15px 0; font-weight: 600; color: #1e40af;">Serviços Executados:</p>
          <p style="font-size: 15px; margin: 0; color: #1e3a8a; text-align: left;">
            ✓ Instalação e configuração completa<br>
            ✓ Testes de funcionalidade<br>
            ✓ Treinamento operacional<br>
            ✓ Documentação técnica entregue
          </p>
        </div>

        <div style="margin: 40px 0;">
          <p style="margin: 0; font-size: 16px; color: #6b7280;">Data de Conclusão</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 700; color: #1f2937; font-family: ''Inter'', sans-serif;">{data_atual}</p>
        </div>

        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 30px auto; max-width: 500px;">
          <p style="margin: 0; font-size: 15px; color: #065f46; font-weight: 600;">Garantia de 90 dias</p>
        </div>
      </div>

      <div style="width: 60px; height: 3px; background: linear-gradient(to right, transparent, #3b82f6, transparent); margin: 40px auto;"></div>

      <div style="margin-top: 60px;">
        <div style="border-top: 3px solid #1f2937; max-width: 300px; margin: 0 auto; padding-top: 15px;">
          <p style="margin: 0; font-weight: 700; font-size: 18px; color: #1f2937; font-family: ''Playfair Display'', serif;">{empresa_nome}</p>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280; font-family: ''Inter'', sans-serif;">Técnico Responsável</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #9ca3af; font-family: ''Inter'', sans-serif;">CNPJ: {empresa_cnpj}</p>
        </div>
      </div>

      <div style="margin-top: 40px; font-family: ''Inter'', sans-serif; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0;">Documento gerado eletronicamente em {data_atual}</p>
        <p style="margin: 5px 0 0 0;">Autenticidade pode ser verificada através do código {numero_documento}</p>
      </div>
    </div>
  </div>',
  true
);

-- 3. Relatório de Visita Técnica
INSERT INTO document_templates (
  name, 
  description, 
  department, 
  category, 
  content_template, 
  is_active
) VALUES (
  'Relatório de Visita Técnica',
  'Relatório detalhado de visita técnica',
  'Operacional',
  'Relatório',
  '<div style="font-family: ''Roboto'', sans-serif; color: #1f2937; line-height: 1.6;">
    <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 40px; border-radius: 12px 12px 0 0;">
      <h1 style="font-size: 36px; margin: 0 0 10px 0; font-weight: 700;">RELATÓRIO DE VISITA TÉCNICA</h1>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; font-size: 14px;">
        <span>Relatório Nº {numero_documento}</span>
        <span>Data: {data_atual}</span>
      </div>
    </div>

    <div style="padding: 40px; background: white; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 35px;">
        <div style="background: #f9fafb; padding: 25px; border-radius: 8px; border-left: 4px solid #6366f1;">
          <h3 style="margin: 0 0 15px 0; color: #4f46e5; font-size: 16px; font-weight: 700;">INFORMAÇÕES DO CLIENTE</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Cliente:</strong> {cliente_nome}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Telefone:</strong> {cliente_telefone}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>E-mail:</strong> {cliente_email}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Local:</strong> {cliente_endereco}</p>
        </div>

        <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 15px 0; color: #059669; font-size: 16px; font-weight: 700;">DADOS DA VISITA</h3>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Data:</strong> {data_atual}</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Horário:</strong> [Informar]</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Técnico:</strong> [Nome do Técnico]</p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Duração:</strong> [X horas]</p>
        </div>
      </div>

      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #1f2937; font-weight: 700; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">1. OBJETIVO DA VISITA</h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; font-size: 15px;">
          <p style="margin: 0;">Realizar manutenção preventiva e inspeção técnica dos equipamentos conforme contrato de prestação de serviços.</p>
        </div>
      </div>

      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #1f2937; font-weight: 700; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">2. EQUIPAMENTOS INSPECIONADOS</h2>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <thead>
            <tr style="background: #eef2ff;">
              <th style="padding: 12px; text-align: left; border: 1px solid #e0e7ff; font-weight: 700; color: #4f46e5;">#</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #e0e7ff; font-weight: 700; color: #4f46e5;">Equipamento</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #e0e7ff; font-weight: 700; color: #4f46e5;">Marca/Modelo</th>
              <th style="padding: 12px; text-align: center; border: 1px solid #e0e7ff; font-weight: 700; color: #4f46e5;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="background: white;">
              <td style="padding: 12px; border: 1px solid #e5e7eb;">01</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">[Tipo de Equipamento]</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">[Marca/Modelo]</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;"><span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-weight: 600;">OK</span></td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 12px; border: 1px solid #e5e7eb;">02</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">[Tipo de Equipamento]</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">[Marca/Modelo]</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;"><span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-weight: 600;">Atenção</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #1f2937; font-weight: 700; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">3. ATIVIDADES REALIZADAS</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
          <ul style="margin: 0; padding-left: 25px; font-size: 15px; line-height: 2;">
            <li><strong>Limpeza geral:</strong> Realizada limpeza completa dos equipamentos</li>
            <li><strong>Testes funcionais:</strong> Executados testes de performance</li>
            <li><strong>Ajustes:</strong> Calibração e ajustes finos</li>
            <li><strong>Verificação de segurança:</strong> Inspeção de sistemas de proteção</li>
          </ul>
        </div>
      </div>

      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #1f2937; font-weight: 700; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">4. PROBLEMAS IDENTIFICADOS</h2>
        
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #fcd34d;">Problema</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #fcd34d;">Gravidade</th>
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #fcd34d;">Ação Recomendada</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #fde68a;">[Descrever problema]</td>
                <td style="padding: 10px; text-align: center; border-bottom: 1px solid #fde68a;"><span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-weight: 600;">Média</span></td>
                <td style="padding: 10px; border-bottom: 1px solid #fde68a;">[Ação sugerida]</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #1f2937; font-weight: 700; border-bottom: 2px solid #10b981; padding-bottom: 10px;">5. RECOMENDAÇÕES</h2>
        
        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
          <ol style="margin: 0; padding-left: 25px; font-size: 15px; line-height: 2; color: #065f46;">
            <li>Realizar manutenção preventiva a cada 3 meses</li>
            <li>Substituir componentes desgastados identificados</li>
            <li>Implementar rotina de limpeza semanal</li>
            <li>Agendar treinamento para equipe operacional</li>
          </ol>
        </div>
      </div>

      <div style="background: #e0e7ff; padding: 25px; border-radius: 8px; margin-bottom: 35px;">
        <h3 style="margin: 0 0 15px 0; color: #4338ca; font-size: 18px; font-weight: 700;">ORÇAMENTO ESTIMADO</h3>
        <div style="font-size: 15px; color: #3730a3;">
          <p style="margin: 8px 0;"><strong>Peças e materiais:</strong> R$ [Valor]</p>
          <p style="margin: 8px 0;"><strong>Mão de obra:</strong> R$ [Valor]</p>
          <p style="margin: 15px 0 0 0; font-size: 20px; font-weight: 700; padding-top: 15px; border-top: 2px solid #c7d2fe;">TOTAL ESTIMADO: R$ [Valor Total]</p>
        </div>
      </div>

      <div style="margin-bottom: 35px;">
        <h2 style="font-size: 20px; margin: 0 0 20px 0; color: #1f2937; font-weight: 700; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">6. OBSERVAÇÕES FINAIS</h2>
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; min-height: 100px; font-size: 15px;">
          <p style="margin: 0;">[Adicionar observações relevantes, comentários do cliente, próximos agendamentos, etc.]</p>
        </div>
      </div>
    </div>

    <div style="background: #f3f4f6; padding: 40px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 60px;">
        <div style="text-align: center;">
          <div style="border-bottom: 2px solid #1f2937; margin-bottom: 10px; padding-top: 40px;"></div>
          <p style="margin: 0; font-weight: 700; color: #1f2937;">Técnico Responsável</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">[Nome do Técnico]</p>
        </div>
        
        <div style="text-align: center;">
          <div style="border-bottom: 2px solid #1f2937; margin-bottom: 10px; padding-top: 40px;"></div>
          <p style="margin: 0; font-weight: 700; color: #1f2937;">Cliente</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">{cliente_nome}</p>
        </div>
      </div>
      
      <p style="text-align: center; margin: 30px 0 0 0; font-size: 12px; color: #9ca3af;">
        Relatório gerado pelo sistema Giartech | {empresa_nome} | {empresa_telefone}
      </p>
    </div>
  </div>',
  true
);

-- 4. Checklist de Manutenção Preventiva
INSERT INTO document_templates (
  name, 
  description, 
  department, 
  category, 
  content_template, 
  is_active
) VALUES (
  'Checklist de Manutenção Preventiva',
  'Checklist completo para manutenção preventiva',
  'Operacional',
  'Checklist',
  '<div style="font-family: ''Lato'', sans-serif; color: #1f2937;">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px; text-align: center; border-radius: 12px; margin-bottom: 35px;">
      <h1 style="font-size: 38px; margin: 0 0 10px 0; font-weight: 700;">CHECKLIST DE MANUTENÇÃO PREVENTIVA</h1>
      <p style="font-size: 16px; margin: 0; opacity: 0.9;">Documento Nº {numero_documento} | {data_atual}</p>
    </div>

    <div style="background: #fffbeb; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #f59e0b;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px;">
        <div>
          <p style="margin: 8px 0;"><strong>Cliente:</strong> {cliente_nome}</p>
          <p style="margin: 8px 0;"><strong>Local:</strong> {cliente_endereco}</p>
        </div>
        <div>
          <p style="margin: 8px 0;"><strong>Data:</strong> {data_atual}</p>
          <p style="margin: 8px 0;"><strong>Técnico:</strong> [Nome]</p>
        </div>
      </div>
    </div>

    <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <h2 style="font-size: 22px; margin: 0 0 25px 0; color: #f59e0b; font-weight: 700; display: flex; align-items: center; gap: 10px;">
        <span style="background: #f59e0b; color: white; width: 32px; height: 32px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">1</span>
        INSPEÇÃO VISUAL
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; width: 60%;">Item de Verificação</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; width: 15%;">OK</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; width: 15%;">NOK</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; width: 10%;">N/A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Estado geral do equipamento</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Conexões e fiação</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Painel de controle</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Sinais de vazamento</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <h2 style="font-size: 22px; margin: 0 0 25px 0; color: #3b82f6; font-weight: 700; display: flex; align-items: center; gap: 10px;">
        <span style="background: #3b82f6; color: white; width: 32px; height: 32px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">2</span>
        TESTES FUNCIONAIS
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; width: 60%;">Teste Realizado</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; width: 15%;">OK</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; width: 15%;">NOK</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; width: 10%;">N/A</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Funcionamento geral</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Sistemas de segurança</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Performance operacional</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 25px;">
      <h2 style="font-size: 22px; margin: 0 0 25px 0; color: #10b981; font-weight: 700; display: flex; align-items: center; gap: 10px;">
        <span style="background: #10b981; color: white; width: 32px; height: 32px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;">3</span>
        LIMPEZA E MANUTENÇÃO
      </h2>
      
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb; width: 60%;">Atividade</th>
            <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb; width: 40%;">Realizado</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Limpeza externa</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Limpeza interna</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Lubrificação de partes móveis</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
          <tr style="background: #f9fafb;">
            <td style="padding: 12px; border: 1px solid #e5e7eb;">Ajustes e calibrações</td>
            <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">☐</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div style="background: #fee2e2; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #ef4444;">
      <h3 style="margin: 0 0 15px 0; color: #991b1b; font-size: 18px; font-weight: 700;">PROBLEMAS IDENTIFICADOS</h3>
      <div style="background: white; padding: 20px; border-radius: 8px; min-height: 100px; font-size: 14px; color: #7f1d1d;">
        <p style="margin: 0;">[Descrever problemas encontrados durante a manutenção]</p>
      </div>
    </div>

    <div style="background: #d1fae5; padding: 25px; border-radius: 12px; margin-bottom: 30px; border-left: 5px solid #10b981;">
      <h3 style="margin: 0 0 15px 0; color: #065f46; font-size: 18px; font-weight: 700;">RECOMENDAÇÕES PARA PRÓXIMA MANUTENÇÃO</h3>
      <div style="background: white; padding: 20px; border-radius: 8px; min-height: 100px; font-size: 14px; color: #064e3b;">
        <p style="margin: 0;">[Adicionar recomendações e observações]</p>
      </div>
    </div>

    <div style="background: #e0e7ff; padding: 25px; border-radius: 12px; margin-bottom: 40px;">
      <h3 style="margin: 0 0 15px 0; color: #3730a3; font-size: 18px; font-weight: 700;">PRÓXIMA MANUTENÇÃO AGENDADA</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 15px; color: #312e81;">
        <p style="margin: 0;"><strong>Data Prevista:</strong> [Data]</p>
        <p style="margin: 0;"><strong>Tipo:</strong> Preventiva</p>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 60px;">
      <div style="text-align: center;">
        <div style="border-bottom: 2px solid #1f2937; margin-bottom: 10px; padding-top: 40px;"></div>
        <p style="margin: 0; font-weight: 700; color: #1f2937;">Técnico Responsável</p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">[Nome e Assinatura]</p>
      </div>
      
      <div style="text-align: center;">
        <div style="border-bottom: 2px solid #1f2937; margin-bottom: 10px; padding-top: 40px;"></div>
        <p style="margin: 0; font-weight: 700; color: #1f2937;">Cliente</p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #6b7280;">{cliente_nome}</p>
      </div>
    </div>
  </div>',
  true
);
