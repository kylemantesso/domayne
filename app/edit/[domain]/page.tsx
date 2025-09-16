'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Download, Eye, Globe, Upload, ExternalLink, Settings, DollarSign, MessageCircle, Wallet, Copy, Check } from "lucide-react";
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DomainPointingInstructions } from '@/components/domain-pointing-instructions';
import { AmountInput } from '@/components/ui/amount-input';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useEnsName } from 'wagmi';

interface PageSettings {
  title: string;
  description: string;
  ownerName: string;
  contactEmail: string;
  price: string;
  currency: string;
  industryTags: string[];
  sellerAddress?: string;
  sellerEns?: string;
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

export default function SitePreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const domain = decodeURIComponent(params.domain as string);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<IPFSUploadResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // Wallet connection hooks
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });

  // Page settings state
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    title: `Buy ${domain} – A Premium Domain for Your Brand`,
    description: `${domain} is a premium domain name available for purchase. Perfect for building your brand. Secure, memorable, and ready to power your business.`,
    ownerName: `${domain} Owner`,
    contactEmail: '',
    price: '',
    currency: 'USD',
    industryTags: [],
    // XMTP configuration
    sellerAddress: '',
    sellerEns: '',
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


  const updatePageSettings = (updates: Partial<PageSettings>) => {
    setPageSettings(prev => ({ ...prev, ...updates }));
  };

  // Auto-populate seller info when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      const updates: Partial<PageSettings> = {
        sellerAddress: address,
      };

      // Also set ENS if available
      if (ensName) {
        updates.sellerEns = ensName;
      }

      updatePageSettings(updates);
    }
  }, [isConnected, address, ensName]);

  // Wallet connection handlers
  const handleConnectWallet = () => {
    const connector = connectors.find(c => c.name === 'MetaMask') || connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const handleDisconnectWallet = () => {
    disconnect();
    // Clear the seller address and ENS when disconnecting
    updatePageSettings({
      sellerAddress: '',
      sellerEns: ''
    });
  };

  const handleUseConnectedWallet = () => {
    if (address) {
      const updates: Partial<PageSettings> = {
        sellerAddress: address,
      };

      if (ensName) {
        updates.sellerEns = ensName;
      }

      updatePageSettings(updates);
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
        ...(pageSettings.currency && { currency: pageSettings.currency })
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
        ...(pageSettings.currency && { currency: pageSettings.currency })
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
              Back to Generator
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Eye className="w-3 h-3" />
              Preview
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
                    src={`/domain/${encodeURIComponent(domain)}?${new URLSearchParams({
                      ...(pageSettings.price && { price: pageSettings.price }),
                      ...(pageSettings.currency && { currency: pageSettings.currency })
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

            {/* Pricing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AmountInput
                  price={pageSettings.price}
                  currency={pageSettings.currency}
                  onPriceChange={(price) => updatePageSettings({ price })}
                  onCurrencyChange={(currency) => updatePageSettings({ currency })}
                  placeholder="10000"
                />
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

                          {ensName && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground">ENS:</span>
                              <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                                {ensName}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(ensName, 'ens')}
                                className="p-1 h-6 w-6"
                              >
                                {copiedField === 'ens' ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          )}

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
                        The Ethereum wallet address buyers will send messages to
                      </p>
                    </div>

                    <div className="text-center text-xs text-muted-foreground">— OR —</div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="sellerEns">Seller ENS Name</Label>
                        {pageSettings.sellerEns && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(pageSettings.sellerEns || '', 'sellerEns')}
                            className="p-1 h-6 w-6"
                          >
                            {copiedField === 'sellerEns' ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                      <Input
                        id="sellerEns"
                        value={pageSettings.sellerEns || ''}
                        onChange={(e) => updatePageSettings({ sellerEns: e.target.value })}
                        placeholder="seller.eth"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        ENS domain that resolves to your wallet address (recommended)
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium text-blue-900 dark:text-blue-100">How XMTP Chat Works:</p>
                          <ul className="text-blue-700 dark:text-blue-200 mt-1 space-y-1 text-xs">
                            <li>• Buyers click "Chat with Seller" and connect their wallet</li>
                            <li>• Messages are encrypted end-to-end via XMTP protocol</li>
                            <li>• Works with MetaMask, WalletConnect, and other wallets</li>
                            <li>• No server required - purely peer-to-peer messaging</li>
                            <li>• Optimized for Sepolia testnet with auto-switching</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {!pageSettings.sellerAddress && !pageSettings.sellerEns && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg">
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                          <strong>⚠️ No seller configured:</strong> The chat widget will show an email fallback using the contact email above.
                        </p>
                      </div>
                    )}

                    {pageSettings.sellerAddress && pageSettings.sellerEns && (
                      <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200">
                          <strong>✅ Multiple options configured:</strong> ENS will be used first, with wallet address as fallback.
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