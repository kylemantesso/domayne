import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, tokenAddress, tokenId, price, currency, sellerAddress, chainId } = body;

    // Validate required fields
    if (!domain || !tokenAddress || !tokenId || !price || !sellerAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, tokenAddress, tokenId, price, sellerAddress' },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.DOMA_API_KEY;
    if (!apiKey) {
      console.error('DOMA_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }

    console.log('Initializing Doma SDK for listing creation...');
    console.log('Listing data:', { domain, tokenAddress, tokenId, price, currency, sellerAddress, chainId });

    console.log('Backend SDK approach - need to handle signing differently');
    
    // The SDK requires a signer, but we're on the backend
    // We need to either:
    // 1. Get the signed order from frontend and submit it
    // 2. Use the SDK's direct API methods
    // 3. Fall back to direct API calls
    
    // For now, let's use direct API calls since the SDK needs a wallet signer
    console.log('Using direct Doma Orderbook API calls instead of SDK');
    
    // This would require the same manual approach we had before
    // but with the API key available on the backend
    
    return NextResponse.json(
      { error: 'SDK integration requires wallet signer - not available on backend. Use frontend SDK or manual API approach.' },
      { status: 501 }
    );

  } catch (error) {
    console.error('Error creating Doma listing with SDK:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
