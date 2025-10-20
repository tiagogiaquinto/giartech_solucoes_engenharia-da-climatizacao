/*
  # Criar sistema de templates de contrato padrão

  1. Nova Tabela
    - `contract_templates` - Armazena templates padrão para contratos de OS
    - Campos: texto do contrato, cláusulas, termos de garantia, condições de pagamento, dados bancários
    - Sistema de empresa (um template por empresa/usuário)

  2. Funcionalidades
    - Salvar template padrão
    - Carregar template ao criar nova OS
    - Atualizar template existente

  3. Segurança
    - RLS habilitado
    - Usuários podem gerenciar seus próprios templates
*/

-- Criar tabela de templates de contrato
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  name TEXT NOT NULL DEFAULT 'Padrão',
  description TEXT,
  is_default BOOLEAN DEFAULT true,

  -- Dados do contrato
  contract_text TEXT,
  contract_clauses TEXT,
  warranty_terms TEXT,
  payment_conditions TEXT,
  bank_details TEXT,

  -- Metadados
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_contract_templates_created_by ON contract_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_default ON contract_templates(is_default);

-- Habilitar RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuários podem visualizar próprios templates"
  ON contract_templates FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Usuários podem criar próprios templates"
  ON contract_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Usuários podem atualizar próprios templates"
  ON contract_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL)
  WITH CHECK (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "Usuários podem deletar próprios templates"
  ON contract_templates FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR created_by IS NULL);

-- Políticas para acesso anônimo (desenvolvimento)
CREATE POLICY "Acesso anônimo para leitura de templates"
  ON contract_templates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Acesso anônimo para criação de templates"
  ON contract_templates FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Acesso anônimo para atualização de templates"
  ON contract_templates FOR UPDATE
  TO anon
  USING (true);

CREATE POLICY "Acesso anônimo para exclusão de templates"
  ON contract_templates FOR DELETE
  TO anon
  USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_contract_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_templates_updated_at();

-- Inserir template padrão exemplo
INSERT INTO contract_templates (
  name,
  description,
  is_default,
  contract_text,
  contract_clauses,
  warranty_terms,
  payment_conditions,
  bank_details
) VALUES (
  'Contrato Padrão',
  'Template padrão para ordens de serviço',
  true,
  'CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento particular, de um lado a CONTRATANTE e de outro lado a CONTRATADA, têm entre si justo e contratado os serviços conforme especificações abaixo:',

  '1. DO OBJETO
O presente contrato tem como objeto a prestação de serviços conforme descrição na Ordem de Serviço.

2. DO PRAZO
Os serviços serão executados conforme prazo estabelecido na Ordem de Serviço.

3. DAS OBRIGAÇÕES
A CONTRATADA se compromete a executar os serviços com qualidade e dentro do prazo estabelecido.

4. DA RESCISÃO
O contrato poderá ser rescindido mediante aviso prévio de 30 dias.',

  'GARANTIA: 90 (noventa) dias para serviços executados, a contar da data de conclusão.

A garantia cobre defeitos de execução e materiais utilizados pela contratada.

Não estão cobertos pela garantia:
- Danos causados por uso inadequado
- Desgaste natural
- Intervenções de terceiros',

  'CONDIÇÕES DE PAGAMENTO:

- Pagamento em até 30 dias após conclusão do serviço
- Formas aceitas: Dinheiro, PIX, Transferência Bancária, Cartão
- Nota Fiscal será emitida na conclusão do serviço',

  'DADOS BANCÁRIOS PARA PAGAMENTO:

Banco: [Nome do Banco]
Agência: [0000]
Conta Corrente: [00000-0]
PIX: [Chave PIX]
CNPJ: [00.000.000/0001-00]'
)
ON CONFLICT DO NOTHING;

-- Comentários
COMMENT ON TABLE contract_templates IS 'Armazena templates padrão para contratos de ordens de serviço';
COMMENT ON COLUMN contract_templates.is_default IS 'Indica se este é o template padrão a ser usado';
COMMENT ON COLUMN contract_templates.contract_text IS 'Texto principal do contrato';
COMMENT ON COLUMN contract_templates.contract_clauses IS 'Cláusulas contratuais';
COMMENT ON COLUMN contract_templates.warranty_terms IS 'Termos de garantia';
COMMENT ON COLUMN contract_templates.payment_conditions IS 'Condições de pagamento';
COMMENT ON COLUMN contract_templates.bank_details IS 'Dados bancários para pagamento';
