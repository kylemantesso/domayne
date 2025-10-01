import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to fetch Doma orderbook fees
 * This keeps the ORDERBOOK API key secure on the backend
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderbook = searchParams.get('orderbook') || 'DOMA';
    const chainId = searchParams.get('chainId') || 'eip155:11155111';
    const contract = searchParams.get('contract');
    const tokenId = searchParams.get('tokenId');

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract address is required' },
        { status: 400 }
      );
    }

    // Get API key from environment variables (backend only)
    const apiKey = process.env.DOMA_API_KEY;
    if (!apiKey) {
      console.error('DOMA_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }

    // Construct the fee endpoint URL
    const identifier = tokenId ? `${contract}:${tokenId}` : contract;
    const feeUrl = `https://api-testnet.doma.xyz/v1/orderbook/fee/${orderbook}/${chainId}/${identifier}`;

    console.log('Fetching fees from Doma:', feeUrl);

    const response = await fetch(feeUrl, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Doma fee fetch failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Doma API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const fees = await response.json();
    
    return NextResponse.json({
      success: true,
      fees
    });

  } catch (error) {
    console.error('Error fetching Doma fees:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

