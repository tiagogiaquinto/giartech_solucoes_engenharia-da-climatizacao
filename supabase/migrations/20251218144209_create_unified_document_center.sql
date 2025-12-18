/*
  # Centro Unificado de Documentos Empresariais
  
  1. Novos Templates
    - PMOC (Plano de Manutenção, Operação e Controle)
    - Contrato de Prestação de Serviço
    - Orçamento Técnico
    - Termo de Garantia
    - Relatório Técnico
    - Laudo Técnico
    - ART (Anotação de Responsabilidade Técnica)
    - Check-list de Manutenção
    
  2. Tabela de Documentos Gerados
    - Histórico de todos os documentos criados
    - Versionamento de documentos
    - Assinaturas digitais
    
  3. Configurações de Empresa
    - Logo, cores, dados bancários
    - Informações legais e certificações
*/

-- Adicionar novos tipos de categoria
DO $$
BEGIN
  -- Inserir templates de documentos técnicos
  INSERT INTO document_templates (name, description, department, category, content_template, fields, is_active)
  VALUES 
  (
    'PMOC - Plano de Manutenção, Operação e Controle',
    'Template completo para PMOC conforme Portaria 3.523/98',
    'Técnico',
    'PMOC',
    '# PLANO DE MANUTENÇÃO, OPERAÇÃO E CONTROLE - PMOC

## DADOS DO RESPONSÁVEL
**Empresa:** {{empresa_nome}}
**CNPJ:** {{empresa_cnpj}}
**Responsável Técnico:** {{responsavel_nome}}
**Registro Profissional:** {{registro_profissional}}

## DADOS DO CLIENTE
**Razão Social:** {{cliente_nome}}
**CNPJ/CPF:** {{cliente_documento}}
**Endereço:** {{cliente_endereco}}
**Telefone:** {{cliente_telefone}}

## IDENTIFICAÇÃO DO SISTEMA
**Tipo de Sistema:** {{sistema_tipo}}
**Capacidade:** {{sistema_capacidade}}
**Marca/Modelo:** {{sistema_marca_modelo}}
**Ano de Instalação:** {{sistema_ano}}

## PERIODICIDADE DE MANUTENÇÃO

### Manutenções Mensais
{{manutencoes_mensais}}

### Manutenções Trimestrais
{{manutencoes_trimestrais}}

### Manutenções Semestrais
{{manutencoes_semestrais}}

### Manutenções Anuais
{{manutencoes_anuais}}

## PROCEDIMENTOS OPERACIONAIS
{{procedimentos}}

## RESPONSABILIDADES
{{responsabilidades}}

## CONTROLE DE QUALIDADE DO AR
{{controle_qualidade}}

## REGISTROS E DOCUMENTAÇÃO
{{registros}}

## VIGÊNCIA
**Início:** {{vigencia_inicio}}
**Término:** {{vigencia_fim}}

---
**Data de Emissão:** {{data_emissao}}
**Assinatura do Responsável Técnico:** _______________________________',
    '[
      {"name": "empresa_nome", "type": "text", "label": "Nome da Empresa"},
      {"name": "empresa_cnpj", "type": "text", "label": "CNPJ"},
      {"name": "responsavel_nome", "type": "text", "label": "Responsável Técnico"},
      {"name": "registro_profissional", "type": "text", "label": "CREA/CRT"},
      {"name": "cliente_nome", "type": "text", "label": "Cliente"},
      {"name": "cliente_documento", "type": "text", "label": "CPF/CNPJ"},
      {"name": "cliente_endereco", "type": "textarea", "label": "Endereço"},
      {"name": "cliente_telefone", "type": "text", "label": "Telefone"},
      {"name": "sistema_tipo", "type": "text", "label": "Tipo de Sistema"},
      {"name": "sistema_capacidade", "type": "text", "label": "Capacidade"},
      {"name": "sistema_marca_modelo", "type": "text", "label": "Marca/Modelo"},
      {"name": "sistema_ano", "type": "text", "label": "Ano"},
      {"name": "manutencoes_mensais", "type": "textarea", "label": "Manutenções Mensais"},
      {"name": "manutencoes_trimestrais", "type": "textarea", "label": "Manutenções Trimestrais"},
      {"name": "manutencoes_semestrais", "type": "textarea", "label": "Manutenções Semestrais"},
      {"name": "manutencoes_anuais", "type": "textarea", "label": "Manutenções Anuais"},
      {"name": "procedimentos", "type": "textarea", "label": "Procedimentos"},
      {"name": "responsabilidades", "type": "textarea", "label": "Responsabilidades"},
      {"name": "controle_qualidade", "type": "textarea", "label": "Controle de Qualidade"},
      {"name": "registros", "type": "textarea", "label": "Registros"},
      {"name": "vigencia_inicio", "type": "date", "label": "Início"},
      {"name": "vigencia_fim", "type": "date", "label": "Término"},
      {"name": "data_emissao", "type": "date", "label": "Data de Emissão"}
    ]'::jsonb,
    true
  ),
  (
    'Contrato de Prestação de Serviços',
    'Contrato padrão para prestação de serviços',
    'Jurídico',
    'Contrato',
    '# CONTRATO DE PRESTAÇÃO DE SERVIÇOS

**CONTRATANTE:** {{contratante_nome}}, inscrito no CNPJ/CPF sob nº {{contratante_documento}}, estabelecido à {{contratante_endereco}}.

**CONTRATADA:** {{contratada_nome}}, inscrita no CNPJ sob nº {{contratada_cnpj}}, estabelecida à {{contratada_endereco}}.

## CLÁUSULA PRIMEIRA - DO OBJETO
O presente contrato tem como objeto a prestação de serviços de {{objeto_servicos}}.

## CLÁUSULA SEGUNDA - DO VALOR
O valor total dos serviços é de **R$ {{valor_total}}** ({{valor_extenso}}), a ser pago {{forma_pagamento}}.

## CLÁUSULA TERCEIRA - DO PRAZO
O prazo de execução dos serviços será de {{prazo_execucao}}, iniciando-se em {{data_inicio}} e terminando em {{data_fim}}.

## CLÁUSULA QUARTA - DAS OBRIGAÇÕES DA CONTRATADA
{{obrigacoes_contratada}}

## CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO CONTRATANTE
{{obrigacoes_contratante}}

## CLÁUSULA SEXTA - DA GARANTIA
{{clausula_garantia}}

## CLÁUSULA SÉTIMA - DA RESCISÃO
{{clausula_rescisao}}

## CLÁUSULA OITAVA - DAS PENALIDADES
{{clausula_penalidades}}

## CLÁUSULA NONA - DO FORO
Fica eleito o foro de {{foro_cidade}} para dirimir quaisquer dúvidas oriundas do presente contrato.

---

{{cidade}}, {{data_assinatura}}

_________________________________
**CONTRATANTE**
{{contratante_nome}}
{{contratante_documento}}

_________________________________
**CONTRATADA**
{{contratada_nome}}
{{contratada_cnpj}}

**Testemunhas:**

1. ____________________________
Nome: {{testemunha1_nome}}
CPF: {{testemunha1_cpf}}

2. ____________________________
Nome: {{testemunha2_nome}}
CPF: {{testemunha2_cpf}}',
    '[
      {"name": "contratante_nome", "type": "text", "label": "Nome Contratante"},
      {"name": "contratante_documento", "type": "text", "label": "CPF/CNPJ Contratante"},
      {"name": "contratante_endereco", "type": "textarea", "label": "Endereço Contratante"},
      {"name": "contratada_nome", "type": "text", "label": "Nome Contratada"},
      {"name": "contratada_cnpj", "type": "text", "label": "CNPJ Contratada"},
      {"name": "contratada_endereco", "type": "textarea", "label": "Endereço Contratada"},
      {"name": "objeto_servicos", "type": "textarea", "label": "Objeto dos Serviços"},
      {"name": "valor_total", "type": "text", "label": "Valor Total"},
      {"name": "valor_extenso", "type": "text", "label": "Valor por Extenso"},
      {"name": "forma_pagamento", "type": "textarea", "label": "Forma de Pagamento"},
      {"name": "prazo_execucao", "type": "text", "label": "Prazo de Execução"},
      {"name": "data_inicio", "type": "date", "label": "Data de Início"},
      {"name": "data_fim", "type": "date", "label": "Data de Término"},
      {"name": "obrigacoes_contratada", "type": "textarea", "label": "Obrigações da Contratada"},
      {"name": "obrigacoes_contratante", "type": "textarea", "label": "Obrigações do Contratante"},
      {"name": "clausula_garantia", "type": "textarea", "label": "Cláusula de Garantia"},
      {"name": "clausula_rescisao", "type": "textarea", "label": "Cláusula de Rescisão"},
      {"name": "clausula_penalidades", "type": "textarea", "label": "Cláusula de Penalidades"},
      {"name": "foro_cidade", "type": "text", "label": "Cidade do Foro"},
      {"name": "cidade", "type": "text", "label": "Cidade"},
      {"name": "data_assinatura", "type": "date", "label": "Data de Assinatura"},
      {"name": "testemunha1_nome", "type": "text", "label": "Nome Testemunha 1"},
      {"name": "testemunha1_cpf", "type": "text", "label": "CPF Testemunha 1"},
      {"name": "testemunha2_nome", "type": "text", "label": "Nome Testemunha 2"},
      {"name": "testemunha2_cpf", "type": "text", "label": "CPF Testemunha 2"}
    ]'::jsonb,
    true
  ),
  (
    'Termo de Garantia',
    'Termo de garantia para serviços prestados',
    'Técnico',
    'Garantia',
    '# TERMO DE GARANTIA

**Nº:** {{numero_garantia}}
**Data de Emissão:** {{data_emissao}}

## DADOS DA EMPRESA PRESTADORA
**Razão Social:** {{empresa_nome}}
**CNPJ:** {{empresa_cnpj}}
**Endereço:** {{empresa_endereco}}
**Telefone:** {{empresa_telefone}}
**E-mail:** {{empresa_email}}

## DADOS DO CLIENTE
**Nome/Razão Social:** {{cliente_nome}}
**CPF/CNPJ:** {{cliente_documento}}
**Endereço:** {{cliente_endereco}}
**Telefone:** {{cliente_telefone}}

## SERVIÇO REALIZADO
**Ordem de Serviço Nº:** {{numero_os}}
**Data de Execução:** {{data_execucao}}
**Descrição dos Serviços:** 
{{descricao_servicos}}

## CONDIÇÕES DE GARANTIA

### PRAZO DE GARANTIA
{{prazo_garantia}}

### COBERTURA
A garantia cobre:
{{itens_cobertos}}

### EXCLUSÕES
Não estão cobertos pela garantia:
{{itens_excluidos}}

## CONDIÇÕES PARA ACIONAMENTO
{{condicoes_acionamento}}

## OBSERVAÇÕES
{{observacoes}}

---

**ATENÇÃO:** Este termo de garantia é válido mediante apresentação deste documento e comprovante de pagamento.

---

_________________________________
**{{empresa_nome}}**
CNPJ: {{empresa_cnpj}}

_________________________________
**Cliente**
{{cliente_nome}}
{{cliente_documento}}

**Data:** {{data_emissao}}',
    '[
      {"name": "numero_garantia", "type": "text", "label": "Número da Garantia"},
      {"name": "data_emissao", "type": "date", "label": "Data de Emissão"},
      {"name": "empresa_nome", "type": "text", "label": "Nome da Empresa"},
      {"name": "empresa_cnpj", "type": "text", "label": "CNPJ"},
      {"name": "empresa_endereco", "type": "textarea", "label": "Endereço"},
      {"name": "empresa_telefone", "type": "text", "label": "Telefone"},
      {"name": "empresa_email", "type": "text", "label": "E-mail"},
      {"name": "cliente_nome", "type": "text", "label": "Nome do Cliente"},
      {"name": "cliente_documento", "type": "text", "label": "CPF/CNPJ"},
      {"name": "cliente_endereco", "type": "textarea", "label": "Endereço"},
      {"name": "cliente_telefone", "type": "text", "label": "Telefone"},
      {"name": "numero_os", "type": "text", "label": "Número da OS"},
      {"name": "data_execucao", "type": "date", "label": "Data de Execução"},
      {"name": "descricao_servicos", "type": "textarea", "label": "Descrição dos Serviços"},
      {"name": "prazo_garantia", "type": "textarea", "label": "Prazo de Garantia"},
      {"name": "itens_cobertos", "type": "textarea", "label": "Itens Cobertos"},
      {"name": "itens_excluidos", "type": "textarea", "label": "Exclusões"},
      {"name": "condicoes_acionamento", "type": "textarea", "label": "Condições de Acionamento"},
      {"name": "observacoes", "type": "textarea", "label": "Observações"}
    ]'::jsonb,
    true
  ),
  (
    'Relatório Técnico',
    'Relatório técnico detalhado de serviço',
    'Técnico',
    'Relatório',
    '# RELATÓRIO TÉCNICO

**Nº:** {{numero_relatorio}}
**Data:** {{data_relatorio}}

## IDENTIFICAÇÃO
**Empresa:** {{empresa_nome}}
**Técnico Responsável:** {{tecnico_nome}}
**Registro Profissional:** {{tecnico_registro}}

## DADOS DO CLIENTE
**Cliente:** {{cliente_nome}}
**Local:** {{local_servico}}
**Telefone:** {{cliente_telefone}}

## OBJETIVO DO SERVIÇO
{{objetivo}}

## SITUAÇÃO ENCONTRADA
{{situacao_encontrada}}

## DIAGNÓSTICO TÉCNICO
{{diagnostico}}

## SERVIÇOS EXECUTADOS
{{servicos_executados}}

## MATERIAIS UTILIZADOS
{{materiais_utilizados}}

## TESTES REALIZADOS
{{testes_realizados}}

## RESULTADOS
{{resultados}}

## RECOMENDAÇÕES
{{recomendacoes}}

## OBSERVAÇÕES
{{observacoes}}

## FOTOS E EVIDÊNCIAS
{{fotos}}

## PRÓXIMAS AÇÕES
{{proximas_acoes}}

---

**Técnico Responsável:** {{tecnico_nome}}
**Registro:** {{tecnico_registro}}
**Data:** {{data_relatorio}}

**Assinatura:** _______________________________',
    '[
      {"name": "numero_relatorio", "type": "text", "label": "Número do Relatório"},
      {"name": "data_relatorio", "type": "date", "label": "Data"},
      {"name": "empresa_nome", "type": "text", "label": "Empresa"},
      {"name": "tecnico_nome", "type": "text", "label": "Nome do Técnico"},
      {"name": "tecnico_registro", "type": "text", "label": "Registro Profissional"},
      {"name": "cliente_nome", "type": "text", "label": "Cliente"},
      {"name": "local_servico", "type": "textarea", "label": "Local do Serviço"},
      {"name": "cliente_telefone", "type": "text", "label": "Telefone"},
      {"name": "objetivo", "type": "textarea", "label": "Objetivo"},
      {"name": "situacao_encontrada", "type": "textarea", "label": "Situação Encontrada"},
      {"name": "diagnostico", "type": "textarea", "label": "Diagnóstico"},
      {"name": "servicos_executados", "type": "textarea", "label": "Serviços Executados"},
      {"name": "materiais_utilizados", "type": "textarea", "label": "Materiais Utilizados"},
      {"name": "testes_realizados", "type": "textarea", "label": "Testes Realizados"},
      {"name": "resultados", "type": "textarea", "label": "Resultados"},
      {"name": "recomendacoes", "type": "textarea", "label": "Recomendações"},
      {"name": "observacoes", "type": "textarea", "label": "Observações"},
      {"name": "fotos", "type": "textarea", "label": "Fotos/Evidências"},
      {"name": "proximas_acoes", "type": "textarea", "label": "Próximas Ações"}
    ]'::jsonb,
    true
  ),
  (
    'Laudo Técnico',
    'Laudo técnico profissional com responsabilidade técnica',
    'Técnico',
    'Laudo',
    '# LAUDO TÉCNICO

**Nº:** {{numero_laudo}}
**Data de Emissão:** {{data_emissao}}

## RESPONSÁVEL TÉCNICO
**Nome:** {{responsavel_nome}}
**Registro Profissional:** {{responsavel_registro}}
**Especialidade:** {{responsavel_especialidade}}

## SOLICITANTE
**Nome/Razão Social:** {{solicitante_nome}}
**CPF/CNPJ:** {{solicitante_documento}}
**Endereço:** {{solicitante_endereco}}

## OBJETO DA AVALIAÇÃO
**Tipo:** {{objeto_tipo}}
**Localização:** {{objeto_localizacao}}
**Identificação:** {{objeto_identificacao}}

## METODOLOGIA
{{metodologia}}

## INSPEÇÃO VISUAL
{{inspecao_visual}}

## TESTES E ENSAIOS
{{testes_ensaios}}

## MEDIÇÕES REALIZADAS
{{medicoes}}

## ANÁLISE TÉCNICA
{{analise_tecnica}}

## CONCLUSÃO
{{conclusao}}

## RECOMENDAÇÕES TÉCNICAS
{{recomendacoes}}

## ANEXOS
{{anexos}}

## NORMAS E REFERÊNCIAS
{{normas_referencias}}

---

**RESPONSABILIDADE TÉCNICA**

Declaro, para os devidos fins, que este laudo técnico foi elaborado com base em normas técnicas vigentes e reflete fielmente as condições encontradas no momento da vistoria.

_________________________________
**{{responsavel_nome}}**
{{responsavel_registro}}
{{responsavel_especialidade}}

**Data:** {{data_emissao}}',
    '[
      {"name": "numero_laudo", "type": "text", "label": "Número do Laudo"},
      {"name": "data_emissao", "type": "date", "label": "Data de Emissão"},
      {"name": "responsavel_nome", "type": "text", "label": "Nome do Responsável"},
      {"name": "responsavel_registro", "type": "text", "label": "Registro (CREA/CRT)"},
      {"name": "responsavel_especialidade", "type": "text", "label": "Especialidade"},
      {"name": "solicitante_nome", "type": "text", "label": "Nome do Solicitante"},
      {"name": "solicitante_documento", "type": "text", "label": "CPF/CNPJ"},
      {"name": "solicitante_endereco", "type": "textarea", "label": "Endereço"},
      {"name": "objeto_tipo", "type": "text", "label": "Tipo do Objeto"},
      {"name": "objeto_localizacao", "type": "textarea", "label": "Localização"},
      {"name": "objeto_identificacao", "type": "text", "label": "Identificação"},
      {"name": "metodologia", "type": "textarea", "label": "Metodologia"},
      {"name": "inspecao_visual", "type": "textarea", "label": "Inspeção Visual"},
      {"name": "testes_ensaios", "type": "textarea", "label": "Testes e Ensaios"},
      {"name": "medicoes", "type": "textarea", "label": "Medições"},
      {"name": "analise_tecnica", "type": "textarea", "label": "Análise Técnica"},
      {"name": "conclusao", "type": "textarea", "label": "Conclusão"},
      {"name": "recomendacoes", "type": "textarea", "label": "Recomendações"},
      {"name": "anexos", "type": "textarea", "label": "Anexos"},
      {"name": "normas_referencias", "type": "textarea", "label": "Normas e Referências"}
    ]'::jsonb,
    true
  ),
  (
    'Check-list de Manutenção',
    'Check-list padrão para manutenção preventiva',
    'Técnico',
    'Checklist',
    '# CHECK-LIST DE MANUTENÇÃO

**Nº:** {{numero_checklist}}
**Data:** {{data_checklist}}
**Tipo de Manutenção:** {{tipo_manutencao}}

## DADOS DO EQUIPAMENTO
**Equipamento:** {{equipamento_nome}}
**Modelo:** {{equipamento_modelo}}
**Nº de Série:** {{equipamento_serie}}
**Local:** {{equipamento_local}}

## RESPONSÁVEL PELA EXECUÇÃO
**Técnico:** {{tecnico_nome}}
**Matrícula:** {{tecnico_matricula}}

## ITENS VERIFICADOS

### Sistema Elétrico
- [ ] Tensão de alimentação: {{item_tensao}}
- [ ] Corrente de operação: {{item_corrente}}
- [ ] Conexões elétricas: {{item_conexoes}}
- [ ] Aterramento: {{item_aterramento}}

### Sistema Mecânico
- [ ] Rolamentos: {{item_rolamentos}}
- [ ] Correias/Polias: {{item_correias}}
- [ ] Fixações: {{item_fixacoes}}
- [ ] Vibrações: {{item_vibracoes}}

### Limpeza e Higienização
- [ ] Filtros: {{item_filtros}}
- [ ] Serpentinas: {{item_serpentinas}}
- [ ] Drenos: {{item_drenos}}
- [ ] Gabinete: {{item_gabinete}}

### Funcionalidade
- [ ] Funcionamento geral: {{item_funcionamento}}
- [ ] Ruídos anormais: {{item_ruidos}}
- [ ] Temperatura de operação: {{item_temperatura}}
- [ ] Controles: {{item_controles}}

## PEÇAS SUBSTITUÍDAS
{{pecas_substituidas}}

## OBSERVAÇÕES
{{observacoes}}

## PRÓXIMA MANUTENÇÃO
**Data prevista:** {{proxima_manutencao}}
**Tipo:** {{tipo_proxima}}

---

**Executado por:** {{tecnico_nome}}
**Visto do Supervisor:** _______________________________
**Data:** {{data_checklist}}',
    '[
      {"name": "numero_checklist", "type": "text", "label": "Número"},
      {"name": "data_checklist", "type": "date", "label": "Data"},
      {"name": "tipo_manutencao", "type": "text", "label": "Tipo (Preventiva/Corretiva)"},
      {"name": "equipamento_nome", "type": "text", "label": "Nome do Equipamento"},
      {"name": "equipamento_modelo", "type": "text", "label": "Modelo"},
      {"name": "equipamento_serie", "type": "text", "label": "Nº de Série"},
      {"name": "equipamento_local", "type": "text", "label": "Local"},
      {"name": "tecnico_nome", "type": "text", "label": "Nome do Técnico"},
      {"name": "tecnico_matricula", "type": "text", "label": "Matrícula"},
      {"name": "item_tensao", "type": "text", "label": "Tensão (OK/NOK)"},
      {"name": "item_corrente", "type": "text", "label": "Corrente (OK/NOK)"},
      {"name": "item_conexoes", "type": "text", "label": "Conexões (OK/NOK)"},
      {"name": "item_aterramento", "type": "text", "label": "Aterramento (OK/NOK)"},
      {"name": "item_rolamentos", "type": "text", "label": "Rolamentos (OK/NOK)"},
      {"name": "item_correias", "type": "text", "label": "Correias (OK/NOK)"},
      {"name": "item_fixacoes", "type": "text", "label": "Fixações (OK/NOK)"},
      {"name": "item_vibracoes", "type": "text", "label": "Vibrações (OK/NOK)"},
      {"name": "item_filtros", "type": "text", "label": "Filtros (OK/NOK)"},
      {"name": "item_serpentinas", "type": "text", "label": "Serpentinas (OK/NOK)"},
      {"name": "item_drenos", "type": "text", "label": "Drenos (OK/NOK)"},
      {"name": "item_gabinete", "type": "text", "label": "Gabinete (OK/NOK)"},
      {"name": "item_funcionamento", "type": "text", "label": "Funcionamento (OK/NOK)"},
      {"name": "item_ruidos", "type": "text", "label": "Ruídos (OK/NOK)"},
      {"name": "item_temperatura", "type": "text", "label": "Temperatura (OK/NOK)"},
      {"name": "item_controles", "type": "text", "label": "Controles (OK/NOK)"},
      {"name": "pecas_substituidas", "type": "textarea", "label": "Peças Substituídas"},
      {"name": "observacoes", "type": "textarea", "label": "Observações"},
      {"name": "proxima_manutencao", "type": "date", "label": "Próxima Manutenção"},
      {"name": "tipo_proxima", "type": "text", "label": "Tipo Próxima"}
    ]'::jsonb,
    true
  )
  ON CONFLICT (id) DO NOTHING;

END $$;

-- Criar tabela para documentos gerados
CREATE TABLE IF NOT EXISTS generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
  document_number TEXT NOT NULL,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  data JSONB NOT NULL,
  pdf_url TEXT,
  signed BOOLEAN DEFAULT false,
  signature_data JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_number, document_type)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_generated_documents_customer ON generated_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_template ON generated_documents(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_type ON generated_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_generated_documents_status ON generated_documents(status);
CREATE INDEX IF NOT EXISTS idx_generated_documents_created_at ON generated_documents(created_at DESC);

-- RLS
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to generated_documents"
  ON generated_documents FOR ALL
  USING (true)
  WITH CHECK (true);

-- Configurações da empresa para documentos
CREATE TABLE IF NOT EXISTS company_document_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE DEFAULT gen_random_uuid(),
  logo_url TEXT,
  primary_color TEXT DEFAULT '#2563eb',
  secondary_color TEXT DEFAULT '#1e40af',
  
  -- Dados da empresa
  company_name TEXT NOT NULL,
  company_cnpj TEXT,
  company_address TEXT,
  company_city TEXT,
  company_state TEXT,
  company_zip TEXT,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  
  -- Dados bancários
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_pix TEXT,
  
  -- Informações técnicas
  technical_manager TEXT,
  technical_register TEXT,
  technical_specialties TEXT[],
  
  -- Certificações
  certifications TEXT[],
  licenses TEXT[],
  
  -- Rodapé padrão
  default_footer TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE company_document_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to company_document_config"
  ON company_document_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- Inserir configuração padrão se não existir
INSERT INTO company_document_config (
  company_name,
  company_cnpj,
  company_address,
  company_city,
  company_state,
  company_phone,
  company_email,
  default_footer
)
SELECT 
  'Giartech Soluções',
  '00.000.000/0000-00',
  'Rua Exemplo, 123',
  'São Paulo',
  'SP',
  '(11) 9999-9999',
  'contato@giartech.com.br',
  'Este documento foi gerado automaticamente pelo sistema Giartech.'
WHERE NOT EXISTS (SELECT 1 FROM company_document_config LIMIT 1);

-- Função para gerar número sequencial de documento
CREATE OR REPLACE FUNCTION generate_document_number(doc_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
  formatted_num TEXT;
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(
      SPLIT_PART(document_number, '-', 1) AS INTEGER
    )
  ), 0) + 1
  INTO next_num
  FROM generated_documents
  WHERE document_type = doc_type
  AND document_number LIKE '%' || year_str;
  
  formatted_num := LPAD(next_num::TEXT, 6, '0');
  
  RETURN formatted_num || '-' || year_str || '-' || UPPER(SUBSTRING(doc_type, 1, 3));
END;
$$;

-- Grants
GRANT ALL ON generated_documents TO anon, authenticated;
GRANT ALL ON company_document_config TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generate_document_number TO anon, authenticated;
