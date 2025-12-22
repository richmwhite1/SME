
import { NextResponse } from 'next/server';

export async function GET() {
    let databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        return NextResponse.json({ error: "DATABASE_URL is undefined or empty" });
    }

    const original = databaseUrl;

    // Logic from db.ts
    if (databaseUrl.includes("DATABASE_URL=")) {
        databaseUrl = databaseUrl.split("DATABASE_URL=").pop() || databaseUrl;
    }

    // Remove surrounding quotes if any
    databaseUrl = databaseUrl.replace(/^["']|["']$/g, '').trim();

    const fixed = databaseUrl;
    let isValid = false;
    let error = "";

    try {
        new URL(fixed);
        isValid = true;
    } catch (e) {
        error = String(e);
    }

    return NextResponse.json({
        original,
        fixed,
        isValid,
        error,
        split_result: original.split("DATABASE_URL=")
    });
}
