/*
  # Corrigir trigger handle_new_user
  
  ## Mudanças
  
  - Atualiza a função para incluir o campo id ao criar user_profiles
  
  ## Segurança
  
  - Sem mudanças nas políticas RLS
*/

-- Recriar a função handle_new_user com id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_default_tenant uuid;
BEGIN
  -- Obter tenant padrão
  SELECT id INTO v_default_tenant FROM public.tenants LIMIT 1;
  
  -- Inserir perfil com id igual ao user_id
  INSERT INTO public.user_profiles (id, user_id, tenant_id, tipo_usuario)
  VALUES (new.id, new.id, v_default_tenant, 'cliente')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;
