#!/bin/bash

# Script para corrigir formatação de datas em todos os arquivos TSX

echo "🔄 Iniciando correção de datas..."

# Lista de arquivos a serem corrigidos
files=(
  "src/components/AIChatbot.tsx"
  "src/components/alerts/AlertsList.tsx"
  "src/components/ChangeComparison.tsx"
  "src/components/Chat.tsx"
  "src/components/ContractDetailedModal.tsx"
  "src/components/ContractViewModal.tsx"
  "src/components/CustomerModal.tsx"
  "src/components/CustomerServiceHistory.tsx"
  "src/components/GlobalSearch.tsx"
  "src/components/GlobalSearchModal.tsx"
  "src/components/InlineEdit.tsx"
  "src/components/KPIDashboard.tsx"
  "src/components/MediaUploader.tsx"
  "src/components/NotificationCenter.tsx"
  "src/components/ProposalViewModal.tsx"
  "src/components/RouteManager.tsx"
  "src/components/ServiceOrderCostManager.tsx"
  "src/components/ServiceOrderDocuments.tsx"
  "src/components/ServiceOrderTeamManager.tsx"
  "src/components/ServiceOrderViewGiartech.tsx"
  "src/components/SignaturePad.tsx"
  "src/components/web/WebDashboard.tsx"
  "src/pages/AccessManagement.tsx"
  "src/pages/AdminAccessCodes.tsx"
  "src/pages/Calendar.tsx"
  "src/pages/ClientManagement.tsx"
  "src/pages/CustomerGamificationManager.tsx"
  "src/pages/DepartmentalDashboard.tsx"
  "src/pages/DigitalLibrary.tsx"
  "src/pages/Documents.tsx"
  "src/pages/DocumentTemplates.tsx"
  "src/pages/EmailInbox.tsx"
  "src/pages/FinancialIntegration.tsx"
  "src/pages/InventoryDetail.tsx"
  "src/pages/mobile/MobileAgenda.tsx"
  "src/pages/mobile/MobileLibrary.tsx"
  "src/pages/mobile/MobileOrders.tsx"
  "src/pages/mobile/MobilePurchases.tsx"
  "src/pages/mobile/MobileRoutes.tsx"
  "src/pages/OSDistribution.tsx"
  "src/pages/Projects.tsx"
  "src/pages/Purchasing.tsx"
  "src/pages/Reports.tsx"
  "src/pages/ServiceOrderCreate.tsx"
  "src/pages/ServiceOrderDetails.tsx"
  "src/pages/ServiceOrders.tsx"
  "src/pages/ServiceOrdersKanban.tsx"
  "src/pages/ServiceOrderView.tsx"
  "src/pages/UserInvitations.tsx"
  "src/pages/mobile/MobileHome.tsx"
  "src/pages/Chat.tsx"
)

count=0

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    # Verifica se o arquivo tem toLocaleDateString
    if grep -q "toLocaleDateString" "$file"; then
      echo "📝 Processando: $file"

      # Adiciona import se não existir
      if ! grep -q "import.*formatDateSafe.*from.*utils/format" "$file"; then
        # Encontra a última linha de import
        last_import=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)
        if [ -n "$last_import" ]; then
          sed -i "${last_import}a import { formatDateSafe } from '../utils/format'" "$file" 2>/dev/null || \
          sed -i "${last_import}a import { formatDateSafe } from '../../utils/format'" "$file" 2>/dev/null
        fi
      fi

      # Substitui new Date(...).toLocaleDateString('pt-BR') por formatDateSafe(...)
      sed -i "s/new Date(\([^)]*\))\.toLocaleDateString('pt-BR')/formatDateSafe(\1)/g" "$file"
      sed -i 's/new Date(\([^)]*\))\.toLocaleDateString("pt-BR")/formatDateSafe(\1)/g' "$file"

      count=$((count + 1))
    fi
  fi
done

echo "✅ $count arquivos corrigidos!"
echo "🎉 Formatação de datas sincronizada!"
