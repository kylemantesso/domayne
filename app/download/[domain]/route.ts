import { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ domain: string }> }
) {
  const { domain: rawDomain } = await params
  const domain = decodeURIComponent(rawDomain)
  const searchParams = request.nextUrl.searchParams

  // Get pricing from URL parameters
  const price = searchParams.get('price') || ''
  const currency = searchParams.get('currency') || 'USD'

  // Create settings object
  const settings = {
    title: `Buy ${domain} – A Premium Domain for Your Brand`,
    description: `${domain} is a premium domain name available for purchase. Perfect for building your brand. Secure, memorable, and ready to power your business.`,
    ownerName: `${domain} Owner`,
    enableXMTP: true,
    price,
    currency,
  }

  const currencySymbol = settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : settings.currency === 'GBP' ? '£' : '$'

  try {
    // Generate static HTML directly as a string
    const htmlContent = `<!DOCTYPE html>
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

    <!-- XMTP SDK via ES modules with proper loading -->
    <script type="module">
      try {
        console.log('Loading XMTP SDK from esm.sh...');
        const XMTP = await import('https://esm.sh/@xmtp/xmtp-js@11.4.0');

        // Make XMTP available globally
        window.XMTP = XMTP;
        window.xmtpLoaded = true;

        console.log('XMTP SDK loaded successfully:', XMTP);
        console.log('Available XMTP methods:', Object.keys(XMTP));

        // Dispatch custom event to signal XMTP is ready
        window.dispatchEvent(new CustomEvent('xmtp-loaded', { detail: XMTP }));
      } catch (error) {
        console.error('Failed to load XMTP SDK:', error);

        // Try fallback CDN
        try {
          console.log('Trying fallback CDN...');
          const XMTP = await import('https://cdn.skypack.dev/@xmtp/xmtp-js@11.4.0');

          window.XMTP = XMTP;
          window.xmtpLoaded = true;

          console.log('XMTP SDK loaded from fallback CDN:', XMTP);
          window.dispatchEvent(new CustomEvent('xmtp-loaded', { detail: XMTP }));
        } catch (fallbackError) {
          console.error('Fallback CDN also failed:', fallbackError);
          window.xmtpLoadFailed = true;
          window.dispatchEvent(new CustomEvent('xmtp-failed', { detail: fallbackError }));
        }
      }
    </script>

    <script>
      // Global configuration
      window.domainSettings = {
        domain: "${domain}",
        sellerAddress: "${settings.sellerAddress || ''}",
        sellerEns: "${settings.sellerEns || ''}",
        enableXMTP: ${settings.enableXMTP !== false}
      };

      // Wait for XMTP to load via ES modules
      function waitForXMTP() {
        return new Promise((resolve, reject) => {
          if (window.XMTP && window.xmtpLoaded) {
            resolve(window.XMTP);
            return;
          }

          // Listen for XMTP load event
          const handleXMTPLoad = (event) => {
            window.removeEventListener('xmtp-loaded', handleXMTPLoad);
            resolve(event.detail);
          };

          // Listen for XMTP failure event too
          const handleXMTPFail = (event) => {
            window.removeEventListener('xmtp-loaded', handleXMTPLoad);
            window.removeEventListener('xmtp-failed', handleXMTPFail);
            reject(new Error('XMTP SDK failed to load: ' + event.detail.message));
          };

          window.addEventListener('xmtp-loaded', handleXMTPLoad);
          window.addEventListener('xmtp-failed', handleXMTPFail);

          // Fallback timeout
          setTimeout(() => {
            window.removeEventListener('xmtp-loaded', handleXMTPLoad);
            window.removeEventListener('xmtp-failed', handleXMTPFail);
            if (window.XMTP) {
              resolve(window.XMTP);
            } else {
              reject(new Error('XMTP SDK failed to load - timeout after 10 seconds'));
            }
          }, 10000);
        });
      }

      // XMTP state management
      let xmtpClient = null;
      let isConnected = false;
      let currentConversation = null;

      function handleChatClick() {
        if (!window.domainSettings.enableXMTP) return;
        showXMTPModal();
      }

      function showXMTPModal() {
        const modal = document.createElement('div');
        modal.id = 'xmtp-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 modal-backdrop flex items-center justify-center z-50';
        modal.innerHTML = createModalHTML();
        document.body.appendChild(modal);
      }

      function createModalHTML() {
        return \`
          <div class="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div class="flex items-center justify-between p-4 border-b">
              <h3 class="text-lg font-semibold">Chat about \${window.domainSettings.domain}</h3>
              <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div id="modal-content" class="flex-1 flex items-center justify-center p-6">
              <div class="text-center">
                <div class="text-4xl mb-4">🔗</div>
                <h4 class="text-lg font-semibold mb-2">Connect Wallet</h4>
                <p class="text-gray-600 mb-4">Connect your wallet to start messaging</p>
                <button onclick="connectWallet()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Connect Wallet
                </button>
              </div>
            </div>
          </div>
        \`;
      }

      function closeModal() {
        const modal = document.getElementById('xmtp-modal');
        if (modal) {
          modal.remove();
        }
      }

      async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
          alert('Please install MetaMask or another Web3 wallet to use XMTP chat.');
          return;
        }

        try {
          updateModalContent(\`
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h4 class="text-lg font-semibold mb-2">Connecting Wallet</h4>
              <p class="text-gray-600">Please approve the connection in your wallet</p>
            </div>
          \`);

          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const account = accounts[0];

          await initializeXMTP(account);

        } catch (error) {
          console.error('Wallet connection failed:', error);
          updateModalContent(\`
            <div class="text-center">
              <div class="text-4xl mb-4">❌</div>
              <h4 class="text-lg font-semibold mb-2 text-red-600">Connection Failed</h4>
              <p class="text-gray-600 mb-4">\${error.message}</p>
              <button onclick="connectWallet()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Try Again
              </button>
            </div>
          \`);
        }
      }

      async function initializeXMTP(account) {
        try {
          updateModalContent(\`
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <h4 class="text-lg font-semibold mb-2">Initializing XMTP</h4>
              <p class="text-gray-600">Setting up secure messaging...</p>
            </div>
          \`);

          const XMTP = await waitForXMTP();

          // Create a proper wallet instance for XMTP
          const wallet = {
            getAddress: async () => account,
            signMessage: async (message) => {
              return await window.ethereum.request({
                method: 'personal_sign',
                params: [message, account]
              });
            }
          };

          // Initialize XMTP client with proper wallet
          xmtpClient = await XMTP.Client.create(wallet, { env: 'production' });
          isConnected = true;

          updateModalContent(\`
            <div class="text-center">
              <div class="text-4xl mb-4">✅</div>
              <h4 class="text-lg font-semibold mb-2 text-green-600">XMTP Ready!</h4>
              <p class="text-gray-600 mb-4">You can now send secure messages</p>
              <button onclick="startConversation()" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                Start Messaging
              </button>
            </div>
          \`);

        } catch (error) {
          console.error('XMTP initialization failed:', error);
          updateModalContent(\`
            <div class="text-center">
              <div class="text-4xl mb-4">❌</div>
              <h4 class="text-lg font-semibold mb-2 text-red-600">XMTP Failed</h4>
              <p class="text-gray-600 mb-4">Could not initialize secure messaging</p>
              <button onclick="connectWallet()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Try Again
              </button>
            </div>
          \`);
        }
      }

      async function startConversation() {
        if (!xmtpClient) {
          alert('XMTP not initialized');
          return;
        }

        const sellerAddress = window.domainSettings.sellerAddress;
        if (!sellerAddress) {
          updateModalContent(\`
            <div class="text-center">
              <div class="text-4xl mb-4">📧</div>
              <h4 class="text-lg font-semibold mb-2">Contact Seller</h4>
              <p class="text-gray-600 mb-4">No XMTP address configured. Please contact the seller directly.</p>
              <button onclick="closeModal()" class="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700">
                Close
              </button>
            </div>
          \`);
          return;
        }

        try {
          updateModalContent(\`
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <h4 class="text-lg font-semibold mb-2">Starting Conversation</h4>
              <p class="text-gray-600">Connecting with seller...</p>
            </div>
          \`);

          currentConversation = await xmtpClient.conversations.newConversation(sellerAddress);

          showChatInterface();

        } catch (error) {
          console.error('Failed to start conversation:', error);
          updateModalContent(\`
            <div class="text-center">
              <div class="text-4xl mb-4">❌</div>
              <h4 class="text-lg font-semibold mb-2 text-red-600">Connection Failed</h4>
              <p class="text-gray-600 mb-4">Could not connect to seller</p>
              <button onclick="startConversation()" class="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                Try Again
              </button>
            </div>
          \`);
        }
      }

      function showChatInterface() {
        const modal = document.getElementById('xmtp-modal');
        if (!modal) return;

        modal.innerHTML = \`
          <div class="bg-white rounded-lg w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            <div class="flex items-center justify-between p-4 border-b">
              <h3 class="text-lg font-semibold">Chat about \${window.domainSettings.domain}</h3>
              <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div id="messages-container" class="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[400px]">
              <div class="text-center text-gray-500 py-8">
                <div class="text-4xl mb-2">👋</div>
                <p>Say hello to start the conversation!</p>
              </div>
            </div>
            <div class="border-t p-4">
              <div class="flex gap-2">
                <input
                  id="message-input"
                  type="text"
                  placeholder="Type your message..."
                  class="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onkeypress="if(event.key==='Enter') sendMessage()"
                />
                <button
                  onclick="sendMessage()"
                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        \`;
      }

      async function sendMessage() {
        const input = document.getElementById('message-input');
        if (!input || !input.value.trim() || !currentConversation) return;

        const message = input.value.trim();
        input.value = '';

        try {
          await currentConversation.send(message);
          addMessageToChat(message, true);
        } catch (error) {
          console.error('Failed to send message:', error);
          alert('Failed to send message. Please try again.');
        }
      }

      function addMessageToChat(content, isSent) {
        const container = document.getElementById('messages-container');
        if (!container) return;

        // Remove welcome message if it exists
        const welcome = container.querySelector('.text-center.text-gray-500');
        if (welcome) welcome.remove();

        const messageDiv = document.createElement('div');
        messageDiv.className = \`flex \${isSent ? 'justify-end' : 'justify-start'} mb-4\`;
        messageDiv.innerHTML = \`
          <div class="\${isSent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'} max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
            <p class="text-sm">\${content}</p>
            <p class="text-xs mt-1 opacity-70">\${new Date().toLocaleTimeString()}</p>
          </div>
        \`;

        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
      }

      function updateModalContent(html) {
        const content = document.getElementById('modal-content');
        if (content) {
          content.innerHTML = html;
        }
      }

      // Close modal when clicking backdrop
      document.addEventListener('click', (e) => {
        const modal = document.getElementById('xmtp-modal');
        if (modal && e.target === modal) {
          closeModal();
        }
      });
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
      .modal-backdrop {
        backdrop-filter: blur(4px);
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

          ${settings.price ? `
          <div class="text-4xl font-bold text-blue-600 mb-8">
            ${currencySymbol}${settings.price}
          </div>
          ` : ''}

          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button class="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors">
              ${settings.price ? `Buy for ${currencySymbol}${settings.price}` : 'Make an Offer'}
            </button>

            ${settings.enableXMTP !== false ? `
            <button
              onclick="handleChatClick()"
              class="chat-button inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
              Chat with Seller
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
            <div class="grid md:grid-cols-3 gap-8">
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
                <p class="text-gray-600">Chat directly with the seller using XMTP</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </body>
</html>`

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