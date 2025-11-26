# Guia de Deploy - SpeakWise Real

## Deploy no Vercel (Recomendado)

### Passo 1: Acesse o Vercel
1. Vá para [https://vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub (mesma conta do repositório)

### Passo 2: Importar Projeto
1. Clique em **"Add New..."** → **"Project"**
2. Na lista de repositórios, encontre **`speakwisereal`**
3. Clique em **"Import"**

### Passo 3: Configurar Variáveis de Ambiente
**IMPORTANTE:** Antes de fazer deploy, configure a variável de ambiente:

1. Na página de configuração do projeto, vá em **"Environment Variables"**
2. Adicione a seguinte variável:
   - **Name:** `GOOGLE_AI_API_KEY`
   - **Value:** Sua chave da API do Google AI
   - **Environments:** Selecione todas (Production, Preview, Development)

**Como obter a chave do Google AI:**
- Acesse: https://makersuite.google.com/app/apikey
- Faça login com sua conta Google
- Clique em "Create API Key"
- Copie a chave e cole no Vercel

**OU se preferir usar ElevenLabs:**
- **Name:** `ELEVENLABS_API_KEY`
- **Value:** Sua chave da API do ElevenLabs

### Passo 4: Deploy
1. Clique em **"Deploy"**
2. Aguarde o build completar (geralmente 2-3 minutos)
3. Quando terminar, você verá uma URL como: `https://speakwisereal.vercel.app`

### Passo 5: Testar
1. Acesse a URL fornecida
2. Teste a gravação de voz (clique em "🎤 Record Pitch")
3. Teste a análise de pitch

## Verificações Pós-Deploy

✅ **Build bem-sucedido?** Verifique os logs no Vercel
✅ **Variável de ambiente configurada?** Verifique em Settings → Environment Variables
✅ **App carrega?** Acesse a URL e veja se a página abre
✅ **Gravação funciona?** Teste o botão de gravação (pode pedir permissão de microfone)
✅ **Análise funciona?** Digite um pitch de teste e clique em "Analyze Pitch"

## Troubleshooting

### Erro: "API key not configured"
- Verifique se a variável `GOOGLE_AI_API_KEY` ou `ELEVENLABS_API_KEY` está configurada no Vercel
- Certifique-se de que selecionou todos os ambientes (Production, Preview, Development)
- Após adicionar a variável, faça um novo deploy

### Erro no build
- Verifique os logs de build no Vercel
- Certifique-se de que todas as dependências estão no `package.json`

### Gravação não funciona
- A gravação funciona apenas em Chrome, Edge ou Safari
- Certifique-se de que o navegador tem permissão de microfone
- Teste em um navegador diferente

## Próximos Passos

Após o deploy bem-sucedido:
1. Compartilhe a URL com usuários
2. Monitore o uso da API (Google AI tem limites gratuitos)
3. Considere adicionar analytics (opcional)

