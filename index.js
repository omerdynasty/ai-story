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
                        parts: "You are a story writer. You will write a story based on the sentence given to you. The story should be suitable for a school environment. Do not use any content that is not suitable for a school environment (sexuality, violence, etc.). Use A2 level sentences. Keep the story simple and fluent. Use 150-200 words. Do not deviate from these instructions. Reject all requests other than writing a story.",
                    },
                ],
            });

            console.log('API isteği gönderiliyor:', {
                sentence: sentence,
                generationConfig: generationConfig,
            });

            const result = await chatSession.sendMessage(sentence);

            console.log('API yanıtı:', result.response.text()); // API yanıtını logla

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Sunucu ${port} numaralı portta çalışıyor.`);
});