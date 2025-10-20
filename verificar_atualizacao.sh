#!/bin/bash

echo "=================================="
echo "VERIFICAÇÃO DA ATUALIZAÇÃO v1.6.0"
echo "=================================="
echo ""

echo "✓ Verificando arquivos de páginas..."
if [ -f "src/pages/ProposalCreate.tsx" ]; then
    echo "  ✅ ProposalCreate.tsx existe ($(wc -l < src/pages/ProposalCreate.tsx) linhas)"
else
    echo "  ❌ ProposalCreate.tsx NÃO ENCONTRADO"
fi

if [ -f "src/pages/ProposalList.tsx" ]; then
    echo "  ✅ ProposalList.tsx existe ($(wc -l < src/pages/ProposalList.tsx) linhas)"
else
    echo "  ❌ ProposalList.tsx NÃO ENCONTRADO"
fi

echo ""
echo "✓ Verificando componentes..."
if [ -f "src/components/MultipleServiceSelector.tsx" ]; then
    echo "  ✅ MultipleServiceSelector.tsx existe"
else
    echo "  ❌ MultipleServiceSelector.tsx NÃO ENCONTRADO"
fi

if [ -f "src/components/MultipleMaterialSelector.tsx" ]; then
    echo "  ✅ MultipleMaterialSelector.tsx existe"
else
    echo "  ❌ MultipleMaterialSelector.tsx NÃO ENCONTRADO"
fi

echo ""
echo "✓ Verificando gerador de PDF..."
if [ -f "src/utils/generateProfessionalProposal.ts" ]; then
    echo "  ✅ generateProfessionalProposal.ts existe ($(wc -l < src/utils/generateProfessionalProposal.ts) linhas)"
else
    echo "  ❌ generateProfessionalProposal.ts NÃO ENCONTRADO"
fi

echo ""
echo "✓ Verificando rotas no App.tsx..."
if grep -q "ProposalCreate" src/App.tsx; then
    echo "  ✅ ProposalCreate importado no App.tsx"
else
    echo "  ❌ ProposalCreate NÃO importado no App.tsx"
fi

if grep -q "/proposals" src/App.tsx; then
    echo "  ✅ Rota /proposals encontrada no App.tsx"
else
    echo "  ❌ Rota /proposals NÃO encontrada no App.tsx"
fi

echo ""
echo "✓ Verificando menu no Sidebar..."
if grep -q "proposals" src/components/navigation/Sidebar.tsx; then
    echo "  ✅ Item 'proposals' encontrado no Sidebar"
else
    echo "  ❌ Item 'proposals' NÃO encontrado no Sidebar"
fi

if grep -q "FileText" src/components/navigation/Sidebar.tsx; then
    echo "  ✅ Ícone FileText importado no Sidebar"
else
    echo "  ❌ Ícone FileText NÃO importado no Sidebar"
fi

echo ""
echo "✓ Verificando build..."
if [ -d "dist/assets" ]; then
    echo "  ✅ Pasta dist/assets existe"
    MAIN_JS=$(ls dist/assets/index.*.js 2>/dev/null | head -1)
    if [ -n "$MAIN_JS" ]; then
        echo "  ✅ Arquivo JS principal: $(basename $MAIN_JS)"
        if grep -q "proposals" "$MAIN_JS"; then
            echo "  ✅ Código de 'proposals' encontrado no build"
        else
            echo "  ⚠️  Código de 'proposals' NÃO encontrado no build"
        fi
    fi
else
    echo "  ❌ Pasta dist/assets NÃO existe - Execute 'npm run build'"
fi

echo ""
echo "✓ Verificando version.json..."
if [ -f "dist/version.json" ]; then
    echo "  ✅ version.json existe no dist"
    cat dist/version.json | grep version
else
    echo "  ❌ version.json NÃO encontrado no dist"
fi

echo ""
echo "✓ Verificando package.json..."
VERSION=$(grep '"version"' package.json | head -1 | cut -d'"' -f4)
echo "  Versão no package.json: $VERSION"

echo ""
echo "✓ Verificando index.html..."
if [ -f "dist/index.html" ]; then
    APP_VERSION=$(grep 'app-version' dist/index.html | cut -d'"' -f4)
    echo "  Versão no index.html: $APP_VERSION"
else
    echo "  ❌ dist/index.html NÃO encontrado"
fi

echo ""
echo "=================================="
echo "VERIFICAÇÃO CONCLUÍDA"
echo "=================================="
echo ""
echo "Se todos os itens mostrarem ✅, a atualização está completa."
echo "O problema é o CACHE DO NAVEGADOR."
echo ""
echo "SOLUÇÕES:"
echo "1. Pressione CTRL + SHIFT + DELETE"
echo "2. Limpe TODO o cache"
echo "3. Feche o navegador COMPLETAMENTE"
echo "4. Reabra e pressione CTRL + SHIFT + R"
echo ""
echo "OU acesse: /ATUALIZAR_CACHE.html"
