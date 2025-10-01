import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, signature, orderData } = body;

    // Validate required fields
    if (!domain || !signature || !orderData) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, signature, orderData' },
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

    console.log('Submitting signed order to Doma Orderbook API...');
    console.log('Order data:', orderData);

    // Submit the signed order to Doma's orderbook API
    const response = await fetch('https://api-testnet.doma.xyz/v1/orderbook/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        signature,
        ...orderData
      })
    });

    const responseText = await response.text();
    console.log('Doma API response status:', response.status);
    console.log('Doma API response:', responseText);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Doma API request failed with status ${response.status}`,
        details: responseText
      }, { status: response.status });
    }

    const result = JSON.parse(responseText);
    
    return NextResponse.json({
      success: true,
      listing: result,
      message: 'Successfully created Doma listing'
    });

  } catch (error) {
    console.error('Error creating Doma listing:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

