/*
  # Corrigir Trigger de Fornecedores
  
  O trigger está tentando acessar colunas inexistentes (nome_razao, nome_fantasia).
  Vamos corrigi-lo para usar as colunas reais da tabela.
  
  Estrutura real:
  - name (ao invés de nome_razao/nome_fantasia)
  - address (ao invés de logradouro)
*/

-- Recriar função do trigger com colunas corretas
CREATE OR REPLACE FUNCTION trigger_capitalize_suppliers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  -- Capitalizar nome do fornecedor
  IF NEW.name IS NOT NULL THEN
    NEW.name := INITCAP(NEW.name);
  END IF;
  
  -- Capitalizar nome do contato
  IF NEW.contact_person IS NOT NULL THEN
    NEW.contact_person := INITCAP(NEW.contact_person);
  END IF;
  
  -- Capitalizar endereço
  IF NEW.address IS NOT NULL THEN
    NEW.address := INITCAP(NEW.address);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS capitalize_suppliers_trigger ON suppliers;
CREATE TRIGGER capitalize_suppliers_trigger
  BEFORE INSERT OR UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION trigger_capitalize_suppliers();

COMMENT ON FUNCTION trigger_capitalize_suppliers IS '✅ Capitaliza campos de texto dos fornecedores antes de salvar';
