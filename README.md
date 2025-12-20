# 🎮 GameStore - Gaming Platform

A complete gaming buy and sell platform similar to Steam/Epic Games, built with HTML, CSS, JavaScript (frontend) and Node.js/Express with MongoDB (backend).

## Features

### User Features
- ✅ User Authentication (Register/Login)
- ✅ Browse Games with Search & Filters
- ✅ Game Details with System Requirements
- ✅ Shopping Cart
- ✅ Wallet System (Add Funds)
- ✅ Purchase Games
- ✅ Game Library (Owned Games)
- ✅ Purchase History
- ✅ User Profile

### Admin Features
- ✅ Add New Games
- ✅ Edit Games
- ✅ Delete Games
- ✅ View All Games

## Tech Stack

### Frontend
- HTML5
- CSS3 (Modern, Steam-like UI)
- Vanilla JavaScript (ES6+)

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT Authentication
- bcryptjs (Password Hashing)

## Project Structure

```
gaming-platform/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── Game.js             # Game model
│   │   ├── User.js             # User model
│   │   └── Order.js            # Order model
│   ├── routes/
│   │   ├── auth.js             # Authentication routes
│   │   ├── games.js            # Game routes
│   │   ├── cart.js             # Cart routes
│   │   ├── orders.js            # Order routes
│   │   └── admin.js             # Admin routes
│   ├── server.js                # Express server
│   └── package.json
├── frontend/
│   ├── css/
│   │   ├── style.css           # Main styles
│   │   └── components.css      # Component styles
│   ├── js/
│   │   ├── api.js              # API helper functions
│   │   ├── auth.js             # Authentication logic
│   │   ├── games.js            # Games management
│   │   ├── cart.js             # Cart management
│   │   ├── library.js          # Library management
│   │   ├── profile.js          # Profile management
│   │   ├── admin.js            # Admin panel
│   │   └── app.js              # Main app initialization
│   ├── index.html              # Home/Store page
│   ├── library.html            # User library page
│   ├── profile.html            # User profile page
│   └── admin.html              # Admin panel
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd gaming-platform/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/gaming-platform
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

4. Start MongoDB (if running locally):
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud) - just update MONGODB_URI in .env
```

5. Start the backend server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd gaming-platform/frontend
```

2. Open `index.html` in a web browser, or use a local server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

3. Open `http://localhost:8000` in your browser

### Seed Sample Games

After starting the backend, you can seed the database with sample games:

```bash
# Using curl
curl -X POST http://localhost:5000/api/seed

# Or using Postman/Thunder Client
POST http://localhost:5000/api/seed
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Games
- `GET /api/games` - Get all games (with filters)
- `GET /api/games/:id` - Get single game
- `GET /api/games/featured/list` - Get featured games
- `GET /api/games/meta/genres` - Get all genres

### Cart
- `GET /api/cart` - Get user cart (requires auth)
- `POST /api/cart/add/:gameId` - Add game to cart (requires auth)
- `DELETE /api/cart/remove/:gameId` - Remove from cart (requires auth)
- `DELETE /api/cart/clear` - Clear cart (requires auth)

### Orders
- `GET /api/orders` - Get user orders (requires auth)
- `POST /api/orders/checkout` - Checkout cart (requires auth)
- `POST /api/orders/wallet/add` - Add funds to wallet (requires auth)

### Admin
- `GET /api/admin/games` - Get all games (admin)
- `POST /api/admin/games` - Create game (admin)
- `PUT /api/admin/games/:id` - Update game (admin)
- `DELETE /api/admin/games/:id` - Delete game (admin)

## Usage

### As a User

1. **Register/Login**: Click the "Login" button and register a new account or login
2. **Browse Games**: Browse featured games or all games
3. **Search & Filter**: Use the search bar and filters to find games
4. **View Details**: Click on any game to see full details
5. **Add to Cart**: Click "Add to Cart" on any game
6. **Add Funds**: Go to Profile page and add funds to your wallet
7. **Checkout**: Open cart and click "Checkout" to purchase games
8. **View Library**: Go to Library page to see your owned games
9. **View History**: Check Profile page for purchase history

### As an Admin

1. **Login**: Login with any user account (admin check is simplified for demo)
2. **Access Admin Panel**: Navigate to `admin.html`
3. **Add Games**: Fill the form and submit to add new games
4. **Edit Games**: Click "Edit" on any game card
5. **Delete Games**: Click "Delete" to remove games

## Features in Detail

### Game Management
- Games have titles, descriptions, prices, discounts
- System requirements (minimum & recommended)
- Genres, tags, ratings
- Featured games section
- Image galleries

### Shopping Cart
- Add/remove games
- View cart total
- Prevent adding owned games
- Prevent duplicate items

### Wallet System
- Virtual wallet for purchases
- Add funds functionality
- Automatic deduction on checkout

### User Library
- View all owned games
- Quick access to game details
- Organized game collection

## Security Notes

⚠️ **Important**: This is a demo project. For production use:

1. Change `JWT_SECRET` to a strong, random string
2. Add proper admin role checking (currently any authenticated user can be admin)
3. Add input validation and sanitization
4. Use HTTPS in production
5. Add rate limiting
6. Implement proper error handling
7. Add CORS restrictions
8. Use environment variables for all secrets

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- For MongoDB Atlas, ensure IP is whitelisted

### CORS Errors
- Backend has CORS enabled for all origins (development only)
- In production, restrict to your frontend domain

### API Not Responding
- Check if backend server is running on port 5000
- Verify `API_BASE_URL` in `frontend/js/api.js`
- Check browser console for errors

### Games Not Loading
- Run the seed endpoint to add sample games
- Check MongoDB connection
- Verify game data in database

## Future Enhancements

- [ ] User reviews and ratings
- [ ] Wishlist functionality
- [ ] Game recommendations
- [ ] Social features (friends, achievements)
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Game downloads/installation
- [ ] Multiplayer game support
- [ ] Advanced search with filters
- [ ] Game categories and collections

## License

This project is open source and available for educational purposes.

## Contributing

Feel free to fork, modify, and use this project for learning or as a starting point for your own gaming platform!

---

**Enjoy building and gaming! 🎮**

