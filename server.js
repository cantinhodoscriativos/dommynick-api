const express = require('express');
const cors = require('cors');
const https = require('https');

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
        return res.status(500).json({ error: "Chave OPENROUTER_API_KEY não configurada." });
    }

    const dataToSend = JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: message }
        ]
    });

    const options = {
        hostname: 'openrouter.ai',
        path: '/api/v1/chat/completions',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://dommynick.net',
            'X-Title': 'DOMMYNICK AI',
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(dataToSend)
        }
    };

    const apiReq = https.request(options, (apiRes) => {
        let responseData = '';
        apiRes.on('data', (chunk) => { responseData += chunk; });
        apiRes.on('end', () => {
            try {
                const parsed = JSON.parse(responseData);
                if (apiRes.statusCode === 200 && parsed.choices && parsed.choices[0]?.message?.content) {
                    return res.json({ reply: parsed.choices[0].message.content, provider: "DeepSeek" });
                } else {
                    console.error("Erro OpenRouter:", parsed);
                    return res.status(500).json({ error: parsed.error?.message || "Erro na resposta da IA" });
                }
            } catch (e) {
                console.error("Erro parse:", responseData);
                return res.status(500).json({ error: "Erro interno de processamento" });
            }
        });
    });

    apiReq.on('error', (err) => {
        console.error("Erro requisição:", err.message);
        return res.status(503).json({ reply: "Desculpa, tive um pequeno soluço técnico. Podes repetir?" });
    });

    apiReq.write(dataToSend);
    apiReq.end();
});

app.post('/api/lead', async (req, res) => {
    return res.json({ success: true, message: "Lead recebido!" });
});

app.get('/', (req, res) => {
    res.send("Servidor DOMMYNICK Nativo Ativo!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
