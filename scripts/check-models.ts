
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function listModels() {
    if (!process.env.GOOGLE_AI_API_KEY) {
        console.error("Missing API Key");
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

    try {
        // Note: The listModels method isn't directly exposed on the simple client in some versions, 
        // but let's try to infer or just test standard Gemini models.
        // actually, for node SDK it is often on the `GoogleGenerativeAI` instance or a manager.
        // Let's try to just run a simple prompt with 'gemini-1.5-flash' to see if the KEY works at least.

        console.log("Testing API Key with 'gemini-1.5-flash'...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello?");
        console.log("Success! API Key is valid. Response:", result.response.text());

        console.log("\nAttempting to use 'gemma-2-2b-it' again...");
        try {
            const gemma = genAI.getGenerativeModel({ model: "gemma-2-2b-it" });
            await gemma.generateContent("test");
            console.log("Current configuration 'gemma-2-2b-it' WORKS (unexpectedly).");
        } catch (e: any) {
            console.log("Confirmed: 'gemma-2-2b-it' is NOT working. Error:", e.statusText || e.message);
        }

    } catch (error: any) {
        console.error("API Key verification failed:", error.message);
    }
}

listModels();
