import { useState, useEffect, useRef } from 'react'
import { Search, Star, Clock, Package, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Service {
  id: string
  name: string
  description?: string
  category?: string
  base_price?: number
  estimated_time?: number
  materials_count?: number
  is_favorite?: boolean
}

interface SmartServiceSearchProps {
  services: Service[]
  recentServices?: string[]
  favoriteServices?: string[]
  onSelect: (service: Service) => void
  placeholder?: string
}

export const SmartServiceSearch = ({
  services,
  recentServices = [],
  favoriteServices = [],
  onSelect,
  placeholder = 'Buscar serviço...'
}: SmartServiceSearchProps) => {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!search.trim()) {
      const favorites = services.filter(s => favoriteServices.includes(s.id))
      const recents = services.filter(s => recentServices.includes(s.id))
      const uniqueServices = [...favorites, ...recents.filter(r => !favoriteServices.includes(r.id))]
      setFilteredServices(uniqueServices.slice(0, 8))
    } else {
      const searchLower = search.toLowerCase()
      const filtered = services.filter(s =>
        s.name.toLowerCase().includes(searchLower) ||
        s.description?.toLowerCase().includes(searchLower) ||
        s.category?.toLowerCase().includes(searchLower)
      )
      setFilteredServices(filtered.slice(0, 10))
    }
    setSelectedIndex(0)
  }, [search, services, recentServices, favoriteServices])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredServices.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredServices.length) % filteredServices.length)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredServices[selectedIndex]) {
          handleSelect(filteredServices[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleSelect = (service: Service) => {
    onSelect(service)
    setSearch('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const formatPrice = (price?: number) => {
    if (!price) return 'Sob consulta'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoComplete="off"
        />
        {search && (
          <button
            onClick={() => {
              setSearch('')
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && filteredServices.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto"
          >
            {!search && (
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                {favoriteServices.length > 0 && 'Favoritos e Recentes'}
                {favoriteServices.length === 0 && recentServices.length > 0 && 'Usados Recentemente'}
                {favoriteServices.length === 0 && recentServices.length === 0 && 'Todos os Serviços'}
              </div>
            )}

            {filteredServices.map((service, index) => {
              const isFavorite = favoriteServices.includes(service.id)
              const isRecent = recentServices.includes(service.id)
              const isSelected = index === selectedIndex

              return (
                <motion.button
                  key={service.id}
                  onClick={() => handleSelect(service)}
                  className={`w-full px-4 py-3 text-left transition-colors border-b last:border-b-0 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <span className="font-medium text-gray-900 truncate">
                          {service.name}
                        </span>
                      </div>

                      {service.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {service.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {service.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            {service.category}
                          </span>
                        )}
                        {service.estimated_time && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(service.estimated_time)}
                          </span>
                        )}
                        {service.materials_count && service.materials_count > 0 && (
                          <span className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {service.materials_count} materiais
                          </span>
                        )}
                        {isRecent && !isFavorite && (
                          <span className="text-blue-600">Usado recentemente</span>
                        )}
                      </div>
                    </div>

                    {service.base_price && (
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatPrice(service.base_price)}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}

            {search && filteredServices.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhum serviço encontrado</p>
                <p className="text-sm mt-1">Tente buscar por outro termo</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
