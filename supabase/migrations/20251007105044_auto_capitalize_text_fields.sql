/*
  # Capitalização Automática de Campos de Texto
  
  Adiciona funções e triggers para capitalizar automaticamente campos de texto
  ao inserir ou atualizar registros no banco de dados.
  
  ## Funções Criadas:
  - capitalize_proper_name() - Para nomes de pessoas
  - capitalize_company_name() - Para nomes de empresas
  - capitalize_address() - Para endereços
  - capitalize_first_letter() - Para campos gerais
  
  ## Triggers Aplicados em:
  - customers (nome_razao, nome_fantasia, logradouro, bairro, cidade)
  - employees (nome_completo, cargo, departamento, logradouro, bairro, cidade)
  - service_catalog (nome, categoria)
  - materials (nome, categoria)
  - suppliers (nome_razao, nome_fantasia, logradouro, bairro, cidade)
  - user_profiles (nome_completo)
*/

-- Função para capitalizar nomes próprios (pessoas)
CREATE OR REPLACE FUNCTION capitalize_proper_name(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  particles TEXT[] := ARRAY['da', 'de', 'do', 'das', 'dos'];
  words TEXT[];
  word TEXT;
  result TEXT := '';
  idx INT := 0;
BEGIN
  IF text_input IS NULL OR text_input = '' THEN
    RETURN text_input;
  END IF;

  words := string_to_array(LOWER(TRIM(text_input)), ' ');

  FOREACH word IN ARRAY words
  LOOP
    idx := idx + 1;
    IF idx > 1 AND word = ANY(particles) THEN
      result := result || word || ' ';
    ELSE
      result := result || INITCAP(word) || ' ';
    END IF;
  END LOOP;

  RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para capitalizar nomes de empresas
CREATE OR REPLACE FUNCTION capitalize_company_name(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  suffixes TEXT[] := ARRAY['LTDA', 'LTDA.', 'ME', 'EPP', 'EIRELI', 'S/A', 'SA'];
  particles TEXT[] := ARRAY['de', 'da', 'do', 'das', 'dos', 'e'];
  words TEXT[];
  word TEXT;
  word_upper TEXT;
  result TEXT := '';
BEGIN
  IF text_input IS NULL OR text_input = '' THEN
    RETURN text_input;
  END IF;

  words := string_to_array(TRIM(text_input), ' ');

  FOREACH word IN ARRAY words
  LOOP
    word_upper := UPPER(word);
    
    IF word_upper = ANY(suffixes) THEN
      result := result || word_upper || ' ';
    ELSIF LOWER(word) = ANY(particles) THEN
      result := result || LOWER(word) || ' ';
    ELSE
      result := result || INITCAP(word) || ' ';
    END IF;
  END LOOP;

  RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para capitalizar endereços
CREATE OR REPLACE FUNCTION capitalize_address(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  prepositions TEXT[] := ARRAY['de', 'da', 'do', 'das', 'dos', 'com', 'em', 'para'];
  words TEXT[];
  word TEXT;
  result TEXT := '';
  idx INT := 0;
BEGIN
  IF text_input IS NULL OR text_input = '' THEN
    RETURN text_input;
  END IF;

  words := string_to_array(LOWER(TRIM(text_input)), ' ');

  FOREACH word IN ARRAY words
  LOOP
    idx := idx + 1;
    IF idx > 1 AND word = ANY(prepositions) THEN
      result := result || word || ' ';
    ELSE
      result := result || INITCAP(word) || ' ';
    END IF;
  END LOOP;

  RETURN TRIM(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para capitalizar primeira letra
CREATE OR REPLACE FUNCTION capitalize_first_letter(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  IF text_input IS NULL OR text_input = '' THEN
    RETURN text_input;
  END IF;

  RETURN UPPER(SUBSTRING(text_input, 1, 1)) || SUBSTRING(text_input, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para customers
CREATE OR REPLACE FUNCTION trigger_capitalize_customers()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nome_razao := capitalize_company_name(NEW.nome_razao);
  
  IF NEW.nome_fantasia IS NOT NULL THEN
    NEW.nome_fantasia := capitalize_company_name(NEW.nome_fantasia);
  END IF;
  
  IF NEW.logradouro IS NOT NULL THEN
    NEW.logradouro := capitalize_address(NEW.logradouro);
  END IF;
  
  IF NEW.bairro IS NOT NULL THEN
    NEW.bairro := capitalize_address(NEW.bairro);
  END IF;
  
  IF NEW.cidade IS NOT NULL THEN
    NEW.cidade := capitalize_address(NEW.cidade);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS capitalize_customers_trigger ON customers;
CREATE TRIGGER capitalize_customers_trigger
  BEFORE INSERT OR UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_customers();

-- Trigger para employees
CREATE OR REPLACE FUNCTION trigger_capitalize_employees()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome_completo IS NOT NULL THEN
    NEW.nome_completo := capitalize_proper_name(NEW.nome_completo);
  END IF;
  
  IF NEW.cargo IS NOT NULL THEN
    NEW.cargo := capitalize_first_letter(NEW.cargo);
  END IF;
  
  IF NEW.departamento IS NOT NULL THEN
    NEW.departamento := capitalize_first_letter(NEW.departamento);
  END IF;
  
  IF NEW.logradouro IS NOT NULL THEN
    NEW.logradouro := capitalize_address(NEW.logradouro);
  END IF;
  
  IF NEW.bairro IS NOT NULL THEN
    NEW.bairro := capitalize_address(NEW.bairro);
  END IF;
  
  IF NEW.cidade IS NOT NULL THEN
    NEW.cidade := capitalize_address(NEW.cidade);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS capitalize_employees_trigger ON employees;
CREATE TRIGGER capitalize_employees_trigger
  BEFORE INSERT OR UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_employees();

-- Trigger para service_catalog
CREATE OR REPLACE FUNCTION trigger_capitalize_service_catalog()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS NOT NULL THEN
    NEW.nome := capitalize_first_letter(NEW.nome);
  END IF;
  
  IF NEW.categoria IS NOT NULL THEN
    NEW.categoria := capitalize_first_letter(NEW.categoria);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS capitalize_service_catalog_trigger ON service_catalog;
CREATE TRIGGER capitalize_service_catalog_trigger
  BEFORE INSERT OR UPDATE ON service_catalog
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_service_catalog();

-- Trigger para materials
CREATE OR REPLACE FUNCTION trigger_capitalize_materials()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome IS NOT NULL THEN
    NEW.nome := capitalize_first_letter(NEW.nome);
  END IF;
  
  IF NEW.categoria IS NOT NULL THEN
    NEW.categoria := capitalize_first_letter(NEW.categoria);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS capitalize_materials_trigger ON materials;
CREATE TRIGGER capitalize_materials_trigger
  BEFORE INSERT OR UPDATE ON materials
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_materials();

-- Trigger para suppliers
CREATE OR REPLACE FUNCTION trigger_capitalize_suppliers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome_razao IS NOT NULL THEN
    NEW.nome_razao := capitalize_company_name(NEW.nome_razao);
  END IF;
  
  IF NEW.nome_fantasia IS NOT NULL THEN
    NEW.nome_fantasia := capitalize_company_name(NEW.nome_fantasia);
  END IF;
  
  IF NEW.logradouro IS NOT NULL THEN
    NEW.logradouro := capitalize_address(NEW.logradouro);
  END IF;
  
  IF NEW.bairro IS NOT NULL THEN
    NEW.bairro := capitalize_address(NEW.bairro);
  END IF;
  
  IF NEW.cidade IS NOT NULL THEN
    NEW.cidade := capitalize_address(NEW.cidade);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS capitalize_suppliers_trigger ON suppliers;
CREATE TRIGGER capitalize_suppliers_trigger
  BEFORE INSERT OR UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_suppliers();

-- Trigger para user_profiles
CREATE OR REPLACE FUNCTION trigger_capitalize_user_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.nome_completo IS NOT NULL THEN
    NEW.nome_completo := capitalize_proper_name(NEW.nome_completo);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS capitalize_user_profiles_trigger ON user_profiles;
CREATE TRIGGER capitalize_user_profiles_trigger
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_user_profiles();

-- Trigger para financial_categories
CREATE OR REPLACE FUNCTION trigger_capitalize_financial_categories()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.name IS NOT NULL THEN
    NEW.name := capitalize_first_letter(NEW.name);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS capitalize_financial_categories_trigger ON financial_categories;
CREATE TRIGGER capitalize_financial_categories_trigger
  BEFORE INSERT OR UPDATE ON financial_categories
  FOR EACH ROW
  EXECUTE FUNCTION trigger_capitalize_financial_categories();
