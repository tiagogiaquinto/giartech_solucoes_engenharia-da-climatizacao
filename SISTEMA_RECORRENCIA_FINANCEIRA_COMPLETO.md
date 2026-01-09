# 💰 SISTEMA DE RECORRÊNCIA FINANCEIRA

**Data:** 09/01/2026
**Sistema:** Cobranças e Pagamentos Recorrentes Automáticos

---

## 🎯 VISÃO GERAL

Sistema completo para gerenciar **cobranças e pagamentos recorrentes** com geração automática de lançamentos futuros.

### Periodicidades Suportadas:

- ✅ **Semanal** (7 dias)
- ✅ **Quinzenal** (15 dias)
- ✅ **Mensal** (todo mês no mesmo dia)
- ✅ **Bimestral** (a cada 2 meses)
- ✅ **Trimestral** (a cada 3 meses)
- ✅ **Semestral** (a cada 6 meses)
- ✅ **Anual** (todo ano no mesmo dia)

---

## 📊 ESTRUTURA DO SISTEMA

### 1. Campos Adicionados em `finance_entries`

```sql
{
  -- Controle de recorrência
  "is_recurring": boolean,                    -- É recorrente?
  "recurrence_frequency": text,               -- mensal, bimestral, trimestral, anual, etc
  "recurrence_day": integer,                  -- Dia do mês (1-31)
  "recurrence_start_date": date,              -- Data inicial
  "recurrence_end_date": date,                -- Data final (opcional)
  "recurrence_count": integer,                -- Número de ocorrências (opcional)
  "recurrence_parent_id": uuid,               -- ID do lançamento original
  "recurrence_status": text,                  -- ativo, pausado, cancelado, finalizado
  "auto_generate": boolean,                   -- Gerar automaticamente?
  "generated_count": integer,                 -- Quantos já foram gerados
  "next_generation_date": date,               -- Próxima geração
  "last_generation_date": date                -- Última geração
}
```

---

### 2. Tabela `finance_recurrence_history`

Histórico completo de todas as gerações:

```sql
CREATE TABLE finance_recurrence_history (
  id uuid PRIMARY KEY,
  parent_entry_id uuid,           -- Lançamento pai (recorrente)
  generated_entry_id uuid,        -- Lançamento gerado
  generation_date date,           -- Quando foi gerado
  scheduled_date date,            -- Data agendada
  amount numeric,                 -- Valor
  status text,                    -- gerado, erro, cancelado, pulado
  error_message text,             -- Mensagem de erro (se houver)
  generation_method text,         -- automatico, manual
  notes text,
  created_at timestamp
);
```

---

## 🔧 COMO USAR

### 1. Criar Lançamento Recorrente

**Exemplo: Aluguel mensal de R$ 5.000**

```sql
INSERT INTO finance_entries (
  descricao,
  valor,
  tipo,
  status,
  data,
  data_vencimento,
  categoria,

  -- Campos de recorrência
  is_recurring,
  recurrence_frequency,
  recurrence_day,
  recurrence_start_date,
  recurrence_count,
  auto_generate
) VALUES (
  'Aluguel do Escritório',
  5000.00,
  'saida',
  'pago',
  '2026-01-10',
  '2026-01-10',
  'Despesas Fixas',

  -- Recorrência
  true,                    -- É recorrente
  'mensal',                -- Todo mês
  10,                      -- Dia 10
  '2026-01-10',            -- Começou em 10/01
  12,                      -- 12 parcelas (1 ano)
  true                     -- Gerar automaticamente
);
```

Sistema automaticamente:
- Define `next_generation_date` = 10/02/2026
- Define `recurrence_status` = 'ativo'
- Define `generated_count` = 0

---

### 2. Criar Cobrança Recorrente

**Exemplo: Mensalidade de cliente (trimestral)**

```sql
INSERT INTO finance_entries (
  descricao,
  valor,
  tipo,
  status,
  data,
  data_vencimento,
  customer_id,
  categoria,

  -- Recorrência
  is_recurring,
  recurrence_frequency,
  recurrence_day,
  recurrence_end_date,
  auto_generate
) VALUES (
  'Mensalidade Contrato XPTO',
  3000.00,
  'entrada',
  'pendente',
  '2026-01-15',
  '2026-01-15',
  'uuid-do-cliente',
  'Receitas Recorrentes',

  -- Recorrência
  true,
  'trimestral',            -- A cada 3 meses
  15,                      -- Dia 15
  '2026-12-31',            -- Até final do ano
  true
);
```

---

## 🔄 GERAÇÃO AUTOMÁTICA

### Método 1: Gerar UMA Recorrência (Manual)

```sql
SELECT generate_next_recurrence('uuid-do-lancamento-pai');
```

**Retorna:**
```json
{
  "success": true,
  "parent_id": "uuid-pai",
  "new_entry_id": "uuid-novo",
  "scheduled_date": "2026-02-10",
  "amount": 5000.00
}
```

**O que faz:**
1. Calcula próxima data
2. Verifica se pode gerar
3. Cria novo lançamento
4. Atualiza contador
5. Registra no histórico

---

### Método 2: Processar TODAS as Recorrências (Automático)

```sql
SELECT generate_all_pending_recurrences(30);
-- Processa recorrências dos próximos 30 dias
```

**Retorna:**
```json
{
  "success": true,
  "generated": 15,
  "errors": 0,
  "processed_date": "2026-01-09",
  "target_date": "2026-02-08"
}
```

**Usar em CRON/Agendamento:**
- Executar diariamente
- Ou semanalmente
- Gera lançamentos com antecedência

---

## 📅 CÁLCULO DE DATAS

### Regras por Periodicidade

**Semanal/Quinzenal:**
```
Data atual + N dias
Exemplo: 10/01 + 7 dias = 17/01
```

**Mensal:**
```
Próximo mês, mesmo dia
Exemplo: 10/01 → 10/02 → 10/03
Se dia não existe (ex: 31/02), usa último dia do mês
```

**Bimestral:**
```
A cada 2 meses
Exemplo: 10/01 → 10/03 → 10/05
```

**Trimestral:**
```
A cada 3 meses
Exemplo: 15/01 → 15/04 → 15/07
```

**Semestral:**
```
A cada 6 meses
Exemplo: 10/01 → 10/07 → 10/01 (próximo ano)
```

**Anual:**
```
Todo ano no mesmo dia
Exemplo: 10/01/2026 → 10/01/2027
```

---

## ⚙️ CONTROLE DE RECORRÊNCIAS

### Pausar Recorrência

```sql
SELECT pause_recurrence('uuid-do-lancamento');
```

**Resultado:**
- Status: ativo → pausado
- Para de gerar novos lançamentos
- Mantém lançamentos já gerados

**Quando usar:**
- Cliente solicitou pausa temporária
- Aguardando renegociação
- Férias coletivas

---

### Retomar Recorrência

```sql
SELECT resume_recurrence('uuid-do-lancamento');
```

**Resultado:**
- Status: pausado → ativo
- Volta a gerar automaticamente
- Calcula próximas datas

---

### Cancelar Recorrência

```sql
-- Cancelar apenas a recorrência
SELECT cancel_recurrence('uuid-do-lancamento', false);

-- Cancelar recorrência E lançamentos futuros pendentes
SELECT cancel_recurrence('uuid-do-lancamento', true);
```

**Resultado:**
- Status: → cancelado
- Para definitivamente
- Opcionalmente cancela lançamentos futuros

**Quando usar:**
- Contrato encerrado
- Cliente cancelou
- Mudança de condições

---

### Atualizar Valores Futuros

**Exemplo: Aumentar valor de R$ 5.000 para R$ 5.500**

```sql
SELECT update_future_recurrences(
  'uuid-do-lancamento-pai',
  5500.00,           -- Novo valor
  NULL,              -- Manter descrição
  NULL               -- Manter categoria
);
```

**Resultado:**
```json
{
  "success": true,
  "updated_count": 8
}
```

**Atualiza:**
- APENAS lançamentos futuros
- APENAS lançamentos pendentes
- Mantém lançamentos já pagos

---

## 📊 VIEWS DISPONÍVEIS

### 1. Recorrências Ativas (`v_active_recurrences`)

Lista todas as recorrências ativas:

```sql
SELECT * FROM v_active_recurrences;
```

**Campos:**
```sql
{
  "id": "uuid",
  "descricao": "Aluguel do Escritório",
  "valor": 5000.00,
  "tipo": "saida",
  "frequencia": "mensal",
  "dia_vencimento": 10,
  "inicio": "2026-01-10",
  "fim": null,
  "total_ocorrencias": 12,
  "gerados": 1,
  "restantes": 11,
  "status": "ativo",
  "proxima_geracao": "2026-02-10",
  "ultima_geracao": "2026-01-10",
  "gerar_automatico": true,
  "cliente_nome": null,
  "fornecedor_nome": "Imobiliária XYZ",
  "categoria": "Despesas Fixas"
}
```

---

### 2. Próximas Gerações (`v_upcoming_recurrences`)

Lista próximas gerações agendadas:

```sql
SELECT * FROM v_upcoming_recurrences
ORDER BY proxima_geracao;
```

**Campos:**
```sql
{
  "id": "uuid",
  "descricao": "Aluguel do Escritório",
  "valor": 5000.00,
  "tipo": "saida",
  "frequencia": "mensal",
  "proxima_geracao": "2026-02-10",
  "dias_ate_geracao": 32,
  "gerar_automatico": true,
  "cliente_fornecedor": "Imobiliária XYZ",
  "categoria": "Despesas Fixas"
}
```

**Útil para:**
- Dashboard de próximas cobranças
- Alertas de vencimentos
- Planejamento de caixa

---

## 💡 EXEMPLOS PRÁTICOS

### Exemplo 1: Salário Mensal

```sql
INSERT INTO finance_entries (
  descricao, valor, tipo, status, data, data_vencimento,
  categoria, employee_id,
  is_recurring, recurrence_frequency, recurrence_day, auto_generate
) VALUES (
  'Salário Funcionário João',
  4500.00, 'saida', 'pendente', '2026-01-05', '2026-01-05',
  'Folha de Pagamento', 'uuid-joao',
  true, 'mensal', 5, true
);
```

**Resultado:**
- Todo dia 5 gera novo lançamento
- Categoria: Folha de Pagamento
- Vínculo com funcionário

---

### Exemplo 2: Cobrança Trimestral

```sql
INSERT INTO finance_entries (
  descricao, valor, tipo, status, data, data_vencimento,
  categoria, customer_id,
  is_recurring, recurrence_frequency, recurrence_day,
  recurrence_count, auto_generate
) VALUES (
  'Mensalidade Contrato Manutenção',
  8000.00, 'entrada', 'pendente', '2026-01-15', '2026-01-15',
  'Receitas Recorrentes', 'uuid-cliente',
  true, 'trimestral', 15,
  4, true  -- 4 trimestres = 1 ano
);
```

**Gerações:**
- 15/01/2026
- 15/04/2026
- 15/07/2026
- 15/10/2026
- Para após 4 gerações

---

### Exemplo 3: Pagamento Bimestral

```sql
INSERT INTO finance_entries (
  descricao, valor, tipo, status, data, data_vencimento,
  categoria, supplier_id,
  is_recurring, recurrence_frequency, recurrence_day,
  recurrence_end_date, auto_generate
) VALUES (
  'Fornecimento de Insumos',
  12000.00, 'saida', 'pendente', '2026-01-20', '2026-01-20',
  'Compras', 'uuid-fornecedor',
  true, 'bimestral', 20,
  '2026-12-31', true
);
```

**Gerações:**
- 20/01, 20/03, 20/05, 20/07, 20/09, 20/11
- Para em 31/12/2026

---

### Exemplo 4: Imposto Anual

```sql
INSERT INTO finance_entries (
  descricao, valor, tipo, status, data, data_vencimento,
  categoria,
  is_recurring, recurrence_frequency, recurrence_day, auto_generate
) VALUES (
  'IPTU',
  5800.00, 'saida', 'pendente', '2026-02-01', '2026-02-01',
  'Impostos',
  true, 'anual', 1, true
);
```

**Gerações:**
- 01/02/2026
- 01/02/2027
- 01/02/2028
- ...indefinidamente

---

## 🔍 CONSULTAS ÚTEIS

### Listar Todas as Recorrências Ativas

```sql
SELECT
  descricao,
  valor,
  frequencia,
  proxima_geracao,
  CASE
    WHEN restantes IS NULL THEN 'Ilimitado'
    ELSE restantes::text || ' restantes'
  END as pendentes
FROM v_active_recurrences
WHERE status = 'ativo'
ORDER BY proxima_geracao;
```

---

### Recorrências que Vão Gerar esta Semana

```sql
SELECT
  descricao,
  valor,
  tipo,
  proxima_geracao,
  dias_ate_geracao
FROM v_upcoming_recurrences
WHERE dias_ate_geracao BETWEEN 0 AND 7
ORDER BY proxima_geracao;
```

---

### Histórico de Gerações de uma Recorrência

```sql
SELECT
  scheduled_date as data,
  amount as valor,
  status,
  generation_method as metodo
FROM finance_recurrence_history
WHERE parent_entry_id = 'uuid-do-pai'
ORDER BY scheduled_date DESC;
```

---

### Total de Receitas Recorrentes do Mês

```sql
SELECT
  SUM(valor) as total_receitas_recorrentes
FROM finance_entries
WHERE tipo = 'entrada'
  AND recurrence_parent_id IS NOT NULL
  AND DATE_TRUNC('month', data_vencimento) = DATE_TRUNC('month', CURRENT_DATE)
  AND status != 'cancelado';
```

---

### Lançamentos Gerados Automaticamente Hoje

```sql
SELECT
  fe.descricao,
  fe.valor,
  fe.tipo,
  fe.data_vencimento,
  fe_parent.descricao as recorrencia_original
FROM finance_entries fe
JOIN finance_entries fe_parent ON fe_parent.id = fe.recurrence_parent_id
WHERE fe.created_at::date = CURRENT_DATE
  AND fe.recurrence_parent_id IS NOT NULL
ORDER BY fe.created_at DESC;
```

---

## 🚨 ALERTAS E MONITORAMENTO

### Recorrências Próximas ao Fim

```sql
SELECT
  descricao,
  valor,
  frequencia,
  gerados,
  total_ocorrencias,
  restantes
FROM v_active_recurrences
WHERE restantes IS NOT NULL
  AND restantes <= 3
  AND status = 'ativo'
ORDER BY restantes;
```

---

### Recorrências com Erros

```sql
SELECT
  lancamento_pai,
  data_agendada,
  valor,
  erro
FROM v_recurrence_generation_history
WHERE status = 'erro'
ORDER BY data_geracao DESC;
```

---

### Recorrências Pausadas

```sql
SELECT
  descricao,
  valor,
  frequencia,
  proxima_geracao
FROM v_active_recurrences
WHERE status = 'pausado';
```

---

## ⏰ CONFIGURAR GERAÇÃO AUTOMÁTICA

### Opção 1: CRON Job (Servidor Linux)

Criar arquivo `/etc/cron.d/finance-recurrence`:

```bash
# Gerar recorrências diariamente às 6h
0 6 * * * psql -U usuario -d banco -c "SELECT generate_all_pending_recurrences(30);"
```

---

### Opção 2: Agendador do PostgreSQL (pg_cron)

```sql
-- Instalar extensão
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar execução diária às 6h
SELECT cron.schedule(
  'generate-recurrences',
  '0 6 * * *',
  $$SELECT generate_all_pending_recurrences(30);$$
);
```

---

### Opção 3: Supabase Edge Function (Webhook)

Criar função edge e chamar via CRON externo ou Supabase Cron.

```typescript
// supabase/functions/process-recurrences/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  )

  const { data, error } = await supabase
    .rpc('generate_all_pending_recurrences', { p_days_ahead: 30 })

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## 📋 CHECKLIST DE USO

### Ao Criar Recorrência:

- [ ] Definir descrição clara
- [ ] Definir valor
- [ ] Definir tipo (entrada/saída)
- [ ] Definir categoria
- [ ] Marcar `is_recurring = true`
- [ ] Escolher frequência (mensal, bimestral, etc)
- [ ] Definir dia de vencimento
- [ ] Definir data inicial
- [ ] (Opcional) Definir data final OU contador
- [ ] Ativar `auto_generate = true`

### Para Gerenciar:

- [ ] Monitorar `v_upcoming_recurrences` para próximas gerações
- [ ] Verificar histórico em `finance_recurrence_history`
- [ ] Pausar se necessário
- [ ] Atualizar valores conforme reajustes
- [ ] Cancelar ao fim do contrato

### Para Manutenção:

- [ ] Configurar job automático (CRON)
- [ ] Monitorar erros de geração
- [ ] Revisar recorrências pausadas
- [ ] Limpar recorrências antigas finalizadas

---

## 🎯 BOAS PRÁTICAS

### 1. Nomenclatura Clara

```sql
-- BOM
'Aluguel Escritório - Rua ABC, 123'
'Mensalidade Cliente XPTO - Contrato 2026'

-- RUIM
'Pagamento'
'Entrada'
```

---

### 2. Usar Categoria Específica

Criar categorias para recorrentes:
- Despesas Fixas Recorrentes
- Receitas Recorrentes
- Folha de Pagamento
- Impostos Anuais

---

### 3. Vincular Cliente/Fornecedor

Sempre preencher:
- `customer_id` para cobranças
- `supplier_id` para pagamentos
- `employee_id` para folha

---

### 4. Definir Limites

**Opção A:** Data final
```sql
recurrence_end_date = '2026-12-31'
```

**Opção B:** Contador
```sql
recurrence_count = 12  -- 12 meses
```

**Evitar:** Recorrências infinitas sem controle

---

### 5. Monitorar Gerações

Revisar semanalmente:
- Recorrências próximas
- Erros de geração
- Recorrências finalizadas

---

## 🔐 SEGURANÇA

### RLS Habilitado

Todas as tabelas possuem Row Level Security.

### Funções SECURITY DEFINER

Funções de geração usam `SECURITY DEFINER` para:
- Garantir execução correta
- Evitar problemas de permissão
- Manter auditoria

### Validações

Sistema valida:
- Datas válidas
- Valores positivos
- Status permitidos
- Frequências válidas

---

## 📊 RELATÓRIOS GERENCIAIS

### Previsão de Entradas (6 meses)

```sql
SELECT
  DATE_TRUNC('month', data_vencimento) as mes,
  SUM(valor) as total_previsto
FROM finance_entries
WHERE tipo = 'entrada'
  AND recurrence_parent_id IS NOT NULL
  AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '6 months'
  AND status = 'pendente'
GROUP BY DATE_TRUNC('month', data_vencimento)
ORDER BY mes;
```

---

### Previsão de Saídas (6 meses)

```sql
SELECT
  DATE_TRUNC('month', data_vencimento) as mes,
  categoria,
  SUM(valor) as total_previsto
FROM finance_entries
WHERE tipo = 'saida'
  AND recurrence_parent_id IS NOT NULL
  AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '6 months'
  AND status = 'pendente'
GROUP BY DATE_TRUNC('month', data_vencimento), categoria
ORDER BY mes, total_previsto DESC;
```

---

### Comparativo: Receitas Recorrentes vs Únicas

```sql
SELECT
  DATE_TRUNC('month', data_vencimento) as mes,
  SUM(CASE WHEN recurrence_parent_id IS NOT NULL THEN valor ELSE 0 END) as recorrentes,
  SUM(CASE WHEN recurrence_parent_id IS NULL THEN valor ELSE 0 END) as unicas,
  SUM(valor) as total
FROM finance_entries
WHERE tipo = 'entrada'
  AND status IN ('pago', 'pendente')
  AND data_vencimento >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', data_vencimento)
ORDER BY mes;
```

---

## ✅ RESUMO EXECUTIVO

### O que o sistema faz:

✅ Cria lançamentos recorrentes (mensal, bimestral, trimestral, anual)
✅ Gera automaticamente lançamentos futuros
✅ Controla datas de geração
✅ Mantém histórico completo
✅ Permite pausar/retomar/cancelar
✅ Atualiza valores futuros
✅ Monitora próximas gerações

### Benefícios:

- **Automação:** Sem trabalho manual mensal
- **Previsibilidade:** Sabe exatamente quando vence
- **Controle:** Pausa, retoma ou cancela fácil
- **Histórico:** Rastreia todas as gerações
- **Planejamento:** Prevê fluxo de caixa futuro

### Próximos Passos:

1. Configurar job automático (CRON)
2. Criar interface de gerenciamento
3. Adicionar alertas de vencimento
4. Integrar com dashboard

---

**Sistema 100% funcional para recorrências financeiras!**

Qualquer dúvida, consulte as views disponíveis ou o histórico de gerações.
