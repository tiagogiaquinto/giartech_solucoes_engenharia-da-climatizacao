/*
  # Sistema de Documentação Departamental

  1. Nova Tabela: `documents`
    - `id` (uuid, primary key)
    - `title` (text) - Título do documento
    - `description` (text) - Descrição do documento
    - `content` (text) - Conteúdo do documento (suporta markdown/html)
    - `department` (text) - Departamento responsável
    - `category` (text) - Categoria do documento
    - `template_type` (text) - Tipo de template usado
    - `status` (text) - Status: draft, review, approved, archived
    - `version` (integer) - Número da versão
    - `created_by` (uuid) - Quem criou
    - `approved_by` (uuid) - Quem aprovou
    - `approved_at` (timestamptz) - Data de aprovação
    - `tags` (text[]) - Tags para busca
    - `metadata` (jsonb) - Metadados adicionais
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Nova Tabela: `document_versions`
    - Histórico de versões dos documentos

  3. Nova Tabela: `document_templates`
    - Templates pré-definidos por departamento

  4. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para leitura e escrita
*/

-- Criar enum para status de documentos
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('draft', 'review', 'approved', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela principal de documentos
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  content text NOT NULL DEFAULT '',
  department text NOT NULL,
  category text,
  template_type text,
  status text NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  tags text[] DEFAULT ARRAY[]::text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de versões de documentos
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  change_description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, version)
);

-- Tabela de templates
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  department text NOT NULL,
  category text,
  content_template text NOT NULL,
  fields jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_by ON documents(created_by);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_department ON document_templates(department);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_timestamp
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- Trigger para criar versão ao atualizar documento
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO document_versions (
      document_id,
      version,
      title,
      content,
      changed_by,
      change_description
    ) VALUES (
      NEW.id,
      NEW.version,
      NEW.title,
      NEW.content,
      NEW.created_by,
      'Atualização automática'
    );
    NEW.version = NEW.version + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_version_on_update
  BEFORE UPDATE ON documents
  FOR EACH ROW
  WHEN (OLD.content IS DISTINCT FROM NEW.content)
  EXECUTE FUNCTION create_document_version();

-- Habilitar RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para documents
CREATE POLICY "Permitir leitura de documentos para todos autenticados"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir leitura de documentos para anônimos"
  ON documents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Permitir criação de documentos"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir criação de documentos anônimos"
  ON documents FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de documentos"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de documentos anônimos"
  ON documents FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de documentos"
  ON documents FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para document_versions
CREATE POLICY "Permitir leitura de versões para todos"
  ON document_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir leitura de versões anônimos"
  ON document_versions FOR SELECT
  TO anon
  USING (true);

-- Políticas para document_templates
CREATE POLICY "Permitir leitura de templates para todos"
  ON document_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Permitir leitura de templates anônimos"
  ON document_templates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Permitir criação de templates"
  ON document_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de templates"
  ON document_templates FOR UPDATE
  TO authenticated
  USING (true);

-- Inserir templates padrão
INSERT INTO document_templates (name, description, department, category, content_template, fields) VALUES
('Relatório Operacional', 'Template para relatórios operacionais diários', 'Operacional', 'Relatório', 
'# Relatório Operacional - {{data}}

## Resumo Executivo
{{resumo}}

## Atividades Realizadas
{{atividades}}

## Indicadores
{{indicadores}}

## Problemas Identificados
{{problemas}}

## Ações Corretivas
{{acoes}}

## Conclusão
{{conclusao}}', 
'[{"name":"data","label":"Data","type":"date"},{"name":"resumo","label":"Resumo Executivo","type":"textarea"},{"name":"atividades","label":"Atividades","type":"textarea"},{"name":"indicadores","label":"Indicadores","type":"textarea"},{"name":"problemas","label":"Problemas","type":"textarea"},{"name":"acoes","label":"Ações","type":"textarea"},{"name":"conclusao","label":"Conclusão","type":"textarea"}]'::jsonb
),
('Relatório Financeiro', 'Template para relatórios financeiros mensais', 'Financeiro', 'Relatório',
'# Relatório Financeiro - {{periodo}}

## Resumo Financeiro
{{resumo}}

## Receitas
{{receitas}}

## Despesas
{{despesas}}

## Fluxo de Caixa
{{fluxo_caixa}}

## Análise de Resultados
{{analise}}

## Projeções
{{projecoes}}',
'[{"name":"periodo","label":"Período","type":"text"},{"name":"resumo","label":"Resumo","type":"textarea"},{"name":"receitas","label":"Receitas","type":"textarea"},{"name":"despesas","label":"Despesas","type":"textarea"},{"name":"fluxo_caixa","label":"Fluxo de Caixa","type":"textarea"},{"name":"analise","label":"Análise","type":"textarea"},{"name":"projecoes","label":"Projeções","type":"textarea"}]'::jsonb
),
('Procedimento Operacional', 'Template para procedimentos operacionais padrão', 'Operacional', 'Procedimento',
'# {{titulo}}

## Objetivo
{{objetivo}}

## Escopo
{{escopo}}

## Responsabilidades
{{responsabilidades}}

## Procedimento
{{procedimento}}

## Segurança
{{seguranca}}

## Controle de Qualidade
{{controle}}',
'[{"name":"titulo","label":"Título","type":"text"},{"name":"objetivo","label":"Objetivo","type":"textarea"},{"name":"escopo","label":"Escopo","type":"textarea"},{"name":"responsabilidades","label":"Responsabilidades","type":"textarea"},{"name":"procedimento","label":"Procedimento","type":"textarea"},{"name":"seguranca","label":"Segurança","type":"textarea"},{"name":"controle","label":"Controle","type":"textarea"}]'::jsonb
),
('Ata de Reunião', 'Template para atas de reunião', 'Geral', 'Ata',
'# Ata de Reunião - {{data}}

## Participantes
{{participantes}}

## Pauta
{{pauta}}

## Discussões
{{discussoes}}

## Decisões
{{decisoes}}

## Ações e Responsáveis
{{acoes}}

## Próxima Reunião
{{proxima}}',
'[{"name":"data","label":"Data","type":"date"},{"name":"participantes","label":"Participantes","type":"textarea"},{"name":"pauta","label":"Pauta","type":"textarea"},{"name":"discussoes","label":"Discussões","type":"textarea"},{"name":"decisoes","label":"Decisões","type":"textarea"},{"name":"acoes","label":"Ações","type":"textarea"},{"name":"proxima","label":"Próxima Reunião","type":"text"}]'::jsonb
),
('Proposta Comercial', 'Template para propostas comerciais', 'Comercial', 'Proposta',
'# Proposta Comercial

## Cliente
{{cliente}}

## Projeto
{{projeto}}

## Escopo de Trabalho
{{escopo}}

## Cronograma
{{cronograma}}

## Investimento
{{investimento}}

## Condições Comerciais
{{condicoes}}

## Validade
{{validade}}',
'[{"name":"cliente","label":"Cliente","type":"text"},{"name":"projeto","label":"Projeto","type":"text"},{"name":"escopo","label":"Escopo","type":"textarea"},{"name":"cronograma","label":"Cronograma","type":"textarea"},{"name":"investimento","label":"Investimento","type":"textarea"},{"name":"condicoes","label":"Condições","type":"textarea"},{"name":"validade","label":"Validade","type":"text"}]'::jsonb
)
ON CONFLICT DO NOTHING;
