"use server";

import { getDb } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function reportSpam(reportedUserId: string, reason: string = "spam") {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const sql = getDb();

    // 1. Create Report
    try {
        await sql`
      INSERT INTO spam_reports (reporter_id, reported_id, reason)
      VALUES (${user.id}, ${reportedUserId}, ${reason})
    `;
    } catch (error: any) {
        // Ignore duplicate reports gracefully
        if (error.code === '23505') { // Unique violation
            console.log("Duplicate report ignored");
            return { success: true, message: "Report already submitted" };
        }
        throw error;
    }

    // 2. Logic for auto-ban is handled by DB Trigger (check_spam_reports_threshold)
    // But we can also check here if we wanted to show immediate feedback.

    return { success: true };
}
