import { NextResponse } from "next/server";
import { seedUserReputation } from "@/app/actions/reputation-actions";

export const dynamic = "force-dynamic";

/**
 * Temporary API route to seed test user with reputation
 * DELETE THIS ROUTE AFTER TESTING IS COMPLETE
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, targetScore } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const result = await seedUserReputation(email, targetScore || 100);

        return NextResponse.json(result);
    } catch (error: any) {
        console.error("Seed user error:", error);
        return NextResponse.json(
            { error: error.message, success: false },
            { status: 500 }
        );
    }
}
