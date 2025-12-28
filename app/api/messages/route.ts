import { sendMessage } from "@/app/actions/messages";
import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { recipientId, content, honeypot } = body;

        if (!recipientId || !content) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Reuse the secure server action logic
        await sendMessage(recipientId, content, honeypot);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[MESSAGES_POST]", error);
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}
