// XMTP client utilities for static HTML embedding
// This will be bundled into the static site for client-side usage

export interface SellerConfig {
  sellerAddress?: string;
  sellerEns?: string;
  contactEmail?: string;
  price?: string;
  currency?: string;
}

export interface XMTPConfig {
  env: 'dev' | 'production';
  contentTypes?: string[];
}

// Configuration discovery functions
export const discoverSellerConfig = async (domain: string): Promise<SellerConfig | null> => {
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

  // 4. Future: On-chain lookup (not implemented in MVP)
  // const onChainConfig = await getOnChainConfig(domain);
  // if (onChainConfig) return onChainConfig;

  return null;
};

// Get embedded config from script tag
const getEmbeddedConfig = (): SellerConfig | null => {
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

// Get config from URL parameters
const getUrlParamsConfig = (): SellerConfig | null => {
  const params = new URLSearchParams(window.location.search);
  const seller = params.get('seller');

  if (!seller) return null;

  // Determine if it's an ENS name or address
  const isEns = seller.includes('.eth') || seller.includes('.');

  return {
    [isEns ? 'sellerEns' : 'sellerAddress']: seller,
    contactEmail: params.get('contact') || undefined,
    price: params.get('price') || undefined,
    currency: params.get('currency') || undefined,
  };
};

// Fetch hosted config from API
const getHostedConfig = async (domain: string): Promise<SellerConfig | null> => {
  try {
    // Try to fetch from the app's API if available
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
        // Continue to next URL
        continue;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch hosted config:', error);
  }
  return null;
};

// ENS resolution utility
export const resolveEnsToAddress = async (ensName: string, provider: any): Promise<string | null> => {
  try {
    if (!provider) return null;
    const address = await provider.getAddress(ensName);
    return address;
  } catch (error) {
    console.warn('Failed to resolve ENS:', error);
    return null;
  }
};

// Wallet connection utilities
export const connectWallet = async (): Promise<any> => {
  if (typeof window === 'undefined') return null;

  // Check if MetaMask is available
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
export const switchToSepolia = async (): Promise<boolean> => {
  if (!window.ethereum) return false;

  const sepoliaChainId = '0xaa36a7'; // 11155111 in hex

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: sepoliaChainId }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
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

// Check current network
export const getCurrentChainId = async (): Promise<string | null> => {
  if (!window.ethereum) return null;

  try {
    return await window.ethereum.request({ method: 'eth_chainId' });
  } catch (error) {
    console.error('Failed to get chain ID:', error);
    return null;
  }
};

// Ethereum provider types
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (eventName: string, handler: (...args: any[]) => void) => void;
      removeListener: (eventName: string, handler: (...args: any[]) => void) => void;
    };
  }
}