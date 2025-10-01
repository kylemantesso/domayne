import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get API key from environment variables
    const apiKey = process.env.DOMA_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DOMA_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('Testing Doma API connection...');

    // Test with a simple GraphQL query to verify API key works
    const query = `
      query TestConnection {
        listings(take: 1) {
          items {
            id
          }
        }
      }
    `;

    const response = await fetch('https://api-testnet.doma.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({ query })
    });

    const responseText = await response.text();
    console.log('Doma API response status:', response.status);
    console.log('Doma API response:', responseText);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: response.status,
        response: responseText,
        message: 'API key authentication failed'
      });
    }

    const data = JSON.parse(responseText);
    
    if (data.errors) {
      return NextResponse.json({
        success: false,
        errors: data.errors,
        message: 'GraphQL query failed'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Doma API connection successful',
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey.length
    });

  } catch (error) {
    console.error('Error testing Doma connection:', error);
    return NextResponse.json(
      { error: 'Connection test failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
