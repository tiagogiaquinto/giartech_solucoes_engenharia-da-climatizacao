# Projeção de Caixa 30 Dias - Implementada para o Thomaz

## 🎯 Objetivo

Implementar sistema completo de projeção de caixa para os próximos 30 dias, permitindo ao Thomaz AI identificar riscos futuros, alertar sobre esgotamento de contas e recomendar ações preventivas.

---

## 📊 O Que Foi Implementado

### 1. **View v_thomaz_future_commitments_30d**

Calcula o impacto financeiro dos próximos 30 dias por conta bancária.

```sql
CREATE VIEW v_thomaz_future_commitments_30d AS
SELECT
  fe.bank_account_id,

  -- Impacto líquido (receitas - despesas)
  SUM(CASE
    WHEN fe.tipo = 'receita' THEN fe.valor
    WHEN fe.tipo = 'despesa' THEN -fe.valor
  END) AS impacto_30d,

  -- Detalhamento
  SUM(fe.valor) FILTER (WHERE fe.tipo = 'receita') AS receitas_30d,
  SUM(fe.valor) FILTER (WHERE fe.tipo = 'despesa') AS despesas_30d,

  -- Contadores
  COUNT(*) FILTER (WHERE fe.tipo = 'receita') AS qtd_receitas_30d,
  COUNT(*) FILTER (WHERE fe.tipo = 'despesa') AS qtd_despesas_30d,

  -- Média diária (para estimar esgotamento)
  SUM(...) / 30.0 AS impacto_medio_diario,

  -- Datas
  MIN(fe.data_vencimento) AS primeiro_vencimento,
  MAX(fe.data_vencimento) AS ultimo_vencimento

FROM finance_entries fe
WHERE fe.data_vencimento > CURRENT_DATE
  AND fe.data_vencimento <= CURRENT_DATE + INTERVAL '30 days'
  AND fe.status IN ('pendente', 'confirmado')
GROUP BY fe.bank_account_id
```

#### **Campos:**
- ✅ `impacto_30d` - Impacto líquido (pode ser negativo)
- ✅ `receitas_30d` - Total de receitas esperadas
- ✅ `despesas_30d` - Total de despesas previstas
- ✅ `qtd_receitas_30d` - Quantidade de receitas
- ✅ `qtd_despesas_30d` - Quantidade de despesas
- ✅ `impacto_medio_diario` - Média diária (útil para calcular dias até zerar)
- ✅ `primeiro_vencimento` - Primeira data do período
- ✅ `ultimo_vencimento` - Última data do período

---

### 2. **View v_thomaz_cash_projection_30d**

View consolidada que une posição atual com projeção futura.

```sql
CREATE VIEW v_thomaz_cash_projection_30d AS
SELECT
  cp.bank_account_id,
  cp.conta,
  cp.banco,
  cp.tipo_conta,
  cp.ativa,

  -- POSIÇÃO ATUAL
  cp.saldo_calculado AS saldo_atual,
  cp.receitas_pendentes AS receitas_pendentes_total,
  cp.despesas_pendentes AS despesas_pendentes_total,

  -- COMPROMISSOS 30 DIAS
  fc.impacto_30d,
  fc.receitas_30d,
  fc.despesas_30d,
  fc.qtd_receitas_30d,
  fc.qtd_despesas_30d,
  fc.impacto_medio_diario,
  fc.primeiro_vencimento,
  fc.ultimo_vencimento,

  -- PROJEÇÃO
  cp.saldo_calculado + COALESCE(fc.impacto_30d, 0) AS saldo_projetado_30d,

  -- STATUS DE RISCO AUTOMÁTICO
  CASE
    WHEN saldo_projetado_30d < 0 THEN 'RISCO_CRITICO'
    WHEN saldo_projetado_30d < 1000 THEN 'RISCO_ALTO'
    WHEN saldo_projetado_30d < 5000 THEN 'RISCO_MODERADO'
    ELSE 'SAUDAVEL'
  END AS status_risco_30d,

  -- ALERTAS CRÍTICOS
  CASE
    WHEN cp.saldo_calculado > 0 AND saldo_projetado_30d < 0
      THEN true
    ELSE false
  END AS alerta_inversao_saldo,

  CASE
    WHEN cp.saldo_calculado < 5000 AND saldo_projetado_30d < cp.saldo_calculado
      THEN true
    ELSE false
  END AS alerta_reducao_critica,

  -- DIAS ATÉ ESGOTAMENTO
  CASE
    WHEN fc.impacto_medio_diario < 0
      THEN ROUND((cp.saldo_calculado / ABS(fc.impacto_medio_diario))::numeric, 0)
    ELSE NULL
  END AS dias_ate_esgotamento,

  -- PERCENTUAL DE VARIAÇÃO
  CASE
    WHEN cp.saldo_calculado <> 0
      THEN ROUND((fc.impacto_30d / cp.saldo_calculado * 100)::numeric, 2)
    ELSE NULL
  END AS percentual_variacao

FROM v_thomaz_cash_position cp
LEFT JOIN v_thomaz_future_commitments_30d fc
  ON fc.bank_account_id = cp.bank_account_id
WHERE cp.ativa = true
```

#### **Campos Principais:**
- ✅ `saldo_atual` - Saldo calculado hoje
- ✅ `impacto_30d` - Impacto líquido dos próximos 30 dias
- ✅ `saldo_projetado_30d` - Saldo estimado daqui 30 dias
- ✅ `status_risco_30d` - CRITICO / ALTO / MODERADO / SAUDAVEL
- ✅ `alerta_inversao_saldo` - TRUE se vai de + para -
- ✅ `alerta_reducao_critica` - TRUE se conta baixa vai reduzir
- ✅ `dias_ate_esgotamento` - Dias até zerar (se negativo)
- ✅ `percentual_variacao` - % de variação esperada

---

### 3. **Método analyzeCashProjection30d()**

Adicionado em `/src/services/thomazUltraService.ts`:

```typescript
private analyzeCashProjection30d(data: any[], insights: any[]): string {
  // Cálculos consolidados
  const totalSaldoAtual = data.reduce((sum, acc) => sum + (acc.saldo_atual || 0), 0)
  const totalImpacto30d = data.reduce((sum, acc) => sum + (acc.impacto_30d || 0), 0)
  const totalProjetado = data.reduce((sum, acc) => sum + (acc.saldo_projetado_30d || 0), 0)

  // Filtros de risco
  const contasCriticas = data.filter(acc => acc.status_risco_30d === 'RISCO_CRITICO')
  const contasComInversao = data.filter(acc => acc.alerta_inversao_saldo === true)
  const contasComEsgotamento = data.filter(acc =>
    acc.dias_ate_esgotamento !== null && acc.dias_ate_esgotamento < 30
  )

  // ANÁLISE DETALHADA...
}
```

#### **Análise Gerada:**

```
📊 Projeção de Caixa - Próximos 30 Dias:

📋 Posição Atual vs Projeção:
Saldo Atual: R$ 47.500,00
Impacto 30 dias: R$ -12.000,00 (negativo)
Saldo Projetado: R$ 35.500,00

Variação esperada: -25.3%

🔴 ALERTA CRÍTICO: 1 conta(s) em RISCO CRÍTICO:
   • Conta Operacional: Atual R$ 5.000,00 → Projetado R$ -2.000,00
     ⏰ Estimativa de esgotamento: 12 dias

⚠️ ALERTA DE INVERSÃO: 1 conta(s) vão de POSITIVO para NEGATIVO:
   • Conta Operacional: R$ 5.000,00 → R$ -2.000,00

⏰ Atenção - Esgotamento Próximo:
   • Conta Operacional: ~12 dias até zerar

💡 Recomendações Estratégicas:
1. 🚨 URGENTE: Reduzir despesas imediatas em até R$ 3.600,00
2. 💰 Intensificar cobranças de recebíveis
3. 📅 Renegociar prazos de pagamentos críticos
4. 💳 Preparar linha de crédito preventiva

📅 Detalhamento do Período:
Receitas esperadas: R$ 18.000,00
Despesas previstas: R$ 30.000,00
```

---

### 4. **Capacidade Analítica Registrada**

Nova entrada em `thomaz_analytical_capabilities`:

```sql
INSERT INTO thomaz_analytical_capabilities (
  capability_name: 'cash_projection_30d',
  capability_type: 'predictive_financial',
  description: 'Projeção de caixa para os próximos 30 dias...',

  related_views: [
    'v_thomaz_cash_projection_30d',
    'v_thomaz_future_commitments_30d',
    'v_thomaz_cash_position'
  ],

  related_tables: [
    'finance_entries',
    'bank_accounts'
  ],

  trigger_keywords: [
    'projeção', 'projetar', 'futuro',
    'próximos 30 dias', 'próximos dias',
    'daqui 30 dias', 'próximo mês',
    'tendência', 'previsão', 'estimativa',
    'vai acabar', 'vai esgotar', 'vai zerar',
    'risco futuro', 'dias até',
    'quando vai acabar', 'quanto tempo tenho',
    'alerta futuro', 'inversão de saldo',
    'saldo projetado', 'análise preditiva'
  ],

  analysis_depth: 'comprehensive'
)
```

---

## 🚀 Como Funciona

### **1. Usuário Pergunta:**

```
"Qual a projeção de caixa para os próximos 30 dias?"
"Vai faltar dinheiro no mês que vem?"
"Quando vai zerar minha conta?"
"Tenho risco de ficar negativo?"
```

### **2. Thomaz Identifica a Capacidade:**

O método `getRelevantCapabilities()` detecta keywords como:
- "projeção"
- "próximos 30 dias"
- "vai zerar"
- "risco futuro"

### **3. Executa a Query:**

```typescript
const data = await supabase
  .from('v_thomaz_cash_projection_30d')
  .select('*')
  .order('status_risco_30d', { ascending: false })
```

### **4. Gera Análise Contextual:**

```typescript
const analysis = this.analyzeCashProjection30d(data, insights)
```

### **5. Retorna ao Usuário:**

Análise completa com:
- ✅ Saldo atual vs projetado
- ✅ Alertas críticos destacados
- ✅ Contas em risco identificadas
- ✅ Dias até esgotamento calculados
- ✅ Recomendações priorizadas
- ✅ Ações imediatas sugeridas

---

## 📊 Exemplos de Uso

### **Exemplo 1: Situação Crítica**

**Input:** "Qual a projeção dos próximos 30 dias?"

**Output:**
```
📊 Projeção de Caixa - Próximos 30 Dias:

📋 Posição Atual vs Projeção:
Saldo Atual: R$ 8.500,00
Impacto 30 dias: R$ -15.000,00 (negativo)
Saldo Projetado: R$ -6.500,00

🔴 ALERTA CRÍTICO: 2 conta(s) em RISCO CRÍTICO
⚠️ ALERTA DE INVERSÃO: 2 conta(s) vão de POSITIVO para NEGATIVO
⏰ Conta Operacional: ~8 dias até zerar

💡 Recomendações Estratégicas:
1. 🚨 URGENTE: Reduzir despesas em até R$ 4.500,00
2. 💰 Intensificar cobranças
3. 📅 Renegociar prazos
4. 💳 Preparar linha de crédito
```

### **Exemplo 2: Situação Positiva**

**Input:** "Próximo mês vai melhorar?"

**Output:**
```
📊 Projeção de Caixa - Próximos 30 Dias:

📋 Posição Atual vs Projeção:
Saldo Atual: R$ 45.000,00
Impacto 30 dias: R$ 18.000,00 (positivo)
Saldo Projetado: R$ 63.000,00

Variação esperada: +40.0%

✅ Projeção Positiva:
Seu caixa deve crescer R$ 18.000,00 nos próximos 30 dias.

💡 Oportunidades:
1. Considere investir o excedente
2. Avalie oportunidades de crescimento
3. Negocie melhores condições com fornecedores
```

### **Exemplo 3: Dias Até Esgotamento**

**Input:** "Quando vai acabar o dinheiro da conta?"

**Output:**
```
⏰ Atenção - Esgotamento Próximo:

   • Conta Operacional: ~12 dias até zerar
   • Conta Reserva: ~25 dias até zerar

🔴 AÇÃO URGENTE NECESSÁRIA!

💡 Recomendações:
1. Transferir R$ 15.000 de Conta Investimentos
2. Adiar pagamento de R$ 8.000 (Fornecedor XYZ)
3. Cobrar urgente R$ 12.000 de clientes vencidos
```

---

## 🎯 Benefícios

### ✅ Antes vs Depois

| Aspecto | Antes | Agora |
|---------|-------|-------|
| **Visão Futuro** | Nenhuma | 30 dias completos |
| **Alertas** | Nenhum | Automáticos |
| **Inversão Saldo** | Não detectado | Alerta antecipado |
| **Esgotamento** | Manual | Dias calculados |
| **Risco** | Não avaliado | 4 níveis automáticos |
| **Recomendações** | Genéricas | Específicas e priorizadas |
| **Proatividade** | Reativa | Preditiva |

### 📊 Capacidades Adicionadas

1. ✅ **Projeção 30 Dias** - Saldo futuro calculado
2. ✅ **Análise de Risco** - Crítico/Alto/Moderado/Saudável
3. ✅ **Alerta de Inversão** - Detecta saldo que vai de + para -
4. ✅ **Dias até Esgotamento** - Estimativa precisa por conta
5. ✅ **Impacto Médio Diário** - Tendência calculada
6. ✅ **Percentual de Variação** - Quanto vai mudar
7. ✅ **Recomendações Priorizadas** - Ações por severidade
8. ✅ **Detalhamento Completo** - Receitas e despesas futuras

---

## 🔧 Integração com Sistema Existente

### **Fluxo Completo:**

1. **View Base:** `v_thomaz_cash_position` (saldo atual)
2. **View Compromissos:** `v_thomaz_future_commitments_30d` (próximos 30 dias)
3. **View Consolidada:** `v_thomaz_cash_projection_30d` (união + análise)
4. **Capacidade:** Registrada em `thomaz_analytical_capabilities`
5. **Método:** `analyzeCashProjection30d()` no serviço
6. **Resultado:** Análise contextual completa ao usuário

---

## 📝 Arquivos Modificados/Criados

### **Banco de Dados:**
- ✅ Migration: `create_thomaz_30d_projection_views.sql`
- ✅ Migration: `add_projection_capability_simple.sql`
- ✅ View: `v_thomaz_future_commitments_30d` (nova)
- ✅ View: `v_thomaz_cash_projection_30d` (nova)
- ✅ Índice: `idx_finance_entries_vencimento_status_tipo` (performance)
- ✅ Capacidade: `cash_projection_30d` (registrada)

### **Frontend:**
- ✅ `/src/services/thomazUltraService.ts` (método `analyzeCashProjection30d` adicionado)

---

## ✅ Status Final

**SISTEMA COMPLETAMENTE IMPLEMENTADO E FUNCIONAL**

O Thomaz agora possui:
- ✅ Projeção automática de 30 dias
- ✅ Detecção de risco futuro
- ✅ Alertas de inversão de saldo
- ✅ Cálculo de dias até esgotamento
- ✅ Análise de impacto médio diário
- ✅ Recomendações estratégicas priorizadas
- ✅ Ações preventivas sugeridas
- ✅ Visão preditiva completa

---

## 🎓 Próximos Passos Sugeridos

1. **Expandir para 60 e 90 dias** (médio e longo prazo)
2. **Adicionar análise de sazonalidade** (padrões históricos)
3. **Integrar com ML** para previsões mais precisas
4. **Criar alertas automáticos** via notificações push
5. **Dashboard visual** de projeção timeline
6. **Simulador** de cenários (what-if analysis)
7. **Comparação** projeção vs realizado (feedback loop)
