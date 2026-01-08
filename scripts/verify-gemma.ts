import { getGemmaClient } from "../lib/ai/gemma-client";
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: '.env.local' });

async function verifyGemma() {
    console.log("🔍 Verifying Gemma functionality...");

    try {
        const gemma = getGemmaClient();
        console.log("✅ Gemma Client initialized");

        // Check provider via internal property access (requires casting as private)
        const provider = (gemma as any).provider;
        console.log(`ℹ️  Active AI Provider: ${provider?.toUpperCase() || 'UNKNOWN'}`);

        if (provider === 'ollama') {
            console.log(`ℹ️  Ollama URL: ${(gemma as any).ollamaBaseUrl}`);
        }

        console.log("Generating test content...");

        // Pass undefined as model to use the default configured in the client
        const result = await gemma.generateText(undefined, 'Say "Gemma is working!" if you can hear me.', {
            maxTokens: 50
        });

        console.log("\n🤖 RESPONSE:");
        console.log(result);

        console.log("\n✅ AI System is working correctly.");
    } catch (error: any) {
        if (error.message.includes("Ollama connection failed")) {
            console.error("\n❌ OLLAMA CONNECTION FAILED");
            console.error("The app is configured to use Ollama, but it seems to be unreachable.");
            console.error("Please run: 'ollama run gemma:2b' in a new terminal window.");
        } else {
            console.error("\n❌ Verification failed:", error);
        }
        process.exit(1);
    }
}

verifyGemma();
