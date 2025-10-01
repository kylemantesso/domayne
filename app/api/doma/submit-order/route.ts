import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to submit signed orders to Doma orderbook
 * This keeps the ORDERBOOK API key secure on the backend
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderData, chainId } = body;

    if (!orderData) {
      return NextResponse.json(
        { error: 'Order data is required' },
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

    console.log('Submitting order to Doma orderbook...');

    // Submit the order to Doma's orderbook API
    const response = await fetch('https://api-testnet.doma.xyz/v1/orderbook/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
        ...(chainId && { 'X-Chain-Id': chainId }),
      },
      body: JSON.stringify(orderData)
    });

    const responseText = await response.text();
    console.log('Doma API response status:', response.status);

    if (!response.ok) {
      console.error('Doma order submission failed:', responseText);
      return NextResponse.json({
        success: false,
        error: `Doma API request failed with status ${response.status}`,
        details: responseText
      }, { status: response.status });
    }

    const result = JSON.parse(responseText);
    
    return NextResponse.json({
      success: true,
      order: result,
      message: 'Successfully submitted order to Doma'
    });

  } catch (error) {
    console.error('Error submitting order to Doma:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

