'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, AlertTriangle, ExternalLink, Edit } from "lucide-react";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import Logo from "@/components/ui/logo";

interface OwnedDomain {
  domain: string;
  createdAt: string;
  isPublished: boolean;
  ipfsHash?: string;
  expiresAt?: string;
  tokenId?: string;
}


export default function Home() {
  const [domain, setDomain] = useState('');
  const [ownedDomains, setOwnedDomains] = useState<OwnedDomain[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const router = useRouter();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const isOnSepolia = chainId === sepolia.id;
  const showNetworkWarning = isConnected && !isOnSepolia;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      router.push(`/site/${encodeURIComponent(domain.trim())}`);
    }
  };

  const handleSwitchToSepolia = () => {
    switchChain({ chainId: sepolia.id });
  };

  // Fetch owned domains from our backend API
  const fetchOwnedDomains = useCallback(async (walletAddress: string): Promise<OwnedDomain[]> => {
    setIsLoadingDomains(true);
    try {
      console.log('Fetching domains for address:', walletAddress);

      const response = await fetch(`/api/domains?address=${encodeURIComponent(walletAddress)}&chainId=${chainId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { domains } = await response.json();
      console.log('Backend API response:', domains);

      return domains;
    } catch (error) {
      console.error('Error fetching domains from backend API:', error);
      // Return empty array on error but don't throw to avoid breaking the UI
      return [];
    } finally {
      setIsLoadingDomains(false);
    }
  }, [chainId]);

  // Load owned domains when wallet connects and is on correct network
  useEffect(() => {
    if (isConnected && address && isOnSepolia) {
      fetchOwnedDomains(address).then(setOwnedDomains);
    } else if (!isConnected) {
      setOwnedDomains([]);
    }
  }, [isConnected, address, isOnSepolia, fetchOwnedDomains]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 via-pink-500 to-orange-400 relative overflow-hidden">
      
      <section className="container mx-auto px-4 flex-col py-8">
      <Logo />
      </section>
      <section className="container mx-auto px-4 flex-1 py-8 flex flex-col relative z-10">
        <div className="max-w-6xl relative">
          {/* Background Logo - Desktop Only */}
          <div
            className="lg:block absolute md:left-[300px] md:bottom-[0px] md:w-[800px] md:h-[800px] bottom-[0px] w-[600px] h-[600px] left-[0px] opacity-15 pointer-events-none"
            style={{
              backgroundImage: `url("/logo.svg")`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              willChange: 'auto',
              transform: 'translateZ(0)'
            }}
          />

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white text-left">
            Create a Landing
            <br />
            Page for Your
            <br />
            Domain
          </h1>

          <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl text-left">
            Generate a landing page optimized for
            <br />
            selling your domain name.
          </p>

          {/* Network Warning Banner */}
          {showNetworkWarning && (
            <div className="max-w-2xl mb-8">
              <Card className="bg-orange-500/20 backdrop-blur-sm border-orange-400/30">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-300" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">
                        Switch to Sepolia to continue
                      </p>
                      <p className="text-sm text-white/80">
                        Some features require the Sepolia testnet
                      </p>
                    </div>
                    <Button
                      onClick={handleSwitchToSepolia}
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Switch Network
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="max-w-2xl space-y-6">
            {/* Domain Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="example.xyz"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="h-20 !text-2xl bg-gray-800/80 border-gray-700 text-white placeholder:text-gray-400 rounded-2xl px-6 backdrop-blur-sm font-bold "
                  autoFocus
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:flex-1 h-14 min-h-14 text-lg font-semibold bg-gray-800/80 hover:bg-gray-700/80 text-white border-gray-700 rounded-2xl backdrop-blur-sm py-3"
                  variant="outline"
                >
                  Generate
                </Button>
                <div className="w-full sm:flex-1">
                  <div className="w-full [&>div]:w-full [&_button]:w-full [&_button]:!h-14 [&_button]:!min-h-14 [&_button]:text-lg [&_button]:font-semibold [&_button]:!rounded-2xl [&_button]:bg-blue-500 [&_button]:hover:bg-blue-600 [&_button]:border-0 [&_button]:flex [&_button]:items-center [&_button]:justify-center [&_button]:text-center [&_button]:px-6 [&_button]:py-3">
                    <ConnectButton
                      chainStatus="icon"
                      accountStatus="address"
                      showBalance={false}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Owned Domains Section */}
          {isConnected && isOnSepolia && (
            <div className="mt-16 max-w-4xl">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Globe className="w-5 h-5" />
                    My Domains {ownedDomains.length > 0 && `(${ownedDomains.length})`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingDomains ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                      <span className="ml-3 text-white/80">Loading your domains...</span>
                    </div>
                  ) : ownedDomains.length === 0 ? (
                    <div className="text-center py-8">
                      <Globe className="w-12 h-12 mx-auto text-white/60 mb-4" />
                      <p className="text-lg font-medium text-white mb-2">No domains found</p>
                      <p className="text-sm text-white/80">
                        This wallet doesn&apos;t own any domains on the Doma network yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ownedDomains.map((ownedDomain, index) => (
                        <div key={index} className="p-4 bg-white/10 rounded-lg border border-white/20 backdrop-blur-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <Globe className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-semibold text-lg text-white">{ownedDomain.domain}</span>
                                  <Badge variant={ownedDomain.isPublished ? "default" : "secondary"} className="bg-white/20 text-white border-white/30">
                                    {ownedDomain.isPublished ? "Published" : "Draft"}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm text-white/80">
                                  {ownedDomain.expiresAt && (
                                    <p>Expires {new Date(ownedDomain.expiresAt).toLocaleDateString()}</p>
                                  )}
                                  {ownedDomain.tokenId && (
                                    <div className="flex items-start gap-2">
                                      <span className="flex-shrink-0">Token ID:</span>
                                      <span className="font-mono text-xs break-all leading-relaxed">
                                        {ownedDomain.tokenId}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {ownedDomain.isPublished && ownedDomain.ipfsHash && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                  onClick={() => window.open(`https://ipfs.io/ipfs/${ownedDomain.ipfsHash}`, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  View Live
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={() => router.push(`/site/${encodeURIComponent(ownedDomain.domain)}`)}
                              >
                                <ExternalLink className="w-3 h-3" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                className="gap-1 bg-blue-500 hover:bg-blue-600 text-white"
                                onClick={() => router.push(`/edit/${encodeURIComponent(ownedDomain.domain)}`)}
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
