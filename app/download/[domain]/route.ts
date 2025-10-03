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
    
    <!-- Custom Styles -->
    <style>
      @keyframes float-bob {
        0%, 100% {
          transform: translateY(0px);
        }
        50% {
          transform: translateY(-5px);
        }
      }
      
      .animate-bob {
        animation: float-bob 3s ease-in-out infinite;
      }
    </style>
    
    <!-- Web3 Libraries -->
    <script src="https://cdn.jsdelivr.net/npm/ethers@6.14.1/dist/ethers.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/viem@2/dist/viem.umd.js"></script>
    <script type="module">
      // Import Doma SDK
      import { createDomaOrderbookClient, OrderbookType } from 'https://esm.sh/@doma-protocol/orderbook-sdk@latest';
      window.createDomaOrderbookClient = createDomaOrderbookClient;
      window.OrderbookType = OrderbookType;
    </script>

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
        currentListing: null,
        provider: null
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

      // Show wallet selection modal
      function connectWallet() {
        const modal = document.getElementById('wallet-modal');
        if (modal) {
          modal.style.display = 'flex';
          setTimeout(() => modal.classList.add('show'), 10);
        }
      }

      // Hide wallet selection modal
      function hideWalletModal() {
        const modal = document.getElementById('wallet-modal');
        if (modal) {
          modal.classList.remove('show');
          setTimeout(() => modal.style.display = 'none', 300);
        }
      }

      // Connect to specific wallet
      async function connectToWallet(walletType) {
        try {
          let provider;
          
          if (walletType === 'metamask') {
            if (typeof window.ethereum === 'undefined') {
              window.open('https://metamask.io/download/', '_blank');
              return;
            }
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
          } else if (walletType === 'coinbase') {
            if (typeof window.ethereum === 'undefined' || !window.ethereum.isCoinbaseWallet) {
              window.open('https://www.coinbase.com/wallet', '_blank');
              return;
            }
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send('eth_requestAccounts', []);
          } else if (walletType === 'walletconnect') {
            alert('WalletConnect: Please use MetaMask browser for now');
            return;
          }
          
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          
          window.domainSettings.walletConnected = true;
          window.domainSettings.currentAddress = address;
          window.domainSettings.provider = provider;
          
          hideWalletModal();
          updateWalletUI();
          try { await restoreOfferForConnectedWallet(); } catch {}
        } catch (error) {
          console.error('Failed to connect wallet:', error);
          if (error.code !== 4001) { // Ignore user rejection
            alert('Failed to connect wallet. Please try again.');
          }
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
        const walletBtnMobile = document.getElementById('wallet-button-mobile');
        const buttonsContainerDesktop = document.getElementById('action-buttons-desktop');
        const buttonsContainerMobile = document.getElementById('action-buttons-mobile');

        if (window.domainSettings.walletConnected) {
          const address = window.domainSettings.currentAddress;
          const shortAddress = \`\${address.slice(0, 6)}...\${address.slice(-4)}\`;
          
          const desktopHTML = \`
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            \${shortAddress}
          \`;
          const mobileHTML = \`
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            \${shortAddress}
          \`;
          
          if (walletBtn) {
            walletBtn.innerHTML = desktopHTML;
            walletBtn.onclick = disconnectWallet;
            walletBtn.className = "action-btn inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-5 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl";
          }
          if (walletBtnMobile) {
            walletBtnMobile.innerHTML = mobileHTML;
            walletBtnMobile.onclick = disconnectWallet;
            walletBtnMobile.className = "action-btn inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-4 rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl";
          }
          
          // Add Make Offer button if listing exists
          if (window.domainSettings.currentListing) {
            // Check if Make Offer button already exists
            if (!document.getElementById('make-offer-button')) {
              const makeOfferDesktop = \`
                <button
                  id="make-offer-button"
                  onclick="showOfferModal()"
                  class="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl"
                >
                  <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Make an Offer
                </button>
              \`;
              const makeOfferMobile = \`
                <button
                  id="make-offer-button-mobile"
                  onclick="showOfferModal()"
                  class="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Make an Offer
                </button>
              \`;
              
              if (walletBtn && buttonsContainerDesktop) {
                walletBtn.insertAdjacentHTML('afterend', makeOfferDesktop);
              }
              if (walletBtnMobile && buttonsContainerMobile) {
                walletBtnMobile.insertAdjacentHTML('afterend', makeOfferMobile);
              }
            }
          }
        } else {
          const desktopHTML = \`
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            Connect Wallet
          \`;
          const mobileHTML = \`
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
            </svg>
            Connect Wallet
          \`;
          
          if (walletBtn) {
            walletBtn.innerHTML = desktopHTML;
            walletBtn.onclick = connectWallet;
            walletBtn.className = "action-btn inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl";
          }
          if (walletBtnMobile) {
            walletBtnMobile.innerHTML = mobileHTML;
            walletBtnMobile.onclick = connectWallet;
            walletBtnMobile.className = "action-btn inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl";
          }
          
          // Remove Make Offer button if it exists
          const makeOfferBtn = document.getElementById('make-offer-button');
          const makeOfferBtnMobile = document.getElementById('make-offer-button-mobile');
          if (makeOfferBtn) makeOfferBtn.remove();
          if (makeOfferBtnMobile) makeOfferBtnMobile.remove();
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
        if (!window.domainSettings.walletConnected || !window.domainSettings.provider) {
          alert('Please connect your wallet first.');
          return;
        }

        if (!window.createDomaOrderbookClient) {
          alert('Doma SDK not loaded. Please refresh the page.');
          return;
        }

        const offerInput = document.getElementById('offer-amount');
        const offerAmount = offerInput?.value;

        if (!offerAmount || parseFloat(offerAmount) <= 0) {
          alert('Please enter a valid offer amount.');
          return;
        }

        const listing = window.domainSettings.currentListing;
        if (!listing) {
          alert('Listing information not available.');
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
            Creating offer...
          \`;
        }

        try {
          console.log('[submitOffer] Step 1: Getting provider and signer');
          const provider = window.domainSettings.provider;
          const signer = await provider.getSigner(); // Make sure to await this
          const signerAddress = await signer.getAddress();
          const network = await provider.getNetwork();
          
          console.log('[submitOffer] Step 2: Provider info:', {
            network: network.chainId,
            signerAddress
          });
          console.log('[submitOffer] Step 3: Listing:', listing);
          
          // Validate we have contract address
          if (!listing.tokenAddress) {
            throw new Error('Missing contract address for domain');
          }
          
          // Ensure tokenAddress is a string and not null
          const contractAddress = String(listing.tokenAddress).trim();
          const tokenIdStr = String(listing.tokenId).trim();
          
          if (!contractAddress || contractAddress === 'null' || contractAddress === 'undefined') {
            throw new Error('Invalid contract address');
          }
          
          if (!tokenIdStr || tokenIdStr === 'null' || tokenIdStr === 'undefined') {
            throw new Error('Invalid token ID');
          }
          
          // Convert price to wei
          const priceInWei = ethers.parseEther(offerAmount).toString();
          console.log('[submitOffer] Step 4: Offer amount in wei:', priceInWei);
          
          // Initialize Doma Orderbook client (same as create listing)
          console.log('[submitOffer] Step 5: Initializing Doma client');
          const client = window.createDomaOrderbookClient({
            apiClientOptions: {
              baseUrl: window.domainSettings.apiUrl + '/api/doma/proxy',
            },
            source: 'domayne',
            chains: []
          });
          console.log('[submitOffer] Step 6: Client initialized');
          
          if (submitBtn) {
            submitBtn.innerHTML = \`
              <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/>
              </svg>
              Signing offer...
            \`;
          }
          
          // WETH contract address on Sepolia testnet (fallback)
          const wethAddress = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14';
          const zeroAddress = '0x0000000000000000000000000000000000000000';
          
          // Set expiration time to 30 days from now
          const expirationTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
          
          // Let SDK fetch marketplace fees automatically

          // Ensure currency is supported; try resolving via SDK first
          console.log('[submitOffer] Step 6.55: Fetching supported currencies...');
          // Prefer WETH for offers (SDK validates ERC-20 balance)
          let resolvedCurrencyAddress = wethAddress;
          let resolvedCurrencySymbol = 'WETH';
          try {
            const currenciesResponse = await client.getSupportedCurrencies({
              contractAddress: contractAddress,
              orderbook: 'DOMA',
              chainId: 'eip155:11155111'
            });
            console.log('[submitOffer] Supported currencies response:', currenciesResponse);
            if (currenciesResponse && Array.isArray(currenciesResponse.currencies)) {
              // Find WETH entry
              const toEntry = (c) => ({
                addr: (c && typeof c.contractAddress === 'string') ? c.contractAddress : '',
                sym: (c && typeof c.symbol === 'string') ? c.symbol : ''
              });
              const entries = currenciesResponse.currencies.map(toEntry);
              const wethEntry = entries.find((c) => c.sym.toUpperCase() === 'WETH' || c.addr.toLowerCase() === wethAddress.toLowerCase());
              if (wethEntry) {
                resolvedCurrencyAddress = wethEntry.addr || wethAddress;
                resolvedCurrencySymbol = 'WETH';
              }
            }
          } catch (currErr) {
            console.warn('[submitOffer] Could not fetch supported currencies, using default WETH:', currErr);
          }
          
          const normalizedContract = contractAddress.toLowerCase();
          const normalizedCurrency = resolvedCurrencyAddress.toLowerCase();

          // Fetch required marketplace fees (must include recipients)
          console.log('[submitOffer] Step 6.6: Fetching marketplace fees...');
          let marketplaceFees = [];
          try {
            const feeResponse = await client.getOrderbookFee({
              contractAddress: normalizedContract,
              orderbook: 'DOMA',
              chainId: 'eip155:11155111'
            });
            if (feeResponse && Array.isArray(feeResponse.marketplaceFees)) {
              marketplaceFees = feeResponse.marketplaceFees
                .filter((f) => f && typeof f.recipient === 'string' && f.recipient && typeof f.basisPoints === 'number')
                .map((f) => ({ recipient: f.recipient, basisPoints: f.basisPoints }));
              console.log('[submitOffer] Step 6.7: Marketplace fees:', marketplaceFees);
            }
          } catch (feeErr) {
            console.warn('[submitOffer] Could not fetch fees; offer may be rejected if required:', feeErr);
          }

          // If currency is WETH and balance is insufficient, auto-wrap needed difference
          try {
            if (resolvedCurrencySymbol === 'WETH') {
              const priceInWeiBigInt = BigInt(priceInWei);
              const erc20 = new ethers.Contract(normalizedCurrency, [
                'function balanceOf(address) view returns (uint256)'
              ], window.domainSettings.provider);
              const currentWethBalance = await erc20.balanceOf(signerAddress);
              console.log('[submitOffer] Current WETH balance:', currentWethBalance?.toString?.() ?? String(currentWethBalance));
              if (currentWethBalance < priceInWeiBigInt) {
                const deficit = priceInWeiBigInt - currentWethBalance;
                const ethBalance = await window.domainSettings.provider.getBalance(signerAddress);
                console.log('[submitOffer] ETH balance:', ethBalance?.toString?.() ?? String(ethBalance), 'Deficit:', deficit.toString());
                if (ethBalance < deficit) {
                  throw new Error('Insufficient ETH to wrap to WETH for offer amount');
                }
                console.log('[submitOffer] Wrapping ETH to WETH:', deficit.toString());
                const weth = new ethers.Contract(normalizedCurrency, [
                  'function deposit() payable'
                ], signer);
                const wrapTx = await weth.deposit({ value: deficit });
                console.log('[submitOffer] Wrap tx sent:', wrapTx.hash);
                await wrapTx.wait();
                console.log('[submitOffer] Wrap tx confirmed');
              }
            }
          } catch (wrapErr) {
            console.warn('[submitOffer] Auto-wrap step failed or skipped:', wrapErr);
          }

          const offerParams = {
            params: {
              items: [{
                contract: normalizedContract,
                tokenId: tokenIdStr,
                price: priceInWei,
                currencyContractAddress: normalizedCurrency, // ETH uses zero address
              }],
              orderbook: 'DOMA',
              expirationTime: expirationTime, // Offer expires in 30 days
              ...(marketplaceFees.length > 0 ? { marketplaceFees } : {}),
            },
            signer,
            chainId: 'eip155:11155111', // Sepolia
            onProgress: (step, progress) => {
              console.log('[submitOffer] Progress:', step, progress);
            }
          };
          
          console.log('[submitOffer] Step 7: Creating offer with params:', {
            contract: normalizedContract,
            tokenId: tokenIdStr,
            price: priceInWei,
            currencyContractAddress: normalizedCurrency,
            orderbook: 'DOMA',
            chainId: 'eip155:11155111',
            expirationTime: expirationTime,
            signerAddress: signerAddress,
            itemsCount: 1
          });
          try { console.log('[submitOffer] Offer params full:', JSON.stringify(offerParams)); } catch {}
          
          // Step 8: Create and sign the offer with SDK
          console.log('[submitOffer] Step 8: Calling client.createOffer...');
          const sdkResult = await client.createOffer(offerParams);
          
          console.log('[submitOffer] Step 9: Offer signed:', sdkResult);
          
          if (!sdkResult || sdkResult.errors) {
            throw new Error(sdkResult?.errors ? JSON.stringify(sdkResult.errors) : 'Failed to sign offer');
          }
          
          // Step 10: Determine if SDK already submitted (proxy flow) or if we need to submit
          console.log('[submitOffer] Step 10: Preparing submission payload...');
          if (sdkResult && Array.isArray(sdkResult.orders) && sdkResult.orders.length > 0) {
            const firstOrder = sdkResult.orders[0];
            const orderId = firstOrder?.orderId || firstOrder?.order?.orderId;
            if (orderId) {
          console.log('[submitOffer] SDK handled submission via proxy. Order ID:', orderId);
          try {
            const offerRecord = {
              orderId,
              domain: window.domainSettings.domain,
              contract: normalizedContract,
              tokenId: tokenIdStr,
              priceWei: priceInWei,
              currency: 'WETH',
              createdAt: Date.now(),
              chainId: 'eip155:11155111',
              maker: signerAddress
            };
            const key = 'doma_offer_' + window.domainSettings.domain + '_' + signerAddress;
            localStorage.setItem(key, JSON.stringify(offerRecord));
          } catch {}
          renderYourOfferSection({ orderId });
          hideOfferModal();
          if (offerInput) offerInput.value = '';
          return;
            }
          }

          let signedParameters = undefined;
          let signedSignature = undefined;
          try {
            if (sdkResult && Array.isArray(sdkResult.orders) && sdkResult.orders.length > 0) {
              const firstOrder = sdkResult.orders[0];
              signedParameters = firstOrder?.parameters || firstOrder?.order?.parameters;
              signedSignature = firstOrder?.signature || firstOrder?.order?.signature;
              console.log('[submitOffer] Extracted from orders[0]');
            }
            if (!signedParameters || !signedSignature) {
              const stepBody = sdkResult?.steps?.[0]?.items?.[0]?.data?.post?.body;
              if (stepBody) {
                signedParameters = stepBody.parameters;
                signedSignature = stepBody.signature;
                console.log('[submitOffer] Extracted from steps[0] body');
              }
            }
          } catch (extractErr) {
            console.warn('[submitOffer] Could not extract signed payload from SDK result:', extractErr);
          }

          if (!signedParameters || !signedSignature) {
            console.error('[submitOffer] Missing signed payload. SDK result:', sdkResult);
            throw new Error('SDK did not return signed order payload');
          }

          console.log('[submitOffer] Step 10: Submitting to backend...');
          if (submitBtn) {
            submitBtn.innerHTML = \`
              <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/>
              </svg>
              Submitting offer...
            \`;
          }
          
          const backendResponse = await fetch(\`\${window.domainSettings.apiUrl}/api/doma/submit-order\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderbook: 'DOMA',
              chainId: 'eip155:11155111',
              parameters: signedParameters,
              signature: signedSignature,
              domain: window.domainSettings.domain
            })
          });
          
          const backendData = await backendResponse.json();
          console.log('[submitOffer] Step 11: Backend response:', backendData);
          
          if (!backendResponse.ok || !backendData.success) {
            throw new Error(backendData.error || backendData.details || 'Failed to submit offer to backend');
          }
          
          alert(\`Offer submitted successfully!\\n\\nYour offer of \${offerAmount} ETH for \${window.domainSettings.domain} has been created.\`);
          hideOfferModal();
          if (offerInput) offerInput.value = '';
          
        } catch (error) {
          console.error('[submitOffer] ERROR - Full error object:', error);
          console.error('[submitOffer] ERROR - Error message:', error?.message);
          console.error('[submitOffer] ERROR - Error code:', error?.code);
          console.error('[submitOffer] ERROR - Error stack:', error?.stack);
          try { console.error('[submitOffer] ERROR - keys:', Object.keys(error || {})); } catch {}
          try { console.error('[submitOffer] ERROR - details:', error?.details || error?.data || error?.cause || null); } catch {}
          
          let errorMessage = 'Failed to create offer: ';
          if (error.code === 4001) {
            errorMessage += 'You rejected the signature request.';
          } else if (error.message) {
            errorMessage += error.message;
          } else {
            errorMessage += 'Unknown error. Check console for details.';
          }
          
          alert(errorMessage);
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
        const loadingElMobile = document.getElementById('doma-loading-mobile');
        const loadingElDesktop = document.getElementById('doma-loading-desktop');
        const listingElMobile = document.getElementById('doma-listing-mobile');
        const listingElDesktop = document.getElementById('doma-listing-desktop');
        const priceElMobile = document.getElementById('price-display-mobile');
        const priceElDesktop = document.getElementById('price-display-desktop');
        const buttonsElMobile = document.getElementById('action-buttons-mobile');
        const buttonsElDesktop = document.getElementById('action-buttons-desktop');
        
        try {
          const response = await fetch(\`\${window.domainSettings.apiUrl}/api/doma/check-listing?domain=\${encodeURIComponent(domain)}\`);
          const data = await response.json();
          
          if (data.listing) {
            const listing = data.listing;
            window.domainSettings.currentListing = listing;
            
            const currencySymbol = listing.currency === 'ETH' || listing.currency === 'WETH' ? '' : '$';
            const priceHTML = \`
              <div class="text-6xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 tracking-tight">
                \${currencySymbol}\${listing.price} \${listing.currency === 'ETH' || listing.currency === 'WETH' ? '<span class="text-5xl md:text-6xl">' + listing.currency + '</span>' : ''}
              </div>
            \`;
            
            const listingHTML = \`
              <div class="relative max-w-md mx-auto group animate-bob">
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
                  <div class="grid gap-3 mb-4">
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
                  <div class="text-center pt-2 border-t border-gray-200">
                    <a
                      href="https://doma.xyz/domain/\${domain}"
                      target="_blank"
                      class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors text-sm"
                    >
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6.01"/>
                      </svg>
                      Buy Now on Doma
                    </a>
                  </div>
                </div>
              </div>
            \`;
            
            // Update price for both mobile and desktop
            if (priceElMobile) priceElMobile.innerHTML = priceHTML;
            if (priceElDesktop) priceElDesktop.innerHTML = priceHTML;
            
            // Update listing info for both mobile and desktop
            if (listingElMobile) {
              listingElMobile.innerHTML = listingHTML;
              listingElMobile.style.display = 'block';
            }
            if (listingElDesktop) {
              listingElDesktop.innerHTML = listingHTML;
              listingElDesktop.style.display = 'block';
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
            
            // Update buttons to show "Make Offer" and "Contact Seller"
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
            
            const mobileWalletButton = \`
              <button
                id="wallet-button-mobile"
                onclick="connectWallet()"
                class="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
                </svg>
                Connect Wallet
              </button>
            \`;
            const mobileChatButton = window.domainSettings.sellerAddress ? \`
              <button
                onclick="handleChatClick()"
                class="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                Contact Seller
              </button>
            \` : '';
            
            if (buttonsElDesktop) buttonsElDesktop.innerHTML = walletButton + chatButton;
            if (buttonsElMobile) buttonsElMobile.innerHTML = mobileWalletButton + mobileChatButton;
            
            // Re-initialize wallet button after updating
            updateWalletUI();
            
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

            // Render saved offer if present for this wallet
            try {
              const key = 'doma_offer_' + domain + '_' + window.domainSettings.currentAddress;
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                renderYourOfferSection(parsed);
              }
            } catch {}
          }
        } catch (error) {
          console.error('Failed to load Doma listing:', error);
        } finally {
          if (loadingElMobile) loadingElMobile.style.display = 'none';
          if (loadingElDesktop) loadingElDesktop.style.display = 'none';
        }
      }

      // Load listing when page loads
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDomaListing);
      } else {
        loadDomaListing();
      }

      function renderYourOfferSection(existing) {
        try {
          const containerDesktop = document.getElementById('action-buttons-desktop');
          const containerMobile = document.getElementById('action-buttons-mobile');
          if (!containerDesktop && !containerMobile) return;
          const orderId = existing?.orderId;
          const price = existing?.priceWei ? (Number(existing.priceWei) / 1e18).toString() : null;
          const inner = '<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/></svg>'
            + '<div class="text-sm font-semibold">Your offer is active' + (price ? (': ' + price + ' WETH') : '') + '</div>'
            + (orderId ? ('<a target="_blank" href="https://dashboard-testnet.doma.xyz/domain/' + window.domainSettings.domain + '" class="text-emerald-700 underline">View</a>') : '');
          if (containerDesktop) {
            const existingDesktop = document.getElementById('your-offer-desktop');
            if (existingDesktop) existingDesktop.remove();
            const htmlDesktop = '<div id="your-offer-desktop" class="w-full mb-3 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl">' + inner + '</div>';
            containerDesktop.insertAdjacentHTML('afterbegin', htmlDesktop);
          }
          if (containerMobile) {
            const existingMobile = document.getElementById('your-offer-mobile');
            if (existingMobile) existingMobile.remove();
            const htmlMobile = '<div id="your-offer-mobile" class="w-full mb-3 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl">' + inner + '</div>';
            containerMobile.insertAdjacentHTML('afterbegin', htmlMobile);
          }
        } catch {}
      }

      async function restoreOfferForConnectedWallet() {
        try {
          const domain = window.domainSettings.domain;
          const address = window.domainSettings.currentAddress;
          if (!domain || !address) return;
          const key = 'doma_offer_' + domain + '_' + address;
          const raw = localStorage.getItem(key);
          if (!raw) return;
          const offer = JSON.parse(raw);
          // Optionally, validate offer via API or just render locally
          renderYourOfferSection(offer);
        } catch {}
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
        <div class="container mx-auto px-4 py-3">
          <div class="flex items-center justify-between">
            <h1 class="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ${domain}
            </h1>
            <div class="flex items-center gap-2 text-xs md:text-sm text-gray-600">
              <svg class="w-3 h-3 md:w-4 md:h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
              </svg>
              <span class="font-medium">Available</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <main class="container mx-auto px-4 py-8 md:py-12">
        <div class="max-w-7xl mx-auto">
          <!-- Mobile: Stacked Layout -->
          <div class="lg:hidden text-center">
            <div class="inline-block mb-4">
              <span class="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs md:text-sm font-semibold rounded-full shadow-lg">
                Premium Domain
              </span>
            </div>
            
            <h1 class="text-4xl md:text-5xl font-black mb-4 leading-tight">
              <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animated-gradient">
                ${domain}
              </span>
              <div class="text-2xl md:text-3xl mt-3 text-gray-700">is available!</div>
            </h1>

            <p class="text-base text-gray-600 mb-6 leading-relaxed">
              ${settings.description || `Secure this premium domain name before someone else does. Short, memorable, and brandable – perfect for establishing your online presence and building lasting credibility.`}
            </p>

            <!-- Trust Badges Mobile -->
            <div class="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs">
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                <span class="font-semibold text-gray-700">Verified</span>
              </div>
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
                </svg>
                <span class="font-semibold text-gray-700">Secure</span>
              </div>
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 7H7v6h6V7z"/>
                  <path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"/>
                </svg>
                <span class="font-semibold text-gray-700">Blockchain</span>
              </div>
              <div class="flex items-center gap-1.5">
                <svg class="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                <span class="font-semibold text-gray-700">Instant</span>
              </div>
            </div>

            <!-- Loading state -->
            <div id="doma-loading-mobile" class="mb-6">
              <div class="text-base text-gray-500 animate-pulse">Loading listing details...</div>
            </div>

            <!-- Price display (populated dynamically) -->
            <div id="price-display-mobile" class="mb-6"></div>

            <!-- Doma listing details (populated dynamically) -->
            <div id="doma-listing-mobile" class="mb-6" style="display: none;"></div>

            <!-- Action buttons (populated dynamically) -->
            <div id="action-buttons-mobile" class="flex flex-wrap justify-center gap-3">
              ${settings.sellerAddress ? `
              <button
                onclick="handleChatClick()"
                class="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                Contact Seller
              </button>
              ` : ''}
            </div>
          </div>

          <!-- Desktop: Two Column Layout -->
          <div class="hidden lg:grid lg:grid-cols-2 lg:gap-12 lg:items-start">
            <!-- Left Column: Content & CTAs -->
            <div class="space-y-6">
              <div>
                <span class="inline-block px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-full shadow-lg mb-4">
                  Premium Domain
                </span>
              </div>
              
              <h1 class="text-5xl xl:text-6xl font-black leading-tight">
                <span class="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animated-gradient">
                  ${domain}
                </span>
                <div class="text-3xl xl:text-4xl mt-3 text-gray-700">is available!</div>
              </h1>

              <p class="text-lg text-gray-600 leading-relaxed">
                ${settings.description || `Secure this premium domain name before someone else does. Short, memorable, and brandable – perfect for establishing your online presence and building lasting credibility.`}
              </p>

              <!-- Trust Badges Desktop -->
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                  </svg>
                  <span class="font-semibold text-gray-700">Verified Seller</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"/>
                  </svg>
                  <span class="font-semibold text-gray-700">Secure Escrow</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 7H7v6h6V7z"/>
                    <path fill-rule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"/>
                  </svg>
                  <span class="font-semibold text-gray-700">Blockchain Verified</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                  <span class="font-semibold text-gray-700">Instant Transfer</span>
                </div>
              </div>

              <!-- Action buttons (populated dynamically) -->
              <div id="action-buttons-desktop" class="flex flex-wrap gap-4 pt-2">
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

            <!-- Right Column: Price & Listing Info -->
            <div class="space-y-6">
              <!-- Loading state -->
              <div id="doma-loading-desktop">
                <div class="text-lg text-gray-500 animate-pulse text-center">Loading listing details...</div>
              </div>

              <!-- Price display (populated dynamically) -->
              <div id="price-display-desktop" class="text-center"></div>

              <!-- Doma listing details (populated dynamically) -->
              <div id="doma-listing-desktop" style="display: none;"></div>
            </div>
          </div>
        </div>
      </main>

      <!-- Wallet Selection Modal -->
      <div id="wallet-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4" style="display: none; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s;">
        <div class="relative group max-w-md w-full" onclick="event.stopPropagation()">
          <div class="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl opacity-75 blur"></div>
          <div class="relative bg-white rounded-3xl p-8 shadow-2xl">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Connect Wallet</h2>
              <button onclick="hideWalletModal()" class="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 transform duration-200">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <p class="text-gray-600 mb-6">Choose your preferred wallet to connect</p>

            <div class="space-y-3">
              <!-- MetaMask -->
              <button
                onclick="connectToWallet('metamask')"
                class="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div class="w-12 h-12 flex items-center justify-center bg-orange-100 rounded-xl group-hover:scale-110 transition-transform">
                  <svg class="w-8 h-8" viewBox="0 0 40 40" fill="none">
                    <path d="M32.5 4L20 12.5L22.3 7.2L32.5 4Z" fill="#E17726"/>
                    <path d="M7.5 4L19.9 12.6L17.7 7.2L7.5 4Z" fill="#E27625"/>
                    <path d="M28.3 28.7L25.5 33.2L32 35L34.1 28.8L28.3 28.7Z" fill="#E27625"/>
                    <path d="M5.9 28.8L8 35L14.5 33.2L11.7 28.7L5.9 28.8Z" fill="#E27625"/>
                    <path d="M14.2 17.5L12.2 20.5L18.7 20.8L18.5 13.8L14.2 17.5Z" fill="#E27625"/>
                    <path d="M25.8 17.5L21.4 13.7L21.3 20.8L27.8 20.5L25.8 17.5Z" fill="#E27625"/>
                    <path d="M14.5 33.2L18.1 31.5L15 28.8L14.5 33.2Z" fill="#E27625"/>
                    <path d="M21.9 31.5L25.5 33.2L25 28.8L21.9 31.5Z" fill="#E27625"/>
                  </svg>
                </div>
                <div class="flex-1 text-left">
                  <div class="font-bold text-gray-900">MetaMask</div>
                  <div class="text-sm text-gray-500">Connect using MetaMask</div>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              <!-- Coinbase Wallet -->
              <button
                onclick="connectToWallet('coinbase')"
                class="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div class="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-xl group-hover:scale-110 transition-transform">
                  <svg class="w-8 h-8" viewBox="0 0 1024 1024" fill="none">
                    <circle cx="512" cy="512" r="512" fill="#0052FF"/>
                    <path d="M512 692C406.5 692 332 617.5 332 512C332 406.5 406.5 332 512 332C617.5 332 692 406.5 692 512C692 617.5 617.5 692 512 692Z" fill="white"/>
                  </svg>
                </div>
                <div class="flex-1 text-left">
                  <div class="font-bold text-gray-900">Coinbase Wallet</div>
                  <div class="text-sm text-gray-500">Connect using Coinbase</div>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              <!-- WalletConnect -->
              <button
                onclick="connectToWallet('walletconnect')"
                class="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group opacity-50 cursor-not-allowed"
                disabled
              >
                <div class="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-xl">
                  <svg class="w-8 h-8" viewBox="0 0 300 185" fill="none">
                    <path d="M61.439 36.256c48.91-47.888 128.212-47.888 177.123 0l5.886 5.764a6.041 6.041 0 0 1 0 8.67l-20.136 19.716a3.179 3.179 0 0 1-4.428 0l-8.101-7.931c-34.122-33.408-89.444-33.408-123.566 0l-8.675 8.494a3.179 3.179 0 0 1-4.428 0L54.978 51.253a6.041 6.041 0 0 1 0-8.67l6.46-6.327ZM280.206 77.03l17.922 17.547a6.041 6.041 0 0 1 0 8.67l-80.81 79.122c-2.446 2.394-6.41 2.394-8.857 0l-57.354-56.155a1.59 1.59 0 0 0-2.214 0L91.54 182.37c-2.446 2.394-6.41 2.394-8.857 0L1.872 103.247a6.041 6.041 0 0 1 0-8.67l17.922-17.547c2.445-2.394 6.41-2.394 8.856 0l57.355 56.155a1.59 1.59 0 0 0 2.214 0L145.57 77.03c2.446-2.394 6.41-2.395 8.856 0l57.355 56.155a1.59 1.59 0 0 0 2.214 0L271.35 77.03c2.446-2.394 6.41-2.394 8.856 0Z" fill="#3B99FC"/>
                  </svg>
                </div>
                <div class="flex-1 text-left">
                  <div class="font-bold text-gray-900">WalletConnect</div>
                  <div class="text-sm text-gray-500">Coming soon</div>
                </div>
              </button>
            </div>

            <p class="text-xs text-gray-500 text-center mt-6">
              By connecting a wallet, you agree to the Terms of Service
            </p>
          </div>
        </div>
      </div>

      <style>
        #wallet-modal.show {
          opacity: 1 !important;
        }
        #wallet-modal {
          cursor: pointer;
        }
        #wallet-modal > div {
          cursor: default;
        }
      </style>

      <script>
        // Close modal when clicking backdrop
        document.addEventListener('DOMContentLoaded', function() {
          const walletModal = document.getElementById('wallet-modal');
          if (walletModal) {
            walletModal.addEventListener('click', function(e) {
              if (e.target === walletModal) {
                hideWalletModal();
              }
            });
          }
        });
      </script>

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

      <!-- Domain Stats Section -->
      <section class="py-12 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                <div class="text-3xl font-bold text-blue-600 mb-2">${domain.split('.')[0].length}</div>
                <div class="text-sm text-gray-600 font-medium">Characters</div>
              </div>
              <div class="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                <div class="text-3xl font-bold text-purple-600 mb-2">⭐</div>
                <div class="text-sm text-gray-600 font-medium">Premium TLD</div>
              </div>
              <div class="text-center p-6 bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl">
                <div class="text-3xl font-bold text-pink-600 mb-2">🚀</div>
                <div class="text-sm text-gray-600 font-medium">High Value</div>
              </div>
              <div class="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                <div class="text-3xl font-bold text-green-600 mb-2">✓</div>
                <div class="text-sm text-gray-600 font-medium">Available Now</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Use Cases Section -->
      <section class="py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div class="container mx-auto px-4">
          <div class="max-w-5xl mx-auto">
            <div class="text-center mb-12">
              <h2 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
                Perfect For Your Next Big Idea
              </h2>
              <p class="text-gray-600 text-lg">This domain is ideal for:</p>
            </div>
            <div class="grid md:grid-cols-3 gap-6">
              <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div class="text-4xl mb-4">💼</div>
                <h3 class="text-xl font-bold mb-2 text-gray-900">Business & Startups</h3>
                <p class="text-gray-600">Launch your company with a memorable, professional domain that builds instant credibility.</p>
              </div>
              <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div class="text-4xl mb-4">🎨</div>
                <h3 class="text-xl font-bold mb-2 text-gray-900">Creative Projects</h3>
                <p class="text-gray-600">Stand out with a unique domain perfect for portfolios, agencies, or creative ventures.</p>
              </div>
              <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                <div class="text-4xl mb-4">🌐</div>
                <h3 class="text-xl font-bold mb-2 text-gray-900">Web3 & Tech</h3>
                <p class="text-gray-600">Build trust in the blockchain space with a premium domain that signals innovation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      <!-- How It Works Section -->
      <section class="py-20 bg-white">
        <div class="container mx-auto px-4">
          <div class="max-w-5xl mx-auto">
            <div class="text-center mb-16">
              <h2 class="text-4xl md:text-5xl font-bold mb-4">
                <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  How It Works
                </span>
              </h2>
              <p class="text-gray-600 text-lg">Simple, secure, and fast domain acquisition</p>
            </div>
            <div class="grid md:grid-cols-3 gap-8">
              <div class="relative">
                <div class="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-2xl font-bold rounded-2xl mb-6 mx-auto shadow-lg">1</div>
                <h3 class="text-xl font-bold mb-3 text-center text-gray-900">Connect & Offer</h3>
                <p class="text-gray-600 text-center">Connect your Web3 wallet and make an offer, or purchase at the listed price on Doma Protocol.</p>
              </div>
              <div class="relative">
                <div class="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-2xl font-bold rounded-2xl mb-6 mx-auto shadow-lg">2</div>
                <h3 class="text-xl font-bold mb-3 text-center text-gray-900">Secure Transaction</h3>
                <p class="text-gray-600 text-center">Complete the purchase through our secure blockchain-based escrow system. Your funds are protected.</p>
              </div>
              <div class="relative">
                <div class="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-600 to-pink-500 text-white text-2xl font-bold rounded-2xl mb-6 mx-auto shadow-lg">3</div>
                <h3 class="text-xl font-bold mb-3 text-center text-gray-900">Instant Transfer</h3>
                <p class="text-gray-600 text-center">Receive your domain immediately upon payment. Full ownership rights transferred to you.</p>
              </div>
            </div>
            <div class="mt-12 text-center">
              <div class="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border-2 border-green-200 rounded-xl">
                <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                </svg>
                <span class="text-green-800 font-semibold">100% Secure • Blockchain Protected • Instant Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <div class="text-center mb-16">
              <h2 class="text-4xl md:text-5xl font-bold mb-4">
                <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h2>
            </div>
            <div class="space-y-6">
              <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <h3 class="text-lg font-bold mb-2 text-gray-900">🔒 Is the transaction secure?</h3>
                <p class="text-gray-600">Yes! All transactions are secured through Doma Protocol's blockchain-based smart contracts. Your payment is held in escrow until the domain is successfully transferred.</p>
              </div>
              <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <h3 class="text-lg font-bold mb-2 text-gray-900">⚡ How fast is the transfer?</h3>
                <p class="text-gray-600">Domain ownership is transferred instantly upon payment confirmation. You'll have complete control of your new domain within minutes.</p>
              </div>
              <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <h3 class="text-lg font-bold mb-2 text-gray-900">💰 What payment methods are accepted?</h3>
                <p class="text-gray-600">We accept cryptocurrency payments (ETH, WETH) through Web3 wallets. The transaction is processed on-chain for maximum security and transparency.</p>
              </div>
              <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <h3 class="text-lg font-bold mb-2 text-gray-900">🤝 Can I negotiate the price?</h3>
                <p class="text-gray-600">Absolutely! Use the "Make an Offer" button to submit your best offer. The seller will review and can accept, counter, or decline.</p>
              </div>
              <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <h3 class="text-lg font-bold mb-2 text-gray-900">📞 Can I contact the seller directly?</h3>
                <p class="text-gray-600">Yes! Click "Contact Seller" to start a secure, encrypted chat conversation. Discuss terms, ask questions, or negotiate directly.</p>
              </div>
              <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100">
                <h3 class="text-lg font-bold mb-2 text-gray-900">🔄 What if something goes wrong?</h3>
                <p class="text-gray-600">Smart contracts ensure automatic refunds if the transfer fails. Your funds are never at risk, and our support team is available to help resolve any issues.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-16 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center text-white">
            <h2 class="text-4xl md:text-5xl font-bold mb-6">Ready to Own ${domain}?</h2>
            <p class="text-xl mb-8 text-white/90">Don't miss this opportunity. Premium domains sell fast.</p>
            <div class="flex flex-wrap justify-center gap-4">
              <a href="#action-buttons" class="inline-flex items-center gap-2 bg-white text-blue-600 px-10 py-5 rounded-2xl text-lg font-bold shadow-2xl hover:shadow-xl hover:scale-105 transition-all">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                Get Started Now
              </a>
              <a href="https://domayne.xyz" target="_blank" class="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-10 py-5 rounded-2xl text-lg font-bold border-2 border-white/30 hover:bg-white/20 hover:scale-105 transition-all">
                Browse More Domains
              </a>
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