/*
  # Popular Base de Conhecimento ThomazAI - Completo

  1. Documentação Adicional
    - Manual Completo de Ordens de Serviço
    - Guia de Gestão de Estoque
    - SOP de Gestão Financeira
    - FAQ Técnico do Sistema
    - Políticas de Crédito e Cobrança

  2. Configurações
    - Ativar auto-indexação
    - Configurar triggers de atualização

  3. Otimizações
    - Índices adicionais para performance
*/

-- =====================================================
-- 1. INSERIR DOCUMENTOS ADICIONAIS
-- =====================================================

-- Manual Completo de Ordens de Serviço
INSERT INTO thomaz_knowledge_sources (
  title,
  content,
  source_type,
  category,
  sensitivity,
  version,
  is_active,
  required_roles
) VALUES (
  'Manual Completo - Gestão de Ordens de Serviço',
  E'# Manual Completo - Gestão de Ordens de Serviço

## 1. Criação de Ordem de Serviço

### Pré-requisitos
- Cliente cadastrado com endereço completo
- Catálogo de serviços configurado (opcional)
- Equipe disponível para alocação

### Passo a Passo Completo

**PASSO 1: Acessar Módulo de OS**
1. Menu lateral > Ordens de Serviço
2. Botão "Nova OS" no canto superior direito
3. Sistema abre wizard de criação

**PASSO 2: Informações Básicas**
- Selecionar cliente (busca por nome/CNPJ)
- Escolher tipo de serviço
- Definir prioridade (Baixa/Normal/Alta/Urgente)
- Data prevista de início
- Prazo de execução

**PASSO 3: Selecionar Serviços**

**OPÇÃO A - Com Catálogo:**
1. Buscar serviço no campo de busca
2. Clicar em "Adicionar"
3. Ajustar quantidade se necessário
4. Sistema calcula automaticamente materiais e mão de obra

**OPÇÃO B - Sem Catálogo (Manual):**
1. Clicar em "Adicionar Item Manual"
2. Preencher:
   - Descrição do serviço
   - Escopo detalhado
   - Quantidade
   - Valor unitário
   - Observações técnicas

**PASSO 4: Materiais**
- Sistema sugere materiais do catálogo (se aplicável)
- Adicionar materiais extras se necessário
- Verificar disponibilidade em estoque
- Definir se será comprado ou já existe

**PASSO 5: Equipe Técnica**
- Selecionar funcionários responsáveis
- Definir função de cada um (Líder/Técnico/Auxiliar)
- Sistema calcula custo de mão de obra automaticamente
- Verificar disponibilidade na agenda

**PASSO 6: Custos e Precificação**
- Revisar custos calculados:
  - Materiais: R$ XXX
  - Mão de obra: R$ XXX
  - Equipamentos: R$ XXX (se houver)
- Definir markup/margem desejada
- Valor final para cliente
- Condições de pagamento

**PASSO 7: Revisão e Criação**
- Revisar todos os dados
- Adicionar observações gerais
- Anexar documentos (opcional)
- Clicar em "Criar Ordem de Serviço"

### Erros Comuns

**1. "missing_client_id"**
- Causa: Cliente não vinculado à OS
- Solução: Voltar ao PASSO 2 e selecionar cliente

**2. "items_required"**
- Causa: Nenhum serviço adicionado
- Solução: Adicionar pelo menos 1 item no PASSO 3

**3. "invalid_pricing"**
- Causa: Valores zerados ou negativos
- Solução: Revisar precificação no PASSO 6

**4. "team_not_available"**
- Causa: Funcionário já alocado em outra OS na mesma data
- Solução: Escolher outra data ou outro funcionário

## 2. Acompanhamento de OS

### Status Disponíveis
- **Rascunho**: OS criada mas não aprovada
- **Aguardando Aprovação**: Aguardando OK do cliente
- **Aprovada**: Cliente aprovou, pronta para iniciar
- **Em Andamento**: Equipe executando
- **Pausada**: Temporariamente suspensa
- **Concluída**: Serviço finalizado
- **Cancelada**: OS cancelada

### Mudança de Status
1. Abrir OS no sistema
2. Clicar em "Alterar Status"
3. Selecionar novo status
4. Adicionar motivo/observação (obrigatório para Pausada/Cancelada)
5. Confirmar

### Check-ins da Equipe
- Líder faz check-in ao iniciar trabalho
- Registrar fotos de antes/durante/depois
- Marcar materiais utilizados
- Registrar horas trabalhadas

## 3. Finalização e Faturamento

### Checklist de Conclusão
□ Todos serviços executados conforme escopo
□ Cliente assinou termo de aceite
□ Fotos finais anexadas
□ Materiais utilizados registrados
□ Horas trabalhadas confirmadas
□ Observações técnicas preenchidas

### Gerar Nota Fiscal
1. Status da OS = "Concluída"
2. Menu > "Gerar NF"
3. Sistema preenche dados automaticamente
4. Revisar valores
5. Emitir NF-e
6. Enviar para cliente

### Métricas de Qualidade
- Meta de retrabalho: < 5%
- Prazo cumprido: > 90%
- Satisfação do cliente: > 8/10
- Margem real vs planejada: > 85%',
  'MANUAL',
  'Operacional',
  'internal',
  '1.0',
  true,
  ARRAY['admin', 'gestor', 'vendas', 'tecnico']
),

-- Guia de Gestão de Estoque
(
  'Guia - Gestão Eficiente de Estoque',
  E'# Guia de Gestão Eficiente de Estoque

## 1. Princípios de Gestão de Estoque

### Regra de Ouro
**"Estoque é dinheiro parado - minimize sem comprometer operação"**

### Objetivos
1. Giro de estoque > 6x/ano
2. Ruptura de estoque < 2%
3. Itens obsoletos < 5% do valor total
4. Acuracidade > 98%

## 2. Classificação ABC

### Categoria A (20% dos itens, 80% do valor)
- Itens de alto giro e alto valor
- Contagem mensal obrigatória
- Ponto de reposição automático
- Fornecedores alternativos

### Categoria B (30% dos itens, 15% do valor)
- Itens de giro médio
- Contagem trimestral
- Ponto de reposição definido

### Categoria C (50% dos itens, 5% do valor)
- Itens de baixo giro
- Contagem semestral
- Compra sob demanda

## 3. Ponto de Reposição

### Fórmula
```
Ponto de Reposição = (Consumo Médio Diário × Lead Time) + Estoque de Segurança
```

### Exemplo Prático
- Consumo médio: 10 unidades/dia
- Lead time fornecedor: 15 dias
- Estoque de segurança: 30 unidades (3 dias)

**Ponto de Reposição = (10 × 15) + 30 = 180 unidades**

Quando estoque atingir 180un, fazer pedido!

## 4. Entrada de Materiais

### Procedimento
1. Receber material com Nota Fiscal
2. Conferir quantidade e qualidade
3. Registrar entrada no sistema
4. Etiquetar com código de barras
5. Armazenar no local correto
6. Atualizar inventário

### Checklist de Conferência
□ Quantidade confere com NF?
□ Materiais sem avarias?
□ Código correto no sistema?
□ Validade OK (se aplicável)?
□ Documentos arquivados?

## 5. Saída de Materiais

### Para Ordem de Serviço
1. OS aprovada e em andamento
2. Requisitar materiais no sistema
3. Sistema baixa do estoque automaticamente
4. Técnico assina retirada
5. Materiais não utilizados devem retornar

### Controle de Sobras
- Materiais não utilizados retornam ao estoque
- Registrar devolução no sistema
- Importante para cálculo de custo real da OS

## 6. Inventário Físico

### Periodicidade
- Itens A: Mensal
- Itens B: Trimestral
- Itens C: Semestral
- Inventário geral: Anual

### Procedimento de Contagem
1. Parar movimentações durante contagem
2. Imprimir lista de itens
3. Contar fisicamente
4. Registrar divergências
5. Investigar causas
6. Ajustar sistema

### Meta de Acuracidade
- Divergência aceitável: ±2%
- Acima disso: investigar e corrigir processo

## 7. Indicadores de Performance

### KPIs Essenciais

**Giro de Estoque**
```
Giro = Custo das Vendas Anual / Estoque Médio
Meta: > 6x/ano
```

**Cobertura de Estoque**
```
Cobertura = Estoque Atual / Consumo Médio Mensal
Meta: 1-2 meses (30-60 dias)
```

**Taxa de Ruptura**
```
Ruptura = (Dias sem estoque / Dias úteis) × 100
Meta: < 2%
```

**Acuracidade**
```
Acuracidade = (Itens corretos / Total de itens) × 100
Meta: > 98%
```

## 8. Ações para Otimização

### Se Giro Baixo (< 4x/ano)
1. Reduzir quantidade de compra em 30%
2. Aumentar frequência de pedidos
3. Negociar lotes menores com fornecedor
4. Considerar consignação para itens C

### Se Ruptura Alta (> 3%)
1. Aumentar estoque de segurança
2. Buscar fornecedores alternativos
3. Reduzir lead time de compra
4. Implementar sistema de alerta

### Se Acuracidade Baixa (< 95%)
1. Revisar processo de entrada/saída
2. Treinar equipe
3. Implementar contagem cíclica
4. Melhorar organização física

## 9. Compras Estratégicas

### Quando Comprar em Lote?
✅ Desconto > 15%
✅ Item de alto giro (A)
✅ Preço em tendência de alta
✅ Espaço disponível para armazenagem

### Quando NÃO Comprar em Lote?
❌ Desconto < 10%
❌ Item de baixo giro (C)
❌ Risco de obsolescência
❌ Capital limitado

## 10. Checklist Mensal do Gestor

□ Revisar itens com baixo giro
□ Verificar itens próximos do ponto de reposição
□ Analisar rupturas do mês
□ Conferir acuracidade do inventário
□ Avaliar performance de fornecedores
□ Atualizar preços de compra no sistema
□ Identificar itens obsoletos
□ Calcular giro de estoque mensal',
  'GUIDE',
  'Operacional',
  'internal',
  '1.0',
  true,
  ARRAY['admin', 'gestor', 'tecnico']
),

-- SOP Gestão Financeira
(
  'SOP - Gestão Financeira Diária',
  E'# SOP - Gestão Financeira Diária

## 1. Rotina Matinal (8h-9h)

### Checklist de Abertura
□ Verificar saldo bancário em todas as contas
□ Conferir lançamentos automáticos (débitos agendados)
□ Revisar contas a pagar do dia
□ Verificar recebimentos esperados
□ Atualizar projeção de caixa

### Ações Imediatas
- Saldo negativo ou crítico? Alertar gestor
- Pagamentos vencendo hoje? Preparar para execução
- Recebimentos em atraso? Iniciar cobrança

## 2. Contas a Pagar

### Antes de Pagar
1. Verificar se há NF e comprovante
2. Conferir se serviço/material foi recebido
3. Validar valores e vencimento
4. Verificar disponibilidade de caixa
5. Obter aprovação do gestor (valores > R$ 5.000)

### Execução do Pagamento
1. Acessar sistema bancário
2. Realizar transferência/pagamento
3. Salvar comprovante
4. Registrar no sistema (status = "Pago")
5. Anexar comprovante à despesa
6. Arquivar documentos

### Priorização (se caixa limitado)
1. Folha de pagamento e encargos
2. Fornecedores estratégicos
3. Impostos e taxas obrigatórias
4. Aluguel e contas essenciais
5. Demais fornecedores

## 3. Contas a Receber

### Rotina de Cobrança

**T-5 dias** (5 dias antes vencimento)
- WhatsApp/Email: "Lembrete amigável de vencimento"

**T-0** (dia do vencimento)
- WhatsApp: "Fatura vence hoje, link para pagamento"

**T+1** (1 dia de atraso)
- Ligação telefônica
- Verificar se há problema ou só esquecimento

**T+3** (3 dias de atraso)
- Email formal de cobrança
- WhatsApp reforçando necessidade

**T+7** (7 dias de atraso)
- Ligação do gestor financeiro
- Negociar parcelamento se necessário
- Bloquear novos pedidos no sistema

**T+15** (15 dias de atraso)
- Última tentativa amigável
- Propor acordo com desconto se pagar em 24h
- Avisar sobre possível protesto/negativação

**T+30** (30 dias de atraso)
- Encaminhar para jurídico/cobrança externa
- Provisionar como perda
- Enviar para SPC/Serasa

### Script de Cobrança Educada

**Ligação T+1:**
```
"Bom dia [Nome], tudo bem?
É [Seu Nome] da [Empresa].
Só uma rápida confirmação:
A fatura [número] venceu ontem.
Houve algum problema com o pagamento?
Posso enviar o boleto novamente?"
```

## 4. Conciliação Bancária

### Diariamente
1. Exportar extrato bancário
2. Comparar com lançamentos no sistema
3. Identificar divergências
4. Classificar lançamentos não identificados
5. Ajustar sistema se necessário

### Divergências Comuns
- Taxas bancárias não lançadas
- Transferências entre contas
- Pagamentos duplicados
- Recebimentos sem identificação

## 5. Fluxo de Caixa

### Projeção Semanal

| Dia | Entradas | Saídas | Saldo |
|-----|----------|--------|-------|
| Seg | R$ 15k   | R$ 8k  | R$ 7k |
| Ter | R$ 20k   | R$ 12k | R$ 15k|
| Qua | R$ 10k   | R$ 25k | R$ 0k ⚠️|
| Qui | R$ 18k   | R$ 5k  | R$ 13k|
| Sex | R$ 22k   | R$ 10k | R$ 25k|

**Ação:** Quarta com saldo crítico - antecipar recebíveis!

### Alertas de Caixa
- 🔴 Saldo < 5 dias de operação: CRÍTICO
- 🟡 Saldo < 10 dias: ATENÇÃO
- 🟢 Saldo > 15 dias: SAUDÁVEL

## 6. Relatórios Obrigatórios

### Diário (enviar até 9h)
- Saldo de caixa atualizado
- Pagamentos realizados
- Recebimentos do dia anterior
- Projeção próximos 7 dias

### Semanal (enviar sexta 17h)
- Resumo de entradas e saídas
- Contas em atraso (a pagar e receber)
- Análise de desvios vs projeção
- Principais movimentações

### Mensal (até dia 5 do mês seguinte)
- DRE (Demonstração de Resultado)
- Balanço patrimonial simplificado
- Análise de indicadores (margem, DSO, etc)
- Recomendações de melhorias

## 7. Indicadores Financeiros

### Calcular Mensalmente

**Margem de Contribuição**
```
Margem = (Receita - Custos Variáveis) / Receita × 100
Meta: > 30%
```

**DSO (Prazo Médio de Recebimento)**
```
DSO = (Contas a Receber / Receita Mensal) × 30
Meta: < 45 dias
```

**Liquidez Corrente**
```
Liquidez = Ativo Circulante / Passivo Circulante
Meta: > 1.5
```

## 8. Checklist Fim do Mês

□ Conciliar todas as contas bancárias
□ Lançar todas as despesas do mês
□ Registrar todos os recebimentos
□ Calcular impostos do mês (DAS/Simples)
□ Provisionar férias e 13º
□ Atualizar projeção do próximo mês
□ Gerar relatórios mensais
□ Enviar relatórios ao gestor/sócios',
  'SOP',
  'Financeiro',
  'confidential',
  '1.0',
  true,
  ARRAY['admin', 'gestor', 'financeiro']
),

-- FAQ Técnico
(
  'FAQ Técnico - Erros Comuns do Sistema',
  E'# FAQ Técnico - Erros Comuns e Soluções

## 1. Erros de Autenticação

### "Invalid credentials"
**Causa:** Email ou senha incorretos
**Solução:**
1. Verificar se email está correto (lowercase)
2. Usar "Esqueci minha senha"
3. Verificar se usuário está ativo no sistema

### "Session expired"
**Causa:** Sessão expirou (inatividade > 2h)
**Solução:**
1. Fazer login novamente
2. Sistema preserva dados não salvos (rascunhos)

## 2. Erros em Ordens de Serviço

### "missing_client_id"
**Causa:** Cliente não vinculado
**Solução:**
1. Abrir OS em edição
2. Aba "Informações Básicas"
3. Selecionar cliente no dropdown
4. Salvar

### "items_required"
**Causa:** Nenhum item/serviço adicionado
**Solução:**
1. Aba "Serviços"
2. Adicionar pelo menos 1 item
3. Salvar

### "team_member_conflict"
**Causa:** Funcionário já alocado em outra OS
**Solução:**
1. Verificar agenda do funcionário
2. Escolher outro funcionário OU
3. Alterar data da OS

### "invalid_margin"
**Causa:** Margem negativa ou muito baixa
**Solução:**
1. Revisar precificação
2. Aumentar preço de venda OU
3. Reduzir custos

## 3. Erros Financeiros

### "insufficient_balance"
**Causa:** Saldo insuficiente para pagamento
**Solução:**
1. Aguardar recebimentos OU
2. Adiar pagamento OU
3. Buscar antecipação de recebíveis

### "duplicate_entry"
**Causa:** Lançamento duplicado
**Solução:**
1. Buscar lançamento no sistema
2. Se duplicado, excluir um
3. Se legítimo, adicionar observação diferenciando

## 4. Erros de Estoque

### "insufficient_stock"
**Causa:** Material não disponível
**Solução:**
1. Verificar saldo real em estoque físico
2. Se disponível: ajustar sistema
3. Se indisponível: fazer pedido urgente

### "item_not_found"
**Causa:** Material não cadastrado
**Solução:**
1. Cadastrar novo material
2. Definir categoria e unidade
3. Atualizar estoque inicial

## 5. Performance e Lentidão

### Sistema Lento
**Causas possíveis:**
- Muitas abas abertas
- Cache cheio
- Conexão lenta

**Soluções:**
1. Limpar cache do navegador (Ctrl+Shift+Del)
2. Fechar abas não utilizadas
3. Verificar velocidade de internet
4. Usar Chrome/Edge (melhor performance)

### "Tela em branco"
**Solução:**
1. F5 (Reload)
2. Ctrl+Shift+R (Hard reload)
3. Limpar cache
4. Se persistir: reportar ao suporte

## 6. Impressão de Documentos

### "Erro ao gerar PDF"
**Causas:**
- Pop-up bloqueado
- Dados incompletos no documento

**Soluções:**
1. Permitir pop-ups do site
2. Verificar se todos campos obrigatórios estão preenchidos
3. Tentar novamente

### "PDF sem logomarca"
**Solução:**
1. Menu > Configurações da Empresa
2. Upload de logo (PNG/JPG, máx 2MB)
3. Salvar
4. Gerar PDF novamente

## 7. Suporte e Escalação

### Quando Abrir Ticket?
- Erro não listado neste FAQ
- Erro recorrente
- Perda de dados
- Bug visual crítico
- Sugestão de melhoria

### Como Abrir Ticket?
1. Menu > Suporte
2. Descrever problema detalhadamente
3. Anexar print da tela (se possível)
4. Informar passos para reproduzir
5. Enviar

### Prioridade de Tickets
- 🔴 **Crítico:** Sistema parado, perda de dados
- 🟡 **Alto:** Funcionalidade importante quebrada
- 🟢 **Normal:** Bug visual, melhoria
- ⚪ **Baixo:** Dúvida, sugestão

### SLA de Resposta
- Crítico: 2 horas
- Alto: 4 horas
- Normal: 1 dia útil
- Baixo: 3 dias úteis',
  'FAQ',
  'Suporte',
  'public',
  '1.0',
  true,
  ARRAY['admin', 'gestor', 'financeiro', 'vendas', 'tecnico', 'user']
),

-- Políticas de Crédito
(
  'Políticas de Crédito e Cobrança',
  E'# Políticas de Crédito e Cobrança

## 1. Análise de Crédito

### Clientes Novos (Sem Histórico)

**Perfil Pessoa Física:**
- Limite inicial: R$ 5.000
- Pagamento: 50% antecipado, 50% na entrega
- Após 3 pagamentos em dia: liberar crédito de 30 dias

**Perfil Pessoa Jurídica:**
- Limite inicial: R$ 10.000
- Exigir: CNPJ ativo, referências comerciais
- Consulta SPC/Serasa obrigatória
- Pagamento: 30% antecipado, 70% em 15 dias

### Aumento de Limite

**Critérios para Aprovação:**
✅ Mínimo de 6 meses de relacionamento
✅ Histórico de pagamento 100% em dia
✅ Faturamento mensal > R$ 15.000 com a empresa
✅ Consulta de crédito limpa

**Limites por Perfil:**
- Bronze (novo): até R$ 5.000
- Prata (6 meses): até R$ 15.000
- Ouro (1 ano): até R$ 30.000
- Platinum (2 anos): até R$ 50.000

## 2. Condições de Pagamento

### Opções Padrão

**À Vista (0 dias)**
- Desconto: 5%
- Melhor para fluxo de caixa

**15 dias**
- Desconto: 2%
- Prazo curto, bom para giro

**30 dias**
- Sem desconto
- Padrão para clientes regulares

**45 dias**
- Acréscimo: 3%
- Apenas clientes Gold+

**Parcelado (2-3x)**
- Cartão de crédito: taxa 4%
- Boleto: sem taxa, vencimentos 30/60/90 dias

### Negociações Especiais

**Pedidos > R$ 50.000:**
- Exigir 30% de entrada
- Saldo em até 3x sem juros
- Aprovação do gestor financeiro

**Contratos Recorrentes:**
- Pagamento mensal fixo
- Vencimento sempre dia 10
- Desconto de 10% no valor total anual

## 3. Cobrança Preventiva

### Filosofia
**"Cobrar não é chato, é profissional"**

### Timeline de Ações

**D-5 (5 dias antes do vencimento)**
```
📱 WhatsApp Amigável:
"Olá [Nome]! Lembrete amigável: sua fatura #[NUM] vence em 5 dias (dia [DATA]). Link para pagamento: [LINK]. Qualquer dúvida, estamos à disposição!"
```

**D-1 (véspera do vencimento)**
```
📧 Email + WhatsApp:
"Olá [Nome], sua fatura vence amanhã. Segue o link para pagamento: [LINK]. Precisa de alguma orientação?"
```

**D+0 (dia do vencimento)**
```
📱 WhatsApp:
"Bom dia [Nome], fatura #[NUM] vence hoje. Se já pagou, por favor envie o comprovante. Obrigado!"
```

## 4. Cobrança Ativa (Atrasos)

### D+1 (1 dia de atraso)

**Ligação Educada:**
```
"Bom dia [Nome], é [Seu Nome] da [Empresa].
Vi que a fatura [NUM] venceu ontem.
Houve algum problema?
Posso te ajudar de alguma forma?"
```

**Postura:** Compreensiva, solucionadora

### D+3 (3 dias de atraso)

**Email Formal + WhatsApp:**
```
Assunto: Fatura [NUM] em atraso - Ação necessária

Prezado [Nome],

Verificamos que a fatura #[NUM] no valor de R$ [VALOR] está em atraso há 3 dias.

Para regularizar, por favor realizar o pagamento até [DATA +2 dias].

Link para pagamento: [LINK]
Dúvidas: [TELEFONE]

Atenciosamente,
[Seu Nome] - Financeiro
```

**Ação:** Bloquear novos pedidos no sistema

### D+7 (7 dias de atraso)

**Ligação do Gestor Financeiro:**
```
"[Nome], preciso de sua atenção.
Fatura [NUM] está 7 dias em atraso.
Isso está impactando nosso fluxo.
O que podemos fazer para resolver hoje?"
```

**Oferecer:** Parcelamento em 2x (se cliente bom)

### D+15 (15 dias de atraso)

**Carta de Cobrança Formal:**
```
Prezado [Nome],

Fatura [NUM] - R$ [VALOR] - 15 dias de atraso

Esta é nossa última tentativa de acordo amigável.

OPÇÕES:
1. Pagamento integral até [DATA]: Desconto de 5% (R$ [VALOR_COM_DESC])
2. Parcelamento em 3x: R$ [VALOR/3] (sem desconto)

Sem resposta até [DATA + 3 dias]:
- Inclusão no SPC/Serasa
- Protesto do título
- Juros de mora: 1% ao mês

Para regularizar: [CONTATO]

[Nome do Gestor]
Gerente Financeiro
```

### D+30 (30 dias de atraso)

**Ações Legais:**
- Enviar para empresa de cobrança externa
- Registrar protesto em cartório
- Inclusão em SPC/Serasa
- Provisionar como perda (100%)
- Encaminhar ao jurídico (se valor > R$ 10k)

## 5. Negociação de Dívidas

### Diretrizes

**O que PODE fazer:**
✅ Parcelar em até 6x (sem juros)
✅ Desconto de até 20% para pagamento à vista
✅ Prorrogar vencimento em até 15 dias
✅ Aceitar pagamento parcial (mínimo 30%)

**O que NÃO PODE fazer:**
❌ Perdoar dívida sem aprovação da diretoria
❌ Aceitar pagamento em produtos/serviços
❌ Remover de SPC antes do pagamento total
❌ Conceder novo crédito com dívida pendente

### Script de Negociação

**Cliente liga querendo negociar:**
```
"Vou te ajudar. Me conta: quanto você consegue pagar hoje?

[Cliente responde R$ X]

OK, posso fazer o seguinte:
- R$ [X] de entrada hoje
- Saldo em [N] parcelas de R$ [VALOR]
- Removemos do SPC em 24h após última parcela

Isso funciona para você?"
```

## 6. Indicadores de Cobrança

### Medir Mensalmente:

**DSO (Days Sales Outstanding)**
```
DSO = (Contas a Receber / Receita Mensal) × 30
Meta: < 45 dias
```

**Taxa de Inadimplência**
```
Inadimplência = (Contas Vencidas / Total a Receber) × 100
Meta: < 3%
```

**Taxa de Recuperação**
```
Recuperação = (Cobrado com Sucesso / Total em Atraso) × 100
Meta: > 85%
```

**Perda Efetiva**
```
Perda = (Valores Não Recuperados / Receita Total) × 100
Meta: < 1%
```

## 7. Ações Preventivas

### Reduzir Inadimplência

**1. Análise Prévia Rigorosa**
- Consultar SPC/Serasa sempre
- Pedir referências comerciais
- Iniciar com limites baixos

**2. Comunicação Clara**
- Enviar fatura por 2 canais (email + WhatsApp)
- Confirmar recebimento
- Lembrar antes do vencimento

**3. Facilitar Pagamento**
- Múltiplas formas (boleto, Pix, cartão)
- Link de pagamento fácil
- Atendimento ágil para dúvidas

**4. Relacionamento**
- Cobrar sempre de forma profissional
- Manter tom educado mas firme
- Oferecer soluções, não apenas cobrar',
  'POLICY',
  'Financeiro',
  'confidential',
  '1.0',
  true,
  ARRAY['admin', 'gestor', 'financeiro']
);

-- =====================================================
-- 2. TRIGGERS PARA AUTO-ATUALIZAÇÃO
-- =====================================================

-- Trigger para atualizar embeddings quando documento mudar
CREATE OR REPLACE FUNCTION notify_document_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Registrar que documento precisa de reindexação
  UPDATE thomaz_knowledge_sources
  SET updated_at = NOW()
  WHERE id = NEW.id;

  -- Deletar chunks antigos (serão recriados)
  DELETE FROM thomaz_document_chunks
  WHERE source_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_document_change
AFTER UPDATE OF content ON thomaz_knowledge_sources
FOR EACH ROW
EXECUTE FUNCTION notify_document_change();

-- =====================================================
-- 3. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índices para buscas full-text
CREATE INDEX IF NOT EXISTS idx_thomaz_sources_content_fts
ON thomaz_knowledge_sources
USING gin(to_tsvector('portuguese', content));

CREATE INDEX IF NOT EXISTS idx_thomaz_chunks_text_fts
ON thomaz_document_chunks
USING gin(to_tsvector('portuguese', chunk_text));

-- Índices para filtros comuns
CREATE INDEX IF NOT EXISTS idx_thomaz_sources_category
ON thomaz_knowledge_sources(category)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_thomaz_sources_sensitivity
ON thomaz_knowledge_sources(sensitivity)
WHERE is_active = true;

-- Índices para performance de queries
CREATE INDEX IF NOT EXISTS idx_thomaz_conversations_session
ON thomaz_conversations(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_thomaz_conversations_user
ON thomaz_conversations(user_id, created_at DESC);

-- =====================================================
-- 4. FUNÇÃO DE HEALTH CHECK
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_health_check()
RETURNS TABLE (
  metric TEXT,
  value NUMERIC,
  status TEXT,
  details TEXT
) AS $$
BEGIN
  -- Total de documentos ativos
  RETURN QUERY
  SELECT
    'total_documents'::TEXT,
    COUNT(*)::NUMERIC,
    CASE WHEN COUNT(*) >= 5 THEN 'healthy' ELSE 'warning' END::TEXT,
    'Documentos ativos na base'::TEXT
  FROM thomaz_knowledge_sources
  WHERE is_active = true;

  -- Total de chunks indexados
  RETURN QUERY
  SELECT
    'total_chunks'::TEXT,
    COUNT(*)::NUMERIC,
    CASE WHEN COUNT(*) >= 20 THEN 'healthy' ELSE 'warning' END::TEXT,
    'Chunks vetorizados disponíveis'::TEXT
  FROM thomaz_document_chunks;

  -- Conversas nas últimas 24h
  RETURN QUERY
  SELECT
    'conversations_24h'::TEXT,
    COUNT(*)::NUMERIC,
    'info'::TEXT,
    'Conversas nas últimas 24 horas'::TEXT
  FROM thomaz_conversations
  WHERE created_at > NOW() - INTERVAL '24 hours';

  -- Taxa de high confidence (últimos 7 dias)
  RETURN QUERY
  SELECT
    'high_confidence_rate'::TEXT,
    (COUNT(*) FILTER (WHERE confidence > 0.85)::NUMERIC / NULLIF(COUNT(*), 0) * 100),
    CASE
      WHEN (COUNT(*) FILTER (WHERE confidence > 0.85)::NUMERIC / NULLIF(COUNT(*), 0) * 100) >= 70
      THEN 'healthy'
      ELSE 'warning'
    END::TEXT,
    'Porcentagem de respostas com alta confiança'::TEXT
  FROM thomaz_conversations
  WHERE created_at > NOW() - INTERVAL '7 days';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON thomaz_knowledge_sources TO anon, authenticated;
GRANT SELECT ON thomaz_document_chunks TO anon, authenticated;
GRANT EXECUTE ON FUNCTION thomaz_health_check() TO anon, authenticated;

-- =====================================================
-- LOG DE SUCESSO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Base de conhecimento populada com 5 documentos adicionais';
  RAISE NOTICE '✅ Triggers de auto-atualização configurados';
  RAISE NOTICE '✅ Índices de performance criados';
  RAISE NOTICE '✅ Função de health check disponível';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Total de documentos: 8 (3 iniciais + 5 novos)';
  RAISE NOTICE '🔍 Execute: SELECT * FROM thomaz_health_check();';
END $$;
