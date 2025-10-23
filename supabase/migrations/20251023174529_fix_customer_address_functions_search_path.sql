/*
  # Fix customer address functions search_path

  1. Changes
    - Fix insert_customer_address search_path from '' to 'public'
    - Fix update_customer_address search_path from '' to 'public'
    - Allows functions to find customer_addresses table

  2. Security
    - Maintains SECURITY DEFINER
    - Maintains existing RLS policies
*/

-- Fix insert_customer_address
CREATE OR REPLACE FUNCTION insert_customer_address(
  p_customer_id uuid,
  p_tipo text,
  p_nome_identificacao text,
  p_cep text,
  p_logradouro text,
  p_numero text,
  p_complemento text,
  p_bairro text,
  p_cidade text,
  p_estado text,
  p_principal boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_address_id uuid;
BEGIN
  -- Se marcar como principal, desmarcar outros endereços do cliente
  IF p_principal THEN
    UPDATE customer_addresses 
    SET principal = false 
    WHERE customer_id = p_customer_id;
  END IF;

  INSERT INTO customer_addresses (
    customer_id,
    tipo,
    nome_identificacao,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    principal
  ) VALUES (
    p_customer_id,
    p_tipo,
    p_nome_identificacao,
    p_cep,
    p_logradouro,
    p_numero,
    p_complemento,
    p_bairro,
    p_cidade,
    p_estado,
    p_principal
  ) RETURNING id INTO v_address_id;

  RETURN v_address_id;
END;
$$;

-- Fix update_customer_address
CREATE OR REPLACE FUNCTION update_customer_address(
  p_id uuid,
  p_tipo text,
  p_nome_identificacao text,
  p_cep text,
  p_logradouro text,
  p_numero text,
  p_complemento text,
  p_bairro text,
  p_cidade text,
  p_estado text,
  p_principal boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_id uuid;
BEGIN
  -- Obter customer_id do endereço
  SELECT customer_id INTO v_customer_id
  FROM customer_addresses
  WHERE id = p_id;

  -- Se marcar como principal, desmarcar outros endereços do cliente
  IF p_principal AND v_customer_id IS NOT NULL THEN
    UPDATE customer_addresses 
    SET principal = false 
    WHERE customer_id = v_customer_id 
    AND id != p_id;
  END IF;

  UPDATE customer_addresses
  SET
    tipo = p_tipo,
    nome_identificacao = p_nome_identificacao,
    cep = p_cep,
    logradouro = p_logradouro,
    numero = p_numero,
    complemento = p_complemento,
    bairro = p_bairro,
    cidade = p_cidade,
    estado = p_estado,
    principal = p_principal,
    updated_at = now()
  WHERE id = p_id;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION insert_customer_address TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_customer_address TO anon, authenticated;
