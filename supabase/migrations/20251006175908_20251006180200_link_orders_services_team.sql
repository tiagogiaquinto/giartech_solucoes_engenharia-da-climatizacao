/*
  # Vincular Ordens com Serviços e Equipe

  1. Dados Inseridos
    - Itens de serviço nas ordens
    - Membros da equipe nas ordens

  2. Propósito
    - Demonstrar múltiplos serviços por ordem
    - Demonstrar equipes colaborativas
*/

-- Pegar IDs reais
DO $$
DECLARE
  os1 uuid;
  os2 uuid;
  os3 uuid;
  serv1 uuid;
  serv2 uuid;
  serv3 uuid;
  emp1 uuid;
  emp2 uuid;
  emp3 uuid;
BEGIN
  -- Pegar IDs das ordens
  SELECT id INTO os1 FROM service_orders WHERE order_number = 'OS-2025-0001';
  SELECT id INTO os2 FROM service_orders WHERE order_number = 'OS-2025-0002';
  SELECT id INTO os3 FROM service_orders WHERE order_number = 'OS-2025-0003';
  
  -- Pegar IDs dos serviços
  SELECT id INTO serv1 FROM service_catalog WHERE name LIKE 'Manutenção Preventiva Completa%' LIMIT 1;
  SELECT id INTO serv2 FROM service_catalog WHERE name LIKE 'Instalação de Ar%' LIMIT 1;
  SELECT id INTO serv3 FROM service_catalog WHERE name LIKE 'Recarga de Gás%' LIMIT 1;
  
  -- Pegar IDs dos funcionários
  SELECT id INTO emp1 FROM employees WHERE name = 'André Oliveira';
  SELECT id INTO emp2 FROM employees WHERE name = 'Beatriz Costa';
  SELECT id INTO emp3 FROM employees WHERE name = 'Carlos Ferreira';
  
  -- Inserir itens de serviço
  IF os1 IS NOT NULL AND serv1 IS NOT NULL THEN
    INSERT INTO service_order_items (service_order_id, service_catalog_id, quantity, unit_price, total_price, estimated_duration, notes)
    VALUES (os1, serv1, 1, 280.00, 280.00, 120, 'Manutenção completa')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF os2 IS NOT NULL AND serv2 IS NOT NULL THEN
    INSERT INTO service_order_items (service_order_id, service_catalog_id, quantity, unit_price, total_price, estimated_duration, notes)
    VALUES (os2, serv2, 1, 450.00, 450.00, 180, 'Instalação padrão')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF os3 IS NOT NULL AND serv3 IS NOT NULL THEN
    INSERT INTO service_order_items (service_order_id, service_catalog_id, quantity, unit_price, total_price, estimated_duration, notes)
    VALUES (os3, serv3, 1, 320.00, 320.00, 90, 'Recarga completa')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Inserir membros da equipe
  IF os1 IS NOT NULL AND emp1 IS NOT NULL THEN
    INSERT INTO service_order_team (service_order_id, employee_id, role)
    VALUES (os1, emp1, 'leader')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF os2 IS NOT NULL AND emp2 IS NOT NULL THEN
    INSERT INTO service_order_team (service_order_id, employee_id, role)
    VALUES (os2, emp2, 'leader')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF os2 IS NOT NULL AND emp3 IS NOT NULL THEN
    INSERT INTO service_order_team (service_order_id, employee_id, role)
    VALUES (os2, emp3, 'technician')
    ON CONFLICT DO NOTHING;
  END IF;
  
  IF os3 IS NOT NULL AND emp3 IS NOT NULL THEN
    INSERT INTO service_order_team (service_order_id, employee_id, role)
    VALUES (os3, emp3, 'technician')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
