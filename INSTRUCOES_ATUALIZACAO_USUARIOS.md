# 🔄 Instruções de Atualização para Usuários

## ⚠️ IMPORTANTE: Sistema Atualizado para Versão 1.7.0

O sistema foi atualizado com novas funcionalidades e correções importantes. Para garantir que você veja as atualizações, siga as instruções abaixo:

---

## 📱 **Atualização AUTOMÁTICA (Recomendado)**

O sistema agora verifica automaticamente por atualizações a cada 5 minutos. Quando detectar uma nova versão:

1. Aparecerá um **alerta automático** informando sobre a atualização
2. Clique em **"OK"** para atualizar
3. A página será recarregada automaticamente com a nova versão

**Tempo de verificação:** O alerta pode aparecer em até 5 minutos após o deploy

---

## 🔄 **Atualização MANUAL (Se necessário)**

Se o sistema não atualizar automaticamente após 10 minutos, peça aos usuários para seguir estes passos:

### **MÉTODO 1: Atualização Forçada (Mais Simples)**

1. Abra o sistema no navegador
2. Pressione as seguintes teclas simultaneamente:
   - **Windows/Linux:** `Ctrl + Shift + R`
   - **Mac:** `Cmd + Shift + R`
3. A página será recarregada ignorando o cache

---

### **MÉTODO 2: Limpar Cache do Navegador**

#### **Google Chrome:**
1. Abra o sistema
2. Pressione `F12` (ou `Ctrl + Shift + I`)
3. Clique com o **botão direito** no ícone de **recarregar** (ao lado da barra de endereço)
4. Selecione **"Limpar cache e recarregar forçadamente"**

#### **Firefox:**
1. Abra o sistema
2. Pressione `Ctrl + Shift + Delete`
3. Selecione apenas **"Cache"**
4. Clique em **"Limpar agora"**
5. Recarregue a página com `F5`

#### **Safari:**
1. Abra o sistema
2. Menu **Safari** → **Preferências** → **Avançado**
3. Marque **"Mostrar menu Desenvolver"**
4. Menu **Desenvolver** → **Limpar caches**
5. Recarregue a página com `Cmd + R`

#### **Edge:**
1. Abra o sistema
2. Pressione `Ctrl + Shift + Delete`
3. Selecione apenas **"Imagens e arquivos em cache"**
4. Clique em **"Limpar agora"**
5. Recarregue a página com `F5`

---

## ✅ **Como Confirmar que Está Atualizado**

Após atualizar, verifique se você tem acesso a:

1. **Menu Lateral:**
   - ✅ Item "Fornecedores" deve aparecer (4ª posição)

2. **Página de Funcionários:**
   - ✅ Deve carregar sem tela branca
   - ✅ Deve exibir 5 funcionários de exemplo

3. **Modal de Fornecedores:**
   - ✅ Campo CNPJ deve ter lupa 🔍
   - ✅ Campo CEP deve ter lupa 🔍

4. **Página Financeira:**
   - ✅ Deve ter 8 filtros disponíveis
   - ✅ Paginação de 15 itens por página

---

## 📋 **Novidades da Versão 1.7.0**

### 🆕 **Novas Funcionalidades:**
- ✅ Busca automática por CNPJ com lupa (preenchimento automático)
- ✅ Busca automática por CEP com lupa (preenchimento automático)
- ✅ Aba "Fornecedores" adicionada ao menu
- ✅ Sistema de verificação automática de atualizações
- ✅ 8 filtros avançados na gestão financeira
- ✅ Paginação inteligente (15 itens por página)

### 🔧 **Correções:**
- ✅ Tela branca em Funcionários corrigida
- ✅ Trigger de capitalização de nomes corrigido
- ✅ 5 funcionários de exemplo adicionados
- ✅ Componente CEP com lupa funcional

---

## 🆘 **Suporte**

Se após seguir todas as instruções o sistema ainda não atualizar:

1. **Feche TODAS as abas** do sistema
2. **Feche o navegador completamente**
3. **Abra novamente** e acesse o sistema
4. Se o problema persistir, entre em contato com o suporte técnico

---

## 📞 **Informações Técnicas (Para Desenvolvedores)**

- **Versão Atual:** 1.7.0
- **Data de Build:** 2025-10-08T18:00:00.000Z
- **Verificação Automática:** A cada 5 minutos
- **Cache-Busting:** Implementado com `?t=timestamp`
- **LocalStorage Key:** `app_version`

---

**Sistema Atualizado com Sucesso!** ✅
