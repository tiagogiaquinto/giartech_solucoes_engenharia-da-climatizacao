# Guia de Implementação: Múltiplos Serviços em OS

## 📋 Resumo

Este guia explica como modificar a página de criação de Ordem de Serviço para permitir adicionar múltiplos serviços do catálogo, da mesma forma que já funciona com materiais.

---

## 🎯 Objetivo

Transformar isto:
```
❌ 1 serviço por OS (campo texto simples)
```

Em isto:
```
✅ Múltiplos serviços do catálogo
✅ Busca e seleção
✅ Quantidade ajustável
✅ Valor total calculado automaticamente
```

---

## 🗄️ Pré-requisitos

### 1. Execute o SQL primeiro

```sql
-- Já criado em: SQLS_SUPABASE.sql
-- Tabelas necessárias:
-- ✅ service_order_items
-- ✅ service_catalog
```

Se ainda não executou, execute:
```
1. Abra Supabase Dashboard
2. SQL Editor → New Query
3. Cole conteúdo de SQLS_SUPABASE.sql
4. Execute
```

---

## 📝 Modificações no Código

### Arquivo: `src/pages/ServiceOrderCreate.tsx`

#### Passo 1: Adicionar Estados (Linha ~24)

```typescript
// ADICIONAR após const [selectedService, setSelectedService] = useState<any>(null)
const [serviceSearch, setServiceSearch] = useState('')
const [serviceSuggestions, setServiceSuggestions] = useState<any[]>([])
const [showServiceSuggestions, setShowServiceSuggestions] = useState(false)
```

#### Passo 2: Modificar formData (Linha ~41)

```typescript
// SUBSTITUIR
const [formData, setFormData] = useState({
  client: { ... },
  service: '',  // ❌ REMOVER esta linha
  description: '',
  // ...
  materials: []
})

// POR
const [formData, setFormData] = useState({
  client: { ... },
  services: [] as Array<{  // ✅ ADICIONAR esta linha
    id: string
    name: string
    description: string
    quantity: number
    unit_price: number
    total_price: number
    estimated_duration: number
  }>,
  description: '',
  // ...
  materials: []
})
```

#### Passo 3: Adicionar useEffect para Busca (Linha ~65)

```typescript
// ADICIONAR após o useEffect de clientSearch
useEffect(() => {
  const timer = setTimeout(() => {
    if (serviceSearch.length >= 2) {
      searchServices(serviceSearch)
    } else {
      setServiceSuggestions([])
      setShowServiceSuggestions(false)
    }
  }, 300)

  return () => clearTimeout(timer)
}, [serviceSearch])
```

#### Passo 4: Adicionar Função de Busca (Linha ~82)

```typescript
// ADICIONAR após searchClients
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
```

#### Passo 5: Adicionar Funções de Gerenciamento (Linha ~200)

```typescript
// ADICIONAR próximo às funções de materiais
const handleAddService = (service: any) => {
  const existingService = formData.services.find(s => s.id === service.id)

  if (existingService) {
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

#### Passo 6: Adicionar UI (na seção return, após cliente)

Procure a seção que renderiza as informações do cliente e ADICIONE LOGO APÓS:

```tsx
{/* Seção de Serviços - ADICIONAR AQUI */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.2 }}
  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
>
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
      <Package className="h-5 w-5 text-blue-600" />
      Serviços
    </h3>
    <span className="text-sm text-gray-500">
      {formData.services.length} serviço(s)
    </span>
  </div>

  {/* Campo de Busca */}
  <div className="mb-4 relative">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        type="text"
        placeholder="Buscar serviços do catálogo..."
        value={serviceSearch}
        onChange={(e) => setServiceSearch(e.target.value)}
        onFocus={() => serviceSearch.length >= 2 && setShowServiceSuggestions(true)}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* Dropdown de Sugestões */}
    {showServiceSuggestions && serviceSuggestions.length > 0 && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
        {serviceSuggestions.map((service) => (
          <button
            key={service.id}
            onClick={() => handleAddService(service)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-0"
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

          {/* Controle de Quantidade */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUpdateServiceQuantity(service.id, service.quantity - 1)}
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
            >
              -
            </button>
            <input
              type="number"
              value={service.quantity}
              onChange={(e) => handleUpdateServiceQuantity(service.id, parseInt(e.target.value) || 0)}
              className="w-16 text-center px-2 py-1 border border-gray-300 rounded"
              min="1"
            />
            <button
              onClick={() => handleUpdateServiceQuantity(service.id, service.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center rounded bg-gray-200 hover:bg-gray-300"
            >
              +
            </button>
          </div>

          {/* Total do Serviço */}
          <div className="text-right min-w-[100px]">
            <div className="font-semibold text-gray-900">
              R$ {service.total_price.toFixed(2)}
            </div>
          </div>

          {/* Botão Remover */}
          <button
            onClick={() => handleRemoveService(service.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}

      {/* Card de Totais */}
      <div className="flex justify-end gap-8 pt-4 border-t border-gray-200 mt-4">
        <div className="text-right">
          <div className="text-sm text-gray-500">Duração Total</div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.floor(calculateTotalDuration() / 60)}h {calculateTotalDuration() % 60}min
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Valor Total dos Serviços</div>
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
</motion.div>
```

#### Passo 7: Atualizar handleSubmit

Procure a função `handleSubmit` e MODIFIQUE:

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
    // 1. Criar Ordem de Serviço
    const { data: orderData, error: orderError } = await supabase
      .from('service_orders')
      .insert({
        client_id: selectedClient.id,
        description: formData.description,
        priority: formData.priority,
        status: 'pending',
        due_date: formData.dueDate || null,
        assigned_to: formData.assignedTo || null,
        show_value: true,
        total_value: calculateTotalValue(),
        total_estimated_duration: calculateTotalDuration()
      })
      .select()
      .single()

    if (orderError) throw orderError

    // 2. Inserir Serviços
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

    // 3. Inserir Materiais (código existente)
    // ...

    alert('Ordem de serviço criada com sucesso!')
    navigate('/service-orders')
  } catch (error: any) {
    console.error('Error:', error)
    alert('Erro: ' + (error.message || 'Erro desconhecido'))
  }
}
```

---

## ✅ Checklist de Implementação

- [ ] Executei SQLS_SUPABASE.sql no Supabase
- [ ] Tabela `service_order_items` existe no banco
- [ ] Adicionei estados `serviceSearch`, `serviceSuggestions`, `showServiceSuggestions`
- [ ] Modifiquei `formData` para incluir array `services`
- [ ] Adicionei useEffect para busca de serviços
- [ ] Adicionei função `searchServices`
- [ ] Adicionei funções `handleAddService`, `handleRemoveService`, `handleUpdateServiceQuantity`
- [ ] Adicionei funções `calculateTotalValue`, `calculateTotalDuration`
- [ ] Adicionei UI completa de serviços
- [ ] Modifiquei `handleSubmit` para salvar em `service_order_items`
- [ ] Testei adicionar múltiplos serviços
- [ ] Testei ajustar quantidade
- [ ] Testei remover serviço
- [ ] Testei cálculo de totais
- [ ] Limpei cache do navegador (Ctrl+Shift+R)

---

## 🎯 Resultado Final

Após implementar, o usuário poderá:

1. ✅ Buscar serviços digitando nome
2. ✅ Ver lista de sugestões do catálogo
3. ✅ Clicar para adicionar serviço
4. ✅ Adicionar múltiplos serviços diferentes
5. ✅ Ajustar quantidade com +/- ou digitando
6. ✅ Ver preço unitário e total de cada serviço
7. ✅ Remover serviços individualment
8. ✅ Ver valor total calculado automaticamente
9. ✅ Ver duração total calculada automaticamente
10. ✅ Salvar tudo no banco corretamente

---

## 🐛 Troubleshooting

### Erro: "service_order_items does not exist"
**Solução:** Execute SQLS_SUPABASE.sql primeiro

### Serviços não aparecem na busca
**Solução:** Verifique se tem serviços cadastrados em `service_catalog` com `is_active = true`

### Totais não calculam
**Solução:** Verifique se as funções `calculateTotalValue` e `calculateTotalDuration` foram adicionadas

### UI não aparece
**Solução:** Verifique se adicionou o JSX no lugar correto (após seção de cliente)

---

## 📚 Referências

- Arquivo de patch: `PATCH_SERVICE_ORDER_MULTIPLE_SERVICES.md`
- SQL necessário: `SQLS_SUPABASE.sql`
- Documentação completa: `MELHORIAS_IMPLEMENTADAS_COMPLETAS.md`

---

**Tempo estimado de implementação:** 30-45 minutos
**Complexidade:** Média
**Impacto:** Alto (melhora significativa na criação de OS)
