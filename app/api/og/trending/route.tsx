import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // Fetch top 3 trending products from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return new Response('Missing Supabase configuration', { status: 500 });
    }

    // Get start of this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Fetch protocols created this month
    const protocolsResponse = await fetch(
      `${supabaseUrl}/rest/v1/protocols?created_at=gte.${startOfMonth.toISOString()}&is_flagged=eq.false&select=id,title,images,tags,is_sme_certified&order=created_at.desc&limit=50`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const protocols = await protocolsResponse.json();

    if (!protocols || protocols.length === 0) {
      return new Response('No trending products found', { status: 404 });
    }

    // Fetch review counts for this month
    const reviewsResponse = await fetch(
      `${supabaseUrl}/rest/v1/reviews?created_at=gte.${startOfMonth.toISOString()}&is_flagged=eq.false&select=protocol_id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    // Fetch comment counts for this month
    const commentsResponse = await fetch(
      `${supabaseUrl}/rest/v1/product_comments?created_at=gte.${startOfMonth.toISOString()}&is_flagged=eq.false&select=protocol_id`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    const reviews = await reviewsResponse.json();
    const comments = await commentsResponse.json();

    // Calculate activity scores (reviews + comments this month)
    const protocolsWithScores = protocols.map((protocol: any) => {
      const protocolReviews = (reviews || []).filter((r: any) => r.protocol_id === protocol.id);
      const protocolComments = (comments || []).filter((c: any) => c.protocol_id === protocol.id);
      // activity_score = total community signals (reviews + comments) this month
      const activityScore = protocolReviews.length + protocolComments.length;
      
      return {
        ...protocol,
        activityScore, // Source of Truth: actual database counts
      };
    });

    // Sort by activity score (descending) and take top 3
    const top3 = protocolsWithScores
      .sort((a: any, b: any) => b.activityScore - a.activityScore)
      .slice(0, 3);

    // Parse images helper
    const parseImages = (images: any): string[] => {
      if (!images) return [];
      if (Array.isArray(images)) {
        return images.filter((img): img is string => typeof img === 'string' && img.length > 0);
      }
      if (typeof images === 'string') {
        try {
          const parsed = JSON.parse(images);
          if (Array.isArray(parsed)) return parsed.filter((img: any): img is string => typeof img === 'string' && img.length > 0);
        } catch {
          // Try PostgreSQL array format
          const arrayMatch = images.match(/^\{([^}]*)\}$/);
          if (arrayMatch) {
            return arrayMatch[1]
              .split(',')
              .map((s: string) => s.trim().replace(/^"|"$/g, ''))
              .filter((img: string): img is string => img.length > 0);
          }
        }
      }
      return [];
    };

    // Get first tag as category
    const getCategory = (tags: any): string => {
      if (!tags) return 'Product';
      if (Array.isArray(tags) && tags.length > 0) return tags[0];
      if (typeof tags === 'string') {
        try {
          const parsed = JSON.parse(tags);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
        } catch {
          return 'Product';
        }
      }
      return 'Product';
    };

    // Generate OG image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0A0F0D', // Forest Obsidian
            position: 'relative',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* SME Vibe Watermark */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              color: 'rgba(241, 245, 249, 0.1)',
              fontSize: '60px',
              fontFamily: 'serif',
              fontWeight: 'bold',
              letterSpacing: '4px',
            }}
          >
            SME
          </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '60px',
              paddingBottom: '40px',
            }}
          >
            <div
              style={{
                color: '#F1F5F9', // Bone White
                fontSize: '48px',
                fontWeight: 'bold',
                fontFamily: 'serif',
                marginBottom: '10px',
              }}
            >
              Community Pulse
            </div>
            <div
              style={{
                color: 'rgba(241, 245, 249, 0.7)',
                fontSize: '24px',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              Top Audits This Month
            </div>
          </div>

          {/* Top 3 Products */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: '40px',
              padding: '0 60px',
              flex: 1,
            }}
          >
            {top3.map((product: any, index: number) => {
              const rank = index + 1;
              const images = parseImages(product.images);
              const hasImage = images.length > 0 && images[0]?.startsWith('http');
              const category = getCategory(product.tags);

              return (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '300px',
                  }}
                >
                  {/* Rank Indicator */}
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#B8860B', // SME Gold
                      color: '#0A0F0D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      fontFamily: 'serif',
                      marginBottom: '20px',
                    }}
                  >
                    {rank}
                  </div>

                  {/* Product Image or Placeholder */}
                  <div
                    style={{
                      width: '200px',
                      height: '200px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(241, 245, 249, 0.2)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      marginBottom: '20px',
                      position: 'relative',
                    }}
                  >
                    {hasImage ? (
                      <img
                        src={images[0]}
                        alt={product.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          color: '#F1F5F9',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                          textAlign: 'center',
                          padding: '20px',
                          border: '1px solid rgba(241, 245, 249, 0.3)',
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        }}
                      >
                        Specimen Under Audit
                      </div>
                    )}
                    {product.is_sme_certified && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          backgroundColor: '#B8860B',
                          color: '#0A0F0D',
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                        }}
                      >
                        SME
                      </div>
                    )}
                  </div>

                  {/* Product Title */}
                  <div
                    style={{
                      color: '#F1F5F9',
                      fontSize: '20px',
                      fontWeight: 'bold',
                      fontFamily: 'serif',
                      textAlign: 'center',
                      marginBottom: '8px',
                      maxWidth: '280px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {product.title}
                  </div>

                  {/* Category */}
                  <div
                    style={{
                      color: 'rgba(241, 245, 249, 0.6)',
                      fontSize: '14px',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '12px',
                    }}
                  >
                    {category}
                  </div>

                  {/* Activity Score */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        color: '#10B981', // Heart Green
                        fontSize: '18px',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                      }}
                    >
                      {product.activityScore}
                    </div>
                    <div
                      style={{
                        color: 'rgba(241, 245, 249, 0.6)',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                      }}
                    >
                      Signals
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('Error generating trending OG image:', error);
    return new Response(`Failed to generate image: ${error.message}`, { status: 500 });
  }
}



