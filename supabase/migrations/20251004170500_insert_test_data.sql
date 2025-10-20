/*
  # Inserir Dados de Teste

  ## Dados Inseridos

  1. Usuário Admin
     - Email: admin@giartech.com
     - Nome: Admin GiarTech
     - Role: admin

  2. Clientes de exemplo
     - Cliente PF: João Silva
     - Cliente PJ: Empresa ABC Ltda

  3. Ordem de serviço de exemplo

  Nota: O usuário precisa ser criado primeiro no Supabase Auth com senha: admin123
*/

-- Inserir usuário admin (assumindo que o auth.users já existe com este email)
-- O ID será gerado automaticamente
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Tentar buscar o ID do usuário autenticado com o email admin@giartech.com
  -- Se não existir, criar um registro placeholder
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@giartech.com' LIMIT 1;

  IF admin_user_id IS NULL THEN
    -- Criar um UUID fixo para o admin (para testes)
    admin_user_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
  END IF;

  -- Inserir ou atualizar o perfil do usuário admin
  INSERT INTO users (id, email, name, role, status, avatar, phone)
  VALUES (
    admin_user_id,
    'admin@giartech.com',
    'Admin GiarTech',
    'admin',
    'active',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    '(11) 99999-0000'
  )
  ON CONFLICT (email) DO UPDATE
  SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status,
    avatar = EXCLUDED.avatar,
    phone = EXCLUDED.phone;
END $$;

-- Inserir clientes de exemplo
INSERT INTO clients (name, email, phone, address, client_type, document) VALUES
('João Silva', 'joao@email.com', '(11) 99999-1234', 'Rua das Flores, 123 - São Paulo, SP', 'PF', '123.456.789-00'),
('Empresa ABC Ltda', 'contato@empresaabc.com', '(11) 98888-5678', 'Av. Paulista, 1000 - São Paulo, SP', 'PJ', '12.345.678/0001-90')
ON CONFLICT DO NOTHING;

-- Inserir catálogo de serviços
INSERT INTO service_catalog (name, description, category, estimated_duration, base_price, is_active) VALUES
('Instalação de Ar Condicionado Split', 'Instalação completa de ar condicionado split incluindo suporte, tubulação e testes', 'Instalação', 180, 350.00, true),
('Manutenção Preventiva', 'Limpeza de filtros, verificação de gás e limpeza geral do equipamento', 'Manutenção', 90, 180.00, true),
('Reparo de Vazamento', 'Identificação e reparo de vazamentos no sistema de refrigeração', 'Reparo', 120, 250.00, true)
ON CONFLICT DO NOTHING;

-- Inserir itens de estoque
INSERT INTO inventory_items (name, category, quantity, min_stock, price, supplier, sku, location, description) VALUES
('Ar Condicionado Split 12.000 BTUs', 'Equipamentos', 5, 2, 1800.00, 'Fornecedor A', 'AC-12000-220', 'Prateleira A3', 'Ar condicionado split 12.000 BTUs, 220V'),
('Suporte para Ar Condicionado', 'Acessórios', 15, 5, 50.00, 'Fornecedor B', 'SUP-AC-001', 'Prateleira B1', 'Suporte universal para unidade externa'),
('Tubulação de Cobre 3m', 'Materiais', 8, 3, 80.00, 'Fornecedor C', 'TUB-CU-3M', 'Prateleira C2', 'Tubulação de cobre 1/4" x 3/8" - 3 metros')
ON CONFLICT DO NOTHING;