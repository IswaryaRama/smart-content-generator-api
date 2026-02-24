const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

// Text Generation with fallback responses
app.post('/api/generate-text', async (req, res) => {
    try {
        const { prompt, sentiment } = req.body;
        console.log('📝 Generating for:', prompt);
        console.log('🎯 Desired sentiment:', sentiment);

        // Try Pollinations.ai first
        try {
            // Create prompt based on sentiment
            let fullPrompt = '';
            switch(sentiment) {
                case 'Positive':
                    fullPrompt = `Write an EXTREMELY POSITIVE, HAPPY, and JOYFUL response about: ${prompt}. Use words like amazing, wonderful, fantastic, love, great.`;
                    break;
                case 'Negative':
                    fullPrompt = `Write an EXTREMELY NEGATIVE, SAD, and PESSIMISTIC response about: ${prompt}. Use words like terrible, awful, horrible, sad, depressing.`;
                    break;
                case 'Neutral':
                    fullPrompt = `Write a NEUTRAL, FACTUAL, and OBJECTIVE response about: ${prompt}. Use no emotional words.`;
                    break;
                default:
                    fullPrompt = prompt;
            }

            console.log('📡 Trying Pollinations.ai...');
            const response = await axios.get(
                `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`,
                { timeout: 5000 }
            );
            
            console.log('✅ Got response from Pollinations');
            return res.json({ generatedText: response.data });
            
        } catch (pollinationsError) {
            console.log('⚠️ Pollinations failed, using fallback');
            
            // Fallback responses based on sentiment
            const fallbacks = {
                'Positive': [
                    "I'm absolutely delighted to see you! Have a wonderful and blessed day ahead!",
                    "Hello there! So great to connect with you today. You're amazing!",
                    "Hi! Hope you're having a fantastic day filled with joy and laughter!",
                    "Greetings! Today is going to be awesome because you're in it!",
                    "Hey there! Sending you positive vibes and warm wishes!"
                ],
                'Negative': [
                    "Oh, it's you. Another day, another disappointment.",
                    "Hi. Not that it matters, but I'll acknowledge your existence.",
                    "Hello... if you can even call this meaningless interaction a greeting.",
                    "Hey. Whatever. Let's just get this over with.",
                    "Greetings, I suppose. Not that anything good will come of it."
                ],
                'Neutral': [
                    "Hello. This is a standard greeting for this interaction.",
                    "Hi. Acknowledging your presence in this conversation.",
                    "Greetings. This message serves as an initial contact point.",
                    "Hello there. This is a basic salutation.",
                    "Hi. Standard greeting protocol initiated."
                ]
            };
            
            const fallbackList = fallbacks[sentiment] || fallbacks['Neutral'];
            const fallbackText = fallbackList[Math.floor(Math.random() * fallbackList.length)];
            
            return res.json({ generatedText: fallbackText });
        }

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        
        // Ultimate fallback
        res.json({ 
            generatedText: "Hello! How are you doing today?" 
        });
    }
});

// Sentiment Analysis Endpoint
app.post('/api/analyze-sentiment', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        // Extensive word databases for accurate sentiment analysis
        const text_lower = text.toLowerCase();
        
        // Strong positive indicators
        const positiveWords = [
            'happy', 'joy', 'love', 'great', 'awesome', 'wonderful', 'fantastic', 
            'amazing', 'beautiful', 'excellent', 'perfect', 'best', 'glad', 
            'delighted', 'pleased', 'cheerful', 'sunny', 'bright', 'smile',
            'laugh', 'celebration', 'success', 'win', 'victory', 'grateful',
            'thankful', 'blessed', 'fortunate', 'lucky', 'positive', 'optimistic'
        ];
        
        // Strong negative indicators
        const negativeWords = [
            'sad', 'bad', 'terrible', 'awful', 'hate', 'horrible', 'worst',
            'poor', 'angry', 'upset', 'depressed', 'miserable', 'annoying',
            'disappointing', 'frustrating', 'painful', 'ugly', 'nasty',
            'dreadful', 'gloomy', 'grim', 'bleak', 'somber', 'melancholy',
            'tragic', 'heartbreaking', 'devastating', 'despair', 'hopeless',
            'sorrow', 'grief', 'anguish', 'suffering', 'cry', 'tears'
        ];

        let score = 0;
        let positiveCount = 0;
        let negativeCount = 0;

        // Count positive words
        positiveWords.forEach(word => {
            if (text_lower.includes(word)) {
                score += 0.2;
                positiveCount++;
                console.log(`Found positive word: ${word}`);
            }
        });

        // Count negative words
        negativeWords.forEach(word => {
            if (text_lower.includes(word)) {
                score -= 0.2;
                negativeCount++;
                console.log(`Found negative word: ${word}`);
            }
        });

        // Normalize score based on text length
        const words = text_lower.split(/\s+/);
        if (words.length > 0) {
            score = score / Math.sqrt(words.length) * 2;
        }

        // Clamp score between -1 and 1
        score = Math.max(-1, Math.min(1, score));

        // Determine label with clear thresholds
        let label = 'Neutral';
        if (score > 0.15) label = 'Positive';
        if (score < -0.15) label = 'Negative';

        // Override if there's a clear majority
        if (positiveCount > negativeCount + 2) label = 'Positive';
        if (negativeCount > positiveCount + 2) label = 'Negative';

        console.log(`📊 Sentiment result: ${label} (score: ${score.toFixed(2)})`);

        res.json({
            sentiment: {
                score: score,
                label: label,
                details: {
                    positiveWords: positiveCount,
                    negativeWords: negativeCount
                }
            }
        });

    } catch (error) {
        console.error('❌ Sentiment error:', error.message);
        res.json({ 
            sentiment: { 
                score: 0, 
                label: 'Neutral',
                details: { positiveWords: 0, negativeWords: 0 }
            } 
        });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Test with: curl http://localhost:${PORT}`);
    console.log(`✨ Using fallback responses when Pollinations is unavailable`);
});
