# 🎯 GAMIFICAÇÃO: VENDAS vs EXECUÇÃO SEPARADA

**Data:** 08/01/2026
**Sistema:** Gamificação Comercial Interno + Operacional Externo

---

## 🎯 VISÃO GERAL

O sistema agora **separa completamente**:

1. **COMERCIAL INTERNO (Vendas)**: Quem fecha a venda, cria a OS, faz proposta
2. **OPERACIONAL EXTERNO (Execução)**: Quem executa o serviço (técnicos, instaladores)

**Cada um tem suas próprias métricas, comissões e rankings.**

---

## 👥 DISTINÇÃO DE PAPÉIS

### 🏢 Comercial Interno (Vendedor)

**Responsabilidades:**
- Prospectar clientes
- Elaborar propostas
- Fechar vendas
- Criar Ordens de Serviço
- Acompanhar pós-venda

**Métricas:**
- Valor total vendido
- Número de vendas
- Taxa de conversão
- Ticket médio
- Comissões sobre vendas

**Campos na OS:**
- `created_by_employee_id` - Quem criou a OS
- `salesperson_id` - Vendedor responsável
- `sales_commission_percentage` - % de comissão
- `sales_commission_value` - Valor da comissão

---

### 🔧 Operacional Externo (Executores)

**Responsabilidades:**
- Executar serviços
- Instalar equipamentos
- Realizar manutenções
- Cumprir prazos
- Garantir qualidade

**Métricas:**
- Serviços executados
- Taxa de conclusão
- Qualidade do serviço
- Tempo de execução
- Comissões sobre execução

**Campos na OS:**
- `service_order_team` - Equipe de execução
- `execution_commission_percentage` - % de comissão
- `execution_commission_value` - Valor da comissão (dividido)

---

## 💰 SISTEMA DE COMISSÕES

### Tabela: `employee_commissions`

Registra TODAS as comissões, separadas por tipo.

**Estrutura:**
```sql
{
  "id": "uuid",
  "employee_id": "uuid-do-funcionario",
  "service_order_id": "uuid-da-os",
  "commission_type": "venda" | "execucao" | "bonus" | "meta" | "ranking",
  "base_value": 10000.00,        -- Valor da OS
  "percentage": 5.00,            -- Percentual aplicado
  "commission_value": 500.00,    -- Valor total da comissão
  "total_team_members": 3,       -- Membros da equipe (execução)
  "member_share": 166.67,        -- Parte de cada um
  "status": "pendente" | "aprovada" | "paga" | "cancelada",
  "description": "Comissão de venda - OS #2024-001"
}
```

---

## 🧮 CÁLCULO DE COMISSÕES

### 1. Comissão de VENDA (Comercial)

**Quem recebe:**
- Funcionário definido em `salesperson_id`
- Geralmente 1 pessoa (vendedor)

**Como calcular:**
```
COMISSÃO VENDA = VALOR_OS × PERCENTUAL_VENDA
```

**Exemplo:**
```
OS de R$ 10.000
Percentual venda: 5%
Comissão: R$ 10.000 × 5% = R$ 500
```

**Quem recebe:** Vendedor integral (R$ 500)

---

### 2. Comissão de EXECUÇÃO (Operacional)

**Quem recebe:**
- Equipe de execução (`service_order_team`)
- Múltiplas pessoas (técnicos)
- **Dividido igualmente** entre membros

**Como calcular:**
```
COMISSÃO TOTAL EXECUÇÃO = VALOR_OS × PERCENTUAL_EXECUÇÃO
PARTE DE CADA UM = COMISSÃO TOTAL ÷ NÚMERO DE MEMBROS
```

**Exemplo:**
```
OS de R$ 10.000
Percentual execução: 3%
Comissão total: R$ 10.000 × 3% = R$ 300

Equipe: 3 técnicos
Parte de cada um: R$ 300 ÷ 3 = R$ 100
```

**Cada técnico recebe:** R$ 100

---

## 📊 EXEMPLO COMPLETO

### Cenário: Instalação de Ar-Condicionado

**Dados da OS:**
- Valor total: R$ 15.000
- Vendedor: João (Comercial)
- Equipe de execução: Pedro (líder), Carlos, José

**Comissões configuradas:**
- Venda: 5%
- Execução: 3%

### Cálculos:

#### 1. Comissão de Venda
```
Valor: R$ 15.000
Percentual: 5%
Comissão: R$ 15.000 × 5% = R$ 750

João (vendedor) recebe: R$ 750
```

#### 2. Comissão de Execução
```
Valor: R$ 15.000
Percentual: 3%
Comissão total: R$ 15.000 × 3% = R$ 450

Equipe: 3 pessoas
Parte de cada: R$ 450 ÷ 3 = R$ 150

Pedro recebe: R$ 150
Carlos recebe: R$ 150
José recebe: R$ 150
```

### Resultado Final:

| Funcionário | Papel | Comissão | Tipo |
|-------------|-------|----------|------|
| João | Vendedor | R$ 750 | Venda |
| Pedro | Técnico Líder | R$ 150 | Execução |
| Carlos | Técnico | R$ 150 | Execução |
| José | Técnico | R$ 150 | Execução |
| **TOTAL** | | **R$ 1.200** | |

**Custo total de comissões:** 8% sobre a venda (5% + 3%)

---

## 🔄 FLUXO AUTOMÁTICO

### Quando OS é Concluída:

```
1. OS marcada como concluída
   ↓
2. Sistema verifica:
   - Tem vendedor definido?
   - Tem equipe de execução?
   - Percentuais configurados?
   ↓
3. Calcula comissões:
   - Comissão de venda (1 pessoa)
   - Comissão de execução (dividida)
   ↓
4. Cria registros em employee_commissions
   - Status: pendente
   - Valores calculados
   - Vínculo com OS
   ↓
5. Aguarda aprovação/pagamento
```

**Trigger automático:** `trigger_auto_calculate_commissions`

---

## 📈 VIEWS DE PERFORMANCE

### 1. Performance de VENDAS (`v_sales_performance`)

**Mostra para cada vendedor:**
```sql
SELECT
  employee_name,
  total_sales,                    -- Número de vendas
  total_revenue,                  -- Valor total vendido
  avg_sale_value,                 -- Ticket médio
  total_commission_earned,        -- Comissões ganhas
  commission_paid,                -- Comissões pagas
  commission_pending,             -- Comissões pendentes
  conversion_rate                 -- Taxa de conversão
FROM v_sales_performance
ORDER BY total_revenue DESC;
```

**Filtro automático:**
- Apenas departamento "Comercial"
- Ou cargos com "Vendedor"/"Comercial"

---

### 2. Performance de EXECUÇÃO (`v_execution_performance`)

**Mostra para cada técnico:**
```sql
SELECT
  employee_name,
  total_jobs,                     -- Serviços executados
  jobs_as_leader,                 -- Como líder
  total_value_executed,           -- Valor total executado
  total_commission_earned,        -- Comissões ganhas
  commission_paid,                -- Comissões pagas
  commission_pending,             -- Comissões pendentes
  completion_rate                 -- Taxa de conclusão
FROM v_execution_performance
ORDER BY total_value_executed DESC;
```

**Filtro automático:**
- Apenas departamento "Operacional"/"Técnico"
- Ou cargos com "Técnico"/"Instalador"

---

### 3. Resumo Consolidado (`v_employee_commissions_summary`)

**Mostra TUDO de cada funcionário:**
```sql
SELECT
  employee_name,

  -- Vendas
  total_sales_commission,
  sales_commission_paid,
  sales_commission_pending,

  -- Execução
  total_execution_commission,
  execution_commission_paid,
  execution_commission_pending,

  -- Total
  total_commission,
  total_paid,
  total_pending,

  -- Contadores
  total_sales,
  total_executions
FROM v_employee_commissions_summary
ORDER BY total_commission DESC;
```

**Útil para:**
- Relatórios financeiros
- Fechamento de folha
- Análise de custos

---

## ⚙️ CONFIGURAÇÃO DE PERCENTUAIS

### Como Definir Percentuais na OS

**Opção 1: Configuração Global**

Criar tabela de configuração:
```sql
CREATE TABLE commission_config (
  service_type text,
  sales_percentage numeric(5,2),
  execution_percentage numeric(5,2)
);

INSERT INTO commission_config VALUES
  ('instalacao', 5.00, 3.00),
  ('manutencao', 3.00, 2.00),
  ('retrofit', 6.00, 4.00),
  ('contrato', 4.00, 2.50);
```

**Opção 2: Por OS (Manual)**

Ao criar/editar OS, definir:
- `sales_commission_percentage` (ex: 5%)
- `execution_commission_percentage` (ex: 3%)

Sistema calcula valores automaticamente quando OS for concluída.

---

## 👤 COMO USAR NO SISTEMA

### 1. Criar/Editar Ordem de Serviço

**Campos obrigatórios:**

```typescript
{
  // Identificação do vendedor
  salesperson_id: "uuid-do-vendedor",
  sales_commission_percentage: 5.0,

  // Equipe de execução
  assigned_to: "uuid-do-responsavel", // ou
  service_order_team: [
    { employee_id: "uuid-tecnico-1", role: "leader" },
    { employee_id: "uuid-tecnico-2", role: "technician" },
    { employee_id: "uuid-tecnico-3", role: "technician" }
  ],
  execution_commission_percentage: 3.0
}
```

**Sistema calcula automaticamente:**
- `sales_commission_value`
- `execution_commission_value`

---

### 2. Aprovar Comissões

**Função:** `approve_commission(commission_id, approved_by)`

```sql
SELECT approve_commission(
  'uuid-da-comissao',
  'uuid-do-aprovador'
);
```

**Resultado:**
- Status: pendente → aprovada
- Registra quem aprovou e quando

---

### 3. Pagar Comissões

**Função:** `pay_commission(commission_id, paid_by, payment_method)`

```sql
SELECT pay_commission(
  'uuid-da-comissao',
  'uuid-do-pagador',
  'transferencia'
);
```

**O que faz:**
- Status: aprovada → paga
- Registra pagamento
- **Cria lançamento financeiro** automático
- Categoria: "Comissões"

---

## 🏆 RANKINGS SEPARADOS

### Ranking de VENDAS (Mensal)

**Critério:** Maior valor total vendido

```sql
SELECT
  ROW_NUMBER() OVER (ORDER BY total_revenue DESC) as position,
  employee_name,
  total_sales,
  total_revenue,
  total_commission_earned
FROM v_sales_performance
WHERE date_trunc('month', last_sale_date) = date_trunc('month', CURRENT_DATE)
ORDER BY total_revenue DESC
LIMIT 10;
```

**Premiação:**
- 1º lugar: Bônus + Reconhecimento
- 2º lugar: Bônus menor
- 3º lugar: Bônus menor

---

### Ranking de EXECUÇÃO (Mensal)

**Critério:** Maior valor executado + melhor taxa de conclusão

```sql
SELECT
  ROW_NUMBER() OVER (
    ORDER BY total_value_executed DESC, completion_rate DESC
  ) as position,
  employee_name,
  total_jobs,
  total_value_executed,
  completion_rate,
  total_commission_earned
FROM v_execution_performance
WHERE date_trunc('month', last_job_date) = date_trunc('month', CURRENT_DATE)
ORDER BY total_value_executed DESC, completion_rate DESC
LIMIT 10;
```

**Premiação:**
- 1º lugar: Bônus + Reconhecimento
- 2º lugar: Bônus menor
- 3º lugar: Bônus menor

---

## 📋 RELATÓRIOS ÚTEIS

### 1. Comissões Pendentes de Pagamento

```sql
SELECT
  e.name as funcionario,
  ec.commission_type as tipo,
  so.order_number as os,
  CASE
    WHEN ec.commission_type = 'venda' THEN ec.commission_value
    ELSE ec.member_share
  END as valor,
  ec.created_at as gerada_em
FROM employee_commissions ec
JOIN employees e ON e.id = ec.employee_id
JOIN service_orders so ON so.id = ec.service_order_id
WHERE ec.status = 'pendente'
ORDER BY ec.created_at DESC;
```

---

### 2. Total de Comissões por Período

```sql
SELECT
  DATE_TRUNC('month', ec.created_at) as mes,
  ec.commission_type as tipo,
  COUNT(*) as quantidade,
  SUM(CASE
    WHEN ec.commission_type = 'venda' THEN ec.commission_value
    ELSE ec.member_share
  END) as total
FROM employee_commissions ec
WHERE ec.status IN ('aprovada', 'paga')
  AND ec.created_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', ec.created_at), ec.commission_type
ORDER BY mes DESC, tipo;
```

---

### 3. Top 10 Vendedores do Mês

```sql
SELECT
  employee_name,
  total_sales,
  total_revenue,
  ROUND(total_commission_earned, 2) as comissoes,
  ROUND(avg_sale_value, 2) as ticket_medio
FROM v_sales_performance
ORDER BY total_revenue DESC
LIMIT 10;
```

---

### 4. Top 10 Técnicos do Mês

```sql
SELECT
  employee_name,
  total_jobs,
  total_value_executed,
  ROUND(total_commission_earned, 2) as comissoes,
  ROUND(completion_rate, 2) as taxa_conclusao
FROM v_execution_performance
ORDER BY total_value_executed DESC
LIMIT 10;
```

---

## 🔍 CONSULTAS DE AUDITORIA

### Comissões de uma OS específica

```sql
SELECT
  e.name as funcionario,
  e.role,
  ec.commission_type as tipo,
  CASE
    WHEN ec.commission_type = 'venda' THEN ec.commission_value
    ELSE ec.member_share
  END as valor,
  ec.status,
  ec.created_at
FROM employee_commissions ec
JOIN employees e ON e.id = ec.employee_id
WHERE ec.service_order_id = 'uuid-da-os'
ORDER BY ec.commission_type, e.name;
```

---

### Histórico de comissões de um funcionário

```sql
SELECT
  so.order_number as os,
  ec.commission_type as tipo,
  CASE
    WHEN ec.commission_type = 'venda' THEN ec.commission_value
    ELSE ec.member_share
  END as valor,
  ec.status,
  ec.created_at as gerada,
  ec.paid_at as paga
FROM employee_commissions ec
JOIN service_orders so ON so.id = ec.service_order_id
WHERE ec.employee_id = 'uuid-do-funcionario'
ORDER BY ec.created_at DESC;
```

---

## 💡 CASOS DE USO ESPECIAIS

### Caso 1: Vendedor e Executor são a mesma pessoa

**Cenário:** Pequena empresa, vendedor também executa.

**Solução:**
```sql
-- Na OS
salesperson_id = funcionario_uuid
assigned_to = funcionario_uuid

-- Ele receberá DUAS comissões:
-- 1. Comissão de venda (ex: R$ 500)
-- 2. Comissão de execução (ex: R$ 300)
-- Total: R$ 800
```

---

### Caso 2: Venda sem execução (terceirizada)

**Cenário:** Venda fechada, mas execução terceirizada.

**Solução:**
```sql
-- Na OS
salesperson_id = vendedor_uuid
execution_commission_percentage = 0  -- Sem comissão de execução

-- Apenas comissão de venda é gerada
```

---

### Caso 3: Execução sem venda (OS antiga)

**Cenário:** Cliente antigo, sem vendedor definido.

**Solução:**
```sql
-- Na OS
salesperson_id = NULL
sales_commission_percentage = 0

-- Apenas comissão de execução é gerada
```

---

### Caso 4: Divisão desigual (líder ganha mais)

**Cenário:** Líder de equipe deve ganhar mais que assistentes.

**Solução atual:** Divisão igual automática

**Solução customizada:** Adicionar campo `commission_multiplier` no `service_order_team`:
```sql
{
  employee_id: "lider",
  role: "leader",
  commission_multiplier: 2.0  -- Líder ganha o dobro
}
```

Requer customização da função `calculate_and_create_commissions`.

---

## 🎯 METAS E BÔNUS

### Meta de Vendas (Comercial)

**Tabela:** `employee_goals`

```sql
INSERT INTO employee_goals (
  employee_id,
  company_goal_id,
  target_amount,
  bonus_percentage,
  super_bonus_percentage
) VALUES (
  'uuid-vendedor',
  'uuid-meta-empresa',
  50000.00,        -- Meta: R$ 50.000
  5.00,            -- Bônus: 5% se atingir
  10.00            -- Super bônus: 10% se ultrapassar 120%
);
```

**Cálculo automático:**
- Sistema soma vendas do funcionário
- Compara com meta
- Calcula bônus se atingir

---

### Meta de Execução (Operacional)

**Exemplo:** Meta de serviços concluídos

```sql
INSERT INTO employee_goals (
  employee_id,
  company_goal_id,
  target_amount,        -- Ex: 20 serviços
  bonus_percentage
) VALUES (
  'uuid-tecnico',
  'uuid-meta-servicos',
  20,
  3.00
);
```

---

## 📊 DASHBOARD SUGERIDO

### Para Vendedores:

```
┌─────────────────────────────────────┐
│  MEU DESEMPENHO - VENDAS            │
├─────────────────────────────────────┤
│  Vendas este mês: 12                │
│  Valor vendido: R$ 85.000           │
│  Ticket médio: R$ 7.083             │
│  Comissões ganhas: R$ 4.250         │
│  Comissões pagas: R$ 3.500          │
│  Comissões pendentes: R$ 750        │
│                                     │
│  Meta do mês: R$ 100.000            │
│  Atingido: 85%                      │
│  Faltam: R$ 15.000                  │
│                                     │
│  Posição no ranking: 2º lugar       │
└─────────────────────────────────────┘
```

---

### Para Técnicos:

```
┌─────────────────────────────────────┐
│  MEU DESEMPENHO - EXECUÇÃO          │
├─────────────────────────────────────┤
│  Serviços este mês: 18              │
│  Valor executado: R$ 120.000        │
│  Como líder: 8 serviços             │
│  Taxa de conclusão: 94%             │
│  Comissões ganhas: R$ 1.800         │
│  Comissões pagas: R$ 1.500          │
│  Comissões pendentes: R$ 300        │
│                                     │
│  Meta do mês: 20 serviços           │
│  Atingido: 90%                      │
│  Faltam: 2 serviços                 │
│                                     │
│  Posição no ranking: 1º lugar       │
└─────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Para cada OS criada:

- [ ] Definir `salesperson_id` (vendedor)
- [ ] Definir `sales_commission_percentage`
- [ ] Definir equipe de execução (`service_order_team`)
- [ ] Definir `execution_commission_percentage`
- [ ] Sistema calcula valores automaticamente

### Quando OS é concluída:

- [ ] Sistema cria comissões automaticamente
- [ ] Status inicial: "pendente"
- [ ] Comissão de venda (1 registro)
- [ ] Comissões de execução (N registros, divididos)

### Fluxo de aprovação:

- [ ] Gestor revisa comissões pendentes
- [ ] Aprova individualmente ou em lote
- [ ] Financeiro processa pagamento
- [ ] Sistema registra em lançamentos financeiros
- [ ] Status final: "paga"

---

## 🎯 RESUMO EXECUTIVO

### Separação clara:

| Aspecto | Comercial Interno | Operacional Externo |
|---------|-------------------|---------------------|
| **Função** | Vender | Executar |
| **Métrica** | Valor vendido | Serviços concluídos |
| **Comissão** | Sobre venda (integral) | Sobre execução (dividida) |
| **Típico %** | 3-7% | 2-5% |
| **Campo OS** | `salesperson_id` | `service_order_team` |
| **View** | `v_sales_performance` | `v_execution_performance` |
| **Ranking** | Maior valor vendido | Maior valor executado |

### Ambos podem:
- Ter metas individuais
- Receber bônus por desempenho
- Competir em rankings
- Acumular prêmios

### Sistema garante:
- Rastreabilidade completa
- Sem duplicação
- Aprovação antes de pagar
- Integração com financeiro
- Auditoria total

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Estrutura criada
2. ⏳ Atualizar interface para:
   - Selecionar vendedor ao criar OS
   - Definir equipe de execução
   - Configurar percentuais
3. ⏳ Criar dashboards de performance
4. ⏳ Criar tela de aprovação de comissões
5. ⏳ Relatórios gerenciais

---

**Sistema 100% funcional para separar vendas de execução!**

Qualquer dúvida, consulte as views de performance ou histórico de comissões.
