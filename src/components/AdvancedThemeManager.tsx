import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette,
  Eye,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Sliders,
  Layout,
  Type,
  Box,
  Grid,
  Share2,
  Lock,
  Globe
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import ThemeCreator from './ThemeCreator'

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

interface ThemePreset extends Theme {
  category: string
  is_featured: boolean
}

const AdvancedThemeManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useUser()
  const [activeTab, setActiveTab] = useState<'presets' | 'custom' | 'create'>('presets')
  const [presets, setPresets] = useState<ThemePreset[]>([])
  const [customThemes, setCustomThemes] = useState<Theme[]>([])
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadThemes()
  }, [])

  const loadThemes = async () => {
    try {
      setLoading(true)

      // Carregar temas predefinidos
      const { data: presetsData, error: presetsError } = await supabase
        .from('theme_presets')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('display_name')

      if (presetsError) throw presetsError
      setPresets(presetsData || [])

      // Carregar temas personalizados do usuário
      if (user?.id) {
        const { data: customData, error: customError } = await supabase
          .from('custom_themes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (customError) throw customError
        setCustomThemes(customData || [])
      }
    } catch (error) {
      console.error('Error loading themes:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyTheme = (theme: Theme) => {
    // Aplicar tema através de CSS variables
    const root = document.documentElement

    root.style.setProperty('--color-primary', theme.primary_color)
    root.style.setProperty('--color-secondary', theme.secondary_color)
    root.style.setProperty('--color-accent', theme.accent_color)
    root.style.setProperty('--color-success', theme.success_color)
    root.style.setProperty('--color-warning', theme.warning_color)
    root.style.setProperty('--color-error', theme.error_color)
    root.style.setProperty('--color-info', theme.info_color)

    root.style.setProperty('--color-background', theme.background_color)
    root.style.setProperty('--color-surface', theme.surface_color)
    root.style.setProperty('--color-surface-secondary', theme.surface_secondary_color)

    root.style.setProperty('--color-text-primary', theme.text_primary_color)
    root.style.setProperty('--color-text-secondary', theme.text_secondary_color)
    root.style.setProperty('--color-text-muted', theme.text_muted_color)

    root.style.setProperty('--color-sidebar-bg', theme.sidebar_bg_color)
    root.style.setProperty('--color-sidebar-text', theme.sidebar_text_color)
    root.style.setProperty('--color-sidebar-active', theme.sidebar_active_color)

    root.style.setProperty('--color-header-bg', theme.header_bg_color)
    root.style.setProperty('--color-header-text', theme.header_text_color)
    root.style.setProperty('--color-border', theme.border_color)

    root.style.setProperty('--font-family-base', theme.font_family)
    root.style.setProperty('--font-size-base', theme.font_size_base)

    root.style.setProperty('--border-radius-sm', theme.border_radius_sm)
    root.style.setProperty('--border-radius-md', theme.border_radius_md)
    root.style.setProperty('--border-radius-lg', theme.border_radius_lg)

    // Toggle dark mode class
    if (theme.is_dark_mode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handlePreview = (theme: Theme) => {
    setPreviewTheme(theme)
    applyTheme(theme)
  }

  const handleApply = async (theme: Theme) => {
    if (!user?.id) return

    try {
      setSaving(true)
      applyTheme(theme)

      // Salvar preferência no banco
      await supabase
        .from('user_settings')
        .update({
          theme: theme.is_dark_mode ? 'dark' : 'light',
          custom_theme_id: theme.id || null
        })
        .eq('user_id', user.id)

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error applying theme:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCustomTheme = async (theme: Theme) => {
    if (!user?.id) return

    try {
      setSaving(true)

      const themeData = {
        ...theme,
        user_id: user.id
      }

      if (theme.id) {
        // Atualizar tema existente
        const { error } = await supabase
          .from('custom_themes')
          .update(themeData)
          .eq('id', theme.id)

        if (error) throw error
      } else {
        // Criar novo tema
        const { data, error } = await supabase
          .from('custom_themes')
          .insert([themeData])
          .select()
          .single()

        if (error) throw error
        setCustomThemes([data, ...customThemes])
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await loadThemes()
    } catch (error) {
      console.error('Error saving custom theme:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCustomTheme = async (themeId: string) => {
    if (!confirm('Deseja realmente excluir este tema?')) return

    try {
      const { error } = await supabase
        .from('custom_themes')
        .delete()
        .eq('id', themeId)

      if (error) throw error

      setCustomThemes(customThemes.filter(t => t.id !== themeId))
    } catch (error) {
      console.error('Error deleting theme:', error)
    }
  }

  const handleDuplicateTheme = async (theme: Theme) => {
    const newTheme = {
      ...theme,
      id: undefined,
      name: `${theme.name} (Cópia)`,
      is_public: false
    }
    await handleSaveCustomTheme(newTheme)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando temas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Palette className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gerenciador de Temas</h2>
                <p className="text-sm text-gray-600">Personalize a aparência do sistema</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-2xl text-gray-500">×</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <TabButton
              active={activeTab === 'presets'}
              onClick={() => setActiveTab('presets')}
              icon={Grid}
              label="Temas Prontos"
              count={presets.length}
            />
            <TabButton
              active={activeTab === 'custom'}
              onClick={() => setActiveTab('custom')}
              icon={Box}
              label="Meus Temas"
              count={customThemes.length}
            />
            <TabButton
              active={activeTab === 'create'}
              onClick={() => setActiveTab('create')}
              icon={Plus}
              label="Criar Tema"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'presets' && (
              <ThemePresetsGrid
                presets={presets}
                onPreview={handlePreview}
                onApply={handleApply}
                onDuplicate={handleDuplicateTheme}
                saving={saving}
              />
            )}
            {activeTab === 'custom' && (
              <CustomThemesGrid
                themes={customThemes}
                onPreview={handlePreview}
                onApply={handleApply}
                onDelete={handleDeleteCustomTheme}
                onDuplicate={handleDuplicateTheme}
                saving={saving}
              />
            )}
            {activeTab === 'create' && (
              <ThemeCreator
                onSave={handleSaveCustomTheme}
                onPreview={handlePreview}
                saving={saving}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-green-50 border-t border-green-200"
          >
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              <span className="font-medium">Tema aplicado com sucesso!</span>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

// Tab Button Component
const TabButton: React.FC<{
  active: boolean
  onClick: () => void
  icon: any
  label: string
  count?: number
}> = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
      active
        ? 'bg-white text-blue-600 shadow-sm'
        : 'text-gray-600 hover:bg-white/50'
    }`}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-full text-xs ${
        active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
      }`}>
        {count}
      </span>
    )}
  </button>
)

// Theme Presets Grid Component
const ThemePresetsGrid: React.FC<{
  presets: ThemePreset[]
  onPreview: (theme: Theme) => void
  onApply: (theme: Theme) => void
  onDuplicate: (theme: Theme) => void
  saving: boolean
}> = ({ presets, onPreview, onApply, onDuplicate, saving }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(presets.map(p => p.category)))]
  const filteredPresets = selectedCategory === 'all'
    ? presets
    : presets.filter(p => p.category === selectedCategory)

  return (
    <motion.div
      key="presets"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {/* Category Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category === 'all' ? 'Todos' : category}
          </button>
        ))}
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPresets.map(preset => (
          <ThemeCard
            key={preset.id}
            theme={preset}
            onPreview={onPreview}
            onApply={onApply}
            onDuplicate={onDuplicate}
            saving={saving}
            isFeatured={preset.is_featured}
          />
        ))}
      </div>
    </motion.div>
  )
}

// Custom Themes Grid Component
const CustomThemesGrid: React.FC<{
  themes: Theme[]
  onPreview: (theme: Theme) => void
  onApply: (theme: Theme) => void
  onDelete: (themeId: string) => void
  onDuplicate: (theme: Theme) => void
  saving: boolean
}> = ({ themes, onPreview, onApply, onDelete, onDuplicate, saving }) => {
  if (themes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Box className="w-16 h-16 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Nenhum tema personalizado
        </h3>
        <p className="text-gray-500 mb-4">
          Crie seu primeiro tema personalizado ou duplique um tema pronto
        </p>
      </div>
    )
  }

  return (
    <motion.div
      key="custom"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {themes.map(theme => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          onPreview={onPreview}
          onApply={onApply}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          saving={saving}
          isCustom
        />
      ))}
    </motion.div>
  )
}

// Theme Card Component
const ThemeCard: React.FC<{
  theme: Theme
  onPreview: (theme: Theme) => void
  onApply: (theme: Theme) => void
  onDelete?: (themeId: string) => void
  onDuplicate: (theme: Theme) => void
  saving: boolean
  isFeatured?: boolean
  isCustom?: boolean
}> = ({ theme, onPreview, onApply, onDelete, onDuplicate, saving, isFeatured, isCustom }) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all"
    >
      {/* Theme Preview */}
      <div className="h-32 p-4 relative" style={{ backgroundColor: theme.background_color }}>
        {isFeatured && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Destaque
          </div>
        )}
        <div className="flex gap-2 h-full">
          <div className="flex-1 rounded-lg" style={{ backgroundColor: theme.sidebar_bg_color }} />
          <div className="flex-1 rounded-lg" style={{ backgroundColor: theme.surface_color }}>
            <div className="h-4 rounded-t-lg" style={{ backgroundColor: theme.header_bg_color }} />
            <div className="p-2 space-y-1">
              <div className="h-2 rounded" style={{ backgroundColor: theme.primary_color }} />
              <div className="h-2 rounded w-2/3" style={{ backgroundColor: theme.secondary_color }} />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{theme.name}</h3>
            {theme.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{theme.description}</p>
            )}
          </div>
          {theme.is_dark_mode ? (
            <Moon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
          ) : (
            <Sun className="w-4 h-4 text-yellow-500 flex-shrink-0 ml-2" />
          )}
        </div>

        {/* Color Palette */}
        <div className="flex gap-1 mb-3">
          {[
            theme.primary_color,
            theme.secondary_color,
            theme.accent_color,
            theme.success_color,
            theme.warning_color
          ].map((color, idx) => (
            <div
              key={idx}
              className="w-6 h-6 rounded-md border border-gray-200"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onPreview(theme)}
            className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => onApply(theme)}
            disabled={saving}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            Aplicar
          </button>
        </div>

        {/* Secondary Actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onDuplicate(theme)}
            className="flex-1 px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors flex items-center justify-center gap-1"
          >
            <Copy className="w-3 h-3" />
            Duplicar
          </button>
          {isCustom && onDelete && theme.id && (
            <button
              onClick={() => onDelete(theme.id!)}
              className="flex-1 px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Excluir
            </button>
          )}
          {theme.is_public && (
            <div className="px-2 py-1.5 text-xs text-gray-400 flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Público
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default AdvancedThemeManager
