/*
  # Add Additional Document Templates

  1. New Templates
    - Contract Template (Modelo de Contrato)
    - Invoice Template (Modelo de Fatura)
    - Work Order Template (Ordem de Serviço Padrão)
    - Budget Template (Orçamento Detalhado)
    - Technical Report (Relatório Técnico)
    - Safety Report (Relatório de Segurança)
    - Inventory Report (Relatório de Inventário)

  2. Purpose
    - Expand template library for different business needs
    - Provide ready-to-use templates for common documents
*/

-- Contract Template
INSERT INTO document_templates (name, description, department, category, content_template, is_active)
VALUES (
  'Modelo de Contrato',
  'Template padrão para contratos de serviço',
  'Juridico',
  'Contrato',
  E'# CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\n## PARTES CONTRATANTES\n\n**CONTRATANTE:**\nNome: [Nome do Cliente]\nCPF/CNPJ: [Documento]\nEndereço: [Endereço Completo]\n\n**CONTRATADO:**\nNome: [Nome da Empresa]\nCNPJ: [CNPJ da Empresa]\nEndereço: [Endereço da Empresa]\n\n## OBJETO DO CONTRATO\n\nO presente contrato tem como objeto a prestação de serviços de [Descrição dos Serviços].\n\n## VALOR E FORMA DE PAGAMENTO\n\nPelo serviço prestado, o CONTRATANTE pagará ao CONTRATADO o valor de R$ [Valor].\n\nForma de pagamento: [Condições de Pagamento]\n\n## PRAZO\n\nO prazo para execução dos serviços será de [X] dias, iniciando em [Data Início] e encerrando em [Data Fim].\n\n## OBRIGAÇÕES DO CONTRATADO\n\n1. Executar os serviços conforme especificado\n2. Utilizar materiais de qualidade\n3. Cumprir os prazos estabelecidos\n\n## OBRIGAÇÕES DO CONTRATANTE\n\n1. Fornecer acesso ao local\n2. Efetuar os pagamentos nos prazos estabelecidos\n\n## GARANTIA\n\nGarantia de [X] meses contra defeitos de execução.\n\n___________________________\nCONTRATANTE\n\n___________________________\nCONTRATADO',
  true
) ON CONFLICT (name) DO NOTHING;

-- Invoice Template
INSERT INTO document_templates (name, description, department, category, content_template, is_active)
VALUES (
  'Modelo de Fatura',
  'Template para emissão de faturas e cobranças',
  'Financeiro',
  'Fatura',
  E'# FATURA Nº [Número]\n\n## DADOS DA EMPRESA\n\n**Razão Social:** [Nome da Empresa]\n**CNPJ:** [CNPJ]\n**Telefone:** [Telefone]\n\n## DADOS DO CLIENTE\n\n**Cliente:** [Nome do Cliente]\n**CPF/CNPJ:** [Documento]\n**Telefone:** [Telefone]\n\n## FATURA\n\n**Data de Emissão:** [Data]\n**Vencimento:** [Data de Vencimento]\n\n## ITENS\n\n| Item | Descrição | Qtd | Valor Unit. | Total |\n|------|-----------|-----|-------------|-------|\n| 1 | [Descrição] | [Qtd] | R$ [Valor] | R$ [Total] |\n\n## TOTAL\n\n**Subtotal:** R$ [Subtotal]\n**TOTAL A PAGAR:** R$ [Total]\n\n## PAGAMENTO\n\n**PIX:** [Chave PIX]\n**Banco:** [Banco] | **Agência:** [Agência] | **Conta:** [Conta]',
  true
) ON CONFLICT (name) DO NOTHING;

-- Work Order Template
INSERT INTO document_templates (name, description, department, category, content_template, is_active)
VALUES (
  'Ordem de Serviço Padrão',
  'Template detalhado para ordens de serviço',
  'Operacional',
  'Ordem de Serviço',
  E'# ORDEM DE SERVIÇO Nº [Número]\n\n## CLIENTE\n\n**Nome:** [Nome do Cliente]\n**Telefone:** [Telefone]\n**Endereço:** [Endereço Completo]\n\n## SERVIÇO\n\n**Data:** [Data]\n**Prazo:** [Prazo]\n**Prioridade:** [Alta/Média/Baixa]\n**Técnico:** [Nome do Técnico]\n\n**Descrição:** [Descrição do serviço]\n\n## EQUIPAMENTO\n\n**Marca:** [Marca]\n**Modelo:** [Modelo]\n**Serial:** [Serial]\n\n## MATERIAIS\n\n| Item | Descrição | Qtd |\n|------|-----------|-----|\n| 1 | [Material] | [Qtd] |\n\n## PROCEDIMENTOS\n\n1. [Passo 1]\n2. [Passo 2]\n\n## OBSERVAÇÕES\n\n[Observações]\n\n___________________________\nTécnico\n\n___________________________\nCliente',
  true
) ON CONFLICT (name) DO NOTHING;

-- Budget Template
INSERT INTO document_templates (name, description, department, category, content_template, is_active)
VALUES (
  'Orçamento Detalhado',
  'Template completo para orçamentos comerciais',
  'Comercial',
  'Orçamento',
  E'# ORÇAMENTO Nº [Número]\n\n**Data:** [Data]\n**Validade:** [X] dias\n\n## CLIENTE\n\n**Nome:** [Nome do Cliente]\n**CPF/CNPJ:** [Documento]\n**Telefone:** [Telefone]\n\n## DESCRIÇÃO\n\n[Descrição do projeto]\n\n## ITENS\n\n### Serviços\n\n| Item | Descrição | Qtd | Valor Unit. | Total |\n|------|-----------|-----|-------------|-------|\n| 1 | [Serviço] | [Q] | R$ [Val] | R$ [Tot] |\n\n### Materiais\n\n| Item | Descrição | Qtd | Valor Unit. | Total |\n|------|-----------|-----|-------------|-------|\n| 1 | [Material] | [Q] | R$ [Val] | R$ [Tot] |\n\n## TOTAIS\n\n**Subtotal:** R$ [Valor]\n**Descontos:** R$ [Valor]\n**TOTAL:** R$ [Valor]\n\n## CONDIÇÕES\n\n**Pagamento:** [Condições]\n**Prazo:** [X] dias\n**Garantia:** [X] meses',
  true
) ON CONFLICT (name) DO NOTHING;

-- Technical Report Template
INSERT INTO document_templates (name, description, department, category, content_template, is_active)
VALUES (
  'Relatório Técnico',
  'Template para relatórios técnicos detalhados',
  'Operacional',
  'Relatório',
  E'# RELATÓRIO TÉCNICO\n\n**Relatório Nº:** [Número]\n**Data:** [Data]\n**Técnico:** [Nome]\n**Cliente:** [Cliente]\n\n## OBJETIVO\n\n[Objetivo da visita]\n\n## EQUIPAMENTOS\n\n| Item | Equipamento | Marca | Modelo |\n|------|-------------|-------|---------|\n| 1 | [Equip] | [Marca] | [Modelo] |\n\n## INSPEÇÃO\n\n### Testes Realizados\n1. [Teste 1] - Resultado: [OK/NOK]\n2. [Teste 2] - Resultado: [OK/NOK]\n\n## PROBLEMAS\n\n1. [Problema 1] - Gravidade: [Alta/Média/Baixa]\n\n## DIAGNÓSTICO\n\n[Análise técnica]\n\n## RECOMENDAÇÕES\n\n1. [Recomendação 1]\n2. [Recomendação 2]\n\n## ORÇAMENTO\n\n| Item | Descrição | Valor |\n|------|-----------|-------|\n| 1 | [Serviço] | R$ [Valor] |\n\n**TOTAL:** R$ [Total]\n\n___________________________\nTécnico Responsável',
  true
) ON CONFLICT (name) DO NOTHING;

-- Safety Report Template
INSERT INTO document_templates (name, description, department, category, content_template, is_active)
VALUES (
  'Relatório de Segurança',
  'Template para relatórios de segurança do trabalho',
  'Operacional',
  'Segurança',
  E'# RELATÓRIO DE SEGURANÇA\n\n**Data:** [Data]\n**Local:** [Local]\n**Responsável:** [Nome]\n\n## CHECKLIST\n\n### EPIs\n- [ ] Capacetes\n- [ ] Óculos de proteção\n- [ ] Luvas\n- [ ] Botas de segurança\n\n### EPCs\n- [ ] Extintores\n- [ ] Saídas de emergência\n- [ ] Iluminação\n- [ ] Sinalização\n\n## NÃO CONFORMIDADES\n\n| Item | Descrição | Risco | Prazo |\n|------|-----------|-------|-------|\n| 1 | [NC] | [Alto/Médio/Baixo] | [Prazo] |\n\n## ACIDENTES\n\n| Data | Tipo | Descrição | Ação |\n|------|------|-----------|-------|\n| [Data] | [Tipo] | [Desc] | [Ação] |\n\n## AÇÕES CORRETIVAS\n\n1. [Ação 1] - Prazo: [Prazo] - Responsável: [Nome]\n\n## TREINAMENTOS\n\n| Data | Tema | Participantes |\n|------|------|---------------|\n| [Data] | [Tema] | [Qtd] |\n\n___________________________\nResponsável',
  true
) ON CONFLICT (name) DO NOTHING;

-- Inventory Report Template
INSERT INTO document_templates (name, description, department, category, content_template, is_active)
VALUES (
  'Relatório de Inventário',
  'Template para controle de inventário',
  'Operacional',
  'Inventário',
  E'# RELATÓRIO DE INVENTÁRIO\n\n**Período:** [Data Início] a [Data Fim]\n**Responsável:** [Nome]\n**Local:** [Local]\n\n## RESUMO\n\n**Total de Itens:** [Quantidade]\n**Valor Total:** R$ [Valor]\n**Divergências:** [Quantidade]\n\n## INVENTÁRIO\n\n### Materiais\n\n| Código | Descrição | Qtd Sistema | Qtd Física | Div | Valor |\n|--------|-----------|-------------|------------|-----|-------|\n| [Cód] | [Desc] | [QtdS] | [QtdF] | [Dif] | R$ [V] |\n\n## DIVERGÊNCIAS\n\n### Sobras\n| Item | Diferença | Causa |\n|------|-----------|-------|\n| [Item] | [Dif] | [Causa] |\n\n### Faltas\n| Item | Diferença | Causa |\n|------|-----------|-------|\n| [Item] | [Dif] | [Causa] |\n\n## ESTOQUE MÍNIMO\n\n| Item | Qtd Atual | Qtd Mínima | Ação |\n|------|-----------|------------|-------|\n| [Item] | [Atual] | [Min] | [Ação] |\n\n## RECOMENDAÇÕES\n\n1. [Recomendação 1]\n2. [Recomendação 2]\n\n___________________________\nResponsável',
  true
) ON CONFLICT (name) DO NOTHING;
