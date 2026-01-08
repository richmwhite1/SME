import { config } from 'dotenv';
config({ path: '.env.local' });
import { analyzeUrl } from '../lib/ai/content-analyzer';

const SOURCES = [
    { type: 'YOUTUBE', url: "https://www.youtube.com/watch?v=H-XfCl-HpRM" },
    { type: 'WEB', url: "https://example.com" }, // Simple test
    { type: 'PDF', url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" } // Simple PDF
];

async function test() {
    console.log("🚀 Starting Universal Analyzer Test...\n");

    for (const source of SOURCES) {
        console.log(`\n-----------------------------------`);
        console.log(`🔍 Testing ${source.type}: ${source.url}`);
        try {
            const start = Date.now();
            const result = await analyzeUrl(source.url);
            const duration = ((Date.now() - start) / 1000).toFixed(2);

            console.log(`✅ Success in ${duration}s!`);
            console.log(`📝 Preview (First 200 chars):`);
            console.log(result.substring(0, 200).replace(/\n/g, ' '));
        } catch (error: any) {
            console.error(`❌ Failed ${source.type}:`, error.message);
        }
    }
}

test();
