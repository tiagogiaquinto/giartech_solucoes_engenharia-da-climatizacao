/*
  # Popular Todas as Tabelas com Dados

  Inserir dados de demonstração em todas as tabelas criadas
*/

-- CONFIGURAÇÕES DA EMPRESA
INSERT INTO company_settings (company_name, cnpj, email, phone, address, primary_color, secondary_color) VALUES
  ('GiarTech Soluções', '12.345.678/0001-90', 'contato@giartech.com.br', '(11) 3456-7890', 'Av. Paulista, 1000 - São Paulo, SP', '#3b82f6', '#10b981')
ON CONFLICT DO NOTHING;

-- EMPRESAS
INSERT INTO empresas (id, razao_social, nome_fantasia, cnpj, email, telefone, active) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'GiarTech Ltda', 'GiarTech', '12.345.678/0001-90', 'contato@giartech.com.br', '(11) 3456-7890', true),
  ('e2222222-2222-2222-2222-222222222222', 'TechSolutions Corp', 'TechSolutions', '98.765.432/0001-10', 'info@techsolutions.com.br', '(11) 9999-8888', true)
ON CONFLICT (id) DO NOTHING;

-- TIPOS DE CONTRATOS
INSERT INTO contract_types (name, description, duration_months, active) VALUES
  ('Manutenção Preventiva Mensal', 'Contrato de manutenção preventiva com visitas mensais', 12, true),
  ('Manutenção Trimestral', 'Manutenção preventiva a cada 3 meses', 12, true),
  ('Contrato Anual', 'Contrato de serviços por 12 meses', 12, true),
  ('Projeto Pontual', 'Projeto específico sem renovação automática', NULL, true),
  ('Suporte Técnico 24/7', 'Suporte técnico disponível 24 horas', 12, true),
  ('Instalação e Garantia', 'Instalação com 6 meses de garantia', 6, true)
ON CONFLICT DO NOTHING;

-- FORNECEDORES
INSERT INTO suppliers (name, cnpj, email, phone, contact_person, active) VALUES
  ('RefriClima Distribuidora', '11.222.333/0001-44', 'vendas@refriclima.com.br', '(11) 4444-5555', 'Roberto Alves', true),
  ('Filtros Brasil Ltda', '22.333.444/0001-55', 'comercial@filtrosbrasil.com.br', '(11) 5555-6666', 'Ana Paula', true),
  ('Cobre Tech Materiais', '33.444.555/0001-66', 'atendimento@cobretech.com.br', '(11) 6666-7777', 'Carlos Eduardo', true),
  ('Materiais Elétricos Silva', '44.555.666/0001-77', 'contato@materiaiseletricos.com.br', '(11) 7777-8888', 'Marina Santos', true),
  ('IsoClima Isolamentos', '55.666.777/0001-88', 'vendas@isoclima.com.br', '(11) 8888-9999', 'Paulo Mendes', true)
ON CONFLICT DO NOTHING;

-- TENANTS
INSERT INTO tenants (name, subdomain, empresa_id, active) VALUES
  ('GiarTech Principal', 'giartech', 'e1111111-1111-1111-1111-111111111111', true),
  ('TechSolutions', 'techsol', 'e2222222-2222-2222-2222-222222222222', true)
ON CONFLICT DO NOTHING;

-- USUÁRIOS
INSERT INTO users (email, full_name, role, empresa_id, active) VALUES
  ('admin@giartech.com.br', 'Administrador Sistema', 'admin', 'e1111111-1111-1111-1111-111111111111', true),
  ('tecnico@giartech.com.br', 'Técnico Principal', 'user', 'e1111111-1111-1111-1111-111111111111', true),
  ('gerente@giartech.com.br', 'Gerente Operacional', 'user', 'e1111111-1111-1111-1111-111111111111', true)
ON CONFLICT (email) DO NOTHING;

-- CONTAS BANCÁRIAS
INSERT INTO bank_accounts (account_name, bank_name, account_number, agency, account_type, balance, active) VALUES
  ('Conta Corrente Principal', 'Banco do Brasil', '12345-6', '1234', 'checking', 50000.00, true),
  ('Conta Poupança', 'Caixa Econômica', '98765-4', '9876', 'savings', 25000.00, true),
  ('Conta Investimentos', 'Bradesco', '55555-0', '5555', 'investment', 100000.00, true)
ON CONFLICT DO NOTHING;

-- EQUIPAMENTOS DA EMPRESA
INSERT INTO equipments (name, type, brand, model, serial_number, status, location) VALUES
  ('Van de Serviços', 'Veículo', 'Fiat', 'Ducato', 'VEI2024001', 'active', 'Garagem'),
  ('Bomba de Vácuo Profissional', 'Ferramenta', 'Robinair', 'VacuMaster 3000', 'TOOL2024001', 'active', 'Almoxarifado'),
  ('Manifold Digital', 'Ferramenta', 'Testo', '550s', 'TOOL2024002', 'active', 'Van 1'),
  ('Detector de Vazamento', 'Ferramenta', 'Inficon', 'TEK-Mate', 'TOOL2024003', 'active', 'Van 1'),
  ('Notebook Técnico', 'Eletrônico', 'Dell', 'Latitude 5420', 'NB2024001', 'active', 'Escritório')
ON CONFLICT DO NOTHING;

-- STAFF (vinculado aos employees existentes, mas com mais detalhes)
INSERT INTO staff (id, name, email, phone, role, department, status) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'André Oliveira', 'andre.oliveira@empresa.com', '(11) 91111-1111', 'Técnico Senior', 'Operações', 'active'),
  ('f2222222-2222-2222-2222-222222222222', 'Beatriz Costa', 'beatriz.costa@empresa.com', '(11) 92222-2222', 'Técnico Pleno', 'Operações', 'active'),
  ('f3333333-3333-3333-3333-333333333333', 'Carlos Ferreira', 'carlos.ferreira@empresa.com', '(11) 93333-3333', 'Técnico Junior', 'Operações', 'active'),
  ('f4444444-4444-4444-4444-444444444444', 'Diana Santos', 'diana.santos@empresa.com', '(11) 94444-4444', 'Supervisor', 'Operações', 'active'),
  ('f5555555-5555-5555-5555-555555555555', 'Eduardo Lima', 'eduardo.lima@empresa.com', '(11) 95555-5555', 'Técnico Pleno', 'Operações', 'active')
ON CONFLICT (id) DO NOTHING;

-- ITENS DE INVENTÁRIO
INSERT INTO inventory_items (code, name, description, category, unit, quantity, min_quantity, unit_cost, unit_price, location) VALUES
  ('GAS-R410A', 'Gás R410A Cilindro 13,6kg', 'Gás refrigerante R410A', 'Refrigerante', 'kg', 100, 20, 85.00, 150.00, 'Almoxarifado A1'),
  ('GAS-R22', 'Gás R22 Cilindro 13,6kg', 'Gás refrigerante R22', 'Refrigerante', 'kg', 50, 10, 120.00, 200.00, 'Almoxarifado A1'),
  ('FILT-001', 'Filtro de Ar 30x60cm', 'Filtro de ar para split', 'Filtro', 'un', 200, 50, 15.00, 35.00, 'Prateleira B2'),
  ('TUBO-1/4', 'Tubo Cobre 1/4" Rolo 15m', 'Tubo de cobre para instalação', 'Tubulação', 'rolo', 80, 15, 180.00, 320.00, 'Almoxarifado C1'),
  ('TUBO-3/8', 'Tubo Cobre 3/8" Rolo 15m', 'Tubo de cobre para instalação', 'Tubulação', 'rolo', 60, 12, 220.00, 380.00, 'Almoxarifado C1'),
  ('ISO-1/4', 'Isolante Térmico 1/4" Rolo 30m', 'Isolante para tubulação', 'Isolamento', 'rolo', 100, 20, 45.00, 85.00, 'Prateleira D1'),
  ('ISO-3/8', 'Isolante Térmico 3/8" Rolo 30m', 'Isolante para tubulação', 'Isolamento', 'rolo', 80, 18, 55.00, 95.00, 'Prateleira D1'),
  ('DISJ-20A', 'Disjuntor 20A Bipolar', 'Disjuntor para AC', 'Elétrico', 'un', 150, 30, 25.00, 55.00, 'Prateleira E1'),
  ('CONTR-UNI', 'Controle Remoto Universal', 'Controle para vários modelos', 'Acessório', 'un', 80, 15, 45.00, 95.00, 'Prateleira F1'),
  ('LIMP-AC', 'Higienizador AC 500ml', 'Spray higienizador', 'Limpeza', 'un', 200, 40, 22.00, 45.00, 'Prateleira G1'),
  ('CAP-25UF', 'Capacitor 25µF 440V', 'Capacitor permanente', 'Elétrico', 'un', 120, 25, 32.00, 65.00, 'Gaveta E2'),
  ('PLACA-UNI', 'Placa Eletrônica Universal', 'Placa para vários modelos', 'Eletrônica', 'un', 40, 8, 180.00, 350.00, 'Armário Seguro')
ON CONFLICT (code) DO NOTHING;

-- CONTINUA...
