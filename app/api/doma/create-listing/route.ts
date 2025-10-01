import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderbook, chainId, parameters, signature, domain } = body;

    // Validate required fields
    if (!orderbook || !chainId || !parameters || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: orderbook, chainId, parameters, signature' },
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

    // Call Doma Orderbook API
    const domaResponse = await fetch('https://api-testnet.doma.xyz/v1/orderbook/list', {
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
        { status: domaResponse.status }
      );
    }

    const responseData = await domaResponse.json();
    
    // Log successful listing creation
    console.log(`Successfully created Doma listing for ${domain}:`, responseData);

    return NextResponse.json({
      success: true,
      orderId: responseData.orderId,
      domain,
    });

  } catch (error) {
    console.error('Error creating Doma listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
