import { getGeminiClient } from "../lib/ai/gemini-client";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyGemini() {
    console.log("🔍 Verifying Gemini functionality...");

    try {
        const gemini = getGeminiClient();
        console.log("✅ Gemini Client initialized");

        // Check provider via internal property access
        const provider = (gemini as any).provider;
        console.log(`ℹ️  Active AI Provider: ${provider?.toUpperCase() || 'UNKNOWN'}`);

        console.log("Generating test content...");

        const result = await gemini.generateText(undefined, 'Say "Gemini is working!"', {
            maxTokens: 50
        });

        console.log("\n🤖 RESPONSE:");
        console.log(result);

        console.log("\n✅ AI System is working correctly.");
    } catch (error: any) {
        console.error("\n❌ Verification failed:", error);
        process.exit(1);
    }
}

verifyGemini();
