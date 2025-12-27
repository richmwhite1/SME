import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Temporary API route to demote test user for testing demotion flow
 * DELETE THIS ROUTE AFTER TESTING IS COMPLETE
 */
export async function POST() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const sql = getDb();

        // Set reputation to 50 (below threshold)
        await sql`
      UPDATE profiles
      SET reputation_score = 50
      WHERE email = 'richmwhite@gmail.com'
    `;

        // Get updated status
        const updatedUser = await sql`
      SELECT id, email, reputation_score, is_sme
      FROM profiles
      WHERE email = 'richmwhite@gmail.com'
    `;

        return NextResponse.json({
            success: true,
            message: "Test user demoted",
            data: updatedUser[0],
        });
    } catch (error: any) {
        console.error("Demote user error:", error);
        return NextResponse.json(
            { error: error.message, success: false },
            { status: 500 }
        );
    }
}
