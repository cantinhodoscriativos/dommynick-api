const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const vipLeadsDatabase = [];

app.get('/', (req, res) => {
  res.json({ 
    status: 'ONLINE',
    message: 'API Central DOMMYNICK ativa!', 
    total_leads_vip: vipLeadsDatabase.length 
  });
});

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

    vipLeadsDatabase.push(newLead);

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
      }).catch(err => console.error('Erro ao disparar Webhook:', err));
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

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'A mensagem é obrigatória.' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Chave GEMINI_API_KEY não encontrada.' });

    const systemPrompt = "Você é a DOMMYNICK, assistente estratégica de Wagner Dom.";
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUsuário: ${message}` }] }]
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Erro na resposta do modelo.';
    res.json({ response: reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor DOMMYNICK API ativo na porta ${PORT}`);
});

