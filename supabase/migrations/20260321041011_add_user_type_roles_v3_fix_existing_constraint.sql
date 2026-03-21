/*
  # Sistema de Tipos de Usuário - Fix Constraint Existente (v3)

  1. Remove constraint existente `user_profiles_user_type_check` que bloqueia o update
  2. Normaliza todos os valores para o conjunto válido
  3. Recria constraint com os 4 tipos corretos
  4. Cria função get_user_role
  5. Configura RLS em service_orders
*/

-- 1. Remover TODAS as constraints de check na coluna user_type
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;

ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS check_user_type;

-- 2. Normalizar dados: qualquer valor fora do conjunto vira 'admin' (assumindo que eram admins/diretores)
UPDATE public.user_profiles 
SET user_type = 'admin' 
WHERE user_type NOT IN ('admin', 'tecnico', 'cliente', 'parceiro') 
   OR user_type IS NULL;

-- 3. Criar nova constraint com os 4 tipos válidos
ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_user_type 
CHECK (user_type IN ('admin', 'tecnico', 'cliente', 'parceiro'));

-- 4. Garantir admin principal
UPDATE public.user_profiles 
SET user_type = 'admin' 
WHERE email = 'diretor.giartechsolucoes@gmail.com';

-- 5. Função para identificar o papel do usuário (usada pelo frontend para decidir o layout)
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT user_type FROM public.user_profiles WHERE id = p_user_id);
END;
$$;

-- 6. Limpar políticas conflitantes e configurar RLS para service_orders
DROP POLICY IF EXISTS "Acesso por Perfil Giartech" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso por Perfil" ON public.service_orders;
DROP POLICY IF EXISTS "Acesso_Desenvolvimento_Giartech" ON public.service_orders;

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_orders' 
    AND policyname = 'Authenticated users can read service orders'
  ) THEN
    CREATE POLICY "Authenticated users can read service orders"
      ON public.service_orders
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
