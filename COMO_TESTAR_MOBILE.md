# 🚀 Como Testar o Sistema Mobile no Celular

## 📱 **3 OPÇÕES PARA TESTE:**

---

## **OPÇÃO 1: Teste Local (Mais Rápido)** ⚡

### **Passo 1: Encontre o IP do seu computador**

**Windows:**
```bash
ipconfig
# Procure por "IPv4 Address" (ex: 192.168.1.100)
```

**Mac/Linux:**
```bash
ifconfig | grep inet
# ou
ip addr show
# Procure pelo IP local (ex: 192.168.1.100)
```

### **Passo 2: Iniciar o servidor de desenvolvimento**

```bash
npm run dev -- --host
```

O terminal vai mostrar algo como:
```
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.100:5173/
```

### **Passo 3: Acessar no celular**

1. **Conecte seu celular na MESMA rede Wi-Fi do computador**
2. **Abra o navegador do celular**
3. **Digite o endereço Network** (exemplo):
   ```
   http://192.168.1.100:5173/mobile/login
   ```

✅ **Pronto!** Você já pode testar!

---

## **OPÇÃO 2: Deploy na Vercel (Recomendado)** 🌐

### **Passo 1: Instalar Vercel CLI**

```bash
npm install -g vercel
```

### **Passo 2: Fazer login**

```bash
vercel login
```

### **Passo 3: Deploy**

```bash
vercel --prod
```

### **Passo 4: Acessar**

A Vercel vai gerar um link como:
```
https://giartech-mobile.vercel.app
```

**Acesse no celular:**
```
https://giartech-mobile.vercel.app/mobile/login
```

---

## **OPÇÃO 3: Deploy na Netlify** 🦊

### **Passo 1: Instalar Netlify CLI**

```bash
npm install -g netlify-cli
```

### **Passo 2: Fazer login**

```bash
netlify login
```

### **Passo 3: Deploy**

```bash
netlify deploy --prod --dir=dist
```

### **Passo 4: Acessar**

A Netlify vai gerar um link como:
```
https://giartech-mobile.netlify.app
```

**Acesse no celular:**
```
https://giartech-mobile.netlify.app/mobile/login
```

---

## 📲 **ROTAS MOBILE DISPONÍVEIS:**

Após fazer login, você pode testar todas as rotas:

```
/mobile/login          → Tela de Login (Splash + Form)
/mobile                → Homepage (Dashboard)
/mobile/agenda         → Agenda do Técnico
/mobile/orders         → Lista de OS
/mobile/purchases      → Solicitações de Compra
/mobile/routes         → Rastreamento de Rotas
/mobile/profile        → Perfil do Usuário
```

---

## 🔐 **CREDENCIAIS DE TESTE:**

Para testar o login, você precisa de um usuário cadastrado no banco.

### **Criar usuário de teste (executar no Supabase SQL Editor):**

```sql
-- 1. Criar perfil de usuário
INSERT INTO user_profiles (user_id, email, name, role, active)
VALUES (
  gen_random_uuid(),
  'tecnico@giartech.com',
  'João Técnico',
  'technician',
  true
);

-- 2. Criar funcionário vinculado
INSERT INTO employees (
  user_id,
  full_name,
  email,
  role,
  active
)
SELECT
  user_id,
  'João Técnico',
  'tecnico@giartech.com',
  'technician',
  true
FROM user_profiles
WHERE email = 'tecnico@giartech.com';
```

**Login:**
- Email: `tecnico@giartech.com`
- Senha: (qualquer valor no modo dev)

---

## 🎯 **TESTE RÁPIDO PASSO A PASSO:**

### **1. Iniciar servidor local:**
```bash
cd /tmp/cc-agent/58142715/project
npm run dev -- --host
```

### **2. Pegar o IP:**
Procure no terminal a linha **"Network:"**
```
➜  Network: http://192.168.1.100:5173/
```

### **3. No celular:**
- Conecte no mesmo Wi-Fi
- Abra o navegador
- Digite: `http://SEU_IP:5173/mobile/login`
- Exemplo: `http://192.168.1.100:5173/mobile/login`

### **4. Fazer login:**
- Email: `tecnico@giartech.com`
- Senha: qualquer coisa (dev mode)
- Clicar "ENTRAR"

### **5. Testar todas as abas:**
- ✅ Início → Ver dashboard
- ✅ Agenda → Ver compromissos
- ✅ OS → Ver ordens de serviço
- ✅ Compras → Nova solicitação
- ✅ Rotas → Rastreamento GPS

---

## 🚀 **DEPLOY RÁPIDO (1 MINUTO):**

### **Usando Vercel (Mais Fácil):**

```bash
# 1. Instalar
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod
```

**Pronto!** Link gerado automaticamente! 🎉

Copie o link e abra no celular!

---

## 📱 **ADICIONAR À TELA INICIAL (PWA):**

Depois de acessar pelo navegador:

### **iPhone (Safari):**
1. Abrir o site
2. Tocar no botão **Compartilhar** 📤
3. Rolar e tocar em **"Adicionar à Tela de Início"**
4. Confirmar

### **Android (Chrome):**
1. Abrir o site
2. Tocar nos **3 pontos** ⋮
3. Tocar em **"Adicionar à tela inicial"**
4. Confirmar

✅ **Agora você tem o app como se fosse nativo!**

---

## 🐛 **TROUBLESHOOTING:**

### **Não consegue acessar pelo IP:**
- ✅ Verifique se estão na mesma rede Wi-Fi
- ✅ Desabilite firewall temporariamente
- ✅ Verifique se o servidor está rodando
- ✅ Tente usar `0.0.0.0` ao invés de `localhost`

### **Tela branca no celular:**
- ✅ Limpe o cache do navegador
- ✅ Abra em modo anônimo
- ✅ Verifique o console de erros (Chrome DevTools mobile)

### **Login não funciona:**
- ✅ Verifique se o usuário existe no banco
- ✅ Verifique as variáveis de ambiente (.env)
- ✅ Verifique a conexão com Supabase

---

## 🎨 **O QUE VOCÊ VAI VER NO CELULAR:**

### **✨ Splash Screen (2.5s):**
- Logo animado girando
- Formas flutuantes
- Loading dots pulsantes
- Gradiente azul vibrante

### **🔐 Tela de Login:**
- Card premium com glassmorphism
- Inputs elegantes com ícones
- Botão gradiente
- Features cards coloridos
- Animações suaves

### **🏠 Homepage:**
- Header gradiente com avatar
- Stats do dia (cards coloridos)
- OS recentes
- Eventos da agenda
- Bottom navigation animado

### **📊 Todas as Funcionalidades:**
- ✅ Agenda com navegador de datas
- ✅ Lista de OS com filtros
- ✅ Solicitação de compras completa
- ✅ Rastreamento GPS de rotas
- ✅ Notificações com badge
- ✅ Menu de perfil
- ✅ Logout

---

## 💡 **DICAS:**

1. **Use em modo retrato** para melhor experiência
2. **Adicione à tela inicial** para acesso rápido
3. **Teste em Wi-Fi** para melhor performance
4. **Use gestos** (toque, arraste, etc)
5. **Explore as micro-interações** (muito legais!)

---

## 📞 **PRECISA DE AJUDA?**

Se algo não funcionar:

1. Verifique o terminal (erros no servidor)
2. Abra o DevTools do navegador mobile
3. Verifique a conexão com Supabase
4. Teste primeiro no computador

---

## ✅ **CHECKLIST DE TESTE:**

- [ ] Splash screen aparece
- [ ] Transição suave para login
- [ ] Login funciona
- [ ] Navega para /mobile
- [ ] Header aparece com avatar
- [ ] Bottom nav tem 5 abas
- [ ] Abas mudam de cor ao clicar
- [ ] Notificações abrem lateral
- [ ] Perfil abre modal
- [ ] Logout funciona
- [ ] Todas páginas carregam
- [ ] Animações são suaves
- [ ] Touch funciona bem

---

## 🎯 **LINK MAIS RÁPIDO:**

**Se você já tem deploy:**
```
https://SEU-DOMINIO.com/mobile/login
```

**Se vai testar local:**
```
http://SEU-IP:5173/mobile/login
```

---

**PRONTO PARA TESTAR! 🚀📱✨**

Qualquer dúvida, me avise!
