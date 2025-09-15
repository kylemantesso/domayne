'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Download, Eye, Globe, Upload, ExternalLink, Settings, DollarSign } from "lucide-react";
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DomainPointingInstructions } from '@/components/domain-pointing-instructions';
import { AmountInput, CURRENCIES, formatPrice } from '@/components/ui/amount-input';
import { generateHTML, PageSettings } from '@/lib/generate-html';




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

  // Page settings state
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    title: `Buy ${domain} – A Premium Domain for Your Brand`,
    description: `${domain} is a premium domain name available for purchase. Perfect for building your brand. Secure, memorable, and ready to power your business.`,
    ownerName: `${domain} Owner`,
    contactEmail: '',
    price: '',
    currency: 'USD',
    industryTags: []
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

  const generatedHTML = generateHTML(domain, pageSettings);

  const updatePageSettings = (updates: Partial<PageSettings>) => {
    setPageSettings(prev => ({ ...prev, ...updates }));
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

  const handleDownload = () => {
    setIsDownloading(true);

    const blob = new Blob([generatedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsDownloading(false), 1000);
  };

  const handlePublishToIPFS = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch('/api/ipfs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          html: generatedHTML,
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
                    srcDoc={generatedHTML}
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