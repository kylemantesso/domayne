import { NextRequest, NextResponse } from 'next/server';

// CORS headers for allowing static sites to fetch listing data
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
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

    // Extract SLD (second-level domain) and TLD from full domain
    const parts = domain.split('.');
    const sld = parts[0];
    const tld = parts.slice(1).join('.'); // Handle multi-level TLDs like .co.uk
    
    console.log(`Checking listings for domain: ${domain} (sld: ${sld}, tld: ${tld})`);
    
    // First query: Get listings
    const listingsQuery = `
      query GetListings($sld: String!, $tlds: [String!]) {
        listings(sld: $sld, tlds: $tlds, take: 10) {
          items {
            id
            price
            currency {
              symbol
              decimals
            }
            tokenId
            createdAt
            orderbook
          }
        }
      }
    `;
    
    // Second query: Get token details for network info
    const tokensQuery = `
      query GetTokens($name: String!) {
        tokens(name: $name, take: 1) {
          items {
            networkId
            ownerAddress
            tokenAddress
          }
        }
      }
    `;

    // Call Doma GraphQL API for listings
    const listingsResponse = await fetch('https://api-testnet.doma.xyz/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        query: listingsQuery,
        variables: { 
          sld,
          tlds: [tld]
        }
      })
    });

    if (!listingsResponse.ok) {
      console.error('Doma GraphQL API request failed:', listingsResponse.status);
      return NextResponse.json(
        { error: `Doma API error: ${listingsResponse.status}` },
        { status: listingsResponse.status, headers: corsHeaders }
      );
    }

    const data = await listingsResponse.json();
    
    if (data.errors) {
      console.error('Doma GraphQL API errors:', JSON.stringify(data.errors, null, 2));
      return NextResponse.json(
        { error: 'GraphQL query failed', details: data.errors },
        { status: 400, headers: corsHeaders }
      );
    }

    const listings = data.data?.listings?.items;
    if (!listings || listings.length === 0) {
      console.log(`No listings found in GraphQL for domain: ${domain} (sld: ${sld})`);
      console.log('Note: There may be an indexing delay between order creation and GraphQL availability');
      return NextResponse.json({ 
        listing: null,
        note: 'Listing may still be indexing. Check the Doma dashboard directly.'
      }, { headers: corsHeaders });
    }

    const listing = listings[0];
    
    // Convert price from wei to readable format
    const decimals = listing.currency?.decimals || 18;
    const priceInWei = listing.price;
    const priceFormatted = (parseFloat(priceInWei) / Math.pow(10, decimals)).toFixed(4);

    // Fetch token details to get network information and contract address
    let networkId: string | undefined = undefined;
    let sellerAddress = '';
    let tokenAddress = '';
    
    try {
      const tokensResponse = await fetch('https://api-testnet.doma.xyz/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
        },
        body: JSON.stringify({
          query: tokensQuery,
          variables: { name: domain }
        })
      });

      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json();
        const tokens = tokensData.data?.tokens?.items;
        if (tokens && tokens.length > 0) {
          networkId = tokens[0].networkId;
          sellerAddress = tokens[0].ownerAddress || '';
          tokenAddress = tokens[0].tokenAddress || '';
          console.log('Token details:', {
            networkId,
            sellerAddress,
            tokenAddress
          });
        }
      }
    } catch (error) {
      console.warn('Failed to fetch token details for network info:', error);
      // Continue without network info
    }

    // Helper function to format network name
    const formatNetworkName = (networkId: string | undefined) => {
      if (!networkId) return 'Unknown';
      
      // networkId format: eip155:chainId
      const parts = networkId.split(':');
      if (parts.length < 2) return networkId;
      
      const chainId = parts[1];
      const networkNames: Record<string, string> = {
        '1': 'Ethereum Mainnet',
        '11155111': 'Sepolia Testnet',
        '137': 'Polygon',
        '80001': 'Mumbai Testnet',
        '8453': 'Base',
        '84532': 'Base Sepolia',
        '42161': 'Arbitrum One',
        '421614': 'Arbitrum Sepolia',
      };
      
      return networkNames[chainId] || `Chain ${chainId}`;
    };

    const domaListing = {
      id: listing.id,
      price: priceFormatted,
      currency: listing.currency?.symbol || 'ETH',
      tokenId: listing.tokenId || '',
      tokenAddress: tokenAddress,
      seller: sellerAddress,
      createdAt: listing.createdAt,
      network: formatNetworkName(networkId),
      orderbook: listing.orderbook
    };

    return NextResponse.json({ listing: domaListing }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error checking Doma listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
