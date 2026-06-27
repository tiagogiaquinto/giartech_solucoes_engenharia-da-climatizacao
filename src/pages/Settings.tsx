import { Link } from 'react-router-dom'
import { Settings as SettingsIcon, Brain, ChevronRight } from 'lucide-react'

const settingSections = [
  {
    id: 'thomaz',
    label: 'Thomaz AI',
    desc: 'Comportamento, notificações, posição do ícone e alertas financeiros',
    icon: Brain,
    href: '/thomaz/config',
    badge: 'IA',
  },
]

export default function Settings() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gray-900 flex items-center justify-center">
            <SettingsIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Configurações</h1>
            <p className="text-xs text-gray-500">Gerencie as preferências do sistema</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">Módulos</p>

        {settingSections.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.id}
              to={section.href}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{section.label}</p>
                  {section.badge && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                      {section.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{section.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </Link>
          )
        })}

        <div className="pt-4">
          <Link to="/" className="text-sm text-blue-600 hover:underline">
            ← Início
          </Link>
        </div>
      </div>
    </div>
  )
}
