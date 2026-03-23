/*
  # Service Order Addresses and Contacts

  ## Summary
  Adds two new tables to support multiple installation addresses and
  multiple contacts per service order. This is needed because the
  installation site often differs from the customer's registered address.

  ## New Tables

  ### service_order_addresses
  - Stores one or more installation addresses per service order
  - Fields: logradouro, numero, complemento, bairro, cidade, estado, cep,
            referencia (landmark/notes), is_primary
  - FK → service_orders(id) with CASCADE DELETE

  ### service_order_contacts
  - Stores one or more contacts per service order (on-site contacts,
    responsible persons, etc.)
  - Fields: nome, telefone, email, cargo, is_primary
  - FK → service_orders(id) with CASCADE DELETE

  ## Security
  - RLS enabled on both tables
  - Authenticated users have full CRUD access
*/

CREATE TABLE IF NOT EXISTS public.service_order_addresses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  label           text DEFAULT '',
  logradouro      text DEFAULT '',
  numero          text DEFAULT '',
  complemento     text DEFAULT '',
  bairro          text DEFAULT '',
  cidade          text DEFAULT '',
  estado          text DEFAULT '',
  cep             text DEFAULT '',
  referencia      text DEFAULT '',
  is_primary      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_order_contacts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  nome            text DEFAULT '',
  telefone        text DEFAULT '',
  email           text DEFAULT '',
  cargo           text DEFAULT '',
  is_primary      boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_so_addresses_order_id ON public.service_order_addresses(service_order_id);
CREATE INDEX IF NOT EXISTS idx_so_contacts_order_id  ON public.service_order_contacts(service_order_id);

ALTER TABLE public.service_order_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_contacts  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select service_order_addresses"
  ON public.service_order_addresses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service_order_addresses"
  ON public.service_order_addresses FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service_order_addresses"
  ON public.service_order_addresses FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service_order_addresses"
  ON public.service_order_addresses FOR DELETE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can select service_order_contacts"
  ON public.service_order_contacts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service_order_contacts"
  ON public.service_order_contacts FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service_order_contacts"
  ON public.service_order_contacts FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service_order_contacts"
  ON public.service_order_contacts FOR DELETE TO authenticated
  USING (true);

GRANT ALL ON public.service_order_addresses TO authenticated, anon;
GRANT ALL ON public.service_order_contacts  TO authenticated, anon;
