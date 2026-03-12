# Como Testar o Giartech em Dispositivos Móveis

## Instalação de Dependências

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build para Produção

```bash
npm run build
npm run preview
```

## Testando em Dispositivos Reais

### 1. Via Rede Local

#### Passo 1: Obter seu IP Local

**Windows:**
```bash
ipconfig
```
Procure por "IPv4 Address" na interface WiFi

**Mac/Linux:**
```bash
ifconfig | grep "inet "
```

#### Passo 2: Iniciar o servidor

```bash
npm run dev -- --host
```

O Vite exibirá:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

#### Passo 3: Acessar do celular

No navegador do celular, digite o endereço Network (exemplo: `http://192.168.1.100:5173/`)

**Importante:** O celular precisa estar na mesma rede WiFi que o computador.

### 2. Via Túnel Público (ngrok, localtunnel, etc)

#### Usando ngrok:

```bash
# Instalar ngrok
npm install -g ngrok

# Em um terminal, iniciar o dev server
npm run dev

# Em outro terminal, criar o túnel
ngrok http 5173
```

Acesse a URL pública gerada (exemplo: `https://abc123.ngrok.io`)

## Instalando como PWA

### Android (Chrome)

1. Abra o site no Chrome
2. Toque no menu (⋮) no canto superior direito
3. Selecione "Instalar app" ou "Adicionar à tela inicial"
4. Confirme a instalação
5. O ícone aparecerá na tela inicial

### iOS (Safari)

1. Abra o site no Safari
2. Toque no botão de compartilhar (quadrado com seta para cima)
3. Role para baixo e selecione "Adicionar à Tela de Início"
4. Edite o nome se desejar
5. Toque em "Adicionar"
6. O ícone aparecerá na tela inicial

## Problemas Comuns

### App não carrega no celular

- Verifique se ambos estão na mesma rede WiFi
- Desative firewall/antivírus temporariamente
- Use `--host 0.0.0.0` ao iniciar o dev server

### Service Worker não registra

- Em desenvolvimento, o SW está desabilitado por padrão
- Para testar PWA, use `npm run build && npm run preview`

### Layout quebrado no mobile

- Limpe o cache do navegador
- Force refresh (Ctrl+Shift+R)
- Verifique se todas as dependências estão instaladas
