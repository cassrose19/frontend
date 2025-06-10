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
        // For each song, a div is built containing the song
        // title, artist, match score, and a spotify link.
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

async function fetchPlaylists() {
  try {
    const resp = await fetch('http://localhost:5051/playlists');
    const data = await resp.json();
    playlists = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Failed to load playlists', err);
  }
}

async function createPlaylist(name) {
  try {
    const resp = await fetch('http://localhost:5051/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return await resp.json();
  } catch (err) {
    console.error('Failed to create playlist', err);
  }
}

async function addSongToPlaylist(song, playlistId) {
  try {
    await fetch(`http://localhost:5051/playlists/${playlistId}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song })
    });
  } catch (err) {
    console.error('Failed to add song to playlist', err);
  }
}

async function loadPlaylists(dropdown, song) {
  if (!playlists.length) {
    await fetchPlaylists();
  }
  dropdown.innerHTML = '';
  playlists.forEach(pl => {
    const opt = document.createElement('div');
    opt.textContent = pl.name || 'Unnamed playlist';
    opt.addEventListener('click', () => addSongToPlaylist(song, pl.id));
    dropdown.appendChild(opt);
  });
  const createOpt = document.createElement('div');
  createOpt.textContent = 'Create playlist';
  createOpt.addEventListener('click', async () => {
    const name = prompt('New playlist name?');
    if (name) {
      const newPl = await createPlaylist(name);
      if (newPl) playlists.push(newPl);
    }
  });
  dropdown.appendChild(createOpt);
}

document.addEventListener('DOMContentLoaded', fetchPlaylists);
