import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
// Revalidate every hour
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const p1 = searchParams.get('p1') || searchParams.get('a');
    const p2 = searchParams.get('p2') || searchParams.get('b');

    if (!p1 || !p2) {
      return new Response('Missing product IDs', { status: 400 });
    }

    const sql = getDb();

    // Fetch both products
    const [productAResult, productBResult] = await Promise.all([
      sql`SELECT * FROM products WHERE id = ${p1} LIMIT 1`,
      sql`SELECT * FROM products WHERE id = ${p2} LIMIT 1`
    ]);

    const productA = productAResult?.[0];
    const productB = productBResult?.[0];

    if (!productA || !productB) {
      return new Response('Product not found', { status: 404 });
    }

    // Calculate 5-Pillar completion
    const getPillarCount = (product: any) => {
      let count = 0;
      if (product.source_transparency) count++;
      if (product.purity_tested) count++;
      if (product.potency_verified) count++;
      if (product.excipient_audit) count++;
      if (product.operational_legitimacy) count++;
      return count;
    };

    const pillarCountA = getPillarCount(productA);
    const pillarCountB = getPillarCount(productB);

    // Parse images
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
          return [];
        }
      }
      return [];
    };

    const imagesA = parseImages(productA.images);
    const imagesB = parseImages(productB.images);

    // Generate OG image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0F0D', // Forest Obsidian
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Product A Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50%',
              height: '100%',
              borderRight: '2px solid rgba(16, 185, 129, 0.2)',
              padding: '40px',
            }}
          >
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
                marginBottom: '30px',
                position: 'relative',
              }}
            >
              {imagesA.length > 0 ? (
                <img
                  src={imagesA[0]}
                  alt={productA.title}
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
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    padding: '10px',
                  }}
                >
                  Specimen Under Audit
                </div>
              )}
              {productA.is_sme_certified && (
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
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '20px',
                maxWidth: '400px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {productA.title}
            </div>

            {/* 5-Pillar Checklist */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '20px',
                width: '100%',
                maxWidth: '300px',
              }}
            >
              <div
                style={{
                  color: '#F1F5F9',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                }}
              >
                SME Standards: {pillarCountA}/5
              </div>
              {[
                { name: 'Source Transparency', value: productA.source_transparency },
                { name: 'Purity Tested', value: productA.purity_tested },
                { name: 'Potency Verified', value: productA.potency_verified },
                { name: 'Excipient Audit', value: productA.excipient_audit },
                { name: 'Operational Legitimacy', value: productA.operational_legitimacy },
              ].map((pillar, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: pillar.value ? '#B8860B' : 'rgba(241, 245, 249, 0.3)',
                    fontFamily: 'monospace',
                  }}
                >
                  <span>{pillar.value ? '✓' : '○'}</span>
                  <span>{pillar.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* VS Divider */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#0A0F0D',
              padding: '10px 20px',
              border: '2px solid #B8860B',
              color: '#B8860B',
              fontSize: '18px',
              fontWeight: 'bold',
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            VS
          </div>

          {/* Product B Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '50%',
              height: '100%',
              padding: '40px',
            }}
          >
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
                marginBottom: '30px',
                position: 'relative',
              }}
            >
              {imagesB.length > 0 ? (
                <img
                  src={imagesB[0]}
                  alt={productB.title}
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
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    padding: '10px',
                  }}
                >
                  Specimen Under Audit
                </div>
              )}
              {productB.is_sme_certified && (
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
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '20px',
                maxWidth: '400px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {productB.title}
            </div>

            {/* 5-Pillar Checklist */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                marginBottom: '20px',
                width: '100%',
                maxWidth: '300px',
              }}
            >
              <div
                style={{
                  color: '#F1F5F9',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                }}
              >
                SME Standards: {pillarCountB}/5
              </div>
              {[
                { name: 'Source Transparency', value: productB.source_transparency },
                { name: 'Purity Tested', value: productB.purity_tested },
                { name: 'Potency Verified', value: productB.potency_verified },
                { name: 'Excipient Audit', value: productB.excipient_audit },
                { name: 'Operational Legitimacy', value: productB.operational_legitimacy },
              ].map((pillar, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: pillar.value ? '#B8860B' : 'rgba(241, 245, 249, 0.3)',
                    fontFamily: 'monospace',
                  }}
                >
                  <span>{pillar.value ? '✓' : '○'}</span>
                  <span>{pillar.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('Error generating OG image:', error);
    return new Response(`Failed to generate image: ${error.message}`, { status: 500 });
  }
}



