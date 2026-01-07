# Sistema de Alertas Inteligentes do Thomaz AI - IMPLEMENTADO

## 🎯 Objetivo

Criar um sistema completo de alertas contextuais que o Thomaz AI gera automaticamente baseado em análises preditivas, permitindo ação proativa antes que problemas se tornem críticos.

---

## ✅ O Que Foi Implementado

### **1. Tabela `thomaz_alerts` Aprimorada**

```sql
CREATE TABLE thomaz_alerts (
  id uuid PRIMARY KEY,

  -- Classificação
  area text CHECK (area IN ('financeiro', 'operacional', 'tecnico', 'comercial', 'estrategico')),
  nivel_risco text CHECK (nivel_risco IN ('saudavel', 'atencao', 'critico')),
  severity text CHECK (severity IN ('info', 'warning', 'critical')),

  -- Conteúdo
  title text NOT NULL,
  mensagem_humana text NOT NULL,
  explicacao_tecnica text,

  -- Dados Estruturados
  evidencias jsonb DEFAULT '[]',           -- Dados que fundamentam o alerta
  sugestoes jsonb DEFAULT '[]',            -- Ações acionáveis
  dados_contexto jsonb DEFAULT '{}',       -- Contexto adicional

  -- Workflow
  status text DEFAULT 'novo' CHECK (status IN ('novo', 'visto', 'resolvido', 'ignorado')),
  prioridade integer DEFAULT 5 CHECK (prioridade BETWEEN 1 AND 10),

  -- Rastreamento
  acknowledged_by uuid,
  acknowledged_at timestamptz,
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);
```

#### **Campos Principais:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `area` | text | financeiro / operacional / tecnico / comercial / estrategico |
| `nivel_risco` | text | saudavel / atencao / critico |
| `mensagem_humana` | text | Mensagem clara e direta para o usuário |
| `explicacao_tecnica` | text | Explicação detalhada para usuários técnicos |
| `evidencias` | jsonb | Array com dados que fundamentam (views, queries, valores) |
| `sugestoes` | jsonb | Array com ações: `{texto, impacto, acao}` |
| `status` | text | novo / visto / resolvido / ignorado |
| `prioridade` | integer | 1 (baixa) a 10 (crítica) |
| `expires_at` | timestamptz | Data de expiração automática |

---

### **2. Funções de Geração Automática**

#### **A. generate_cash_projection_alerts()**

Gera alertas baseados na projeção de caixa dos próximos 30 dias:

**Alertas Gerados:**

1. **Risco Crítico de Caixa**
   - Condição: `status_risco_30d = 'RISCO_CRITICO'`
   - Nivel: `critico`
   - Prioridade: 10
   - Evidências: Contas com saldo projetado negativo
   - Sugestões:
     - Revisar despesas dos próximos 30 dias
     - Intensificar cobranças de recebíveis
     - Renegociar prazos com fornecedores
     - Preparar linha de crédito preventiva

2. **Inversão de Saldo**
   - Condição: `alerta_inversao_saldo = true`
   - Nivel: `critico`
   - Prioridade: 9
   - Evidências: Contas que vão de positivo para negativo
   - Sugestões:
     - Realizar transferências preventivas
     - Antecipar receitas ou postergar despesas

3. **Esgotamento Iminente**
   - Condição: `dias_ate_esgotamento < 15`
   - Nivel: `atencao`
   - Prioridade: 7
   - Evidências: Contas que podem esgotar em menos de 15 dias
   - Sugestões:
     - Monitorar diariamente as contas em risco
     - Reduzir despesas não essenciais

#### **B. generate_receivables_alerts()**

Gera alertas de inadimplência e receitas vencidas:

**Alerta Gerado:**

1. **Receitas Vencidas - Inadimplência**
   - Condição: Receitas vencidas > R$ 1.000
   - Nivel: `critico` (> R$ 50k) / `atencao` (> R$ 10k) / `saudavel` (< R$ 10k)
   - Prioridade: 8
   - Evidências: Valor total e quantidade de lançamentos vencidos
   - Sugestões:
     - Ver receitas vencidas e iniciar cobranças
     - Contatar clientes inadimplentes
     - Oferecer desconto para pagamento imediato

#### **C. thomaz_generate_all_alerts()**

Função principal que executa todas as gerações de alertas:

```sql
SELECT thomaz_generate_all_alerts();

-- Retorna:
{
  "success": true,
  "alerts_generated": 1,
  "total_new_alerts": 1,
  "timestamp": "2026-01-07T02:39:04+00:00",
  "details": {
    "projection_alerts": 1,
    "receivables_alerts": 0
  },
  "summary": {
    "critico": 1,
    "atencao": 0,
    "saudavel": 0
  }
}
```

---

### **3. Funções Auxiliares**

#### **A. cleanup_expired_alerts()**

Limpa alertas expirados automaticamente:
- Atualiza `status` para `'ignorado'`
- Define `is_active = false`
- Adiciona `resolution_note = 'Expirado automaticamente'`

#### **B. upsert_thomaz_alert()**

Insere ou atualiza alertas (evita duplicados):
- Verifica se já existe alerta ativo com mesmo `area` e `title`
- Se existe: atualiza com novos dados
- Se não existe: insere novo alerta
- Mapeia `nivel_risco` para `severity`:
  - `critico` → `critical`
  - `atencao` → `warning`
  - `saudavel` → `info`

---

### **4. Integração com thomazUltraService**

Métodos adicionados em `/src/services/thomazUltraService.ts`:

```typescript
// Gerar todos os alertas
async generateAlerts(): Promise<any> {
  const result = await thomazDatabaseService.executeRPC('thomaz_generate_all_alerts')
  return result
}

// Buscar alertas ativos (novo + visto)
async getActiveAlerts(): Promise<any> {
  const result = await thomazDatabaseService.queryTable('thomaz_alerts', {
    filters: [
      { column: 'status', operator: 'in', value: ['novo', 'visto'] }
    ],
    orderBy: { column: 'prioridade', ascending: false },
    limit: 50
  })
  return result
}

// Buscar alertas críticos
async getCriticalAlerts(): Promise<any> {
  const result = await thomazDatabaseService.queryTable('thomaz_alerts', {
    filters: [
      { column: 'status', operator: 'eq', value: 'novo' },
      { column: 'nivel_risco', operator: 'eq', value: 'critico' }
    ],
    orderBy: { column: 'prioridade', ascending: false }
  })
  return result
}

// Marcar alerta como visto
async acknowledgeAlert(alertId: string, userId?: string): Promise<any> {
  const result = await thomazDatabaseService.updateRecord('thomaz_alerts', alertId, {
    status: 'visto',
    acknowledged_at: new Date().toISOString(),
    acknowledged_by: userId || null
  })
  return result
}

// Resolver alerta
async resolveAlert(alertId: string, resolutionNote: string, userId?: string): Promise<any> {
  const result = await thomazDatabaseService.updateRecord('thomaz_alerts', alertId, {
    status: 'resolvido',
    resolved_at: new Date().toISOString(),
    resolved_by: userId || null,
    resolution_note: resolutionNote,
    is_active: false
  })
  return result
}

// Resumo de alertas
async getAlertsSummary(): Promise<any> {
  const result = await thomazDatabaseService.queryTable('thomaz_alerts', {
    filters: [
      { column: 'status', operator: 'eq', value: 'novo' }
    ]
  })

  return {
    total: result.data.length,
    critico: result.data.filter(a => a.nivel_risco === 'critico').length,
    atencao: result.data.filter(a => a.nivel_risco === 'atencao').length,
    saudavel: result.data.filter(a => a.nivel_risco === 'saudavel').length
  }
}
```

---

## 📊 Exemplo Real de Alerta Gerado

### **Alerta Crítico de Caixa**

```json
{
  "area": "financeiro",
  "nivel_risco": "critico",
  "severity": "critical",
  "title": "Risco Crítico de Caixa - Próximos 30 Dias",
  "mensagem_humana": "3 conta(s) terão saldo NEGATIVO nos próximos 30 dias!",
  "explicacao_tecnica": "Baseado em lançamentos financeiros confirmados e pendentes dos próximos 30 dias.",
  "evidencias": [
    {
      "view": "v_thomaz_cash_projection_30d",
      "contas": [
        {
          "conta": "C6 Bank",
          "saldo_atual": -100.00,
          "saldo_projetado": -100.00,
          "dias_ate_esgotamento": null
        },
        {
          "conta": "principal",
          "saldo_atual": -5881.24,
          "saldo_projetado": -5881.24,
          "dias_ate_esgotamento": null
        },
        {
          "conta": "Reserva de Emergência",
          "saldo_atual": -60.00,
          "saldo_projetado": -60.00,
          "dias_ate_esgotamento": null
        }
      ]
    }
  ],
  "sugestoes": [
    {
      "texto": "Revisar despesas próximos 30 dias",
      "impacto": "alto",
      "acao": "/financeiro"
    },
    {
      "texto": "Intensificar cobranças",
      "impacto": "alto",
      "acao": "/financeiro"
    },
    {
      "texto": "Renegociar prazos",
      "impacto": "medio",
      "acao": "/suppliers"
    },
    {
      "texto": "Linha de crédito preventiva",
      "impacto": "alto",
      "acao": "/bank-accounts"
    }
  ],
  "dados_contexto": {
    "count": 3
  },
  "prioridade": 10,
  "status": "novo",
  "created_at": "2026-01-07T02:39:04+00:00"
}
```

---

## 🔄 Fluxo de Funcionamento

### **1. Geração Automática**

```
1. Sistema executa thomaz_generate_all_alerts()
   ├─ Limpa alertas expirados
   ├─ Executa generate_cash_projection_alerts()
   │  ├─ Consulta v_thomaz_cash_projection_30d
   │  ├─ Identifica contas críticas
   │  ├─ Identifica inversões de saldo
   │  └─ Identifica esgotamentos iminentes
   ├─ Executa generate_receivables_alerts()
   │  ├─ Consulta finance_entries
   │  └─ Identifica receitas vencidas
   └─ Retorna resumo
```

### **2. Consumo no Frontend**

```typescript
// Gerar alertas sob demanda
const result = await thomazUltraService.generateAlerts()

// Buscar alertas críticos
const critical = await thomazUltraService.getCriticalAlerts()

// Buscar todos alertas ativos
const active = await thomazUltraService.getActiveAlerts()

// Resumo rápido
const summary = await thomazUltraService.getAlertsSummary()
// { total: 5, critico: 2, atencao: 3, saudavel: 0 }

// Marcar como visto
await thomazUltraService.acknowledgeAlert(alertId, userId)

// Resolver
await thomazUltraService.resolveAlert(alertId, "Transferido R$ 10.000 para conta operacional", userId)
```

### **3. Lifecycle dos Alertas**

```
novo → visto → resolvido
  ↓      ↓
ignorado (expirado)
```

---

## 🎯 Benefícios

### **Antes do Sistema de Alertas:**
- ❌ Usuário descobre problemas apenas quando já são críticos
- ❌ Sem visibilidade de riscos futuros
- ❌ Ação sempre reativa
- ❌ Sem priorização clara
- ❌ Sem rastreamento de resolução

### **Agora:**
- ✅ **Alertas Proativos** - Detecta problemas antes que aconteçam
- ✅ **Evidências Estruturadas** - Dados que fundamentam cada alerta
- ✅ **Sugestões Acionáveis** - Ações diretas com links para telas
- ✅ **Priorização Automática** - 1 a 10 baseado em severidade
- ✅ **Mensagens Humanizadas** - Linguagem clara para não-técnicos
- ✅ **Explicações Técnicas** - Detalhes para usuários avançados
- ✅ **Workflow Completo** - novo → visto → resolvido
- ✅ **Rastreamento** - Quem viu, quem resolveu, quando, como
- ✅ **Expiração Automática** - Alertas antigos são arquivados
- ✅ **Sem Duplicação** - Upsert inteligente evita alertas repetidos
- ✅ **Integrado com Projeções** - Usa v_thomaz_cash_projection_30d
- ✅ **Contexto Rico** - JSONB com dados adicionais

---

## 🚀 Como Usar

### **1. Gerar Alertas Periodicamente**

Executar diariamente ou em intervalos:

```sql
-- Via SQL direto
SELECT thomaz_generate_all_alerts();

-- Ou via Frontend
await thomazUltraService.generateAlerts()
```

### **2. Exibir Alertas no Dashboard**

```typescript
// Resumo no header
const summary = await thomazUltraService.getAlertsSummary()
// Badge vermelho: summary.critico
// Badge amarelo: summary.atencao

// Lista completa
const alerts = await thomazUltraService.getActiveAlerts()
alerts.data.forEach(alert => {
  console.log(`[${alert.nivel_risco.toUpperCase()}] ${alert.title}`)
  console.log(alert.mensagem_humana)

  alert.sugestoes.forEach(sug => {
    console.log(`  → ${sug.texto} (${sug.acao})`)
  })
})
```

### **3. Workflow de Resolução**

```typescript
// 1. Usuário vê o alerta
await thomazUltraService.acknowledgeAlert(alertId, currentUserId)

// 2. Usuário toma ação (ex: transfere R$ 10k entre contas)

// 3. Usuário marca como resolvido
await thomazUltraService.resolveAlert(
  alertId,
  "Transferido R$ 10.000 de Reserva para Operacional",
  currentUserId
)
```

---

## 📊 Estrutura de Sugestões

Cada sugestão possui:

```typescript
{
  texto: string,        // "Revisar despesas próximos 30 dias"
  impacto: string,      // "alto" | "medio" | "baixo"
  acao: string          // "/financeiro" (rota frontend)
}
```

No frontend, pode-se renderizar como botões:

```tsx
{alert.sugestoes.map(sug => (
  <Button
    key={sug.texto}
    onClick={() => navigate(sug.acao)}
    variant={sug.impacto === 'alto' ? 'danger' : 'warning'}
  >
    {sug.texto}
  </Button>
))}
```

---

## 📈 Evolução Futura

### **Próximos Alertas a Implementar:**

1. **Operacionais:**
   - Ordens de serviço atrasadas (> 7 dias do prazo)
   - Técnicos sem OS há mais de 3 dias (ociosidade)
   - Equipamentos sem manutenção preventiva

2. **Comerciais:**
   - Clientes "At Risk" sem contato há 30+ dias
   - Oportunidades estagnadas há 15+ dias
   - Queda de 20%+ em vendas vs mês anterior

3. **Técnicos:**
   - Estoque baixo (< 10 unidades de itens críticos)
   - Fornecedores inadimplentes
   - Materiais vencendo validade

4. **Estratégicos:**
   - Margem de lucro < 15%
   - CAC > LTV (cliente custa mais que gera)
   - Churn rate aumentando

### **Melhorias:**

1. **Notificações Push** - Integrar com sistema de notificações
2. **Email Automático** - Enviar alertas críticos por email
3. **WhatsApp** - Alertas via WhatsApp para mobile
4. **Dashboard de Alertas** - Página dedicada com filtros e métricas
5. **Machine Learning** - Prever alertas com base em padrões históricos
6. **Configuração por Usuário** - Permitir usuário customizar alertas

---

## ✅ Status Final

**SISTEMA COMPLETAMENTE IMPLEMENTADO E FUNCIONAL**

- ✅ Tabela `thomaz_alerts` aprimorada com novos campos
- ✅ Função `generate_cash_projection_alerts()` gerando 3 tipos de alertas
- ✅ Função `generate_receivables_alerts()` detectando inadimplência
- ✅ Função `thomaz_generate_all_alerts()` consolidando tudo
- ✅ Funções auxiliares de upsert e cleanup
- ✅ Métodos no `thomazUltraService` para consumo no frontend
- ✅ Mapeamento correto de severity (critico → critical)
- ✅ Evidências estruturadas em JSONB
- ✅ Sugestões acionáveis com links diretos
- ✅ Workflow completo (novo/visto/resolvido)
- ✅ Build validado com sucesso

**Alertas sendo gerados automaticamente com base nas projeções reais!**

---

**Data:** 07/01/2026
**Status:** ✅ IMPLEMENTADO E TESTADO
