'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Globe, Shield } from "lucide-react";
import { useState } from "react";

interface DomainPointingInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  domain: string;
  ipfsHash: string;
  gateways: string[];
}

export function DomainPointingInstructions({
  isOpen,
  onClose,
  domain,
  ipfsHash,
  gateways
}: DomainPointingInstructionsProps) {
  const [copiedText, setCopiedText] = useState<string>('');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const cnameTarget = `gateway.pinata.cloud`;
  const dnsLinkValue = `/ipfs/${ipfsHash}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Point {domain} to IPFS
          </DialogTitle>
          <DialogDescription>
            Your site has been published to IPFS! Follow these instructions to point your domain to the decentralized site.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your Site Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">IPFS Hash:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs">{ipfsHash}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(ipfsHash, 'hash')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Primary Gateway:</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={gateways[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View Site
                    </a>
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Tabs */}
          <Tabs defaultValue="dnslink" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="dnslink">DNSLink (Recommended)</TabsTrigger>
              <TabsTrigger value="cname">CNAME Redirect</TabsTrigger>
              <TabsTrigger value="providers">DNS Providers</TabsTrigger>
            </TabsList>

            <TabsContent value="dnslink" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    DNSLink Setup (Recommended)
                  </CardTitle>
                  <CardDescription>
                    The most decentralized approach. Your domain will resolve directly to IPFS.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Step 1: Add TXT Record</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      In your DNS provider, add this TXT record for your domain:
                    </p>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Type:</span> TXT
                        </div>
                        <div>
                          <span className="font-medium">Name:</span> _dnslink.{domain}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Value:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">dnslink={dnsLinkValue}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(`dnslink=${dnsLinkValue}`, 'dnslink')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {copiedText === 'dnslink' && (
                      <p className="text-green-600 text-sm mt-2">✓ Copied to clipboard!</p>
                    )}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Step 2: Test Your Setup</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      After DNS propagation (up to 24 hours), test these IPFS gateways:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">https://ipfs.io/ipns/{domain}</code>
                        <a
                          href={`https://ipfs.io/ipns/${domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">https://gateway.pinata.cloud/ipns/{domain}</code>
                        <a
                          href={`https://gateway.pinata.cloud/ipns/${domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 text-blue-600" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cname" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>CNAME Redirect Setup</CardTitle>
                  <CardDescription>
                    Redirect your domain to an IPFS gateway. Simpler but less decentralized.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Add CNAME Record</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Point your domain to a reliable IPFS gateway:
                    </p>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Type:</span> CNAME
                        </div>
                        <div>
                          <span className="font-medium">Name:</span> @ (or www)
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Value:</span>
                          <code className="bg-muted px-2 py-1 rounded text-xs">{cnameTarget}</code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(cnameTarget, 'cname')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {copiedText === 'cname' && (
                      <p className="text-green-600 text-sm mt-2">✓ Copied to clipboard!</p>
                    )}
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Configure Gateway</h4>
                    <p className="text-sm text-muted-foreground">
                      You&apos;ll need to configure the IPFS gateway to serve your specific hash for your domain.
                      This typically requires additional setup with the gateway provider.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="providers" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Cloudflare</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-sm space-y-2">
                      <li>1. Go to Cloudflare dashboard</li>
                      <li>2. Select your domain</li>
                      <li>3. Go to DNS tab</li>
                      <li>4. Add the TXT record above</li>
                      <li>5. Set proxy status to &quot;DNS only&quot;</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Namecheap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-sm space-y-2">
                      <li>1. Log into Namecheap</li>
                      <li>2. Go to Domain List</li>
                      <li>3. Click &quot;Manage&quot; next to your domain</li>
                      <li>4. Go to &quot;Advanced DNS&quot;</li>
                      <li>5. Add the TXT record</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">GoDaddy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-sm space-y-2">
                      <li>1. Sign in to GoDaddy</li>
                      <li>2. Go to My Products</li>
                      <li>3. Click DNS next to your domain</li>
                      <li>4. Click &quot;Add&quot; to add new record</li>
                      <li>5. Select TXT and enter values</li>
                    </ol>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Google Domains</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-sm space-y-2">
                      <li>1. Go to Google Domains</li>
                      <li>2. Select your domain</li>
                      <li>3. Go to DNS tab</li>
                      <li>4. Scroll to &quot;Custom records&quot;</li>
                      <li>5. Add TXT record</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Warning */}
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-1">Important Notes</h4>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                    <li>• DNS changes can take up to 24 hours to propagate</li>
                    <li>• Test your domain on multiple IPFS gateways</li>
                    <li>• Keep your IPFS hash saved - you&apos;ll need it for updates</li>
                    <li>• Consider pinning your content to multiple IPFS nodes for reliability</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={() => window.open(gateways[0], '_blank')}>
              View Live Site
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}