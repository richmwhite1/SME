import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemma Client for AI operations
 * Centralized client for all Gemma/Gemini model interactions
 * Supports both Google Cloud API and local Ollama
 */

export type GemmaModel = 'gemini-2.0-flash' | 'gemma:2b' | 'gemma:7b';

export type AIProvider = 'google' | 'ollama';

export interface GemmaGenerateOptions {
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

class GemmaClient {
    private googleClient: GoogleGenerativeAI | null = null;
    private provider: AIProvider = 'google';
    private ollamaBaseUrl: string = 'http://127.0.0.1:11434';

    // Default models per provider
    private readonly googleModel: string = 'gemini-2.0-flash';
    private readonly ollamaModel: string = 'gemma:2b';

    constructor() {
        const providerEnv = process.env.AI_PROVIDER?.toLowerCase();

        if (providerEnv === 'ollama') {
            this.provider = 'ollama';
            this.ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
            console.log(`🤖 AI Client initialized with OLLAMA provider (${this.ollamaBaseUrl})`);
        } else {
            this.provider = 'google';
            const apiKey = process.env.GOOGLE_AI_API_KEY;
            if (!apiKey) {
                console.warn('⚠️ GOOGLE_AI_API_KEY not set and provider is google. AI features may fail.');
            } else {
                this.googleClient = new GoogleGenerativeAI(apiKey);
            }
        }
    }

    /**
     * Generate text using the configured provider
     */
    async generateText(
        modelOverride: string | undefined, // Pass undefined to use default
        prompt: string,
        options: GemmaGenerateOptions = {}
    ): Promise<string> {
        if (this.provider === 'ollama') {
            return this.generateWithOllama(modelOverride || this.ollamaModel, prompt, options);
        } else {
            return this.generateWithGoogle(modelOverride || this.googleModel, prompt, options);
        }
    }

    private async generateWithGoogle(
        model: string,
        prompt: string,
        options: GemmaGenerateOptions
    ): Promise<string> {
        if (!this.googleClient) {
            throw new Error('Google AI Client not initialized (missing API key)');
        }

        try {
            // Map legacy gemma names to gemini if we are forced to use google but request came for gemma
            let targetModel = model;
            if (model.includes('gemma') && !model.includes('gemini')) {
                const apiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];
                targetModel = apiModels[0];
            }

            const gemmaModel = this.googleClient.getGenerativeModel({
                model: targetModel,
                generationConfig: {
                    temperature: options.temperature ?? 0.3,
                    maxOutputTokens: options.maxTokens ?? 500,
                    topP: options.topP ?? 0.95,
                    topK: options.topK ?? 40,
                    responseMimeType: options.jsonMode ? "application/json" : "text/plain",
                }
            });

            const result = await gemmaModel.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            if (!text) {
                throw new Error('No text generated from Google AI model');
            }

            return text.trim();
        } catch (error) {
            console.error('Error generating text with Google AI:', error);
            throw error;
        }
    }

    private async generateWithOllama(
        model: string,
        prompt: string,
        options: GemmaGenerateOptions
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
            // Hint to user if connection failed
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error(`Ollama connection failed. Is Ollama running at ${this.ollamaBaseUrl}?`);
            }
            throw error;
        }
    }

    /**
     * Moderate content with credibility-aware logic
     */
    async moderateContent(
        content: string,
        context: ModerationContext = {}
    ): Promise<ModerationResult> {
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

            // Use undefined model to trigger default for provider
            const response = await this.generateText(undefined, prompt, {
                temperature: 0.2,
                maxTokens: 150,
                jsonMode: true // Helper for providers that support it
            });

            console.log('Raw AI moderation response:', response);

            // Extract JSON from response 
            let jsonStr = response.trim();
            // Basic cleanup if model adds code blocks
            jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');

            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            }

            const result = JSON.parse(jsonStr) as ModerationResult;

            // Apply credibility adjustment
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
     * Extract intent from natural language query
     */
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

let gemmaClientInstance: GemmaClient | null = null;

export function getGemmaClient(): GemmaClient {
    if (!gemmaClientInstance) {
        gemmaClientInstance = new GemmaClient();
    }
    return gemmaClientInstance;
}

export default GemmaClient;
