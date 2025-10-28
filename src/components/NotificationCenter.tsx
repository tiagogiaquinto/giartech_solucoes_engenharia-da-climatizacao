import React, { useState, useEffect } from 'react'
import { Bell, Check, X, AlertCircle, Info, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useToast } from '../hooks/useToast'
import { useNavigate } from 'react-router-dom'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  link?: string
  action_label?: string
  category?: string
  priority: number
  read: boolean
  read_at?: string
  created_at: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('unread')
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadNotifications()
    setupRealtimeSubscription()
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('archived', false)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter === 'unread') {
        query = query.eq('read', false)
      }

      const { data, error } = await query

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.read).length || 0)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Notification change:', payload)
          loadNotifications()

          // Mostrar toast para novas notificações
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as Notification
            if (newNotif.type === 'error') {
              toast.error(newNotif.title)
            } else if (newNotif.type === 'warning') {
              toast.warning(newNotif.title)
            } else if (newNotif.type === 'success') {
              toast.success(newNotif.title)
            } else {
              toast.info(newNotif.title)
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId
      })

      if (error) throw error

      loadNotifications()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      // Get current user - using a simple approach
      const { data: employees } = await supabase
        .from('employees')
        .select('id')
        .limit(1)
        .single()

      if (employees?.id) {
        const { error } = await supabase.rpc('mark_all_notifications_as_read', {
          p_user_id: employees.id
        })

        if (error) throw error

        toast.success('Todas as notificações marcadas como lidas')
        loadNotifications()
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Erro ao marcar notificações como lidas')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ archived: true })
        .eq('id', notificationId)

      if (error) throw error

      loadNotifications()
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Erro ao excluir notificação')
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }

    if (notification.link) {
      navigate(notification.link)
      setIsOpen(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = (type: string, read: boolean) => {
    const opacity = read ? '50' : '100'
    switch (type) {
      case 'error':
        return `bg-red-${opacity}`
      case 'warning':
        return `bg-yellow-${opacity}`
      case 'success':
        return `bg-green-${opacity}`
      default:
        return `bg-blue-${opacity}`
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR')
  }

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notificações
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Não lidas ({unreadCount})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Todas
                </button>
              </div>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="w-full mt-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 font-medium transition-colors"
                >
                  <Check className="h-4 w-4 inline mr-2" />
                  Marcar todas como lidas
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5" />
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.created_at)}
                            </span>

                            <div className="flex items-center gap-2">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  Marcar como lida
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                                title="Excluir"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
