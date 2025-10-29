# 🔧 SOLUÇÃO: OSs Antigas Aparecem Vazias ao Editar

**Problema:** OSs concluídas não mostram serviços, materiais ou mão de obra ao abrir para editar.

**Causa:** OSs antigas foram criadas antes das tabelas `service_order_items` existirem.

---

## 🚀 SOLUÇÃO RÁPIDA (2 Minutos)

Execute este SQL no Supabase SQL Editor:

```sql
-- Criar itens para OSs que não têm
INSERT INTO service_order_items (
  service_order_id,
  descricao,
  quantity,
  unit_price,
  total_price,
  created_at
)
SELECT
  so.id,
  COALESCE(so.description, 'Serviço principal'),
  1,
  COALESCE(so.total_value, 0),
  COALESCE(so.total_value, 0),
  so.created_at
FROM service_orders so
WHERE NOT EXISTS (
  SELECT 1 FROM service_order_items WHERE service_order_id = so.id
);

-- Verificar
SELECT '✅ Itens criados com sucesso!' as resultado,
       COUNT(*) as total_itens
FROM service_order_items;
```

---

## ✅ VERIFICAR RESULTADO

```sql
-- Ver OSs com seus itens:
SELECT
  so.order_number as "OS",
  so.client_name as "Cliente",
  COUNT(soi.id) as "Itens"
FROM service_orders so
LEFT JOIN service_order_items soi ON soi.service_order_id = so.id
GROUP BY so.id, so.order_number, so.client_name
ORDER BY so.created_at DESC
LIMIT 10;
```

---

**Depois disso, abra qualquer OS antiga e verá os dados! ✅**
