/*
  # Inserir Dados de Teste

  ## Dados Inseridos

  1. Usuário Admin (perfil na tabela users)
  2. Clientes de exemplo
  3. Catálogo de serviços
  4. Itens de estoque
*/

DO $$
DECLARE
  admin_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;
BEGIN
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

INSERT INTO clients (name, email, phone, address, client_type, document) VALUES
('João Silva', 'joao@email.com', '(11) 99999-1234', 'Rua das Flores, 123 - São Paulo, SP', 'PF', '123.456.789-00'),
('Empresa ABC Ltda', 'contato@empresaabc.com', '(11) 98888-5678', 'Av. Paulista, 1000 - São Paulo, SP', 'PJ', '12.345.678/0001-90'),
('Maria Santos', 'maria@email.com', '(11) 97777-9012', 'Rua das Palmeiras, 456 - São Paulo, SP', 'PF', '987.654.321-00')
ON CONFLICT DO NOTHING;

INSERT INTO service_catalog (name, description, category, estimated_duration, base_price, is_active) VALUES
('Instalação de Ar Condicionado Split', 'Instalação completa de ar condicionado split incluindo suporte, tubulação e testes', 'Instalação', 180, 350.00, true),
('Manutenção Preventiva', 'Limpeza de filtros, verificação de gás e limpeza geral do equipamento', 'Manutenção', 90, 180.00, true),
('Reparo de Vazamento', 'Identificação e reparo de vazamentos no sistema de refrigeração', 'Reparo', 120, 250.00, true)
ON CONFLICT DO NOTHING;

INSERT INTO inventory_items (name, category, quantity, min_stock, price, supplier, sku, location, description) VALUES
('Ar Condicionado Split 12.000 BTUs', 'Equipamentos', 5, 2, 1800.00, 'Fornecedor A', 'AC-12000-220', 'Prateleira A3', 'Ar condicionado split 12.000 BTUs, 220V'),
('Suporte para Ar Condicionado', 'Acessórios', 15, 5, 50.00, 'Fornecedor B', 'SUP-AC-001', 'Prateleira B1', 'Suporte universal para unidade externa'),
('Tubulação de Cobre 3m', 'Materiais', 8, 3, 80.00, 'Fornecedor C', 'TUB-CU-3M', 'Prateleira C2', 'Tubulação de cobre 1/4" x 3/8" - 3 metros'),
('Gás Refrigerante R410A', 'Materiais', 10, 3, 150.00, 'Fornecedor A', 'GAS-R410A', 'Prateleira C1', 'Gás refrigerante R410A - 1kg'),
('Cabo PP 3x2.5mm 5m', 'Materiais', 20, 5, 45.00, 'Fornecedor D', 'CABO-PP-5M', 'Prateleira D1', 'Cabo PP 3x2.5mm - rolo 5 metros')
ON CONFLICT DO NOTHING;