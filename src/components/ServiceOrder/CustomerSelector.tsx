import React, { useState, useEffect } from 'react'
import { User, Search, Building2, Phone, Mail, MapPin, Plus } from 'lucide-react'

interface Customer {
  id: string
  nome_razao: string
  nome_fantasia?: string
  cnpj_cpf?: string
  email?: string
  telefone?: string
  cidade?: string
  estado?: string
}

interface CustomerSelectorProps {
  customers: Customer[]
  selectedCustomer: Customer | null
  onSelect: (customer: Customer | null) => void
  onAddNew?: () => void
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomer,
  onSelect,
  onAddNew
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const filteredCustomers = customers.filter(c =>
    c.nome_razao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cnpj_cpf?.includes(searchTerm) ||
    c.telefone?.includes(searchTerm)
  )

  useEffect(() => {
    if (selectedCustomer) {
      setSearchTerm(selectedCustomer.nome_razao)
      setShowDropdown(false)
    }
  }, [selectedCustomer])

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Cliente
        </h2>
        {onAddNew && (
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Novo Cliente
          </button>
        )}
      </div>

      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setShowDropdown(true)
              if (!e.target.value) onSelect(null)
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar cliente por nome, CPF/CNPJ ou telefone..."
          />
        </div>

        {showDropdown && filteredCustomers.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto">
            {filteredCustomers.slice(0, 10).map(customer => (
              <button
                key={customer.id}
                onClick={() => {
                  onSelect(customer)
                  setShowDropdown(false)
                }}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{customer.nome_razao}</p>
                    {customer.nome_fantasia && (
                      <p className="text-sm text-gray-600">{customer.nome_fantasia}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                      {customer.cnpj_cpf && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {customer.cnpj_cpf}
                        </span>
                      )}
                      {customer.telefone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.telefone}
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </span>
                      )}
                      {customer.cidade && customer.estado && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.cidade}/{customer.estado}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedCustomer && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{selectedCustomer.nome_razao}</p>
              {selectedCustomer.nome_fantasia && (
                <p className="text-sm text-gray-600">{selectedCustomer.nome_fantasia}</p>
              )}
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                {selectedCustomer.cnpj_cpf && (
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {selectedCustomer.cnpj_cpf}
                  </p>
                )}
                {selectedCustomer.telefone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedCustomer.telefone}
                  </p>
                )}
                {selectedCustomer.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {selectedCustomer.email}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                onSelect(null)
                setSearchTerm('')
              }}
              className="text-gray-400 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
