import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'viem';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID');
  throw new Error(
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required. Please add it to your .env.local file.'
  );
}

export const config = getDefaultConfig({
  appName: 'Domayne',
  projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
  enableInjected: true,
  enableWalletConnect: true,
  enableCoinbase: true,
});

export const supportedChains = [sepolia] as const;