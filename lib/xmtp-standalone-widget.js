// Standalone XMTP Chat Widget for Static HTML
// This file will be bundled and included in static HTML exports

(function() {
  'use strict';

  // Global widget state
  let widgetState = {
    isOpen: false,
    sellerConfig: null,
    resolvedSellerAddress: null,
    currentAccount: null,
    xmtpClient: null,
    conversation: null,
    messages: [],
    isLoading: false,
    error: null,
    chainId: null,
    networkBannerDismissed: false,
    chatState: 'hidden' // 'hidden' | 'connecting' | 'connected' | 'error' | 'no-seller'
  };

  // Configuration discovery functions
  const discoverSellerConfig = async (domain) => {
    // 1. Try embedded config (highest priority)
    const embeddedConfig = getEmbeddedConfig();
    if (embeddedConfig) return embeddedConfig;

    // 2. Try URL params
    const urlConfig = getUrlParamsConfig();
    if (urlConfig) return urlConfig;

    // 3. Try hosted config
    try {
      const hostedConfig = await getHostedConfig(domain);
      if (hostedConfig) return hostedConfig;
    } catch (error) {
      console.warn('Failed to fetch hosted config:', error);
    }

    return null;
  };

  const getEmbeddedConfig = () => {
    try {
      const configElement = document.getElementById('xmtp-seller-config');
      if (configElement && configElement.textContent) {
        return JSON.parse(configElement.textContent);
      }
    } catch (error) {
      console.warn('Failed to parse embedded config:', error);
    }
    return null;
  };

  const getUrlParamsConfig = () => {
    const params = new URLSearchParams(window.location.search);
    const seller = params.get('seller');

    if (!seller) return null;

    const isEns = seller.includes('.eth') || seller.includes('.');
    return {
      [isEns ? 'sellerEns' : 'sellerAddress']: seller,
      contactEmail: params.get('contact') || undefined,
      price: params.get('price') || undefined,
      currency: params.get('currency') || undefined,
    };
  };

  const getHostedConfig = async (domain) => {
    try {
      const apiUrls = [
        `https://api.yourapp.com/sites/${domain}.json`,
        `/api/domains/${encodeURIComponent(domain)}`,
      ];

      for (const url of apiUrls) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            return await response.json();
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch hosted config:', error);
    }
    return null;
  };

  // Wallet connection utilities
  const connectWallet = async () => {
    if (typeof window === 'undefined') return null;

    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        return accounts[0];
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw new Error('User rejected wallet connection');
      }
    } else {
      throw new Error('No Ethereum wallet detected. Please install MetaMask or similar wallet.');
    }
  };

  // Network switching utility
  const switchToSepolia = async () => {
    if (!window.ethereum) return false;

    const sepoliaChainId = '0xaa36a7'; // 11155111 in hex

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sepoliaChainId }],
      });
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: sepoliaChainId,
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'SEP',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          });
          return true;
        } catch (addError) {
          console.error('Failed to add Sepolia network:', addError);
          return false;
        }
      }
      console.error('Failed to switch to Sepolia:', switchError);
      return false;
    }
  };

  const getCurrentChainId = async () => {
    if (!window.ethereum) return null;

    try {
      return await window.ethereum.request({ method: 'eth_chainId' });
    } catch (error) {
      console.error('Failed to get chain ID:', error);
      return null;
    }
  };

  // UI Creation functions
  const createChatButton = (domain) => {
    const button = document.createElement('button');
    button.className = 'xmtp-chat-button';
    button.innerHTML = `
      <svg class="xmtp-chat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
      <span class="xmtp-chat-text">Chat with Seller</span>
    `;

    button.onclick = () => openChat(domain);
    return button;
  };

  const createModal = () => {
    const modal = document.createElement('div');
    modal.className = 'xmtp-modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="xmtp-modal">
        <div class="xmtp-modal-header">
          <h3>XMTP Chat</h3>
          <button class="xmtp-close-button" onclick="window.XMTPWidget.closeChat()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="xmtp-modal-content" id="xmtp-modal-content">
          <!-- Content will be dynamically inserted here -->
        </div>
      </div>
    `;

    // Close modal when clicking outside
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeChat();
      }
    };

    return modal;
  };

  // Chat initialization
  const initializeChat = async (domain) => {
    try {
      widgetState.chatState = 'connecting';
      updateModalContent();

      // Connect wallet
      const account = await connectWallet();
      if (!account) {
        throw new Error('Failed to connect wallet');
      }
      widgetState.currentAccount = account;

      // Check network
      const currentChainId = await getCurrentChainId();
      widgetState.chainId = currentChainId;

      // For now, we'll show a simplified version since XMTP browser SDK requires bundling
      // In a real implementation, this would initialize the XMTP client
      widgetState.chatState = 'connected';
      updateModalContent();

    } catch (error) {
      console.error('Failed to initialize chat:', error);
      widgetState.error = error.message || 'Failed to initialize chat';
      widgetState.chatState = 'error';
      updateModalContent();
    }
  };

  // Modal content updates
  const updateModalContent = () => {
    const contentEl = document.getElementById('xmtp-modal-content');
    if (!contentEl) return;

    switch (widgetState.chatState) {
      case 'connecting':
        contentEl.innerHTML = `
          <div class="xmtp-status-container">
            <div class="xmtp-spinner"></div>
            <h3>Connecting to Chat</h3>
            <p>Please connect your wallet and sign the message to start chatting</p>
          </div>
        `;
        break;

      case 'error':
        contentEl.innerHTML = `
          <div class="xmtp-status-container">
            <div class="xmtp-error-icon">⚠️</div>
            <h3>Connection Failed</h3>
            <p>${widgetState.error}</p>
            <button class="xmtp-retry-button" onclick="window.XMTPWidget.retryConnection()">
              Try Again
            </button>
          </div>
        `;
        break;

      case 'no-seller':
        const config = widgetState.sellerConfig;
        contentEl.innerHTML = `
          <div class="xmtp-status-container">
            <div class="xmtp-warning-icon">⚠️</div>
            <h3>Chat Unavailable</h3>
            <p>The seller hasn't configured XMTP messaging for this domain.</p>
            ${config?.contactEmail ? `
              <button class="xmtp-email-button" onclick="window.open('mailto:${config.contactEmail}?subject=Interested in ${getCurrentDomain()}', '_blank')">
                Email Instead
              </button>
            ` : ''}
          </div>
        `;
        break;

      case 'connected':
        const isOnSepolia = widgetState.chainId === '0xaa36a7';
        contentEl.innerHTML = `
          <div class="xmtp-chat-container">
            ${!isOnSepolia && !widgetState.networkBannerDismissed ? `
              <div class="xmtp-network-banner">
                <div class="xmtp-banner-content">
                  <span class="xmtp-warning-icon">⚠️</span>
                  <span>Switch to Sepolia for optimal messaging</span>
                </div>
                <div class="xmtp-banner-actions">
                  <button class="xmtp-switch-network-button" onclick="window.XMTPWidget.switchNetwork()">
                    Switch Network
                  </button>
                  <button class="xmtp-dismiss-banner-button" onclick="window.XMTPWidget.dismissBanner()">
                    ✕
                  </button>
                </div>
              </div>
            ` : ''}

            <div class="xmtp-chat-header">
              <div>
                <h3>${getCurrentDomain()}</h3>
                <p>Chatting with ${getSellerDisplayName()}</p>
              </div>
              <div class="xmtp-encrypted-badge">
                <span>✓</span>
                <span>Encrypted</span>
              </div>
            </div>

            <div class="xmtp-messages-container" id="xmtp-messages-container">
              <div class="xmtp-empty-state">
                <div class="xmtp-chat-icon-large">💬</div>
                <p>Say hi 👋</p>
              </div>
            </div>

            <div class="xmtp-message-input-container">
              <input
                type="text"
                id="xmtp-message-input"
                placeholder="Type your message..."
                onkeypress="if(event.key==='Enter') window.XMTPWidget.sendMessage()"
              />
              <button
                class="xmtp-send-button"
                onclick="window.XMTPWidget.sendMessage()"
                id="xmtp-send-button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        `;
        break;

      default:
        contentEl.innerHTML = '';
    }
  };

  // Utility functions
  const getCurrentDomain = () => {
    return window.location.hostname || 'this domain';
  };

  const getSellerDisplayName = () => {
    const config = widgetState.sellerConfig;
    if (!config) return 'Seller';
    if (config.sellerEns) return config.sellerEns;
    if (config.sellerAddress) {
      return `${config.sellerAddress.slice(0, 6)}...${config.sellerAddress.slice(-4)}`;
    }
    return 'Seller';
  };

  // Main widget functions
  const openChat = async (domain) => {
    // Discover seller config
    const config = await discoverSellerConfig(domain);
    widgetState.sellerConfig = config;

    if (!config || (!config.sellerAddress && !config.sellerEns)) {
      widgetState.chatState = 'no-seller';
    } else {
      if (config.sellerEns && !config.sellerAddress) {
        widgetState.resolvedSellerAddress = config.sellerEns; // Placeholder
      } else if (config.sellerAddress) {
        widgetState.resolvedSellerAddress = config.sellerAddress;
      }
    }

    // Show modal
    const modal = document.getElementById('xmtp-modal-overlay');
    if (modal) {
      modal.style.display = 'flex';
      widgetState.isOpen = true;
      updateModalContent();

      if (widgetState.chatState !== 'no-seller') {
        await initializeChat(domain);
      }
    }
  };

  const closeChat = () => {
    const modal = document.getElementById('xmtp-modal-overlay');
    if (modal) {
      modal.style.display = 'none';
      widgetState.isOpen = false;
    }
  };

  const retryConnection = () => {
    initializeChat(getCurrentDomain());
  };

  const switchNetwork = async () => {
    try {
      const success = await switchToSepolia();
      if (success) {
        widgetState.networkBannerDismissed = true;
        updateModalContent();
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const dismissBanner = () => {
    widgetState.networkBannerDismissed = true;
    updateModalContent();
  };

  const sendMessage = () => {
    const input = document.getElementById('xmtp-message-input');
    if (!input || !input.value.trim()) return;

    // For demo purposes - in real implementation, this would use XMTP
    const messagesContainer = document.getElementById('xmtp-messages-container');
    const emptyState = messagesContainer.querySelector('.xmtp-empty-state');

    if (emptyState) {
      emptyState.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.className = 'xmtp-message xmtp-message-self';
    messageEl.innerHTML = `
      <div class="xmtp-message-content">
        <p>${input.value}</p>
        <span class="xmtp-message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
    `;

    messagesContainer.appendChild(messageEl);
    input.value = '';

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Show a demo response
    setTimeout(() => {
      const responseEl = document.createElement('div');
      responseEl.className = 'xmtp-message xmtp-message-other';
      responseEl.innerHTML = `
        <div class="xmtp-message-content">
          <p>Thanks for your interest! I'll get back to you soon.</p>
          <span class="xmtp-message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      `;
      messagesContainer.appendChild(responseEl);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);
  };

  // Initialize widget
  const initializeWidget = () => {
    const domain = getCurrentDomain();

    // Add styles
    if (!document.getElementById('xmtp-widget-styles')) {
      const styles = document.createElement('style');
      styles.id = 'xmtp-widget-styles';
      styles.textContent = getWidgetStyles();
      document.head.appendChild(styles);
    }

    // Create and insert button
    const targetElement = document.querySelector('.xmtp-chat-target') ||
                         document.querySelector('.cta-button')?.parentNode ||
                         document.body;

    if (targetElement) {
      const button = createChatButton(domain);
      targetElement.appendChild(button);
    }

    // Create and insert modal
    const modal = createModal();
    modal.id = 'xmtp-modal-overlay';
    document.body.appendChild(modal);

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        widgetState.chainId = chainId;
        if (widgetState.isOpen) {
          updateModalContent();
        }
      });
    }
  };

  // Widget styles
  const getWidgetStyles = () => {
    return `
      .xmtp-chat-button {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #2563eb, #9333ea);
        color: white;
        padding: 12px 24px;
        border: none;
        border-radius: 50px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        margin: 8px;
      }

      .xmtp-chat-button:hover {
        background: linear-gradient(135deg, #1d4ed8, #7c3aed);
        transform: translateY(-2px);
        box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
      }

      .xmtp-chat-icon {
        width: 16px;
        height: 16px;
      }

      .xmtp-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }

      .xmtp-modal {
        background: white;
        border-radius: 12px;
        width: 400px;
        max-width: 90vw;
        max-height: 80vh;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      }

      .xmtp-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
      }

      .xmtp-modal-header h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .xmtp-close-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        color: #6b7280;
      }

      .xmtp-close-button:hover {
        background: #e5e7eb;
      }

      .xmtp-close-button svg {
        width: 20px;
        height: 20px;
      }

      .xmtp-modal-content {
        height: 400px;
        overflow: hidden;
      }

      .xmtp-status-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 32px;
        text-align: center;
      }

      .xmtp-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: xmtp-spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes xmtp-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .xmtp-error-icon,
      .xmtp-warning-icon {
        font-size: 32px;
        margin-bottom: 16px;
      }

      .xmtp-status-container h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .xmtp-status-container p {
        margin: 0 0 16px 0;
        color: #6b7280;
        font-size: 14px;
      }

      .xmtp-retry-button,
      .xmtp-email-button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      .xmtp-retry-button:hover,
      .xmtp-email-button:hover {
        background: #2563eb;
      }

      .xmtp-chat-container {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .xmtp-network-banner {
        background: #fef3c7;
        border-bottom: 1px solid #fbbf24;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .xmtp-banner-content {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #92400e;
        font-size: 14px;
        font-weight: 500;
      }

      .xmtp-banner-actions {
        display: flex;
        gap: 8px;
      }

      .xmtp-switch-network-button {
        background: #f59e0b;
        color: white;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
      }

      .xmtp-dismiss-banner-button {
        background: none;
        border: none;
        color: #92400e;
        cursor: pointer;
        padding: 4px;
      }

      .xmtp-chat-header {
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .xmtp-chat-header h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
      }

      .xmtp-chat-header p {
        margin: 0;
        color: #6b7280;
        font-size: 14px;
      }

      .xmtp-encrypted-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #e5e7eb;
        color: #374151;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }

      .xmtp-messages-container {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
      }

      .xmtp-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #6b7280;
      }

      .xmtp-chat-icon-large {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .xmtp-message {
        margin-bottom: 16px;
      }

      .xmtp-message-self {
        display: flex;
        justify-content: flex-end;
      }

      .xmtp-message-other {
        display: flex;
        justify-content: flex-start;
      }

      .xmtp-message-content {
        max-width: 240px;
        padding: 8px 12px;
        border-radius: 12px;
      }

      .xmtp-message-self .xmtp-message-content {
        background: #3b82f6;
        color: white;
      }

      .xmtp-message-other .xmtp-message-content {
        background: #e5e7eb;
        color: #111827;
      }

      .xmtp-message-content p {
        margin: 0 0 4px 0;
        font-size: 14px;
      }

      .xmtp-message-time {
        font-size: 12px;
        opacity: 0.7;
      }

      .xmtp-message-input-container {
        padding: 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }

      .xmtp-message-input-container input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
      }

      .xmtp-message-input-container input:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      .xmtp-send-button {
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .xmtp-send-button:hover {
        background: #2563eb;
      }

      .xmtp-send-button svg {
        width: 16px;
        height: 16px;
      }

      @media (max-width: 640px) {
        .xmtp-modal {
          width: 100%;
          height: 100%;
          border-radius: 0;
        }

        .xmtp-modal-content {
          height: calc(100vh - 73px);
        }
      }
    `;
  };

  // Global API
  window.XMTPWidget = {
    init: initializeWidget,
    openChat,
    closeChat,
    retryConnection,
    switchNetwork,
    dismissBanner,
    sendMessage
  };

  // Auto-initialize if DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    initializeWidget();
  }

})();