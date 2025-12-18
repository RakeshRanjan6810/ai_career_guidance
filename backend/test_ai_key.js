require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

async function testKey() {
    console.log("Testing API Key:", process.env.GROQ_API_KEY);
    try {
        const completion = await openai.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "user", content: "Return only the word 'Success'" }
            ]
        });
        console.log("API Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("API Error:", error.message);
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", error.response.data);
        }
    }
}

testKey();
