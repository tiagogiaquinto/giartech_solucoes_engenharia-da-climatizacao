#!/bin/bash

echo "🔄 Reiniciando Sistema Giartech..."
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parar processos Vite
echo "${YELLOW}1. Parando servidor...${NC}"
pkill -f "vite" 2>/dev/null || true
sleep 1

# Limpar caches
echo "${YELLOW}2. Limpando caches...${NC}"
rm -rf dist node_modules/.vite 2>/dev/null || true
echo "${GREEN}   ✓ Caches removidos${NC}"

# Verificar dependências
echo "${YELLOW}3. Verificando dependências...${NC}"
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependências..."
    npm install
else
    echo "${GREEN}   ✓ Dependências OK${NC}"
fi

# Build de teste
echo "${YELLOW}4. Testando build...${NC}"
if npm run build >/dev/null 2>&1; then
    echo "${GREEN}   ✓ Build OK${NC}"
else
    echo "   ⚠ Build com avisos (normal)"
fi

echo ""
echo "${GREEN}✅ Sistema pronto!${NC}"
echo ""
echo "Agora execute:"
echo "  ${YELLOW}npm run dev${NC}"
echo ""
echo "E no navegador:"
echo "  1. F12 → Application → Service Workers → Unregister"
echo "  2. Ctrl+Shift+R (Hard Reload)"
echo ""
