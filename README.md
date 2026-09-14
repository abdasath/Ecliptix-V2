# 🎮 Ecliptix — Full-Stack Game Marketplace

A premium full-stack game marketplace inspired by Steam and Epic Games, featuring a **smart game advisor chatbot**, **real Razorpay payments**, **800+ game catalog**, and a **stunning dark-themed UI**. Built entirely with Vanilla JavaScript, Node.js, Express, and MongoDB.

> 🔗 **Live Demo:** [ecliptix-v2.onrender.com](https://ecliptix-v2.onrender.com)

---

## ✨ Key Features

### 🛒 Store & Marketplace
- Browse **800+ games** with search, genre filters, and pagination
- Hero carousel showcasing featured titles
- Game detail modals with full descriptions, system requirements, and genre tags
- Discount badges, ratings, and dynamic pricing

### 🤖 AI Game Advisor (RAG Chatbot)
- Conversational chat widget with user/AI bubbles and typing indicators
- **Retrieval-Augmented Generation (RAG)** pipeline:
  - Intent parsing via Groq LLM
  - Google Gemini vector embeddings (3072-dim)
  - MongoDB Atlas Vector Search for semantic game matching
  - Context-aware multi-turn responses with Redis session memory
- Supports recommendations, Q&A, comparisons, and opinions

### 💳 Real Payments
- **Razorpay integration** with server-side signature verification
- Wallet system — top up with real money or test cards
- Full checkout flow with order history and purchase tracking

### 🔐 Authentication & Security
- JWT authentication with **Redis-backed token blacklisting** (real server-side logout)
- bcrypt password hashing (10 salt rounds)
- Rate limiting on login (10/15min) and registration (5/hour)
- Email domain validation via MX record lookup
- Google OAuth 2.0 sign-in
- XSS protection with global `escapeHTML()` across all innerHTML injections
- Cross-tab auth synchronization (no stale sessions)

### 📚 User Features
- Game library (owned games collection)
- Shopping cart with add/remove/clear
- User profile with wallet balance and purchase history
- Responsive mobile navigation with genre quick-links

### 🛠️ Admin Panel
- CRUD operations for game management
- Admin-only route protection
- Bulk game catalog management

---

## 🏗️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5 · CSS3 (Custom Properties, Glassmorphism) · Vanilla JavaScript (ES6+) |
| **Backend** | Node.js 22 · Express.js · Mongoose ODM |
| **Database** | MongoDB Atlas · Redis (ioredis) |
| **AI/ML** | Groq (GPT-OSS 120B) · Google Gemini (Embeddings) · MongoDB Atlas Vector Search |
| **Payments** | Razorpay (Test + Production) |
| **Auth** | JWT · bcrypt · Google OAuth 2.0 · Redis JWT Blacklist |
| **Deployment** | Render (Backend) · Vercel (Frontend) |

---

## 📁 Project Structure

```
Ecliptix/
├── backend/
│   ├── config/
│   │   ├── database.js          # MongoDB Atlas connection
│   │   └── redis.js             # Redis client with graceful fallback
│   ├── middleware/
│   │   ├── auth.js              # JWT verification + Redis blacklist check
│   │   └── rateLimiter.js       # Express rate limiting
│   ├── models/
│   │   ├── Game.js              # Game schema (800+ fields, embeddings)
│   │   ├── User.js              # User schema (wallet, cart, owned games)
│   │   └── Order.js             # Order/purchase history
│   ├── routes/
│   │   ├── auth.js              # Register, Login, Logout, Google OAuth
│   │   ├── games.js             # Game listing, search, filters
│   │   ├── cart.js              # Cart CRUD
│   │   ├── orders.js            # Checkout, wallet top-up
│   │   ├── payment.js           # Razorpay order creation + verification
│   │   ├── rag.js               # AI chatbot search endpoint
│   │   └── admin.js             # Admin game management
│   ├── services/
│   │   └── ragService.js        # Full RAG pipeline (intent → embed → search → generate)
│   ├── scripts/
│   │   ├── generateEmbeddings.js    # Batch vector embedding generator
│   │   └── upgradeHighResImages.js  # Image quality upgrade script
│   ├── server.js                # Express app + route mounting
│   └── package.json
├── frontend/
│   ├── css/
│   │   ├── style.css            # Main styles (3500+ lines, dark theme)
│   │   └── components.css       # Reusable component styles
│   ├── js/
│   │   ├── api.js               # API client (auto-detects dev/prod)
│   │   ├── auth.js              # Auth management + cross-tab sync
│   │   ├── games.js             # Game listing, cards, details modal
│   │   ├── cart.js              # Shopping cart logic
│   │   ├── library.js           # Owned games display
│   │   ├── profile.js           # Profile, wallet, order history
│   │   ├── ai-search.js         # AI chatbot widget
│   │   ├── filter-dropdowns.js  # Custom genre dropdown
│   │   ├── admin.js             # Admin panel logic
│   │   └── app.js               # Global init, mobile menu, scroll lock
│   ├── images/                  # Local game assets and icons
│   ├── index.html               # Store (main page)
│   ├── library.html             # User game library
│   ├── profile.html             # Profile + wallet + orders
│   └── admin.html               # Admin panel
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v22+
- MongoDB Atlas account (or local MongoDB)
- Redis (optional — app works without it)
- Razorpay account (for payments)
- Gemini API key (for AI embeddings)
- Groq API key (for AI responses)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-strong-random-secret
GEMINI_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret
REDIS_URL=redis://localhost:6379
```

```bash
# Development
npm run dev

# Production
npm start
```

### Frontend Setup

```bash
cd frontend

# Use any static file server
npx http-server -p 5500
# Or use VS Code Live Server extension
```

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login |
| `POST` | `/api/auth/logout` | ✅ | Logout (blacklists JWT) |
| `GET` | `/api/auth/me` | ✅ | Get current user |
| `GET` | `/api/games` | ❌ | List games (search, filter, paginate) |
| `GET` | `/api/games/:id` | ❌ | Get single game |
| `GET` | `/api/cart` | ✅ | Get user's cart |
| `POST` | `/api/cart/add/:gameId` | ✅ | Add game to cart |
| `DELETE` | `/api/cart/remove/:gameId` | ✅ | Remove from cart |
| `POST` | `/api/orders/checkout` | ✅ | Checkout (deducts wallet) |
| `POST` | `/api/orders/wallet/add` | ✅ | Add funds to wallet |
| `POST` | `/api/payment/create-order` | ✅ | Create Razorpay order |
| `POST` | `/api/payment/verify` | ✅ | Verify payment signature |
| `GET` | `/api/rag/search?q=...` | ✅ | AI game recommendation |
| `GET` | `/api/health` | ❌ | Service health check |

---

## 🧠 AI Architecture (RAG Pipeline)

```
User Query → Intent Parsing (Groq LLM)
                ↓
         Gemini Embedding (3072-dim vector)
                ↓
         MongoDB Atlas Vector Search (top 50 candidates)
                ↓
         Price/Budget Post-Filter
                ↓
         Context Building (game data → prompt)
                ↓
         Groq LLM Response Generation
                ↓
         Redis Session Memory (conversation context)
```

---

## 📄 License

This project is open source and available for educational purposes.

---

**Built with ❤️ by Abdul Asath** 🎮
