const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Inicializa a OpenAI com a chave salva nas variáveis de ambiente
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

// Rota inicial de verificação
app.get('/', (req, res) => {
  res.json({ message: 'API Central DOMMYNICK rodando com sucesso!' });
});

// Rota do Chat com Inteligência Artificial
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'A mensagem é obrigatória.' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você é o assistente virtual da plataforma DOMMYNICK, prestativo e direto.' },
        { role: 'user', content: message }
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ response: reply });

  } catch (error) {
    console.error('Erro na chamada da OpenAI:', error);
    res.status(500).json({ error: 'Erro ao processar a requisição de IA.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

