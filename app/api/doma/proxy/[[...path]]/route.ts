import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS headers for cross-origin requests (e.g., from IPFS)
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Api-Key, x-chain-id, Accept, User-Agent',
  'Access-Control-Max-Age': '86400',
};

/**
 * Transparent proxy for Doma API calls
 * This allows the Doma SDK to make API calls through our backend
 * keeping the API key secure on the server
 */

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path);
}

async function handleProxyRequest(
  request: NextRequest,
  pathSegments?: string[]
) {
  try {
    // Get API key from environment variables (backend only)
    const apiKey = process.env.DOMA_API_KEY;
    if (!apiKey) {
      console.error('DOMA_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Missing API key' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Build the target URL
    const path = pathSegments ? pathSegments.join('/') : '';
    const searchParams = request.nextUrl.searchParams.toString();
    
    // Special handling for fee endpoint - SDK might not include contract in path
    // Fee endpoint format: /v1/orderbook/fee/{orderbook}/{chainId}/{contractAddress}
    let targetUrl = `https://api-testnet.doma.xyz/${path}${searchParams ? `?${searchParams}` : ''}`;
    
    // If calling fee endpoint without contract address in path, try to get from query params
    if (path.match(/^v1\/orderbook\/fee\/[^\/]+\/[^\/]+$/)) {
      const contractParam = request.nextUrl.searchParams.get('contract') || 
                           request.nextUrl.searchParams.get('contractAddress');
      if (contractParam) {
        targetUrl = `https://api-testnet.doma.xyz/${path}/${contractParam}`;
        console.log(`[Doma Proxy] Fixed fee URL with contract from query param`);
      } else {
        console.warn(`[Doma Proxy] Fee endpoint called without contract address`);
        // Return empty fees to allow SDK to continue
        return NextResponse.json({ marketplaceFees: [] }, { status: 200, headers: corsHeaders });
      }
    }

    console.log(`[Doma Proxy] ${request.method} ${targetUrl}`);

    // Prepare headers
    const headers: HeadersInit = {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    };

    // Copy relevant headers from original request
    const forwardHeaders = ['x-chain-id', 'accept', 'user-agent'];
    forwardHeaders.forEach(header => {
      const value = request.headers.get(header);
      if (value) {
        headers[header] = value;
      }
    });

    // Prepare request options
    const requestOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Add body for POST, PUT, DELETE requests
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      try {
        const body = await request.text();
        if (body) {
          requestOptions.body = body;
        }
      } catch (error) {
        console.error('[Doma Proxy] Error reading request body:', error);
      }
    }

    // Make the proxied request to Doma
    const response = await fetch(targetUrl, requestOptions);

    // Get response body
    let responseText = await response.text();

    // If this looks like a JSON with marketplaceFees, sanitize null recipients
    try {
      const urlLower = targetUrl.toLowerCase();
      const isJson = response.headers.get('Content-Type')?.includes('application/json');
      if (response.ok && isJson) {
        const json = JSON.parse(responseText);
        // Sanitize fees
        if (urlLower.includes('/orderbook/fee') || urlLower.includes('/v1/orderbook/fee')) {
          if (json && Array.isArray(json.marketplaceFees)) {
            json.marketplaceFees = json.marketplaceFees.filter((f: { recipient?: unknown }) => typeof f?.recipient === 'string' && (f as { recipient: string }).recipient);
          }
        }
        // Sanitize currencies: ensure contractAddress is a non-empty string; map null/undefined to zero address
        if (urlLower.includes('/orderbook/currencies') || urlLower.includes('/v1/orderbook/currencies')) {
          if (json && Array.isArray(json.currencies)) {
            const ZERO = '0x0000000000000000000000000000000000000000';
            json.currencies = json.currencies
              .filter((c: { symbol?: unknown }) => typeof c?.symbol === 'string')
              .map((c: { contractAddress?: unknown; symbol?: unknown } & Record<string, unknown>) => ({
                ...c,
                contractAddress: (typeof c.contractAddress === 'string' && c.contractAddress)
                  ? (c.contractAddress as string)
                  : ZERO,
                symbol: String(c.symbol as string)
              }));
          }
        }
        responseText = JSON.stringify(json);
      }
    } catch {
      // noop: if sanitization fails, return original response
    }

    // Log for debugging
    if (!response.ok) {
      console.error(`[Doma Proxy] Error: ${response.status}`, responseText);
    } else {
      console.log(`[Doma Proxy] Success: ${response.status}`);
    }

    // Return the response with CORS headers
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('[Doma Proxy] Error:', error);
    return NextResponse.json(
      {
        error: 'Proxy error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

