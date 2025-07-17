# MelodyMind Frontend

A modern music discovery application that helps users find songs based on mood descriptions and manage personal playlists.

## Features

### Music Search
- **Natural Language Search**: Describe your mood and get personalized music recommendations
- **Advanced Filters**: Filter by energy level, artist, and popularity
- **Smart Matching**: AI-powered song matching with similarity scores
- **Multiple Platforms**: Direct links to Spotify and YouTube Music
- **Audio Preview**: 30-second preview playback using iTunes API

### User Management
- **Firebase Authentication**: Secure login with email/password and Google OAuth
- **User Profiles**: Personalized experience with user information
- **Session Management**: Persistent login state across sessions

### My Page
- **Playlist Management**: Create, edit, and delete personal playlists
- **Song Organization**: Add songs to playlists directly from search results
- **Detailed Views**: View all songs in each playlist with metadata
- **Cross-Platform Links**: Access songs on Spotify and YouTube Music

### Modern UI
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Glass Morphism**: Modern frosted glass design elements
- **Smooth Animations**: Hover effects and transitions
- **Intuitive Controls**: User-friendly interface with clear navigation

## Getting Started

1. **Clone the repositories**
   ```bash
   # Frontend
   git clone https://github.com/cassrose19/frontend.git
   
   # Backend
   git clone https://github.com/jiwoo-jus/MelodyMind.git
   ```

2. **Set up the backend**
   - Follow the README instructions in the backend repository
   - Make sure your backend is up-to-date
   - In your backend's .env file, add the line:
     ```
     CORS_ORIGINS=http://127.0.0.1:5500,http://localhost:3000,http://localhost:5051
     ```
   - This allows the backend server (port 5051) to accept cross-origin requests from live server (127.0.0.1:5500)

3. **Set up the frontend**
   - Use a local server like Live Server extension in VS Code
   - Or use Python: `python -m http.server 8000`
   - Or use Node.js: `npx http-server`

4. **Configure Firebase**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Authentication (Email/Password and Google)
   - Enable Firestore Database
   - Update Firebase config in `script.js` and `mypage.js`

## New Features

### My Page
- Access your personal dashboard via the "My Page" button in the header
- Create, edit, and delete playlists
- View all songs in your playlists
- Remove individual songs from playlists
- Direct links to Spotify and YouTube Music for each song

### Enhanced Authentication
- Login/logout buttons prominently displayed in the header
- Persistent authentication state
- User-specific playlist management
- Secure data storage with Firebase

## Usage

1. **Search for Music**
   - Enter a mood description in the search box
   - Adjust filters for energy level, artist, and popularity
   - Click "Search Music" to get recommendations
   - Preview songs and add them to playlists

2. **Manage Account**
   - Click "Login" to sign in or create an account
   - Your name will appear in the header when logged in
   - Click "Logout" to sign out

3. **My Page Features**
   - Click "My Page" to access your playlist dashboard
   - Create new playlists with custom names
   - View detailed information about each playlist
   - Edit playlist names or delete entire playlists
   - Remove individual songs from playlists

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Tailwind CSS with custom components
- **Authentication**: Firebase Auth
- **Database**: Firestore for user data, MySQL for backend
- **Icons**: Font Awesome
- **Backend**: FastAPI with Elasticsearch and MySQL

## File Structure

```
melodymind0615-front/
├── index.html          # Main homepage with search functionality
├── mypage.html         # User profile and playlist management
├── login.html          # User authentication page
├── signup.html         # User registration page
├── script.js           # Main application logic
├── mypage.js           # My page functionality
├── styles.css          # Custom styling
└── README.md           # This file
```
