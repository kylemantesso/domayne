import { NextRequest, NextResponse } from 'next/server';
import { addOffer, getOffersByMaker } from '@/server/store/offers';

// CORS headers for allowing static sites to submit orders
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const maker = (url.searchParams.get('maker') || '').toLowerCase();
  if (!maker) {
    return NextResponse.json({ error: 'maker is required' }, { status: 400, headers: corsHeaders });
  }
  try {
    const list = getOffersByMaker(maker);
    return NextResponse.json({ offers: list }, { headers: corsHeaders });
  } catch {
    return NextResponse.json({ error: 'failed to fetch offers' }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Submit a signed offer to Doma orderbook
 * The frontend uses the SDK to create and sign the offer, then sends it here
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderbook, chainId, parameters, signature, domain } = body;

    // Validate required fields
    if (!orderbook || !chainId || !parameters || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: orderbook, chainId, parameters, signature' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get API key from environment variables (backend only)
    const apiKey = process.env.DOMA_API_KEY;
    if (!apiKey) {
      console.error('DOMA_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Submitting signed offer to Doma API...');
    console.log('Offer details:', { orderbook, chainId, domain });

    // Call Doma Orderbook API to submit the offer
    const domaResponse = await fetch('https://api-testnet.doma.xyz/v1/orderbook/offer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        orderbook,
        chainId,
        parameters,
        signature,
      }),
    });

    if (!domaResponse.ok) {
      const errorData = await domaResponse.json().catch(() => ({}));
      console.error('Doma API error:', domaResponse.status, errorData);
      console.error('Request payload:', { orderbook, chainId, parameters, signature });
      
      return NextResponse.json(
        { 
          error: `Doma API error: ${domaResponse.status}`,
          details: errorData.message || errorData.details || errorData || 'Unknown error'
        },
        { status: domaResponse.status, headers: corsHeaders }
      );
    }

    const responseData = await domaResponse.json();
    
    // Log successful offer creation
    console.log(`Successfully created Doma offer for ${domain}:`, responseData);

    try {
      addOffer({
        orderId: String(responseData.offerId || responseData.id || ''),
        maker: (parameters?.offerer || ''),
        chainId,
        params: parameters,
        createdAt: Date.now(),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      offerId: responseData.offerId || responseData.id,
      domain,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error submitting offer:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500, headers: corsHeaders }
    );
  }
}

