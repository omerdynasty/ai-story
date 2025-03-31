const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

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
    modelName: 'gemini-2.0-flash-lite',
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
            const model = genAI.getGenerativeModel({
                model: modelConfig.modelName,
            });
            const chatSession = model.startChat({
                generationConfig: generationConfig,
                history: [
                    {
                        role: "user",
                        parts: [{ text: "You are a story writer. You will write a story based on the sentence given to you. The story should be suitable for a school environment. Do not use any content that is not suitable for a school environment (sexuality, violence, etc.). Use A2 level sentences. Keep the story simple and fluent. Use 150-200 words. Do not deviate from these instructions. Reject all requests other than writing a story. Don't use markdown." }],
                    },
                ],
            });

            console.log('API isteği gönderiliyor:', {
                sentence: sentence,
                generationConfig: generationConfig,
            });

            const result = await chatSession.sendMessage(sentence);

            console.log('API yanıtı:', result.response.text());

            return result.response.text();
        } catch (error) {
            console.error('API key ile hata:', apiKey, error);
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
            const model = genAI.getGenerativeModel({
                model: modelConfig.modelName,
            });
            const chatSession = model.startChat({
                generationConfig: generationConfig,
                history: messages,
            });

            console.log('API isteği gönderiliyor:', {
                messages: messages,
                generationConfig: generationConfig,
            });

            const result = await chatSession.sendMessage(messages[messages.length - 1].parts);

            console.log('API yanıtı:', result.response.text());

            return result.response.text();
        } catch (error) {
            console.error('API key ile hata:', apiKey, error);
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
