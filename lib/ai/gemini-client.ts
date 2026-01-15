// @ts-ignore - types might be missing or in beta for the new SDK
import { GoogleGenAI } from '@google/genai';

/**
 * Gemini Client for AI operations
 * Centralized client for all Gemini model interactions
 * Supports Google Cloud (Vertex AI / Gemini API) and local Ollama
 */

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemma:2b' | 'gemma:7b';

export type AIProvider = 'google' | 'ollama' | 'vertex';

export interface GeminiGenerateOptions {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    jsonMode?: boolean;
}

export interface ModerationContext {
    userId?: string;
    userReputation?: number;
    isSme?: boolean;
    productId?: string;
    isVerifiedProduct?: boolean;
}

export interface ModerationResult {
    isSafe: boolean;
    reason: string;
    confidence: 'high' | 'low';
    credibilityAdjusted?: boolean;
}

export interface IntentResult {
    topic: string;
    intent: 'health_benefits' | 'product_recommendation' | 'safety_info' | 'general_inquiry';
    keywords: string[];
    confidence: number;
}

class GeminiClient {
    private client: any | null = null; // GoogleGenAI instance
    private provider: AIProvider = 'google';
    private ollamaBaseUrl: string = 'http://127.0.0.1:11434';

    // Default models per provider
    private readonly googleModel: string = 'gemini-2.0-flash-exp';
    private readonly vertexModel: string = 'gemini-2.0-flash-exp'; // Using 2.0 Flash Exp as it is verified working
    private readonly ollamaModel: string = 'gemma:2b';

    constructor() {
        const providerEnv = process.env.AI_PROVIDER?.toLowerCase();
        const vertexProject = process.env.GOOGLE_VERTEX_PROJECT;
        const vertexLocation = process.env.GOOGLE_VERTEX_LOCATION;
        const vertexApiKey = process.env.GOOGLE_VERTEX_API_KEY;

        if (providerEnv === 'ollama') {
            this.provider = 'ollama';
            this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
            console.log(`🤖 AI Client initialized with OLLAMA provider (${this.ollamaBaseUrl})`);
        } else if (vertexProject && vertexLocation) {
            this.provider = 'vertex';

            try {
                // Initialize @google/genai for Vertex AI
                // The SDK enforces strict separation: 
                // - apiKey -> Generative Language API (Express Mode)
                // - vertexAI: true + project/location -> Vertex AI API (ADC Auth)

                if (vertexApiKey) {
                    // Express Mode: Uses API Key, targets Generative Language API
                    // We intentionally omit vertexAI: true and project/location as they conflict with apiKey in the SDK
                    this.client = new GoogleGenAI({ apiKey: vertexApiKey });
                    console.log(`🤖 AI Client initialized with @google/genai (Express Mode via API Key: ${this.vertexModel})`);
                } else {
                    // Standard Vertex (ADC / Service Account)
                    this.client = new GoogleGenAI({
                        vertexai: true,
                        project: vertexProject,
                        location: vertexLocation
                    });
                    console.log(`🤖 AI Client initialized with @google/genai (Vertex AI ADC: ${this.vertexModel})`);
                }
            } catch (e) {
                console.error("Failed to initialize @google/genai:", e);
            }

        } else {
            // Legacy/Personal AI Studio Fallback
            this.provider = 'google';
            const apiKey = process.env.GOOGLE_AI_API_KEY;
            if (!apiKey) {
                console.warn('⚠️ GOOGLE_AI_API_KEY not set and provider is google. AI features may fail.');
            } else {
                this.client = new GoogleGenAI({ apiKey });
            }
        }
    }

    /**
     * Generate text using the configured provider
     */
    async generateText(
        modelOverride: string | undefined, // Pass undefined to use default
        prompt: string,
        options: GeminiGenerateOptions = {}
    ): Promise<string> {
        if (this.provider === 'ollama') {
            return this.generateWithOllama(modelOverride || this.ollamaModel, prompt, options);
        } else {
            // Both 'google' and 'vertex' utilize the same SDK instance now
            const modelName = this.provider === 'vertex'
                ? (modelOverride || this.vertexModel)
                : (modelOverride || this.googleModel);

            return this.generateWithGoogleGenAI(modelName, prompt, options);
        }
    }

    private async generateWithGoogleGenAI(
        model: string,
        prompt: string,
        options: GeminiGenerateOptions
    ): Promise<string> {
        if (!this.client) {
            throw new Error('Google/Vertex AI Client not initialized');
        }

        try {
            // Map legacy gemma names if needed
            let targetModel = model;
            if (model.includes('gemma') && !model.includes('gemini') && this.provider !== 'ollama') {
                const apiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
                targetModel = apiModels[0];
            }

            // Prepare config
            const config = {
                temperature: options.temperature ?? 0.3,
                maxOutputTokens: options.maxTokens ?? 500,
                topP: options.topP ?? 0.95,
                topK: options.topK ?? 40,
                responseMimeType: options.jsonMode ? "application/json" : "text/plain",
            };

            // Call models.generateContent (Unified SDK Syntax)
            const response = await this.client.models.generateContent({
                model: targetModel,
                config: config,
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ]
            });

            // Parse response
            let text = '';
            // @ts-ignore
            if (typeof response.text === 'function') {
                // @ts-ignore
                text = response.text();
            } else if (typeof response.text === 'string') {
                // @ts-ignore
                text = response.text;
            } else if (
                response.candidates &&
                response.candidates.length > 0 &&
                response.candidates[0].content &&
                response.candidates[0].content.parts &&
                response.candidates[0].content.parts.length > 0
            ) {
                text = response.candidates[0].content.parts[0].text || '';
            }

            if (!text) {
                // Debug: Log full response if text missing
                console.error("Full Response Structure:", JSON.stringify(response, null, 2));
                throw new Error('No text generated from AI model');
            }

            return typeof text === 'string' ? text.trim() : String(text).trim();
        } catch (error) {
            console.error('Error generating text with Google/Vertex AI:', error);
            throw error;
        }
    }

    private async generateWithOllama(
        model: string,
        prompt: string,
        options: GeminiGenerateOptions
    ): Promise<string> {
        try {
            const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: options.temperature ?? 0.3,
                        num_predict: options.maxTokens ?? 500,
                        top_p: options.topP ?? 0.95,
                        top_k: options.topK ?? 40,
                    },
                    format: options.jsonMode ? 'json' : undefined
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.response.trim();
        } catch (error) {
            console.error('Error generating text with Ollama:', error);
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error(`Ollama connection failed. Is Ollama running at ${this.ollamaBaseUrl}?`);
            }
            throw error;
        }
    }

    /**
     * Moderate content
     */
    async moderateContent(
        content: string,
        context: ModerationContext = {}
    ): Promise<ModerationResult> {
        // Reuse generateText (which uses generateWithGoogleGenAI)
        try {
            const credibilityContext = this.buildCredibilityContext(context);
            const prompt = `You are a content moderator for a health science platform.
${credibilityContext}

Review this content: "${content}"

Decision Logic:
1. HATE/HARASSMENT/PROFANITY -> { "isSafe": false, "reason": "Inappropriate", "confidence": "high" }
2. TECHNICAL/SCIENTIFIC -> { "isSafe": true, "reason": "Technical", "confidence": "high" }
3. PERSONAL EXPERIENCE -> { "isSafe": true, "reason": "Personal", "confidence": "high" }
4. BORDERLINE -> { "isSafe": true, "reason": "Borderline", "confidence": "low" }

IMPORTANT: SME users get benefit of doubt.

Respond with ONLY valid JSON:
{ "isSafe": true, "reason": "explanation", "confidence": "high" }`;

            const response = await this.generateText(undefined, prompt, {
                temperature: 0.2,
                maxTokens: 150,
                jsonMode: true
            });

            console.log('Raw AI moderation response:', response);

            let jsonStr = response.trim();
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            }

            const result = JSON.parse(jsonStr) as ModerationResult;

            if (context.isSme && result.confidence === 'low' && !result.isSafe) {
                result.isSafe = true;
                result.reason = 'Approved due to SME status (borderline content)';
                result.credibilityAdjusted = true;
            }
            return result;
        } catch (error) {
            console.error('Error in AI moderation:', error);
            return {
                isSafe: false,
                reason: 'Moderation system error - content blocked for safety',
                confidence: 'high',
            };
        }
    }

    /**
     * Generate text from image input (Vision)
     */
    async generateWithVision(
        prompt: string,
        imageBase64: string,
        mimeType: string = "image/jpeg",
        options: GeminiGenerateOptions = {}
    ): Promise<string> {
        if (this.provider === 'ollama') {
            throw new Error("Vision capabilities are currently only supported with Google/Vertex AI provider.");
        }

        if (!this.client) {
            throw new Error('Google/Vertex AI Client not initialized');
        }

        try {
            // For Vertex, we ideally use gemini-1.5-flash or pro. 
            // Defaulting to the configured model or 1.5-flash
            const modelName = this.provider === 'vertex' ? 'gemini-1.5-flash' : 'gemini-2.0-flash';

            const config = {
                temperature: options.temperature ?? 0.3,
                maxOutputTokens: options.maxTokens ?? 1000,
                responseMimeType: options.jsonMode ? "application/json" : "text/plain",
            };

            const response = await this.client.models.generateContent({
                model: modelName,
                config: config,
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    data: imageBase64,
                                    mimeType: mimeType
                                }
                            }
                        ]
                    }
                ]
            });

            const text = response.text ? response.text() : response?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                if (response && response.candidates && response.candidates.length > 0) {
                    return response.candidates[0].content.parts[0].text;
                }
                throw new Error('No analysis generated');
            }

            return typeof text === 'string' ? text.trim() : String(text).trim();

        } catch (error) {
            console.error('Error in Vision analysis:', error);
            throw error;
        }
    }

    async extractIntent(query: string): Promise<IntentResult> {
        try {
            const prompt = `Extract intent from this health query: "${query}"

Return JSON with:
- topic: main subject
- intent: one of ["health_benefits", "product_recommendation", "safety_info", "general_inquiry"]
- keywords: string array
- confidence: 0-1 number

Example: "Is turmeric safe?" -> { "topic": "turmeric", "intent": "safety_info", "keywords": ["turmeric","safe"], "confidence": 0.9 }`;

            const response = await this.generateText(undefined, prompt, {
                temperature: 0.3,
                maxTokens: 150,
                jsonMode: true
            });

            let jsonStr = response.trim();
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            }

            const result = JSON.parse(jsonStr) as IntentResult;
            return result;
        } catch (error) {
            console.error('Error extracting intent:', error);
            return {
                topic: query.toLowerCase().split(' ').slice(0, 2).join(' '),
                intent: 'general_inquiry',
                keywords: query.toLowerCase().split(' '),
                confidence: 0.5,
            };
        }
    }

    private buildCredibilityContext(context: ModerationContext): string {
        const parts: string[] = [];
        if (context.isSme) {
            parts.push('User Context: Subject Matter Expert (SME)');
        } else if (context.userReputation && context.userReputation >= 50) {
            parts.push(`User Context: High-reputation member (${context.userReputation})`);
        }
        if (context.isVerifiedProduct) {
            parts.push('Product Context: SME-certified product');
        }
        return parts.join('\n');
    }
}

let geminiClientInstance: GeminiClient | null = null;

export function getGeminiClient(): GeminiClient {
    if (!geminiClientInstance) {
        geminiClientInstance = new GeminiClient();
    }
    return geminiClientInstance;
}

export default GeminiClient;
