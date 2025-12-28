import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const sql = getDb();
    const searchParams = req.nextUrl.searchParams;
    const since = searchParams.get("since");
    const topicsParam = searchParams.get("topics");

    if (!since) {
        return NextResponse.json({ error: "Missing since parameter" }, { status: 400 });
    }

    const sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    try {
        const topics = topicsParam ? topicsParam.split(",") : [];

        // Base query conditions
        const timeFilter = sql`created_at > ${sinceDate}`;

        // 1. Count new discussions
        let discussionQuery = sql`
      SELECT COUNT(*) as count 
      FROM discussions 
      WHERE ${timeFilter}
    `;

        // Add topic filter if topics are provided
        if (topics.length > 0) {
            // Assuming discussions have a tags array column. 
            // If tags are in a separate table, this query would need a JOIN.
            // Based on previous schema checks, discussions have a tags column (text[]).
            discussionQuery = sql`
        SELECT COUNT(*) as count 
        FROM discussions 
        WHERE ${timeFilter} AND tags && ${topics}
      `;
        }

        const [discussionsResult] = await discussionQuery;
        const newDiscussionsCount = parseInt(discussionsResult.count);

        // 2. Count new products (if products relevant to topics)
        // For simplicity, just checking time for now, can add topic filtering later if products have tags
        const [productsResult] = await sql`
      SELECT COUNT(*) as count 
      FROM products 
      WHERE ${timeFilter}
    `;
        const newProductsCount = parseInt(productsResult.count);

        // Total count
        const totalNew = newDiscussionsCount + newProductsCount;

        return NextResponse.json({
            hasNewContent: totalNew > 0,
            count: totalNew,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("Error checking for new feed content:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
