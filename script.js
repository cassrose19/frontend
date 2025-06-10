// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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

// Gets user input and shows "Loading..." message
async function searchMusic() {
  const prompt = document.getElementById("prompt").value;
  const responseContainer = document.getElementById("results");
  responseContainer.innerHTML = "Loading...";

  try {
    // Sends POST request to the backend API running on port 5051
    const response = await fetch("http://localhost:5051/search", {
      // Sends user's prompt as a JSON body
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });
    // Waits for and parses the JSON response from the backend
    const data = await response.json();
    console.log("Response data:", data);

    // Checks if the returned data is an array of results (songs)
    if (Array.isArray(data) && data.length > 0) {
      responseContainer.innerHTML = "";
      // Loops through each song result.
      // For each song, a div is built containing the song title, artist,
      // match score, a spotify link, and a "+" button
      data.forEach(item => {
        const div = document.createElement("div");
        div.className = "song-item bg-white p-4 rounded-lg shadow-md";
        div.innerHTML = `
            <h3 class="text-xl font-semibold text-blue-600">${item.title}</h3>
            <p class="text-gray-700">by <em>${item.artist}</em></p>
            <p class="text-sm text-gray-500">Match score: ${item.score ? item.score.toFixed(2) : "N/A"}</p>
            <p class="text-sm text-gray-600">${item.reason}</p>
            <a class="text-blue-500 underline mt-2 inline-block" href="${item.spotify_url}" target="_blank">Listen on Spotify</a>
            <button class="add-btn" type="button">+</button>
            <div class="playlist-dropdown"></div>
          `;
        // Loads playlists into dropdown
        const addBtn = div.querySelector('.add-btn');
        const dropdown = div.querySelector('.playlist-dropdown');
        addBtn.addEventListener('click', async () => {
          await loadPlaylists(dropdown, item);
          dropdown.style.left = addBtn.offsetLeft + 'px';
          dropdown.classList.toggle('show');
        });
        responseContainer.appendChild(div);
      });
      // If backend doesn't return a list, show a message instead
    } else {
      console.warn("No valid results:", data);
      responseContainer.innerHTML = "No results found.";
    }
  } catch (error) {
    console.error("Fetch error:", error);
    responseContainer.innerHTML = "An error occurred.";
  }
}

let playlists = [];
// Get current user's playlists from Firestore; store 
// them in 'playlist' variable
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
}

// As long as the name isn't already used, create
// a new empty playlist in Firestore
async function createPlaylist(name) {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  if (!playlists[name]) playlists[name] = [];

  await setDoc(doc(db, "users", uid), { playlists }, { merge: true });

  return { name };
}

// Add selected song to the specified playlist, updates Firestore db
async function addSongToPlaylist(song, playlistName) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  if (!playlists[playlistName]) playlists[playlistName] = [];
  playlists[playlistName].push(song);

  await setDoc(doc(db, "users", uid), { playlists }, { merge: true });
}

async function loadPlaylists(dropdown, song) {
  if (!Object.keys(playlists).length) {
    await fetchPlaylists();
  }

  dropdown.innerHTML = '';

  // For each playlist, add clickable option that allows users to
  // add a song to the playlist
  Object.keys(playlists).forEach(playlistName => {
    const opt = document.createElement('div');
    opt.textContent = playlistName;
    opt.addEventListener('click', () => addSongToPlaylist(song, playlistName));
    dropdown.appendChild(opt);
  });

  // Add "Create playlist" button
  const createOpt = document.createElement('div');
  createOpt.textContent = 'Create playlist';
  createOpt.addEventListener('click', async () => {
    const name = prompt('New playlist name?');
    if (name && !playlists[name]) {
      const newPl = await createPlaylist(name);
      if (newPl && newPl.name) {
        playlists[name] = [];
        await loadPlaylists(dropdown, song); // refresh dropdown
      }
    } else if (playlists[name]) {
      alert('Playlist already exists.');
    }
  });
  dropdown.appendChild(createOpt);
}

// Fetches user playlists on page load
document.addEventListener('DOMContentLoaded', fetchPlaylists);

// Connect Search button to searchMusic()
document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.querySelector("button");
  if (searchBtn) {
    searchBtn.addEventListener("click", searchMusic);
  }
});

