import { NextRequest, NextResponse } from 'next/server';

// For MVP, we'll use a public IPFS gateway service
// In production, you'd want to use your own IPFS node or a service like Pinata/Web3.Storage

export async function POST(request: NextRequest) {
  try {
    const { html, domain } = await request.json();

    if (!html || !domain) {
      return NextResponse.json(
        { error: 'HTML content and domain are required' },
        { status: 400 }
      );
    }

    // For MVP, we'll use Pinata's API as it's the most reliable
    // You can get a free API key from https://pinata.cloud
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;

    if (!pinataApiKey || !pinataSecretKey) {
      // Fallback: Return a simulated hash for demo purposes
      // In production, you'd want proper error handling here
      const simulatedHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      return NextResponse.json({
        success: true,
        hash: simulatedHash,
        domain,
        gateways: [
          `https://ipfs.io/ipfs/${simulatedHash}`,
          `https://gateway.pinata.cloud/ipfs/${simulatedHash}`,
          `https://cloudflare-ipfs.com/ipfs/${simulatedHash}`,
        ],
        note: 'Demo mode - configure PINATA_API_KEY and PINATA_SECRET_KEY for real IPFS publishing'
      });
    }

    // Upload to Pinata IPFS
    const formData = new FormData();
    const blob = new Blob([html], { type: 'text/html' });
    formData.append('file', blob, 'index.html');

    const metadata = JSON.stringify({
      name: `${domain}-landing-page`,
      keyvalues: {
        domain: domain,
        type: 'landing-page',
        created: new Date().toISOString()
      }
    });
    formData.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', options);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pinata API error: ${response.statusText}`);
    }

    const result = await response.json();
    const hash = result.IpfsHash;

    return NextResponse.json({
      success: true,
      hash,
      domain,
      gateways: [
        `https://ipfs.io/ipfs/${hash}`,
        `https://gateway.pinata.cloud/ipfs/${hash}`,
        `https://cloudflare-ipfs.com/ipfs/${hash}`,
      ],
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${hash}`,
    });

  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}