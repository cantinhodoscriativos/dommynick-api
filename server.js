const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração das Chaves de API pelas Variáveis de Ambiente
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Pode ser usada para Groq ou OpenAI
const WEBHOOK_URL = process.env.WEBHOOK_NOTIFICATION_URL;

// Inicializa o cliente do Gemini
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Prompt do Sistema / Instruções do DOMMYNICK
const SYSTEM_PROMPT = `Você é o DOMMYNICK, um assistente virtual especialista no Método DOM (Autoridade Digital com Propósito).
Sua missão é ajudar empreendedores e criadores a construírem autoridade digital, destravarem a comunicação e aplicarem as táticas do Método DOM de forma direta, motivadora e estratégica.`;

// Função Auxiliar para Chamar o OpenRouter (Backup Gratuito)
async function callOpenRouter(userMessage) {
    if (!OPENROUTER_API_KEY) throw new Error("Chave OPENROUTER_API_KEY não configurada.");

    // Lista de modelos totalmente gratuitos no OpenRouter
    const freeModels = [
        "google/gemini-2.0-flash-exp:free",
        "deepseek/deepseek-r1:free",
        "meta-llama/llama-3.3-70b-instruct:free"
    ];

    let lastError = null;

    for (const model of freeModels) {
        try {
            console.log(`Tentando OpenRouter com o modelo: ${model}`);
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "https://dommynick.net",
                    "X-Title": "DOMMYNICK AI",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: model,
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
                console.warn(`Falha no modelo ${model}:`, data.error?.message || JSON.stringify(data));
            }
        } catch (err) {
            console.warn(`Erro na tentativa com ${model}:`, err.message);
            lastError = err;
        }
    }

    throw new Error("Todos os modelos gratuitos do OpenRouter falharam. " + (lastError ? lastError.message : ""));
}

// Rota Principal do Chat com Failover / Redundância
app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "A mensagem é obrigatória." });
    }

    // 1ª TENTATIVA: Google Gemini (Pro/Flash Primário)
    if (genAI) {
        try {
            console.log("Tentando resposta via Google Gemini...");
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
            console.error("Erro no Gemini Primário, acionando redundância OpenRouter...", error.message);
        }
    }

    // 2ª TENTATIVA: OpenRouter (Backup com múltiplos modelos gratuitos)
    try {
        console.log("Acionando Backup via OpenRouter...");
        const reply = await callOpenRouter(message);
        return res.json({ reply: reply, provider: "OpenRouter" });
    } catch (error) {
        console.error("Erro no OpenRouter:", error.message);
    }

    // Resposta de Contingência Final caso todas as APIs fiquem indisponíveis
    return res.status(503).json({ 
        reply: "No momento estou passando por uma atualização rápida no meu sistema de IA. Por favor, tente enviar sua mensagem novamente em alguns instantes!" 
    });
});

// Rota de Notificação / Webhook (Captura de Leads)
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
            console.error("Erro ao enviar Lead para Webhook:", err.message);
        }
    }

    return res.json({ success: true, message: "Lead recebido com sucesso!" });
});

// Rota de Teste de Saúde do Servidor
app.get('/', (req, res) => {
    res.send("Servidor DOMMYNICK API está ativo e operando!");
});

// Inicialização do Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso na porta ${PORT}`);
});

