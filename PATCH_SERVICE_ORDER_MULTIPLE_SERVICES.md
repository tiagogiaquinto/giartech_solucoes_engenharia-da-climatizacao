# Patch: Múltiplos Serviços em Ordem de Serviço

## Alterações Necessárias em `ServiceOrderCreate.tsx`

### 1. Adicionar Estado para Serviços

```typescript
// Linha ~41 - Alterar formData
const [formData, setFormData] = useState({
  client: {
    name: '',
    phone: '',
    address: ''
  },
  services: [] as Array<{
    id: string,
    name: string,
    description: string,
    quantity: number,
    unit_price: number,
    total_price: number,
    estimated_duration: number
  }>,
  description: '',
  priority: 'medium',
  assignedTo: '',
  dueDate: '',
  materials: [] as Array<{id: number, name: string, quantity: number}>
})

// Adicionar estados para busca de serviços
const [serviceSearch, setServiceSearch] = useState('')
const [serviceSuggestions, setServiceSuggestions] = useState<any[]>([])
const [showServiceSuggestions, setShowServiceSuggestions] = useState(false)
```

### 2. Adicionar Função de Busca de Serviços

```typescript
// Adicionar após searchClients
const searchServices = async (term: string) => {
  try {
    const { data, error } = await supabase
      .from('service_catalog')
      .select('*')
      .ilike('name', `%${term}%`)
      .eq('is_active', true)
      .limit(10)

    if (error) throw error
    setServiceSuggestions(data || [])
    setShowServiceSuggestions(true)
  } catch (err) {
    console.error('Error searching services:', err)
  }
}

// useEffect para busca de serviços
useEffect(() => {
  const timer = setTimeout(() => {
    if (serviceSearch.length >= 2) {
      searchServices(serviceSearch)
    } else {
      setServiceSuggestions([])
    }
  }, 300)

  return () => clearTimeout(timer)
}, [serviceSearch])
```

### 3. Funções para Gerenciar Serviços

```typescript
const handleAddService = (service: any) => {
  const existingService = formData.services.find(s => s.id === service.id)

  if (existingService) {
    // Incrementa quantidade
    setFormData({
      ...formData,
      services: formData.services.map(s =>
        s.id === service.id
          ? {
              ...s,
              quantity: s.quantity + 1,
              total_price: (s.quantity + 1) * s.unit_price
            }
          : s
      )
    })
  } else {
    // Adiciona novo serviço
    setFormData({
      ...formData,
      services: [
        ...formData.services,
        {
          id: service.id,
          name: service.name,
          description: service.description || '',
          quantity: 1,
          unit_price: service.base_price || 0,
          total_price: service.base_price || 0,
          estimated_duration: service.estimated_duration || 0
        }
      ]
    })
  }

  setServiceSearch('')
  setShowServiceSuggestions(false)
}

const handleRemoveService = (id: string) => {
  setFormData({
    ...formData,
    services: formData.services.filter(s => s.id !== id)
  })
}

const handleUpdateServiceQuantity = (id: string, quantity: number) => {
  if (quantity <= 0) {
    handleRemoveService(id)
    return
  }

  setFormData({
    ...formData,
    services: formData.services.map(s =>
      s.id === id
        ? {
            ...s,
            quantity,
            total_price: quantity * s.unit_price
          }
        : s
    )
  })
}

const calculateTotalValue = () => {
  return formData.services.reduce((sum, service) => sum + service.total_price, 0)
}

const calculateTotalDuration = () => {
  return formData.services.reduce((sum, service) =>
    sum + (service.estimated_duration * service.quantity), 0
  )
}
```

### 4. Adicionar UI para Serviços (Após Cliente, Antes de Materiais)

```typescript
{/* Seção de Serviços */}
<div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
      <Package className="h-5 w-5 text-blue-600" />
      Serviços
    </h3>
    <span className="text-sm text-gray-500">
      {formData.services.length} serviço(s) adicionado(s)
    </span>
  </div>

  {/* Busca de Serviços */}
  <div className="mb-4 relative">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type="text"
        placeholder="Buscar serviços do catálogo..."
        value={serviceSearch}
        onChange={(e) => setServiceSearch(e.target.value)}
        onFocus={() => serviceSearch.length >= 2 && setShowServiceSuggestions(true)}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    {/* Sugestões de Serviços */}
    {showServiceSuggestions && serviceSuggestions.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {serviceSuggestions.map((service) => (
          <button
            key={service.id}
            onClick={() => handleAddService(service)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
          >
            <div className="flex-1">
              <div className="font-medium text-gray-900">{service.name}</div>
              <div className="text-sm text-gray-500">{service.category}</div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-blue-600">
                R$ {(service.base_price || 0).toFixed(2)}
              </div>
              {service.estimated_duration && (
                <div className="text-xs text-gray-500">
                  {service.estimated_duration} min
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    )}
  </div>

  {/* Lista de Serviços Adicionados */}
  {formData.services.length > 0 ? (
    <div className="space-y-3">
      {formData.services.map((service) => (
        <div
          key={service.id}
          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
        >
          <div className="flex-1">
            <div className="font-medium text-gray-900">{service.name}</div>
            {service.description && (
              <div className="text-sm text-gray-500 mt-1">{service.description}</div>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm">
              <span className="text-gray-600">
                R$ {service.unit_price.toFixed(2)} /un
              </span>
              {service.estimated_duration > 0 && (
                <span className="text-gray-600">
                  {service.estimated_duration} min
                </span>
              )}
            </div>
          </div>

          {/* Quantidade */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateServiceQuantity(service.id, service.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              -
            </button>
            <input
              type="number"
              value={service.quantity}
              onChange={(e) => handleUpdateServiceQuantity(service.id, parseInt(e.target.value) || 0)}
              className="w-16 text-center px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              min="1"
            />
            <button
              onClick={() => handleUpdateServiceQuantity(service.id, service.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              +
            </button>
          </div>

          {/* Total */}
          <div className="text-right min-w-[100px]">
            <div className="font-semibold text-gray-900">
              R$ {service.total_price.toFixed(2)}
            </div>
          </div>

          {/* Remover */}
          <button
            onClick={() => handleRemoveService(service.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      {/* Totais */}
      <div className="flex justify-end gap-8 pt-4 border-t border-gray-200 mt-4">
        <div className="text-right">
          <div className="text-sm text-gray-500">Duração Total</div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.floor(calculateTotalDuration() / 60)}h {calculateTotalDuration() % 60}min
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Valor Total</div>
          <div className="text-xl font-bold text-blue-600">
            R$ {calculateTotalValue().toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="text-center py-8 text-gray-500">
      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
      <p>Nenhum serviço adicionado</p>
      <p className="text-sm">Busque e adicione serviços do catálogo acima</p>
    </div>
  )}
</div>
```

### 5. Atualizar Função de Salvar

```typescript
const handleSubmit = async () => {
  // Validações
  if (!selectedClient) {
    alert('Selecione um cliente')
    return
  }

  if (formData.services.length === 0) {
    alert('Adicione pelo menos um serviço')
    return
  }

  try {
    // 1. Criar a Ordem de Serviço
    const { data: orderData, error: orderError } = await supabase
      .from('service_orders')
      .insert({
        client_id: selectedClient.id,
        description: formData.description,
        priority: formData.priority,
        status: 'pending',
        due_date: formData.dueDate || null,
        assigned_to: formData.assignedTo || null,
        show_value: true, // ou conforme necessário
        total_value: calculateTotalValue(),
        total_estimated_duration: calculateTotalDuration()
      })
      .select()
      .single()

    if (orderError) throw orderError

    // 2. Inserir os Serviços
    const serviceItems = formData.services.map(service => ({
      service_order_id: orderData.id,
      service_catalog_id: service.id,
      quantity: service.quantity,
      unit_price: service.unit_price,
      total_price: service.total_price,
      estimated_duration: service.estimated_duration
    }))

    const { error: itemsError } = await supabase
      .from('service_order_items')
      .insert(serviceItems)

    if (itemsError) throw itemsError

    // 3. Inserir Materiais (se houver)
    if (formData.materials.length > 0) {
      // Lógica existente de materiais...
    }

    alert('Ordem de serviço criada com sucesso!')
    navigate('/service-orders')
  } catch (error: any) {
    console.error('Error creating service order:', error)
    alert('Erro ao criar ordem de serviço: ' + (error.message || 'Erro desconhecido'))
  }
}
```

## Resumo das Alterações

1. ✅ Estado `services` array adicionado ao formData
2. ✅ Funções de busca de serviços do catálogo
3. ✅ Funções para adicionar/remover/atualizar quantidade
4. ✅ UI completa com busca, lista e totais
5. ✅ Cálculo automático de valor e duração
6. ✅ Salvamento no banco usando `service_order_items`

## Como Aplicar

1. Abra `src/pages/ServiceOrderCreate.tsx`
2. Aplique as alterações em ordem
3. Teste adicionando múltiplos serviços
4. Verifique cálculos de total e duração

## Resultado Final

Usuário poderá:
- ✅ Buscar serviços do catálogo
- ✅ Adicionar múltiplos serviços diferentes
- ✅ Ajustar quantidade de cada serviço
- ✅ Ver valor total e duração total calculados automaticamente
- ✅ Remover serviços individualmente
- ✅ Salvar tudo no banco corretamente
