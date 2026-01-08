"use server";

import { analyzeUrl } from "@/lib/ai/content-analyzer";

export interface AnalysisResponse {
    success: boolean;
    content?: string;
    error?: string;
}

/**
 * Server Action to analyze a resource (YouTube URL, PDF, or Web Page)
 */
export async function analyzeResource(url: string): Promise<AnalysisResponse> {
    if (!url) {
        return { success: false, error: "URL is required" };
    }

    try {
        // analyzeUrl handles routing to YouTube, PDF, or Article parser automatically
        const analysis = await analyzeUrl(url);
        return { success: true, content: analysis };
    } catch (error: any) {
        console.error("Analysis Action Error:", error);
        return { success: false, error: error.message || "Failed to analyze resource" };
    }
}
