# 📦 COMO INSTALAR O GIARTECH NO SEU COMPUTADOR

**Guia Completo e Simples**

---

## 🎯 **DUAS OPÇÕES:**

1. **OPÇÃO A:** Gerar o instalador você mesmo (requer Node.js)
2. **OPÇÃO B:** Receber o instalador pronto

---

# 📌 **OPÇÃO A - GERAR O INSTALADOR**

## **PASSO 1: Instalar Node.js**

### **Windows:**

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (recomendada)
3. Execute o instalador
4. Clique "Next" em todas as etapas
5. Clique "Install"
6. Aguarde a instalação
7. Clique "Finish"

**Verificar instalação:**
1. Abra o "Prompt de Comando" (Win + R → digite `cmd` → Enter)
2. Digite: `node --version`
3. Deve aparecer algo como: `v20.10.0`

---

## **PASSO 2: Preparar o Projeto**

1. **Abra o Prompt de Comando** (ou PowerShell ou Terminal)
2. **Navegue até a pasta do projeto:**
   ```bash
   cd C:\caminho\para\giartech-desktop
   ```

   **Dica:** Você pode arrastar a pasta para o terminal!

3. **Instalar dependências:**
   ```bash
   npm install
   ```

   **Aguarde:** Isso pode levar 5-10 minutos na primeira vez.

   **Você verá:** Centenas de pacotes sendo baixados.

---

## **PASSO 3: Gerar o Instalador**

### **Para Windows:**

```bash
npm run build:win
```

**Aguarde:** 2-5 minutos
**Você verá:** Mensagens de compilação

**Quando terminar:**
```
✓ built in 11.50s
  • electron-builder  version=26.0.12
  • loaded configuration  file=package.json
  • building        target=nsis arch=x64
  • packaging       platform=win32 arch=x64
  • building block map  blockMapFile=Giartech-Setup-1.0.0.exe.blockmap
  • building        NSIS installer file=Giartech-Setup-1.0.0.exe
```

**Instalador gerado em:**
```
release/Giartech-Setup-1.0.0.exe  (~150 MB)
```

---

### **Para Mac:**

```bash
npm run build:mac
```

**Instalador gerado em:**
```
release/Giartech-1.0.0.dmg  (~150 MB)
```

---

### **Para Linux:**

```bash
npm run build:linux
```

**Instaladores gerados em:**
```
release/Giartech-1.0.0.AppImage  (~150 MB)
release/giartech_1.0.0_amd64.deb (~150 MB)
```

---

## **PASSO 4: Instalar no Computador**

### **Windows:**

1. Vá para a pasta `release/`
2. Clique duplo em `Giartech-Setup-1.0.0.exe`
3. Se aparecer aviso do Windows Defender:
   - Clique "Mais informações"
   - Clique "Executar assim mesmo"
4. **Tela do Instalador:**
   - Escolha o idioma (Português)
   - Clique "Avançar"
   - Leia o contrato
   - Escolha a pasta de instalação (padrão: `C:\Program Files\Giartech`)
   - Marque as opções:
     - ✅ Criar atalho na área de trabalho
     - ✅ Criar atalho no Menu Iniciar
   - Clique "Instalar"
   - Aguarde a instalação
   - Clique "Concluir"

**Pronto!** Ícone na área de trabalho e Menu Iniciar.

---

### **Mac:**

1. Vá para a pasta `release/`
2. Clique duplo em `Giartech-1.0.0.dmg`
3. Arraste o ícone do Giartech para a pasta Applications
4. Abra o Launchpad ou pasta Applications
5. Clique em Giartech

**Pronto!**

---

### **Linux (AppImage):**

```bash
cd release
chmod +x Giartech-1.0.0.AppImage
./Giartech-1.0.0.AppImage
```

### **Linux (DEB):**

```bash
cd release
sudo dpkg -i giartech_1.0.0_amd64.deb
```

**Pronto!** Procure "Giartech" no menu de aplicativos.

---

# 📌 **OPÇÃO B - RECEBER INSTALADOR PRONTO**

Se alguém já gerou o instalador para você:

## **Windows:**

1. **Receba o arquivo:** `Giartech-Setup-1.0.0.exe`
2. **Salve** em uma pasta (ex: Downloads)
3. **Clique duplo** no arquivo
4. Se aparecer aviso do Windows:
   - Clique "Mais informações"
   - Clique "Executar assim mesmo"
5. **Siga o instalador:**
   - Clique "Avançar"
   - Escolha a pasta (padrão OK)
   - Marque "Criar atalhos"
   - Clique "Instalar"
   - Aguarde
   - Clique "Concluir"

**Pronto!** Ícone na área de trabalho.

---

## **Mac:**

1. **Receba o arquivo:** `Giartech-1.0.0.dmg`
2. **Clique duplo** no arquivo
3. **Arraste** o ícone para Applications
4. **Abra** Applications e clique em Giartech

**Pronto!**

---

## **Linux:**

### **AppImage (universal):**
```bash
chmod +x Giartech-1.0.0.AppImage
./Giartech-1.0.0.AppImage
```

### **DEB (Ubuntu/Debian):**
```bash
sudo dpkg -i giartech_1.0.0_amd64.deb
```

**Pronto!**

---

# 🚀 **USANDO O SISTEMA**

## **Abrir o Giartech:**

### **Windows:**
- Clique duplo no ícone da área de trabalho, ou
- Menu Iniciar → Giartech

### **Mac:**
- Applications → Giartech

### **Linux:**
- Menu de aplicativos → Giartech

---

## **Primeira Execução:**

1. **Sistema abre** em uma janela
2. **Tela de Login** aparece
3. **Faça login** com suas credenciais
4. **Sistema carrega**
5. **Pronto para usar!**

---

# ⚠️ **PROBLEMAS COMUNS**

## **Windows Defender bloqueia:**

**Solução:**
1. Clique "Mais informações"
2. Clique "Executar assim mesmo"

**Por que acontece?**
O instalador não está assinado digitalmente. Isso é normal para software interno.

---

## **"Não é possível abrir porque é de um desenvolvedor não identificado" (Mac):**

**Solução:**
1. Vá em Preferências do Sistema → Segurança e Privacidade
2. Clique "Abrir assim mesmo"

---

## **Erro "VCRUNTIME140.dll não encontrado" (Windows):**

**Solução:**
Instale o Visual C++ Redistributable:
1. Acesse: https://aka.ms/vs/17/release/vc_redist.x64.exe
2. Execute o instalador
3. Tente abrir o Giartech novamente

---

## **Sistema não abre / tela branca:**

**Solução:**
1. Feche o programa
2. Abra novamente
3. Se persistir, reinstale

---

## **Erro de conexão:**

**Causa:** Sem internet ou firewall bloqueando

**Solução:**
1. Verifique sua conexão com a internet
2. Temporariamente desabilite o firewall
3. Adicione exceção para o Giartech no firewall

---

# 🔄 **ATUALIZAÇÃO**

## **Como atualizar para uma nova versão:**

1. **Desinstale** a versão antiga:
   - Windows: Painel de Controle → Programas → Desinstalar
   - Mac: Mova da pasta Applications para a Lixeira
   - Linux: `sudo dpkg -r giartech`

2. **Instale** a nova versão seguindo os passos acima

3. **Seus dados não são perdidos!** Eles estão no banco de dados (Supabase)

---

# 📊 **REQUISITOS DO SISTEMA**

## **Mínimo:**
- **SO:** Windows 10 / macOS 10.13 / Ubuntu 18.04
- **RAM:** 4 GB
- **Disco:** 500 MB livres
- **Internet:** Conexão ativa (para acessar o banco de dados)

## **Recomendado:**
- **SO:** Windows 11 / macOS 12+ / Ubuntu 22.04
- **RAM:** 8 GB
- **Disco:** 1 GB livres
- **Internet:** Banda larga

---

# 📞 **SUPORTE**

## **Precisa de ajuda?**

1. **Verifique esta documentação** primeiro
2. **Verifique** se tem internet
3. **Reinicie** o computador
4. **Reinstale** o programa

---

# ✅ **RESUMO RÁPIDO**

## **Para instalar pela primeira vez:**

### **Se você tem o código-fonte:**
```bash
cd giartech-desktop
npm install
npm run build:win
```
→ Instalador em `release/`

### **Se você tem o instalador:**
1. Clique duplo
2. Seguir assistente
3. Pronto!

---

## **Depois de instalado:**

1. **Abrir:** Ícone na área de trabalho
2. **Fazer login** com suas credenciais
3. **Usar** o sistema normalmente

---

# 🎉 **PRONTO!**

O Giartech está instalado e funcionando no seu computador!

**Parece um programa normal**, mas usa o poder da nuvem (Supabase) para armazenar os dados.

**Vantagens:**
✅ Acesso rápido (ícone na área de trabalho)
✅ Performance otimizada
✅ Funciona como software nativo
✅ Dados seguros na nuvem
✅ Atualizações fáceis

---

**Dúvidas?** Consulte os outros arquivos de documentação:
- `INSTALACAO_DESKTOP.md` - Informações técnicas
- `README.md` - Informações gerais do sistema

**Aproveite o Giartech! 🚀**
