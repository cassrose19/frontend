// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Set up connection to Firebase
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

// Memory of current user's playlist
let playlists = [];

// Reads prompt + displays backend's song recommendations
async function searchMusic() {
  const prompt = document.getElementById("prompt").value;
  const responseContainer = document.getElementById("results");

  if (!prompt.trim()) return;

  responseContainer.innerHTML = `
    <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 text-center">
      <p class="text-gray-600">Searching for your perfect music...</p>
    </div>
  `;

  // Send POST request to backend API
  try {
    const response = await fetch("http://localhost:5051/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    console.log("Response data:", data);

    if (Array.isArray(data) && data.length > 0) {
      responseContainer.innerHTML = "";

      data.forEach(item => {
        const div = document.createElement("div");
        div.className = "song-item bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50 mb-4";

        // Fills in HTML for a returned song
        div.innerHTML = `
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="text-xl font-bold text-gray-800 mb-2">${item.title}</h3>
              <p class="text-gray-600 mb-3">by ${item.artist}</p>
              ${item.score ? `
                <div class="mb-3">
                  <div class="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Match Score</span>
                    <span>${item.score.toFixed(1)}%</span>
                  </div>
                  <div class="w-full bg-pastel-mint rounded-full h-2">
                    <div class="bg-pastel-lavender h-2 rounded-full" style="width: ${Math.min(item.score, 100)}%;"></div>
                  </div>
                </div>
              ` : ''}
              ${item.reason ? `<p class="text-gray-600 text-sm mb-4">${item.reason}</p>` : ''}
              <div class="flex items-center justify-between">
                ${item.spotify_url ? `
                  <a href="${item.spotify_url}" target="_blank" rel="noopener noreferrer"
                    class="inline-flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
                    </svg>
                    <span>Listen on Spotify</span>
                  </a>
                ` : '<div></div>'}
                <button class="add-btn" type="button">+</button>
              </div>
            </div>
          </div>
          <div class="playlist-dropdown"></div>
        `;
        
        // --- NEW --- //
        // Prepares the dropdown menu for user to choose playlists from
        const addBtn = div.querySelector('.add-btn');
        const dropdown = div.querySelector('.playlist-dropdown');

        // --- NEW --- // 
        // "+" button behavior: show playlist options or prompt login
        addBtn.addEventListener('click', async (event) => {
          const songItem = event.currentTarget.closest('.song-item');
          const dropdown = songItem.querySelector('.playlist-dropdown');
          dropdown.innerHTML = '';

          // Users must be logged in to create playlists
          if (!auth.currentUser?.uid) {
            const createOpt = document.createElement('div');
            createOpt.textContent = 'Create playlist';
            createOpt.addEventListener('click', async () => {
              alert('Please log in to create playlists.');
            });
            dropdown.appendChild(createOpt);
          } else {
            await fetchPlaylists();
            await loadPlaylists(dropdown, item);
          }

          songItem.classList.toggle('active');
          dropdown.style.left = addBtn.offsetLeft + 'px';
          dropdown.classList.toggle('show');
        });

        // --- NEW --- //
        // Close dropdown menus when user clicks elsewhere on the page
        document.addEventListener('click', (e) => {
          if (!e.target.closest('.song-item')) {
            document.querySelectorAll('.song-item.active').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.playlist-dropdown.show').forEach(dropdown => {
              dropdown.classList.remove('show');
            });
          }
        });

        responseContainer.appendChild(div);
      });

      await fetchPlaylists();
    } else {
      responseContainer.innerHTML = `
        <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 text-center">
          <p class="text-gray-600">No results found. Try describing your mood differently!</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Fetch error:", error);
    responseContainer.innerHTML = `
      <div class="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 text-center">
        <p class="text-red-600">Unable to connect to music service. Please try again.</p>
      </div>
    `;
  }
}

// --- NEW --- //
// Creates and populates left sidebar with playlists
function renderSidebar() {
  const sidebar = document.getElementById("playlist-list");
  sidebar.innerHTML = "";
  Object.keys(playlists).forEach(playlistName => {
    const container = document.createElement("div");
    // --- NEW --- //
    // Playlist title (clickable to toggle its songs)
    const title = document.createElement("div");
    title.classList.add("playlist");
    title.textContent = playlistName;

    const songsList = document.createElement("div");
    songsList.classList.add("playlist-songs");

    // Each song within playlist is displayed with title + artist names
    (playlists[playlistName] || []).forEach(song => {
      const songItem = document.createElement("div");
      songItem.textContent = `${song.title} - ${song.artist}`;
      songsList.appendChild(songItem);
    });

    title.addEventListener("click", () => {
      songsList.classList.toggle("show");
    });

    container.appendChild(title);
    container.appendChild(songsList);
    sidebar.appendChild(container);
  });
}

// --- NEW --- //
// If user's data exists in Firestore, then extracts 'playlist' field
// and updates sidebar
async function fetchPlaylists() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    playlists = data.playlists || {};
  } else {
    playlists = {};
  }
  renderSidebar();
}

async function createPlaylist(name) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  // Ensures there are no duplicate playlists
  if (!playlists[name]) playlists[name] = [];

  // Saves user's playlist to Firebase
  await setDoc(doc(db, "users", uid), { playlists }, { merge: true });
  return { name };
}

async function addSongToPlaylist(song, playlistName) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  if (!playlists[playlistName]) playlists[playlistName] = [];
  playlists[playlistName].push(song);

  await setDoc(doc(db, "users", uid), { playlists }, { merge: true });
  alert(`Added "${song.title}" to playlist "${playlistName}"!`);

  // Refresh sidebar to show any newly added songs
  await fetchPlaylists();
}

// Make sure playlists are loaded before displaying them
async function loadPlaylists(dropdown, song) {
  if (!Object.keys(playlists).length) {
    await fetchPlaylists();
  }

  dropdown.innerHTML = '';

  Object.keys(playlists).forEach(playlistName => {
    const opt = document.createElement('div');
    opt.textContent = playlistName;
    opt.addEventListener('click', () => addSongToPlaylist(song, playlistName));
    dropdown.appendChild(opt);
  });

  // Give users a "Create playlist" option
  const createOpt = document.createElement('div');
  createOpt.textContent = 'Create playlist';
  createOpt.addEventListener('click', async () => {
    const name = prompt('New playlist name?');
    if (name && !playlists[name]) {
      const newPl = await createPlaylist(name);
      if (newPl && newPl.name) {
        playlists[name] = [];
        await loadPlaylists(dropdown, song);
      }
    } else if (playlists[name]) {
      alert('Playlist already exists.');
    }
  });
  dropdown.appendChild(createOpt);
}

// --- NEW --- //
// Loads and displays sidebar when user logs in 
auth.onAuthStateChanged((user) => {
  if (user) {
    fetchPlaylists();  // Load playlists into sidebar
  } else {
    // Optional: Clear playlists if user logs out
    const sidebar = document.getElementById("playlist-list");
    sidebar.innerHTML = '<p class="text-gray-500 px-4">Log in to see your playlists</p>';
  }
});



document.addEventListener('DOMContentLoaded', fetchPlaylists);

document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.querySelector("button");
  if (searchBtn) {
    searchBtn.addEventListener("click", searchMusic);
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.song-item')) {
    document.querySelectorAll('.playlist-dropdown').forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }
});
