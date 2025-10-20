import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Palette,
  Eye,
  Save,
  Download,
  Upload,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Sun,
  Moon,
  Settings,
  X,
  Check,
  Plus,
  Trash2,
  Copy,
  FileText,
  BarChart3,
  Package,
  Users,
  DollarSign
} from 'lucide-react'

interface ColorPalette {
  id: string
  name: string
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
  neutral: string
  background: string
  surface: string
  text: string
}

interface Theme {
  id: string
  name: string
  description: string
  palette: ColorPalette
  typography: {
    fontFamily: string
    fontSize: string
    lineHeight: string
  }
  spacing: string
  borderRadius: string
  shadows: boolean
  animations: boolean
  isCustom: boolean
}

interface VisualCustomizationProps {
  onPremiumFeature?: (feature: string) => void
}

const VisualCustomization = ({ onPremiumFeature }: VisualCustomizationProps) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'colors' | 'preview'>('themes')
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [appliedTheme, setAppliedTheme] = useState<Theme | null>(null)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light')

  const [customPalette, setCustomPalette] = useState<ColorPalette>({
    id: 'custom',
    name: 'Tema Personalizado',
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    neutral: '#6b7280',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937'
  })

  useEffect(() => {
    const savedTheme = localStorage.getItem('giartech-theme')
    if (savedTheme) {
      const theme = JSON.parse(savedTheme)
      setAppliedTheme(theme)
      applyThemeToDocument(theme)
    }
  }, [])

  const applyThemeToDocument = (theme: Theme) => {
    const root = document.documentElement
    const palette = theme.palette

    root.style.setProperty('--color-primary', palette.primary)
    root.style.setProperty('--color-secondary', palette.secondary)
    root.style.setProperty('--color-accent', palette.accent)
    root.style.setProperty('--color-success', palette.success)
    root.style.setProperty('--color-warning', palette.warning)
    root.style.setProperty('--color-error', palette.error)
    root.style.setProperty('--color-neutral', palette.neutral)
    root.style.setProperty('--color-background', palette.background)
    root.style.setProperty('--color-surface', palette.surface)
    root.style.setProperty('--color-text', palette.text)
  }

  const handleApplyTheme = (theme: Theme) => {
    setAppliedTheme(theme)
    applyThemeToDocument(theme)
    localStorage.setItem('giartech-theme', JSON.stringify(theme))

    const Toast = document.createElement('div')
    Toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in'
    Toast.innerHTML = `✓ Tema "${theme.name}" aplicado com sucesso!`
    document.body.appendChild(Toast)

    setTimeout(() => {
      Toast.style.transition = 'opacity 0.3s'
      Toast.style.opacity = '0'
      setTimeout(() => Toast.remove(), 300)
    }, 2000)
  }

  const handleSavePalette = () => {
    const customTheme: Theme = {
      id: 'custom-' + Date.now(),
      name: customPalette.name,
      description: 'Tema personalizado criado pelo usuário',
      palette: customPalette,
      typography: {
        fontFamily: 'Inter',
        fontSize: '14px',
        lineHeight: '1.5'
      },
      spacing: '8px',
      borderRadius: '8px',
      shadows: true,
      animations: true,
      isCustom: true
    }

    handleApplyTheme(customTheme)
  }

  const predefinedThemes: Theme[] = [
    {
      id: 'default',
      name: 'Tema Padrão',
      description: 'Tema clássico azul e branco',
      palette: {
        id: 'default',
        name: 'Padrão',
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        neutral: '#6b7280',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '14px',
        lineHeight: '1.5'
      },
      spacing: '8px',
      borderRadius: '8px',
      shadows: true,
      animations: true,
      isCustom: false
    },
    {
      id: 'dark',
      name: 'Tema Escuro',
      description: 'Tema escuro moderno',
      palette: {
        id: 'dark',
        name: 'Escuro',
        primary: '#60a5fa',
        secondary: '#94a3b8',
        accent: '#a78bfa',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        neutral: '#9ca3af',
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '14px',
        lineHeight: '1.5'
      },
      spacing: '8px',
      borderRadius: '12px',
      shadows: true,
      animations: true,
      isCustom: false
    },
    {
      id: 'nature',
      name: 'Natureza',
      description: 'Tons verdes e terrosos',
      palette: {
        id: 'nature',
        name: 'Natureza',
        primary: '#059669',
        secondary: '#6b7280',
        accent: '#d97706',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#dc2626',
        neutral: '#78716c',
        background: '#f0fdf4',
        surface: '#ecfdf5',
        text: '#1f2937'
      },
      typography: {
        fontFamily: 'Inter',
        fontSize: '14px',
        lineHeight: '1.6'
      },
      spacing: '8px',
      borderRadius: '16px',
      shadows: false,
      animations: true,
      isCustom: false
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personalização Visual</h1>
          {appliedTheme && (
            <p className="text-sm text-gray-600 mt-1">
              Tema ativo: <span className="font-semibold text-green-600">{appliedTheme.name}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => alert('Novo tema em breve!')}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:shadow-lg transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Tema</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('themes')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
              activeTab === 'themes'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Palette className="h-5 w-5" />
            <span className="font-medium">Temas</span>
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
              activeTab === 'colors'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Cores</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
              activeTab === 'preview'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Eye className="h-5 w-5" />
            <span className="font-medium">Preview</span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'themes' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Temas Disponíveis</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {predefinedThemes.map((theme, index) => (
                  <motion.div
                    key={theme.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all relative ${
                      appliedTheme?.id === theme.id
                        ? 'border-green-500 bg-green-50'
                        : selectedTheme?.id === theme.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTheme(theme)}
                  >
                    {appliedTheme?.id === theme.id && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                        <Check className="h-3 w-3" />
                        <span>Ativo</span>
                      </div>
                    )}
                    <div className="mb-4">
                      <div className="flex space-x-1 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.palette.primary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.palette.secondary }}
                        />
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: theme.palette.accent }}
                        />
                      </div>
                      <div
                        className="w-full h-16 rounded-lg border"
                        style={{
                          backgroundColor: theme.palette.background,
                          borderColor: theme.palette.neutral
                        }}
                      >
                        <div
                          className="h-4 rounded-t-lg"
                          style={{ backgroundColor: theme.palette.primary }}
                        />
                        <div className="p-2">
                          <div
                            className="w-full h-2 rounded mb-1"
                            style={{ backgroundColor: theme.palette.surface }}
                          />
                          <div
                            className="w-3/4 h-2 rounded"
                            style={{ backgroundColor: theme.palette.surface }}
                          />
                        </div>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">{theme.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{theme.description}</p>

                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTheme(theme)
                          setActiveTab('preview')
                        }}
                        className="flex-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        <Eye className="h-4 w-4 mr-1 inline" />
                        Preview
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApplyTheme(theme)
                        }}
                        className={`flex-1 px-3 py-1 rounded-lg transition-colors text-sm ${
                          appliedTheme?.id === theme.id
                            ? 'bg-green-500 text-white'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        <Check className="h-4 w-4 mr-1 inline" />
                        {appliedTheme?.id === theme.id ? 'Ativo' : 'Aplicar'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Editor de Cores</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(customPalette).filter(([key]) => key !== 'id' && key !== 'name').map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                      {key === 'primary' ? 'Cor Primária' :
                       key === 'secondary' ? 'Cor Secundária' :
                       key === 'accent' ? 'Cor de Destaque' :
                       key === 'success' ? 'Cor de Sucesso' :
                       key === 'warning' ? 'Cor de Aviso' :
                       key === 'error' ? 'Cor de Erro' :
                       key === 'neutral' ? 'Cor Neutra' :
                       key === 'background' ? 'Cor de Fundo' :
                       key === 'surface' ? 'Cor de Superfície' :
                       key === 'text' ? 'Cor do Texto' : key}
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setCustomPalette({
                          ...customPalette,
                          [key]: e.target.value
                        })}
                        className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setCustomPalette({
                          ...customPalette,
                          [key]: e.target.value
                        })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(value)}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSavePalette}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <Save className="h-4 w-4 mr-2 inline" />
                  Salvar e Aplicar Paleta
                </button>
                <button
                  onClick={() => setCustomPalette(predefinedThemes[0].palette)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2 inline" />
                  Resetar
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Preview do Tema</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-2 rounded-md transition-colors ${
                        previewDevice === 'desktop'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('tablet')}
                      className={`p-2 rounded-md transition-colors ${
                        previewDevice === 'tablet'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Tablet className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-2 rounded-md transition-colors ${
                        previewDevice === 'mobile'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setPreviewMode('light')}
                      className={`p-2 rounded-md transition-colors ${
                        previewMode === 'light'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Sun className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPreviewMode('dark')}
                      className={`p-2 rounded-md transition-colors ${
                        previewMode === 'dark'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Moon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-8 rounded-xl">
                <div
                  className={`mx-auto rounded-lg shadow-lg overflow-hidden transition-all ${
                    previewDevice === 'mobile' ? 'max-w-sm' :
                    previewDevice === 'tablet' ? 'max-w-2xl' :
                    'max-w-4xl'
                  }`}
                  style={{
                    backgroundColor: selectedTheme?.palette.background || customPalette.background,
                    color: selectedTheme?.palette.text || customPalette.text
                  }}
                >
                  <div
                    className="p-4"
                    style={{ backgroundColor: selectedTheme?.palette.primary || customPalette.primary }}
                  >
                    <h3 className="text-white font-semibold">Sistema GiarTech</h3>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: selectedTheme?.palette.surface || customPalette.surface }}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <BarChart3
                            className="h-5 w-5"
                            style={{ color: selectedTheme?.palette.primary || customPalette.primary }}
                          />
                          <span className="font-medium">Analytics</span>
                        </div>
                        <p className="text-2xl font-bold">1,234</p>
                      </div>

                      <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: selectedTheme?.palette.surface || customPalette.surface }}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <Users
                            className="h-5 w-5"
                            style={{ color: selectedTheme?.palette.success || customPalette.success }}
                          />
                          <span className="font-medium">Usuários</span>
                        </div>
                        <p className="text-2xl font-bold">567</p>
                      </div>

                      <div
                        className="p-4 rounded-lg"
                        style={{ backgroundColor: selectedTheme?.palette.surface || customPalette.surface }}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <Package
                            className="h-5 w-5"
                            style={{ color: selectedTheme?.palette.accent || customPalette.accent }}
                          />
                          <span className="font-medium">Produtos</span>
                        </div>
                        <p className="text-2xl font-bold">89</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        className="w-full py-2 px-4 rounded-lg text-white font-medium"
                        style={{ backgroundColor: selectedTheme?.palette.primary || customPalette.primary }}
                      >
                        Botão Primário
                      </button>
                      <button
                        className="w-full py-2 px-4 rounded-lg text-white font-medium"
                        style={{ backgroundColor: selectedTheme?.palette.success || customPalette.success }}
                      >
                        Botão de Sucesso
                      </button>
                      <button
                        className="w-full py-2 px-4 rounded-lg text-white font-medium"
                        style={{ backgroundColor: selectedTheme?.palette.warning || customPalette.warning }}
                      >
                        Botão de Aviso
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VisualCustomization
