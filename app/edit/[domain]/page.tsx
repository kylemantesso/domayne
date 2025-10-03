'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download, Globe, Upload, ExternalLink, Settings, MessageCircle, Wallet, Copy, Check, Edit } from "lucide-react";
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DomainPointingInstructions } from '@/components/domain-pointing-instructions';
import { AmountInput } from '@/components/ui/amount-input';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useWalletClient } from 'wagmi';
import { createDomaOrderbookClient, OrderbookType, viemToEthersSigner } from '@doma-protocol/orderbook-sdk';

interface PageSettings {
  title: string;
  description: string;
  ownerName: string;
  contactEmail: string;
  price: string;
  currency: string;
  industryTags: string[];
  sellerAddress?: string;
  enableXMTP: boolean;
}

interface IPFSUploadResult {
  success: boolean;
  hash: string;
  domain: string;
  gateways: string[];
  pinataUrl?: string;
  note?: string;
}

interface DomaListing {
  id: string;
  price: string;
  currency: string;
  tokenId: string;
  seller: string;
  createdAt: string;
  network: string;
  orderbook: string;
}

export default function SitePreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const domain = decodeURIComponent(params.domain as string);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<IPFSUploadResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Doma listing state
  const [domaListing, setDomaListing] = useState<DomaListing | null>(null);
  const [isCheckingListing, setIsCheckingListing] = useState(false);
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [showCreateListing, setShowCreateListing] = useState(false);

  // Wallet connection hooks
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  // Page settings state
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    title: `Buy ${domain} – A Premium Domain for Your Brand`,
    description: `${domain} is a premium domain name available for purchase. Perfect for building your brand. Secure, memorable, and ready to power your business.`,
    ownerName: `${domain} Owner`,
    contactEmail: '',
    price: '',
    currency: 'ETH',
    industryTags: [],
    // XMTP configuration
    sellerAddress: '',
    enableXMTP: true
  });

  // Load URL parameters on mount
  useEffect(() => {
    const urlPrice = searchParams.get('price');
    const urlCurrency = searchParams.get('currency');

    if (urlPrice || urlCurrency) {
      setPageSettings(prev => ({
        ...prev,
        ...(urlPrice && { price: urlPrice }),
        ...(urlCurrency && { currency: urlCurrency })
      }));
    }
  }, [searchParams]);

  // Check for existing Doma listing on mount
  useEffect(() => {
    checkDomaListing();
  }, [domain]); // eslint-disable-line react-hooks/exhaustive-deps


  const updatePageSettings = (updates: Partial<PageSettings>) => {
    setPageSettings(prev => ({ ...prev, ...updates }));
  };

  // Auto-populate seller info when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      updatePageSettings({
        sellerAddress: address,
      });
    }
  }, [isConnected, address]);

  // Wallet connection handlers
  const handleConnectWallet = () => {
    const connector = connectors.find(c => c.name === 'MetaMask') || connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
    // Clear the seller address when disconnecting
    updatePageSettings({
      sellerAddress: ''
    });
  };

  const handleUseConnectedWallet = () => {
    if (address) {
      updatePageSettings({
        sellerAddress: address,
      });
    }
  };

  // Copy to clipboard functionality
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Function to check for existing Doma listing
  const checkDomaListing = async () => {
    setIsCheckingListing(true);
    try {
      const response = await fetch(`/api/doma/check-listing?domain=${encodeURIComponent(domain)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Doma listing check failed:', response.status, errorData);
        return;
      }

      const data = await response.json();
      
      if (data.error) {
        console.error('Doma listing check error:', data.error, data.details);
        return;
      }

      if (data.listing) {
        const listing = data.listing;
        setDomaListing(listing);
        
        // Update page settings with listing data
        updatePageSettings({
          price: listing.price,
          currency: listing.currency,
          // Note: sellerAddress not available from NameListingModel
        });
      } else if (data.note) {
        console.log('Note from API:', data.note);
      }
    } catch (error) {
      console.error('Error checking Doma listing:', error);
    } finally {
      setIsCheckingListing(false);
    }
  };

  // Function to create a new Doma listing using SDK with secure backend proxies
  const createDomaListing = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    if (!pageSettings.price) {
      alert('Please set a price for the listing');
      return;
    }

    if (!walletClient) {
      alert('Wallet client not available. Please reconnect your wallet.');
      return;
    }

    console.log('=== CREATING DOMA LISTING (SECURE BACKEND MODE) ===');
    console.log('Wallet address:', address);
    console.log('Chain ID:', chainId);

    // Check if we're on the correct network (Sepolia testnet)
    const requiredChainId = 11155111; // Sepolia
    if (chainId !== requiredChainId) {
      try {
        console.log(`Switching from chain ${chainId} to ${requiredChainId}`);
        await switchChain({ chainId: requiredChainId });
        console.log('Successfully switched to Sepolia testnet');
        
        // Wait a moment for the network switch to fully complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (switchError) {
        console.error('Failed to switch network:', switchError);
        alert(`Please switch your wallet to Sepolia testnet (Chain ID: ${requiredChainId}). Current chain: ${chainId}`);
        return;
      }
    }

    setIsCreatingListing(true);
    try {
      // Step 1: Get NFT details from backend
      console.log('Step 1: Fetching NFT details for domain:', domain);
      const nftResponse = await fetch(`/api/doma/domain-details?domain=${encodeURIComponent(domain)}`);
      
      if (!nftResponse.ok) {
        throw new Error('Failed to get domain NFT details');
      }
      
      const nftData = await nftResponse.json();
      const nftDetails = nftData.nftDetails;
      
      if (!nftDetails) {
        throw new Error('Could not fetch NFT details for domain. Domain may not be tokenized on Doma Protocol.');
      }
      
      console.log('Got NFT details:', nftDetails);
      
      // Verify ownership
      let ownerAddress = nftDetails.owner;
      if (ownerAddress && ownerAddress.includes(':')) {
        ownerAddress = ownerAddress.split(':').pop() || ownerAddress;
      }
      
      if (ownerAddress && ownerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`You don't own this domain NFT. Owner: ${ownerAddress}`);
      }

      // Convert price to wei (more accurate conversion)
      const priceNumber = parseFloat(pageSettings.price);
      if (priceNumber <= 0) {
        throw new Error('Price must be greater than 0');
      }
      
      // Convert ETH to wei: 1 ETH = 10^18 wei
      // Using string manipulation to avoid floating point precision issues
      const priceStr = priceNumber.toString();
      const [whole, decimal = ''] = priceStr.split('.');
      const paddedDecimal = decimal.padEnd(18, '0');
      const priceInWei = whole + paddedDecimal;
      
      console.log('Price conversion:', {
        inputPrice: pageSettings.price,
        priceNumber,
        priceInWei,
        priceInWeiFormatted: `${BigInt(priceInWei).toString()} wei`
      });

      console.log('Listing details:', {
        domain,
        tokenAddress: nftDetails.contractAddress,
        tokenId: nftDetails.tokenId,
        price: priceInWei,
        priceETH: pageSettings.price,
        currency: pageSettings.currency,
        sellerAddress: address,
      });

      // Step 2: Initialize Doma SDK with backend proxy URL
      console.log('Step 2: Initializing Doma SDK with backend proxy...');
      
      // We'll configure the SDK to use our backend as a proxy
      // The SDK will make API calls, but they'll go through our secure backend
      const client = createDomaOrderbookClient({
        apiClientOptions: {
          baseUrl: '/api/doma/proxy', // Point to our backend proxy
        },
        source: 'domayne',
        chains: []
      });

      // Convert Viem wallet client to Ethers signer
      const signer = viemToEthersSigner(walletClient, 'eip155:11155111');
      console.log('Converted wallet client to Ethers signer');

      // Step 3: Create and sign the listing with SDK
      console.log('Step 3: Creating and signing listing with SDK...');
      const result = await client.createListing({
        params: {
          items: [{
            contract: nftDetails.contractAddress,
            tokenId: nftDetails.tokenId,
            price: priceInWei,
          }],
          source: 'domayne',
          orderbook: OrderbookType.DOMA,
        },
        signer,
        chainId: 'eip155:11155111',
        onProgress: (progress: unknown) => {
          console.log(`Progress:`, progress);
        }
      });

      console.log('SDK result:', result);

      if (result && !result.errors) {
        alert('Successfully created Doma listing!');
        await checkDomaListing();
        setShowCreateListing(false);
      } else {
        throw new Error(result.errors ? result.errors.join(', ') : 'Failed to create listing');
      }

    } catch (error) {
      console.error('Error creating Doma listing:', error);
      alert(`Failed to create listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingListing(false);
    }
  };



  const addIndustryTag = (tag: string) => {
    debugger;
    if (tag.trim() && !pageSettings.industryTags.includes(tag.trim())) {
      setPageSettings(prev => ({
        ...prev,
        industryTags: [...prev.industryTags, tag.trim()]
      }));
    }
  };

  const removeIndustryTag = (tagToRemove: string) => {
    setPageSettings(prev => ({
      ...prev,
      industryTags: prev.industryTags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Use the new download endpoint
      const params = new URLSearchParams({
        ...(pageSettings.price && { price: pageSettings.price }),
        ...(pageSettings.currency && { currency: pageSettings.currency }),
        ...(pageSettings.sellerAddress && { sellerAddress: pageSettings.sellerAddress })
      });

      params.set('download', 'true');
      const downloadUrl = `/download/${encodeURIComponent(domain)}?${params.toString()}`;

      // Create a temporary link to trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${domain}-index.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download HTML. Please try again.');
    } finally {
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  const handlePublishToIPFS = async () => {
    setIsPublishing(true);
    try {
      // Generate HTML using the download endpoint
      const params = new URLSearchParams({
        ...(pageSettings.price && { price: pageSettings.price }),
        ...(pageSettings.currency && { currency: pageSettings.currency }),
        ...(pageSettings.sellerAddress && { sellerAddress: pageSettings.sellerAddress })
      });

      const downloadUrl = `/download/${encodeURIComponent(domain)}?${params.toString()}`;

      // Fetch the HTML content
      const htmlResponse = await fetch(downloadUrl);
      if (!htmlResponse.ok) {
        throw new Error('Failed to generate HTML');
      }

      const htmlContent = await htmlResponse.text();

      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: htmlContent,
          domain: domain,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: IPFSUploadResult = await response.json();
      setPublishResult(result);
      setShowInstructions(true);
    } catch (error) {
      console.error('Failed to publish to IPFS:', error);
      alert('Failed to publish to IPFS. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back home
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Edit className="w-3 h-3" />
              Edit
            </Badge>
            <Badge variant="outline">{domain}</Badge>
            {publishResult && (
              <Badge variant="default" className="gap-1 bg-green-600">
                <Globe className="w-3 h-3" />
                Published to IPFS
              </Badge>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Live Preview</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      variant="outline"
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? 'Downloading...' : 'Download HTML'}
                    </Button>
                    <Button
                      onClick={handlePublishToIPFS}
                      disabled={isPublishing}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      {isPublishing ? 'Publishing...' : 'Publish to IPFS'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="border rounded-lg bg-white dark:bg-gray-950 shadow-inner">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-t-lg border-b text-sm text-muted-foreground flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <span className="ml-2">https://{domain}</span>
                  </div>
                  <iframe
                    key={`preview-${pageSettings.enableXMTP}-${pageSettings.sellerAddress}`}
                    src={`/domain/${encodeURIComponent(domain)}?${new URLSearchParams({
                      ...(pageSettings.price && { price: pageSettings.price }),
                      ...(pageSettings.currency && { currency: pageSettings.currency }),
                      ...(pageSettings.sellerAddress && pageSettings.enableXMTP && { sellerAddress: pageSettings.sellerAddress })
                    }).toString()}`}
                    className="w-full h-[600px] border-0"
                    title="Site Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Features Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Features Included
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">SEO</Badge>
                    Complete meta tags
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Social</Badge>
                    OpenGraph & Twitter
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Schema</Badge>
                    JSON-LD markup
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Mobile</Badge>
                    Responsive design
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Contact</Badge>
                    Lead capture form
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Trust</Badge>
                    Verification badges
                  </div>
                  {pageSettings.enableXMTP && (
                    <div className="flex items-center gap-2 col-span-2">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">XMTP</Badge>
                      Wallet-to-wallet messaging
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Page Settings Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Page Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={pageSettings.title}
                    onChange={(e) => updatePageSettings({ title: e.target.value })}
                    placeholder="Buy domain.com – Premium Domain"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Meta Description</Label>
                  <Textarea
                    id="description"
                    value={pageSettings.description}
                    onChange={(e) => updatePageSettings({ description: e.target.value })}
                    placeholder="Describe your domain and its value..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                      id="ownerName"
                      value={pageSettings.ownerName}
                      onChange={(e) => updatePageSettings({ ownerName: e.target.value })}
                      placeholder="Domain Owner"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={pageSettings.contactEmail}
                      onChange={(e) => updatePageSettings({ contactEmail: e.target.value })}
                      placeholder="owner@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Doma Listing Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6.01"/>
                  </svg>
                  Doma Listing
                  {isCheckingListing && (
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Set your price and list on the Doma Protocol blockchain marketplace
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Price Input */}
                <div className="space-y-2">

                  <AmountInput
                    price={pageSettings.price}
                    currency={pageSettings.currency}
                    onPriceChange={(price) => updatePageSettings({ price })}
                    onCurrencyChange={(currency) => updatePageSettings({ currency })}
                    placeholder="0.0001"
                    ethOnly={true}
                  />
                  {!pageSettings.price && (
                    <p className="text-xs text-muted-foreground">
                      Set your price to enable Doma Protocol listing
                    </p>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t"></div>

                {/* Doma Listing Status */}
                {domaListing ? (
                  // Existing listing display
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="font-semibold text-green-800 dark:text-green-200">Listed on Doma Protocol</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <p className="font-semibold">{domaListing.price} ETH</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Network:</span>
                        <p className="font-semibold">{domaListing.network}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Listed:</span>
                        <p className="font-semibold">{new Date(domaListing.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Token ID:</span>
                        <p className="font-mono text-xs">{domaListing.tokenId.slice(0, 10)}...</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://dashboard-testnet.doma.xyz/domain/${domain}`, '_blank')}
                        className="gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on Doma Testnet
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={checkDomaListing}
                        disabled={isCheckingListing}
                        className="gap-1"
                      >
                        {isCheckingListing ? (
                          <div className="w-3 h-3 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                        ) : (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 4v6h6M23 20v-6h-6"/>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                          </svg>
                        )}
                        Refresh
                      </Button>
                    </div>
                  </div>
                ) : (
                  // No listing - show create option
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">No Doma Listing Found</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-200 mb-3">
                            This domain is not currently listed on Doma Protocol, or the listing is still being indexed. You can check the <a href={`https://dashboard-testnet.doma.xyz/domain/${domain}`} target="_blank" rel="noopener noreferrer" className="underline font-medium">Doma dashboard</a> directly.
                          </p>
                          <div className="space-y-2">
                            <p className="text-xs text-blue-600 dark:text-blue-300">
                              <strong>Benefits of Doma listing:</strong>
                            </p>
                            <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1 ml-4">
                              <li>• Blockchain-verified ownership and transfers</li>
                              <li>• Secure smart contract-based transactions</li>
                              <li>• Global marketplace exposure</li>
                              <li>• Tokenized domain NFT</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowCreateListing(true)}
                        disabled={!pageSettings.price || !isConnected}
                        className="gap-2"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 5v14M5 12h14"/>
                        </svg>
                        Create Doma Listing
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={checkDomaListing}
                        disabled={isCheckingListing}
                        className="gap-1"
                      >
                        {isCheckingListing ? (
                          <div className="w-3 h-3 animate-spin rounded-full border border-gray-400 border-t-transparent"></div>
                        ) : (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 4v6h6M23 20v-6h-6"/>
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
                          </svg>
                        )}
                        Check Again
                      </Button>
                    </div>
                    
                    {!pageSettings.price && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        ⚠️ Please set a price above to enable listing creation
                      </p>
                    )}
                    
                    {!isConnected && (
                      <p className="text-sm text-amber-600 dark:text-amber-400">
                        ⚠️ Please connect your wallet to create a listing
                      </p>
                    )}
                  </div>
                )}
                
                {/* Create listing modal/dialog would go here */}
                {showCreateListing && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div 
                      key={`listing-modal-${pageSettings.price}`}
                      className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">List on Doma Protocol</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateListing(false)}
                        >
                          ✕
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-4xl mb-4">🚀</div>
                          <h4 className="text-lg font-semibold mb-2">Ready to List on Doma?</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Visit Doma Protocol to create a listing for <strong>{domain}</strong> on the blockchain marketplace.
                          </p>
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mb-4">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              <strong>Your domain details:</strong><br/>
                              Price: <strong>{pageSettings.price || '0'} ETH</strong><br/>
                              Network: Sepolia Testnet<br/>
                              Owner: {address?.slice(0, 6)}...{address?.slice(-4)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                          <div className="space-y-2">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>How it works:</strong>
                            </p>
                            <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 ml-4 list-decimal">
                              <li>Creates Seaport-compatible order parameters</li>
                              <li><strong>Signs the order using your wallet</strong> (EIP-712 signature required)</li>
                              <li>Submits to Doma Orderbook API for listing</li>
                              <li>Your domain becomes available on Doma marketplace</li>
                            </ol>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                              <strong>Requirements:</strong> Domain must be tokenized as NFT on Sepolia testnet
                            </p>
                            {isConnected && (
                              <p className="text-xs mt-2">
                                <strong>Current Network:</strong> Chain ID {chainId} 
                                {chainId === 11155111 ? (
                                  <span className="text-green-600 ml-1">✅ Sepolia (Correct)</span>
                                ) : (
                                  <span className="text-amber-600 ml-1">⚠️ Wrong network</span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          {isConnected && chainId !== 11155111 && (
                            <Button
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await switchChain({ chainId: 11155111 });
                                } catch (error) {
                                  console.error('Failed to switch network:', error);
                                  alert('Failed to switch network. Please switch manually in your wallet.');
                                }
                              }}
                              className="w-full gap-2"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                                <path d="M6 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                                <path d="M12 12h.01"/>
                                <path d="M12 2v2"/>
                                <path d="M12 20v2"/>
                                <path d="M4.93 4.93l1.41 1.41"/>
                                <path d="M17.66 17.66l1.41 1.41"/>
                                <path d="M2 12h2"/>
                                <path d="M20 12h2"/>
                                <path d="M6.34 17.66l-1.41 1.41"/>
                                <path d="M19.07 4.93l-1.41 1.41"/>
                              </svg>
                              Switch to Sepolia Testnet
                            </Button>
                          )}
                          
                        <div className="flex gap-2">
                          <Button
                            onClick={createDomaListing}
                            disabled={isCreatingListing}
                            className="flex-1"
                          >
                            {isCreatingListing ? (
                              <>
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                                Creating...
                              </>
                            ) : (
                              'Create Listing with SDK'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowCreateListing(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* XMTP Chat Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  XMTP Chat Integration
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Enable wallet-to-wallet messaging for direct buyer-seller communication
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableXMTP"
                    checked={pageSettings.enableXMTP}
                    onCheckedChange={(checked) => updatePageSettings({ enableXMTP: checked as boolean })}
                  />
                  <Label htmlFor="enableXMTP" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Enable XMTP Chat Widget
                  </Label>
                </div>

                {pageSettings.enableXMTP && (
                  <div className="space-y-4 pt-2 border-t">
                    {/* Wallet Connection Section */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          Connected Wallet
                        </h4>
                        {isConnected ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDisconnectWallet}
                            className="text-xs"
                          >
                            Disconnect
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleConnectWallet}
                            disabled={isPending}
                            className="text-xs gap-1"
                          >
                            <Wallet className="w-3 h-3" />
                            {isPending ? 'Connecting...' : 'Connect Wallet'}
                          </Button>
                        )}
                      </div>

                      {isConnected && address ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Address:</span>
                            <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                              {address.slice(0, 6)}...{address.slice(-4)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(address, 'address')}
                              className="p-1 h-6 w-6"
                            >
                              {copiedField === 'address' ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>

                          <Button
                            variant="default"
                            size="sm"
                            onClick={handleUseConnectedWallet}
                            className="w-full mt-2 gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Use This Wallet for XMTP
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Connect your wallet to auto-populate seller information below
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sellerAddress">Seller Wallet Address</Label>
                        {pageSettings.sellerAddress && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(pageSettings.sellerAddress || '', 'sellerAddress')}
                            className="p-1 h-6 w-6"
                          >
                            {copiedField === 'sellerAddress' ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <Input
                        id="sellerAddress"
                        value={pageSettings.sellerAddress || ''}
                        onChange={(e) => updatePageSettings({ sellerAddress: e.target.value })}
                        placeholder="0x1234567890123456789012345678901234567890"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        The Ethereum wallet address buyers will send XMTP messages to
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100">How XMTP Chat Works:</p>
                          <ul className="text-blue-700 dark:text-blue-200 mt-1 space-y-1 text-xs">
                            <li>• Buyers click &quot;Chat with Seller&quot; and connect their wallet</li>
                            <li>• Messages are encrypted end-to-end via XMTP protocol</li>
                            <li>• Works with MetaMask, WalletConnect, and other wallets</li>
                            <li>• No server required - purely peer-to-peer messaging</li>
                            <li>• Optimized for Sepolia testnet with auto-switching</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {!pageSettings.sellerAddress && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>⚠️ No seller address configured:</strong> Buyers won&apos;t be able to contact you via XMTP chat.
                        </p>
                      </div>
                    )}

                    {pageSettings.sellerAddress && (
                      <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>✅ XMTP chat enabled:</strong> Buyers can message {pageSettings.sellerAddress.slice(0, 6)}...{pageSettings.sellerAddress.slice(-4)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Industry Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Industry Tags</CardTitle>
                <p className="text-sm text-muted-foreground">Add relevant industries for your domain</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {pageSettings.industryTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        onClick={() => removeIndustryTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add industry tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const target = e.target as HTMLInputElement;
                        addIndustryTag(target.value);
                        target.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement;
                      if (input) {
                        addIndustryTag(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* IPFS Results */}
            {publishResult && (
              <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                    <Globe className="w-5 h-5" />
                    Published to IPFS
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">IPFS Hash:</div>
                      <code className="bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded text-sm">
                        {publishResult.hash}
                      </code>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">View Your Site:</div>
                      <div className="flex flex-wrap gap-2">
                        {publishResult.gateways.map((gateway, index) => (
                          <Button
                            key={index}
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(gateway, '_blank')}
                            className="gap-1 text-xs"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Gateway {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => setShowInstructions(true)}
                        className="gap-2"
                      >
                        <Globe className="w-4 h-4" />
                        Point Domain to IPFS
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(publishResult.gateways[0], '_blank')}
                        className="gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Live Site
                      </Button>
                    </div>

                    {publishResult.note && (
                      <div className="text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 p-2 rounded mt-2">
                        {publishResult.note}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Domain Pointing Instructions Modal */}
        {publishResult && (
          <DomainPointingInstructions
            isOpen={showInstructions}
            onClose={() => setShowInstructions(false)}
            domain={domain}
            ipfsHash={publishResult.hash}
            gateways={publishResult.gateways}
          />
        )}
      </div>
    </div>
  );
}