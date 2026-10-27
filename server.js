const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_NOTIFICATION_URL;

const SYSTEM_PROMPT = `Você é o DOMMYNICK, um assistente virtual especialista no Método DOM (Autoridade Digital com Propósito). Sua missão é ajudar empreendedores e criadores a construírem autoridade digital, destravarem a comunicação e aplicarem as táticas do Método DOM de forma direta, motivadora e estratégica.`;

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "A mensagem é obrigatória." });

    if (!OPENROUTER_API_KEY) {
        return res.status(500).json({ error: "Chave OPENROUTER_API_KEY não configurada no Render." });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "HTTP-Referer": "https://dommynick.net",
                "X-Title": "DOMMYNICK AI",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek/deepseek-r1:free",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();

        if (response.ok && data.choices && data.choices[0]?.message?.content) {
            return res.json({ reply: data.choices[0].message.content, provider: "DeepSeek" });
        } else {
            console.error("Erro do OpenRouter:", data);
            return res.status(500).json({ error: data.error?.message || "Erro ao comunicar com o DeepSeek" });
        }
    } catch (error) {
        console.error("Erro interno:", error.message);
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
    res.send("Servidor DOMMYNICK API com DeepSeek ativo!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

