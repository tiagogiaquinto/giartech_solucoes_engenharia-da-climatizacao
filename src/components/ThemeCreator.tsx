import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Save,
  Eye,
  RefreshCw,
  Copy,
  Wand2,
  Sun,
  Moon,
  Type,
  Box,
  Layout,
  Sliders,
  Paintbrush,
  Palette,
  Globe,
  Lock
} from 'lucide-react'

interface Theme {
  id?: string
  name: string
  description?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  success_color: string
  warning_color: string
  error_color: string
  info_color: string
  background_color: string
  surface_color: string
  surface_secondary_color: string
  text_primary_color: string
  text_secondary_color: string
  text_muted_color: string
  sidebar_bg_color: string
  sidebar_text_color: string
  sidebar_active_color: string
  header_bg_color: string
  header_text_color: string
  border_color: string
  font_family: string
  font_size_base: string
  border_radius_sm: string
  border_radius_md: string
  border_radius_lg: string
  is_dark_mode: boolean
  is_public?: boolean
}

interface ThemeCreatorProps {
  initialTheme?: Theme
  onSave: (theme: Theme) => void
  onPreview: (theme: Theme) => void
  saving: boolean
}

const defaultTheme: Theme = {
  name: 'Meu Tema Personalizado',
  description: '',
  primary_color: '#2563eb',
  secondary_color: '#7c3aed',
  accent_color: '#10b981',
  success_color: '#10b981',
  warning_color: '#f59e0b',
  error_color: '#ef4444',
  info_color: '#3b82f6',
  background_color: '#f9fafb',
  surface_color: '#ffffff',
  surface_secondary_color: '#f3f4f6',
  text_primary_color: '#111827',
  text_secondary_color: '#6b7280',
  text_muted_color: '#9ca3af',
  sidebar_bg_color: '#1f2937',
  sidebar_text_color: '#f9fafb',
  sidebar_active_color: '#3b82f6',
  header_bg_color: '#ffffff',
  header_text_color: '#111827',
  border_color: '#e5e7eb',
  font_family: 'Inter, system-ui, sans-serif',
  font_size_base: '14px',
  border_radius_sm: '0.375rem',
  border_radius_md: '0.5rem',
  border_radius_lg: '0.75rem',
  is_dark_mode: false,
  is_public: false
}

const ThemeCreator: React.FC<ThemeCreatorProps> = ({
  initialTheme,
  onSave,
  onPreview,
  saving
}) => {
  const [theme, setTheme] = useState<Theme>(initialTheme || defaultTheme)
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'layout'>('colors')

  const updateTheme = (field: keyof Theme, value: any) => {
    const newTheme = { ...theme, [field]: value }
    setTheme(newTheme)
    onPreview(newTheme)
  }

  const generateColorPalette = () => {
    const hue = Math.floor(Math.random() * 360)
    const primaryColor = `hsl(${hue}, 70%, 55%)`
    const secondaryColor = `hsl(${(hue + 60) % 360}, 70%, 55%)`
    const accentColor = `hsl(${(hue + 120) % 360}, 70%, 55%)`

    updateTheme('primary_color', primaryColor)
    updateTheme('secondary_color', secondaryColor)
    updateTheme('accent_color', accentColor)
  }

  const toggleDarkMode = () => {
    if (!theme.is_dark_mode) {
      // Mudar para tema escuro
      updateTheme('background_color', '#0f172a')
      updateTheme('surface_color', '#1e293b')
      updateTheme('surface_secondary_color', '#334155')
      updateTheme('text_primary_color', '#f1f5f9')
      updateTheme('text_secondary_color', '#94a3b8')
      updateTheme('text_muted_color', '#64748b')
      updateTheme('border_color', '#334155')
      updateTheme('header_bg_color', '#1e293b')
      updateTheme('header_text_color', '#f1f5f9')
    } else {
      // Mudar para tema claro
      updateTheme('background_color', '#f9fafb')
      updateTheme('surface_color', '#ffffff')
      updateTheme('surface_secondary_color', '#f3f4f6')
      updateTheme('text_primary_color', '#111827')
      updateTheme('text_secondary_color', '#6b7280')
      updateTheme('text_muted_color', '#9ca3af')
      updateTheme('border_color', '#e5e7eb')
      updateTheme('header_bg_color', '#ffffff')
      updateTheme('header_text_color', '#111827')
    }
    updateTheme('is_dark_mode', !theme.is_dark_mode)
  }

  const sections = [
    { id: 'colors' as const, name: 'Cores', icon: Palette },
    { id: 'typography' as const, name: 'Tipografia', icon: Type },
    { id: 'layout' as const, name: 'Layout', icon: Layout }
  ]

  return (
    <motion.div
      key="creator"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {sections.map(section => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeSection === section.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateColorPalette}
            className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Gerar Cores
          </button>
          <button
            onClick={() => onSave(theme)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Tema'}
          </button>
        </div>
      </div>

      {/* Theme Info */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Informações do Tema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Tema
            </label>
            <input
              type="text"
              value={theme.name}
              onChange={(e) => updateTheme('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Meu Tema Azul"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <input
              type="text"
              value={theme.description || ''}
              onChange={(e) => updateTheme('description', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Breve descrição do tema"
            />
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={theme.is_dark_mode}
              onChange={toggleDarkMode}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              {theme.is_dark_mode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Modo {theme.is_dark_mode ? 'Escuro' : 'Claro'}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={theme.is_public || false}
              onChange={(e) => updateTheme('is_public', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
              {theme.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {theme.is_public ? 'Público' : 'Privado'}
            </span>
          </label>
        </div>
      </div>

      {/* Colors Section */}
      {activeSection === 'colors' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Brand Colors */}
          <ColorSection
            title="Cores Principais"
            icon={Paintbrush}
            colors={[
              { label: 'Primária', field: 'primary_color' as keyof Theme, value: theme.primary_color },
              { label: 'Secundária', field: 'secondary_color' as keyof Theme, value: theme.secondary_color },
              { label: 'Destaque', field: 'accent_color' as keyof Theme, value: theme.accent_color }
            ]}
            onUpdate={updateTheme}
          />

          {/* Status Colors */}
          <ColorSection
            title="Cores de Status"
            icon={Box}
            colors={[
              { label: 'Sucesso', field: 'success_color' as keyof Theme, value: theme.success_color },
              { label: 'Aviso', field: 'warning_color' as keyof Theme, value: theme.warning_color },
              { label: 'Erro', field: 'error_color' as keyof Theme, value: theme.error_color },
              { label: 'Info', field: 'info_color' as keyof Theme, value: theme.info_color }
            ]}
            onUpdate={updateTheme}
          />

          {/* Background Colors */}
          <ColorSection
            title="Cores de Fundo"
            icon={Layout}
            colors={[
              { label: 'Fundo', field: 'background_color' as keyof Theme, value: theme.background_color },
              { label: 'Superfície', field: 'surface_color' as keyof Theme, value: theme.surface_color },
              { label: 'Superfície Secundária', field: 'surface_secondary_color' as keyof Theme, value: theme.surface_secondary_color }
            ]}
            onUpdate={updateTheme}
          />

          {/* Text Colors */}
          <ColorSection
            title="Cores de Texto"
            icon={Type}
            colors={[
              { label: 'Texto Primário', field: 'text_primary_color' as keyof Theme, value: theme.text_primary_color },
              { label: 'Texto Secundário', field: 'text_secondary_color' as keyof Theme, value: theme.text_secondary_color },
              { label: 'Texto Suave', field: 'text_muted_color' as keyof Theme, value: theme.text_muted_color }
            ]}
            onUpdate={updateTheme}
          />

          {/* Interface Colors */}
          <ColorSection
            title="Cores de Interface"
            icon={Sliders}
            colors={[
              { label: 'Sidebar Fundo', field: 'sidebar_bg_color' as keyof Theme, value: theme.sidebar_bg_color },
              { label: 'Sidebar Texto', field: 'sidebar_text_color' as keyof Theme, value: theme.sidebar_text_color },
              { label: 'Sidebar Ativo', field: 'sidebar_active_color' as keyof Theme, value: theme.sidebar_active_color },
              { label: 'Header Fundo', field: 'header_bg_color' as keyof Theme, value: theme.header_bg_color },
              { label: 'Header Texto', field: 'header_text_color' as keyof Theme, value: theme.header_text_color },
              { label: 'Bordas', field: 'border_color' as keyof Theme, value: theme.border_color }
            ]}
            onUpdate={updateTheme}
          />
        </motion.div>
      )}

      {/* Typography Section */}
      {activeSection === 'typography' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <Type className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold">Tipografia</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Família de Fontes
              </label>
              <select
                value={theme.font_family}
                onChange={(e) => updateTheme('font_family', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Inter, system-ui, sans-serif">Inter</option>
                <option value="'Roboto', sans-serif">Roboto</option>
                <option value="'Open Sans', sans-serif">Open Sans</option>
                <option value="'Poppins', sans-serif">Poppins</option>
                <option value="'Montserrat', sans-serif">Montserrat</option>
                <option value="system-ui, sans-serif">System UI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamanho Base da Fonte: {theme.font_size_base}
              </label>
              <input
                type="range"
                min="12"
                max="18"
                value={parseInt(theme.font_size_base)}
                onChange={(e) => updateTheme('font_size_base', `${e.target.value}px`)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>12px</span>
                <span>18px</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Layout Section */}
      {activeSection === 'layout' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-6">
            <Layout className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold">Layout</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raio de Borda Pequeno
              </label>
              <input
                type="text"
                value={theme.border_radius_sm}
                onChange={(e) => updateTheme('border_radius_sm', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 0.375rem"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raio de Borda Médio
              </label>
              <input
                type="text"
                value={theme.border_radius_md}
                onChange={(e) => updateTheme('border_radius_md', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 0.5rem"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raio de Borda Grande
              </label>
              <input
                type="text"
                value={theme.border_radius_lg}
                onChange={(e) => updateTheme('border_radius_lg', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: 0.75rem"
              />
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// Color Section Component
const ColorSection: React.FC<{
  title: string
  icon: any
  colors: Array<{ label: string; field: keyof Theme; value: string }>
  onUpdate: (field: keyof Theme, value: any) => void
}> = ({ title, icon: Icon, colors, onUpdate }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map(({ label, field, value }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={value}
                onChange={(e) => onUpdate(field, e.target.value)}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={value}
                onChange={(e) => onUpdate(field, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ThemeCreator
