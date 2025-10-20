/*
  # Dados Completos de Funcionários
  
  1. Alterações na Tabela `staff`
    - Adicionar campos pessoais completos
    - Adicionar endereço completo
    - Adicionar campos salariais detalhados
    - Adicionar campos para documentos
    
  2. Novos Campos
    - **Dados Pessoais**: data_nascimento, rg, cpf, estado_civil, nome_mae
    - **Contato**: telefone, email, telefone_emergencia
    - **Endereço**: endereco, numero, complemento, bairro, cidade, estado, cep
    - **Salário**: salario_mensal, salario_quinzenal, salario_semanal, salario_diario, salario_hora
    - **Documentos**: doc_rg_url, doc_cpf_url, doc_comprovante_endereco_url, doc_cnh_url
    - **Banco**: banco, agencia, conta, pix
    
  3. Cálculos Automáticos
    - salario_diario = salario_mensal / dias_mes
    - salario_hora = salario_mensal / (dias_mes * horas_dia)
    - salario_semanal = salario_diario * 6
    - salario_quinzenal = salario_mensal / 2
*/

-- Adicionar novos campos à tabela staff
DO $$ 
BEGIN
  -- Dados Pessoais
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'data_nascimento') THEN
    ALTER TABLE staff ADD COLUMN data_nascimento date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'rg') THEN
    ALTER TABLE staff ADD COLUMN rg text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'cpf') THEN
    ALTER TABLE staff ADD COLUMN cpf text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'estado_civil') THEN
    ALTER TABLE staff ADD COLUMN estado_civil text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'nome_mae') THEN
    ALTER TABLE staff ADD COLUMN nome_mae text;
  END IF;
  
  -- Contato
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'telefone') THEN
    ALTER TABLE staff ADD COLUMN telefone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'email') THEN
    ALTER TABLE staff ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'telefone_emergencia') THEN
    ALTER TABLE staff ADD COLUMN telefone_emergencia text;
  END IF;
  
  -- Endereço
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'endereco') THEN
    ALTER TABLE staff ADD COLUMN endereco text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'numero') THEN
    ALTER TABLE staff ADD COLUMN numero text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'complemento') THEN
    ALTER TABLE staff ADD COLUMN complemento text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'bairro') THEN
    ALTER TABLE staff ADD COLUMN bairro text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'cidade') THEN
    ALTER TABLE staff ADD COLUMN cidade text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'estado') THEN
    ALTER TABLE staff ADD COLUMN estado text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'cep') THEN
    ALTER TABLE staff ADD COLUMN cep text;
  END IF;
  
  -- Salários calculados
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'salario_mensal') THEN
    ALTER TABLE staff ADD COLUMN salario_mensal numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'salario_quinzenal') THEN
    ALTER TABLE staff ADD COLUMN salario_quinzenal numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'salario_semanal') THEN
    ALTER TABLE staff ADD COLUMN salario_semanal numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'salario_diario') THEN
    ALTER TABLE staff ADD COLUMN salario_diario numeric DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'salario_hora') THEN
    ALTER TABLE staff ADD COLUMN salario_hora numeric DEFAULT 0;
  END IF;
  
  -- Documentos (URLs de upload)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'doc_rg_url') THEN
    ALTER TABLE staff ADD COLUMN doc_rg_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'doc_cpf_url') THEN
    ALTER TABLE staff ADD COLUMN doc_cpf_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'doc_comprovante_endereco_url') THEN
    ALTER TABLE staff ADD COLUMN doc_comprovante_endereco_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'doc_cnh_url') THEN
    ALTER TABLE staff ADD COLUMN doc_cnh_url text;
  END IF;
  
  -- Dados Bancários
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'banco') THEN
    ALTER TABLE staff ADD COLUMN banco text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'agencia') THEN
    ALTER TABLE staff ADD COLUMN agencia text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'conta') THEN
    ALTER TABLE staff ADD COLUMN conta text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'pix') THEN
    ALTER TABLE staff ADD COLUMN pix text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'updated_at') THEN
    ALTER TABLE staff ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Função para calcular salários automaticamente
CREATE OR REPLACE FUNCTION calculate_staff_salaries()
RETURNS TRIGGER AS $$
BEGIN
  -- Copiar salario para salario_mensal se não estiver definido
  IF NEW.salario_mensal = 0 OR NEW.salario_mensal IS NULL THEN
    NEW.salario_mensal := COALESCE(NEW.salario, 0);
  END IF;
  
  -- Calcular salário diário
  IF NEW.dias_mes > 0 THEN
    NEW.salario_diario := NEW.salario_mensal / NEW.dias_mes;
  END IF;
  
  -- Calcular salário por hora
  IF NEW.dias_mes > 0 AND NEW.horas_dia > 0 THEN
    NEW.salario_hora := NEW.salario_mensal / (NEW.dias_mes * NEW.horas_dia);
    NEW.custo_hora := NEW.salario_hora;
  END IF;
  
  -- Calcular salário semanal (6 dias)
  NEW.salario_semanal := NEW.salario_diario * 6;
  
  -- Calcular salário quinzenal
  NEW.salario_quinzenal := NEW.salario_mensal / 2;
  
  -- Atualizar salario base
  NEW.salario := NEW.salario_mensal;
  
  -- Atualizar timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para cálculo automático
DROP TRIGGER IF EXISTS trigger_calculate_staff_salaries ON staff;
CREATE TRIGGER trigger_calculate_staff_salaries
  BEFORE INSERT OR UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION calculate_staff_salaries();
