import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Cloud,
  Monitor,
  Lock,
  Eye,
  Save,
  Check,
  AlertCircle,
  Globe,
  Clock,
  Zap,
  Sparkles,
  ExternalLink,
  Percent
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'
import { getUserSettings, updateUserSettings, createDefaultUserSettings, supabase } from '../lib/supabase'
import AdvancedThemeManager from '../components/AdvancedThemeManager'

const Settings = () => {
  const { user, isSuperAdmin } = useUser()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<any>(null)

  // Carregar configurações do banco
  useEffect(() => {
    loadSettings()
  }, [user])

  const loadSettings = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      console.log('🔄 Loading settings for user:', user.id)

      const data = await getUserSettings(user.id)
      console.log('✅ Settings loaded:', data)

      setSettings(data)
    } catch (err: any) {
      console.error('❌ Error loading settings:', err)
      setError('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (section: string, data: any) => {
    console.log(`🔄 [SETTINGS] Iniciando salvamento da seção: ${section}`)
    console.log('📦 [DADOS]:', data)

    if (!user?.id) {
      console.error('❌ [ERRO] Usuário não autenticado')
      setError('Usuário não autenticado')
      alert('ERRO: Você precisa estar autenticado!')
      return
    }

    if (!settings?.id) {
      console.error('❌ [ERRO] Settings não carregadas')
      setError('Configurações não carregadas')
      alert('ERRO: Configurações não carregadas!')
      return
    }

    try {
      setSaving(true)
      setError(null)
      console.log(`💾 [SALVANDO] Seção ${section} para usuário:`, user.id)

      const result = await updateUserSettings(user.id, data)
      console.log('✅ [RESULTADO]:', result)

      // Atualizar estado local
      setSettings((prev: any) => ({ ...prev, ...data }))

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      console.log('🎉 [SUCESSO] Configurações salvas!')
    } catch (err: any) {
      console.error('❌ [ERRO] Ao salvar configurações:', err)
      setError(`Erro ao salvar: ${err.message}`)
      alert(`ERRO ao salvar configurações: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'appearance', name: 'Aparência', icon: Palette },
    { id: 'thomaz-ai', name: 'Thomaz AI', icon: Sparkles, isExternal: true, path: '/ai-providers' },
    { id: 'privacy', name: 'Privacidade', icon: Eye },
    { id: 'backup', name: 'Backup', icon: Database },
    { id: 'sync', name: 'Sincronização', icon: Cloud },
    { id: 'productivity', name: 'Produtividade', icon: Zap },
    { id: 'security', name: 'Segurança', icon: Shield },
    ...(isSuperAdmin ? [{ id: 'fiscal', name: 'Alíquotas Fiscais', icon: Percent }] : [])
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Erro ao carregar configurações</p>
          <button
            onClick={loadSettings}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-8 h-8" />
            Configurações
          </h1>
          <p className="text-gray-600 mt-2">Personalize sua experiência no sistema</p>
        </div>

        {/* Status Messages */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800"
          >
            <Check className="w-5 h-5" />
            <span>Configurações salvas com sucesso!</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-6">
              {tabs.map((tab: any) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.isExternal && tab.path) {
                        navigate(tab.path)
                      } else {
                        setActiveTab(tab.id)
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1 text-left">{tab.name}</span>
                    {tab.isExternal && <ExternalLink className="w-4 h-4" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {activeTab === 'profile' && (
                <ProfileSettings settings={settings} onSave={handleSave} saving={saving} />
              )}
              {activeTab === 'notifications' && (
                <NotificationSettings settings={settings} onSave={handleSave} saving={saving} />
              )}
              {activeTab === 'appearance' && (
                <AppearanceSettings settings={settings} onSave={handleSave} saving={saving} />
              )}
              {activeTab === 'privacy' && (
                <PrivacySettings settings={settings} onSave={handleSave} saving={saving} />
              )}
              {activeTab === 'backup' && (
                <BackupSettings settings={settings} onSave={handleSave} saving={saving} />
              )}
              {activeTab === 'sync' && (
                <SyncSettings settings={settings} onSave={handleSave} saving={saving} />
              )}
              {activeTab === 'productivity' && (
                <ProductivitySettings settings={settings} onSave={handleSave} saving={saving} />
              )}
              {activeTab === 'security' && (
                <SecuritySettings settings={settings} onSave={handleSave} saving={saving} />
              )}
              {activeTab === 'fiscal' && isSuperAdmin && (
                <TaxRateSettings />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile Settings Component
const ProfileSettings: React.FC<any> = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    display_name: settings?.display_name || '',
    phone: settings?.phone || '',
    bio: settings?.bio || '',
    avatar_url: settings?.avatar_url || ''
  })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Perfil</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nome de Exibição</label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Conte um pouco sobre você..."
          />
        </div>

        <button
          onClick={() => onSave('profile', formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  )
}

// Notification Settings Component
const NotificationSettings: React.FC<any> = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    notifications_enabled: settings?.notifications_enabled ?? true,
    email_notifications: settings?.email_notifications ?? true,
    push_notifications: settings?.push_notifications ?? true,
    sms_notifications: settings?.sms_notifications ?? false,
    notify_new_order: settings?.notify_new_order ?? true,
    notify_order_status: settings?.notify_order_status ?? true,
    notify_payment: settings?.notify_payment ?? true,
    notify_deadline: settings?.notify_deadline ?? true,
    notify_team_mention: settings?.notify_team_mention ?? true
  })

  const toggleSetting = (key: string) => {
    setFormData({ ...formData, [key]: !formData[key as keyof typeof formData] })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Notificações</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Canais de Notificação</h3>
          <div className="space-y-3">
            <ToggleOption
              label="Notificações Gerais"
              description="Ativar/desativar todas as notificações"
              checked={formData.notifications_enabled}
              onChange={() => toggleSetting('notifications_enabled')}
            />
            <ToggleOption
              label="Email"
              description="Receber notificações por email"
              checked={formData.email_notifications}
              onChange={() => toggleSetting('email_notifications')}
            />
            <ToggleOption
              label="Push"
              description="Notificações push no navegador"
              checked={formData.push_notifications}
              onChange={() => toggleSetting('push_notifications')}
            />
            <ToggleOption
              label="SMS"
              description="Receber notificações por SMS"
              checked={formData.sms_notifications}
              onChange={() => toggleSetting('sms_notifications')}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Tipos de Notificação</h3>
          <div className="space-y-3">
            <ToggleOption
              label="Novos Pedidos"
              description="Notificar quando receber novo pedido"
              checked={formData.notify_new_order}
              onChange={() => toggleSetting('notify_new_order')}
            />
            <ToggleOption
              label="Status de Pedidos"
              description="Mudanças no status dos pedidos"
              checked={formData.notify_order_status}
              onChange={() => toggleSetting('notify_order_status')}
            />
            <ToggleOption
              label="Pagamentos"
              description="Notificar sobre pagamentos recebidos"
              checked={formData.notify_payment}
              onChange={() => toggleSetting('notify_payment')}
            />
            <ToggleOption
              label="Prazos"
              description="Alertas de prazos se aproximando"
              checked={formData.notify_deadline}
              onChange={() => toggleSetting('notify_deadline')}
            />
            <ToggleOption
              label="Menções da Equipe"
              description="Quando alguém mencionar você"
              checked={formData.notify_team_mention}
              onChange={() => toggleSetting('notify_team_mention')}
            />
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Regras de Alertas Avançadas</p>
              <p className="text-xs text-blue-600">Configure quais alertas são gerados, o tipo, a prioridade e para quais perfis são enviados.</p>
            </div>
          </div>
          <a
            href="/settings/notification-rules"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            Gerenciar Regras
          </a>
        </div>

        <button
          onClick={() => onSave('notifications', formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </button>
      </div>
    </div>
  )
}

// Appearance Settings
const AppearanceSettings: React.FC<any> = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    theme: settings?.theme || 'light',
    language: settings?.language || 'pt-BR',
    timezone: settings?.timezone || 'America/Sao_Paulo',
    date_format: settings?.date_format || 'DD/MM/YYYY',
    currency_format: settings?.currency_format || 'BRL',
    compact_mode: settings?.compact_mode || false,
    animations_enabled: settings?.animations_enabled ?? true,
    reduced_motion: settings?.reduced_motion || false,
    high_contrast: settings?.high_contrast || false,
    font_scale: settings?.font_scale || 1.0,
    sidebar_position: settings?.sidebar_position || 'left',
    header_style: settings?.header_style || 'default',
    sidebar_style: settings?.sidebar_style || 'default'
  })

  const [showThemeManager, setShowThemeManager] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Aparência</h2>
        <button
          onClick={() => setShowThemeManager(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Sparkles className="w-5 h-5" />
          Gerenciador de Temas Avançado
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Theme Settings */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Configurações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuso Horário</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                <option value="America/New_York">Nova York (GMT-5)</option>
                <option value="Europe/London">Londres (GMT+0)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Formato de Data</label>
              <select
                value={formData.date_format}
                onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </div>
        </div>

        {/* Layout Settings */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Layout</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estilo do Header</label>
              <select
                value={formData.header_style}
                onChange={(e) => setFormData({ ...formData, header_style: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Padrão</option>
                <option value="compact">Compacto</option>
                <option value="transparent">Transparente</option>
                <option value="minimal">Minimalista</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estilo da Sidebar</label>
              <select
                value={formData.sidebar_style}
                onChange={(e) => setFormData({ ...formData, sidebar_style: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="default">Padrão</option>
                <option value="compact">Compacto</option>
                <option value="mini">Mini</option>
                <option value="overlay">Sobreposto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posição da Sidebar</label>
              <select
                value={formData.sidebar_position}
                onChange={(e) => setFormData({ ...formData, sidebar_position: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="left">Esquerda</option>
                <option value="right">Direita</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escala da Fonte: {(formData.font_scale * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.1"
                value={formData.font_scale}
                onChange={(e) => setFormData({ ...formData, font_scale: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Acessibilidade</h3>
          <div className="space-y-3">
            <ToggleOption
              label="Modo Compacto"
              description="Reduzir espaçamento entre elementos"
              checked={formData.compact_mode}
              onChange={() => setFormData({ ...formData, compact_mode: !formData.compact_mode })}
            />
            <ToggleOption
              label="Animações"
              description="Ativar animações e transições"
              checked={formData.animations_enabled}
              onChange={() => setFormData({ ...formData, animations_enabled: !formData.animations_enabled })}
            />
            <ToggleOption
              label="Movimento Reduzido"
              description="Reduzir movimento para usuários sensíveis"
              checked={formData.reduced_motion}
              onChange={() => setFormData({ ...formData, reduced_motion: !formData.reduced_motion })}
            />
            <ToggleOption
              label="Alto Contraste"
              description="Aumentar contraste para melhor visibilidade"
              checked={formData.high_contrast}
              onChange={() => setFormData({ ...formData, high_contrast: !formData.high_contrast })}
            />
          </div>
        </div>

        <button
          onClick={() => onSave('appearance', formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </button>
      </div>

      {/* Advanced Theme Manager Modal */}
      <AnimatePresence>
        {showThemeManager && (
          <AdvancedThemeManager onClose={() => setShowThemeManager(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// Privacy Settings
const PrivacySettings: React.FC<any> = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    profile_visibility: settings?.profile_visibility || 'team',
    show_online_status: settings?.show_online_status ?? true,
    allow_contact: settings?.allow_contact ?? true
  })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Privacidade</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visibilidade do Perfil</label>
          <select
            value={formData.profile_visibility}
            onChange={(e) => setFormData({ ...formData, profile_visibility: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="private">Privado</option>
            <option value="team">Equipe</option>
            <option value="company">Empresa</option>
            <option value="public">Público</option>
          </select>
        </div>

        <div className="space-y-3">
          <ToggleOption
            label="Mostrar Status Online"
            description="Outros podem ver quando você está online"
            checked={formData.show_online_status}
            onChange={() => setFormData({ ...formData, show_online_status: !formData.show_online_status })}
          />
          <ToggleOption
            label="Permitir Contato"
            description="Outros podem entrar em contato direto"
            checked={formData.allow_contact}
            onChange={() => setFormData({ ...formData, allow_contact: !formData.allow_contact })}
          />
        </div>

        <button
          onClick={() => onSave('privacy', formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

// Backup Settings
const BackupSettings: React.FC<any> = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    auto_backup: settings?.auto_backup ?? true,
    backup_frequency: settings?.backup_frequency || 'daily',
    backup_time: settings?.backup_time || '00:00',
    keep_backups_days: settings?.keep_backups_days || 30
  })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Backup</h2>

      <div className="space-y-4">
        <ToggleOption
          label="Backup Automático"
          description="Fazer backup automático dos seus dados"
          checked={formData.auto_backup}
          onChange={() => setFormData({ ...formData, auto_backup: !formData.auto_backup })}
        />

        {formData.auto_backup && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequência</label>
              <select
                value={formData.backup_frequency}
                onChange={(e) => setFormData({ ...formData, backup_frequency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="realtime">Tempo Real</option>
                <option value="hourly">A cada hora</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Horário do Backup</label>
              <input
                type="time"
                value={formData.backup_time}
                onChange={(e) => setFormData({ ...formData, backup_time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manter Backups por (dias)
              </label>
              <input
                type="number"
                value={formData.keep_backups_days}
                onChange={(e) => setFormData({ ...formData, keep_backups_days: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
            </div>
          </>
        )}

        <button
          onClick={() => onSave('backup', formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

// Sync Settings
const SyncSettings: React.FC<any> = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    realtime_sync: settings?.realtime_sync ?? true,
    offline_mode: settings?.offline_mode ?? true,
    sync_on_wifi_only: settings?.sync_on_wifi_only ?? false
  })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Sincronização</h2>

      <div className="space-y-3">
        <ToggleOption
          label="Sincronização em Tempo Real"
          description="Sincronizar dados imediatamente"
          checked={formData.realtime_sync}
          onChange={() => setFormData({ ...formData, realtime_sync: !formData.realtime_sync })}
        />
        <ToggleOption
          label="Modo Offline"
          description="Trabalhar sem conexão e sincronizar depois"
          checked={formData.offline_mode}
          onChange={() => setFormData({ ...formData, offline_mode: !formData.offline_mode })}
        />
        <ToggleOption
          label="Sincronizar Apenas no Wi-Fi"
          description="Economizar dados móveis"
          checked={formData.sync_on_wifi_only}
          onChange={() => setFormData({ ...formData, sync_on_wifi_only: !formData.sync_on_wifi_only })}
        />

        <button
          onClick={() => onSave('sync', formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-6"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

// Productivity Settings
const ProductivitySettings: React.FC<any> = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    default_view: settings?.default_view || 'kanban',
    items_per_page: settings?.items_per_page || 20,
    show_completed_tasks: settings?.show_completed_tasks ?? false,
    auto_refresh: settings?.auto_refresh ?? true,
    refresh_interval: settings?.refresh_interval || 30
  })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Produtividade</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visualização Padrão</label>
          <select
            value={formData.default_view}
            onChange={(e) => setFormData({ ...formData, default_view: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="list">Lista</option>
            <option value="kanban">Kanban</option>
            <option value="calendar">Calendário</option>
            <option value="timeline">Timeline</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Itens por Página</label>
          <select
            value={formData.items_per_page}
            onChange={(e) => setFormData({ ...formData, items_per_page: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>

        <ToggleOption
          label="Mostrar Tarefas Concluídas"
          description="Exibir tarefas finalizadas na listagem"
          checked={formData.show_completed_tasks}
          onChange={() => setFormData({ ...formData, show_completed_tasks: !formData.show_completed_tasks })}
        />

        <ToggleOption
          label="Atualização Automática"
          description="Recarregar dados automaticamente"
          checked={formData.auto_refresh}
          onChange={() => setFormData({ ...formData, auto_refresh: !formData.auto_refresh })}
        />

        {formData.auto_refresh && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervalo de Atualização (segundos)
            </label>
            <input
              type="number"
              value={formData.refresh_interval}
              onChange={(e) => setFormData({ ...formData, refresh_interval: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="10"
              max="300"
            />
          </div>
        )}

        <button
          onClick={() => onSave('productivity', formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Preferências'}
        </button>
      </div>
    </div>
  )
}

// Security Settings
const SecuritySettings: React.FC<any> = ({ settings, onSave, saving }) => {
  const [formData, setFormData] = useState({
    two_factor_enabled: settings?.two_factor_enabled ?? false,
    session_timeout: settings?.session_timeout || 60,
    require_password_change: settings?.require_password_change ?? false
  })

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Segurança</h2>

      <div className="space-y-4">
        <ToggleOption
          label="Autenticação de Dois Fatores"
          description="Adicionar camada extra de segurança"
          checked={formData.two_factor_enabled}
          onChange={() => setFormData({ ...formData, two_factor_enabled: !formData.two_factor_enabled })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timeout de Sessão (minutos)
          </label>
          <input
            type="number"
            value={formData.session_timeout}
            onChange={(e) => setFormData({ ...formData, session_timeout: parseInt(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            min="5"
            max="480"
          />
          <p className="text-sm text-gray-500 mt-1">
            Tempo de inatividade antes de desconectar automaticamente
          </p>
        </div>

        <ToggleOption
          label="Exigir Troca de Senha"
          description="Solicitar alteração de senha periodicamente"
          checked={formData.require_password_change}
          onChange={() => setFormData({ ...formData, require_password_change: !formData.require_password_change })}
        />

        <button
          onClick={() => onSave('security', formData)}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )
}

// Tax Rate Settings (Director only)
const TaxRateSettings: React.FC = () => {
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRates()
  }, [])

  const loadRates = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tax_rates')
      .select('*')
      .order('name')
    if (error) setError(error.message)
    else setRates(data || [])
    setLoading(false)
  }

  const updateRate = (id: string, field: string, value: any) => {
    setRates(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
  }

  const saveRates = async () => {
    setSaving(true)
    setError(null)
    try {
      for (const rate of rates) {
        const { error } = await supabase
          .from('tax_rates')
          .update({ rate_percentual: Number(rate.rate_percentual), is_active: rate.is_active })
          .eq('id', rate.id)
        if (error) throw error
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalAliquota = rates
    .filter(r => r.is_active)
    .reduce((sum, r) => sum + Number(r.rate_percentual), 0)

  if (loading) return <div className="py-8 text-center text-gray-500">Carregando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Alíquotas Fiscais</h2>
          <p className="text-sm text-gray-600 mt-1">Regime Lucro Presumido — usadas para calcular a margem líquida nas OS</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Alíquota total ativa</p>
          <p className="text-2xl font-bold text-red-600">{totalAliquota.toFixed(2)}%</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}
      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> Alíquotas salvas com sucesso!
        </div>
      )}

      <div className="space-y-3 mb-6">
        {rates.map(rate => (
          <div key={rate.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
            rate.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
          }`}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateRate(rate.id, 'is_active', !rate.is_active)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  rate.is_active ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  rate.is_active ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
              <div>
                <p className="font-medium text-gray-900">{rate.name}</p>
                {rate.description && <p className="text-xs text-gray-500">{rate.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={rate.rate_percentual}
                onChange={e => updateRate(rate.id, 'rate_percentual', e.target.value)}
                step="0.01"
                min="0"
                max="100"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500 text-sm font-medium">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
        <span className="font-semibold text-gray-700">Carga tributária total (ativas)</span>
        <span className="text-xl font-bold text-red-600">{totalAliquota.toFixed(2)}%</span>
      </div>

      <button
        onClick={saveRates}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <Save className="w-5 h-5" />
        {saving ? 'Salvando...' : 'Salvar Alíquotas'}
      </button>
    </div>
  )
}

// Toggle Option Component
const ToggleOption: React.FC<{
  label: string
  description: string
  checked: boolean
  onChange: () => void
}> = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

export default Settings
