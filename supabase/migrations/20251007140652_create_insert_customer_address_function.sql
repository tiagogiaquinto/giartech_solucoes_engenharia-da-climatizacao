/*
  # Create function to insert customer address

  Creates a PostgreSQL function that inserts customer addresses directly via SQL,
  bypassing any client-side issues with field mapping.
*/

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
AS $$
DECLARE
  v_address_id uuid;
BEGIN
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