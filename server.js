const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_NOTIFICATION_URL;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SYSTEM_PROMPT = `Você é o DOMMYNICK, um assistente virtual especialista no Método DOM (Autoridade Digital com Propósito). Sua missão é ajudar empreendedores e criadores a construírem autoridade digital, destravarem a comunicação e aplicarem as táticas do Método DOM de forma direta, motivadora e estratégica.`;

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "A mensagem é obrigatória." });

    if (!genAI) {
        return res.status(500).json({ error: "Chave do Gemini não configurada no servidor." });
    }

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction: SYSTEM_PROMPT 
        });
        
        const result = await model.generateContent(message);
        const responseText = result.response.text();

        if (responseText) {
            return res.json({ reply: responseText, provider: "Gemini" });
        }
    } catch (error) {
        console.error("Erro no Gemini:", error.message);
        return res.status(503).json({ reply: "Desculpa, tive um pequeno soluço técnico. Podes repetir a pergunta?" });
    }
});

app.post('/api/lead', async (req, res) => {
    const leadData = req.body;
    if (WEBHOOK_URL) {
        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
        } catch (err) {
            console.error("Erro no Webhook:", err.message);
        }
    }
    return res.json({ success: true, message: "Lead recebido com sucesso!" });
});

app.get('/', (req, res) => {
    res.send("Servidor DOMMYNICK API ativo com Gemini!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
