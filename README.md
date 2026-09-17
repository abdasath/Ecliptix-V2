# Ecliptix - Premium Game Marketplace

A premium full-stack game marketplace featuring a smart game advisor chatbot, real Razorpay payments, an 800+ game catalog, and a stunning dark-themed UI. Built entirely with Vanilla JavaScript, Node.js, Express, and MongoDB.

> 🔗 **Live Demo:** [ecliptix-v2.onrender.com](https://ecliptix-v2.onrender.com)

---

## ✨ Key Features

### 🛒 Store & Marketplace
- Browse **800+ games** with search, genre filters, and pagination.
- Hero carousel showcasing featured titles.
- Game detail modals with full descriptions, system requirements, and genre tags.
- Discount badges, ratings, and dynamic pricing.

### 🤖 AI Game Advisor
- Conversational chat widget with user/AI bubbles and typing indicators.
- **Retrieval-Augmented Generation (RAG)** pipeline matching user queries to the game catalog via Vector Search.
- Context-aware multi-turn responses with Redis session memory.
- Supports recommendations, Q&A, comparisons, and opinions.

### 💳 Real Payments
- **Razorpay integration** with server-side signature verification.
- Wallet system — top up with real money or test cards.
- Full checkout flow with order history and purchase tracking.

### 🔐 Authentication & Security
- JWT authentication with **Redis-backed token blacklisting** (real server-side logout).
- bcrypt password hashing (10 salt rounds).
- Rate limiting on login and registration endpoints.
- Email domain validation via MX record lookup.
- Google OAuth 2.0 sign-in.
- XSS protection with global `escapeHTML()` across all innerHTML injections.

### 📚 User Features
- Game library (owned games collection).
- Shopping cart with add/remove/clear functionalities.
- User profile with wallet balance and purchase history.
- Responsive mobile navigation with optimized layouts.

### 🛠️ Admin Panel
- CRUD operations for game management.
- Admin-only route protection.
- Bulk game catalog management.

---

## 🏗️ Tech Stack

- **Frontend:** HTML5, CSS3 (Glassmorphism), Vanilla JavaScript (ES6+)
- **Backend:** Node.js 22, Express.js, Mongoose ODM
- **Database:** MongoDB Atlas, Redis
- **AI/ML:** Groq (LLM), Google Gemini (Embeddings), MongoDB Atlas Vector Search
- **Payments:** Razorpay
- **Auth:** JWT, bcrypt, Google OAuth 2.0
- **Deployment:** Render (Backend), Vercel (Frontend)

---

## 🚀 Getting Started

### Prerequisites
- Node.js v22+
- MongoDB Atlas account (or local MongoDB)
- Redis (optional, app degrades gracefully)
- Razorpay account (for payments)
- Gemini API key & Groq API key (for the AI Game Advisor)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

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
# Start development server
npm run dev

# Start production server
npm start
```

### Frontend Setup

```bash
cd frontend

# Use any static file server, for example:
npx http-server -p 5500
```

---

## 📄 License

This project is open source and available for educational purposes.

---

**Built with ❤️ by Abdul Asath** 🎮
