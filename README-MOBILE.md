# Giartech Mobile - Guia de Otimização PWA

## Funcionalidades Mobile Implementadas

### 1. Progressive Web App (PWA)
- **Manifest configurado** (`/public/manifest.json`)
- **Service Worker** para cache offline
- **Instalável** como app nativo em Android e iOS

### 2. Layout Mobile Otimizado
- **Navegação inferior** com tabs para acesso rápido
- **Header compacto** com botão de ação flutuante
- **Cards touch-friendly** com feedback visual
- **Bottom sheets** para modais em mobile

### 3. Gestos e Interações
- **Swipe cards** - Deslize para ações rápidas
- **Pull to refresh** - Puxe para atualizar dados
- **Touch targets grandes** (mínimo 44x44px)
- **Feedback háptico visual** em cliques

### 4. Componentes Mobile

#### `MobileLayout`
Layout principal com navegação inferior e header:
```tsx
import MobileLayout from '@/components/mobile/MobileLayout';

<MobileLayout>
  <YourContent />
</MobileLayout>
```

#### `MobileServiceOrderCard`
Card otimizado para OS em mobile:
```tsx
import MobileServiceOrderCard from '@/components/mobile/MobileServiceOrderCard';

<MobileServiceOrderCard
  order={order}
  onClick={() => navigate(`/os/${order.id}`)}
/>
```

#### `SwipeableCard`
Card com gestos de swipe:
```tsx
import SwipeableCard from '@/components/mobile/SwipeableCard';

<SwipeableCard
  onSwipeLeft={() => deleteItem()}
  onSwipeRight={() => markAsComplete()}
  leftAction={<Trash />}
  rightAction={<Check />}
>
  <CardContent />
</SwipeableCard>
```

#### `PullToRefresh`
Componente de pull-to-refresh:
```tsx
import PullToRefresh from '@/components/mobile/PullToRefresh';

<PullToRefresh onRefresh={async () => await fetchData()}>
  <YourList />
</PullToRefresh>
```

#### `ResponsiveWrapper`
Wrapper que alterna entre layout mobile e desktop:
```tsx
import ResponsiveWrapper from '@/components/ResponsiveWrapper';

<ResponsiveWrapper desktopSidebar={<Sidebar />}>
  <MainContent />
</ResponsiveWrapper>
```

### 5. Hooks Personalizados

#### `useMobileDetect`
Detecta o tipo de dispositivo:
```tsx
import { useMobileDetect } from '@/hooks/useMobileDetect';

const { isMobile, isTablet, isDesktop } = useMobileDetect();
```

#### `useIsPWA`
Verifica se está rodando como PWA:
```tsx
import { useIsPWA } from '@/hooks/useMobileDetect';

const isPWA = useIsPWA();
```

### 6. Estilos CSS Mobile

Arquivo `src/styles/mobile.css` com:
- Touch targets aumentados
- Feedback de toque
- Safe areas para devices com notch
- Skeleton loaders
- Animações otimizadas

### 7. Meta Tags e Configurações

#### index.html
- Viewport otimizado
- Theme color
- Apple touch icons
- Prevenção de zoom em inputs

#### vite.config.ts
- Plugin PWA configurado
- Cache strategy para Supabase
- Code splitting otimizado

## Como Instalar como App

### Android
1. Abra o site no Chrome
2. Toque no menu (⋮)
3. Selecione "Instalar app" ou "Adicionar à tela inicial"

### iOS
1. Abra o site no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"

## Funcionalidades Offline

O app funciona offline com:
- Cache de assets estáticos
- Cache de requisições Supabase (24h)
- Sincronização automática quando voltar online

## Performance Mobile

- **Code splitting** por vendor
- **Lazy loading** de componentes
- **Image optimization**
- **Touch events otimizados**

## Próximas Melhorias

- [ ] Notificações push
- [ ] Sincronização em background
- [ ] Modo escuro
- [ ] Biometria para login
- [ ] Share API para compartilhar OS
- [ ] Câmera para anexar fotos
- [ ] Geolocalização para check-in

## Testando

```bash
# Desenvolvimento com PWA ativo
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## Dicas de UX Mobile

1. **Sempre use feedback visual** em ações
2. **Evite hover states** (não funcionam em touch)
3. **Use bottom sheets** ao invés de modais
4. **Mantenha navegação acessível** com thumb zone
5. **Teste em devices reais** sempre que possível
