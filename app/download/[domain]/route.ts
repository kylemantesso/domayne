import { NextRequest } from 'next/server'

interface DomainSettings {
  title: string
  description: string
  price: string
  currency: string
  sellerAddress: string
}

function generateStaticHTML(domain: string, settings: DomainSettings): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${settings.title || `Buy ${domain} – Premium Domain`}</title>
    <meta name="description" content="${settings.description || `${domain} is available for purchase. Premium domain name perfect for your business.`}" />

    <!-- OpenGraph -->
    <meta property="og:title" content="${settings.title || `Buy ${domain} – Premium Domain`}" />
    <meta property="og:description" content="${settings.description || `${domain} is available for purchase. Premium domain name perfect for your business.`}" />
    <meta property="og:url" content="https://${domain}" />
    <meta property="og:type" content="website" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${settings.title || `Buy ${domain} – Premium Domain`}" />
    <meta name="twitter:description" content="${settings.description || `${domain} is available for purchase. Premium domain name perfect for your business.`}" />

    <!-- Favicon -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌐</text></svg>" />

    <!-- Tailwind CSS from CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <script>
      // Global configuration
      window.domainSettings = {
        domain: "${domain}",
        sellerAddress: "${settings.sellerAddress || ''}",
        // Auto-detect API URL: use current origin if on domayne.xyz, otherwise use production
        apiUrl: window.location.hostname.includes('domayne.xyz') || window.location.hostname === 'localhost' 
          ? window.location.origin 
          : "https://domayne.xyz"
      };

      function handleChatClick() {
        const sellerAddress = window.domainSettings.sellerAddress;
        if (sellerAddress) {
          window.open(\`https://domayne.xyz/chat/\${sellerAddress}\`, '_blank');
        } else {
          alert('No seller address configured for this domain.');
        }
      }

      // Fetch Doma listing details dynamically
      async function loadDomaListing() {
        const domain = window.domainSettings.domain;
        const loadingEl = document.getElementById('doma-loading');
        const listingEl = document.getElementById('doma-listing');
        const priceEl = document.getElementById('price-display');
        const buttonsEl = document.getElementById('action-buttons');
        
        try {
          const response = await fetch(\`\${window.domainSettings.apiUrl}/api/doma/check-listing?domain=\${encodeURIComponent(domain)}\`);
          const data = await response.json();
          
          if (data.listing) {
            const listing = data.listing;
            
            // Update price
            if (priceEl) {
              const currencySymbol = listing.currency === 'ETH' || listing.currency === 'WETH' ? '' : '$';
              priceEl.innerHTML = \`
                <div class="text-4xl font-bold text-blue-600 mb-2">
                  \${currencySymbol}\${listing.price} \${listing.currency === 'ETH' || listing.currency === 'WETH' ? listing.currency : ''}
                </div>
              \`;
            }
            
            // Update listing info
            if (listingEl) {
              listingEl.innerHTML = \`
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span class="font-semibold text-blue-800">Listed on Doma Protocol</span>
                  </div>
                  <div class="text-sm text-blue-700 space-y-1">
                    <p><strong>Network:</strong> \${listing.network}</p>
                    <p><strong>Token ID:</strong> \${listing.tokenId.slice(0, 10)}...</p>
                    <p><strong>Listed:</strong> \${new Date(listing.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              \`;
              listingEl.style.display = 'block';
            }
            
            // Update buttons to show "Buy on Doma"
            if (buttonsEl) {
              const buyButton = \`
                <a
                  href="https://doma.xyz/domain/\${domain}"
                  target="_blank"
                  class="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6.01"/>
                  </svg>
                  Buy on Doma
                </a>
              \`;
              const chatButton = window.domainSettings.sellerAddress ? \`
                <button
                  onclick="handleChatClick()"
                  class="chat-button inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  Contact Seller
                </button>
              \` : '';
              buttonsEl.innerHTML = buyButton + chatButton;
            }
            
            // Update seller address if available
            if (listing.seller) {
              window.domainSettings.sellerAddress = listing.seller;
            }
          }
        } catch (error) {
          console.error('Failed to load Doma listing:', error);
        } finally {
          if (loadingEl) {
            loadingEl.style.display = 'none';
          }
        }
      }

      // Load listing when page loads
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDomaListing);
      } else {
        loadDomaListing();
      }
    </script>

    <style>
      body {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
      }
      .gradient-bg {
        background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
      }
      .chat-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      }
      .chat-button {
        transition: all 0.2s ease;
      }
    </style>
  </head>
  <body class="gradient-bg">
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b">
        <div class="container mx-auto px-4 py-4">
          <h1 class="text-2xl font-bold text-gray-900">${domain}</h1>
        </div>
      </header>

      <!-- Hero Section -->
      <main class="container mx-auto px-4 py-16">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            <span class="text-blue-600">${domain}</span> is available!
          </h1>

          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            ${settings.description || `${domain} is a premium domain name available for purchase. Perfect for building your brand. Secure, memorable, and ready to power your business.`}
          </p>

          <!-- Loading state -->
          <div id="doma-loading" class="mb-8">
            <div class="text-lg text-gray-500 animate-pulse">Loading listing details...</div>
          </div>

          <!-- Price display (populated dynamically) -->
          <div id="price-display" class="mb-8"></div>

          <!-- Doma listing details (populated dynamically) -->
          <div id="doma-listing" class="mb-8" style="display: none;"></div>

          <!-- Action buttons (populated dynamically) -->
          <div id="action-buttons" class="flex justify-center gap-4">
            ${settings.sellerAddress ? `
            <button
              onclick="handleChatClick()"
              class="chat-button inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              Make an Offer
            </button>
            ` : ''}
          </div>
        </div>
      </main>

      <!-- Features Section -->
      <section class="py-16 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-12">Why Choose ${domain}?</h2>
            <div class="grid md:grid-cols-4 gap-8">
              <div class="text-center">
                <div class="text-4xl mb-4">🎯</div>
                <h3 class="text-xl font-semibold mb-2">Premium Domain</h3>
                <p class="text-gray-600">Short, memorable, and brandable domain name</p>
              </div>
              <div class="text-center">
                <div class="text-4xl mb-4">🔒</div>
                <h3 class="text-xl font-semibold mb-2">Secure Transfer</h3>
                <p class="text-gray-600">Safe and secure domain transfer process</p>
              </div>
              <div class="text-center">
                <div class="text-4xl mb-4">💬</div>
                <h3 class="text-xl font-semibold mb-2">Direct Communication</h3>
                <p class="text-gray-600">Chat directly with the seller</p>
              </div>
              <div class="text-center">
                <div class="text-4xl mb-4">🔗</div>
                <h3 class="text-xl font-semibold mb-2">Blockchain Verified</h3>
                <p class="text-gray-600">Tokenized on Doma Protocol for secure ownership</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="bg-gray-900 text-white py-12">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <div class="grid md:grid-cols-3 gap-8">
              <div>
                <h3 class="text-lg font-semibold mb-4">About ${domain}</h3>
                <p class="text-gray-400">Premium domain name available for purchase. Secure your brand with this memorable domain.</p>
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Contact</h3>
                <p class="text-gray-400 mb-2">Interested in purchasing?</p>
                ${settings.sellerAddress ? `
                <button onclick="handleChatClick()" class="text-purple-400 hover:text-purple-300 transition-colors">
                  Make an offer →
                </button>
                ` : `
                <p class="text-gray-400">Contact information not available</p>
                `}
              </div>
              <div>
                <h3 class="text-lg font-semibold mb-4">Powered by</h3>
                <p class="text-gray-400">Domayne - Premium Domain Marketplace</p>
                <a href="https://domayne.xyz" class="text-blue-400 hover:text-blue-300 transition-colors" target="_blank">
                  Visit Domayne →
                </a>
              </div>
            </div>
            <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 ${domain}. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </body>
</html>`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain: rawDomain } = await params
  const domain = decodeURIComponent(rawDomain)
  const searchParams = request.nextUrl.searchParams

  // Get parameters from URL
  const price = searchParams.get('price') || ''
  const currency = searchParams.get('currency') || 'USD'
  const sellerAddress = searchParams.get('sellerAddress') || ''

  // Create settings object (Doma listing will be fetched client-side)
  const settings: DomainSettings = {
    title: `Buy ${domain} – A Premium Domain for Your Brand`,
    description: `${domain} is a premium domain name available for purchase. Perfect for building your brand. Secure, memorable, and ready to power your business.`,
    price: price,
    currency: currency,
    sellerAddress: sellerAddress,
  }

  try {
    // Generate static HTML directly as a string
    const htmlContent = generateStaticHTML(domain, settings)

    const isDownload = searchParams.get('download') === 'true'

    const headers: Record<string, string> = {
      'Content-Type': 'text/html; charset=utf-8'
    }

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${domain}-landing-page.html"`
    }

    return new Response(htmlContent, { headers })
  } catch (error) {
    console.error('Error generating static HTML:', error)
    return new Response('Error generating static HTML', { status: 500 })
  }
}