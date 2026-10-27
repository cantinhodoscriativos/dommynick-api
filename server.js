const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Banco de dados temporário em memória (salva enquanto o servidor estiver ativo)
const vipLeadsDatabase = [];

// Rota inicial de teste/status da API
app.get('/', (req, res) => {
  res.json({ 
    status: 'ONLINE',
    message: 'API Central DOMMYNICK ativa!', 
    total_leads_vip: vipLeadsDatabase.length 
  });
});

// 1. ROTA DE CAPTURA E NOTIFICAÇÃO DA ÁREA VIP
app.post('/vip-lead', async (req, res) => {
  try {
    const { name, email, whatsapp, instagram, tiktok } = req.body;

    if (!name || !email || !whatsapp) {
      return res.status(400).json({ error: 'Nome, E-mail e WhatsApp são obrigatórios.' });
    }

    const newLead = {
      id: Date.now(),
      name,
      email,
      whatsapp,
      instagram: instagram || 'Não informado',
      tiktok: tiktok || 'Não informado',
      createdAt: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    };

    // Guarda o lead no servidor
    vipLeadsDatabase.push(newLead);
    console.log('🔥 NOVO LEAD VIP CAPTURADO:', newLead);

    // DISPARO AUTOMÁTICO DE NOTIFICAÇÃO (Webhook)
    const webhookUrl = process.env.WEBHOOK_NOTIFICATION_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'new_vip_lead',
          lead: newLead,
          messageText: `🚨 *NOVO LEAD VIP NA DOMMYNICK!*\n\n👤 *Nome:* ${newLead.name}\n📧 *E-mail:* ${newLead.email}\n📱 *WhatsApp:* ${newLead.whatsapp}\n📸 *Instagram:* ${newLead.instagram}\n🎵 *TikTok:* ${newLead.tiktok}\n📅 *Data:* ${newLead.createdAt}`
        })
      }).catch(err => console.error('Erro ao disparar Webhook de notificação:', err));
    }

    res.status(201).json({ 
      success: true, 
      message: 'Lead registrado com sucesso!',
      lead: newLead 
    });

  } catch (error) {
    console.error('Erro ao salvar Lead VIP:', error);
    res.status(500).json({ error: 'Erro interno ao processar cadastro VIP.' });
  }
});

// Rota para visualizar a lista de Leads cadastrados
app.get('/vip-leads-list', (req, res) => {
  res.json({ total: vipLeadsDatabase.length, leads: vipLeadsDatabase });
});

// 2. ROTA PRINCIPAL DO CHATBOT (MULTIPLATAFORMA E RESILIENTE)
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'A mensagem é obrigatória.' });
    }

    const systemPrompt = `
Você é a DOMMYNICK, a inteligência oficial e assistente estratégica do ecossistema de Wagner Dom.
Sua missão é guiar profissionais, alunos e criadores na construção de sua Autoridade Digital com Propósito e no avanço na Oratória e Posicionamento Estratégico.

CONHECIMENTO BASE E PILARES:
- Wagner Dom é mentor, estrategista digital, autor e desenvolvedor.
- Autor das obras: "Autoridade Digital com Propósito", "O Poder da Autoridade na Oratória", "31 Técnicas para adquirir O Poder da Autoridade", entre outras.
- Criador do "Método Os Vogais da Autoridade":
  • A - Autoridade (Construção do nome e presença com valor real)
  • E - Estratégia (Ações intencionais e direcionadas sem perder energia)
  • I - Identificação (Conexão autêntica com a audiência e o público ideal)
  • O - Oratória (Destravar a comunicação e dominar a fala perante as câmeras)
  • U - Utilidade (Produção de conteúdo prático que resolve dores reais)
- Foco em ajudar os alunos a superarem a "inércia digital" e acelerarem resultados.

DIRETRIZES DE COMUNICAÇÃO:
- Responda sempre em português, com tom profissional, motivador, direto, sofisticado e inspirador.
- Relacione as dúvidas dos usuários aos pilares do Método DOM sempre que pertinente.
`;

    let reply = null;
    let lastError = null;

    // --- TENTATIVA 1: GOOGLE GEMINI ---
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const geminiModels = [
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'
      ];

      for (const endpoint of geminiModels) {
        try {
          const response = await fetch(`${endpoint}?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\nUsuário: ${message}` }] }]
            })
          });

          const data = await response.json();
          if (response.ok && data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            reply = data.candidates[0].content.parts[0].text;
            console.log('✅ Resposta gerada com sucesso via Gemini API');
            break;
          } else {
            lastError = data.error?.message || 'Erro na resposta do Gemini.';
          }
        } catch (err) {
          lastError = err.message;
        }
      }
    }

    // --- TENTATIVA 2: GROQ API (BACKUP SE GEMINI FALHAR) ---
    const groqKey = process.env.GROQ_API_KEY;
    if (!reply && groqKey) {
      console.log('⚠️ Tentando resposta via backup Groq API...');
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ]
          })
        });

        const data = await response.json();
        if (response.ok && data.choices && data.choices[0]?.message?.content) {
          reply = data.choices[0].message.content;
          console.log('✅ Resposta gerada com sucesso via Groq API');
        } else {
          lastError = data.error?.message || 'Erro na resposta da Groq API.';
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    // --- TENTATIVA 3: OPENROUTER API (SEGUNDO BACKUP) ---
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!reply && openRouterKey) {
      console.log('⚠️ Tentando resposta via backup OpenRouter API...');
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openRouterKey}`
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ]
          })
        });

        const data = await response.json();
        if (response.ok && data.choices && data.choices[0]?.message?.content) {
          reply = data.choices[0].message.content;
          console.log('✅ Resposta gerada com sucesso via OpenRouter API');
        } else {
          lastError = data.error?.message || 'Erro na resposta da OpenRouter API.';
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    // RETORNO FINAL
    if (reply) {
      return res.json({ response: reply });
    } else {
      throw new Error(lastError || 'Não foi possível obter resposta de nenhuma API configurada.');
    }

  } catch (error) {
    console.error('Erro no servidor DOMMYNICK API:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar a mensagem.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor DOMMYNICK API ativo na porta ${PORT}`);
});

