import { NextRequest, NextResponse } from 'next/server';

/**
 * Transparent proxy for Doma API calls
 * This allows the Doma SDK to make API calls through our backend
 * keeping the API key secure on the server
 */
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
        { status: 500 }
      );
    }

    // Build the target URL
    const path = pathSegments ? pathSegments.join('/') : '';
    const searchParams = request.nextUrl.searchParams.toString();
    const targetUrl = `https://api-testnet.doma.xyz/${path}${searchParams ? `?${searchParams}` : ''}`;

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
    const responseText = await response.text();

    // Log for debugging
    if (!response.ok) {
      console.error(`[Doma Proxy] Error: ${response.status}`, responseText);
    } else {
      console.log(`[Doma Proxy] Success: ${response.status}`);
    }

    // Return the response
    return new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });

  } catch (error) {
    console.error('[Doma Proxy] Error:', error);
    return NextResponse.json(
      {
        error: 'Proxy error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

