const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_NOTIFICATION_URL;

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SYSTEM_PROMPT = `Você é o DOMMYNICK, um assistente virtual especialista no Método DOM (Autoridade Digital com Propósito). Sua missão é ajudar empreendedores e criadores a construírem autoridade digital, destravarem a comunicação e aplicarem as táticas do Método DOM de forma direta, motivadora e estratégica.`;

// Função para chamar o OpenRouter com o modelo Llama gratuito
async function callOpenRouter(userMessage) {
    if (!OPENROUTER_API_KEY) throw new Error("Chave OPENROUTER_API_KEY não configurada.");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://dommynick.net",
            "X-Title": "DOMMYNICK AI",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "meta-llama/llama-3.3-70b-instruct:free",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userMessage }
            ]
        })
    });

    const data = await response.json();
    if (response.ok && data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
    } else {
        throw new Error(data.error?.message || "Erro desconhecido no OpenRouter");
    }
}

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "A mensagem é obrigatória." });

    // 1ª Tentativa: Gemini
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: SYSTEM_PROMPT });
            const result = await model.generateContent(message);
            const responseText = result.response.text();
            if (responseText) return res.json({ reply: responseText, provider: "Gemini" });
        } catch (error) {
            console.error("Erro no Gemini, tentando OpenRouter...", error.message);
        }
    }

    // 2ª Tentativa: OpenRouter (Backup)
    try {
        const reply = await callOpenRouter(message);
        return res.json({ reply: reply, provider: "OpenRouter" });
    } catch (error) {
        console.error("Erro no OpenRouter:", error.message);
    }

    return res.status(503).json({ reply: "Estou em breve manutenção no sistema. Tente novamente em instantes!" });
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
    res.send("Servidor DOMMYNICK API ativo!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

