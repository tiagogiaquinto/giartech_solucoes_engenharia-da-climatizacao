-- Tornar description nullable em service_order_labor
ALTER TABLE service_order_labor ALTER COLUMN description DROP NOT NULL;
