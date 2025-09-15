import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const chainId = searchParams.get('chainId');

  if (!address || !chainId) {
    return NextResponse.json(
      { error: 'Missing required parameters: address and chainId' },
      { status: 400 }
    );
  }

  // Convert Ethereum address to CAIP-10 format for Doma API
  const caip10Address = `eip155:${chainId}:${address.toLowerCase()}`;
  const networkId = `eip155:${chainId}`;

  const graphqlQuery = {
    query: `
      query GetDomainsByOwner($ownedBy: [AddressCAIP10!]!, $networkIds: [String!]) {
        names(
          ownedBy: $ownedBy
          networkIds: $networkIds
          claimStatus: CLAIMED
        ) {
          items {
            name
            expiresAt
            tokens {
              tokenId
              ownerAddress
            }
          }
        }
      }
    `,
    variables: {
      ownedBy: [caip10Address],
      networkIds: [networkId]
    }
  };

  try {
    console.log('Fetching domains for address:', caip10Address);

    const response = await fetch('https://api-testnet.doma.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-key': process.env.DOMA_API_KEY || '',
      },
      body: JSON.stringify(graphqlQuery)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse = await response.json();
    console.log('Doma API response:', apiResponse);

    // Check for GraphQL errors
    if (apiResponse.errors) {
      console.error('GraphQL errors:', apiResponse.errors);
      return NextResponse.json(
        { error: 'Failed to fetch domains from Doma API', details: apiResponse.errors },
        { status: 500 }
      );
    }

    // Transform API response to our domain format
    const domains = apiResponse.data.names.items.map((item: {
      name: string;
      expiresAt: string;
      tokens: Array<{ tokenId: string; ownerAddress: string }>;
    }) => ({
      domain: item.name,
      createdAt: new Date().toISOString(), // API doesn't provide creation date
      expiresAt: item.expiresAt,
      tokenId: item.tokens[0]?.tokenId,
      isPublished: false, // Default to false
      // ipfsHash would come from our own database when domain is published
    }));

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Error fetching domains from Doma API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}