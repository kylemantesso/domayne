import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.DOMA_API_KEY;
    if (!apiKey) {
      console.error('DOMA_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Fetching domain details for:', domain);

    // Query Doma GraphQL API to get domain token details
    // Use the correct TokenModel schema based on error messages
    const query = `
      query GetTokens($name: String!) {
        tokens(name: $name, take: 10) {
          items {
            tokenId
            type
            networkId
            tokenAddress
            ownerAddress
          }
        }
      }
    `;

    console.log('GraphQL query:', query);
    console.log('Variables:', { name: domain });

    const response = await fetch('https://api-testnet.doma.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        query,
        variables: { name: domain }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Doma GraphQL API request failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Doma API error: ${response.status}`, details: errorText },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    console.log('GraphQL response:', data);
    
    if (data.errors) {
      console.error('Doma GraphQL API errors:', data.errors);
      return NextResponse.json(
        { error: 'GraphQL query failed', details: data.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    const tokensData = data.data?.tokens;
    if (!tokensData || !tokensData.items) {
      return NextResponse.json(
        { error: 'Domain not found in Doma Protocol' },
        { status: 404, headers: corsHeaders }
      );
    }

    const tokens = tokensData.items || [];
    if (tokens.length === 0) {
      return NextResponse.json(
        { error: 'No tokens found for this domain' },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('Found tokens:', tokens);

    // Get the ownership token (should be the first one)
    const ownershipToken = tokens.find((token: Record<string, unknown>) => token.type === 'OWNERSHIP') || tokens[0];
    
    if (!ownershipToken) {
      return NextResponse.json(
        { error: 'No ownership token found for this domain' },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('Using ownership token:', ownershipToken);
    
    const nftDetails = {
      contractAddress: ownershipToken.tokenAddress, // Using tokenAddress field
      tokenId: ownershipToken.tokenId,
      networkId: ownershipToken.networkId,
      owner: ownershipToken.ownerAddress // Using ownerAddress field
    };

    console.log(`Found NFT details for ${domain}:`, nftDetails);

    return NextResponse.json({ 
      domain,
      nftDetails 
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error getting domain NFT details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
