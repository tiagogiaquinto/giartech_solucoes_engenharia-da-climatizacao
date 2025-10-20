/*
  # Create function to update customer address

  Creates a PostgreSQL function that updates customer addresses directly via SQL.
*/

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
AS $$
BEGIN
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