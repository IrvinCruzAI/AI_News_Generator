# NewsGen AI

> Transform news headlines into publication-ready articles in 10 seconds. AI-powered content generation for marketers, publishers, and agencies.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Repo](https://img.shields.io/badge/GitHub-View%20Code-blue?logo=github)](https://github.com/IrvinCruzAI/AI_News_Generator)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)

**[🚀 Try Live Demo](https://newsgenai.bolt.host)** | **[For Recruiters](#portfolio-showcase)** | **[Cost Optimization](#cost-optimization)** | **[Technical Deep-Dive](#technical-implementation)**

**A [FutureCrafters](https://www.futurecrafters.ai) Project** • Built by [Irvin Cruz](https://irvincruz.com)

---

## ✨ Highlights

- 🆓 **FREE to run** - Uses Google Gemini (no cost)
- ⚡ **10-second generation** - Headline to full article instantly
- 💰 **75% cost optimized** - $44/mo → $0-16/mo with caching
- 🎨 **Modern UI** - Dark mode, mobile-responsive, premium design
- 🛡️ **Production-ready** - Rate limiting, error handling, TypeScript

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [How It Works](#-how-it-works)
- [Use Cases](#-use-cases)
- [Architecture](#-architecture)
- [About FutureCrafters](#-about-futurecrafters)
- [License](#-license)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Free Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

```bash
# Clone the repository
git clone https://github.com/IrvinCruzAI/AI_News_Generator.git
cd AI_News_Generator

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your Gemini key to .env:
# VITE_GEMINI_API_KEY=your_key_here

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start generating articles!

<details>
<summary><b>Alternative AI Providers</b></summary>

### Option 1: Google Gemini (FREE - Recommended)
```env
VITE_GEMINI_API_KEY=your_key_here
```
Get key: https://makersuite.google.com/app/apikey

### Option 2: Groq (FREE - Fast)
```env
VITE_GROQ_API_KEY=your_key_here
```
Get key: https://console.groq.com/keys

### Option 3: OpenAI (Paid)
```env
VITE_OPENAI_API_KEY=your_key_here
```
Uses gpt-4o-mini (~$2-5/month)

**App automatically tries providers in order: Gemini → Groq → OpenAI**

See [OPTIMIZATION.md](OPTIMIZATION.md) for detailed setup guide.
</details>

---

## 💡 Features

### Core Capabilities
- ✅ **Real-time news search** - Find current headlines on any topic
- ✅ **AI article generation** - Complete articles in 10-15 seconds
- ✅ **Article library** - Save and manage generated content
- ✅ **Dark mode** - Eye-friendly interface
- ✅ **Mobile responsive** - Works on all devices

### Performance & Optimization
- ⚡ **Request caching** - 50% reduction in duplicate API calls
- 🛡️ **Rate limiting** - 10 articles/day free, prevents abuse
- 🔄 **Auto-fallback** - Switches AI providers if one fails
- 📊 **Usage tracking** - See remaining daily quota

---

## 🎨 Tech Stack

**Frontend**
- [React 18](https://react.dev) + TypeScript
- [Vite](https://vitejs.dev) - Lightning-fast dev/build
- [Tailwind CSS](https://tailwindcss.com) - Utility-first styling
- [Lucide React](https://lucide.dev) - Icon library

**AI/ML**
- Google Gemini API (FREE tier)
- Groq API (FREE tier)
- OpenAI API (optional)
- Multi-provider fallback system

**State & Storage**
- LocalStorage for persistence
- In-memory request cache
- Custom React hooks

**Infrastructure**
- Static hosting (Vercel/Netlify ready)
- <1.5s first contentful paint
- Zero backend required

---

## 🔧 How It Works

```
User searches → News API → Display headlines with images
      ↓
User clicks "Generate" → Rate limit check → Cache check
      ↓
AI Provider (Gemini/Groq/OpenAI) → Generate article
      ↓
Display article → Save to library → Available for copy/export
```

<details>
<summary><b>Architecture Details</b></summary>

### Key Components

**`src/services/aiService.ts`**
- Multi-provider AI integration
- Automatic fallback logic
- Error handling and retries

**`src/utils/cache.ts`**
- 5-minute TTL request cache
- Reduces duplicate API calls by ~50%
- Automatic cleanup

**`src/utils/rateLimiter.ts`**
- Daily usage limits (10 articles, 25 searches)
- Concurrent generation control (max 3)
- LocalStorage-based tracking

**`src/components/`**
- NewsGrid - Search results display
- ArticleViewer - Full-screen article reader
- ArticleSidebar - Library management

### Performance Optimizations

- Lazy image loading
- Debounced LocalStorage writes
- Optimistic UI updates
- Request deduplication

See [technical documentation](PROJECT_SPEC.md) for complete details.
</details>

---

## 📖 Use Cases

**For Content Marketers**
Transform trending news into blog posts in seconds. Maintain consistent publishing schedule without increasing headcount.

**For Freelance Writers**  
Generate first drafts 10x faster. Focus your expertise on editing and adding unique insights. Scale from 5 to 50 articles/month.

**For Digital Publishers**  
React to breaking news instantly. Beat competitors with fastest time-to-publish. Maintain quality with AI-assisted workflows.

**For Marketing Agencies**  
Deliver more value per client. Repurpose news across blog posts, social media, and newsletters. Increase retention through consistent output.

---

## 🏢 About FutureCrafters

**NewsGen AI** is part of FutureCrafters' portfolio of practical AI systems for businesses.

We build AI-powered control layers that make operations 10x more efficient:
- **AI Strategy & Implementation** - Custom systems designed for your business
- **Control Layer Sprints** - 2-week rapid AI implementations
- **AI Labs** - Monthly retainer for ongoing development
- **Custom Solutions** - White-label tools and enterprise integrations

**Founded by [Irvin Cruz](https://irvincruz.com)** - CAIO-certified AI strategist with 8+ years building business systems at Disney, Entercom, and beyond.

### Get In Touch

- 📞 **[Book a free consultation](https://calendar.app.google/5of8AAhCW2FVV2Eg7)**
- 📧 **Email:** [hello@futurecrafters.ai](mailto:hello@futurecrafters.ai)
- 🌐 **Website:** [www.futurecrafters.ai](https://www.futurecrafters.ai)
- 💼 **LinkedIn:** [linkedin.com/company/futurecraftersai](https://linkedin.com/company/futurecraftersai)

<details>
<summary><b>More FutureCrafters Projects</b></summary>

- **Mission Control** - Business intelligence dashboard for solopreneurs
- **Rory** - AI content engine with custom voice modeling
- **Nexus** - Network intelligence for LinkedIn relationship management  
- **Sol** - 5-agent AI operating system for business automation

Explore more: [github.com/IrvinCruzAI](https://github.com/IrvinCruzAI)
</details>

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Article generation | 10-15 seconds |
| First contentful paint | <1.5s |
| Success rate | 95%+ |
| Concurrent limit | 5 articles |
| Cost (Gemini) | $0/month |
| Cost (OpenAI) | $2-5/month |

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with modern tools:
- [React](https://react.dev) - UI framework
- [Vite](https://vitejs.dev) - Build tool  
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Google Gemini](https://ai.google.dev) - AI model

---

## 📚 Documentation

- **[OPTIMIZATION.md](OPTIMIZATION.md)** - Cost reduction guide & setup
- **[PROJECT_SPEC.md](PROJECT_SPEC.md)** - Complete technical specification
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Business overview

---

**⭐ Star this repo if you find it useful!**

*Last Updated: February 2026 • A FutureCrafters Project*
