/*
  # Popular Dados Restantes

  Continuar inserção de dados em todas as tabelas
*/

-- CATÁLOGO DE SERVIÇOS (catalog_services)
INSERT INTO catalog_services (code, name, description, category, base_price, estimated_hours, complexity, active) VALUES
  ('SRV-INST-001', 'Instalação Split 9000-12000 BTUs', 'Instalação completa de ar condicionado split até 12000 BTUs', 'Instalação', 450.00, 3, 'medium', true),
  ('SRV-INST-002', 'Instalação Split 18000-24000 BTUs', 'Instalação completa de ar condicionado split até 24000 BTUs', 'Instalação', 650.00, 4, 'medium', true),
  ('SRV-MANU-001', 'Manutenção Preventiva Simples', 'Limpeza básica e verificação geral', 'Manutenção', 150.00, 1, 'simple', true),
  ('SRV-MANU-002', 'Manutenção Preventiva Completa', 'Limpeza completa, troca de filtros e verificação elétrica', 'Manutenção', 280.00, 2, 'medium', true),
  ('SRV-RECA-001', 'Recarga de Gás R410A', 'Recarga completa de gás refrigerante', 'Recarga', 320.00, 1.5, 'simple', true),
  ('SRV-REPA-001', 'Troca de Compressor', 'Substituição de compressor com garantia', 'Reparo', 850.00, 4, 'complex', true),
  ('SRV-LIMP-001', 'Higienização Profunda', 'Limpeza profunda de evaporadora e condensadora', 'Limpeza', 220.00, 1.5, 'simple', true),
  ('SRV-DIAG-001', 'Diagnóstico Técnico', 'Avaliação completa e diagnóstico de problemas', 'Diagnóstico', 80.00, 0.5, 'simple', true),
  ('SRV-INST-003', 'Instalação Elétrica Dedicada', 'Instalação de tomada e disjuntor para AC', 'Instalação', 180.00, 1.5, 'medium', true),
  ('SRV-DESI-001', 'Desinstalação de Equipamento', 'Remoção completa e segura', 'Desinstalação', 150.00, 1, 'simple', true),
  ('SRV-CONS-001', 'Consultoria Técnica', 'Consultoria para sistemas de climatização', 'Consultoria', 200.00, 2, 'medium', true),
  ('SRV-EMER-001', 'Atendimento Emergencial 24h', 'Atendimento urgente fora do horário comercial', 'Emergência', 350.00, 2, 'medium', true),
  ('SRV-TROC-001', 'Troca de Placa Eletrônica', 'Substituição de placa com teste', 'Reparo', 420.00, 2, 'medium', true),
  ('SRV-SELA-001', 'Selagem de Tubulação', 'Vedação e isolamento profissional', 'Manutenção', 130.00, 0.75, 'simple', true)
ON CONFLICT (code) DO NOTHING;

-- PEDIDOS (ORDERS)
INSERT INTO orders (order_number, customer_id, order_date, status, priority, subtotal, total) VALUES
  ('PED-2025-001', '22222222-2222-2222-2222-222222222222', '2025-01-10', 'completed', 'medium', 500.00, 500.00),
  ('PED-2025-002', '11111111-1111-1111-1111-111111111111', '2025-02-01', 'in_progress', 'high', 750.00, 750.00),
  ('PED-2025-003', '33333333-3333-3333-3333-333333333333', '2025-02-10', 'pending', 'medium', 320.00, 320.00)
ON CONFLICT (order_number) DO NOTHING;

-- CRM LEADS
INSERT INTO crm_leads (name, email, phone, company, source, status, score) VALUES
  ('Patricia Mendes', 'patricia@email.com', '(11) 99999-1111', 'Mendes Imóveis', 'Website', 'new', 75),
  ('Ricardo Silva', 'ricardo@empresa.com', '(11) 98888-2222', 'Silva & Cia', 'Indicação', 'contacted', 85),
  ('Fernanda Costa', 'fernanda@comercio.com', '(11) 97777-3333', 'Comércio da Fernanda', 'Google Ads', 'qualified', 90),
  ('Gabriel Santos', 'gabriel@tech.com', '(11) 96666-4444', 'Tech Solutions', 'LinkedIn', 'proposal', 95),
  ('Juliana Rocha', 'juliana@hotel.com', '(11) 95555-5555', 'Hotel Rocha', 'Telefone', 'new', 60)
ON CONFLICT DO NOTHING;

-- AGENDA/EVENTOS
INSERT INTO agenda (title, description, start_date, end_date, customer_id, staff_id, status, event_type) VALUES
  ('Manutenção - Tech Solutions', 'Manutenção preventiva mensal', '2025-10-10 09:00:00+00', '2025-10-10 11:00:00+00', '22222222-2222-2222-2222-222222222222', 'f1111111-1111-1111-1111-111111111111', 'scheduled', 'maintenance'),
  ('Instalação - João Silva', 'Instalação novo split 12000 BTUs', '2025-10-12 14:00:00+00', '2025-10-12 17:00:00+00', '11111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 'scheduled', 'installation'),
  ('Visita Técnica - Maria Oliveira', 'Diagnóstico de problema', '2025-10-15 10:00:00+00', '2025-10-15 11:00:00+00', '33333333-3333-3333-3333-333333333333', 'f3333333-3333-3333-3333-333333333333', 'confirmed', 'diagnosis'),
  ('Reunião Comercial', 'Apresentação de proposta', '2025-10-18 15:00:00+00', '2025-10-18 16:00:00+00', NULL, 'f4444444-4444-4444-4444-444444444444', 'scheduled', 'meeting'),
  ('Treinamento Equipe', 'Treinamento sobre novos equipamentos', '2025-10-20 08:00:00+00', '2025-10-20 12:00:00+00', NULL, NULL, 'scheduled', 'training')
ON CONFLICT DO NOTHING;

-- CONTRATOS
INSERT INTO contracts (contract_number, customer_id, contract_type_id, start_date, end_date, value, status, payment_frequency) VALUES
  ('CTR-2025-001', '22222222-2222-2222-2222-222222222222', (SELECT id FROM contract_types WHERE name LIKE '%Mensal%' LIMIT 1), '2025-01-01', '2025-12-31', 3360.00, 'active', 'monthly'),
  ('CTR-2025-002', '11111111-1111-1111-1111-111111111111', (SELECT id FROM contract_types WHERE name LIKE '%Trimestral%' LIMIT 1), '2025-02-01', '2026-01-31', 1120.00, 'active', 'quarterly')
ON CONFLICT (contract_number) DO NOTHING;

-- PROJETOS
INSERT INTO projects (name, description, customer_id, start_date, status, budget, manager_id) VALUES
  ('Modernização Sistema Climatização', 'Substituição completa do sistema de climatização', '22222222-2222-2222-2222-222222222222', '2025-03-01', 'planning', 50000.00, 'f4444444-4444-4444-4444-444444444444'),
  ('Instalação Prédio Comercial', 'Instalação de 15 unidades split', '11111111-1111-1111-1111-111111111111', '2025-04-01', 'planning', 25000.00, 'f4444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

-- WHATSAPP - CONTAS
INSERT INTO wpp_accounts (name, phone, status, active) VALUES
  ('Atendimento Principal', '+5511999887766', 'connected', true)
ON CONFLICT (phone) DO NOTHING;

-- WHATSAPP - TAGS
INSERT INTO wpp_tags (name, color) VALUES
  ('Cliente VIP', '#f59e0b'),
  ('Urgente', '#ef4444'),
  ('Follow-up', '#3b82f6'),
  ('Orçamento Enviado', '#10b981')
ON CONFLICT DO NOTHING;

-- WHATSAPP - CONTATOS
INSERT INTO wpp_contacts (wpp_account_id, name, phone, customer_id) 
SELECT 
  (SELECT id FROM wpp_accounts LIMIT 1),
  'João Silva',
  '+5511987654321',
  '11111111-1111-1111-1111-111111111111'
WHERE EXISTS (SELECT 1 FROM wpp_accounts LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO wpp_contacts (wpp_account_id, name, phone, customer_id)
SELECT 
  (SELECT id FROM wpp_accounts LIMIT 1),
  'Roberto Alves - Tech Solutions',
  '+5511999997777',
  '22222222-2222-2222-2222-222222222222'
WHERE EXISTS (SELECT 1 FROM wpp_accounts LIMIT 1)
ON CONFLICT DO NOTHING;

-- TRANSAÇÕES FINANCEIRAS
INSERT INTO financial_transactions (bank_account_id, transaction_date, transaction_type, category, amount, description, status)
SELECT 
  (SELECT id FROM bank_accounts WHERE account_name LIKE '%Principal%' LIMIT 1),
  '2025-01-15',
  'income',
  'Serviços',
  560.00,
  'Pagamento OS-2025-0001',
  'completed'
WHERE EXISTS (SELECT 1 FROM bank_accounts)
ON CONFLICT DO NOTHING;

INSERT INTO financial_transactions (bank_account_id, transaction_date, transaction_type, category, amount, description, status)
SELECT 
  (SELECT id FROM bank_accounts WHERE account_name LIKE '%Principal%' LIMIT 1),
  '2025-01-05',
  'expense',
  'Materiais',
  850.00,
  'Compra de gás refrigerante',
  'completed'
WHERE EXISTS (SELECT 1 FROM bank_accounts)
ON CONFLICT DO NOTHING;

-- MOVIMENTAÇÕES DE ESTOQUE
INSERT INTO stock_movements (inventory_item_id, movement_type, quantity, unit_cost, reason)
SELECT 
  id,
  'in',
  50,
  85.00,
  'Compra inicial estoque'
FROM inventory_items 
WHERE code = 'GAS-R410A'
ON CONFLICT DO NOTHING;

INSERT INTO stock_movements (inventory_item_id, movement_type, quantity, unit_cost, reason)
SELECT 
  id,
  'out',
  1,
  85.00,
  'Usado em OS-2025-0003'
FROM inventory_items 
WHERE code = 'GAS-R410A'
ON CONFLICT DO NOTHING;

-- Atualizar quantidade de materiais após movimentação
UPDATE inventory_items SET quantity = 49 WHERE code = 'GAS-R410A';
