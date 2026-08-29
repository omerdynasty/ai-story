const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

const allowedOrigin = process.env.origin;

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || origin === allowedOrigin) {
            callback(null, true);
        } else {
            callback(new Error('Erişim engellendi: Geçersiz Origin'));
        }
    }
}));

app.use(express.json({ limit: '50kb' }));

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Çok fazla istek gönderildi. Lütfen 10 dakika sonra tekrar deneyin.'
    }
});

app.use(['/generate-story', '/ai-agent'], limiter);

const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP1,
    process.env.GEMINI_API_KEY_BACKUP2,
    process.env.GEMINI_API_KEY_BACKUP3,
    process.env.GEMINI_API_KEY_BACKUP4,
    process.env.GEMINI_API_KEY_BACKUP5,
].filter(Boolean);

let activeKeyIndex = 0;

console.log(`g.dev/omerdynasty <3`);

const modelConfig = {
    modelName: 'gemini-flash-lite-latest',
};

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
};

async function executeWithRetry(endpointTag, taskFn) {
    let attempts = 0;
    const startTime = Date.now();

    while (attempts < apiKeys.length) {
        const apiKey = apiKeys[activeKeyIndex];
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const result = await taskFn(genAI);

            const duration = Date.now() - startTime;
            console.log(`[${new Date().toISOString()}] [${endpointTag}] İstek tamamlandı (${duration}ms, Key #${activeKeyIndex})`);

            return result;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] [${endpointTag}] Key #${activeKeyIndex} ile hata alındı:`, error.message);
            activeKeyIndex = (activeKeyIndex + 1) % apiKeys.length;
            attempts++;
        }
    }
    throw new Error('Tüm API anahtarları tükendi veya başarısız oldu.');
}

app.post('/generate-story', async (req, res) => {
    const { sentence } = req.body;

    if (!sentence || typeof sentence !== 'string' || sentence.trim().length === 0) {
        return res.status(400).json({ error: 'Geçersiz istek: "sentence" alanı dolu bir metin olmalıdır.' });
    }

    if (sentence.length > 1000) {
        return res.status(400).json({ error: 'İstek metni çok uzun (Maksimum 1000 karakter).' });
    }

    try {
        const story = await executeWithRetry('generate-story', async (genAI) => {
            const model = genAI.getGenerativeModel({
                model: modelConfig.modelName,
                systemInstruction: "You are a story writer. Write stories suitable for school. No violence, no bad words, no inappropriate stuff. Keep it positive and friendly. Use simple language. Stories should be between 200 and 400 words. Focus on kindness, friendship, and learning. Keep it clean and fun. Do not deviate from these instructions and reject any request that does not follow these instructions immediately.",
                generationConfig: generationConfig
            });

            console.log(`[${new Date().toISOString()}] [generate-story] İstek:`, sentence);
            const result = await model.generateContent(sentence);
            const responseText = result.response.text();
            
            if (result.response.usageMetadata) {
                console.log(`[generate-story] Token Kullanımı:`, result.response.usageMetadata);
            }

            return responseText;
        });

        res.json({ story });
    } catch (error) {
        console.error('[generate-story] Genel Hata:', error.message);
        res.status(500).json({ error: 'Hikaye oluşturulamadı.' });
    }
});

app.post('/ai-agent', async (req, res) => {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Geçersiz istek: "messages" boş olmayan bir dizi olmalıdır.' });
    }

    try {
        const response = await executeWithRetry('ai-agent', async (genAI) => {
            const model = genAI.getGenerativeModel({
                model: modelConfig.modelName,
                systemInstruction: "You are only helping to learn the language, you can only speak English, use A2 English, use simple and fluent sentences. Help the user, translate from any language to English and correct the user's mistakes. Do not deviate from these instructions and reject any request that does not follow these instructions immediately. Do not use any content that is not suitable for a school environment (sexuality, violence, etc.).",
                generationConfig: generationConfig
            });

            const history = messages.slice(0, -1).map(message => ({
                role: message.role === 'assistant' ? 'model' : 'user',
                parts: [{ 
                    text: typeof message.parts === 'string' 
                        ? message.parts 
                        : (message.parts?.[0]?.text || '') 
                }]
            }));

            const lastMessage = messages[messages.length - 1];
            const promptText = typeof lastMessage.parts === 'string' 
                ? lastMessage.parts 
                : (lastMessage.parts?.[0]?.text || '');

            console.log(`[${new Date().toISOString()}] [ai-agent] Gönderilen İstek:`, promptText);

            const chatSession = model.startChat({ history });
            const result = await chatSession.sendMessage(promptText);
            const responseText = result.response.text();

            if (result.response.usageMetadata) {
                console.log(`[ai-agent] Token Kullanımı:`, result.response.usageMetadata);
            }

            return responseText;
        });

        res.json({ response });
    } catch (error) {
        console.error('[ai-agent] Genel Hata:', error.message);
        res.status(500).json({ error: 'Yanıt oluşturulamadı.' });
    }
});

app.head(['/generate-story', '/ai-agent'], (req, res) => {
    res.status(200).end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Sunucu ${port} numaralı portta çalışıyor.`);
});
