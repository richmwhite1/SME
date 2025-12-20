import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json(
        { message: 'Product ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    const result = await sql`
      SELECT 
        id,
        title,
        problem_solved,
        images,
        is_sme_certified,
        source_transparency,
        purity_tested,
        potency_verified,
        excipient_audit,
        operational_legitimacy,
        third_party_lab_verified,
        ai_summary,
        buy_url,
        coa_url,
        lab_pdf_url
      FROM protocols
      WHERE id = ${productId}
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to fetch product',
      },
      { status: 500 }
    );
  }
}
