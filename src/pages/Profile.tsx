import React from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Edit, Crown } from 'lucide-react'
import { useUser } from '../contexts/UserContext'

const Profile = () => {
  const { user, isPremium } = useUser()

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={user?.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            {isPremium && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-2 rounded-full">
                <Crown className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-600">{user?.email}</p>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
              isPremium 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isPremium ? '👑 Premium' : 'Básico'}
            </div>
          </div>
          <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
            <Edit className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Profile Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Informações Pessoais</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Nome Completo</p>
              <p className="font-medium text-gray-900">{user?.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Phone className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-medium text-gray-900">(11) 99999-9999</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MapPin className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Localização</p>
              <p className="font-medium text-gray-900">São Paulo, SP</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Account Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">Estatísticas da Conta</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Projetos', value: '12', color: 'from-blue-500 to-cyan-500' },
            { label: 'Tarefas', value: '48', color: 'from-green-500 to-emerald-500' },
            { label: 'Horas', value: '156', color: 'from-purple-500 to-pink-500' },
            { label: 'Equipe', value: '8', color: 'from-orange-500 to-red-500' }
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <span className="text-2xl font-bold text-white">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Profile