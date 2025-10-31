/*
  # Popular Temas Predefinidos Profissionais
  
  1. Temas Incluídos
    - Giartech Original (Azul Profissional)
    - Ocean Deep (Azul Oceano)
    - Forest Green (Verde Floresta)
    - Sunset Orange (Laranja Pôr do Sol)
    - Royal Purple (Roxo Real)
    - Minimal Gray (Cinza Minimalista)
    - Dark Professional (Escuro Profissional)
    - Nord Theme (Inspirado no Nord)
    - Dracula (Inspirado no Dracula)
    - Material Design (Google Material)
    
  2. Categorias
    - professional, modern, dark, minimal, colorful
*/

-- Tema 1: Giartech Original (Azul Profissional)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'giartech-original', 'Giartech Original', 'Tema azul profissional padrão da Giartech', 'professional',
  '#2563eb', '#1e40af', '#10b981',
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#f9fafb', '#ffffff', '#f3f4f6',
  '#111827', '#6b7280', '#9ca3af',
  '#1f2937', '#f9fafb', '#3b82f6',
  '#ffffff', '#111827', '#e5e7eb',
  false, true
);

-- Tema 2: Ocean Deep (Azul Oceano)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'ocean-deep', 'Ocean Deep', 'Tons de azul oceano relaxantes', 'professional',
  '#0ea5e9', '#0284c7', '#06b6d4',
  '#10b981', '#f59e0b', '#ef4444', '#0ea5e9',
  '#f0f9ff', '#ffffff', '#e0f2fe',
  '#0c4a6e', '#475569', '#94a3b8',
  '#075985', '#e0f2fe', '#06b6d4',
  '#ffffff', '#0c4a6e', '#bae6fd',
  false, true
);

-- Tema 3: Forest Green (Verde Floresta)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'forest-green', 'Forest Green', 'Verde natural e energizante', 'colorful',
  '#10b981', '#059669', '#34d399',
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#f0fdf4', '#ffffff', '#dcfce7',
  '#064e3b', '#475569', '#94a3b8',
  '#065f46', '#d1fae5', '#34d399',
  '#ffffff', '#064e3b', '#a7f3d0',
  false, true
);

-- Tema 4: Sunset Orange (Laranja Pôr do Sol)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'sunset-orange', 'Sunset Orange', 'Tons quentes de laranja e vermelho', 'colorful',
  '#f97316', '#ea580c', '#fb923c',
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#fff7ed', '#ffffff', '#ffedd5',
  '#7c2d12', '#475569', '#94a3b8',
  '#9a3412', '#ffedd5', '#fb923c',
  '#ffffff', '#7c2d12', '#fed7aa',
  false, false
);

-- Tema 5: Royal Purple (Roxo Real)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'royal-purple', 'Royal Purple', 'Roxo elegante e sofisticado', 'colorful',
  '#a855f7', '#9333ea', '#c084fc',
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#faf5ff', '#ffffff', '#f3e8ff',
  '#581c87', '#475569', '#94a3b8',
  '#6b21a8', '#f3e8ff', '#c084fc',
  '#ffffff', '#581c87', '#e9d5ff',
  false, true
);

-- Tema 6: Minimal Gray (Cinza Minimalista)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'minimal-gray', 'Minimal Gray', 'Design minimalista em tons de cinza', 'minimal',
  '#64748b', '#475569', '#94a3b8',
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#f8fafc', '#ffffff', '#f1f5f9',
  '#0f172a', '#475569', '#94a3b8',
  '#334155', '#f1f5f9', '#94a3b8',
  '#ffffff', '#0f172a', '#e2e8f0',
  false, true
);

-- Tema 7: Dark Professional (Escuro Profissional)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'dark-professional', 'Dark Professional', 'Tema escuro profissional para longas jornadas', 'dark',
  '#3b82f6', '#2563eb', '#60a5fa',
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#0f172a', '#1e293b', '#334155',
  '#f1f5f9', '#94a3b8', '#64748b',
  '#020617', '#e2e8f0', '#3b82f6',
  '#1e293b', '#f1f5f9', '#475569',
  true, true
);

-- Tema 8: Nord Theme (Inspirado no Nord)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'nord-theme', 'Nord', 'Paleta de cores ártica do Nord', 'modern',
  '#5e81ac', '#81a1c1', '#88c0d0',
  '#a3be8c', '#ebcb8b', '#bf616a', '#88c0d0',
  '#2e3440', '#3b4252', '#434c5e',
  '#eceff4', '#d8dee9', '#a3be8c',
  '#2e3440', '#eceff4', '#5e81ac',
  '#3b4252', '#eceff4', '#4c566a',
  true, true
);

-- Tema 9: Dracula (Inspirado no Dracula)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'dracula', 'Dracula', 'Tema escuro vibrante inspirado no Dracula', 'dark',
  '#bd93f9', '#ff79c6', '#8be9fd',
  '#50fa7b', '#f1fa8c', '#ff5555', '#8be9fd',
  '#282a36', '#44475a', '#6272a4',
  '#f8f8f2', '#e6e6e6', '#a9abb5',
  '#21222c', '#f8f8f2', '#bd93f9',
  '#44475a', '#f8f8f2', '#6272a4',
  true, true
);

-- Tema 10: Material Design (Google Material)
INSERT INTO theme_presets (
  name, display_name, description, category,
  primary_color, secondary_color, accent_color,
  success_color, warning_color, error_color, info_color,
  background_color, surface_color, surface_secondary_color,
  text_primary_color, text_secondary_color, text_muted_color,
  sidebar_bg_color, sidebar_text_color, sidebar_active_color,
  header_bg_color, header_text_color, border_color,
  is_dark_mode, is_featured
) VALUES (
  'material-design', 'Material Design', 'Inspirado no Material Design do Google', 'modern',
  '#1976d2', '#1565c0', '#42a5f5',
  '#4caf50', '#ff9800', '#f44336', '#2196f3',
  '#fafafa', '#ffffff', '#f5f5f5',
  '#212121', '#757575', '#9e9e9e',
  '#1976d2', '#ffffff', '#42a5f5',
  '#ffffff', '#212121', '#e0e0e0',
  false, true
);

-- Comentário
COMMENT ON TABLE theme_presets IS 'Contém 10 temas profissionais predefinidos prontos para uso';
