# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install MongoDB
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Or use MongoDB Atlas (free cloud database)
# Visit: https://www.mongodb.com/cloud/atlas
```

### Step 2: Setup Backend
```bash
cd gaming-platform/backend
npm install

# Create .env file
echo "PORT=5000
MONGODB_URI=mongodb://localhost:27017/gaming-platform
JWT_SECRET=your-secret-key-here" > .env

# Start server
npm run dev
```

### Step 3: Setup Frontend
```bash
cd gaming-platform/frontend

# Using Python
python3 -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

### Step 4: Seed Sample Games
Open a new terminal and run:
```bash
curl -X POST http://localhost:5000/api/seed
```

### Step 5: Open in Browser
Navigate to: `http://localhost:8000`

## 🎮 Test the Platform

1. **Register a new account** (click Login → Register)
2. **Browse games** on the home page
3. **Add funds** in Profile page (e.g., $100)
4. **Add games to cart**
5. **Checkout** to purchase games
6. **View your library** to see owned games
7. **Access Admin panel** to add/edit games

## 📝 Default Credentials

No default credentials - just register a new account!

## 🔧 Troubleshooting

**MongoDB not connecting?**
- Make sure MongoDB is running: `brew services list` (macOS)
- Check your MONGODB_URI in .env file

**Backend not starting?**
- Check if port 5000 is available
- Verify all dependencies are installed: `npm install`

**Frontend not loading?**
- Make sure backend is running on port 5000
- Check browser console for errors
- Verify API_BASE_URL in `frontend/js/api.js`

**No games showing?**
- Run the seed endpoint: `curl -X POST http://localhost:5000/api/seed`
- Check MongoDB connection

## 🎯 Next Steps

- Customize the design in `frontend/css/`
- Add more games via Admin panel
- Explore the codebase structure
- Add new features!

Happy Gaming! 🎮

