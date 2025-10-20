import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Smartphone,
  Save,
  Check,
  Database,
  Cloud
} from 'lucide-react'
import { useUser } from '../contexts/UserContext'

const Settings = () => {
  const { user, isAdmin } = useUser()
  const [activeTab, setActiveTab] = useState('profile')
  const [saved, setSaved] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '(11) 99999-9999',
    company: 'Minha Empresa'
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false
  })
  
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '00:00',
    keepBackups: '30'
  })
  
  const [syncSettings, setSyncSettings] = useState({
    realTimeSync: true,
    offlineMode: true,
    syncOnWifiOnly: false
  })

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleNotificationChange = (key: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handleBackupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBackupSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSyncChange = (key: string) => {
    setSyncSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }))
  }

  const handleSaveProfile = () => {
    console.log('Saving profile:', profileData)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveNotifications = () => {
    console.log('Saving notification settings:', notificationSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveBackup = () => {
    console.log('Saving backup settings:', backupSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveSync = () => {
    console.log('Saving sync settings:', syncSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      </div>

      {/* Settings Tabs */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="font-medium">Perfil</span>
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
              activeTab === 'notifications'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bell className="h-5 w-5" />
            <span className="font-medium">Notificações</span>
          </button>
          
          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('backup')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                  activeTab === 'backup'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Database className="h-5 w-5" />
                <span className="font-medium">Backup</span>
              </button>
              
              <button
                onClick={() => setActiveTab('sync')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors ${
                  activeTab === 'sync'
                    ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Cloud className="h-5 w-5" />
                <span className="font-medium">Sincronização</span>
              </button>
            </>
          )}
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900">Informações do Perfil</h2>
              
              <div className="flex items-center space-x-4 mb-6">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{user?.name}</h3>
                  <p className="text-gray-600">{user?.email}</p>
                  <div className="mt-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {user?.role === 'admin' ? 'Administrador' : 
                       user?.role === 'technician' ? 'Técnico' : 'Funcionário Externo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Empresa
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={profileData.company}
                    onChange={handleProfileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveProfile}
                className={`flex items-center px-6 py-2 rounded-lg transition-all duration-200 ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                }`}
              >
                {saved ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900">Preferências de Notificação</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Notificações por Email</h3>
                    <p className="text-sm text-gray-600">Receber atualizações importantes por email</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.email}
                      onChange={() => handleNotificationChange('email')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Notificações Push</h3>
                    <p className="text-sm text-gray-600">Notificações em tempo real no navegador</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.push}
                      onChange={() => handleNotificationChange('push')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">SMS</h3>
                    <p className="text-sm text-gray-600">Alertas críticos por mensagem de texto</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.sms}
                      onChange={() => handleNotificationChange('sms')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSaveNotifications}
                className={`flex items-center px-6 py-2 rounded-lg transition-all duration-200 ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                }`}
              >
                {saved ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && isAdmin && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900">Configurações de Backup</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Backup Automático</h3>
                    <p className="text-sm text-gray-600">Realizar backup automático dos dados</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupSettings.autoBackup}
                      onChange={() => setBackupSettings(prev => ({ ...prev, autoBackup: !prev.autoBackup }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {backupSettings.autoBackup && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Frequência
                        </label>
                        <select
                          name="backupFrequency"
                          value={backupSettings.backupFrequency}
                          onChange={handleBackupChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="daily">Diário</option>
                          <option value="weekly">Semanal</option>
                          <option value="monthly">Mensal</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Horário
                        </label>
                        <input
                          type="time"
                          name="backupTime"
                          value={backupSettings.backupTime}
                          onChange={handleBackupChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Manter Backups (dias)
                      </label>
                      <input
                        type="number"
                        name="keepBackups"
                        value={backupSettings.keepBackups}
                        onChange={handleBackupChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                      />
                    </div>
                  </>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={handleSaveBackup}
                    className={`flex items-center px-6 py-2 rounded-lg transition-all duration-200 ${
                      saved
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                    }`}
                  >
                    {saved ? (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Salvo!
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Salvar Configurações
                      </>
                    )}
                  </button>
                  
                  <button
                    className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <Database className="h-5 w-5 mr-2 inline" />
                    Backup Manual
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Sync Tab */}
          {activeTab === 'sync' && isAdmin && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-lg font-semibold text-gray-900">Configurações de Sincronização</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Sincronização em Tempo Real</h3>
                    <p className="text-sm text-gray-600">Manter dados sincronizados em tempo real entre dispositivos</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSettings.realTimeSync}
                      onChange={() => handleSyncChange('realTimeSync')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Modo Offline</h3>
                    <p className="text-sm text-gray-600">Permitir trabalhar offline e sincronizar depois</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSettings.offlineMode}
                      onChange={() => handleSyncChange('offlineMode')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">Sincronizar Apenas no Wi-Fi</h3>
                    <p className="text-sm text-gray-600">Economizar dados móveis sincronizando apenas no Wi-Fi</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSettings.syncOnWifiOnly}
                      onChange={() => handleSyncChange('syncOnWifiOnly')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <button
                onClick={handleSaveSync}
                className={`flex items-center px-6 py-2 rounded-lg transition-all duration-200 ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
                }`}
              >
                {saved ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Salvo!
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings