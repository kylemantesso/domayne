import React from 'react';
import Image from 'next/image';

/**
 * Scalable Logo component that displays the Domayne logo with optional text
 * 
 * @example
 * // Basic usage
 * <Logo />
 * 
 * @example
 * // Custom size
 * <Logo height={80} textSize="xl" />
 * 
 * @example
 * // Logo only (no text)
 * <Logo showText={false} height={40} />
 * 
 * @example
 * // Custom styling
 * <Logo textColor="text-blue-600" gap={4} className="my-4" />
 */

interface LogoProps {
  height?: number;
  width?: number;
  className?: string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: string;
  gap?: number;
}

export function Logo({ 
  height = 60, 
  width, 
  className = '', 
  showText = true,
  textSize = 'lg',
  textColor = 'text-white',
  gap = 3
}: LogoProps) {
  // Calculate text size based on logo height
  const getTextSize = () => {
    switch (textSize) {
      case 'sm':
        return Math.max(12, height * 0.3);
      case 'md':
        return Math.max(16, height * 0.4);
      case 'lg':
        return Math.max(20, height * 0.5);
      case 'xl':
        return Math.max(24, height * 0.6);
      default:
        return Math.max(20, height * 0.5);
    }
  };

  const textHeight = getTextSize();
  const logoWidth = width || height; // Default to square if width not specified

  return (
    <div className={`flex items-center ${className}`} style={{ gap: `${gap * 0.25}rem` }}>
      <div 
        className="relative flex-shrink-0"
        style={{ width: logoWidth, height: height }}
      >
        <Image
          src="/logo.svg"
          alt="Domayne Logo"
          fill
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span 
          className={`font-bold ${textColor}`}
          style={{ 
            fontSize: `${textHeight}px`,
            lineHeight: `${textHeight}px`
          }}
        >
          Domayne
        </span>
      )}
    </div>
  );
}

export default Logo;
