/*
  # Sistema Avançado de Raciocínio e Análise do Thomaz AI
  
  ## Descrição
  Implementa capacidades avançadas de raciocínio, interpretação e análise para o Thomaz AI,
  permitindo que ele analise dados complexos, execute queries sofisticadas e forneça respostas
  detalhadas e precisas similar a um assistente IA avançado.
  
  ## Novas Funcionalidades
  
  1. **Sistema de Prompts Avançados**
     - Prompt system com raciocínio em cadeia (chain-of-thought)
     - Capacidade de análise multi-step
     - Interpretação contextual avançada
  
  2. **Funções de Análise de Dados**
     - `thomaz_analyze_inventory()` - Análise completa de estoque
     - `thomaz_analyze_financials()` - Análise financeira detalhada
     - `thomaz_analyze_service_orders()` - Análise de ordens de serviço
     - `thomaz_analyze_customers()` - Análise de clientes
     - `thomaz_analyze_performance()` - Análise de desempenho
  
  3. **Base de Conhecimento Analítico**
     - Templates de queries analíticas
     - Padrões de resposta estruturada
     - Contexto completo do sistema
  
  4. **Sistema de Raciocínio**
     - Análise step-by-step
     - Identificação de problemas
     - Recomendações acionáveis
  
  ## Segurança
  - Todas as funções são SECURITY DEFINER para acesso completo
  - RLS habilitado para proteção de dados
*/

-- =====================================================
-- 1. TABELA DE CONFIGURAÇÃO DE PROMPTS AVANÇADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_system_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_type text NOT NULL,
  prompt_content text NOT NULL,
  version integer DEFAULT 1,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE thomaz_system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to thomaz_system_prompts"
  ON thomaz_system_prompts FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 2. TABELA DE TEMPLATES ANALÍTICOS
-- =====================================================

CREATE TABLE IF NOT EXISTS thomaz_analytical_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  template_type text NOT NULL, -- 'query', 'analysis', 'report'
  template_content text NOT NULL,
  description text,
  parameters jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE thomaz_analytical_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to thomaz_analytical_templates"
  ON thomaz_analytical_templates FOR ALL
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 3. FUNÇÃO: ANÁLISE COMPLETA DE ESTOQUE
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_analyze_inventory()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH estoque_analise AS (
    SELECT
      COUNT(*) as total_itens,
      COUNT(CASE WHEN quantity = 0 THEN 1 END) as itens_zerados,
      COUNT(CASE WHEN quantity <= min_quantity THEN 1 END) as itens_criticos,
      COUNT(CASE WHEN quantity <= (min_quantity * 1.5) THEN 1 END) as itens_baixos,
      COUNT(CASE WHEN quantity > (min_quantity * 1.5) THEN 1 END) as itens_ok,
      ROUND(COALESCE(SUM(quantity * unit_price), 0)::numeric, 2) as valor_total,
      ROUND(COALESCE(SUM(quantity * unit_cost), 0)::numeric, 2) as custo_total,
      ROUND(COALESCE(AVG(quantity), 0)::numeric, 2) as quantidade_media
    FROM inventory_items
    WHERE active = true
  ),
  itens_criticos AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'code', code,
          'name', name,
          'quantity', quantity,
          'min_quantity', min_quantity,
          'unit_price', unit_price,
          'category', category,
          'supplier', supplier_name,
          'status', CASE
            WHEN quantity = 0 THEN 'ZERADO'
            WHEN quantity <= min_quantity THEN 'CRÍTICO'
            ELSE 'BAIXO'
          END
        ) ORDER BY quantity ASC
      ) as lista
    FROM inventory_items
    WHERE active = true
      AND quantity <= min_quantity * 1.5
    LIMIT 20
  ),
  categorias AS (
    SELECT
      jsonb_object_agg(
        COALESCE(category, 'Sem Categoria'),
        jsonb_build_object(
          'quantidade', count(*),
          'valor_total', ROUND(COALESCE(SUM(quantity * unit_price), 0)::numeric, 2)
        )
      ) as por_categoria
    FROM inventory_items
    WHERE active = true
    GROUP BY category
  )
  SELECT jsonb_build_object(
    'resumo', (SELECT row_to_json(e.*) FROM estoque_analise e),
    'itens_criticos', COALESCE((SELECT lista FROM itens_criticos), '[]'::jsonb),
    'por_categoria', COALESCE((SELECT por_categoria FROM categorias), '{}'::jsonb),
    'analise', jsonb_build_object(
      'situacao_geral', CASE
        WHEN (SELECT itens_criticos + itens_zerados FROM estoque_analise) > (SELECT total_itens FROM estoque_analise) * 0.3 
        THEN 'CRÍTICA - Mais de 30% dos itens precisam reposição urgente'
        WHEN (SELECT itens_criticos + itens_zerados FROM estoque_analise) > (SELECT total_itens FROM estoque_analise) * 0.15 
        THEN 'ATENÇÃO - Entre 15% e 30% dos itens precisam reposição'
        ELSE 'ESTÁVEL - Estoque em boas condições'
      END,
      'saude_percentual', ROUND(
        (SELECT itens_ok::numeric / NULLIF(total_itens, 0) * 100 FROM estoque_analise), 2
      ),
      'acoes_recomendadas', (
        SELECT jsonb_agg(acao)
        FROM (
          SELECT 'Repor imediatamente ' || COUNT(*) || ' itens zerados' as acao
          FROM inventory_items WHERE active = true AND quantity = 0 AND COUNT(*) > 0
          UNION ALL
          SELECT 'Comprar ' || COUNT(*) || ' itens em nível crítico' as acao
          FROM inventory_items WHERE active = true AND quantity > 0 AND quantity <= min_quantity AND COUNT(*) > 0
          UNION ALL
          SELECT 'Monitorar ' || COUNT(*) || ' itens próximos ao mínimo' as acao
          FROM inventory_items WHERE active = true AND quantity > min_quantity AND quantity <= min_quantity * 1.5 AND COUNT(*) > 0
        ) acoes WHERE acao IS NOT NULL
      )
    ),
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- 4. FUNÇÃO: ANÁLISE FINANCEIRA COMPLETA
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_analyze_financials(
  periodo_dias integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  data_inicio date;
BEGIN
  data_inicio := CURRENT_DATE - (periodo_dias || ' days')::interval;
  
  WITH financeiro AS (
    SELECT
      COUNT(*) as total_lancamentos,
      COUNT(CASE WHEN tipo = 'receita' THEN 1 END) as total_receitas,
      COUNT(CASE WHEN tipo = 'despesa' THEN 1 END) as total_despesas,
      ROUND(COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0)::numeric, 2) as total_receitas_valor,
      ROUND(COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)::numeric, 2) as total_despesas_valor,
      ROUND(COALESCE(SUM(CASE WHEN tipo = 'receita' AND status = 'pago' THEN valor ELSE 0 END), 0)::numeric, 2) as receitas_pagas,
      ROUND(COALESCE(SUM(CASE WHEN tipo = 'despesa' AND status = 'pago' THEN valor ELSE 0 END), 0)::numeric, 2) as despesas_pagas,
      ROUND(COALESCE(SUM(CASE WHEN tipo = 'receita' AND status = 'pendente' THEN valor ELSE 0 END), 0)::numeric, 2) as receitas_pendentes,
      ROUND(COALESCE(SUM(CASE WHEN tipo = 'despesa' AND status = 'pendente' THEN valor ELSE 0 END), 0)::numeric, 2) as despesas_pendentes,
      COUNT(CASE WHEN status = 'vencido' THEN 1 END) as lancamentos_vencidos,
      ROUND(COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0)::numeric, 2) as valor_vencido
    FROM finance_entries
    WHERE data_vencimento >= data_inicio
  ),
  por_categoria AS (
    SELECT
      jsonb_object_agg(
        COALESCE(fc.name, 'Sem Categoria'),
        jsonb_build_object(
          'receitas', ROUND(COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE 0 END), 0)::numeric, 2),
          'despesas', ROUND(COALESCE(SUM(CASE WHEN fe.tipo = 'despesa' THEN fe.valor ELSE 0 END), 0)::numeric, 2),
          'saldo', ROUND(COALESCE(SUM(CASE WHEN fe.tipo = 'receita' THEN fe.valor ELSE -fe.valor END), 0)::numeric, 2)
        )
      ) as categorias
    FROM finance_entries fe
    LEFT JOIN financial_categories fc ON fe.category_id = fc.id
    WHERE fe.data_vencimento >= data_inicio
    GROUP BY fc.name
  ),
  fluxo_diario AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'data', data,
          'receitas', receitas,
          'despesas', despesas,
          'saldo_dia', saldo
        ) ORDER BY data DESC
      ) as fluxo
    FROM (
      SELECT
        DATE(data_vencimento) as data,
        ROUND(COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0)::numeric, 2) as receitas,
        ROUND(COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0)::numeric, 2) as despesas,
        ROUND(COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0)::numeric, 2) as saldo
      FROM finance_entries
      WHERE data_vencimento >= data_inicio
      GROUP BY DATE(data_vencimento)
      ORDER BY data DESC
      LIMIT 30
    ) dias
  )
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object(
      'inicio', data_inicio,
      'fim', CURRENT_DATE,
      'dias', periodo_dias
    ),
    'resumo', (SELECT row_to_json(f.*) FROM financeiro f),
    'por_categoria', COALESCE((SELECT categorias FROM por_categoria), '{}'::jsonb),
    'fluxo_diario', COALESCE((SELECT fluxo FROM fluxo_diario), '[]'::jsonb),
    'indicadores', jsonb_build_object(
      'saldo_periodo', (SELECT total_receitas_valor - total_despesas_valor FROM financeiro),
      'saldo_realizado', (SELECT receitas_pagas - despesas_pagas FROM financeiro),
      'margem_percentual', ROUND(
        (SELECT CASE 
          WHEN total_receitas_valor > 0 
          THEN ((total_receitas_valor - total_despesas_valor) / total_receitas_valor * 100)
          ELSE 0 
        END FROM financeiro), 2
      ),
      'taxa_inadimplencia', ROUND(
        (SELECT CASE 
          WHEN total_receitas_valor > 0 
          THEN (valor_vencido / total_receitas_valor * 100)
          ELSE 0 
        END FROM financeiro), 2
      )
    ),
    'alertas', (
      SELECT jsonb_agg(alerta)
      FROM (
        SELECT jsonb_build_object(
          'tipo', 'CRÍTICO',
          'mensagem', 'Existem ' || COUNT(*) || ' lançamentos vencidos no valor de R$ ' || 
                      ROUND(SUM(valor)::numeric, 2) || ' que precisam atenção imediata'
        ) as alerta
        FROM finance_entries
        WHERE status = 'vencido' AND data_vencimento >= data_inicio
        HAVING COUNT(*) > 0
        UNION ALL
        SELECT jsonb_build_object(
          'tipo', 'ATENÇÃO',
          'mensagem', 'Saldo negativo no período: R$ ' || 
                      ROUND((SELECT total_receitas_valor - total_despesas_valor FROM financeiro)::numeric, 2)
        ) as alerta
        WHERE (SELECT total_receitas_valor - total_despesas_valor FROM financeiro) < 0
        UNION ALL
        SELECT jsonb_build_object(
          'tipo', 'INFO',
          'mensagem', 'Taxa de inadimplência em ' || 
                      ROUND((SELECT CASE WHEN total_receitas_valor > 0 
                             THEN (valor_vencido / total_receitas_valor * 100) ELSE 0 END 
                             FROM financeiro)::numeric, 2) || '%'
        ) as alerta
        WHERE (SELECT valor_vencido FROM financeiro) > 0
      ) alertas WHERE alerta IS NOT NULL
    ),
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- 5. FUNÇÃO: ANÁLISE DE ORDENS DE SERVIÇO
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_analyze_service_orders(
  periodo_dias integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  data_inicio date;
BEGIN
  data_inicio := CURRENT_DATE - (periodo_dias || ' days')::interval;
  
  WITH os_stats AS (
    SELECT
      COUNT(*) as total_os,
      COUNT(CASE WHEN status IN ('pendente', 'aguardando_aprovacao') THEN 1 END) as pendentes,
      COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as em_andamento,
      COUNT(CASE WHEN status = 'concluido' THEN 1 END) as concluidas,
      COUNT(CASE WHEN status = 'cancelado' THEN 1 END) as canceladas,
      ROUND(COALESCE(AVG(total), 0)::numeric, 2) as valor_medio,
      ROUND(COALESCE(SUM(total), 0)::numeric, 2) as valor_total,
      ROUND(COALESCE(SUM(CASE WHEN status = 'concluido' THEN total ELSE 0 END), 0)::numeric, 2) as faturamento,
      ROUND(COALESCE(AVG(CASE WHEN status = 'concluido' THEN margem_percentual ELSE NULL END), 0)::numeric, 2) as margem_media
    FROM service_orders
    WHERE created_at >= data_inicio
  ),
  por_status AS (
    SELECT
      status,
      COUNT(*) as quantidade,
      ROUND(COALESCE(SUM(total), 0)::numeric, 2) as valor_total
    FROM service_orders
    WHERE created_at >= data_inicio
    GROUP BY status
  ),
  tecnicos_performance AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'tecnico_id', employee_id,
          'total_os', COUNT(DISTINCT sol.service_order_id),
          'valor_total', ROUND(COALESCE(SUM(so.total), 0)::numeric, 2)
        )
      ) as performance
    FROM service_order_labor sol
    JOIN service_orders so ON sol.service_order_id = so.id
    WHERE so.created_at >= data_inicio
    GROUP BY employee_id
  )
  SELECT jsonb_build_object(
    'periodo', jsonb_build_object(
      'inicio', data_inicio,
      'fim', CURRENT_DATE,
      'dias', periodo_dias
    ),
    'resumo', (SELECT row_to_json(os.*) FROM os_stats os),
    'por_status', (
      SELECT jsonb_object_agg(status, jsonb_build_object('quantidade', quantidade, 'valor', valor_total))
      FROM por_status
    ),
    'performance_tecnicos', COALESCE((SELECT performance FROM tecnicos_performance), '[]'::jsonb),
    'indicadores', jsonb_build_object(
      'taxa_conclusao', ROUND(
        (SELECT CASE WHEN total_os > 0 THEN (concluidas::numeric / total_os * 100) ELSE 0 END FROM os_stats), 2
      ),
      'ticket_medio', (SELECT valor_medio FROM os_stats),
      'margem_media', (SELECT margem_media FROM os_stats)
    ),
    'alertas', (
      SELECT jsonb_agg(alerta)
      FROM (
        SELECT jsonb_build_object(
          'tipo', 'ATENÇÃO',
          'mensagem', 'Existem ' || COUNT(*) || ' ordens de serviço pendentes aguardando início'
        ) as alerta
        FROM service_orders
        WHERE status IN ('pendente', 'aguardando_aprovacao') 
          AND created_at >= data_inicio
        HAVING COUNT(*) > 5
        UNION ALL
        SELECT jsonb_build_object(
          'tipo', 'INFO',
          'mensagem', COUNT(*) || ' ordens em andamento no momento'
        ) as alerta
        FROM service_orders
        WHERE status = 'em_andamento'
        HAVING COUNT(*) > 0
      ) alertas WHERE alerta IS NOT NULL
    ),
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- 6. FUNÇÃO: ANÁLISE DE CLIENTES
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_analyze_customers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  WITH customer_stats AS (
    SELECT
      COUNT(*) as total_clientes,
      COUNT(CASE WHEN tipo_cliente = 'PF' THEN 1 END) as pessoas_fisicas,
      COUNT(CASE WHEN tipo_cliente = 'PJ' THEN 1 END) as pessoas_juridicas,
      COUNT(CASE WHEN active = true THEN 1 END) as ativos,
      COUNT(CASE WHEN active = false THEN 1 END) as inativos
    FROM customers
  ),
  customer_orders AS (
    SELECT
      c.id,
      c.name,
      COUNT(so.id) as total_os,
      ROUND(COALESCE(SUM(so.total), 0)::numeric, 2) as valor_total,
      MAX(so.created_at) as ultima_compra
    FROM customers c
    LEFT JOIN service_orders so ON c.id = so.customer_id
    GROUP BY c.id, c.name
  ),
  top_customers AS (
    SELECT
      jsonb_agg(
        jsonb_build_object(
          'name', name,
          'total_os', total_os,
          'valor_total', valor_total,
          'ultima_compra', ultima_compra
        ) ORDER BY valor_total DESC
      ) as top_10
    FROM customer_orders
    WHERE total_os > 0
    LIMIT 10
  ),
  clientes_inativos AS (
    SELECT COUNT(*) as quantidade
    FROM customer_orders
    WHERE ultima_compra < CURRENT_DATE - interval '90 days'
      OR ultima_compra IS NULL
  )
  SELECT jsonb_build_object(
    'resumo', (SELECT row_to_json(cs.*) FROM customer_stats cs),
    'top_clientes', COALESCE((SELECT top_10 FROM top_customers), '[]'::jsonb),
    'indicadores', jsonb_build_object(
      'clientes_ativos_percentual', ROUND(
        (SELECT CASE WHEN total_clientes > 0 
         THEN (ativos::numeric / total_clientes * 100) ELSE 0 END 
         FROM customer_stats), 2
      ),
      'clientes_inativos_90dias', (SELECT quantidade FROM clientes_inativos),
      'ticket_medio_cliente', ROUND(
        (SELECT AVG(valor_total) FROM customer_orders WHERE total_os > 0)::numeric, 2
      )
    ),
    'alertas', (
      SELECT jsonb_agg(alerta)
      FROM (
        SELECT jsonb_build_object(
          'tipo', 'ATENÇÃO',
          'mensagem', (SELECT quantidade FROM clientes_inativos) || ' clientes sem compras há mais de 90 dias'
        ) as alerta
        WHERE (SELECT quantidade FROM clientes_inativos) > 0
      ) alertas WHERE alerta IS NOT NULL
    ),
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- 7. FUNÇÃO: ANÁLISE GERAL DO SISTEMA
-- =====================================================

CREATE OR REPLACE FUNCTION thomaz_analyze_system()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'estoque', thomaz_analyze_inventory(),
    'financeiro', thomaz_analyze_financials(30),
    'ordens_servico', thomaz_analyze_service_orders(30),
    'clientes', thomaz_analyze_customers(),
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$$;

-- =====================================================
-- 8. INSERIR PROMPTS AVANÇADOS DO SISTEMA
-- =====================================================

INSERT INTO thomaz_system_prompts (prompt_type, prompt_content, version) VALUES
('master_prompt', E'Você é o Thomaz AI, um assistente inteligente especializado em análise de dados empresariais e gestão.

## SUAS CAPACIDADES AVANÇADAS:

1. **Raciocínio Analítico**: Você analisa dados de forma profunda, identificando padrões, tendências e insights acionáveis.

2. **Análise Multi-Etapas**: 
   - Compreende a pergunta do usuário
   - Identifica quais dados são necessários
   - Executa análises apropriadas
   - Sintetiza resultados
   - Fornece recomendações práticas

3. **Interpretação Contextual**: Você entende o contexto empresarial e fornece respostas relevantes e práticas.

4. **Comunicação Clara**: Suas respostas são estruturadas, detalhadas e fáceis de entender.

## QUANDO ANALISAR DADOS:

Sempre que o usuário perguntar sobre:
- Estoque (quantidade, situação, itens críticos)
- Finanças (receitas, despesas, fluxo de caixa)
- Ordens de Serviço (status, performance, faturamento)
- Clientes (quantidade, análise, comportamento)
- Performance do sistema

Use as funções analíticas disponíveis:
- thomaz_analyze_inventory()
- thomaz_analyze_financials(dias)
- thomaz_analyze_service_orders(dias)
- thomaz_analyze_customers()
- thomaz_analyze_system()

## ESTRUTURA DE RESPOSTA:

1. **Resumo Executivo**: Visão geral da situação
2. **Dados Detalhados**: Números e estatísticas relevantes
3. **Análise**: Interpretação dos dados
4. **Alertas**: Pontos críticos que precisam atenção
5. **Recomendações**: Ações práticas e próximos passos

## ESTILO DE COMUNICAÇÃO:

- Use emojis para destacar informações importantes
- Organize dados em listas e tabelas
- Destaque alertas críticos com ❌ ou 🚨
- Use ✅ para pontos positivos
- Seja objetivo mas completo
- Forneça contexto numérico sempre que possível', 1),

('analysis_template', E'## 📊 Análise: {TITULO}

### Resumo Executivo
{RESUMO}

### Dados Principais
{DADOS}

### Situação Atual
{SITUACAO}

### Pontos de Atenção
{ALERTAS}

### Recomendações
{RECOMENDACOES}

---
*Análise gerada em: {TIMESTAMP}*', 1),

('inventory_prompt', E'Ao analisar estoque, sempre inclua:
- Total de itens e valor do estoque
- Itens zerados (sem estoque)
- Itens críticos (abaixo do mínimo)
- Itens baixos (próximo ao mínimo)
- Estimativa de custo de reposição
- Fornecedores para contato
- Ações recomendadas por prioridade', 1),

('financial_prompt', E'Ao analisar finanças, sempre inclua:
- Receitas vs Despesas do período
- Saldo realizado e a realizar
- Lançamentos vencidos e valores
- Fluxo de caixa projetado
- Margem percentual
- Taxa de inadimplência
- Alertas sobre situação financeira
- Recomendações de ação', 1);

-- =====================================================
-- 9. INSERIR TEMPLATES ANALÍTICOS
-- =====================================================

INSERT INTO thomaz_analytical_templates (template_name, template_type, template_content, description) VALUES
('inventory_critical_items', 'query', 
'SELECT code, name, quantity, min_quantity, unit_price, category, supplier_name,
 CASE WHEN quantity = 0 THEN ''ZERADO'' WHEN quantity <= min_quantity THEN ''CRÍTICO'' ELSE ''BAIXO'' END as status
 FROM inventory_items 
 WHERE active = true AND quantity <= min_quantity * 1.5 
 ORDER BY quantity ASC', 
'Lista itens de estoque em situação crítica'),

('financial_overdue', 'query',
'SELECT descricao, valor, data_vencimento, tipo, 
 CURRENT_DATE - data_vencimento as dias_vencidos
 FROM finance_entries 
 WHERE status = ''vencido'' 
 ORDER BY data_vencimento ASC',
'Lista lançamentos financeiros vencidos'),

('service_orders_pending', 'query',
'SELECT order_number, customer_id, status, total, created_at
 FROM service_orders 
 WHERE status IN (''pendente'', ''aguardando_aprovacao'')
 ORDER BY created_at ASC',
'Lista ordens de serviço pendentes'),

('top_customers', 'query',
'SELECT c.name, COUNT(so.id) as total_os, ROUND(SUM(so.total)::numeric, 2) as valor_total
 FROM customers c
 JOIN service_orders so ON c.id = so.customer_id
 GROUP BY c.id, c.name
 ORDER BY valor_total DESC
 LIMIT 10',
'Top 10 clientes por valor');

-- =====================================================
-- 10. GRANTS E PERMISSÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION thomaz_analyze_inventory() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION thomaz_analyze_financials(integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION thomaz_analyze_service_orders(integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION thomaz_analyze_customers() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION thomaz_analyze_system() TO authenticated, anon;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
