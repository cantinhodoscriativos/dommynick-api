const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Central DOMMYNICK rodando com sucesso!' });
});

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'A mensagem é obrigatória.' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Você é o assistente virtual da plataforma DOMMYNICK, especialista em Autoridade Digital, Oratória e Estratégia.' },
        { role: 'user', content: message }
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ response: reply });

  } catch (error) {
    console.error('Erro na chamada da OpenAI:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar a requisição de IA.' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

