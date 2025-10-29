# 🚀 O QUE FAZER AGORA - PASSO A PASSO

## ✅ SITUAÇÃO ATUAL
Você está no Supabase SQL Editor com um erro de função.

---

## 📋 PASSO A PASSO (5 MINUTOS)

### **PASSO 1: CORRIGIR ERROS DE COLUNAS** ⚡

No Supabase SQL Editor, **APAGUE TUDO** e cole este SQL:

```sql
-- CORREÇÃO RÁPIDA: Adicionar colunas faltantes

-- service_order_materials
ALTER TABLE service_order_materials
ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS material_unit TEXT DEFAULT 'un',
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2) DEFAULT 0;

ALTER TABLE service_order_materials
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) GENERATED ALWAYS AS (unit_cost * quantity) STORED,
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED;

-- service_order_labor
ALTER TABLE service_order_labor
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hours DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) GENERATED ALWAYS AS (hourly_rate * hours) STORED,
ADD COLUMN IF NOT EXISTS nome_funcionario TEXT;

-- service_order_items
ALTER TABLE service_order_items
ADD COLUMN IF NOT EXISTS escopo_detalhado TEXT,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2) DEFAULT 0;

-- Verificar
SELECT '✅ COLUNAS CORRIGIDAS!' as resultado;
```

**➤ Apertar RUN (ou CTRL+Enter)**

**➤ Deve aparecer: "✅ COLUNAS CORRIGIDAS!"**

---

### **PASSO 2: INSTALAR SISTEMA DE CENTRO DE CUSTOS** 📊

No mesmo SQL Editor, **APAGUE TUDO** novamente e cole este SQL:

```sql
-- =====================================================
-- SISTEMA DE CENTRO DE CUSTOS E ROI
-- =====================================================

-- PARTE 1: Criar tabela de centros de custo
CREATE TABLE IF NOT EXISTS cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id uuid REFERENCES cost_centers(id) ON DELETE SET NULL,
  department TEXT,
  manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  budget_monthly DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cost_centers_code ON cost_centers(code);
CREATE INDEX IF NOT EXISTS idx_cost_centers_parent ON cost_centers(parent_id);
CREATE INDEX IF NOT EXISTS idx_cost_centers_active ON cost_centers(is_active);

-- Inserir centros de custo
INSERT INTO cost_centers (code, name, description, department) VALUES
('CC-001', 'Operações', 'Custos operacionais gerais', 'Operacional'),
('CC-002', 'Manutenção', 'Serviços de manutenção', 'Operacional'),
('CC-003', 'Instalação', 'Serviços de instalação', 'Operacional'),
('CC-004', 'Garantia', 'Atendimentos em garantia', 'Pós-Venda'),
('CC-005', 'Emergência', 'Atendimentos emergenciais', 'Operacional'),
('CC-006', 'Comercial', 'Atividades comerciais', 'Vendas'),
('CC-007', 'Administrativo', 'Custos administrativos', 'Administrativo'),
('CC-008', 'Logística', 'Transporte e deslocamento', 'Operacional'),
('CC-009', 'Treinamento', 'Capacitação de equipe', 'RH'),
('CC-010', 'Marketing', 'Marketing e vendas', 'Comercial')
ON CONFLICT (code) DO NOTHING;

-- PARTE 2: Expandir service_order_costs
ALTER TABLE service_order_costs
ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES cost_centers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_warranty BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_planned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- PARTE 3: Adicionar campos em service_orders
ALTER TABLE service_orders
ADD COLUMN IF NOT EXISTS cost_center_id uuid REFERENCES cost_centers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS planned_cost DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS roi DECIMAL(8,2) DEFAULT 0;

-- PARTE 4: Função para calcular financials
CREATE OR REPLACE FUNCTION calculate_service_order_financials(order_id uuid)
RETURNS TABLE (
  planned_cost DECIMAL,
  actual_cost DECIMAL,
  revenue DECIMAL,
  profit DECIMAL,
  profit_margin DECIMAL,
  roi DECIMAL,
  additional_costs DECIMAL
) AS $$
DECLARE
  v_cost_materials DECIMAL := 0;
  v_cost_labor DECIMAL := 0;
  v_cost_extras DECIMAL := 0;
  v_revenue DECIMAL := 0;
  v_planned DECIMAL := 0;
  v_actual DECIMAL := 0;
  v_profit DECIMAL := 0;
  v_margin DECIMAL := 0;
  v_roi DECIMAL := 0;
BEGIN
  SELECT COALESCE(SUM(total_cost), 0) INTO v_cost_materials
  FROM service_order_materials WHERE service_order_id = order_id;

  SELECT COALESCE(SUM(total_cost), 0) INTO v_cost_labor
  FROM service_order_labor WHERE service_order_id = order_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_cost_extras
  FROM service_order_costs WHERE service_order_id = order_id;

  SELECT COALESCE(total_value, 0) INTO v_revenue
  FROM service_orders WHERE id = order_id;

  v_planned := v_cost_materials + v_cost_labor;
  v_actual := v_planned + v_cost_extras;
  v_profit := v_revenue - v_actual;

  IF v_revenue > 0 THEN
    v_margin := (v_profit / v_revenue) * 100;
  END IF;

  IF v_actual > 0 THEN
    v_roi := ((v_revenue - v_actual) / v_actual) * 100;
  END IF;

  RETURN QUERY SELECT v_planned, v_actual, v_revenue, v_profit, v_margin, v_roi, v_cost_extras;
END;
$$ LANGUAGE plpgsql;

-- PARTE 5: Trigger para atualizar automaticamente
CREATE OR REPLACE FUNCTION update_service_order_financials()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id uuid;
  v_financials RECORD;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.service_order_id;
  ELSE
    v_order_id := NEW.service_order_id;
  END IF;

  SELECT * INTO v_financials FROM calculate_service_order_financials(v_order_id);

  UPDATE service_orders SET
    planned_cost = v_financials.planned_cost,
    actual_cost = v_financials.actual_cost,
    revenue = v_financials.revenue,
    profit = v_financials.profit,
    profit_margin = v_financials.profit_margin,
    roi = v_financials.roi,
    total_additional_costs = v_financials.additional_costs,
    updated_at = NOW()
  WHERE id = v_order_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DROP TRIGGER IF EXISTS trigger_update_financials_on_materials ON service_order_materials;
CREATE TRIGGER trigger_update_financials_on_materials
  AFTER INSERT OR UPDATE OR DELETE ON service_order_materials
  FOR EACH ROW EXECUTE FUNCTION update_service_order_financials();

DROP TRIGGER IF EXISTS trigger_update_financials_on_labor ON service_order_labor;
CREATE TRIGGER trigger_update_financials_on_labor
  AFTER INSERT OR UPDATE OR DELETE ON service_order_labor
  FOR EACH ROW EXECUTE FUNCTION update_service_order_financials();

DROP TRIGGER IF EXISTS trigger_update_financials_on_costs ON service_order_costs;
CREATE TRIGGER trigger_update_financials_on_costs
  AFTER INSERT OR UPDATE OR DELETE ON service_order_costs
  FOR EACH ROW EXECUTE FUNCTION update_service_order_financials();

-- PARTE 6: View de análise
CREATE OR REPLACE VIEW v_service_order_profitability AS
SELECT
  so.id,
  so.order_number,
  so.client_name,
  so.status,
  so.service_type,
  cc.name as cost_center_name,
  cc.department,
  so.total_value as revenue,
  so.planned_cost,
  so.actual_cost,
  so.total_additional_costs as extra_costs,
  so.profit,
  so.profit_margin,
  so.roi,
  (so.actual_cost - so.planned_cost) as cost_variance,
  CASE WHEN so.planned_cost > 0 THEN
    ((so.actual_cost - so.planned_cost) / so.planned_cost * 100)
  ELSE 0 END as cost_variance_percent,
  CASE
    WHEN so.roi >= 50 THEN 'Excelente'
    WHEN so.roi >= 30 THEN 'Bom'
    WHEN so.roi >= 15 THEN 'Regular'
    WHEN so.roi >= 0 THEN 'Baixo'
    ELSE 'Prejuízo'
  END as roi_classification,
  so.created_at,
  so.service_date,
  so.completion_date,
  (SELECT COALESCE(SUM(total_cost), 0) FROM service_order_materials WHERE service_order_id = so.id) as material_costs,
  (SELECT COALESCE(SUM(total_cost), 0) FROM service_order_labor WHERE service_order_id = so.id) as labor_costs,
  (SELECT COALESCE(SUM(amount), 0) FROM service_order_costs WHERE service_order_id = so.id AND is_warranty = true) as warranty_costs,
  (SELECT COUNT(*) FROM service_order_costs WHERE service_order_id = so.id) as extra_cost_count
FROM service_orders so
LEFT JOIN cost_centers cc ON cc.id = so.cost_center_id
WHERE so.status NOT IN ('cancelada', 'excluida');

-- PARTE 7: View ROI por tipo
CREATE OR REPLACE VIEW v_service_roi_by_type AS
SELECT
  service_type,
  COUNT(*) as total_services,
  COUNT(CASE WHEN status = 'concluido' THEN 1 END) as completed_services,
  SUM(revenue) as total_revenue,
  AVG(revenue) as avg_revenue,
  SUM(planned_cost) as total_planned_cost,
  SUM(actual_cost) as total_actual_cost,
  SUM(extra_costs) as total_extra_costs,
  AVG(actual_cost) as avg_actual_cost,
  SUM(profit) as total_profit,
  AVG(profit) as avg_profit,
  AVG(profit_margin) as avg_margin,
  AVG(roi) as avg_roi,
  CASE
    WHEN AVG(roi) >= 50 THEN 'Tipo A - Excelente'
    WHEN AVG(roi) >= 30 THEN 'Tipo B - Bom'
    WHEN AVG(roi) >= 15 THEN 'Tipo C - Regular'
    ELSE 'Tipo D - Revisar'
  END as service_classification
FROM v_service_order_profitability
GROUP BY service_type
ORDER BY avg_roi DESC;

-- RLS
ALTER TABLE cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all read cost_centers" ON cost_centers FOR SELECT USING (true);
CREATE POLICY "Allow all insert cost_centers" ON cost_centers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update cost_centers" ON cost_centers FOR UPDATE USING (true);

-- Grants
GRANT SELECT ON v_service_order_profitability TO authenticated, anon;
GRANT SELECT ON v_service_roi_by_type TO authenticated, anon;
GRANT ALL ON cost_centers TO authenticated;
GRANT SELECT ON cost_centers TO anon;

-- Verificar
SELECT '✅ SISTEMA DE CENTRO DE CUSTOS INSTALADO!' as resultado;
```

**➤ Apertar RUN**

**➤ Deve aparecer: "✅ SISTEMA DE CENTRO DE CUSTOS INSTALADO!"**

---

### **PASSO 3: TESTAR SE FUNCIONOU** ✅

Cole este SQL para testar:

```sql
-- Verificar centros de custo criados
SELECT code, name, department FROM cost_centers ORDER BY code;

-- Ver serviços mais lucrativos
SELECT
  service_type,
  completed_services,
  avg_roi,
  service_classification
FROM v_service_roi_by_type
ORDER BY avg_roi DESC;

-- Ver status das OSs
SELECT
  order_number,
  client_name,
  revenue,
  profit,
  roi
FROM v_service_order_profitability
LIMIT 10;
```

**➤ Apertar RUN**

**➤ Deve mostrar dados das OSs com ROI calculado!**

---

### **PASSO 4: VOLTAR AO SISTEMA E TESTAR** 🚀

Agora volte ao seu sistema (F5 para recarregar) e tente:

1. **Editar uma OS**
2. **Adicionar custos extras**
3. **Salvar a OS**

Deve funcionar sem erros!

---

## 🎯 RESUMO RÁPIDO

```
1️⃣ Executar SQL de correção de colunas
   ↓
2️⃣ Executar SQL de centro de custos
   ↓
3️⃣ Testar com queries de verificação
   ↓
4️⃣ Voltar ao sistema (F5)
   ↓
5️⃣ Tentar salvar OS
   ↓
✅ FUNCIONA!
```

---

## 📊 DEPOIS QUE INSTALAR

Você poderá:

### **1. Ver qual serviço é mais lucrativo:**
```sql
SELECT service_type, avg_roi, service_classification
FROM v_service_roi_by_type
ORDER BY avg_roi DESC;
```

### **2. Registrar custos extras:**
```sql
INSERT INTO service_order_costs (
  service_order_id,
  category,
  description,
  amount,
  is_warranty
) VALUES (
  'uuid-da-os',
  'combustivel',
  'Combustível extra',
  150.00,
  false
);
```

### **3. Ver ROI de cada OS:**
```sql
SELECT order_number, client_name, revenue, profit, roi
FROM v_service_order_profitability
ORDER BY roi DESC;
```

---

## ❓ SE DER ERRO

### **Erro: "column does not exist"**
➤ Executar PASSO 1 novamente

### **Erro: "relation does not exist"**
➤ Executar PASSO 2 novamente

### **Erro: "function does not exist"**
➤ Executar PASSO 2 novamente (tem as funções)

---

## 🚀 COMECE AGORA

**➤ PASSO 1: Copie o SQL do PASSO 1 acima**
**➤ PASSO 2: Cole no Supabase SQL Editor**
**➤ PASSO 3: Clique em RUN**

**Faça isso AGORA!** ⚡
