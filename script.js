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

// Function to clean lyrics by removing [" and "] at the beginning and end
function cleanLyrics(lyrics) {
  if (!lyrics) return lyrics;

  lyrics = lyrics.trim().replace(/^['"\[]+|['"\]]+$/g, '');

  lyrics = lyrics.split('\n')
    .map(line => line.trim().replace(/^['"\[]+|['"\]]+$/g, ''))
    .join('\n');

  return lyrics;
}


// Range slider value updates
document.addEventListener('DOMContentLoaded', function() {
  // Energy level sliders
  const energyMin = document.getElementById('energy_min');
  const energyMax = document.getElementById('energy_max');
  const energyMinVal = document.getElementById('energy_min_val');
  const energyMaxVal = document.getElementById('energy_max_val');

  energyMin.addEventListener('input', function() {
    energyMinVal.textContent = parseFloat(this.value).toFixed(1);
    if (parseFloat(this.value) > parseFloat(energyMax.value)) {
      energyMax.value = this.value;
      energyMaxVal.textContent = parseFloat(this.value).toFixed(1);
    }
  });

  energyMax.addEventListener('input', function() {
    energyMaxVal.textContent = parseFloat(this.value).toFixed(1);
    if (parseFloat(this.value) < parseFloat(energyMin.value)) {
      energyMin.value = this.value;
      energyMinVal.textContent = parseFloat(this.value).toFixed(1);
    }
  });

  // Popularity sliders
  const popularityMin = document.getElementById('popularity_min');
  const popularityMax = document.getElementById('popularity_max');
  const popularityMinVal = document.getElementById('popularity_min_val');
  const popularityMaxVal = document.getElementById('popularity_max_val');

  popularityMin.addEventListener('input', function() {
    popularityMinVal.textContent = this.value;
    if (parseInt(this.value) > parseInt(popularityMax.value)) {
      popularityMax.value = this.value;
      popularityMaxVal.textContent = this.value;
    }
  });

  popularityMax.addEventListener('input', function() {
    popularityMaxVal.textContent = this.value;
    if (parseInt(this.value) < parseInt(popularityMin.value)) {
      popularityMin.value = this.value;
      popularityMinVal.textContent = this.value;
    }
  });

  // Search button event
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchMusic);
  }

  // New playlist button event
  const newPlaylistBtn = document.getElementById('new-playlist-btn');
  if (newPlaylistBtn) {
    newPlaylistBtn.addEventListener('click', async function() {
      // Check if user is logged in
      if (!auth.currentUser?.uid) {
        alert('Please log in to create playlists.');
        return;
      }

      const name = prompt('Enter playlist name:');
      if (name && name.trim()) {
        if (playlists[name]) {
          alert('Playlist already exists.');
          return;
        }
        
        try {
          // Create new playlist
          playlists[name] = [];
          
          // Save to Firestore
          const uid = auth.currentUser.uid;
          await setDoc(doc(db, "users", uid), { playlists: playlists }, { merge: true });
          
          // Update UI
          renderSidebar();
          
          // Visual feedback
          this.innerHTML = `
            <svg class="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Created!
          `;
          
          setTimeout(() => {
            this.innerHTML = `
              <svg class="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              New Playlist
            `;
          }, 2000);
          
        } catch (error) {
          console.error('Error creating playlist:', error);
          alert('Failed to create playlist. Please try again.');
        }
      }
    });
  }
});

// Turns a full Spotify URL into URI, then into Spotify's waveform code
function getSpotifyCode(url) {
  try {
    const parts = new URL(url).pathname.split('/');
    const type = parts[1]; // "track", "album", etc.
    const id = parts[2];   // actual Spotify ID
    const uri = `spotify:${type}:${id}`;
    return `https://scannables.scdn.co/uri/plain/jpeg/000000/white/640/${uri}`;
  } catch (e) {
    console.error('Invalid Spotify URL:', url);
    return '';
  }
}

// --- iTunes Search API helper function --- //
async function fetchSongPreview(songName, artistName) {
  const query = encodeURIComponent(`${songName} ${artistName}`);
  const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=1`;

  const response = await fetch(url);
  const data = await response.json();
  if (data.results.length > 0) {
    return data.results[0].previewUrl; // 30s song sample
  } else {
    return null;
  }
}


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

  // Get filter values
  const energyMin = document.getElementById("energy_min").value;
  const energyMax = document.getElementById("energy_max").value;
  const artist = document.getElementById("artist").value;
  const popularityMin = document.getElementById("popularity_min").value;
  const popularityMax = document.getElementById("popularity_max").value;

  // Build request body
  const requestBody = { prompt };
  
  if (energyMin) requestBody.energy_min = parseFloat(energyMin);
  if (energyMax) requestBody.energy_max = parseFloat(energyMax);
  if (artist) requestBody.artist = artist;
  if (popularityMin) requestBody.popularity_min = parseInt(popularityMin);
  if (popularityMax) requestBody.popularity_max = parseInt(popularityMax);

  // Send POST request to backend API
  try {
    const response = await fetch("http://localhost:5051/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    console.log("Response data:", data);

    if (Array.isArray(data) && data.length > 0) {
      responseContainer.innerHTML = "";

      data.forEach(item => {
        console.log("title:", item.title);
        console.log("spotify_url:", item.spotify_url);

        const div = document.createElement("div");
        div.className = "song-item";

        // Fills in HTML for a returned song
        div.innerHTML = `
          <div class="song-item-content" style="display:flex;flex-direction:row;align-items:flex-start;gap:16px;">
            <!-- Play Button Section -->
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-width:36px;">
              <button class="play-btn group" type="button" title="Play" style="width:36px;height:36px;min-width:36px;">
                <svg class="transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5v14l11-7z"/>
                </svg>
                <svg class="pause-icon hidden" fill="currentColor" viewBox="0 0 24 24" style="width:16px;height:16px;">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              </button>
            </div>
            <!-- Main Info -->
            <div class="song-item-main flex-1 min-w-0">
              <div class="flex items-center justify-between mb-1">
                <div>
                  <h3 class="text-lg font-semibold text-gray-800 truncate">${item.title}</h3>
                  <p class="text-sm text-gray-500">by ${item.artist}</p>
                </div>
              </div>
              <!-- Compact Metadata -->
              <div class="flex flex-wrap gap-3 mb-1 text-sm text-gray-500">
                ${item.popularity ? `
                  <span class="flex items-center gap-1">
                    <i class="fa fa-fire text-indigo-500"></i>
                    ${item.popularity}
                  </span>
                ` : ''}
                ${item.energy ? `
                  <span class="flex items-center gap-1">
                    <i class="fa fa-bolt text-emerald-500"></i>
                    ${(item.energy * 100).toFixed(0)}%
                  </span>
                ` : ''}
                ${item.release_date ? `
                  <span class="flex items-center gap-1">
                    <i class="fa fa-calendar text-purple-500"></i>
                    ${item.release_date}
                  </span>
                ` : ''}
              </div>
              <!-- Platform Icons Only -->
              <div class="flex items-center gap-2 mb-1">
                ${item.spotify_url ? `
                  <a href="${item.spotify_url}" target="_blank" rel="noopener noreferrer" title="Spotify">
                    <i class="fa fa-spotify text-2xl text-green-500 hover:scale-110 transition-transform"></i>
                  </a>
                ` : ''}
                ${item.youtube_music_url ? `
                  <a href="${item.youtube_music_url}" target="_blank" rel="noopener noreferrer" title="YouTube Music">
                    <i class="fa fa-youtube-play text-2xl text-red-500 hover:scale-110 transition-transform"></i>
                  </a>
                ` : ''}
              </div>
              <!-- Match Score -->
              ${item.score ? `
                <span class="flex items-center gap-1 text-sm text-gray-500 mb-1">
                  <i class="fa fa-star text-yellow-400"></i>
                  Match ${item.score.toFixed(1)}%
                </span>
              ` : ''}
              <!-- Reason -->
              ${item.reason ? `
                <span class="text-sm italic text-gray-400 flex items-start gap-1 mb-1">
                  <i class="fa fa-quote-left text-pastel-sage mt-1 text-sm"></i>
                  ${item.reason}
                </span>
              ` : ''}
              <!-- Audio Player Placeholder -->
              <div class="audio-player-container mt-1"></div>
            </div>
            <!-- Lyrics Section (right, half width) -->
            ${item.lyrics ? `
              <div class="song-item-lyrics" style="flex:1 1 0;min-width:220px;max-width:50%;margin-left:16px;background:rgba(255,255,255,0.7);border-radius:10px;border:1px solid #e5e7eb;box-shadow:0 2px 8px rgba(0,0,0,0.04);padding:8px 12px;font-size:13px;color:#374151;max-height:180px;overflow-y:auto;">
                <div class="lyrics-content mt-0 p-0 bg-transparent border-none rounded-none max-h-180 overflow-y-auto text-xs" style="display:block;">
                  <pre class="whitespace-pre-wrap text-xs text-gray-700 leading-relaxed" style="font-size:13px;line-height:1.6;margin:0;">${cleanLyrics(item.lyrics)}</pre>
                </div>
              </div>
            ` : ''}
          </div>
          <div class="playlist-dropdown"></div>
        `;
        // Fetch iTunes song preview + append enhanced audio player
        fetchSongPreview(item.title, item.artist).then(previewUrl => {
          if (previewUrl) {
            const audioContainer = div.querySelector('.audio-player-container');
            const playBtn = div.querySelector('.play-btn');
            
            // Create hidden audio element
            const audio = document.createElement('audio');
            audio.src = previewUrl;
            audio.style.display = 'none';
            audioContainer.appendChild(audio);
            
            // Play button functionality
            playBtn.addEventListener('click', () => {
              const playIcon = playBtn.querySelector('.play-icon');
              const pauseIcon = playBtn.querySelector('.pause-icon');

              if (audio.paused) {
                // Pause all other audio elements
                document.querySelectorAll('audio').forEach(otherAudio => {
                  if (otherAudio !== audio) {
                    otherAudio.pause();
                  }
                });

                // Reset all other play buttons
                document.querySelectorAll('.play-btn').forEach(btn => {
                  if (btn !== playBtn) {
                    btn.classList.remove('playing');
                    const otherPlayIcon = btn.querySelector('.play-icon');
                    const otherPauseIcon = btn.querySelector('.pause-icon');
                    if (otherPlayIcon) otherPlayIcon.style.display = '';
                    if (otherPauseIcon) otherPauseIcon.style.display = 'none';
                  }
                });

                audio.play();
                playBtn.classList.add('playing');
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = '';
              } else {
                audio.pause();
                playBtn.classList.remove('playing');
                if (playIcon) playIcon.style.display = '';
                if (pauseIcon) pauseIcon.style.display = 'none';
              }
            });
            
            // Auto-reset button when audio ends
            audio.addEventListener('ended', () => {
              playBtn.classList.remove('playing');
              const playIcon = playBtn.querySelector('.play-icon');
              const pauseIcon = playBtn.querySelector('.pause-icon');
              playIcon.style.display = '';
              pauseIcon.style.display = 'none';
            });
          }
        });

        // --- NEW --- //
        // Prepares the dropdown menu for user to choose playlists from
        const addBtn = div.querySelector('.add-btn');
        const dropdown = div.querySelector('.playlist-dropdown');

        // --- NEW --- // 
        // "+" button behavior: show playlist options or prompt login
        if (addBtn) {
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
        }

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
  
  if (Object.keys(playlists).length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "text-center py-8 text-gray-500";
    emptyState.innerHTML = `
      <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-1v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-1"></path>
      </svg>
      <p class="text-sm">No playlists yet</p>
      <p class="text-xs text-gray-400 mt-1">Start by adding songs!</p>
    `;
    sidebar.appendChild(emptyState);
    return;
  }
  
  Object.keys(playlists).forEach(playlistName => {
    const container = document.createElement("div");
    container.className = "mb-3";
    
    // Playlist title (clickable to toggle its songs)
    const title = document.createElement("div");
    title.classList.add("playlist");
    title.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2 text-pastel-lavender" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"></path>
          </svg>
          <span class="font-medium text-gray-700">${playlistName}</span>
        </div>
        <div class="flex items-center">
          <span class="text-xs text-gray-500 mr-2">${(playlists[playlistName] || []).length} songs</span>
          <svg class="w-4 h-4 text-gray-400 transform transition-transform duration-200 chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </div>
      </div>
    `;

    const songsList = document.createElement("div");
    songsList.classList.add("playlist-songs");

    // Each song within playlist is displayed with enhanced styling
    (playlists[playlistName] || []).forEach((song, index) => {
      const songItem = document.createElement("div");
      songItem.className = "playlist-song-item";
      songItem.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-700 truncate">${song.title}</p>
            <p class="text-xs text-gray-500 truncate">by ${song.artist}</p>
          </div>
          <div class="text-xs text-gray-400 ml-2">${index + 1}</div>
        </div>
      `;
      songsList.appendChild(songItem);
    });

    title.addEventListener("click", () => {
      const isExpanded = songsList.classList.contains("show");
      const chevron = title.querySelector('.chevron');
      
      songsList.classList.toggle("show");
      title.classList.toggle("active");
      
      if (isExpanded) {
        chevron.style.transform = 'rotate(0deg)';
      } else {
        chevron.style.transform = 'rotate(180deg)';
      }
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

// Hitting "Enter" key allows users to search their prompt
document.getElementById("prompt")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    searchMusic();
  }
});

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
