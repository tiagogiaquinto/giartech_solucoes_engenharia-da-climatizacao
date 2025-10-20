/*
  # Sistema de Rastreamento e Gestão de Rotas

  ## 1. Tabelas Criadas

  ### routes
  Rotas planejadas para a equipe

  ### route_stops
  Paradas da rota (ordem de serviço)

  ### employee_locations
  Rastreamento em tempo real

  ### route_history
  Histórico de movimentação

  ## 2. Security
  - Enable RLS em todas as tabelas
  - Políticas para acesso autenticado
*/

-- Tabela de rotas
CREATE TABLE IF NOT EXISTS routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name text NOT NULL,
  route_date date NOT NULL DEFAULT CURRENT_DATE,
  assigned_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  vehicle_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  start_time timestamptz,
  end_time timestamptz,
  total_distance_km numeric(10, 2) DEFAULT 0,
  estimated_duration_minutes integer DEFAULT 0,
  actual_duration_minutes integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de paradas da rota
CREATE TABLE IF NOT EXISTS route_stops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  stop_order integer NOT NULL,
  customer_name text NOT NULL,
  address text NOT NULL,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  estimated_arrival timestamptz,
  actual_arrival timestamptz,
  estimated_departure timestamptz,
  actual_departure timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de localizações dos funcionários (tempo real)
CREATE TABLE IF NOT EXISTS employee_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  route_id uuid REFERENCES routes(id) ON DELETE SET NULL,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  accuracy numeric(10, 2),
  speed numeric(10, 2),
  heading numeric(5, 2),
  altitude numeric(10, 2),
  location_timestamp timestamptz NOT NULL DEFAULT now(),
  battery_level integer,
  is_moving boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Tabela de histórico de rotas
CREATE TABLE IF NOT EXISTS route_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  latitude numeric(10, 8) NOT NULL,
  longitude numeric(11, 8) NOT NULL,
  history_timestamp timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('start', 'stop', 'pause', 'resume', 'checkpoint', 'arrival', 'departure')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(route_date);
CREATE INDEX IF NOT EXISTS idx_routes_employee ON routes(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops(stop_order);
CREATE INDEX IF NOT EXISTS idx_route_stops_service_order ON route_stops(service_order_id);
CREATE INDEX IF NOT EXISTS idx_employee_locations_employee ON employee_locations(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_locations_route ON employee_locations(route_id);
CREATE INDEX IF NOT EXISTS idx_employee_locations_timestamp ON employee_locations(location_timestamp);
CREATE INDEX IF NOT EXISTS idx_route_history_route ON route_history(route_id);
CREATE INDEX IF NOT EXISTS idx_route_history_timestamp ON route_history(history_timestamp);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_routes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_routes_updated_at
  BEFORE UPDATE ON routes
  FOR EACH ROW
  EXECUTE FUNCTION update_routes_updated_at();

CREATE TRIGGER trigger_update_route_stops_updated_at
  BEFORE UPDATE ON route_stops
  FOR EACH ROW
  EXECUTE FUNCTION update_routes_updated_at();

-- Função para calcular distância entre dois pontos (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 numeric,
  lon1 numeric,
  lat2 numeric,
  lon2 numeric
)
RETURNS numeric AS $$
DECLARE
  r numeric := 6371;
  dlat numeric;
  dlon numeric;
  a numeric;
  c numeric;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN r * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para obter última localização do funcionário
CREATE OR REPLACE FUNCTION get_last_employee_location(emp_id uuid)
RETURNS TABLE(
  latitude numeric,
  longitude numeric,
  loc_timestamp timestamptz,
  is_moving boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.latitude,
    el.longitude,
    el.location_timestamp,
    el.is_moving
  FROM employee_locations el
  WHERE el.employee_id = emp_id
  ORDER BY el.location_timestamp DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular distância total da rota
CREATE OR REPLACE FUNCTION calculate_route_distance(route_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_distance numeric := 0;
  prev_lat numeric;
  prev_lon numeric;
  curr_lat numeric;
  curr_lon numeric;
  stop_record RECORD;
  first_iteration boolean := true;
BEGIN
  FOR stop_record IN 
    SELECT latitude, longitude 
    FROM route_stops 
    WHERE route_id = route_uuid 
    ORDER BY stop_order
  LOOP
    curr_lat := stop_record.latitude;
    curr_lon := stop_record.longitude;
    
    IF NOT first_iteration AND prev_lat IS NOT NULL AND prev_lon IS NOT NULL THEN
      total_distance := total_distance + calculate_distance(prev_lat, prev_lon, curr_lat, curr_lon);
    END IF;
    
    prev_lat := curr_lat;
    prev_lon := curr_lon;
    first_iteration := false;
  END LOOP;
  
  RETURN ROUND(total_distance, 2);
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow authenticated read routes"
  ON routes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert routes"
  ON routes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update routes"
  ON routes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete routes"
  ON routes FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read route_stops"
  ON route_stops FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert route_stops"
  ON route_stops FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update route_stops"
  ON route_stops FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete route_stops"
  ON route_stops FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read employee_locations"
  ON employee_locations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert employee_locations"
  ON employee_locations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update employee_locations"
  ON employee_locations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete employee_locations"
  ON employee_locations FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read route_history"
  ON route_history FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert route_history"
  ON route_history FOR INSERT TO authenticated WITH CHECK (true);