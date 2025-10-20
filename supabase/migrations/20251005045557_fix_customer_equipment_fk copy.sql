/*
  # Correção de Foreign Keys e Dados de Teste
  
  ## Problema
  - customer_equipment não tem FK para address_id
  - Faltam dados de teste para materials
  
  ## Solução
  1. Adicionar FK para customer_addresses
  2. Inserir materiais de teste com preco_compra e preco_venda
*/

-- Adicionar FK para customer_equipment
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_equipment_address_id_fkey'
  ) THEN
    ALTER TABLE customer_equipment
    ADD CONSTRAINT customer_equipment_address_id_fkey
    FOREIGN KEY (address_id) REFERENCES customer_addresses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Garantir que materials tenha dados suficientes para testes
INSERT INTO materials (nome, name, descricao, unidade_medida, preco_compra, preco_venda, margem_lucro, quantidade_estoque, estoque_minimo, ativo) VALUES
('Tubo de Cobre 1/4"', 'Copper Tube 1/4"', 'Tubo de cobre flexível 1/4 polegada', 'MT', 8.50, 15.00, 76.47, 100, 20, true),
('Tubo de Cobre 3/8"', 'Copper Tube 3/8"', 'Tubo de cobre flexível 3/8 polegada', 'MT', 12.00, 22.00, 83.33, 80, 15, true),
('Tubo de Cobre 1/2"', 'Copper Tube 1/2"', 'Tubo de cobre flexível 1/2 polegada', 'MT', 18.00, 32.00, 77.78, 60, 10, true),
('Cabo Elétrico 2.5mm²', 'Electric Cable 2.5mm²', 'Cabo elétrico flexível 2.5mm²', 'MT', 3.80, 7.50, 97.37, 200, 50, true),
('Cabo Elétrico 4mm²', 'Electric Cable 4mm²', 'Cabo elétrico flexível 4mm²', 'MT', 6.20, 12.00, 93.55, 150, 30, true),
('Fita Isolante PVC', 'PVC Insulation Tape', 'Fita isolante preta 19mm', 'MT', 0.80, 2.00, 150.00, 500, 100, true),
('Isolamento Térmico 1/4"', 'Thermal Insulation 1/4"', 'Isolamento térmico para tubulação', 'MT', 2.50, 5.00, 100.00, 150, 30, true),
('Isolamento Térmico 3/8"', 'Thermal Insulation 3/8"', 'Isolamento térmico para tubulação', 'MT', 3.20, 6.50, 103.13, 120, 25, true),
('Gás R410A', 'R410A Gas', 'Gás refrigerante R410A', 'KG', 85.00, 180.00, 111.76, 50, 10, true),
('Gás R22', 'R22 Gas', 'Gás refrigerante R22', 'KG', 120.00, 250.00, 108.33, 30, 5, true),
('Suporte Metálico AC', 'AC Metal Bracket', 'Suporte metálico para condensadora', 'UN', 45.00, 95.00, 111.11, 40, 10, true),
('Disjuntor 20A', 'Circuit Breaker 20A', 'Disjuntor monopolar 20A', 'UN', 18.00, 38.00, 111.11, 60, 15, true),
('Disjuntor 30A', 'Circuit Breaker 30A', 'Disjuntor monopolar 30A', 'UN', 22.00, 45.00, 104.55, 50, 10, true),
('Canaleta 20x10mm', 'Cable Duct 20x10mm', 'Canaleta plástica branca', 'MT', 4.50, 9.00, 100.00, 100, 20, true),
('Canaleta 30x15mm', 'Cable Duct 30x15mm', 'Canaleta plástica branca', 'MT', 6.80, 13.50, 98.53, 80, 15, true),
('Filtro Split 9k/12k', 'Split Filter 9k/12k', 'Filtro para ar condicionado split', 'UN', 25.00, 55.00, 120.00, 100, 20, true),
('Filtro Split 18k/24k', 'Split Filter 18k/24k', 'Filtro para ar condicionado split', 'UN', 35.00, 75.00, 114.29, 80, 15, true),
('Capacitor 35µF', 'Capacitor 35µF', 'Capacitor para motor AC', 'UN', 15.00, 35.00, 133.33, 50, 10, true),
('Capacitor 45µF', 'Capacitor 45µF', 'Capacitor para motor AC', 'UN', 18.00, 42.00, 133.33, 45, 10, true),
('Placa Eletrônica Split 9k', 'Electronic Board Split 9k', 'Placa eletrônica universal', 'UN', 120.00, 280.00, 133.33, 15, 3, true)
ON CONFLICT (id) DO NOTHING;

-- Atualizar materiais existentes que não tenham preco_compra/preco_venda
UPDATE materials 
SET 
  preco_compra = COALESCE(preco_compra, unit_price * 0.6),
  preco_venda = COALESCE(preco_venda, unit_price),
  margem_lucro = CASE 
    WHEN preco_compra > 0 THEN ((preco_venda - preco_compra) / preco_compra) * 100
    ELSE 0
  END
WHERE preco_compra IS NULL OR preco_venda IS NULL OR preco_compra = 0 OR preco_venda = 0;

-- Garantir que nome e name estejam sempre preenchidos
UPDATE materials SET nome = name WHERE nome IS NULL;
UPDATE materials SET name = nome WHERE name IS NULL;
