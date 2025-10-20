/*
  # Inserir Dados de Demonstração - Corrigido

  1. Dados Inseridos
    - Clientes, endereços, contatos e equipamentos
    - Funcionários
    - Catálogo de serviços
    - Materiais
    - Ordens de serviço com itens e equipe
    - Lançamentos financeiros

  2. Propósito
    - Demonstrar funcionalidades do sistema
    - Facilitar testes e onboarding
*/

-- CLIENTES
INSERT INTO customers (id, tipo_pessoa, nome_razao, nome_fantasia, cpf, cnpj, email, telefone, celular, observacoes) VALUES
  ('11111111-1111-1111-1111-111111111111', 'fisica', 'João da Silva Santos', NULL, '123.456.789-00', NULL, 'joao.silva@email.com', '(11) 3456-7890', '(11) 98765-4321', 'Cliente VIP desde 2020'),
  ('22222222-2222-2222-2222-222222222222', 'juridica', 'Tech Solutions Ltda', 'Tech Solutions', NULL, '12.345.678/0001-90', 'contato@techsolutions.com.br', '(11) 3333-4444', '(11) 99999-8888', 'Contrato anual de manutenção'),
  ('33333333-3333-3333-3333-333333333333', 'fisica', 'Maria Oliveira Costa', NULL, '987.654.321-00', NULL, 'maria.oliveira@email.com', '(11) 2222-3333', '(11) 97777-6666', 'Indicada por João Silva')
ON CONFLICT (id) DO NOTHING;

-- ENDEREÇOS
INSERT INTO customer_addresses (id, customer_id, tipo, nome_identificacao, cep, logradouro, numero, complemento, bairro, cidade, estado, principal) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'residencial', 'Casa Principal', '01310-100', 'Av. Paulista', '1000', 'Apto 101', 'Bela Vista', 'São Paulo', 'SP', true),
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'comercial', 'Sede', '01310-200', 'Rua Augusta', '2000', '5º Andar', 'Consolação', 'São Paulo', 'SP', true),
  ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'residencial', 'Residência', '04002-010', 'Av. Ibirapuera', '3000', 'Casa', 'Ibirapuera', 'São Paulo', 'SP', true)
ON CONFLICT (id) DO NOTHING;

-- CONTATOS
INSERT INTO customer_contacts (id, customer_id, nome, cargo, email, telefone, celular, departamento, principal, recebe_notificacoes) VALUES
  ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Roberto Alves', 'Gerente de TI', 'roberto.alves@techsolutions.com.br', '(11) 3333-4444', '(11) 99999-7777', 'TI', true, true),
  ('c2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Ana Paula Lima', 'Coordenadora', 'ana.lima@techsolutions.com.br', '(11) 3333-4445', '(11) 99999-6666', 'Operações', false, true)
ON CONFLICT (id) DO NOTHING;

-- EQUIPAMENTOS
INSERT INTO customer_equipment (id, customer_id, customer_address_id, tipo_equipamento, marca, modelo, numero_serie, capacidade, data_instalacao) VALUES
  ('e1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Ar Condicionado', 'LG', 'Smart Inverter', 'AC2024001', '12000 BTUs', '2024-01-15'),
  ('e2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Ar Condicionado', 'Samsung', 'Wind Free', 'AC2024002', '18000 BTUs', '2024-02-20')
ON CONFLICT (id) DO NOTHING;

-- FUNCIONÁRIOS
INSERT INTO employees (id, name, email, phone, role, active) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'André Oliveira', 'andre.oliveira@empresa.com', '(11) 91111-1111', 'Técnico Senior', true),
  ('f2222222-2222-2222-2222-222222222222', 'Beatriz Costa', 'beatriz.costa@empresa.com', '(11) 92222-2222', 'Técnico Pleno', true),
  ('f3333333-3333-3333-3333-333333333333', 'Carlos Ferreira', 'carlos.ferreira@empresa.com', '(11) 93333-3333', 'Técnico Junior', true),
  ('f4444444-4444-4444-4444-444444444444', 'Diana Santos', 'diana.santos@empresa.com', '(11) 94444-4444', 'Supervisor', true),
  ('f5555555-5555-5555-5555-555555555555', 'Eduardo Lima', 'eduardo.lima@empresa.com', '(11) 95555-5555', 'Técnico Pleno', true)
ON CONFLICT (id) DO NOTHING;

-- CATÁLOGO DE SERVIÇOS
INSERT INTO service_catalog (id, name, description, category, base_price, estimated_duration, active) VALUES
  (gen_random_uuid(), 'Instalação de Ar Condicionado Split', 'Instalação completa de ar condicionado split com até 12000 BTUs', 'Instalação', 450.00, 180, true),
  (gen_random_uuid(), 'Manutenção Preventiva Simples', 'Limpeza, higienização e verificação básica', 'Manutenção', 150.00, 60, true),
  (gen_random_uuid(), 'Manutenção Preventiva Completa', 'Manutenção completa com troca de filtros e verificação elétrica', 'Manutenção', 280.00, 120, true),
  (gen_random_uuid(), 'Recarga de Gás R410A', 'Recarga completa de gás refrigerante R410A', 'Recarga', 320.00, 90, true),
  (gen_random_uuid(), 'Troca de Compressor', 'Substituição de compressor com garantia', 'Reparo', 850.00, 240, true),
  (gen_random_uuid(), 'Limpeza de Evaporadora', 'Limpeza profunda da unidade evaporadora', 'Limpeza', 120.00, 45, true),
  (gen_random_uuid(), 'Limpeza de Condensadora', 'Limpeza profunda da unidade condensadora', 'Limpeza', 100.00, 40, true),
  (gen_random_uuid(), 'Diagnóstico Técnico', 'Avaliação e diagnóstico de problemas', 'Diagnóstico', 80.00, 30, true),
  (gen_random_uuid(), 'Troca de Placa Eletrônica', 'Substituição de placa eletrônica', 'Reparo', 420.00, 120, true),
  (gen_random_uuid(), 'Instalação Elétrica para AC', 'Instalação de tomada e disjuntor dedicado', 'Instalação', 180.00, 90, true)
ON CONFLICT (id) DO NOTHING;

-- MATERIAIS
INSERT INTO materials (id, name, description, category, unit, quantity, min_quantity, unit_price, supplier, active) VALUES
  (gen_random_uuid(), 'Gás R410A - 1kg', 'Gás refrigerante R410A cilindro 1kg', 'Refrigerante', 'kg', 50, 10, 85.00, 'RefriClima Ltda', true),
  (gen_random_uuid(), 'Gás R22 - 1kg', 'Gás refrigerante R22 cilindro 1kg', 'Refrigerante', 'kg', 30, 5, 120.00, 'RefriClima Ltda', true),
  (gen_random_uuid(), 'Filtro de Ar Universal', 'Filtro de ar universal para evaporadoras', 'Filtro', 'un', 100, 20, 15.00, 'Filtros Brasil', true),
  (gen_random_uuid(), 'Óleo Lubrificante POE', 'Óleo lubrificante para compressores', 'Lubrificante', 'lt', 25, 5, 45.00, 'LubriFrio', true),
  (gen_random_uuid(), 'Tubo de Cobre 1/4"', 'Tubo de cobre 1/4 polegada rolo 15m', 'Tubulação', 'rolo', 40, 10, 180.00, 'Cobre Tech', true),
  (gen_random_uuid(), 'Isolante Térmico 1/4"', 'Isolante térmico para tubulação 1/4', 'Isolamento', 'm', 200, 50, 8.00, 'IsoClima', true),
  (gen_random_uuid(), 'Fita Silver Tape', 'Fita adesiva silver tape', 'Adesivo', 'rolo', 60, 15, 12.00, 'Fitas & Cia', true),
  (gen_random_uuid(), 'Disjuntor 20A', 'Disjuntor bipolar 20 amperes', 'Elétrico', 'un', 50, 10, 25.00, 'Materiais Elétricos', true),
  (gen_random_uuid(), 'Controle Remoto Universal', 'Controle remoto universal para AC', 'Acessório', 'un', 30, 8, 45.00, 'Controles Tech', true),
  (gen_random_uuid(), 'Higienizador de AC', 'Produto higienizador spray 500ml', 'Limpeza', 'un', 80, 20, 22.00, 'Limpa Clima', true)
ON CONFLICT (id) DO NOTHING;

-- ORDENS DE SERVIÇO
INSERT INTO service_orders (id, order_number, customer_id, client_name, client_phone, client_email, service_type, description, status, priority, assigned_to, due_date, estimated_hours, actual_hours, total_cost, show_value, total_estimated_duration, total_value) VALUES
  (gen_random_uuid(), 'OS-2025-0001', '22222222-2222-2222-2222-222222222222', 'Tech Solutions Ltda', '(11) 3333-4444', 'contato@techsolutions.com.br', 'Manutenção Preventiva', 'Manutenção preventiva completa', 'completed', 'medium', 'André Oliveira', '2025-01-15', 4, 3.5, 280.00, true, 120, 280.00),
  (gen_random_uuid(), 'OS-2025-0002', '22222222-2222-2222-2222-222222222222', 'Tech Solutions Ltda', '(11) 3333-4444', 'contato@techsolutions.com.br', 'Instalação', 'Instalação de novo ar condicionado', 'in_progress', 'high', 'Beatriz Costa', '2025-02-20', 5, 2, 450.00, true, 180, 450.00),
  (gen_random_uuid(), 'OS-2025-0003', '11111111-1111-1111-1111-111111111111', 'João da Silva Santos', '(11) 98765-4321', 'joao.silva@email.com', 'Recarga de Gás', 'Recarga de gás R410A', 'pending', 'medium', 'Carlos Ferreira', '2025-03-10', 2, 0, 320.00, true, 90, 320.00),
  (gen_random_uuid(), 'OS-2025-0004', '33333333-3333-3333-3333-333333333333', 'Maria Oliveira Costa', '(11) 97777-6666', 'maria.oliveira@email.com', 'Limpeza', 'Limpeza completa', 'completed', 'low', 'Eduardo Lima', '2025-01-25', 2, 1.5, 220.00, true, 85, 220.00),
  (gen_random_uuid(), 'OS-2025-0005', '11111111-1111-1111-1111-111111111111', 'João da Silva Santos', '(11) 98765-4321', 'joao.silva@email.com', 'Diagnóstico', 'Diagnóstico de problema', 'pending', 'urgent', 'Diana Santos', '2025-02-10', 1, 0, 80.00, true, 30, 80.00)
ON CONFLICT (order_number) DO NOTHING;

-- LANÇAMENTOS FINANCEIROS
INSERT INTO finance_entries (descricao, valor, tipo, status, data, data_vencimento, customer_id, categoria, forma_pagamento, observacoes) VALUES
  ('Pagamento OS-2025-0001', 280.00, 'receita', 'recebido', '2025-01-15', '2025-01-15', '22222222-2222-2222-2222-222222222222', 'Serviços Prestados', 'pix', 'Pagamento à vista'),
  ('Pagamento OS-2025-0004', 220.00, 'receita', 'recebido', '2025-01-25', '2025-01-25', '33333333-3333-3333-3333-333333333333', 'Serviços Prestados', 'dinheiro', 'Pagamento no ato'),
  ('Entrada OS-2025-0002 (50%)', 225.00, 'receita', 'recebido', '2025-02-01', '2025-02-01', '22222222-2222-2222-2222-222222222222', 'Serviços Prestados', 'pix', 'Sinal da instalação'),
  ('OS-2025-0003 - Pendente', 320.00, 'receita', 'a_receber', '2025-03-10', '2025-03-10', '11111111-1111-1111-1111-111111111111', 'Serviços Prestados', 'pix', 'Agendado'),
  ('Compra de Gás R410A', 850.00, 'despesa', 'pago', '2025-01-05', '2025-01-05', NULL, 'Materiais', 'transferencia', 'RefriClima Ltda'),
  ('Compra de filtros', 750.00, 'despesa', 'pago', '2025-01-10', '2025-01-10', NULL, 'Materiais', 'boleto', 'Filtros Brasil'),
  ('Salários Janeiro', 15000.00, 'despesa', 'pago', '2025-01-30', '2025-01-30', NULL, 'Salários', 'transferencia', 'Folha de pagamento'),
  ('Aluguel Janeiro', 3500.00, 'despesa', 'pago', '2025-01-10', '2025-01-10', NULL, 'Aluguel', 'transferencia', 'Aluguel escritório'),
  ('DARF - Impostos Janeiro', 2800.00, 'despesa', 'pago', '2025-01-20', '2025-01-20', NULL, 'Impostos', 'transferencia', 'Impostos federais'),
  ('Salários Fevereiro', 15000.00, 'despesa', 'a_pagar', '2025-02-28', '2025-02-28', NULL, 'Salários', 'transferencia', 'Folha de pagamento')
ON CONFLICT DO NOTHING;
