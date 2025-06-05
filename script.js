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
          div.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow-md">
              <h3 class="text-xl font-semibold text-blue-600">${item.title}</h3>
              <p class="text-gray-700">by <em>${item.artist}</em></p>
              <p class="text-sm text-gray-500">Match score: ${item.score ? item.score.toFixed(2) : "N/A"}</p>
              <p class="text-sm text-gray-600">${item.reason}</p>
              <a class="text-blue-500 underline mt-2 inline-block" href="${item.spotify_url}" target="_blank">Listen on Spotify</a>
            </div>
          `;
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
  