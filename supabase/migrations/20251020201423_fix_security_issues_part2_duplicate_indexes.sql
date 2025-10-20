/*
  # Fix Security Issues - Part 2: Remove Duplicate Indexes

  1. Performance Optimization
    - Remove duplicate indexes to reduce storage
    - Improve INSERT/UPDATE performance
    - Keep only the most descriptive index name

  2. Duplicate Removed
    - idx_service_order_materials_order (keeping idx_service_order_materials_order_id)
*/

-- Drop duplicate index (keep the more descriptive one)
DROP INDEX IF EXISTS public.idx_service_order_materials_order;
