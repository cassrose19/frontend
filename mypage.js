// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_Rj7M8HvZKTgy-eWMrrHmmtR1Snh81cM",
  authDomain: "melodymind-sum2025.firebaseapp.com",
  projectId: "melodymind-sum2025",
  storageBucket: "melodymind-sum2025.appspot.com",
  messagingSenderId: "328293709777",
  appId: "1:328293709777:web:374aefbd982d9c84d152f0"
};

// Firebase setup
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let playlists = {};
let currentUser = null;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  // Check authentication state
  onAuthStateChanged(auth, (user) => {
    const loginBtn = document.getElementById('login-btn');
    const userInfo = document.getElementById('user-info');
    const userName = document.getElementById('user-name');

    if (user) {
      currentUser = user;
      if (loginBtn) loginBtn.style.display = 'none';
      if (userInfo) userInfo.classList.remove('hidden');
      if (userName) userName.textContent = user.displayName || user.email;
      loadPlaylists();
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (userInfo) userInfo.classList.add('hidden');
      // Redirect to login if not authenticated
      window.location.href = 'login.html';
    }
  });

  // Event listeners
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);
  const closeModalBtn = document.getElementById('close-modal');
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  const closeModalBtn2 = document.getElementById('close-modal-btn');
  if (closeModalBtn2) closeModalBtn2.addEventListener('click', closeModal);
  const deletePlaylistBtn = document.getElementById('delete-playlist-btn');
  if (deletePlaylistBtn) deletePlaylistBtn.addEventListener('click', deleteCurrentPlaylist);
});
// Logout function
async function logout() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error logging out:', error);
    alert('Error logging out. Please try again.');
  }
}

// Load playlists from backend
async function loadPlaylists() {
  if (!currentUser) return;

  try {
    const response = await fetch(`http://localhost:5051/playlists/${currentUser.uid}`);
    if (response.ok) {
      const data = await response.json();
      playlists = data.playlists || {};
    } else {
      playlists = {};
    }

    renderPlaylists();
  } catch (error) {
    console.error('Error loading playlists:', error);
    playlists = {};
    renderPlaylists();
  }
}

// Render playlists in grid
function renderPlaylists() {
  const container = document.getElementById('playlists-container');
  const emptyState = document.getElementById('empty-state');

  if (Object.keys(playlists).length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  container.innerHTML = '';

  Object.keys(playlists).forEach(playlistName => {
    const playlist = playlists[playlistName];
    const validSongs = playlist.filter(song => song && song.title && song.artist);
    const playlistCard = document.createElement('div');
    playlistCard.className = 'bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-200 cursor-pointer';

    playlistCard.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-xl font-bold text-gray-700 truncate">${playlistName}</h3>
        <div class="flex items-center space-x-2">
          <button class="edit-playlist-btn text-blue-500 hover:text-blue-700 transition-colors" data-playlist="${playlistName}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button class="delete-playlist-btn text-red-500 hover:text-red-700 transition-colors" data-playlist="${playlistName}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="mb-4">
        <div class="flex items-center text-sm text-gray-600 mb-2">
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path>
          </svg>
          ${validSongs.length} songs
        </div>

        <div class="space-y-2 max-h-32 overflow-y-auto">
          ${validSongs.map((song, idx) => `
            <div class="text-sm text-gray-600 truncate">
              <span class="font-medium">${song.title}</span> - ${song.artist}
            </div>
          `).join('')}
        </div>
      </div>

      <button class="view-playlist-btn w-full bg-gradient-to-r from-pastel-lavender to-pastel-blue hover:from-purple-300 hover:to-blue-300 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200" data-playlist="${playlistName}">
        View Playlist
      </button>
    `;

    // Add event listeners
    playlistCard.querySelector('.view-playlist-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      showPlaylistModal(playlistName);
    });

    playlistCard.querySelector('.edit-playlist-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      editPlaylistName(playlistName);
    });

    playlistCard.querySelector('.delete-playlist-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deletePlaylist(playlistName);
    });

    container.appendChild(playlistCard);
  });
}

// Create new playlist
// async function createNewPlaylist() {

// Edit playlist name
async function editPlaylistName(oldName) {
  const newName = prompt('Enter new playlist name:', oldName);
  if (!newName || !newName.trim() || newName === oldName) return;

  if (playlists[newName]) {
    alert('Playlist name already exists.');
    return;
  }

  try {
    playlists[newName] = playlists[oldName];
    delete playlists[oldName];
    await savePlaylistsToBackend();
    // remove old playlist from backend
    await fetch(`http://localhost:5051/playlists/${currentUser.uid}/${encodeURIComponent(oldName)}`, {
      method: 'DELETE'
    });
    renderPlaylists();
  } catch (error) {
    console.error('Error editing playlist:', error);
    alert('Failed to edit playlist. Please try again.');
  }
}

// Delete playlist
async function deletePlaylist(playlistName) {
  if (!confirm(`Are you sure you want to delete "${playlistName}"?`)) return;

  try {
    const response = await fetch(`http://localhost:5051/playlists/${currentUser.uid}/${encodeURIComponent(playlistName)}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      delete playlists[playlistName];
      renderPlaylists();
    } else {
      throw new Error('Failed to delete playlist');
    }
  } catch (error) {
    console.error('Error deleting playlist:', error);
    alert('Failed to delete playlist. Please try again.');
  }
}

// Show playlist modal
function showPlaylistModal(playlistName) {
  const modal = document.getElementById('playlist-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');
  
  modalTitle.textContent = playlistName;
  modalContent.innerHTML = '';

  const playlist = playlists[playlistName];
  
  const validSongs = playlist.filter(song => song && song.title && song.artist);
  if (validSongs.length === 0) {
    modalContent.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-1v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-1"></path>
        </svg>
        <p class="text-sm">No songs in this playlist</p>
      </div>
    `;
  } else {
    validSongs.forEach((song, index) => {
      const songElement = document.createElement('div');
      songElement.className = 'flex items-center justify-between p-4 bg-gray-50 rounded-lg';

      songElement.innerHTML = `
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500 w-6">${index + 1}</span>
          <div>
            <h4 class="font-medium text-gray-700">${song.title}</h4>
            <p class="text-sm text-gray-500">by ${song.artist}</p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          ${song.spotify_url ? `
            <a href="${song.spotify_url}" target="_blank" class="text-green-500 hover:text-green-700" title="Open in Spotify">
              <i class="fa fa-spotify text-lg"></i>
            </a>
          ` : ''}
          ${song.youtube_music_url ? `
            <a href="${song.youtube_music_url}" target="_blank" class="text-red-500 hover:text-red-700" title="Open in YouTube Music">
              <i class="fa fa-youtube-play text-lg"></i>
            </a>
          ` : ''}
          <button class="remove-song-btn text-red-500 hover:text-red-700 transition-colors" data-index="${index}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      `;

      // Add remove song event listener
      songElement.querySelector('.remove-song-btn').addEventListener('click', () => {
        removeSongFromPlaylist(playlistName, index);
      });

      modalContent.appendChild(songElement);
    });
  }

  // Set current playlist for delete button
  document.getElementById('delete-playlist-btn').dataset.playlist = playlistName;
  
  modal.classList.remove('hidden');
}

// Close modal
function closeModal() {
  document.getElementById('playlist-modal').classList.add('hidden');
}

// Remove song from playlist
async function removeSongFromPlaylist(playlistName, songIndex) {
  if (!confirm('Are you sure you want to remove this song?')) return;

  try {
    playlists[playlistName].splice(songIndex, 1);
    await savePlaylistsToBackend();
    renderPlaylists();
    showPlaylistModal(playlistName); // Refresh modal
  } catch (error) {
    console.error('Error removing song:', error);
    alert('Failed to remove song. Please try again.');
  }
}

// Delete current playlist (from modal)
async function deleteCurrentPlaylist() {
  const playlistName = document.getElementById('delete-playlist-btn').dataset.playlist;
  if (!playlistName) return;

  if (!confirm(`Are you sure you want to delete "${playlistName}"?`)) return;

  try {
    const response = await fetch(`http://localhost:5051/playlists/${currentUser.uid}/${encodeURIComponent(playlistName)}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      delete playlists[playlistName];
      renderPlaylists();
      closeModal();
    } else {
      throw new Error('Failed to delete playlist');
    }
  } catch (error) {
    console.error('Error deleting playlist:', error);
    alert('Failed to delete playlist. Please try again.');
  }
}

// Save playlists to backend
async function savePlaylistsToBackend() {
  if (!currentUser) return;

  try {
    // Save each playlist separately
    for (const [playlistName, songs] of Object.entries(playlists)) {
      const response = await fetch('http://localhost:5051/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.uid,
          playlist_name: playlistName,
          songs: songs
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save playlist: ${playlistName}`);
      }
    }
  } catch (error) {
    console.error('Error saving playlists:', error);
    throw error;
  }
}

// Close modal when clicking outside
document.getElementById('playlist-modal').addEventListener('click', (e) => {
  if (e.target.id === 'playlist-modal') {
    closeModal();
  }
});
