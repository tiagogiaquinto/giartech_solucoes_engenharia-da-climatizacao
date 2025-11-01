import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle,
  Camera,
  MapPin,
  Clock,
  User,
  AlertCircle,
  CheckSquare,
  PlayCircle,
  PauseCircle,
  FileText,
  Package,
  Users,
  Wifi,
  WifiOff,
  Check,
  X,
  RefreshCw,
  Wrench,
  ClipboardCheck,
  ImagePlus,
  Shield,
  Zap,
  Star,
  Phone
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUser } from '../contexts/UserContext'
import SignaturePad from '../components/SignaturePad'

interface OfflineAction {
  id: string
  type: 'status' | 'checklist' | 'photo' | 'signature' | 'time'
  data: any
  timestamp: number
  synced: boolean
}

const TechnicianMobileView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()

  const [order, setOrder] = useState<any>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [checklist, setChecklist] = useState<any[]>([])
  const [beforePhotos, setBeforePhotos] = useState<any[]>([])
  const [afterPhotos, setAfterPhotos] = useState<any[]>([])
  const [validation, setValidation] = useState<any>(null)

  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'materials' | 'photos' | 'signature'>('overview')
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)

  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>([])
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineActions()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    loadOfflineData()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (id) {
      loadOrderData()
    }
  }, [id])

  useEffect(() => {
    let interval: any
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTimerRunning, startTime])

  const loadOfflineData = () => {
    const savedQueue = localStorage.getItem(`offline_queue_${id}`)
    if (savedQueue) setOfflineQueue(JSON.parse(savedQueue))

    const savedBefore = localStorage.getItem(`before_photos_${id}`)
    if (savedBefore) setBeforePhotos(JSON.parse(savedBefore))

    const savedAfter = localStorage.getItem(`after_photos_${id}`)
    if (savedAfter) setAfterPhotos(JSON.parse(savedAfter))

    const savedChecklist = localStorage.getItem(`checklist_${id}`)
    if (savedChecklist) setChecklist(JSON.parse(savedChecklist))

    const savedSignature = localStorage.getItem(`signature_${id}`)
    if (savedSignature) setSignature(savedSignature)
  }

  const addOfflineAction = (type: OfflineAction['type'], data: any) => {
    const action: OfflineAction = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      synced: false
    }

    const newQueue = [...offlineQueue, action]
    setOfflineQueue(newQueue)
    localStorage.setItem(`offline_queue_${id}`, JSON.stringify(newQueue))

    if (isOnline) {
      syncOfflineActions()
    }
  }

  const syncOfflineActions = async () => {
    if (syncInProgress || offlineQueue.length === 0) return
    setSyncInProgress(true)

    try {
      const unsyncedActions = offlineQueue.filter(a => !a.synced)

      for (const action of unsyncedActions) {
        try {
          switch (action.type) {
            case 'status':
              await supabase
                .from('service_orders')
                .update({ status: action.data.status, updated_at: new Date().toISOString() })
                .eq('id', id)
              break

            case 'checklist':
              const item = checklist.find(i => i.id === action.data.itemId)
              if (item) {
                await supabase
                  .from('service_order_checklist')
                  .update({ completed: action.data.completed })
                  .eq('id', action.data.itemId)
              }
              break

            case 'photo':
              const photoBlob = await fetch(action.data.dataUrl).then(r => r.blob())
              const photoPath = `service-orders/${id}/${Date.now()}-${action.data.photoType}.jpg`

              await supabase.storage
                .from('service-order-photos')
                .upload(photoPath, photoBlob)

              await supabase
                .from('service_order_photos')
                .insert({
                  service_order_id: id,
                  photo_type: action.data.photoType,
                  photo_url: photoPath,
                  uploaded_by: user?.employee_id
                })
              break

            case 'signature':
              await supabase
                .from('service_orders')
                .update({
                  signature_data: action.data.signatureData,
                  signed_at: new Date().toISOString()
                })
                .eq('id', id)
              break
          }

          action.synced = true
        } catch (err) {
          console.error('Error syncing action:', err)
        }
      }

      setOfflineQueue(offlineQueue.filter(a => !a.synced))
      localStorage.setItem(`offline_queue_${id}`, JSON.stringify(offlineQueue.filter(a => !a.synced)))

      // Revalidar após sync
      await validateOrder()

    } finally {
      setSyncInProgress(false)
    }
  }

  const loadOrderData = async () => {
    try {
      setLoading(true)

      const orderRes = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', id)
        .single()

      if (!orderRes.data) {
        setLoading(false)
        return
      }

      const [customerRes, itemsRes, materialsRes, teamRes, checklistRes, beforeRes, afterRes] = await Promise.all([
        supabase
          .from('customers')
          .select('*, customer_addresses(*)')
          .eq('id', orderRes.data.customer_id)
          .single(),

        supabase
          .from('service_order_items')
          .select('*, service_catalog:service_catalog_id(name, description)')
          .eq('service_order_id', id)
          .order('created_at', { ascending: true }),

        supabase
          .from('service_order_materials')
          .select('*, inventory_items(name, unit)')
          .eq('service_order_id', id)
          .order('created_at', { ascending: true }),

        supabase
          .from('service_order_labor')
          .select('*, employees(name)')
          .eq('service_order_id', id)
          .order('created_at', { ascending: true }),

        supabase
          .from('service_order_checklist')
          .select('*')
          .eq('service_order_id', id)
          .order('priority', { ascending: true })
          .order('item_order', { ascending: true }),

        supabase
          .from('service_order_photos')
          .select('*')
          .eq('service_order_id', id)
          .eq('photo_type', 'before')
          .order('created_at', { ascending: false }),

        supabase
          .from('service_order_photos')
          .select('*')
          .eq('service_order_id', id)
          .eq('photo_type', 'after')
          .order('created_at', { ascending: false })
      ])

      setOrder(orderRes.data)
      setCustomer(customerRes.data)
      setItems(itemsRes.data || [])
      setMaterials(materialsRes.data || [])
      setTeam(teamRes.data || [])
      setChecklist(checklistRes.data || [])
      setBeforePhotos(beforeRes.data || [])
      setAfterPhotos(afterRes.data || [])

      if (orderRes.data.signature_data) {
        setSignature(orderRes.data.signature_data)
      }

      // Carregar validação
      await validateOrder()

      localStorage.setItem(`order_${id}`, JSON.stringify(orderRes.data))
      localStorage.setItem(`customer_${id}`, JSON.stringify(customerRes.data))

    } catch (err) {
      console.error('Error loading data:', err)

      const savedOrder = localStorage.getItem(`order_${id}`)
      if (savedOrder) {
        setOrder(JSON.parse(savedOrder))
      }
    } finally {
      setLoading(false)
    }
  }

  const validateOrder = async () => {
    try {
      const { data, error } = await supabase.rpc('validate_service_order', {
        p_service_order_id: id
      })

      if (data) {
        setValidation(data)
      }
    } catch (err) {
      console.error('Error validating order:', err)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setOrder({ ...order, status: newStatus })
    addOfflineAction('status', { status: newStatus })

    if (isOnline) {
      await supabase
        .from('service_orders')
        .update({ status: newStatus })
        .eq('id', id)
    }
  }

  const toggleTimer = () => {
    if (isTimerRunning) {
      setIsTimerRunning(false)
      const hours = elapsedTime / (1000 * 60 * 60)
      addOfflineAction('time', { hours })
    } else {
      setStartTime(Date.now() - elapsedTime)
      setIsTimerRunning(true)
    }
  }

  const handleChecklistToggle = async (itemId: string) => {
    const newChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    setChecklist(newChecklist)

    const item = newChecklist.find(i => i.id === itemId)
    addOfflineAction('checklist', { itemId, completed: item?.completed })

    localStorage.setItem(`checklist_${id}`, JSON.stringify(newChecklist))

    if (isOnline) {
      await supabase
        .from('service_order_checklist')
        .update({ completed: item?.completed })
        .eq('id', itemId)

      await validateOrder()
    }
  }

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>, photoType: 'before' | 'after') => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = async () => {
      const dataUrl = reader.result as string
      const newPhoto = {
        id: crypto.randomUUID(),
        photo_type: photoType,
        photo_url: dataUrl,
        taken_at: new Date().toISOString()
      }

      if (photoType === 'before') {
        const newPhotos = [...beforePhotos, newPhoto]
        setBeforePhotos(newPhotos)
        localStorage.setItem(`before_photos_${id}`, JSON.stringify(newPhotos))
      } else {
        const newPhotos = [...afterPhotos, newPhoto]
        setAfterPhotos(newPhotos)
        localStorage.setItem(`after_photos_${id}`, JSON.stringify(newPhotos))
      }

      if (isOnline) {
        try {
          const photoBlob = await fetch(dataUrl).then(r => r.blob())
          const photoPath = `service-orders/${id}/${Date.now()}-${photoType}.jpg`

          await supabase.storage
            .from('service-order-photos')
            .upload(photoPath, photoBlob)

          await supabase
            .from('service_order_photos')
            .insert({
              service_order_id: id,
              photo_type: photoType,
              photo_url: photoPath,
              uploaded_by: user?.employee_id
            })

          await validateOrder()
        } catch (err) {
          console.error('Error uploading photo:', err)
          addOfflineAction('photo', { ...newPhoto, dataUrl, photoType })
        }
      } else {
        addOfflineAction('photo', { ...newPhoto, dataUrl, photoType })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSignatureSave = async (signatureData: string) => {
    setSignature(signatureData)
    setShowSignaturePad(false)
    addOfflineAction('signature', { signatureData })

    if (isOnline) {
      await supabase
        .from('service_orders')
        .update({
          signature_data: signatureData,
          signed_at: new Date().toISOString()
        })
        .eq('id', id)

      await validateOrder()
    }
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    }
    return colors[status] || 'bg-gray-500'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      in_progress: 'Em Execução',
      completed: 'Concluída',
      cancelled: 'Cancelada'
    }
    return labels[status] || status
  }

  const getPriorityColor = (priority: number) => {
    if (priority === 1) return 'border-l-red-500 bg-red-50'
    if (priority === 2) return 'border-l-yellow-500 bg-yellow-50'
    return 'border-l-blue-500 bg-blue-50'
  }

  const getPriorityIcon = (priority: number) => {
    if (priority === 1) return <AlertCircle className="w-4 h-4 text-red-600" />
    if (priority === 2) return <Zap className="w-4 h-4 text-yellow-600" />
    return <Shield className="w-4 h-4 text-blue-600" />
  }

  const checklistProgress = checklist.length > 0
    ? Math.round((checklist.filter(i => i.completed).length / checklist.length) * 100)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-16 h-16 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-xl font-semibold">Carregando OS...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">OS não encontrada</h2>
          <button
            onClick={() => navigate('/service-orders')}
            className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl text-lg font-semibold shadow-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-32">
      {/* Header fixo com gradiente */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white sticky top-0 z-30 shadow-xl">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/service-orders')}
            className="p-3 hover:bg-white/20 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex-1 mx-4">
            <h1 className="text-lg font-bold">OS #{order.order_number}</h1>
            <p className="text-sm text-blue-100">{customer?.name}</p>
          </div>

          <div className="flex items-center gap-2">
            {syncInProgress && (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
            {isOnline ? (
              <Wifi className="w-5 h-5" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-300" />
            )}
          </div>
        </div>

        {/* Validação Status Badge */}
        {validation && (
          <div className="px-4 pb-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              validation.is_valid
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 text-white'
            }`}>
              {validation.is_valid ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">OS Válida - Pronta para Conclusão</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    Pendente ({beforePhotos.length}/2 antes, {afterPhotos.length}/2 depois)
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs com scroll horizontal */}
        <div className="flex overflow-x-auto hide-scrollbar border-t border-white/20">
          {[
            { id: 'overview', label: 'Dados', icon: FileText },
            { id: 'checklist', label: 'Lista', icon: CheckSquare, badge: `${checklistProgress}%` },
            { id: 'materials', label: 'Materiais', icon: Package },
            { id: 'photos', label: 'Fotos', icon: Camera, badge: `${beforePhotos.length + afterPhotos.length}` },
            { id: 'signature', label: 'Assinar', icon: User }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-6 py-4 flex flex-col items-center gap-1 transition-all relative ${
                activeTab === tab.id
                  ? 'text-white bg-white/20'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <div className="relative">
                <tab.icon className="w-6 h-6" />
                {tab.badge && (
                  <span className="absolute -top-2 -right-3 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Timer Flutuante Melhorado */}
      <motion.div
        className="fixed top-32 right-4 z-20 bg-white rounded-2xl shadow-2xl p-4 border-2 border-blue-500"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center">
          <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <div className="text-3xl font-bold text-gray-900 mb-3">
            {formatTime(elapsedTime)}
          </div>
          <button
            onClick={toggleTimer}
            className={`w-full px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-semibold transition-all ${
              isTimerRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isTimerRunning ? (
              <>
                <PauseCircle className="w-5 h-5" />
                Pausar
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Iniciar
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Content com padding maior */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Cliente Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <User className="w-6 h-6 text-blue-600" />
                  Cliente
                </h3>
                <div className="space-y-3">
                  <p className="text-xl font-semibold text-gray-900">{customer?.name}</p>
                  {customer?.phone && (
                    <a
                      href={`tel:${customer.phone}`}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-lg"
                    >
                      <Phone className="w-5 h-5" />
                      {customer.phone}
                    </a>
                  )}
                  {customer?.customer_addresses?.[0] && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${customer.customer_addresses[0].street}, ${customer.customer_addresses[0].number} - ${customer.customer_addresses[0].city}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <MapPin className="w-5 h-5" />
                      <span className="text-sm">
                        {customer.customer_addresses[0].street}, {customer.customer_addresses[0].number}
                      </span>
                    </a>
                  )}
                </div>
              </div>

              {/* Serviços Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <Wrench className="w-6 h-6 text-blue-600" />
                  Serviços
                </h3>
                <div className="space-y-3">
                  {items.map((item: any) => (
                    <div key={item.id} className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r-xl">
                      <h4 className="font-semibold text-gray-900 text-lg">{item.service_catalog?.name}</h4>
                      {item.service_catalog?.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.service_catalog.description}</p>
                      )}
                      {item.escopo_detalhado && (
                        <p className="text-sm text-gray-700 mt-2 italic font-medium">{item.escopo_detalhado}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipe Card */}
              {team.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                    Equipe
                  </h3>
                  <div className="space-y-3">
                    {team.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {member.employees?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{member.employees?.name}</p>
                          <p className="text-sm text-gray-500">
                            {member.role === 'technician' ? 'Técnico' :
                             member.role === 'assistant' ? 'Assistente' : 'Supervisor'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instruções */}
              {order.notes && (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6">
                  <h3 className="font-bold text-yellow-900 mb-3 flex items-center gap-2 text-lg">
                    <AlertCircle className="w-6 h-6" />
                    Instruções Importantes
                  </h3>
                  <p className="text-yellow-800 whitespace-pre-wrap font-medium">
                    {order.notes}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {/* Progress Bar */}
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-gray-900">Progresso</span>
                  <span className="text-2xl font-bold text-blue-600">{checklistProgress}%</span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-green-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${checklistProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {checklist.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                  <ClipboardCheck className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum checklist disponível</p>
                </div>
              ) : (
                checklist.map((item: any) => (
                  <motion.div
                    key={item.id}
                    className={`bg-white rounded-2xl p-5 shadow-lg border-l-4 ${getPriorityColor(item.priority)}`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <label className="flex items-start gap-4 cursor-pointer">
                      <div className="pt-1">
                        <div
                          className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                            item.completed
                              ? 'bg-green-600 border-green-600'
                              : 'border-gray-300 hover:border-blue-500'
                          }`}
                          onClick={() => handleChecklistToggle(item.id)}
                        >
                          {item.completed && <Check className="w-5 h-5 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {getPriorityIcon(item.priority)}
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            {item.category || 'Geral'}
                          </span>
                        </div>
                        <p className={`font-medium text-lg ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {item.item_description}
                        </p>
                        {item.photo_required && (
                          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                            <Camera className="w-4 h-4" />
                            <span className="font-medium">Foto obrigatória</span>
                          </div>
                        )}
                      </div>
                    </label>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <motion.div
              key="materials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-3"
            >
              {materials.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                  <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum material listado</p>
                </div>
              ) : (
                materials.map((material: any) => (
                  <div key={material.id} className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {material.inventory_items?.name || material.material_name}
                        </h4>
                        <div className="mt-3 space-y-2 text-base text-gray-700">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Quantidade:</span>
                            <span>{material.quantity} {material.inventory_items?.unit || material.unit || 'un'}</span>
                          </div>
                          {material.notes && (
                            <p className="text-gray-600 italic bg-gray-50 p-3 rounded-xl">{material.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Photos Tab - MELHORADO */}
          {activeTab === 'photos' && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Fotos ANTES */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Camera className="w-6 h-6 text-blue-600" />
                    Fotos ANTES
                  </h3>
                  <span className={`px-4 py-2 rounded-full font-bold ${
                    beforePhotos.length >= 2
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {beforePhotos.length}/2
                  </span>
                </div>

                <label className="block mb-4">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 text-center cursor-pointer hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl">
                    <ImagePlus className="w-12 h-12 mx-auto mb-3" />
                    <span className="text-lg font-bold">Tirar Foto ANTES</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoCapture(e, 'before')}
                    className="hidden"
                  />
                </label>

                {beforePhotos.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                    <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma foto capturada</p>
                    <p className="text-sm text-red-600 mt-2 font-medium">Mínimo 2 fotos obrigatórias</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {beforePhotos.map((photo: any) => (
                      <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                        <img
                          src={photo.photo_url}
                          alt="Antes"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          ANTES
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                          {new Date(photo.taken_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fotos DEPOIS */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Camera className="w-6 h-6 text-green-600" />
                    Fotos DEPOIS
                  </h3>
                  <span className={`px-4 py-2 rounded-full font-bold ${
                    afterPhotos.length >= 2
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {afterPhotos.length}/2
                  </span>
                </div>

                <label className="block mb-4">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl p-6 text-center cursor-pointer hover:from-green-700 hover:to-green-800 transition-all shadow-xl">
                    <ImagePlus className="w-12 h-12 mx-auto mb-3" />
                    <span className="text-lg font-bold">Tirar Foto DEPOIS</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handlePhotoCapture(e, 'after')}
                    className="hidden"
                  />
                </label>

                {afterPhotos.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                    <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhuma foto capturada</p>
                    <p className="text-sm text-red-600 mt-2 font-medium">Mínimo 2 fotos obrigatórias</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {afterPhotos.map((photo: any) => (
                      <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                        <img
                          src={photo.photo_url}
                          alt="Depois"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                          DEPOIS
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs">
                          {new Date(photo.taken_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Signature Tab */}
          {activeTab === 'signature' && (
            <motion.div
              key="signature"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {signature || order.signature_data ? (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Assinatura Coletada
                  </h3>
                  <div className="border-2 border-green-500 rounded-2xl p-4 bg-green-50">
                    <img
                      src={signature || order.signature_data}
                      alt="Assinatura"
                      className="w-full h-64 object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-3 text-center font-medium">
                    Assinado em {new Date(order.signed_at || Date.now()).toLocaleString()}
                  </p>
                  <button
                    onClick={() => {
                      setSignature(null)
                      setShowSignaturePad(true)
                    }}
                    className="w-full mt-4 px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-2xl hover:bg-blue-50 font-semibold text-lg"
                  >
                    Coletar Nova Assinatura
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                  <User className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-6 text-lg">Assinatura não coletada</p>
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 shadow-xl text-lg font-bold"
                  >
                    Coletar Assinatura do Cliente
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignaturePad(false)}
            />
          </div>
        </div>
      )}

      {/* Bottom Actions - MELHORADO */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 space-y-3 shadow-2xl">
        {/* Offline indicator */}
        {!isOnline && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-4 flex items-center gap-3">
            <WifiOff className="w-6 h-6 text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-900">Modo Offline</p>
              <p className="text-xs text-yellow-700">Alterações serão sincronizadas</p>
            </div>
            {offlineQueue.length > 0 && (
              <span className="px-3 py-1 bg-yellow-600 text-white text-sm rounded-full font-bold">
                {offlineQueue.length}
              </span>
            )}
          </div>
        )}

        {/* Status buttons - MAIORES */}
        <div className="grid grid-cols-1 gap-3">
          {order.status === 'pending' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-3 shadow-xl"
            >
              <PlayCircle className="w-7 h-7" />
              INICIAR EXECUÇÃO
            </button>
          )}
          {order.status === 'in_progress' && validation?.is_valid && (
            <button
              onClick={() => handleStatusChange('completed')}
              className="px-6 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl font-bold text-lg hover:from-green-700 hover:to-green-800 flex items-center justify-center gap-3 shadow-xl"
            >
              <CheckCircle className="w-7 h-7" />
              CONCLUIR OS
            </button>
          )}
          {order.status === 'in_progress' && !validation?.is_valid && (
            <div className="px-6 py-5 bg-red-100 border-2 border-red-400 text-red-900 rounded-2xl font-bold text-center">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-lg">Complete todos os requisitos</p>
              <p className="text-sm mt-1">Fotos ANTES/DEPOIS, Checklist e Assinatura</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TechnicianMobileView
