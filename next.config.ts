import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for XMTP Browser SDK in Next.js 15
  serverExternalPackages: ['@xmtp/user-preferences-bindings-wasm', '@xmtp/wasm-bindings'],
};

export default nextConfig;
