import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const db = getDb();

    try {
        await db`
      DO $$
      BEGIN
          -- Add sme_signals column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sme_signals') THEN
              ALTER TABLE products ADD COLUMN sme_signals JSONB DEFAULT '{}'::jsonb;
          END IF;

          -- Add truth_evidence column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'truth_evidence') THEN
              ALTER TABLE products ADD COLUMN truth_evidence JSONB DEFAULT '{}'::jsonb;
          END IF;

          -- Add sme_access_note column if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sme_access_note') THEN
              ALTER TABLE products ADD COLUMN sme_access_note TEXT;
          END IF;
      END $$;
    `;

        return NextResponse.json({ success: true, message: 'Migration applied successfully' });
    } catch (error) {
        console.error('Migration failed:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
