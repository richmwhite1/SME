import { analyzeYouTubeVideo } from '../lib/ai/content-analyzer';

const TEST_URL = "https://www.youtube.com/watch?v=H-XfCl-HpRM"; // Huberman Lab - Sleep (Valid captions)

async function test() {
    console.log("Testing YouTube Analysis on URL:", TEST_URL);
    try {
        const result = await analyzeYouTubeVideo(TEST_URL);
        console.log("✅ Success!");
        console.log("Preview:", result.substring(0, 500));
    } catch (error) {
        console.error("❌ Failed:", error);
    }
}

test();
