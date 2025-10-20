# Guia de Sincronização do Dashboard

## 📋 Objetivo
Sincronizar os dados existentes no sistema com as novas áreas de apresentação do dashboard (KPIs, OKRs e análises cruzadas).

## 🔄 Migrations para Executar

Execute as seguintes migrations **NA ORDEM** no Supabase SQL Editor:

### 1. Adicionar Lucro Potencial do Estoque ao Dashboard
```sql
-- Arquivo: 20251011230000_add_inventory_profit_to_dashboard.sql
```
**O que faz:**
- Adiciona campos de lucro potencial do estoque à view v_dashboard_financial
- Calcula valor de custo, valor de venda, lucro potencial e margem

### 2. Criar Views de KPIs e OKRs
```sql
-- Arquivo: 20251011235000_create_kpis_okrs_views.sql
```
**O que faz:**
- Cria view v_service_performance (performance dos serviços)
- Cria view v_material_consumption (consumo de materiais)
- Cria view v_customer_profitability (lucratividade por cliente)
- Cria view v_team_productivity (produtividade da equipe)
- Cria view v_business_kpis (KPIs principais do negócio)

### 3. Garantir Categorias Financeiras
```sql
-- Arquivo: 20251012000100_ensure_financial_categories.sql
```
**O que faz:**
- Cria categorias financeiras padrão (receitas e despesas)
- Garante que existe conta bancária principal
- Atualiza transações sem categoria ou conta bancária

### 4. Sincronizar Dados Existentes
```sql
-- Arquivo: 20251012000000_sync_existing_data_with_dashboard.sql
```
**O que faz:**
- Atualiza materiais com unit_cost e unit_price
- Atualiza service_orders com valores corretos
- Cria relacionamentos service_order_materials
- Cria relacionamentos service_order_team
- Popula financial_transactions baseado em service_orders
- Cria transações de folha de pagamento
- Cria despesas com materiais

## 🎯 Resultados Esperados

Após executar todas as migrations, você terá:

### Dashboard Principal
- ✅ 5 cards principais com métricas atualizadas
- ✅ Lucro potencial do estoque calculado
- ✅ Margem de lucro do estoque
- ✅ Transações recentes sincronizadas

### Aba Financeira - KPIs e OKRs
- ✅ Taxa de conversão
- ✅ Ticket médio
- ✅ Margem de lucro
- ✅ Tempo médio de atendimento

### Análises Cruzadas Disponíveis

**1. Serviços:**
- Total de OSs por serviço
- Taxa de conclusão
- Receita total e ticket médio
- Tempo médio de conclusão
- Clientes únicos atendidos

**2. Clientes:**
- Lucratividade individual
- Margem de lucro por cliente
- Frequência de pedidos
- Dias desde último pedido
- Top 20 clientes mais rentáveis

**3. Equipe:**
- Produtividade por colaborador
- Taxa de conclusão de OSs
- Receita gerada
- ROI salarial (receita/salário)
- Tempo médio de conclusão

**4. Estoque:**
- Valor em estoque
- Lucro potencial
- Margem potencial
- Itens mais consumidos
- Dias estimados de estoque

## 📊 Verificação

Após executar as migrations, verifique:

1. **Dashboard Principal:**
   - Acesse `/` ou `/dashboard`
   - Verifique se os 5 cards mostram valores
   - Confirme que "Lucro Estoque" aparece com valor e margem

2. **Gestão Financeira - KPIs:**
   - Acesse `/financial-integration`
   - Clique na aba "KPIs e OKRs"
   - Verifique se os 4 OKRs principais aparecem com barras de progresso
   - Navegue pelas abas: Visão Geral, Serviços, Clientes, Equipe

3. **Transações Financeiras:**
   - Acesse `/financial-integration`
   - Aba "Visão Geral"
   - Verifique se há transações recentes listadas

## 🔧 Solução de Problemas

### Se não aparecerem dados:

1. **Verifique se as views foram criadas:**
```sql
SELECT * FROM v_business_kpis;
SELECT * FROM v_service_performance;
SELECT * FROM v_customer_profitability;
SELECT * FROM v_team_productivity;
```

2. **Verifique se há dados nas tabelas:**
```sql
SELECT COUNT(*) FROM customers;
SELECT COUNT(*) FROM service_orders;
SELECT COUNT(*) FROM materials;
SELECT COUNT(*) FROM employees WHERE status = 'active';
SELECT COUNT(*) FROM financial_transactions;
```

3. **Force atualização no frontend:**
   - Abra o DevTools (F12)
   - Vá em Application > Storage > Clear site data
   - Recarregue a página

## 📝 Notas Importantes

- ⚠️ Execute as migrations NA ORDEM indicada
- ⚠️ A migration de sincronização cria relacionamentos aleatórios para demonstração
- ⚠️ Em produção, você deve ajustar os dados conforme sua realidade
- ✅ Todas as migrations são idempotentes (podem ser executadas múltiplas vezes)
- ✅ Dados existentes não serão perdidos

## 🎉 Próximos Passos

Após sincronização:
1. Revisar os dados gerados
2. Ajustar metas dos OKRs conforme sua realidade
3. Cadastrar dados reais de clientes e serviços
4. Monitorar KPIs periodicamente para tomada de decisão

## 📈 Dashboards Disponíveis

- **Dashboard Principal** (`/dashboard`)
  - Visão geral do negócio
  - Cards de métricas principais
  - OSs ativas
  - Transações recentes

- **Dashboard Executivo** (`/executive-dashboard`)
  - Análises estratégicas
  - Gráficos de tendência
  - Comparativos

- **Gestão Financeira - KPIs** (`/financial-integration` > aba KPIs)
  - OKRs e metas
  - Análises cruzadas
  - Relatórios detalhados
