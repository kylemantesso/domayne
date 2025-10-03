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
    
    <!-- Web3 Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"></script>

    <script>
      // Global configuration
      window.domainSettings = {
        domain: "${domain}",
        sellerAddress: "${settings.sellerAddress || ''}",
        // Auto-detect API URL: use current origin if on domayne.xyz, otherwise use production
        apiUrl: window.location.hostname.includes('domayne.xyz') || window.location.hostname === 'localhost' 
          ? window.location.origin 
          : "https://domayne.xyz",
        walletConnected: false,
        currentAddress: null,
        currentListing: null
      };

      function handleChatClick() {
        const sellerAddress = window.domainSettings.sellerAddress;
        if (sellerAddress) {
          // Detect if we're on localhost for development
          const chatUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? \`\${window.location.origin}/chat/\${sellerAddress}\`
            : \`https://domayne.xyz/chat/\${sellerAddress}\`;
          window.open(chatUrl, '_blank');
        } else {
          alert('No seller address configured for this domain.');
        }
      }

      // Wallet connection functionality
      async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
          alert('Please install MetaMask or another Web3 wallet to make an offer.');
          return;
        }

        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await provider.send('eth_requestAccounts', []);
          const address = accounts[0];
          
          window.domainSettings.walletConnected = true;
          window.domainSettings.currentAddress = address;
          
          updateWalletUI();
          showOfferModal();
        } catch (error) {
          console.error('Failed to connect wallet:', error);
          alert('Failed to connect wallet. Please try again.');
        }
      }

      function disconnectWallet() {
        window.domainSettings.walletConnected = false;
        window.domainSettings.currentAddress = null;
        updateWalletUI();
        hideOfferModal();
      }

      function updateWalletUI() {
        const walletBtn = document.getElementById('wallet-button');
        if (!walletBtn) return;

        if (window.domainSettings.walletConnected) {
          const address = window.domainSettings.currentAddress;
          const shortAddress = \`\${address.slice(0, 6)}...\${address.slice(-4)}\`;
          walletBtn.innerHTML = \`
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            \${shortAddress}
          \`;
          walletBtn.onclick = disconnectWallet;
        } else {
          walletBtn.innerHTML = \`
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            Connect Wallet
          \`;
          walletBtn.onclick = connectWallet;
        }
      }

      function showOfferModal() {
        const modal = document.getElementById('offer-modal');
        if (modal) {
          modal.style.display = 'flex';
          document.body.style.overflow = 'hidden';
        }
      }

      function hideOfferModal() {
        const modal = document.getElementById('offer-modal');
        if (modal) {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
        }
      }

      async function submitOffer() {
        if (!window.domainSettings.walletConnected) {
          alert('Please connect your wallet first.');
          return;
        }

        const offerInput = document.getElementById('offer-amount');
        const offerAmount = offerInput?.value;

        if (!offerAmount || parseFloat(offerAmount) <= 0) {
          alert('Please enter a valid offer amount.');
          return;
        }

        const submitBtn = document.getElementById('submit-offer-btn');
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = \`
            <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/>
            </svg>
            Submitting...
          \`;
        }

        try {
          alert(\`Offer functionality coming soon! You offered: \${offerAmount} ETH for \${window.domainSettings.domain}\`);
          hideOfferModal();
          if (offerInput) offerInput.value = '';
        } catch (error) {
          console.error('Failed to submit offer:', error);
          alert('Failed to submit offer. Please try again.');
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Submit Offer';
          }
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
            window.domainSettings.currentListing = listing;
            
            // Update price
            if (priceEl) {
              const currencySymbol = listing.currency === 'ETH' || listing.currency === 'WETH' ? '' : '$';
              priceEl.innerHTML = \`
                <div class="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 tracking-tight">
                  \${currencySymbol}\${listing.price} \${listing.currency === 'ETH' || listing.currency === 'WETH' ? '<span class="text-5xl md:text-6xl">' + listing.currency + '</span>' : ''}
                </div>
              \`;
            }
            
            // Update listing info
            if (listingEl) {
              listingEl.innerHTML = \`
                <div class="relative max-w-md mx-auto group">
                  <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl opacity-75 blur group-hover:opacity-100 transition duration-300"></div>
                  <div class="relative bg-white rounded-2xl p-6 shadow-xl">
                    <div class="flex items-center justify-center gap-2 mb-4">
                      <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span class="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Listed on Doma Protocol
                      </span>
                    </div>
                    <div class="grid gap-3">
                      <div class="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <span class="text-sm font-medium text-gray-600">Network:</span>
                        <span class="text-sm font-bold text-gray-900">\${listing.network}</span>
                      </div>
                      <div class="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <span class="text-sm font-medium text-gray-600">Token ID:</span>
                        <span class="text-sm font-mono font-semibold text-gray-900">\${listing.tokenId.slice(0, 12)}...</span>
                      </div>
                      <div class="flex items-center justify-between py-2 px-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <span class="text-sm font-medium text-gray-600">Listed:</span>
                        <span class="text-sm font-bold text-gray-900">\${new Date(listing.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              \`;
              listingEl.style.display = 'block';
            }

            // Update modal with listing info
            const modalInfo = document.getElementById('listing-info-modal');
            if (modalInfo) {
              const currencySymbol = listing.currency === 'ETH' || listing.currency === 'WETH' ? '' : '$';
              modalInfo.innerHTML = \`
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                  <p class="text-sm text-gray-600">Current Listing Price</p>
                  <p class="text-xl font-bold text-blue-600">
                    \${currencySymbol}\${listing.price} \${listing.currency === 'ETH' || listing.currency === 'WETH' ? listing.currency : ''}
                  </p>
                </div>
              \`;
            }
            
            // Update buttons to show "Make Offer" and "Buy on Doma"
            if (buttonsEl) {
              const walletButton = \`
                <button
                  id="wallet-button"
                  onclick="connectWallet()"
                  class="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl"
                >
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                  </svg>
                  Connect Wallet
                </button>
              \`;
              const buyButton = \`
                <a
                  href="https://doma.xyz/domain/\${domain}"
                  target="_blank"
                  class="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl"
                >
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6.01"/>
                  </svg>
                  Buy Now on Doma
                </a>
              \`;
              const chatButton = window.domainSettings.sellerAddress ? \`
                <button
                  onclick="handleChatClick()"
                  class="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl"
                >
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                  Contact Seller
                </button>
              \` : '';
              buttonsEl.innerHTML = walletButton + buyButton + chatButton;
              // Re-initialize wallet button after updating
              updateWalletUI();
            }
            
            // Update seller address if available
            if (listing.seller) {
              window.domainSettings.sellerAddress = listing.seller;
            }

            // Update footer contact section
            const footerContact = document.getElementById('footer-contact');
            if (footerContact) {
              footerContact.innerHTML = \`
                <h3 class="text-lg font-semibold mb-4">Contact</h3>
                <p class="text-gray-400 mb-2">Interested in purchasing?</p>
                <button onclick="connectWallet()" class="text-green-400 hover:text-green-300 transition-colors">
                  Make an offer →
                </button>
              \`;
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
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }
      #doma-listing > div {
        animation: float 3s ease-in-out infinite;
      }
      @keyframes gradient-shift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .animated-gradient {
        background-size: 200% 200%;
        animation: gradient-shift 3s ease infinite;
      }
      .action-btn {
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      .action-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }
      .action-btn:hover::before {
        left: 100%;
      }
      .action-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.15);
      }
      .feature-card {
        transition: all 0.3s ease;
      }
      .feature-card:hover {
        transform: translateY(-5px);
      }
    </style>
  </head>
  <body class="gradient-bg">
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <!-- Header -->
      <header class="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div class="container mx-auto px-4 py-5">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ${domain}
            </h1>
            <div class="flex items-center gap-2 text-sm text-gray-600">
              <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
              </svg>
              <span class="font-medium">Available</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <main class="container mx-auto px-4 py-12 md:py-20">
        <div class="max-w-5xl mx-auto text-center">
          <div class="inline-block mb-6">
            <span class="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full shadow-lg">
              Premium Domain
            </span>
          </div>
          
          <h1 class="text-5xl md:text-8xl font-black mb-6 leading-tight">
            <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animated-gradient">
              ${domain}
            </span>
            <div class="text-3xl md:text-5xl mt-4 text-gray-700">is available!</div>
          </h1>

          <p class="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
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
          <div id="action-buttons" class="flex flex-wrap justify-center gap-4 md:gap-6">
            <!-- Buttons will be populated dynamically based on listing status -->
            ${settings.sellerAddress ? `
            <button
              onclick="handleChatClick()"
              class="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl"
            >
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              Contact Seller
            </button>
            ` : ''}
          </div>
        </div>
      </main>

      <!-- Offer Modal -->
      <div id="offer-modal" class="hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4" style="display: none; align-items: center; justify-content: center;">
        <div class="relative group max-w-md w-full">
          <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl opacity-75 blur"></div>
          <div class="relative bg-white rounded-3xl p-8 shadow-2xl">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Make an Offer</h2>
              <button onclick="hideOfferModal()" class="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="mb-6">
              <p class="text-gray-600 mb-4">Submit your offer for <strong class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">${domain}</strong></p>
              
              <div id="listing-info-modal" class="mb-4"></div>

              <label class="block text-sm font-bold text-gray-700 mb-3">Your Offer (ETH)</label>
              <div class="relative">
                <input
                  type="number"
                  id="offer-amount"
                  placeholder="0.1"
                  step="0.01"
                  min="0"
                  class="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold transition-all"
                />
              </div>
              <p class="text-xs text-gray-500 mt-3">
                Enter your offer amount in ETH. The seller will be notified and can accept, reject, or counter your offer.
              </p>
            </div>

            <div class="flex gap-3">
              <button
                id="submit-offer-btn"
                onclick="submitOffer()"
                class="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl font-bold hover:shadow-xl transition-all inline-flex items-center justify-center hover:scale-105"
              >
                Submit Offer
              </button>
              <button
                onclick="hideOfferModal()"
                class="px-6 py-4 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <section class="py-20 bg-gradient-to-b from-white to-gray-50">
        <div class="container mx-auto px-4">
          <div class="max-w-6xl mx-auto">
            <div class="text-center mb-16">
              <h2 class="text-4xl md:text-5xl font-bold mb-4">
                <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Why Choose ${domain}?
                </span>
              </h2>
              <p class="text-gray-600 text-lg">Everything you need for a premium domain experience</p>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="feature-card relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-300"></div>
                <div class="relative bg-white rounded-2xl p-8 text-center shadow-lg h-full">
                  <div class="text-5xl mb-4">🎯</div>
                  <h3 class="text-xl font-bold mb-3 text-gray-900">Premium Domain</h3>
                  <p class="text-gray-600">Short, memorable, and brandable domain name</p>
                </div>
              </div>
              <div class="feature-card relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-purple-400 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-300"></div>
                <div class="relative bg-white rounded-2xl p-8 text-center shadow-lg h-full">
                  <div class="text-5xl mb-4">🔒</div>
                  <h3 class="text-xl font-bold mb-3 text-gray-900">Secure Transfer</h3>
                  <p class="text-gray-600">Safe and secure domain transfer process</p>
                </div>
              </div>
              <div class="feature-card relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-pink-600 to-pink-400 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-300"></div>
                <div class="relative bg-white rounded-2xl p-8 text-center shadow-lg h-full">
                  <div class="text-5xl mb-4">💬</div>
                  <h3 class="text-xl font-bold mb-3 text-gray-900">Direct Communication</h3>
                  <p class="text-gray-600">Chat directly with the seller</p>
                </div>
              </div>
              <div class="feature-card relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-2xl opacity-0 group-hover:opacity-75 blur transition duration-300"></div>
                <div class="relative bg-white rounded-2xl p-8 text-center shadow-lg h-full">
                  <div class="text-5xl mb-4">🔗</div>
                  <h3 class="text-xl font-bold mb-3 text-gray-900">Blockchain Verified</h3>
                  <p class="text-gray-600">Tokenized on Doma Protocol for secure ownership</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 overflow-hidden">
        <div class="absolute inset-0 opacity-10">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        </div>
        <div class="container mx-auto px-4 relative z-10">
          <div class="max-w-6xl mx-auto">
            <div class="grid md:grid-cols-3 gap-12 mb-12">
              <div>
                <h3 class="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">About ${domain}</h3>
                <p class="text-gray-300 leading-relaxed">Premium domain name available for purchase. Secure your brand with this memorable domain.</p>
              </div>
              <div id="footer-contact">
                <h3 class="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Contact</h3>
                <p class="text-gray-300 mb-2">Interested in purchasing?</p>
                <p class="text-gray-400">Check listing status above</p>
              </div>
              <div>
                <h3 class="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Powered by</h3>
                <p class="text-gray-300 mb-3">Domayne - Premium Domain Marketplace</p>
                <a href="https://domayne.xyz" class="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-semibold group" target="_blank">
                  Visit Domayne
                  <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </a>
              </div>
            </div>
            <div class="border-t border-gray-700 pt-8 text-center">
              <p class="text-gray-400">&copy; 2025 ${domain}. All rights reserved.</p>
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