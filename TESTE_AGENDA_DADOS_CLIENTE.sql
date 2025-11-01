-- ============================================
-- TESTE: Vincular Cliente ao Evento da Agenda
-- ============================================

-- PASSO 1: Verificar dados disponíveis
-- ============================================

-- Cliente disponível:
-- Nome: Tiago Bruno Giaquinto
-- ID: ffe269e9-54a2-4f66-88f2-5bdf7820515f
-- Telefone: (11) 5555-2560
-- Email: diretor@giartechsolucoes.com.br

-- Evento disponível:
-- Título: Sequencia Da Obra Aline E Leandro
-- ID: ec9926dd-3438-49da-a9ce-6c78668dc945
-- Data: 2025-10-10 13:00
-- Cliente atual: NULL


-- PASSO 2: Vincular cliente ao evento
-- ============================================

UPDATE agenda_events
SET customer_id = 'ffe269e9-54a2-4f66-88f2-5bdf7820515f'
WHERE id = 'ec9926dd-3438-49da-a9ce-6c78668dc945';


-- PASSO 3: Verificar vinculação
-- ============================================

SELECT
  ae.id,
  ae.title,
  ae.start_date,
  ae.customer_id,
  c.nome_razao as cliente_nome,
  c.telefone as cliente_telefone,
  c.email as cliente_email
FROM agenda_events ae
LEFT JOIN customers c ON ae.customer_id = c.id
WHERE ae.id = 'ec9926dd-3438-49da-a9ce-6c78668dc945';


-- RESULTADO ESPERADO:
-- ============================================
-- O evento "Sequencia Da Obra Aline E Leandro" agora terá:
-- - Cliente: Tiago Bruno Giaquinto
-- - Telefone: (11) 5555-2560
-- - Email: diretor@giartechsolucoes.com.br
--
-- No card da agenda aparecerá:
-- ┌─────────────────────────────────┐
-- │ 🔵 Sequencia Da Obra            │
-- │                                 │
-- │ 📅 10 Out • 🕐 13:00           │
-- │ 👤 Tiago Bruno Giaquinto        │
-- │ 📞 (11) 5555-2560               │
-- │ ✉️  diretor@giartechsolucoes... │
-- │ 📍 Apartamento                  │
-- └─────────────────────────────────┘


-- PASSO 4 (OPCIONAL): Vincular mais eventos
-- ============================================

-- Ver todos os eventos sem cliente
SELECT
  id,
  title,
  start_date
FROM agenda_events
WHERE customer_id IS NULL
ORDER BY start_date DESC;

-- Vincular em massa (CUIDADO: use com critério)
-- UPDATE agenda_events
-- SET customer_id = 'ID_DO_CLIENTE'
-- WHERE customer_id IS NULL
-- AND title ILIKE '%nome_do_cliente%';


-- ============================================
-- NOTA: Depois de executar, recarregue a agenda
-- e os dados do cliente aparecerão automaticamente!
-- ============================================
