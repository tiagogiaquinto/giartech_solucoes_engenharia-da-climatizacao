import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ExternalLink,
  Star,
  MapPin,
  Phone,
  Mail,
  Briefcase
} from 'lucide-react'

const AdvertisingSidebar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAd, setSelectedAd] = useState<any>(null)

  const advertisements = [
    {
      id: 1,
      company: 'TechSolutions Pro',
      title: 'Desenvolvimento de Software',
      description: 'Soluções completas em desenvolvimento web e mobile.',
      image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=300',
      category: 'Tecnologia',
      rating: 4.8,
      contact: {
        phone: '(11) 99999-1234',
        email: 'contato@techsolutions.com',
        website: 'www.techsolutions.com'
      },
      location: 'São Paulo, SP',
      featured: true
    },
    {
      id: 2,
      company: 'Design Studio Creative',
      title: 'Design Gráfico e UX/UI',
      description: 'Identidades visuais e experiências digitais incríveis.',
      image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=300',
      category: 'Design',
      rating: 4.9,
      contact: {
        phone: '(11) 98888-5678',
        email: 'hello@designstudio.com',
        website: 'www.designstudio.com'
      },
      location: 'Rio de Janeiro, RJ',
      featured: false
    },
    {
      id: 3,
      company: 'CloudHost Brasil',
      title: 'Hospedagem e Cloud',
      description: 'Serviços de hospedagem confiáveis e soluções em nuvem.',
      image: 'https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=300',
      category: 'Infraestrutura',
      rating: 4.7,
      contact: {
        phone: '(11) 97777-9012',
        email: 'suporte@cloudhost.com.br',
        website: 'www.cloudhost.com.br'
      },
      location: 'Belo Horizonte, MG',
      featured: true
    }
  ]

  const handleAdClick = (ad: any) => {
    setSelectedAd(ad)
  }

  const handleContactClick = (type: string, value: string) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${value}`)
        break
      case 'email':
        window.open(`mailto:${value}`)
        break
      case 'website':
        window.open(`https://${value}`, '_blank')
        break
    }
  }

  return (
    <>
      {/* Ultra Discrete Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-1/2 transform -translate-y-1/2 z-40 bg-white/90 backdrop-blur-sm border border-gray-200/30 text-gray-500 p-0.5 rounded-l-md shadow-sm transition-all duration-300 hover:bg-white hover:text-gray-700 ${
          isOpen ? 'right-48' : 'right-0'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isOpen ? <ChevronRight className="h-2.5 w-2.5" /> : <ChevronLeft className="h-2.5 w-2.5" />}
      </motion.button>

      {/* Ultra Compact Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-48 bg-white/95 backdrop-blur-sm shadow-lg z-30 overflow-y-auto border-l border-gray-100/30"
          >
            {/* Ultra Compact Header */}
            <div className="bg-gray-50/80 p-2 border-b border-gray-100/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Briefcase className="h-3 w-3 text-gray-500" />
                  <h2 className="text-xs font-medium text-gray-700">Parceiros</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="h-2.5 w-2.5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Ultra Compact Advertisements */}
            <div className="p-1.5 space-y-1.5">
              {advertisements.map((ad, index) => (
                <motion.div
                  key={ad.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleAdClick(ad)}
                  className="bg-white/80 border border-gray-100/50 rounded-lg p-1.5 cursor-pointer hover:shadow-sm hover:border-gray-200 transition-all duration-200 relative"
                >
                  {ad.featured && (
                    <div className="absolute top-0.5 right-0.5 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full flex items-center">
                      <Star className="h-1 w-1 mr-0.5" />
                      <span className="text-xs">Pro</span>
                    </div>
                  )}

                  <div className="flex space-x-1.5">
                    <img
                      src={ad.image}
                      alt={ad.company}
                      className="w-6 h-6 rounded object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 text-xs truncate">{ad.company}</h3>
                      <p className="text-xs text-gray-600 truncate">{ad.title}</p>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <div className="flex items-center">
                          <Star className="h-1.5 w-1.5 text-yellow-400 mr-0.5" />
                          <span className="text-xs text-gray-500">{ad.rating}</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-1 py-0.5 rounded">
                          {ad.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Ultra Compact Footer */}
            <div className="p-1.5 border-t border-gray-100/30 bg-gray-50/50">
              <p className="text-xs text-gray-500 text-center">
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Anunciar aqui
                </button>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Ad Detail Modal */}
      <AnimatePresence>
        {selectedAd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAd(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white rounded-xl p-3 w-full max-w-xs shadow-xl border border-gray-100"
            >
              <button
                onClick={() => setSelectedAd(null)}
                className="absolute top-1.5 right-1.5 text-gray-400 hover:text-gray-600 p-0.5 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="text-center mb-3">
                <img
                  src={selectedAd.image}
                  alt={selectedAd.company}
                  className="w-10 h-10 rounded-lg object-cover mx-auto mb-2"
                />
                <h2 className="text-sm font-semibold text-gray-900">{selectedAd.company}</h2>
                <p className="text-xs text-gray-600">{selectedAd.title}</p>
                <div className="flex items-center justify-center space-x-2 mt-1">
                  <div className="flex items-center">
                    <Star className="h-2.5 w-2.5 text-yellow-400 mr-0.5" />
                    <span className="text-xs font-medium">{selectedAd.rating}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-gray-600">{selectedAd.category}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-gray-700 text-center text-xs">{selectedAd.description}</p>

                <div className="flex items-center justify-center space-x-1 text-xs text-gray-600">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>{selectedAd.location}</span>
                </div>

                <div className="space-y-1.5">
                  <button
                    onClick={() => handleContactClick('phone', selectedAd.contact.phone)}
                    className="w-full flex items-center justify-center space-x-1.5 bg-green-500 text-white py-1.5 rounded-lg hover:bg-green-600 transition-colors text-xs"
                  >
                    <Phone className="h-2.5 w-2.5" />
                    <span>{selectedAd.contact.phone}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => handleContactClick('email', selectedAd.contact.email)}
                      className="flex items-center justify-center space-x-1 bg-blue-500 text-white py-1 rounded-lg hover:bg-blue-600 transition-colors text-xs"
                    >
                      <Mail className="h-2.5 w-2.5" />
                      <span>Email</span>
                    </button>

                    <button
                      onClick={() => handleContactClick('website', selectedAd.contact.website)}
                      className="flex items-center justify-center space-x-1 bg-gray-600 text-white py-1 rounded-lg hover:bg-gray-700 transition-colors text-xs"
                    >
                      <ExternalLink className="h-2.5 w-2.5" />
                      <span>Site</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AdvertisingSidebar