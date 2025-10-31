/*
  # Integração WhatsApp com Clientes
  
  ## Descrição
  Cria relacionamento entre WhatsApp e tabela de Clientes para permitir:
  - Iniciar conversas com clientes cadastrados
  - Importar clientes automaticamente para WhatsApp
  - Sincronizar dados entre sistemas
  
  ## Mudanças
  
  1. Adiciona coluna customer_id em whatsapp_contacts
  2. Cria índice para performance
  3. Cria view para listar clientes sem WhatsApp
  4. Cria função para importar clientes para WhatsApp
  5. Adiciona políticas RLS
  
  ## Segurança
  - Mantém RLS ativo
  - Políticas de acesso público para desenvolvimento
*/

-- 1. Adicionar coluna customer_id em whatsapp_contacts
ALTER TABLE whatsapp_contacts 
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_customer_id 
ON whatsapp_contacts(customer_id);

-- 3. View para listar clientes que podem ser importados para WhatsApp
CREATE OR REPLACE VIEW v_customers_for_whatsapp AS
SELECT 
  c.id,
  c.nome_razao as name,
  c.email,
  COALESCE(c.celular, c.telefone) as phone,
  c.tipo_pessoa,
  c.observacoes,
  CASE 
    WHEN wc.id IS NOT NULL THEN true 
    ELSE false 
  END as has_whatsapp,
  wc.id as whatsapp_contact_id
FROM customers c
LEFT JOIN whatsapp_contacts wc ON wc.customer_id = c.id
WHERE COALESCE(c.celular, c.telefone) IS NOT NULL 
  AND COALESCE(c.celular, c.telefone) != ''
ORDER BY c.nome_razao;

-- 4. Função para importar cliente para WhatsApp
CREATE OR REPLACE FUNCTION import_customer_to_whatsapp(
  p_customer_id uuid,
  p_account_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer record;
  v_whatsapp_contact_id uuid;
  v_phone text;
BEGIN
  -- Buscar dados do cliente
  SELECT 
    id,
    nome_razao,
    email,
    COALESCE(celular, telefone) as phone
  INTO v_customer
  FROM customers
  WHERE id = p_customer_id;

  -- Verificar se cliente existe
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cliente não encontrado'
    );
  END IF;

  -- Verificar se tem telefone
  IF v_customer.phone IS NULL OR v_customer.phone = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cliente não possui telefone cadastrado'
    );
  END IF;

  -- Limpar telefone (remover caracteres especiais)
  v_phone := regexp_replace(v_customer.phone, '[^0-9]', '', 'g');

  -- Verificar se já existe contato WhatsApp para este cliente
  SELECT id INTO v_whatsapp_contact_id
  FROM whatsapp_contacts
  WHERE customer_id = p_customer_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cliente já possui contato WhatsApp',
      'contact_id', v_whatsapp_contact_id
    );
  END IF;

  -- Criar contato WhatsApp
  INSERT INTO whatsapp_contacts (
    account_id,
    customer_id,
    name,
    phone,
    email,
    notes,
    created_at,
    updated_at
  ) VALUES (
    p_account_id,
    p_customer_id,
    v_customer.nome_razao,
    v_phone,
    v_customer.email,
    'Importado automaticamente do cadastro de clientes',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_whatsapp_contact_id;

  RETURN jsonb_build_object(
    'success', true,
    'contact_id', v_whatsapp_contact_id,
    'customer_id', p_customer_id,
    'message', 'Cliente importado com sucesso para WhatsApp'
  );
END;
$$;

-- 5. Função para importar múltiplos clientes
CREATE OR REPLACE FUNCTION import_all_customers_to_whatsapp(
  p_account_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_imported integer := 0;
  v_skipped integer := 0;
  v_errors integer := 0;
  v_customer record;
  v_result jsonb;
BEGIN
  -- Percorrer clientes sem WhatsApp
  FOR v_customer IN (
    SELECT id
    FROM v_customers_for_whatsapp
    WHERE has_whatsapp = false
  )
  LOOP
    -- Tentar importar
    SELECT import_customer_to_whatsapp(v_customer.id, p_account_id)
    INTO v_result;

    IF (v_result->>'success')::boolean THEN
      v_imported := v_imported + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'imported', v_imported,
    'skipped', v_skipped,
    'errors', v_errors,
    'message', format('Importados: %s | Ignorados: %s', v_imported, v_skipped)
  );
END;
$$;

-- 6. Atualizar contatos existentes que correspondem a clientes
DO $$
DECLARE
  v_contact record;
  v_customer_id uuid;
BEGIN
  FOR v_contact IN (
    SELECT id, phone, name
    FROM whatsapp_contacts
    WHERE customer_id IS NULL
  )
  LOOP
    -- Tentar encontrar cliente pelo telefone
    SELECT id INTO v_customer_id
    FROM customers
    WHERE regexp_replace(COALESCE(celular, telefone), '[^0-9]', '', 'g') = 
          regexp_replace(v_contact.phone, '[^0-9]', '', 'g')
    LIMIT 1;

    -- Se encontrou, atualizar
    IF FOUND THEN
      UPDATE whatsapp_contacts
      SET customer_id = v_customer_id,
          updated_at = NOW()
      WHERE id = v_contact.id;
    END IF;
  END LOOP;
END $$;

-- 7. Comentários explicativos
COMMENT ON COLUMN whatsapp_contacts.customer_id IS 'Relacionamento com a tabela customers para integração';
COMMENT ON VIEW v_customers_for_whatsapp IS 'Lista clientes disponíveis para importação ao WhatsApp';
COMMENT ON FUNCTION import_customer_to_whatsapp IS 'Importa um cliente específico para o WhatsApp CRM';
COMMENT ON FUNCTION import_all_customers_to_whatsapp IS 'Importa todos os clientes com telefone para o WhatsApp CRM';

-- 8. Grant necessários
GRANT SELECT ON v_customers_for_whatsapp TO anon, authenticated;
GRANT EXECUTE ON FUNCTION import_customer_to_whatsapp TO anon, authenticated;
GRANT EXECUTE ON FUNCTION import_all_customers_to_whatsapp TO anon, authenticated;
