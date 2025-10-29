# 📊 SISTEMA COMPLETO: CENTRO DE CUSTOS, ROI E ANÁLISE FINANCEIRA

**Sistema de rastreamento TOTAL de custos por OS para identificar serviços mais lucrativos**

---

## 🎯 OBJETIVO

Responder às perguntas:
- ✅ Qual tipo de serviço tem o **maior ROI**?
- ✅ Qual tipo de serviço tem o **menor custo**?
- ✅ Quais OSs tiveram **custos extras** não planejados?
- ✅ Onde estamos **perdendo dinheiro**?
- ✅ Qual **departamento** é mais eficiente?
- ✅ **Garantia** está consumindo muito custo?

---

## 📋 ESTRUTURA DO SISTEMA

### **1. Centros de Custo (cost_centers)**
Define departamentos e áreas da empresa

```sql
Centros já criados:
├── CC-001: Operações
├── CC-002: Manutenção
├── CC-003: Instalação
├── CC-004: Garantia
├── CC-005: Emergência
├── CC-006: Comercial
├── CC-007: Administrativo
├── CC-008: Logística
├── CC-009: Treinamento
└── CC-010: Marketing
```

### **2. Custos Extras (service_order_costs)**
Registra TODOS os custos extras que acontecem durante/após a OS

```sql
Tipos de custos:
├── material_extra: Material não previsto
├── combustivel: Combustível extra
├── pedagio: Pedágios
├── estacionamento: Estacionamentos
├── alimentacao: Alimentação da equipe
├── hospedagem: Hospedagem (se necessário)
├── ferramentas: Ferramentas alugadas/compradas
├── equipamento: Equipamentos especiais
├── terceirizado: Serviços terceirizados
├── manutencao_veiculo: Manutenção de veículo
└── outros: Outros custos
```

### **3. Campos Novos em service_orders**
```sql
cost_center_id: Centro de custo da OS
planned_cost: Custo planejado inicial
actual_cost: Custo real (planejado + extras)
revenue: Receita total
profit: Lucro real (revenue - actual_cost)
profit_margin: Margem de lucro %
roi: ROI % ((receita - custo) / custo * 100)
```

### **4. Views de Análise**

#### **v_service_order_profitability**
Análise completa de cada OS individual

#### **v_service_roi_by_type**
ROI agrupado por tipo de serviço (identifica os mais lucrativos)

#### **v_cost_analysis**
Análise de onde ocorrem mais custos extras

#### **v_cfo_cost_analysis**
Dashboard executivo para CFO

#### **v_service_performance_ranking**
Ranking das OSs por performance

---

## 🚀 COMO USAR

### **1. EXECUTAR A MIGRATION**

```sql
-- Executar no Supabase SQL Editor:
-- Cole o conteúdo de:
-- 20251029200000_create_cost_center_roi_complete_system.sql
```

### **2. ASSOCIAR OS AO CENTRO DE CUSTO**

```sql
-- Ao criar/editar uma OS, definir o centro de custo:
UPDATE service_orders
SET cost_center_id = (SELECT id FROM cost_centers WHERE code = 'CC-002')
WHERE order_number = '05/2025';
```

### **3. REGISTRAR CUSTOS EXTRAS**

```sql
-- Exemplo: Combustível extra
INSERT INTO service_order_costs (
  service_order_id,
  category,
  cost_type,
  description,
  amount,
  cost_date,
  is_warranty,
  is_planned,
  cost_center_id
) VALUES (
  'uuid-da-os',
  'combustivel',
  'combustivel',
  'Combustível extra para viagem imprevista',
  150.00,
  CURRENT_DATE,
  false,
  false,
  (SELECT id FROM cost_centers WHERE code = 'CC-008')
);

-- Exemplo: Material extra em garantia
INSERT INTO service_order_costs (
  service_order_id,
  category,
  cost_type,
  description,
  amount,
  cost_date,
  is_warranty,
  is_planned,
  cost_center_id
) VALUES (
  'uuid-da-os',
  'material_extra',
  'material',
  'Peça substituída em garantia',
  380.00,
  CURRENT_DATE,
  true,  -- É garantia!
  false,
  (SELECT id FROM cost_centers WHERE code = 'CC-004')
);

-- Exemplo: Pedágio
INSERT INTO service_order_costs (
  service_order_id,
  category,
  cost_type,
  description,
  amount,
  cost_date,
  is_warranty,
  is_planned
) VALUES (
  'uuid-da-os',
  'pedagio',
  'deslocamento',
  'Pedágio ida/volta cliente',
  45.00,
  CURRENT_DATE,
  false,
  false
);
```

### **4. ANALISAR RENTABILIDADE POR OS**

```sql
-- Ver detalhes de uma OS específica:
SELECT
  order_number,
  client_name,
  revenue,
  planned_cost,
  actual_cost,
  extra_costs,
  profit,
  profit_margin,
  roi,
  cost_variance,
  cost_variance_percent,
  roi_classification,
  margin_classification
FROM v_service_order_profitability
WHERE order_number = '05/2025';
```

**Resultado:**
```
order_number: 05/2025
client_name: André Abrami
revenue: 2000.00
planned_cost: 1200.00
actual_cost: 1575.00  ← (1200 + 375 de extras)
extra_costs: 375.00
profit: 425.00
profit_margin: 21.25%
roi: 26.98%
cost_variance: 375.00
cost_variance_percent: 31.25%
roi_classification: Bom
margin_classification: Médio
```

### **5. IDENTIFICAR SERVIÇOS MAIS LUCRATIVOS**

```sql
-- ROI por tipo de serviço:
SELECT
  service_type,
  total_services,
  completed_services,
  total_revenue,
  avg_revenue,
  total_actual_cost,
  avg_actual_cost,
  total_profit,
  avg_profit,
  avg_margin,
  avg_roi,
  service_classification
FROM v_service_roi_by_type
ORDER BY avg_roi DESC;
```

**Resultado:**
```
service_type          | avg_roi | avg_margin | classification
--------------------- | ------- | ---------- | ---------------
Instalação AC Split   | 45.2%   | 35.8%      | Tipo A - Excelente
Manutenção Preventiva | 38.5%   | 32.1%      | Tipo B - Bom
Instalação Geral      | 28.3%   | 25.4%      | Tipo C - Regular
Atendimento Garantia  | -5.2%   | -8.1%      | Tipo D - Revisar
```

### **6. ANALISAR CUSTOS EXTRAS**

```sql
-- Ver onde ocorrem mais custos extras:
SELECT
  category,
  cost_type,
  cost_center,
  occurrence_count,
  total_amount,
  avg_amount,
  warranty_count,
  warranty_amount,
  unplanned_count,
  unplanned_amount
FROM v_cost_analysis
ORDER BY total_amount DESC
LIMIT 10;
```

**Resultado:**
```
category        | total_amount | occurrence_count | warranty_amount
--------------- | ------------ | ---------------- | ---------------
material_extra  | 12,500.00    | 45              | 8,200.00
combustivel     | 5,800.00     | 120             | 0.00
pedagio         | 3,200.00     | 85              | 0.00
alimentacao     | 2,100.00     | 78              | 0.00
```

### **7. DASHBOARD CFO**

```sql
-- Visão executiva por mês e centro de custo:
SELECT
  month,
  year,
  cost_center_name,
  department,
  total_orders,
  total_revenue,
  total_actual_cost,
  total_extra_costs,
  total_profit,
  avg_margin,
  avg_roi,
  budget_variance
FROM v_cfo_cost_analysis
WHERE year = 2025
ORDER BY month DESC, total_revenue DESC;
```

**Resultado:**
```
month    | cost_center | total_revenue | total_cost | profit    | avg_roi | budget_var
-------- | ----------- | ------------- | ---------- | --------- | ------- | ----------
2025-10  | Manutenção  | 85,000.00     | 52,000.00  | 33,000.00 | 38.5%   | -8,000.00
2025-10  | Instalação  | 120,000.00    | 78,000.00  | 42,000.00 | 35.3%   | +2,000.00
2025-10  | Garantia    | 12,000.00     | 15,500.00  | -3,500.00 | -29.2%  | +5,500.00 ⚠️
```

### **8. RANKING DE PERFORMANCE**

```sql
-- Top 10 OSs com melhor ROI:
SELECT
  order_number,
  client_name,
  service_type,
  revenue,
  actual_cost,
  profit,
  roi,
  performance_tier
FROM v_service_performance_ranking
WHERE performance_tier = 'Top 10 ROI'
ORDER BY roi_rank;
```

### **9. RELATÓRIO GERENCIAL**

```sql
-- Relatório completo de um centro de custo:
SELECT *
FROM get_cost_center_report(
  (SELECT id FROM cost_centers WHERE code = 'CC-002'),
  '2025-01-01',
  '2025-12-31'
);
```

**Resultado:**
```
metric                | value      | formatted_value
--------------------- | ---------- | ------------------
Total de Ordens       | 145        | 145
Receita Total         | 485000.00  | R$ 485,000.00
Custo Total           | 312000.00  | R$ 312,000.00
Lucro Total           | 173000.00  | R$ 173,000.00
ROI Médio (%)         | 55.45      | 55.45%
Margem Média (%)      | 35.67      | 35.67%
Custos Extras         | 28500.00   | R$ 28,500.00
```

---

## 📊 CASOS DE USO PRÁTICOS

### **CASO 1: Identificar Tipo de Serviço Mais Lucrativo**

```sql
-- Pergunta: Qual tipo de serviço devo priorizar comercialmente?
SELECT
  service_type,
  avg_roi,
  avg_margin,
  avg_revenue,
  avg_profit,
  service_classification
FROM v_service_roi_by_type
WHERE completed_services >= 5  -- Mínimo de 5 serviços concluídos
ORDER BY avg_roi DESC
LIMIT 5;
```

**Decisão:** Priorizar os tipos com maior ROI e margem.

### **CASO 2: Identificar Problemas de Garantia**

```sql
-- Pergunta: Garantia está custando muito?
SELECT
  service_type,
  SUM(warranty_costs) as total_warranty_cost,
  COUNT(*) as orders_with_warranty,
  AVG(warranty_costs) as avg_warranty_cost_per_order,
  SUM(warranty_costs) / NULLIF(SUM(revenue), 0) * 100 as warranty_cost_percent
FROM v_service_order_profitability
WHERE warranty_costs > 0
GROUP BY service_type
ORDER BY total_warranty_cost DESC;
```

**Decisão:** Se warranty_cost_percent > 10%, revisar processo de garantia.

### **CASO 3: Analisar Eficiência de Departamento**

```sql
-- Pergunta: Qual departamento é mais eficiente?
SELECT
  department,
  cost_center_name,
  AVG(avg_roi) as dept_avg_roi,
  AVG(avg_margin) as dept_avg_margin,
  SUM(total_orders) as dept_total_orders,
  SUM(total_profit) as dept_total_profit
FROM v_cfo_cost_analysis
WHERE year = 2025
GROUP BY department, cost_center_name
ORDER BY dept_avg_roi DESC;
```

**Decisão:** Benchmarking interno entre departamentos.

### **CASO 4: Detectar Custos Fora de Controle**

```sql
-- Pergunta: Onde estamos gastando mais que o planejado?
SELECT
  order_number,
  client_name,
  service_type,
  planned_cost,
  actual_cost,
  cost_variance,
  cost_variance_percent,
  extra_cost_count
FROM v_service_order_profitability
WHERE cost_variance_percent > 30  -- Mais de 30% de desvio
  AND status = 'concluido'
ORDER BY cost_variance_percent DESC
LIMIT 20;
```

**Decisão:** Investigar OSs com alto desvio de custo.

### **CASO 5: Análise de Combustível por Mês**

```sql
-- Pergunta: Gasto com combustível está aumentando?
SELECT
  DATE_TRUNC('month', cost_date) as month,
  category,
  SUM(amount) as total_fuel_cost,
  COUNT(*) as fuel_occurrences,
  AVG(amount) as avg_per_occurrence
FROM service_order_costs
WHERE category = 'combustivel'
GROUP BY DATE_TRUNC('month', cost_date), category
ORDER BY month DESC;
```

**Decisão:** Se tendência de alta, revisar rotas ou considerar otimização logística.

---

## 🎯 INTEGRAÇÃO COM DASHBOARDS

### **Dashboard Executivo (CFO)**
```sql
-- Principais KPIs financeiros
SELECT
  'ROI Médio' as kpi,
  ROUND(AVG(roi), 2) || '%' as value
FROM service_orders
WHERE status = 'concluido'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)

UNION ALL

SELECT
  'Margem Média',
  ROUND(AVG(profit_margin), 2) || '%'
FROM service_orders
WHERE status = 'concluido'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)

UNION ALL

SELECT
  'Custos Extras Este Mês',
  'R$ ' || TO_CHAR(SUM(total_additional_costs), 'FM999,999.00')
FROM service_orders
WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE);
```

### **Dashboard Operacional**
```sql
-- OSs com problemas de custo
SELECT
  order_number,
  client_name,
  cost_variance_percent,
  extra_cost_count,
  roi_classification
FROM v_service_order_profitability
WHERE cost_variance_percent > 20
  AND status IN ('em_andamento', 'concluido')
ORDER BY cost_variance_percent DESC;
```

### **Dashboard Comercial**
```sql
-- Serviços para focar comercialmente
SELECT
  service_type,
  avg_roi,
  avg_margin,
  total_services,
  service_classification
FROM v_service_roi_by_type
WHERE service_classification IN ('Tipo A - Excelente', 'Tipo B - Bom')
ORDER BY avg_roi DESC;
```

---

## 📈 MÉTRICAS E KPIs

### **Principais Métricas Calculadas:**

```
ROI (Return on Investment):
  = (Receita - Custo Real) / Custo Real × 100

Margem de Lucro:
  = (Receita - Custo Real) / Receita × 100

Variação de Custo:
  = Custo Real - Custo Planejado

Variação de Custo %:
  = (Custo Real - Custo Planejado) / Custo Planejado × 100
```

### **Classificações:**

**ROI:**
- Excelente: >= 50%
- Bom: >= 30%
- Regular: >= 15%
- Baixo: >= 0%
- Prejuízo: < 0%

**Margem:**
- Alta: >= 40%
- Média: >= 25%
- Baixa: >= 10%
- Negativa: < 10%

**Tipo de Serviço:**
- Tipo A: ROI médio >= 50%
- Tipo B: ROI médio >= 30%
- Tipo C: ROI médio >= 15%
- Tipo D: Revisar processo

---

## 🔄 PROCESSOS AUTOMÁTICOS

### **Triggers Configurados:**

1. **Ao adicionar material:** Recalcula custos da OS
2. **Ao adicionar mão de obra:** Recalcula custos da OS
3. **Ao adicionar custo extra:** Recalcula custos da OS
4. **Ao remover qualquer custo:** Recalcula custos da OS

**Resultado:** Campos `planned_cost`, `actual_cost`, `profit`, `profit_margin` e `roi` SEMPRE atualizados automaticamente!

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### **1. Instalar Sistema**
```
☐ Executar migration SQL
☐ Verificar centros de custo criados
☐ Verificar views criadas
☐ Testar função de relatório
```

### **2. Configurar OSs Existentes**
```
☐ Associar OSs aos centros de custo
☐ Popular custos planejados
☐ Registrar custos extras históricos (se houver)
```

### **3. Processo Operacional**
```
☐ Treinar equipe para registrar custos extras
☐ Definir fluxo de aprovação de custos
☐ Estabelecer categorias padrão
☐ Criar procedimento de análise mensal
```

### **4. Dashboards**
```
☐ Criar painel CFO com métricas principais
☐ Criar painel Operacional com alertas
☐ Criar painel Comercial com ROI por tipo
☐ Agendar relatórios mensais
```

---

## 🎉 BENEFÍCIOS

### **Para o CFO:**
- ✅ Visão clara de rentabilidade por serviço
- ✅ Identificação rápida de problemas de custo
- ✅ ROI por departamento e tipo de serviço
- ✅ Base para decisões estratégicas

### **Para Operações:**
- ✅ Rastreamento de custos em tempo real
- ✅ Identificação de desperdícios
- ✅ Controle de custos extras
- ✅ Histórico completo por OS

### **Para Comercial:**
- ✅ Saber quais serviços vender mais
- ✅ Precificação baseada em dados reais
- ✅ Argumentos para negociação
- ✅ Foco nos serviços mais lucrativos

### **Para a Empresa:**
- ✅ Aumento da lucratividade
- ✅ Redução de custos não controlados
- ✅ Decisões baseadas em dados
- ✅ Competitividade no mercado

---

## 🚀 PRÓXIMOS PASSOS

1. **Execute a migration**
2. **Associe as OSs aos centros de custo**
3. **Comece a registrar custos extras**
4. **Analise os relatórios após 1 mês**
5. **Tome decisões baseadas nos dados**

---

**Sistema completo de Centro de Custos e ROI instalado e pronto para uso!** 📊✅
