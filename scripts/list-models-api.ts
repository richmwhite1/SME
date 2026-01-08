
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkModels() {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) {
        console.error("No API KEY");
        return;
    }

    console.log("Fetching models with key:", key.substring(0, 10) + "...");

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.error) {
            console.error("API Error:", data.error);
            return;
        }

        if (data.models) {
            console.log("\n✅ Available Models:");
            data.models.forEach((m: any) => {
                if (m.name.includes('gemma') || m.name.includes('gemini')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                    console.log(`  Methods: ${m.supportedGenerationMethods?.join(', ')}`);
                }
            });
        } else {
            console.log("No models returned. Response:", data);
        }

    } catch (e) {
        console.error("Fetch error:", e);
    }
}

checkModels();
