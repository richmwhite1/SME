import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { resourceId } = await request.json();

    if (!resourceId) {
      return NextResponse.json(
        { message: 'Resource ID is required' },
        { status: 400 }
      );
    }

    const sql = getDb();

    // Try to get from resource_library view first
    let result = await sql`
      SELECT title, reference_url, origin_type, origin_id, id
      FROM resource_library
      WHERE origin_id = ${resourceId}
      LIMIT 1
    `;

    if (result && result.length > 0) {
      const resourceData = result[0];
      let aiSummary = null;
      let integrityLevel = "Reference";

      // Get AI summary and integrity level from source if it's a product
      if (resourceData.origin_type === "Product") {
        const protocolResult = await sql`
          SELECT ai_summary, third_party_lab_verified, purity_verified
          FROM protocols
          WHERE id = ${resourceId}
          LIMIT 1
        `;

        if (protocolResult && protocolResult.length > 0) {
          const protocol = protocolResult[0];
          aiSummary = protocol.ai_summary;
          if (protocol.third_party_lab_verified) {
            integrityLevel = "Lab Report";
          } else if (protocol.purity_verified) {
            integrityLevel = "Purity Verified";
          } else {
            integrityLevel = "Product Reference";
          }
        }
      } else if (resourceData.origin_type === "Discussion") {
        integrityLevel = "Discussion Reference";
      }

      return NextResponse.json({
        title: resourceData.title,
        ai_summary: aiSummary,
        reference_url: resourceData.reference_url,
        integrity_level: integrityLevel,
        origin_type: resourceData.origin_type,
      });
    }

    // If not in resource_library, try protocols
    result = await sql`
      SELECT title, reference_url, ai_summary
      FROM protocols
      WHERE id = ${resourceId}
      LIMIT 1
    `;

    if (result && result.length > 0) {
      const protocol = result[0];
      return NextResponse.json({
        title: protocol.title,
        ai_summary: protocol.ai_summary,
        reference_url: protocol.reference_url,
        integrity_level: "Product Reference",
        origin_type: "Product",
      });
    }

    // If not in protocols, try discussions
    result = await sql`
      SELECT title, reference_url
      FROM discussions
      WHERE id = ${resourceId}
      LIMIT 1
    `;

    if (result && result.length > 0) {
      const discussion = result[0];
      return NextResponse.json({
        title: discussion.title,
        ai_summary: null,
        reference_url: discussion.reference_url,
        integrity_level: "Discussion Reference",
        origin_type: "Discussion",
      });
    }

    // Resource not found
    return NextResponse.json(
      { message: 'Resource not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching resource data:', error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to fetch resource data',
      },
      { status: 500 }
    );
  }
}
