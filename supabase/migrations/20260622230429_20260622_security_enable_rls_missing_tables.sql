
-- Enable RLS on all tables that still have it disabled
ALTER TABLE public.admin_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_optimization ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_location_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tech_realtime_location ENABLE ROW LEVEL SECURITY;

-- admin_subtasks: system-wide, authenticated access
CREATE POLICY "admin_subtasks_select" ON public.admin_subtasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_subtasks_insert" ON public.admin_subtasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_subtasks_update" ON public.admin_subtasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_subtasks_delete" ON public.admin_subtasks FOR DELETE TO authenticated USING (true);

-- admin_tasks: system-wide, authenticated access
CREATE POLICY "admin_tasks_select" ON public.admin_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_tasks_insert" ON public.admin_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "admin_tasks_update" ON public.admin_tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_tasks_delete" ON public.admin_tasks FOR DELETE TO authenticated USING (true);

-- company_roles: read-only for authenticated, write only for authenticated
CREATE POLICY "company_roles_select" ON public.company_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "company_roles_insert" ON public.company_roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "company_roles_update" ON public.company_roles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "company_roles_delete" ON public.company_roles FOR DELETE TO authenticated USING (true);

-- company_settings: authenticated access (single-row config table)
CREATE POLICY "company_settings_select" ON public.company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "company_settings_insert" ON public.company_settings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "company_settings_update" ON public.company_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "company_settings_delete" ON public.company_settings FOR DELETE TO authenticated USING (true);
-- Also allow anon to read company settings (needed for login page branding)
CREATE POLICY "company_settings_select_anon" ON public.company_settings FOR SELECT TO anon USING (true);

-- global_alerts: authenticated access
CREATE POLICY "global_alerts_select" ON public.global_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "global_alerts_insert" ON public.global_alerts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "global_alerts_update" ON public.global_alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "global_alerts_delete" ON public.global_alerts FOR DELETE TO authenticated USING (true);

-- os_items: authenticated access (service order line items)
CREATE POLICY "os_items_select" ON public.os_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "os_items_insert" ON public.os_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "os_items_update" ON public.os_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "os_items_delete" ON public.os_items FOR DELETE TO authenticated USING (true);

-- route_optimization: authenticated access
CREATE POLICY "route_optimization_select" ON public.route_optimization FOR SELECT TO authenticated USING (true);
CREATE POLICY "route_optimization_insert" ON public.route_optimization FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "route_optimization_update" ON public.route_optimization FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "route_optimization_delete" ON public.route_optimization FOR DELETE TO authenticated USING (true);

-- service_checklists: authenticated access
CREATE POLICY "service_checklists_select" ON public.service_checklists FOR SELECT TO authenticated USING (true);
CREATE POLICY "service_checklists_insert" ON public.service_checklists FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "service_checklists_update" ON public.service_checklists FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "service_checklists_delete" ON public.service_checklists FOR DELETE TO authenticated USING (true);

-- system_automations: authenticated access
CREATE POLICY "system_automations_select" ON public.system_automations FOR SELECT TO authenticated USING (true);
CREATE POLICY "system_automations_insert" ON public.system_automations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "system_automations_update" ON public.system_automations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "system_automations_delete" ON public.system_automations FOR DELETE TO authenticated USING (true);

-- tech_location_logs: authenticated access (technician GPS logs)
CREATE POLICY "tech_location_logs_select" ON public.tech_location_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "tech_location_logs_insert" ON public.tech_location_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tech_location_logs_update" ON public.tech_location_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tech_location_logs_delete" ON public.tech_location_logs FOR DELETE TO authenticated USING (true);

-- tech_realtime_location: authenticated access
CREATE POLICY "tech_realtime_location_select" ON public.tech_realtime_location FOR SELECT TO authenticated USING (true);
CREATE POLICY "tech_realtime_location_insert" ON public.tech_realtime_location FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "tech_realtime_location_update" ON public.tech_realtime_location FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "tech_realtime_location_delete" ON public.tech_realtime_location FOR DELETE TO authenticated USING (true);
