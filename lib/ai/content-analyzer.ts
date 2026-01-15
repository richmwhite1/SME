import ytdl from '@distube/ytdl-core';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
const pdf = require('pdf-parse');
import { getGeminiClient } from './gemini-client';

// ... (keep surrounding code)

// Inside functions:
// const gemini = getGeminiClient();
// return await gemini.generateText('gemini-2.0-flash-exp', prompt, { maxTokens: 2500 });
// I needed to replace multiple occurrences so I should use multi replace or just match carefully.
// The file has import at top and 3 usages. I'll use multi_replace.
// Wait, I am using replace_file_content which is single contiguous block.
// I should use multi_replace for this file.
// But I can't switch tools mid-turn easily without a return.
// I will just use replace for import first, then another call for usages or use multi replace in next turn.
// Actually I can use replace_file_content for the import, and then rely on search/replace for method calls if they are close?
// They are spread out.
// I will just use multi_replace in the "next step" (simulated).
// Actually, I can use `multi_replace_file_content` right now! usage: "Do NOT use this tool if you are only editing a single contiguous block".
// So I SHOULD use it.

// Let's use multi_replace_file_content for content-analyzer.ts.
// But first let me finish auto-tagger.ts (already issued tool call).
// I will sequence them.

// For now, I'll stick to replace_file_content for auto-tagger import which I did above.
// The next tool call will be for content-analyzer.ts using multi_replace.

export interface ContentAnalysisResult {
    summary: string;
    protocols: string[];
    claims: string[];
    sourceType: 'youtube' | 'pdf' | 'web';
}

// ==========================================
// 1. SHARED AI PROMPT LOGIC
// ==========================================

function generateAnalysisPrompt(context: { type: string, title?: string, source?: string }, content: string): string {
    return `
    Search/Context Information:
    You are analyzing ${context.type} content.
    Title: ${context.title || "Unknown"}
    Source: ${context.source || "External Link"}
    
    Content Excerpt:
    "${content.substring(0, 150000)}" 
    
    Task:
    You are an expert Health Researcher & Synthesizer. 
    Your goal is to provide a comprehensive, balanced summary that bridges scientific rigor with real-world application.
    You deal with both verified scientific data and community/anecdotal reports.
    
    Required Output Format (Markdown):
    
    ### 📝 Executive Summary
    (A detailed simplified overview of the content's main thesis. What is being proposed or claimed?)
    
    ### ⚡ Key Benefits & Claims
    (What are the purported benefits? clearly distinguish between:)
    - **Scientific Claims**: (Backed by mechanisms/studies mentioned)
    - **Anecdotal/Community Reports**: (User experiences, "n=1" reports, or subjective benefits mentioned)

    ### 🧪 Protocols & Usage
    (Specifics are crucial. Extract:)
    - **Dosage/Frequency**: (e.g., "500mg taken with morning meal")
    - **Timing/Co-factors**: (e.g., "Take with fats", "Avoid before sleep")
    - **Method**: (e.g., "Cold exposure for 3 mins")
    
    ### ⚠️ Safety, Cautions & Contraindications
    - (Side effects, warnings, or interactions mentioned)
    - (Who should strictly avoid this)

    ### 🔭 Scientific Mechanisms (Brief)
    (The "How" and "Why" - e.g., "Inhibits mTOR pathway...")
    `;
}

// ==========================================
// 2. YOUTUBE SPECIFIC LOGIC
// ==========================================

function extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function parseVtt(vtt: string): string {
    return vtt.replace(/WEBVTT/g, '').replace(/NOTE .+/g, '')
        .replace(/(\d{2}:)?\d{2}:\d{2}\.\d{3} --> (\d{2}:)?\d{2}:\d{2}\.\d{3}.*/g, ' ')
        .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function fetchTranscriptInvidious(videoId: string): Promise<string> {
    const instances = [
        'https://invidious.jing.rocks', 'https://inv.tux.pizza',
        'https://vid.puffyan.us', 'https://invidious.nerdvpn.de'
    ];
    for (const host of instances) {
        try {
            const res = await fetch(`${host}/api/v1/captions/${videoId}`, { signal: AbortSignal.timeout(3500) });
            if (!res.ok) continue;
            const data = await res.json() as any[];
            if (!Array.isArray(data)) continue;
            const track = data.find(c => c.label.startsWith('English') || c.language === 'en') || data[0];
            if (track) {
                const subRes = await fetch(`${host}${track.url}`, { signal: AbortSignal.timeout(3500) });
                if (!subRes.ok) continue;
                const vtt = await subRes.text();
                if (vtt && vtt.length > 50) return parseVtt(vtt);
            }
        } catch (e) { }
    }
    throw new Error("Could not fetch transcript from Invidious network.");
}

export async function analyzeYouTubeVideo(url: string): Promise<string> {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube URL.");

    try {
        let title = "Unknown Title";
        let description = "";
        let fullText = "";

        try {
            const info = await ytdl.getInfo(url);
            title = info.videoDetails.title;
            description = info.videoDetails.description || "";
        } catch (e) {
            console.warn("ytdl metadata fetch failed");
        }

        try {
            fullText = await fetchTranscriptInvidious(videoId);
        } catch (e) {
            console.warn("Transcript failed, falling back to description.");
            fullText = description;
            if (fullText.length < 50) throw new Error("No transcript or description available.");
        }

        const gemini = getGeminiClient();
        const prompt = generateAnalysisPrompt({ type: "YouTube Video", title, source: url }, fullText);
        return await gemini.generateText('gemini-2.0-flash-exp', prompt, { maxTokens: 2500 });

    } catch (error: any) {
        throw new Error("YouTube Analysis Failed: " + error.message);
    }
}

// ==========================================
// 3. PDF LOGIC
// ==========================================

async function analyzePdf(url: string): Promise<string> {
    try {
        console.log("Fetching PDF:", url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch PDF: ${res.statusText}`);

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const data = await pdf(buffer);
        const text = data.text;

        if (!text || text.length < 50) throw new Error("PDF text extraction failed or empty.");

        // Estimate title from first line or filename
        const title = url.split('/').pop() || "PDF Document";

        const gemini = getGeminiClient();
        const prompt = generateAnalysisPrompt({ type: "Scientific/PDF Document", title, source: url }, text);
        return await gemini.generateText('gemini-2.0-flash-exp', prompt, { maxTokens: 2500 });

    } catch (error: any) {
        console.error("PDF Analysis Error:", error);
        throw new Error("PDF Analysis Failed: " + error.message);
    }
}

// ==========================================
// 4. GENERAL WEB PAGE LOGIC
// ==========================================

async function analyzeWebPage(url: string): Promise<string> {
    try {
        console.log("Fetching Web Page:", url);
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SMEBot/1.0; +http://localhost)' }
        });
        if (!res.ok) throw new Error(`Failed to fetch page: ${res.statusText}`);

        const html = await res.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article || !article.textContent) {
            throw new Error("Could not parse article content (Readability failed).");
        }

        const gemini = getGeminiClient();
        const prompt = generateAnalysisPrompt({ type: "Web Article", title: article.title, source: url }, article.textContent);
        return await gemini.generateText('gemini-2.0-flash-exp', prompt, { maxTokens: 2500 });

    } catch (error: any) {
        console.error("Web Analysis Error:", error);
        throw new Error("Web Page Analysis Failed: " + error.message);
    }
}

// ==========================================
// 5. MAIN ENTRY POINT
// ==========================================

export async function analyzeUrl(url: string): Promise<string> {
    const lowerUrl = url.toLowerCase().trim();

    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        return analyzeYouTubeVideo(url);
    }

    if (lowerUrl.endsWith('.pdf')) {
        return analyzePdf(url);
    }

    // Default to web page
    return analyzeWebPage(url);
}

// Keeping the old export name for backward compatibility if needed, but analyzeUrl is preferred
export const analyzeYouTubeVideoOriginal = analyzeYouTubeVideo; 
