# 📊 COMO FUNCIONA A APURAÇÃO DE VENDAS PARA GAMIFICAÇÃO

**Data:** 08/01/2026
**Sistema:** Gamificação de Clientes

---

## 🎯 VISÃO GERAL

O sistema apura **vendas totais das Ordens de Serviço (OSs)** concluídas, convertendo o valor em pontos para os clientes que participam da gamificação.

---

## 💰 O QUE É APURADO

### Base de Cálculo: VALOR TOTAL DA OS

O sistema usa o campo `total_value` da Ordem de Serviço, que **inclui TUDO**:

✅ **O que entra no cálculo:**
- Serviços executados
- Equipamentos vendidos/instalados
- Materiais utilizados
- Mão de obra
- Custos adicionais
- Descontos aplicados

**TOTAL DA OS = BASE PARA PONTOS**

---

## 🔢 FÓRMULA DE CÁLCULO DE PONTOS

### Fórmula Base:
```
PONTOS = VALOR_TOTAL × PONTOS_POR_REAL × MULTIPLICADOR_TIPO
```

### Configuração Padrão:

| Parâmetro | Valor |
|-----------|-------|
| **Pontos por R$ 1,00** | 1 ponto |
| **Multiplicador Instalação** | 2,0x |
| **Multiplicador Retrofit** | 2,5x |
| **Multiplicador Contrato** | 1,5x |
| **Multiplicador Manutenção** | 1,0x |

### Exemplos Práticos:

#### Exemplo 1: Manutenção de R$ 1.000
```
Tipo: Manutenção (1,0x)
Valor: R$ 1.000,00
Pontos: 1.000 × 1 × 1,0 = 1.000 pontos
```

#### Exemplo 2: Instalação de R$ 5.000
```
Tipo: Instalação (2,0x)
Valor: R$ 5.000,00
Pontos: 5.000 × 1 × 2,0 = 10.000 pontos
```

#### Exemplo 3: Retrofit de R$ 8.000
```
Tipo: Retrofit (2,5x)
Valor: R$ 8.000,00
Pontos: 8.000 × 1 × 2,5 = 20.000 pontos
```

#### Exemplo 4: Contrato de R$ 12.000
```
Tipo: Contrato (1,5x)
Valor: R$ 12.000,00
Pontos: 12.000 × 1 × 1,5 = 18.000 pontos
```

---

## 🎮 TIPOS DE SERVIÇO E MULTIPLICADORES

### Por que multiplicadores diferentes?

| Tipo | Multiplicador | Justificativa |
|------|---------------|---------------|
| **Manutenção** | 1,0x | Serviço recorrente, menor valor |
| **Contrato** | 1,5x | Compromisso de longo prazo |
| **Instalação** | 2,0x | Venda de equipamento + instalação |
| **Retrofit** | 2,5x | Maior valor agregado, complexidade |

**Estratégia:** Incentivar vendas de maior valor e complexidade.

---

## 🔄 QUANDO OS PONTOS SÃO GERADOS

### Processamento Automático

Os pontos são gerados **automaticamente** quando:

1. **OS é concluída** (`status = 'concluida'`)
2. **Cliente participa** (`participa_gamificacao = true`)
3. **OS não foi processada antes** (`incluir_gamificacao = false`)
4. **OS tem valor** (`total_value > 0`)

### Fluxo Automático:
```
OS Concluída
    ↓
Sistema verifica se cliente participa
    ↓
Calcula pontos (valor × multiplicador)
    ↓
Adiciona pontos ao saldo
    ↓
Atualiza estatísticas
    ↓
Verifica mudança de nível
    ↓
Registra histórico
    ↓
Marca OS como processada
```

### Campos Atualizados na OS:
- `incluir_gamificacao` → `true`
- `data_inclusao_gamificacao` → data/hora atual
- `pontos_gerados` → quantidade de pontos

---

## 📋 PROCESSAMENTO MANUAL

### Quando usar processamento manual?

- Cliente aderiu à gamificação DEPOIS de ter OSs concluídas
- OSs antigas que não foram processadas automaticamente
- Reprocessamento por correção

### Como funciona:

1. **Sistema lista OSs elegíveis:**
   - Status = concluída
   - Cliente participa da gamificação
   - `incluir_gamificacao = false` (não processada)
   - Valor > 0

2. **Usuário seleciona quais processar**

3. **Sistema processa em lote:**
   - Calcula pontos de cada OS
   - Adiciona ao saldo do cliente
   - Atualiza estatísticas
   - Marca como processada

---

## 🏆 O QUE É ATUALIZADO NO CLIENTE

Quando uma OS é processada, atualiza:

| Campo | Descrição |
|-------|-----------|
| `total_points` | Pontos totais acumulados (histórico) |
| `available_points` | Pontos disponíveis para usar |
| `used_points` | Pontos já utilizados |
| `current_tier` | Nível atual (Bronze/Silver/Gold/Diamond/VIP) |
| `total_purchases` | Total de compras (+1) |
| `total_spent` | Valor total gasto (soma) |
| `last_purchase_date` | Data da última compra |
| `first_purchase_date` | Data da primeira compra |

---

## 📊 RASTREABILIDADE COMPLETA

### 1. Histórico de Pontos (`customer_points_history`)

Cada transação registra:
```sql
{
  "customer_id": "uuid-do-cliente",
  "transaction_type": "purchase",
  "points": 10000,
  "balance_before": 5000,
  "balance_after": 15000,
  "service_order_id": "uuid-da-os",
  "description": "OS #2024-001 concluída - R$ 5.000",
  "created_at": "2024-01-08 14:30:00"
}
```

### 2. Log de Auditoria (`gamification_audit_log`)

Registra todas as ações:
```sql
{
  "action_type": "pontos_adicionados",
  "entity_type": "customer",
  "entity_id": "uuid-do-cliente",
  "description": "OS #2024-001 processada",
  "value_before": 5000,
  "value_after": 15000,
  "difference": 10000,
  "execution_type": "automatic",
  "created_at": "2024-01-08 14:30:00"
}
```

### 3. Vínculo com OS

Cada entrada no histórico tem:
- `service_order_id` - ID da OS que gerou os pontos
- Permite rastrear origem de cada ponto

---

## 🎯 NÍVEIS (TIERS) E PONTOS

### Tabela de Níveis:

| Nível | Pontos Mínimos | Desconto |
|-------|----------------|----------|
| 🥉 **Bronze** | 0 | 0% |
| 🥈 **Silver** | 1.000 | 5% |
| 🥇 **Gold** | 3.000 | 10% |
| 💎 **Diamond** | 7.000 | 15% |
| 👑 **VIP** | 15.000 | 20% |

### Mudança Automática de Nível:

- Sistema calcula nível baseado em `total_points`
- Atualiza `current_tier` automaticamente
- Registra `tier_achieved_date`
- Log de auditoria da conquista

---

## ❓ PERGUNTAS FREQUENTES

### 1. Equipamentos e Serviços são separados?

**NÃO.** O sistema usa o **valor total da OS**, independente da composição.

Exemplo de OS de R$ 10.000:
- R$ 7.000 em equipamentos
- R$ 2.000 em serviços
- R$ 1.000 em materiais

**Pontos calculados sobre R$ 10.000 (total)**

### 2. Como separar se eu quiser?

Se quiser dar pontos diferentes para equipamentos vs serviços, seria necessário:

**Opção A:** Criar OSs separadas
- OS 1: Venda de equipamentos
- OS 2: Serviços de instalação

**Opção B:** Customizar o sistema (requer desenvolvimento)
- Adicionar campos na OS para separar valores
- Modificar função de cálculo de pontos
- Criar regras diferentes por tipo de item

### 3. Descontos reduzem pontos?

**SIM.** Pontos são calculados sobre o **valor final** (após descontos).

Exemplo:
- Valor original: R$ 10.000
- Desconto: R$ 1.000
- **Valor final: R$ 9.000**
- Pontos: 9.000 × multiplicador

### 4. Posso mudar os multiplicadores?

**SIM.** Na configuração de gamificação você pode alterar:
- Pontos por real gasto
- Multiplicadores por tipo de serviço
- Valores dos níveis
- Descontos por nível
- Pontos bônus

### 5. E se cliente não participar?

OSs de clientes que **não participam** (`participa_gamificacao = false`):
- **NÃO geram pontos**
- **NÃO são processadas** automaticamente
- Ficam disponíveis caso cliente entre depois

### 6. Posso reprocessar uma OS?

**NÃO duplicadamente.** O sistema evita reprocessamento:
- Verifica se já existe entrada no histórico
- Se já processada, retorna aviso
- Previne duplicação de pontos

### 7. Como corrigir pontos errados?

**Opção 1:** Ajuste manual
- Use a função `add_customer_points` com valor negativo para remover
- Adicione novamente com valor correto

**Opção 2:** Suporte técnico
- Sistema tem log completo de auditoria
- Possível reverter transações específicas

---

## 🔍 CONSULTAS ÚTEIS

### Ver OSs processadas de um cliente:
```sql
SELECT
  so.order_number,
  so.total_value,
  so.service_type,
  so.pontos_gerados,
  so.data_inclusao_gamificacao
FROM service_orders so
WHERE so.customer_id = 'uuid-do-cliente'
  AND so.incluir_gamificacao = true
ORDER BY so.data_inclusao_gamificacao DESC;
```

### Ver histórico de pontos de um cliente:
```sql
SELECT
  transaction_type,
  points,
  balance_after,
  description,
  created_at
FROM customer_points_history
WHERE customer_id = 'uuid-do-cliente'
ORDER BY created_at DESC;
```

### Ver OSs pendentes de processamento:
```sql
SELECT
  so.order_number,
  c.nome_razao,
  so.total_value,
  so.service_type,
  so.completed_at
FROM service_orders so
INNER JOIN customers c ON so.customer_id = c.id
WHERE so.status = 'concluida'
  AND c.participa_gamificacao = true
  AND NOT COALESCE(so.incluir_gamificacao, false)
  AND so.total_value > 0
ORDER BY so.completed_at DESC;
```

### Ver total de pontos gerados por tipo de serviço:
```sql
SELECT
  so.service_type,
  COUNT(*) as total_os,
  SUM(so.total_value) as valor_total,
  SUM(so.pontos_gerados) as pontos_totais,
  AVG(so.pontos_gerados) as media_pontos
FROM service_orders so
WHERE so.incluir_gamificacao = true
GROUP BY so.service_type
ORDER BY pontos_totais DESC;
```

---

## ⚙️ CONFIGURAÇÃO DO SISTEMA

### Onde alterar configurações:

**No Sistema:**
1. Menu → Clientes
2. Aba "Gamificação"
3. Botão "Configurações"

**Ou diretamente no banco:**
```sql
UPDATE customer_gamification_config
SET
  points_per_real_spent = 1.00,
  installation_multiplier = 2.00,
  maintenance_multiplier = 1.00,
  retrofit_multiplier = 2.50,
  contract_multiplier = 1.50
WHERE active = true;
```

### Configurações Disponíveis:

| Parâmetro | Descrição | Padrão |
|-----------|-----------|--------|
| `points_per_real_spent` | Pontos por R$ 1,00 | 1.00 |
| `installation_multiplier` | Multiplicador instalação | 2.00 |
| `maintenance_multiplier` | Multiplicador manutenção | 1.00 |
| `retrofit_multiplier` | Multiplicador retrofit | 2.50 |
| `contract_multiplier` | Multiplicador contrato | 1.50 |
| `referral_bonus_points` | Bônus por indicação | 500 |
| `review_bonus_points` | Bônus por avaliação | 100 |
| `on_time_payment_bonus` | Bônus pagamento pontual | 50 |
| `birthday_bonus_points` | Bônus aniversário | 200 |

---

## 🚀 FLUXO COMPLETO - EXEMPLO REAL

### Cenário: Cliente João - Instalação de R$ 8.000

**1. Cliente adere à gamificação:**
```sql
UPDATE customers
SET participa_gamificacao = true,
    data_adesao_gamificacao = '2024-01-01'
WHERE id = 'uuid-joao';
```

**2. OS é criada e executada:**
```
Ordem de Serviço #2024-042
- Cliente: João
- Tipo: Instalação
- Valor total: R$ 8.000,00
- Status: em_andamento
```

**3. OS é concluída:**
```sql
UPDATE service_orders
SET status = 'concluida',
    completed_at = now()
WHERE id = 'uuid-os-042';
```

**4. Trigger automático dispara:**
```
✓ Cliente participa? SIM
✓ Tipo: instalação (2x)
✓ Valor: R$ 8.000
✓ Já processada? NÃO

Cálculo:
8.000 × 1 × 2,0 = 16.000 pontos
```

**5. Sistema atualiza:**

**customer_points:**
```
total_points: 0 → 16.000
available_points: 0 → 16.000
current_tier: bronze → VIP (15.000+)
total_purchases: 0 → 1
total_spent: R$ 0 → R$ 8.000
```

**customer_points_history:**
```
transaction_type: purchase
points: 16.000
balance_before: 0
balance_after: 16.000
description: "OS #2024-042 concluída - R$ 8.000"
```

**service_orders:**
```
incluir_gamificacao: false → true
data_inclusao_gamificacao: 2024-01-08 15:30:00
pontos_gerados: 16.000
```

**6. Cliente recebe notificação:**
```
🎉 Parabéns!
Você ganhou 16.000 pontos!
Subiu para o nível VIP (20% desconto)!
```

---

## 📈 RELATÓRIOS DISPONÍVEIS

### 1. Relatório Geral de Gamificação

View: `v_relatorio_gamificacao_cliente`

Mostra para cada cliente:
- Pontos totais
- Nível atual
- Total de compras
- Valor total gasto
- OSs incluídas na gamificação
- OSs pendentes de inclusão
- Valor pendente

### 2. OSs Disponíveis para Gamificação

View: `v_os_disponiveis_gamificacao`

Lista OSs que:
- Estão concluídas
- Cliente participa
- Ainda não foram processadas

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Para uma OS gerar pontos corretamente:

- [ ] Cliente tem `participa_gamificacao = true`
- [ ] OS tem `status = 'concluida'`
- [ ] OS tem `total_value > 0`
- [ ] OS tem `customer_id` preenchido
- [ ] OS tem `service_type` definido
- [ ] OS **NÃO** tem `incluir_gamificacao = true` (ainda não processada)
- [ ] Configuração de gamificação está `active = true`

**Se todas marcadas: OS será processada automaticamente!**

---

## 🎯 RESUMO EXECUTIVO

### Como funciona em 3 pontos:

1. **OS concluída** = valor total × multiplicador = **pontos**
2. **Pontos acumulados** = determina **nível** = define **desconto**
3. **Histórico completo** = rastreabilidade total de cada ponto

### Base de cálculo:

**VALOR TOTAL DA OS** (equipamentos + serviços + materiais + mão de obra)

### Não separa:

Equipamentos e serviços **juntos** no valor total da OS.

### Multiplicadores incentivam:

- Instalações (venda + serviço)
- Retrofits (alto valor)
- Contratos (longo prazo)

### Tudo automático:

- Cálculo de pontos
- Mudança de nível
- Atualização de descontos
- Histórico e auditoria

---

**Sistema 100% funcional e rastreável!**

Qualquer dúvida adicional, consulte os logs de auditoria ou histórico de transações.
