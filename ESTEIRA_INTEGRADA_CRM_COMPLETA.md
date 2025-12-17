# ESTEIRA INTEGRADA CRM + PÓS-VENDA

## SISTEMA DE PRODUÇÃO CONTÍNUA DE CLIENTES

O sistema agora funciona como uma **ESTEIRA DE PRODUÇÃO** onde os clientes fluem automaticamente entre diferentes estágios, desde o primeiro contato até a retenção e expansão.

---

## COMO FUNCIONA A ESTEIRA

### **FLUXO COMPLETO:**

```
PIPELINE DE VENDAS:
Lead → Qualificado → Reunião → Proposta → Negociação → Fechamento → GANHO ✓

        ↓ (AUTOMÁTICO) ↓

PIPELINE DE PÓS-VENDA:
Onboarding → Follow-up Curto → Follow-up Longo → Retenção/Upsell → Indicação → Sucesso
```

---

## MOVIMENTAÇÃO AUTOMÁTICA

### **1. Da Venda para o Pós-Venda (AUTOMÁTICO)**

Quando você move uma oportunidade para o stage **"Ganho"**:
- ✅ Sistema cria AUTOMATICAMENTE um card no Pós-Venda
- ✅ Cliente entra no stage "Onboarding"
- ✅ Define primeiro follow-up para 3 dias
- ✅ Registra toda a movimentação no histórico

### **2. Dentro do Pós-Venda (AUTOMÁTICO POR TEMPO)**

Execute o botão **"Executar Automação"** para mover clientes automaticamente:

- **Onboarding → Follow-up Curto**: Após 7 dias
- **Follow-up Curto → Follow-up Longo**: Após 30 dias
- **Follow-up Longo → Retenção/Upsell**: Após 90 dias

Você também pode mover manualmente arrastando os cards entre os stages!

---

## STAGES DO PÓS-VENDA

### **1. Onboarding (0-7 dias)**
- Cliente novo que acabou de fechar
- Ação sugerida: **Welcome Call**
- Objetivo: Ativação e primeiras instruções

### **2. Follow-up Curto (7-30 dias)**
- Primeiras semanas de uso
- Ação sugerida: **Verificar Satisfação**
- Objetivo: Garantir que está usando bem o serviço

### **3. Follow-up Longo (30-90 dias)**
- Primeiro trimestre
- Ação sugerida: **Pesquisa NPS**
- Objetivo: Medir satisfação e identificar melhorias

### **4. Retenção/Upsell (90+ dias)**
- Cliente maduro
- Ação sugerida: **Apresentar Novos Serviços**
- Objetivo: Expandir relacionamento e valor

### **5. Indicação/Referral**
- Clientes promotores (NPS 9-10)
- Ação sugerida: **Solicitar Indicação**
- Objetivo: Crescimento via indicações

### **6. Churn Risk**
- Cliente em risco de cancelamento
- Ação sugerida: **Ação de Retenção URGENTE**
- Objetivo: Recuperar cliente antes de perder

### **7. Cliente Inativo**
- Cliente que cancelou ou não responde
- Stage final/fechado

---

## HEALTH SCORE DO CLIENTE

Cada cliente no Pós-Venda tem um **Health Score** (0-100%) que indica a saúde do relacionamento:

### **Cálculo:**
```
Health Score = 100
  - (dias sem atividade × 2)
  - (follow-up atrasado? -20 pontos)
  + (número de interações × 5)
```

### **Cores:**
- 🟢 **Verde (80-100%)**: Cliente saudável
- 🟡 **Amarelo (60-79%)**: Atenção necessária
- 🟠 **Laranja (40-59%)**: Risco médio
- 🔴 **Vermelho (0-39%)**: URGENTE - Churn Risk

---

## ESTATÍSTICAS DA ESTEIRA

No topo da tela você vê:

1. **Total na Esteira**: Quantos clientes estão ativos em todos os pipelines
2. **Valor Total**: Soma do valor de todas as oportunidades ativas
3. **Alertas Urgentes**: Quantos clientes precisam de ação URGENTE
4. **Health Score Médio**: Saúde geral da base de clientes

---

## COMO USAR

### **Acessar a Esteira:**
- URL: `/crm-esteira` ou `/crm-professional` ou `/pos-venda`
- Todas levam para a mesma tela integrada!

### **Criar Nova Oportunidade:**
1. Clique em **"Nova Oportunidade"**
2. Preencha os dados
3. Sistema coloca automaticamente no primeiro stage

### **Mover Cliente (Manual):**
1. **Arraste e solte** o card entre os stages
2. Sistema registra automaticamente no histórico
3. Se mover para "Ganho", cria card no Pós-Venda

### **Executar Automação:**
1. Clique em **"Executar Automação"** no topo
2. Sistema move TODOS os clientes que estão há muito tempo no stage
3. Veja quantos foram movidos na notificação

### **Contatar Cliente:**
- **WhatsApp**: Clique no ícone verde (mensagem pré-pronta)
- **Ver Detalhes**: Clique no ícone olho para editar/ver mais

---

## HISTÓRICO DE MOVIMENTAÇÕES

Toda movimentação na esteira é registrada automaticamente:

- De qual stage veio
- Para qual stage foi
- Quanto tempo ficou no stage anterior
- Quem moveu (ou se foi automático)
- Motivo da movimentação

### **Ver Histórico:**
```sql
SELECT * FROM crm_opportunity_stage_history
WHERE opportunity_id = 'seu-id-aqui'
ORDER BY moved_at DESC;
```

---

## PRÓXIMAS AÇÕES SUGERIDAS

O sistema sugere automaticamente o que fazer com cada cliente:

- **Contato Urgente**: Follow-up está atrasado
- **Reativar Contato**: Cliente sem atividade há mais de 7 dias
- **Welcome Call**: Cliente novo em Onboarding
- **Verificar Satisfação**: Cliente em Follow-up Curto
- **Pesquisa NPS**: Cliente em Follow-up Longo
- **Apresentar Novos Serviços**: Cliente em Retenção/Upsell
- **Solicitar Indicação**: Cliente promotor
- **Ação de Retenção URGENTE**: Cliente em Churn Risk

---

## FUNÇÕES NO BANCO DE DADOS

### **1. Mover Oportunidade**
```sql
SELECT move_opportunity_to_stage_v2(
  'id-da-oportunidade',
  'id-do-novo-stage',
  'id-do-usuario',
  'Motivo da movimentação',
  false  -- false = manual, true = automático
);
```

### **2. Criar Card de Pós-Venda Manualmente**
```sql
SELECT create_pos_venda_from_won_opportunity(
  'id-da-oportunidade-ganha',
  'id-do-cliente',
  valor_da_venda,
  'Título do serviço'
);
```

### **3. Executar Automação de Movimentação**
```sql
-- Retorna quantos clientes foram movidos
SELECT auto_move_pos_venda_by_time();
```

### **4. Ver Estatísticas da Esteira**
```sql
SELECT * FROM get_esteira_stats();
```

### **5. Ver Esteira Completa**
```sql
SELECT * FROM v_crm_esteira_completa;
```

---

## VANTAGENS DA ESTEIRA INTEGRADA

✅ **Nenhum Cliente é Esquecido**: Sistema avisa automaticamente quando precisa agir

✅ **Movimentação Automática**: Clientes avançam sozinhos baseado em tempo

✅ **Visão Completa**: Veja todo o ciclo de vida em uma tela

✅ **Health Score**: Identifique rapidamente clientes em risco

✅ **Histórico Completo**: Rastreie toda a jornada do cliente

✅ **Ações Sugeridas**: Sistema diz o que fazer com cada cliente

✅ **Drag & Drop**: Interface intuitiva para mover clientes

✅ **Integração Total**: Venda e Pós-Venda trabalham juntos

---

## COMO CONFIGURAR AUTOMAÇÃO AGENDADA

Para que a automação rode automaticamente a cada hora sem precisar clicar:

### **Opção 1: Trigger Agendado (pg_cron)**
```sql
-- Instalar extensão (se não tiver)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar para rodar todo dia às 9h
SELECT cron.schedule(
  'auto-move-posvenda',
  '0 9 * * *',  -- Todo dia às 9h
  $$SELECT auto_move_pos_venda_by_time();$$
);
```

### **Opção 2: Webhook Externa**
Configure um serviço externo (como Zapier, Make, ou n8n) para chamar:
```javascript
// Chamar a cada hora
supabase.rpc('auto_move_pos_venda_by_time')
```

---

## TROUBLESHOOTING

### **Não está criando card no Pós-Venda automaticamente?**
- Verifique se o stage tem `is_won = true`
- Verifique se a oportunidade tem `customer_id` preenchido
- Veja os logs no console do navegador

### **Automação não move ninguém?**
- Execute manualmente: `SELECT auto_move_pos_venda_by_time();`
- Verifique se os clientes realmente estão há tempo suficiente no stage
- Veja a query: `SELECT * FROM crm_opportunities WHERE stage_id = 'id-do-stage'`

### **Health Score sempre 0?**
- Health Score só aparece para pipeline de Pós-Venda
- Verifique se o campo `pipeline.tipo` está como 'pos_venda'

---

## RESUMO

Você agora tem uma **ESTEIRA DE PRODUÇÃO CONTÍNUA** onde:

1. ✅ Leads entram pelo Pipeline de Vendas
2. ✅ Quando fecham, vão AUTOMATICAMENTE para o Pós-Venda
3. ✅ Sistema move automaticamente baseado em tempo
4. ✅ Você vê o Health Score de cada cliente
5. ✅ Sistema sugere próximas ações
6. ✅ Nenhum cliente é esquecido
7. ✅ Tudo integrado em uma única tela

**É como uma linha de produção industrial, mas para relacionamento com clientes!**

---

## Suporte

Qualquer dúvida, consulte:
- View: `v_crm_esteira_completa`
- Função: `get_esteira_stats()`
- Histórico: `crm_opportunity_stage_history`
