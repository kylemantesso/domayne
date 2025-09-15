import { formatPrice } from '@/components/ui/amount-input';

export interface PageSettings {
  title: string;
  description: string;
  ownerName: string;
  contactEmail: string;
  price: string;
  currency: string;
  industryTags: string[];
}

export function generateHTML(domain: string, settings: PageSettings): string {
  const domainParts = domain.split('.');
  const domainName = domainParts[0];
  const tld = domainParts.slice(1).join('.');

  // Use industry tags from settings or generate suggestions
  const industrySuggestions = settings.industryTags && settings.industryTags.length > 0
    ? settings.industryTags
    : (() => {
        const keywords = {
          'fashion': ['Fashion Retail', 'E-commerce', 'Designer Brands', 'Style Blogs'],
          'tech': ['Technology Startups', 'Software Companies', 'Digital Services', 'Innovation Labs'],
          'food': ['Restaurants', 'Food Delivery', 'Recipe Platforms', 'Culinary Services'],
          'travel': ['Travel Agencies', 'Tourism Platforms', 'Booking Services', 'Adventure Companies'],
          'health': ['Healthcare Services', 'Wellness Platforms', 'Medical Practices', 'Fitness Brands'],
          'finance': ['Financial Services', 'Investment Platforms', 'Fintech Startups', 'Banking Solutions'],
          'art': ['Art Galleries', 'Creative Studios', 'Design Agencies', 'Portfolio Sites'],
          'music': ['Music Platforms', 'Record Labels', 'Artist Portfolios', 'Streaming Services'],
          'shop': ['E-commerce Stores', 'Retail Brands', 'Marketplace Platforms', 'Shopping Services']
        };

        const defaultSuggestions = ['E-commerce Platforms', 'Technology Startups', 'Creative Agencies', 'Professional Services'];

        for (const [keyword, suggestions] of Object.entries(keywords)) {
          if (domainName.toLowerCase().includes(keyword)) {
            return suggestions;
          }
        }
        return defaultSuggestions;
      })();

  // Format price display using the formatPrice utility
  const priceDisplay = formatPrice(settings.price, settings.currency);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <!-- Primary Meta Tags -->
    <title>${settings.title}</title>
    <meta name="title" content="${settings.title}" />
    <meta name="description" content="${settings.description}" />
    <meta name="keywords" content="${domain}, domain for sale, premium domain, ${domainName}, ${tld} domain, buy domain, domain investment, web3, crypto, blockchain" />
    <meta name="robots" content="index, follow" />
    <meta name="author" content="${settings.ownerName}" />

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://${domain}/" />
    <meta property="og:title" content="${settings.title}" />
    <meta property="og:description" content="${settings.description}" />
    <meta property="og:image" content="https://via.placeholder.com/1200x630/2563eb/ffffff?text=${encodeURIComponent(domain)}" />
    <meta property="og:site_name" content="${domain}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="https://${domain}/" />
    <meta name="twitter:title" content="${settings.title}" />
    <meta name="twitter:description" content="${settings.description}" />
    <meta name="twitter:image" content="https://via.placeholder.com/1200x630/2563eb/ffffff?text=${encodeURIComponent(domain)}" />

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&family=Geist+Mono:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌐</text></svg>" />

    <!-- JSON-LD Schema Markup -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": "${domain}",
      "description": "${settings.description}",
      "brand": {
        "@type": "Brand",
        "name": "${domain}"
      },
      "offers": {
        "@type": "Offer",
        "availability": "https://schema.org/InStock",
        ${settings.price ? `"price": "${settings.price}",` : ''}
        "priceCurrency": "${settings.currency}",
        "url": "https://${domain}/",
        "seller": {
          "@type": "Organization",
          "name": "${settings.ownerName}",
          ${settings.contactEmail ? `"email": "${settings.contactEmail}",` : ''}
          "url": "https://${domain}/"
        }
      },
      "category": "Domain Name"
    }
    </script>

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        line-height: 1.6;
        color: #ffffff;
        background: linear-gradient(135deg, #2563eb 0%, #9333ea 33%, #ec4899 66%, #fb923c 100%);
        min-height: 100vh;
        font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
        font-variation-settings: normal;
        position: relative;
        overflow-x: hidden;
      }

      body::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(ellipse at 30% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                    radial-gradient(ellipse at 70% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%);
        pointer-events: none;
        z-index: -1;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 20px;
      }

      /* Header */
      .header {
        background: rgba(31, 41, 55, 0.8);
        backdrop-filter: blur(20px);
        padding: 1rem 0;
        position: sticky;
        top: 0;
        z-index: 100;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .header .container {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .logo {
        font-size: 1.5rem;
        font-weight: 800;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .logo::before {
        content: '🌐';
        font-size: 1.25rem;
      }

      .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 0.75rem 1.25rem;
        border-radius: 50px;
        font-size: 0.875rem;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      /* Hero Section */
      .hero {
        padding: 6rem 0;
        text-align: center;
        color: white;
        position: relative;
      }

      .hero::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 800px;
        height: 800px;
        background: radial-gradient(circle, rgba(96, 165, 250, 0.15) 0%, transparent 70%);
        transform: translate(-50%, -50%);
        border-radius: 50%;
        z-index: -1;
      }

      .hero h1 {
        font-size: clamp(3rem, 6vw, 5rem);
        font-weight: 900;
        margin-bottom: 1.5rem;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        line-height: 1.1;
        letter-spacing: -0.025em;
      }

      .hero .domain-highlight {
        color: #60a5fa;
        position: relative;
      }

      .hero .domain-highlight::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 0;
        right: 0;
        height: 3px;
        background: #60a5fa;
        border-radius: 2px;
      }

      .hero p {
        font-size: 1.375rem;
        margin-bottom: 3rem;
        opacity: 0.85;
        max-width: 700px;
        margin-left: auto;
        margin-right: auto;
        line-height: 1.6;
        font-weight: 300;
      }

      .price-display {
        font-size: 3.5rem;
        font-weight: 900;
        color: #60a5fa;
        margin-bottom: 2rem;
        font-family: 'Geist Mono', monospace;
        letter-spacing: -0.02em;
      }

      .cta-button {
        display: inline-block;
        background: #3b82f6;
        color: white;
        padding: 1.25rem 3rem;
        border-radius: 50px;
        text-decoration: none;
        font-weight: 700;
        font-size: 1.25rem;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .cta-button:hover {
        background: #2563eb;
        transform: translateY(-3px);
        box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
      }

      /* Content Sections */
      .content {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        margin-top: -2rem;
        border-radius: 3rem 3rem 0 0;
        padding: 4rem 0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;
      }

      .section {
        padding: 3rem 0;
      }

      .section h2 {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 2rem;
        color: #ffffff;
        text-align: center;
        letter-spacing: -0.02em;
      }

      .value-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 2rem;
        margin: 3rem 0;
      }

      .value-item {
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(10px);
        padding: 2.5rem;
        border-radius: 1.5rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .value-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: #60a5fa;
        border-radius: 1.5rem 1.5rem 0 0;
      }

      .value-item:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        border-color: rgba(255, 255, 255, 0.25);
      }

      .value-item h3 {
        font-size: 1.375rem;
        font-weight: 700;
        margin-bottom: 1rem;
        color: #ffffff;
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .value-item p {
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.7;
        font-size: 1rem;
      }

      .industries {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
        margin: 3rem 0;
      }

      .industry-tag {
        background: rgba(96, 165, 250, 0.15);
        backdrop-filter: blur(10px);
        color: #60a5fa;
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        text-align: center;
        font-weight: 600;
        border: 1px solid rgba(96, 165, 250, 0.3);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }


      .industry-tag:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(96, 165, 250, 0.3);
        border-color: rgba(96, 165, 250, 0.5);
        color: #ffffff;
      }

      /* Contact Section */
      .contact-section {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(20px);
        padding: 4rem 0;
        text-align: center;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .contact-form {
        max-width: 700px;
        margin: 3rem auto 0;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(15px);
        padding: 3rem;
        border-radius: 2rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.15);
      }

      .form-group {
        margin-bottom: 2rem;
        text-align: left;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.75rem;
        font-weight: 600;
        color: #ffffff;
        font-size: 1.1rem;
      }

      .form-group input,
      .form-group textarea {
        width: 100%;
        padding: 1rem 1.25rem;
        background: rgba(255, 255, 255, 0.08);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 1rem;
        font-size: 1rem;
        color: #ffffff;
        transition: all 0.3s ease;
      }

      .form-group input::placeholder,
      .form-group textarea::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }

      .form-group input:focus,
      .form-group textarea:focus {
        outline: none;
        border-color: rgba(96, 165, 250, 0.6);
        box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
        background: rgba(255, 255, 255, 0.12);
      }

      .submit-button {
        background: #3b82f6;
        color: white;
        padding: 1rem 2.5rem;
        border: none;
        border-radius: 1rem;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .submit-button:hover {
        background: #2563eb;
        transform: translateY(-2px);
        box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
      }

      /* Footer */
      .footer {
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(20px);
        color: rgba(255, 255, 255, 0.8);
        padding: 4rem 0 2rem;
        text-align: center;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .footer p {
        margin: 1rem 0;
        font-size: 1rem;
        line-height: 1.6;
      }

      .trust-signals {
        display: flex;
        justify-content: center;
        gap: 3rem;
        margin: 3rem 0 2rem;
        flex-wrap: wrap;
      }

      .trust-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1rem;
        font-weight: 500;
        color: #ffffff;
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        padding: 1rem 1.5rem;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
      }

      .trust-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
      }

      .trust-item span {
        font-size: 1.25rem;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .header .container {
          flex-direction: column;
          gap: 1.5rem;
          padding: 1rem 0;
        }

        .hero {
          padding: 4rem 0;
        }

        .hero h1 {
          font-size: clamp(2rem, 8vw, 3.5rem);
        }

        .hero p {
          font-size: 1.125rem;
          padding: 0 1rem;
        }

        .price-display {
          font-size: 2.5rem;
        }

        .cta-button {
          padding: 1rem 2rem;
          font-size: 1.125rem;
        }

        .section h2 {
          font-size: 2rem;
        }

        .value-grid {
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .value-item {
          padding: 2rem;
        }

        .industries {
          grid-template-columns: 1fr;
          gap: 1rem;
        }

        .contact-form {
          margin: 2rem 1rem 0;
          padding: 2rem;
        }

        .trust-signals {
          flex-direction: column;
          gap: 1.5rem;
          margin: 2rem 0;
        }

        .trust-item {
          margin: 0 1rem;
        }
      }

      /* Enhanced animations */
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      .hero::before {
        animation: float 6s ease-in-out infinite;
      }
    </style>
  </head>
  <body>
    <!-- Header -->
    <header class="header">
      <div class="container">
        <div class="logo">${domain}</div>
        <div class="verified-badge">
          <span>✓</span>
          Verified Ownership
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1><span class="domain-highlight">${domain}</span> is available!</h1>
        <p>A premium domain name perfect for building your brand. Short, memorable, and ready to power your next big idea.</p>
        ${settings.price ? `<div class="price-display">${priceDisplay}</div>` : ''}
        <a href="#contact" class="cta-button">${settings.price ? `Buy for ${priceDisplay}` : 'Make an Offer'}</a>
      </div>
    </section>

    <!-- Content -->
    <div class="content">
      <div class="container">
        <!-- Value Proposition -->
        <section class="section">
          <h2>Why Choose ${domain}?</h2>
          <div class="value-grid">
            <div class="value-item">
              <h3>🚀 Memorable & Brandable</h3>
              <p>Short, catchy domain names like ${domain} are easier for customers to remember, type, and share with others.</p>
            </div>
            <div class="value-item">
              <h3>📈 SEO Advantage</h3>
              <p>Premium domains often rank better in search engines and build instant credibility with your audience.</p>
            </div>
            <div class="value-item">
              <h3>💎 Investment Value</h3>
              <p>Quality domain names appreciate in value over time and serve as digital real estate for your business.</p>
            </div>
            <div class="value-item">
              <h3>🎯 Industry Perfect</h3>
              <p>This domain is ideal for businesses in ${industrySuggestions.length > 0 ? industrySuggestions[0].toLowerCase() : 'various industries'}${industrySuggestions.length > 1 ? `, ${industrySuggestions[1].toLowerCase()}` : ''}, and related industries.</p>
            </div>
          </div>
        </section>

        <!-- Industry Examples -->
        <section class="section">
          <h2>Perfect For These Industries</h2>
          <div class="industries">
            ${industrySuggestions.map(industry => `<div class="industry-tag">${industry}</div>`).join('')}
          </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="contact-section">
          <div class="container">
            <h2>Interested in ${domain}?</h2>
            <p>Get in touch to discuss pricing and make an offer. All inquiries are handled professionally and confidentially.</p>
            <form class="contact-form" action="#" method="post">
              <div class="form-group">
                <label for="name">Your Name</label>
                <input type="text" id="name" name="name" required />
              </div>
              <div class="form-group">
                <label for="email">Email Address</label>
                <input type="email" id="email" name="email" required />
              </div>
              <div class="form-group">
                <label for="company">Company (Optional)</label>
                <input type="text" id="company" name="company" />
              </div>
              <div class="form-group">
                <label for="offer">Your Offer or Message</label>
                <textarea id="offer" name="offer" rows="4" placeholder="Tell us about your project and budget range..." required></textarea>
              </div>
              <button type="submit" class="submit-button">Send Inquiry</button>
            </form>
          </div>
        </section>
      </div>
    </div>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="trust-signals">
          <div class="trust-item">
            <span>🔒</span>
            Secure Transaction
          </div>
          <div class="trust-item">
            <span>✓</span>
            Verified Owner
          </div>
          <div class="trust-item">
            <span>🌐</span>
            Premium Domain
          </div>
          <div class="trust-item">
            <span>💬</span>
            Professional Support
          </div>
        </div>
        <p>&copy; 2024 ${domain}. This domain is for sale.</p>
        <p>Serious inquiries only. All offers will be considered professionally.</p>
      </div>
    </footer>

    <script>
      // Smooth scrolling for anchor links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        });
      });

      // Form handling
      document.querySelector('.contact-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Thank you for your interest in ${domain}! In a real implementation, this would send your inquiry to the domain owner.');
      });

      // Add some interactivity
      const ctaButton = document.querySelector('.cta-button');
      ctaButton.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px) scale(1.05)';
      });

      ctaButton.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
      });
    </script>
  </body>
</html>`;
}