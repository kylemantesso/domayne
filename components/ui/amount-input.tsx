'use client'

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";

// Currency options
export const CURRENCIES = {
  fiat: [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  ],
  crypto: [
    { code: 'BTC', name: 'Bitcoin', symbol: '₿' },
    { code: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
    { code: 'BNB', name: 'Binance Coin', symbol: 'BNB' },
    { code: 'XRP', name: 'Ripple', symbol: 'XRP' },
    { code: 'ADA', name: 'Cardano', symbol: 'ADA' },
    { code: 'SOL', name: 'Solana', symbol: 'SOL' },
    { code: 'DOGE', name: 'Dogecoin', symbol: 'DOGE' },
    { code: 'DOT', name: 'Polkadot', symbol: 'DOT' },
    { code: 'MATIC', name: 'Polygon', symbol: 'MATIC' },
    { code: 'AVAX', name: 'Avalanche', symbol: 'AVAX' },
  ]
};

export interface AmountInputProps {
  price: string;
  currency: string;
  onPriceChange: (price: string) => void;
  onCurrencyChange: (currency: string) => void;
  showIcon?: boolean;
  compact?: boolean;
  placeholder?: string;
  className?: string;
}

export function AmountInput({
  price,
  currency,
  onPriceChange,
  onCurrencyChange,
  showIcon = true,
  compact = false,
  placeholder = "Enter amount",
  className = ""
}: AmountInputProps) {
  // Get currency symbol for display
  const allCurrencies = [...CURRENCIES.fiat, ...CURRENCIES.crypto];
  const selectedCurrency = allCurrencies.find(c => c.code === currency);
  const currencySymbol = selectedCurrency?.symbol || currency;

  // Handle formatted input change
  const handleInputChange = (value: string) => {
    // Remove any non-digits
    const cleanValue = value.replace(/[^\d]/g, '');
    onPriceChange(cleanValue);
  };

  // Format value for display
  const displayValue = price ? formatNumber(price) : '';

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showIcon && <DollarSign className="w-4 h-4 text-muted-foreground" />}
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground">
            {currencySymbol}
          </span>
          <Input
            type="text"
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="w-24 h-8 text-sm"
          />
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="w-20 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Fiat</div>
              {CURRENCIES.fiat.map((curr) => (
                <SelectItem key={curr.code} value={curr.code} className="text-xs">
                  {curr.code}
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Crypto</div>
              {CURRENCIES.crypto.map((curr) => (
                <SelectItem key={curr.code} value={curr.code} className="text-xs">
                  {curr.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="price">Price (Optional)</Label>
        <div className="relative">
          <Input
            id="price"
            type="text"
            value={displayValue}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={placeholder}
            className="pl-8"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {currencySymbol}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Fiat Currencies</div>
            {CURRENCIES.fiat.map((curr) => (
              <SelectItem key={curr.code} value={curr.code}>
                {curr.symbol} {curr.name} ({curr.code})
              </SelectItem>
            ))}
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Cryptocurrencies</div>
            {CURRENCIES.crypto.map((curr) => (
              <SelectItem key={curr.code} value={curr.code}>
                {curr.symbol} {curr.name} ({curr.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// Utility function to format numbers with commas (no decimals)
export function formatNumber(value: string | number): string {
  if (!value || value === '') return '';
  const numValue = typeof value === 'string' ? parseInt(value) : value;
  if (isNaN(numValue)) return '';
  return numValue.toLocaleString('en-US');
}

// Utility function to parse formatted number back to plain number
export function parseFormattedNumber(formatted: string): string {
  return formatted.replace(/,/g, '');
}

// Utility function to format price display
export function formatPrice(price: string, currency: string): string {
  if (!price) return 'Make an Offer';

  const allCurrencies = [...CURRENCIES.fiat, ...CURRENCIES.crypto];
  const selectedCurrency = allCurrencies.find(c => c.code === currency);
  const currencySymbol = selectedCurrency?.symbol || currency;

  const formattedPrice = formatNumber(price);
  return `${currencySymbol}${formattedPrice}`;
}