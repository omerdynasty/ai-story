const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 dakika
    max: 10, // 10 dakika içinde maksimum istek sayısı
    standardHeaders: true, 
    legacyHeaders: false, 
    message: { 
        error: 'Çok fazla istek gönderildi. Lütfen 10 dakika sonra tekrar deneyin.' 
    }
});

// Tüm API rotalarına uygula
app.use('/generate-story', limiter);
app.use('/ai-agent', limiter);
// ip kontrol middleware'i
const allowedOrigin = process.env.origin;

app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log('origin:', origin); // debug için

    if (origin === allowedOrigin || !origin) {
        next();
    } else {
        res.status(403).json({ error: 'access denied' });
    }
});




const apiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_BACKUP1,
    process.env.GEMINI_API_KEY_BACKUP2,
    process.env.GEMINI_API_KEY_BACKUP3,
    process.env.GEMINI_API_KEY_BACKUP4,
    process.env.GEMINI_API_KEY_BACKUP5,
].filter(Boolean);

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

async function generateStoryWithRetry(sentence) {
    for (const apiKey of apiKeys) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelConfig.modelName });
            const chatSession = model.startChat({
                generationConfig: generationConfig,
                history: [
                    {
                        role: "user",
                        parts: [{ text: "you are a story writer. write stories suitable for school. no violence, no bad words, no inappropriate stuff. keep it positive and friendly. use simple language. stories should be between 200 and 400 words. focus on kindness, friendship, and learning. keep it clean and fun. Do not deviate from these instructions and reject any request that does not follow these instructions immediately" }] // kısaltıldı
                    },
                ],
            });

            console.log(`[${new Date().toISOString()}] [generate-story] İstek:`, sentence);

            const result = await chatSession.sendMessage(sentence);

            const responseText = result.response.text();

            console.log(`[${new Date().toISOString()}] [generate-story] Yanıt:`, responseText);

            return responseText;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] [generate-story] API key ile hata:`, apiKey, error);
        }
    }
    throw new Error('Tüm API anahtarları başarısız oldu.');
}


app.post('/generate-story', async (req, res) => {
    const sentence = req.body.sentence;
    try {
        const story = await generateStoryWithRetry(sentence);
        res.json({ story: story });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Hikaye oluşturulamadı.' });
    }
});

async function generateResponseWithRetry(messages) {
    for (const apiKey of apiKeys) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: modelConfig.modelName });
            const chatSession = model.startChat({
                generationConfig: generationConfig,
                history: messages,
            });

            console.log(`[${new Date().toISOString()}] [ai-agent] İstek:`, JSON.stringify(messages, null, 2));

            const result = await chatSession.sendMessage(messages[messages.length - 1].parts);
            const responseText = result.response.text();

            console.log(`[${new Date().toISOString()}] [ai-agent] Yanıt:`, responseText);

            return responseText;
        } catch (error) {
            console.error(`[${new Date().toISOString()}] [ai-agent] API key ile hata:`, apiKey, error);
        }
    }
    throw new Error('Tüm API anahtarları başarısız oldu.');
}

app.post('/ai-agent', async (req, res) => {
    const messages = req.body.messages;

    if (!Array.isArray(messages)) {
        return res.status(400).json({ error: 'Geçersiz istek yapısı: messages bir dizi olmalıdır.' });
    }

    try {
        const aiAgentPrompt = [
            {
                role: "user",
                parts: [{ text: "You are only helping to learn the language, you can only speak English, use A2 English, use simple and fluent sentences. Help the user, translate from any language to English and correct the user's mistakes. Do not deviate from these instructions and reject any request that does not follow these instructions immediately. Do not use any content that is not suitable for a school environment (sexuality, violence, etc.)." }],
            },
            ...messages.map(message => ({
                role: message.role === 'assistant' ? 'model' : message.role,
                parts: [{ text: message.parts }]
            })),
        ];
        const response = await generateResponseWithRetry(aiAgentPrompt);
        res.json({ response: response });
    } catch (error) {
        console.error('Hata:', error);
        res.status(500).json({ error: 'Yanıt oluşturulamadı.' });
    }
});

// HEAD isteği için endpoint
app.head('/generate-story', (req, res) => {
    res.status(200).end();
});

app.head('/ai-agent', (req, res) => {
    res.status(200).end();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Sunucu ${port} numaralı portta çalışıyor.`);
});
