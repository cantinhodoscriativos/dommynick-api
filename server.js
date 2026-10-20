const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Rota de teste simples
app.get('/', (req, res) => {
  res.json({ message: 'API Central DOMMYNICK (Gemini AI) rodando com sucesso!' });
});

// Rota Principal de Chatbot
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'A mensagem é obrigatória.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Chave GEMINI_API_KEY não encontrada nas variáveis de ambiente do Render.' });
    }

    // SYSTEM PROMPT // O CÉREBRO DA DOMMYNICK
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
- Não exiba links diretos nem dados pessoais hardcoded. Direcione os utilizadores para a Área VIP ou para os canais oficiais da plataforma de forma elegante.
`;

    // Chamada à API Beta do Gemini (Modelo gemini-1.5-flash-latest)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${systemPrompt}\n\nUsuário: ${message}` }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Erro na resposta da API Gemini.');
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.json({ response: reply });

  } catch (error) {
    console.error('Erro no servidor DOMMYNICK API:', error);
    res.status(500).json({ error: error.message || 'Erro interno ao processar a mensagem.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor DOMMYNICK API ativo na porta ${PORT}`);
});

