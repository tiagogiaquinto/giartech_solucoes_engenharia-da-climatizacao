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
  Upload,
  Download,
  RefreshCw,
  Wrench,
  ClipboardCheck
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
  const [photos, setPhotos] = useState<any[]>([])

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

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineActions()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Load from localStorage
    loadOfflineData()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load order data
  useEffect(() => {
    if (id) {
      loadOrderData()
    }
  }, [id])

  // Timer effect
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
    if (savedQueue) {
      setOfflineQueue(JSON.parse(savedQueue))
    }

    const savedPhotos = localStorage.getItem(`photos_${id}`)
    if (savedPhotos) {
      setPhotos(JSON.parse(savedPhotos))
    }

    const savedChecklist = localStorage.getItem(`checklist_${id}`)
    if (savedChecklist) {
      setChecklist(JSON.parse(savedChecklist))
    }

    const savedSignature = localStorage.getItem(`signature_${id}`)
    if (savedSignature) {
      setSignature(savedSignature)
    }
  }

  const saveOfflineData = () => {
    localStorage.setItem(`offline_queue_${id}`, JSON.stringify(offlineQueue))
    localStorage.setItem(`photos_${id}`, JSON.stringify(photos))
    localStorage.setItem(`checklist_${id}`, JSON.stringify(checklist))
    if (signature) {
      localStorage.setItem(`signature_${id}`, signature)
    }
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
              const existingChecklist = await supabase
                .from('service_order_checklist')
                .select('*')
                .eq('service_order_id', id)
                .eq('item_id', action.data.itemId)
                .single()

              if (existingChecklist.data) {
                await supabase
                  .from('service_order_checklist')
                  .update({ completed: action.data.completed })
                  .eq('id', existingChecklist.data.id)
              }
              break

            case 'photo':
              // Upload photo to storage
              const photoBlob = await fetch(action.data.dataUrl).then(r => r.blob())
              const photoPath = `service-orders/${id}/${Date.now()}.jpg`

              await supabase.storage
                .from('service-order-photos')
                .upload(photoPath, photoBlob)

              await supabase
                .from('service_order_documents')
                .insert({
                  service_order_id: id,
                  document_type: 'photo',
                  file_path: photoPath,
                  file_name: action.data.name
                })
              break

            case 'signature':
              await supabase
                .from('service_orders')
                .update({
                  signature_data: action.data.signatureData,
                  signed_at: new Date().toISOString(),
                  signed_by: user?.name || 'Cliente'
                })
                .eq('id', id)
              break

            case 'time':
              await supabase
                .from('service_order_labor')
                .update({
                  actual_hours: action.data.hours
                })
                .eq('service_order_id', id)
                .eq('employee_id', user?.employee_id)
              break
          }

          // Mark as synced
          action.synced = true
        } catch (err) {
          console.error('Error syncing action:', err)
        }
      }

      setOfflineQueue(offlineQueue.filter(a => !a.synced))
      localStorage.setItem(`offline_queue_${id}`, JSON.stringify(offlineQueue.filter(a => !a.synced)))

    } finally {
      setSyncInProgress(false)
    }
  }

  const loadOrderData = async () => {
    try {
      setLoading(true)

      // Load order
      const orderRes = await supabase
        .from('service_orders')
        .select('*')
        .eq('id', id)
        .single()

      if (!orderRes.data) {
        setLoading(false)
        return
      }

      const [customerRes, itemsRes, materialsRes, teamRes, checklistRes, photosRes] = await Promise.all([
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
          .order('item_order', { ascending: true }),

        supabase
          .from('service_order_documents')
          .select('*')
          .eq('service_order_id', id)
          .eq('document_type', 'photo')
          .order('created_at', { ascending: false })
      ])

      if (orderRes.data) {
        setOrder(orderRes.data)
        // Save to localStorage for offline access
        localStorage.setItem(`order_${id}`, JSON.stringify(orderRes.data))
      }

      setCustomer(customerRes.data)
      setItems(itemsRes.data || [])
      setMaterials(materialsRes.data || [])
      setTeam(teamRes.data || [])
      setChecklist(checklistRes.data || [])
      setPhotos(photosRes.data || [])

      // Save for offline
      localStorage.setItem(`customer_${id}`, JSON.stringify(customerRes.data))
      localStorage.setItem(`items_${id}`, JSON.stringify(itemsRes.data))
      localStorage.setItem(`materials_${id}`, JSON.stringify(materialsRes.data))

    } catch (err) {
      console.error('Error loading data:', err)

      // Try to load from localStorage
      const savedOrder = localStorage.getItem(`order_${id}`)
      if (savedOrder) {
        setOrder(JSON.parse(savedOrder))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setOrder({ ...order, status: newStatus })
    addOfflineAction('status', { status: newStatus })
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

  const handleChecklistToggle = (itemId: string) => {
    const newChecklist = checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    setChecklist(newChecklist)

    const item = newChecklist.find(i => i.id === itemId)
    addOfflineAction('checklist', { itemId, completed: item?.completed })

    localStorage.setItem(`checklist_${id}`, JSON.stringify(newChecklist))
  }

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      const newPhoto = {
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl,
        timestamp: Date.now()
      }

      const newPhotos = [...photos, newPhoto]
      setPhotos(newPhotos)
      localStorage.setItem(`photos_${id}`, JSON.stringify(newPhotos))

      addOfflineAction('photo', newPhoto)
    }
    reader.readAsDataURL(file)
  }

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData)
    setShowSignaturePad(false)
    addOfflineAction('signature', { signatureData })
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando ordem de serviço...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">OS não encontrada</h2>
          <button
            onClick={() => navigate('/service-orders')}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header fixo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/service-orders')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>

          <div className="flex-1 mx-4">
            <h1 className="text-lg font-bold text-gray-900">OS #{order.order_number}</h1>
            <p className="text-sm text-gray-500">{customer?.name}</p>
          </div>

          <div className="flex items-center gap-2">
            {syncInProgress && (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            )}
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
          </div>
        </div>

        {/* Status badge */}
        <div className="px-4 pb-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(order.status)} bg-opacity-10`}>
            <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`} />
            <span className={`text-sm font-medium ${getStatusColor(order.status).replace('bg-', 'text-')}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200 overflow-x-auto">
          {[
            { id: 'overview', label: 'Visão Geral', icon: FileText },
            { id: 'checklist', label: 'Checklist', icon: CheckSquare },
            { id: 'materials', label: 'Materiais', icon: Package },
            { id: 'photos', label: 'Fotos', icon: Camera },
            { id: 'signature', label: 'Assinatura', icon: User }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[100px] px-4 py-3 flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Timer flutuante */}
      <motion.div
        className="fixed top-20 right-4 z-20 bg-white rounded-lg shadow-lg p-3 border border-gray-200"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {formatTime(elapsedTime)}
          </div>
          <button
            onClick={toggleTimer}
            className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
              isTimerRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isTimerRunning ? (
              <>
                <PauseCircle className="w-4 h-4" />
                Pausar
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Iniciar
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Cliente */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Cliente
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-900 font-medium">{customer?.name}</p>
                  {customer?.phone && (
                    <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline block">
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
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <MapPin className="w-4 h-4" />
                      {customer.customer_addresses[0].street}, {customer.customer_addresses[0].number}
                    </a>
                  )}
                </div>
              </div>

              {/* Serviços */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  Serviços a Executar
                </h3>
                <div className="space-y-3">
                  {items.map((item: any) => (
                    <div key={item.id} className="border-l-4 border-blue-500 pl-3 py-2">
                      <h4 className="font-medium text-gray-900">{item.service_catalog?.name}</h4>
                      {item.service_catalog?.description && (
                        <p className="text-sm text-gray-600 mt-1">{item.service_catalog.description}</p>
                      )}
                      {item.escopo_detalhado && (
                        <p className="text-sm text-gray-500 mt-2 italic">{item.escopo_detalhado}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>Quantidade: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Equipe */}
              {team.length > 0 && (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Equipe
                  </h3>
                  <div className="space-y-2">
                    {team.map((member: any) => (
                      <div key={member.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.employees?.name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{member.employees?.name}</p>
                          <p className="text-xs text-gray-500">
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
              {order.instructions_for_technician && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Instruções Importantes
                  </h3>
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                    {order.instructions_for_technician}
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {checklist.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum checklist disponível</p>
                </div>
              ) : (
                checklist.map((item: any) => (
                  <motion.div
                    key={item.id}
                    className="bg-white rounded-lg p-4 shadow-sm"
                    whileTap={{ scale: 0.98 }}
                  >
                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="pt-1">
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                            item.completed
                              ? 'bg-green-600 border-green-600'
                              : 'border-gray-300'
                          }`}
                          onClick={() => handleChecklistToggle(item.id)}
                        >
                          {item.completed && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {item.item_description}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {materials.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum material listado</p>
                </div>
              ) : (
                materials.map((material: any) => (
                  <div key={material.id} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {material.inventory_items?.name || material.material_name}
                        </h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>Quantidade: {material.quantity} {material.inventory_items?.unit || material.unit || 'un'}</p>
                          {material.notes && (
                            <p className="text-gray-500 italic">{material.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <label className="block">
                <div className="bg-blue-600 text-white rounded-lg p-4 text-center cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera className="w-8 h-8 mx-auto mb-2" />
                  <span className="font-medium">Tirar Foto</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </label>

              {photos.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma foto capturada</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map((photo: any) => (
                    <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={photo.dataUrl || photo.file_path}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-xs">
                        {new Date(photo.timestamp || photo.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Signature Tab */}
          {activeTab === 'signature' && (
            <motion.div
              key="signature"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {signature || order.signature_data ? (
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Assinatura do Cliente</h3>
                  <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                    <img
                      src={signature || order.signature_data}
                      alt="Assinatura"
                      className="w-full h-48 object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Assinado em {new Date(order.signed_at || Date.now()).toLocaleString()}
                  </p>
                  <button
                    onClick={() => {
                      setSignature(null)
                      setShowSignaturePad(true)
                    }}
                    className="w-full mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    Coletar Nova Assinatura
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-8 text-center">
                  <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Assinatura não coletada</p>
                  <button
                    onClick={() => setShowSignaturePad(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Coletar Assinatura
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Signature Pad Modal */}
      {showSignaturePad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <SignaturePad
              onSave={handleSignatureSave}
              onCancel={() => setShowSignaturePad(false)}
            />
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-2">
        {/* Offline indicator */}
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2 mb-2">
            <WifiOff className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900">Modo Offline</p>
              <p className="text-xs text-yellow-700">Alterações serão sincronizadas quando conectar</p>
            </div>
            {offlineQueue.length > 0 && (
              <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">
                {offlineQueue.length}
              </span>
            )}
          </div>
        )}

        {/* Status buttons */}
        <div className="grid grid-cols-2 gap-2">
          {order.status === 'pending' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-5 h-5" />
              Iniciar Execução
            </button>
          )}
          {order.status === 'in_progress' && (
            <button
              onClick={() => handleStatusChange('completed')}
              className="px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Concluir OS
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TechnicianMobileView
