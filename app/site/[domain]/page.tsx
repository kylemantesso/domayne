'use client'

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Globe } from "lucide-react";
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { AmountInput, formatPrice, CURRENCIES } from '@/components/ui/amount-input';
import { generateHTML, PageSettings } from '@/lib/generate-html';



export default function SitePreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const domain = decodeURIComponent(params.domain as string);

  // State for preview pricing
  const [previewPrice, setPreviewPrice] = useState('');
  const [previewCurrency, setPreviewCurrency] = useState('USD');

  // Load from URL params if present
  useEffect(() => {
    const urlPrice = searchParams.get('price');
    const urlCurrency = searchParams.get('currency');

    if (urlPrice) setPreviewPrice(urlPrice);
    if (urlCurrency) setPreviewCurrency(urlCurrency);
  }, [searchParams]);

  // Default page settings for preview with dynamic pricing
  const defaultSettings: PageSettings = {
    title: `Buy ${domain} – A Premium Domain for Your Brand`,
    description: `${domain} is a premium domain name available for purchase. Perfect for building your brand. Secure, memorable, and ready to power your business.`,
    ownerName: `${domain} Owner`,
    contactEmail: '',
    price: previewPrice,
    currency: previewCurrency,
    industryTags: []
  };

  const generatedHTML = generateHTML(domain, defaultSettings);

  // Create edit URL with current pricing
  const createEditUrl = () => {
    const params = new URLSearchParams();
    if (previewPrice) params.set('price', previewPrice);
    if (previewCurrency) params.set('currency', previewCurrency);

    const baseUrl = `/edit/${encodeURIComponent(domain)}`;
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  };

  return (
    <div className="min-h-screen">
      {/* Claim Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              <span className="font-semibold">This page is available to claim</span>
            </div>

            {/* Live Preview Amount Input */}
            <div className="hidden sm:flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <span className="text-sm font-medium">Try pricing:</span>
              <AmountInput
                price={previewPrice}
                currency={previewCurrency}
                onPriceChange={setPreviewPrice}
                onCurrencyChange={setPreviewCurrency}
                compact={true}
                showIcon={false}
                placeholder="0"
                className="text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {previewPrice && (
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {formatPrice(previewPrice, previewCurrency)}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              Free Setup
            </Badge>
            <Link href={createEditUrl()}>
              <Button size="sm" variant="secondary" className="gap-2">
                <Edit className="w-4 h-4" />
                Claim this page
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Amount Input */}
        <div className="sm:hidden mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-medium">Try pricing:</span>
            <AmountInput
              price={previewPrice}
              currency={previewCurrency}
              onPriceChange={setPreviewPrice}
              onCurrencyChange={setPreviewCurrency}
              compact={true}
              showIcon={false}
              placeholder="0"
              className="text-white"
            />
          </div>
        </div>
      </div>

      {/* Full Site Preview */}
      <div className="relative">
        <iframe
          srcDoc={generatedHTML}
          className="w-full h-screen border-0"
          title={`${domain} Preview`}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}