///////  Artist Page Content  ////////////
/////////////////////////////////////////


///////  Player State / Currently Playing Song  ////////////
///////////////////////////////////////////////////////////
let similarArtists = [];
let currentArtist = null;
let similarArtistsDisplayed = 0;
let loadMoreCount = 0;
export function loadPlayingArtistSimilar() {
  const playingSimilarArtistsArea = document.createElement("div");
  playingSimilarArtistsArea.id = "playingSimilarArtistsArea";
  playingSimilarArtistsArea.classList.add("similarArtistsPlayingArea");

  const loadMoreButton = document.createElement("button");
  loadMoreButton.id = "loadMoreSimilarArtists";
  loadMoreButton.innerText = "Load More";
  loadMoreButton.disabled = false;

  const similarArtists = getSimilarArtists(artistPlaying);
  let displayedCount = 0;

  const renderSimilarArtists = () => {
    const rowLimit = 4;
    const maxArtists = 20;
    const toDisplay = similarArtists.slice(displayedCount, displayedCount + rowLimit);

    toDisplay.forEach((similarArtist) => {
      const artistDiv = document.createElement("div");
      artistDiv.className = "similarArtistCircle";

      const artistImage = document.createElement("img");
      artistImage.src = `https://mybeats.cloud/mediaFiles/artistPortraits/${similarArtist.toLowerCase().replace(/\s/g,
        "")}.png`;
      artistImage.alt = similarArtist;
      artistImage.width = 30;
      artistImage.height = 30;

      const artistNameHeading = document.createElement("h5");
      artistNameHeading.innerText = similarArtist;

      artistDiv.appendChild(artistImage);
      artistDiv.appendChild(artistNameHeading);

      playingSimilarArtistsArea.appendChild(artistDiv);
    });

    displayedCount += toDisplay.length;

    if (displayedCount >= maxArtists || displayedCount >= similarArtists.length) {
      loadMoreButton.disabled = true;
    }
  };

  renderSimilarArtists();
  renderSimilarArtists();

  loadMoreButton.addEventListener("click", () => {
    renderSimilarArtists();
  });

  dynamicAreaBottom.appendChild(playingSimilarArtistsArea);
  dynamicAreaBottom.appendChild(loadMoreButton);
}
export function getSimilarArtists(artistName) {
  const artist = musicLibrary.find((artist) => artist.artist === artistName);

  if (artist) {
    const similarArtists = artist.similar.slice();
    randomizeMe(similarArtists);
    return similarArtists;
  }
  return [];
}
export function loadSimilarArtists(artist) {
  if (artist !== currentArtist) {
    similarArtists = artist.similar;
    currentArtist = artist;
    similarArtistsDisplayed = 0;
    loadMoreCount = 0;
  }

  /////////// Finding Similar /////////////////////////
  const similarArtistsPLAYING = document.getElementById("similarArtistsPLAYING");
  similarArtistsPLAYING.innerHTML = "";
  const similarArtists = getSimilarArtists(artist.artistPlaying);

  /////////// Displaying Similar //////////////////////
  for (let i = 0; i < numRows; i++) {
    const row = document.createElement("div");
    row.classList.add("similar-row");
    for (let j = 0; j < 3 && similarArtistsDisplayed < similarArtists.length; j++) {
      const artistDiv = document.createElement("div");
      artistDiv.classList.add("similar-artist", "circlePhoto"); // Add the "photo" class

      const artistImage = document.createElement("img");
      artistImage.src = `https://mybeats.cloud/mediaFiles/artistPortraits/${similarArtists[similarArtistsDisplayed].toLowerCase().replace(/\s/g, "")}.png`;
      artistImage.alt = similarArtists[similarArtistsDisplayed];
      artistImage.width = 75;
      artistImage.height = 75;

      const artistLink = document.createElement("a");
      artistLink.href = "#";
      artistLink.setAttribute("data-transition", "loaders");
      artistLink.addEventListener("click", (event) => {
        event.preventDefault();
        loadArtistInfo(similarArtists[similarArtistsDisplayed]);
        const songList = document.createElement("div");
        songList.id = ("song-list");
        dynamicArea.appendChild(songList);
        artistNameTitle.style.display = "block";
      });


      const artistNameHeading = document.createElement("h4");
      artistNameHeading.innerText = similarArtists[similarArtistsDisplayed];

      artistLink.appendChild(artistNameHeading);
      artistDiv.appendChild(artistImage);
      artistDiv.appendChild(artistLink);
      row.appendChild(artistDiv);

      similarArtistsDisplayed++;
    }
    similarArtistsPLAYING.appendChild(row);
  }

  /////////// Load More Button ////////////////////////
  if (similarArtistsDisplayed < similarArtists.length) {
    const loadMoreBtn = document.createElement("button");
    loadMoreBtn.id = "loadMoreBtn";
    loadMoreBtn.textContent = "Load More";
    loadMoreBtn.addEventListener("click", () => {
      loadMoreCount++;
      if (loadMoreCount >= 4) {
        loadMoreBtn.textContent = "Load More";
        loadMoreBtn.disabled = true;
      }
      loadSimilarArtists(artist);
    });
    similarArtistsPLAYING.appendChild(loadMoreBtn);
  }
}

//let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
export function isRendering(songData, type) {
  ///////////  If Lists are empty  /////////////////////////
  if (songData.length === 0) {
    const message = type === "favorites" ? "No favorites added.": "No songs in queue.";
    myMusic.innerHTML = `<p>${message}</p>`;
    return;
  }

  ///////////  Favorites and Up Next Queue  ////////////////
  songData.forEach((songOrId) => {
    const song = type === "favorites" ? findSongById(songOrId): songOrId;
    if (song) {
      const songDiv = document.createElement("div");
      songDiv.classList.add("song", type === "favorites" ? "favoriteSong": "up-next-song");
      songDiv.innerHTML = `
      <span class="title">${song.title}</span>
      <span class="artist">${song.artist}</span>
      <span class="duration">${song.duration}</span>
      `;
      // ... add remove button if needed ...
      myMusic.appendChild(songDiv);
    }
  });
}
export function getSongById(songId) {
  for (const artist of musicLibrary) {
    for (const album of artist.albums) {
      const song = album.songs.find((song) => song.id === songId);
      if (song) {
        return {
          ...song,
          artist: artist.artist,
          album: album.album
        }; // Add artist information
      }
    }
  }
  return null;
}
export function loadFavorites() {
  // Safely initialize favorites
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!Array.isArray(favorites)) {
    favorites = [];
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }

  // Iterate over each .song element
  document.querySelectorAll(".song").forEach((song) => {
    const songId = song.getAttribute("data-id");
    const heart = song.querySelector(".heart");

    if (songId && heart) {
      // Update heart state based on favorites
      if (favorites.includes(songId)) {
        heart.classList.add("hearted");
      }

      // Attach the click event listener
      heart.removeEventListener("click", toggleFavorite); // Ensure no duplicate event listeners
      heart.addEventListener("click", toggleFavorite);
    } else {
      console.warn("Missing data-id or .heart element in song:", song);
    }
  });
}
export function toggleFavorite(event) {
  event.stopPropagation();

  const heart = event.currentTarget;
  const songElement = heart.closest(".song");
  if (!songElement) {
    console.error("Song element not found for the clicked heart.");
    return;
  }

  const songId = songElement.getAttribute("data-id");
  const songNameElement = songElement.querySelector(".title");
  const songName = songNameElement ? songNameElement.textContent: "Unknown Song";

  // Safely retrieve favorites
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  if (!Array.isArray(favorites)) {
    favorites = [];
  }

  if (favorites.includes(songId)) {
    // Remove from favorites
    favorites = favorites.filter((id) => id !== songId);
    heart.classList.remove("hearted");
  } else {
    // Add to favorites
    favorites.push(songId);
    heart.classList.add("hearted");

    // Show toast notification
    const toastId = `toast-${songId}`;
    const toastHtml = `
    <div id="${toastId}" class="toast toastFAVs" role="alert" aria-live="assertive" aria-atomic="true">
    <div class="toastFAVs-banner">Added to Favorites!</div>
    <div class="toastFAVs-content">
    <span class="toastFAVs-message">${songName} <br>
    <span class="toastFAVs-message-smaller">Undo</span>
    </span>
    <span class="toastFAVs-timestamp">Just Now</span>
    </div>
    </div>
    `;

    const toastContainer = document.getElementById("toastContainer");
    if (toastContainer) {
      toastContainer.insertAdjacentHTML("beforeend", toastHtml);

      const favoriteToast = new bootstrap.Toast(document.getElementById(toastId), {
        autohide: true,
        delay: 9500,
      });
      favoriteToast.show();

      setTimeout(() => {
        const toastElement = document.getElementById(toastId);
        if (toastElement) {
          toastElement.classList.add("puff-out-ver");
        }
      },
        7500);
    } else {
      console.warn("Toast container not found. Cannot show notification.");
    }
  }

  // Update localStorage
  localStorage.setItem("favorites", JSON.stringify(favorites));
  addSongToFavorites();
  displayFavorites();
}
export function removeFromFavorites(songId) {
  const index = favorites.findIndex((song) => song.id === songId);
  if (index > -1) {
    favorites.splice(index, 1);
    myLibrary("favorites", favorites);
  }
}
export function getFavorites() {
  const favorites = localStorage.getItem('favorites');
  return favorites ? JSON.parse(favorites): [];
}
export function saveFavorites(favorites) {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}
export function addSongToFavorites(songId) {
  const favorites = getFavorites();
  if (!favorites.includes(songId)) {
    favorites.push(songId);
    saveFavorites(favorites);
    updateHeartIcon(songId, true);
    displayFavorites();
  }
}
export function removeSongFromFavorites(songId) {
  let favorites = getFavorites();
  favorites = favorites.filter(id => id !== songId);
  saveFavorites(favorites);
  updateHeartIcon(songId, false);
  displayFavorites();
}
export function updateHeartIcon(songId, isFavorited) {
  const songElement = document.querySelector(`.song[data-id="${songId}"]`);
  if (songElement) {
    const heart = songElement.querySelector('.heart');
    if (heart) {
      if (isFavorited) {
        heart.classList.remove('heart');
        heart.classList.add('hearted');
      } else {
        heart.classList.remove('hearted');
        heart.classList.add('heart');
      }
    }
  }
}
export function handleHeartClick(event) {
  const heartIcon = event.target;
  if (heartIcon.classList.contains('heart')) {
    const songElement = heartIcon.closest('.song');
    const songId = songElement.getAttribute('data-id');
    addSongToFavorites(songId);
  } else if (heartIcon.classList.contains('hearted')) {
    const songElement = heartIcon.closest('.song');
    const songId = songElement.getAttribute('data-id');
    removeSongFromFavorites(songId);
  }
}
export function displayFavorites() {
  const favoritesContainer = document.getElementById('myFavorites');
  favoritesContainer.innerHTML = ''; // Clear existing favorites
  const favorites = getFavorites();

  if (favorites.length === 0) {
    favoritesContainer.innerHTML = '<p>No favorites added yet.</p>';
    return;
  }

  favorites.forEach(songId => {
    const song = getSongById(songId);
    if (song) {
      const songDiv = document.createElement("div");
      songDiv.className = "favoriteSong";
      songDiv.innerHTML = `
      <div class="albumCoverContainer">
      <div class="albumCover">
      <img src="https://mybeats.cloud/mediaFiles/albumCovers/${song.album.toLowerCase().replace(/\s/g, "")}.png" alt="${song.album}">
      </div>
      </div>
      <div class="song-details">
      <p class="songTitle">${song.title}</p>
      <p class="songArtist">${song.artist}</p>
      <p class="songAlbum">${song.album}</p>
      <span class="song-duration">${song.duration}</span>
      </div>
      <div class="song-controls">
      <button class="infoButtonFAVs">ℹ</button>
      <button class="FAVsRemove">✖</button>
      </div>
      `;
      favoritesContainer.appendChild(songDiv);
    }
  });
}
export function initializeFavorites() {
  // Attach click event listeners to all heart icons
  const heartIcons = document.querySelectorAll('.heart, .hearted');
  heartIcons.forEach(heart => {
    heart.addEventListener('click', handleHeartClick);
  });

  // Display favorites on page load
  displayFavorites();

  // Update heart icons based on favorites in localStorage
  const favorites = getFavorites();
  favorites.forEach(songId => {
    updateHeartIcon(songId, true);
  });
}

///////  Up Next / Favorites Features  ///////
let queue = [];

export function playNextSong() {
  if (queue.length > 0) {
    const nextSong = queue.shift(); // Get the first song from the queue
    playSong(nextSong);
    myLibrary("queue", queue); // Update the queue display
  } else {
    // Handle case where the queue is empty (e.g., play a random song, stop playback)
    console.log("Queue is empty.");
  }
}
export function addToQueue(song) {
  if (!queue.some((queuedSong) => queuedSong.id === song.id)) {
    queue.push(song);
    myLibrary("queue", queue);
  } else {
    console.log("Song is already in the queue.");
  }
}
export function removeFromQueue(songId) {
  const index = queue.findIndex((song) => song.id === songId);
  if (index > -1) {
    queue.splice(index, 1);
    myLibrary("queue", queue);
  }
}

//////////////////////////////   E N D   //////////////////////////////////
