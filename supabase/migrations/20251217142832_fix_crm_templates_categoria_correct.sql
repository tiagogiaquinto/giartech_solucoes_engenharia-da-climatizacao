/*
  # Corrigir Templates de Mensagens com Categorias Corretas

  1. Alterações
    - Remover constraint de categoria
    - Adicionar colunas pipeline_tipo e tipo
    - Inserir templates com categorias válidas

  2. Security
    - Manter policies existentes
*/

-- Remover constraint antigo
ALTER TABLE crm_message_templates DROP CONSTRAINT IF EXISTS crm_message_templates_categoria_check;

-- Tornar categoria nullable
ALTER TABLE crm_message_templates ALTER COLUMN categoria DROP NOT NULL;

-- Adicionar novas colunas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_message_templates' AND column_name = 'pipeline_tipo'
  ) THEN
    ALTER TABLE crm_message_templates 
    ADD COLUMN pipeline_tipo text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_message_templates' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE crm_message_templates 
    ADD COLUMN tipo text;
  END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_crm_message_templates_tipo ON crm_message_templates(tipo);
CREATE INDEX IF NOT EXISTS idx_crm_message_templates_pipeline ON crm_message_templates(pipeline_tipo);

-- Limpar e inserir templates
TRUNCATE TABLE crm_message_templates CASCADE;

INSERT INTO crm_message_templates (tipo, categoria, nome, mensagem, canal, pipeline_tipo, variaveis_disponiveis, ordem, is_ativo) VALUES
('whatsapp_inicial_venda', 'primeiro_contato', 'WhatsApp - Primeiro Contato Venda', 
'Olá {cliente_nome}! 👋

Aqui é {vendedor_nome} da Giartech. Tudo bem?

Vi que você tem interesse em {oportunidade_titulo}.

Posso te ajudar com isso? Quando seria um bom momento para conversarmos? 😊', 
'whatsapp', 'vendas', '["cliente_nome", "vendedor_nome", "oportunidade_titulo", "oportunidade_valor"]'::jsonb, 1, true),

('whatsapp_followup_venda', 'followup', 'WhatsApp - Acompanhamento de Venda',
'Oi {cliente_nome}!

Passou um tempinho desde nosso último contato sobre {oportunidade_titulo}.

Ainda tem interesse? Posso te mandar mais informações ou tirar alguma dúvida? 🙂',
'whatsapp', 'vendas', '["cliente_nome", "oportunidade_titulo", "dias_no_stage"]'::jsonb, 2, true),

('whatsapp_proposta', 'proposta_enviada', 'WhatsApp - Envio de Proposta',
'Olá {cliente_nome}! 😊

Conforme conversamos, segue nossa proposta para {oportunidade_titulo}.

Valor: {oportunidade_valor}

Dá uma olhada e me fala o que achou. Fico à disposição para qualquer dúvida!',
'whatsapp', 'vendas', '["cliente_nome", "oportunidade_titulo", "oportunidade_valor", "vendedor_nome"]'::jsonb, 3, true),

('whatsapp_boas_vindas', 'venda_ganha', 'WhatsApp - Boas-vindas Pós-Venda',
'Olá {cliente_nome}! 🎉

Seja muito bem-vindo(a) à família Giartech!

Estou aqui para garantir que você tenha a melhor experiência conosco.

Qualquer dúvida ou necessidade, é só chamar! 😊

{vendedor_nome}',
'whatsapp', 'pos_venda', '["cliente_nome", "vendedor_nome", "data_hoje"]'::jsonb, 1, true),

('whatsapp_checkin_pos_venda', 'pos_venda', 'WhatsApp - Verificação Pós-Venda',
'Oi {cliente_nome}! 👋

Tudo certo por aí? Como está sendo sua experiência com nossos serviços?

Estou sempre disponível se precisar de algo!

Abraço,
{vendedor_nome}',
'whatsapp', 'pos_venda', '["cliente_nome", "vendedor_nome", "dias_no_stage"]'::jsonb, 2, true),

('whatsapp_upsell', 'upsell', 'WhatsApp - Oportunidade de Melhoria',
'Olá {cliente_nome}! 😊

Vi que você está usando nossos serviços há {dias_no_stage} dias e está indo super bem!

Tenho uma novidade que pode te interessar para melhorar ainda mais seus resultados. Podemos conversar?',
'whatsapp', 'pos_venda', '["cliente_nome", "vendedor_nome", "dias_no_stage"]'::jsonb, 3, true),

('whatsapp_retencao_urgente', 'churn_risk', 'WhatsApp - Retenção Urgente',
'Oi {cliente_nome},

Percebi que faz um tempo que não conversamos.

Está tudo bem? Posso te ajudar com alguma coisa?

Sua satisfação é muito importante para nós! ❤️

{vendedor_nome}',
'whatsapp', 'pos_venda', '["cliente_nome", "vendedor_nome", "dias_no_stage"]'::jsonb, 4, true),

('email_proposta', 'proposta_enviada', 'Email - Envio de Proposta Comercial',
'Prezado(a) {cliente_nome},

Conforme nossa conversa, segue em anexo nossa proposta comercial para {oportunidade_titulo}.

Valor Total: {oportunidade_valor}

Destacamos:
• Melhor relação custo-benefício
• Suporte técnico completo
• Garantia estendida

Fico à disposição para esclarecer qualquer dúvida.

Atenciosamente,
{vendedor_nome}
Giartech Soluções',
'email', 'vendas', '["cliente_nome", "cliente_empresa", "vendedor_nome", "oportunidade_titulo", "oportunidade_valor"]'::jsonb, 1, true);

-- Função para processar templates
CREATE OR REPLACE FUNCTION process_message_template(
  p_template_id uuid,
  p_variables jsonb
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template text;
  v_result text;
  v_key text;
  v_value text;
BEGIN
  SELECT mensagem INTO v_template
  FROM crm_message_templates
  WHERE id = p_template_id AND is_ativo = true;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template não encontrado ou inativo';
  END IF;

  v_result := v_template;

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_variables)
  LOOP
    v_result := replace(v_result, '{' || v_key || '}', COALESCE(v_value, ''));
  END LOOP;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION process_message_template TO authenticated;

COMMENT ON FUNCTION process_message_template IS 'Processa template de mensagem substituindo variáveis por valores reais';
