# Domayne

**One-click, SEO optimized landing pages for your tokenized domains**

Domayne makes tokenized domains usable by combining on-chain listings, SEO-optimized landing pages, decentralized hosting, and direct buyer–seller chat into one seamless platform.

🌐 **[Visit Domayne](https://domayne.xyz)**

---

## Features

### 🔗 Doma Integration
List and manage on-chain orders directly from the platform. Seamlessly connect to the Doma Protocol to create, update, and track your domain listings on the blockchain.

### 🔍 SEO Landing Pages
Every domain gets a discoverable, search-engine optimized landing page. Attract organic traffic and make your domains visible to potential buyers across the web.

### ⚡ One-Click Generation
Connect your wallet and launch a fully-functional landing page instantly. No coding, no setup—just connect and go.

### 🌍 IPFS Hosting
Choose between decentralized IPFS hosting or traditional static site deployment. Your content is permanent, censorship-resistant, and always accessible.

### 💬 XMTP Chat
Enable direct buyer–seller messaging through XMTP protocol. Negotiate deals, answer questions, and close sales without leaving the platform.

---

## Roadmap & Vision

Our vision is to turn every tokenized domain into a **discoverable, tradeable storefront** with seamless tools for showcasing, listing, and selling.

### Upcoming Features

- 🔍 **Advanced SEO controls** – Meta tags, analytics integration, and keyword customization for each landing page
- 🎨 **Customizable templates** – Themes, layouts, and branding options for domain storefronts
- 🛒 **Multi-domain portfolio pages** – Showcase and manage multiple domains under one profile
- 💬 **Offer management dashboard** – Track bids, chat history, and negotiations in one place
- 🌐 **Multi-language support** – Localized landing pages to reach global buyers
- 📊 **Analytics dashboard** – Page views, click-throughs, and interest metrics
- 🔗 **Social sharing tools** – One-click share to X, Discord, and Telegram communities
- 🪙 **Fractionalization support** – Optional future feature to co-own or crowdfund domains
- ⛓️ **Cross-chain support** – Expand beyond testnet into multi-chain Doma integrations

---

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v3
- **Blockchain**: Wagmi, Viem, RainbowKit
- **Protocol Integration**: Doma Protocol SDK
- **Decentralized Storage**: IPFS via Helia
- **Messaging**: XMTP Browser SDK
- **Database**: Supabase
- **Deployment**: Vercel

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Doma API key
- Supabase account
- WalletConnect project ID

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
# Doma Protocol
DOMA_API_KEY=your_doma_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Development

```bash
# Run dev server with Turbopack
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Type checking
npm run typecheck
```

---

## Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

---

## License

[Your License Here]

---

## Links

- **Website**: [domayne.xyz](https://domayne.xyz)
- **Doma Protocol**: [doma.xyz](https://doma.xyz)
- **Support**: [Your Support Link]

---

Built with ❤️ for the decentralized web
