/*
  # Adicionar campos para clientes
  
  1. Campos Adicionados
    - endereco: endereço completo
    - cidade: cidade
    - estado: estado (UF)
    - cep: CEP
    - bairro: bairro
    - numero: número
    - complemento: complemento
    - tipo_cliente: tipo do cliente (VIP, Regular, Lead)
    - limite_credito: limite de crédito
    - observacoes_comerciais: observações comerciais
*/

-- Adicionar campos se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'endereco') THEN
    ALTER TABLE customers ADD COLUMN endereco text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'cidade') THEN
    ALTER TABLE customers ADD COLUMN cidade text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'estado') THEN
    ALTER TABLE customers ADD COLUMN estado text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'cep') THEN
    ALTER TABLE customers ADD COLUMN cep text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'bairro') THEN
    ALTER TABLE customers ADD COLUMN bairro text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'numero') THEN
    ALTER TABLE customers ADD COLUMN numero text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'complemento') THEN
    ALTER TABLE customers ADD COLUMN complemento text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'tipo_cliente') THEN
    ALTER TABLE customers ADD COLUMN tipo_cliente text DEFAULT 'Regular';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'limite_credito') THEN
    ALTER TABLE customers ADD COLUMN limite_credito numeric(12,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'observacoes_comerciais') THEN
    ALTER TABLE customers ADD COLUMN observacoes_comerciais text;
  END IF;
END $$;