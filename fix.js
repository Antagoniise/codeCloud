let queue = [];
export function loadAlbumSongs(albumName, button) {
  let songListContainer = document.getElementById("song-list");
  const currentSongs = songListContainer.querySelectorAll(".song");
  currentSongs.forEach((song) => song.classList.remove("visible"));
  populateCollectionDropdown();

  setTimeout(() => {
    songListContainer.innerHTML = "";
    const artist = musicLibrary.find((artist) => artist.albums.some((album) => album.album === albumName));
    if (!artist) return;

    const album = artist.albums.find((album) => album.album === albumName);
    if (!album) return;

    currentAlbumSongs = album.songs.map((song) => ({ ...song, artist: artist.artist, album: album.album }));

    currentAlbumSongs.forEach((song, index) => {
      const songElement = createElementsSONGS(song, index);
      songListContainer.appendChild(songElement);
      setTimeout(() => songElement.classList.add("visible"), 10);
    });

    if (activeButton) activeButton.classList.remove("active");
    button.classList.add("active");
    activeButton = button;

    loadFavorites();
    animateTrackItems();
  }, 500);
}
export function createElementsSONGS(song, index) {
  const songElement = document.createElement("div");
  songElement.classList.add("song");
  songElement.id = `song${song.id}`;
  songElement.dataset.id = song.id;
  songElement.dataset.title = song.title;
  songElement.dataset.artist = song.artist;
  songElement.dataset.album = song.album;

  songElement.innerHTML = `
    <div class="songInner">
      <div class="body">
        <div class="songInfo heart" id="favourites"><i class="ph-fill ph-heart"></i></div>
        <div class="songInfo duration">${song.duration || "3:35"}</div>
        <div class="songInfo title"><h7 class="marquee">${song.title}</h7></div>
        <div class="icon-actions">
          <div class="icon" title="Add to Playlist" data-action="addToPlaylist"><i class="ph-fill ph-plus-circle"></i></div>
          <div class="icon" title="Play Next" data-action="playNext"><i class="ph-fill ph-check-circle"></i></div>
          <div class="icon" title="Download" data-action="download"><i class="material-symbols-outlined">download_for_offline</i></div>
          <div class="icon" title="Share" data-action="share"><i class="material-symbols-outlined">share</i></div>
        </div>
      </div>
      <div class="moreMenu">
        <button id="songsMoreMenuBTN${song.id}" class="songsMoreMenuBTN" type="button"><i class="ph-fill ph-dots-three-outline"></i></button>
      </div>
    </div>
  `;

  clickEventsSONGS(songElement, song, index);
  return songElement;
}
export function clickEventsSONGS(songElement, song, index) {
  const moreMenuBTN = songElement.querySelector(".songsMoreMenuBTN");
  const iconActions = songElement.querySelector(".icon-actions");

  moreMenuBTN.addEventListener("click", (event) => {
    event.stopPropagation();
    const isVisible = iconActions.classList.contains("visible");
    closeAllMenus();
    if (!isVisible) iconActions.classList.add("visible");
    else iconActions.classList.remove("visible");
  });

  const addToPlaylistIcon = songElement.querySelector(`[data-action="addToPlaylist"]`);
  addToPlaylistIcon.addEventListener("click", (event) => {
    event.preventDefault();
    popOverPLAY(addToPlaylistIcon, song);
  });

  const addToQueueIcon = songElement.querySelector(`[data-action="playNext"]`);
  addToQueueIcon.addEventListener("click", (event) => {
    event.preventDefault();
    addToQueue(addToQueueIcon, song);
  });



  songElement.addEventListener("dblclick", () => {
    currentSongIndex = index;
    playSong(currentAlbumSongs[currentSongIndex]);
  });
}
export function playSong(song) {
  if (!song) {
    console.error("No song provided to play.");
    return;
  }

  songPlaying = song.title;
  artistPlaying = song.artist;
  albumPlaying = song.album;
  
  loadPlayingArtistSimilar();

  // Update song information
  document.querySelectorAll(".song").forEach((songElem) => songElem.classList.remove("active"));
  const currentSongElement = document.querySelector(`#song${song.id}`);
  if (currentSongElement) {
    currentSongElement.classList.add("active");
  }

  // Update the audio source and play
  audioElement.src = song.downloadPath;
  audioElement.play();

  document.querySelectorAll(".updateSongTitle").forEach((titleElement) => {
    titleElement.textContent = songPlaying;
  });
  document.querySelectorAll(".updateArtistName").forEach((artistElement) => {
    artistElement.textContent = artistPlaying;
  });
  document.querySelectorAll(".updateAlbumName").forEach((albumElement) => {
    albumElement.textContent = albumPlaying;
  });

  const albumArtPhoto = document.getElementById("nowPlayingArt");
  const albumArtPhotoNAV = document.getElementById("smallAlbumCover");
  const albumNowPlaying = albumPlaying.toLowerCase().replace(/\s/g, "");
  const newAlbumCoverUrl = `https://mybeats.cloud/mediaFiles/albumCovers/${albumNowPlaying}.png`;

  if (albumArtPhoto) {
    albumArtPhoto.src = newAlbumCoverUrl;
    albumArtPhoto.alt = albumPlaying;
  }
  if (albumArtPhotoNAV) {
    albumArtPhotoNAV.src = newAlbumCoverUrl;
    albumArtPhotoNAV.alt = albumPlaying;
  }

  const artistName = artistPlaying.replace(/\s/g, "").toLowerCase();
  const artworkUrl = `https://mybeats.cloud/mediaFiles/artistPortraits/${artistName}.png`;
  updateMediaSession(song, artworkUrl);

  const downloadIcon = document.getElementById("download-icon");
  downloadIcon.href = song.downloadPath;
  downloadIcon.setAttribute("download", song.title);

  audioElement.addEventListener("ended", () => {
    isPlaying = false;
    if (currentSongElement) currentSongElement.classList.remove("active");
    songCardUpdate();
    songEnd();
  });

  audioElement.addEventListener("play", () => {
    isPlaying = true;
    songCardUpdate();
  });

  // Update the queue display
  updateQueueDisplay();
}
export function songEnd() {
  if (repeatMode === 'one') {
    playSong(currentAlbumSongs[currentSongIndex]);
  } else if (queue.length > 0) {
    playNextSong();
  } else if (shuffleMode) {
    currentSongIndex = Math.floor(Math.random() * currentAlbumSongs.length);
    playSong(currentAlbumSongs[currentSongIndex]);
  } else {
    currentSongIndex = (currentSongIndex + 1) % currentAlbumSongs.length;
    if (currentSongIndex === 0 && repeatMode !== 'all') {
      // Stop playback if we've reached the end and repeat all is not on
      audioElement.pause();
      audioElement.currentTime = 0;
    } else {
      playSong(currentAlbumSongs[currentSongIndex]);
    }
  }
}
export function playNextSong() {
  if (queue.length > 0) {
    const nextSong = queue.shift(); // Get the first song from the queue
    playSong(nextSong);
    updateQueueDisplay(); // Update the queue display
  } else {
    // Handle case where the queue is empty (e.g., play next song in album)
    currentSongIndex = (currentSongIndex + 1) % currentAlbumSongs.length;
    playSong(currentAlbumSongs[currentSongIndex]);
  }
}
export function removeFromQueue(songId) {
  const index = queue.findIndex((song) => song.id === songId);
  if (index > -1) {
    queue.splice(index, 1);
    updateQueueDisplay();
  }
}
function loadQueueFromLocalStorage() {
  const savedQueue = localStorage.getItem('upNextQueue');
  if (savedQueue) {
    queue = JSON.parse(savedQueue);
    updateQueueDisplay();
  }
}
function saveQueueToLocalStorage() {
  localStorage.setItem('upNextQueue', JSON.stringify(queue));
}
function attachAddToQueueListeners() {
  document.querySelectorAll(".addToQueueBtn").forEach(button => {
    button.addEventListener("click", (e) => {
      const songId = e.target.getAttribute("data-song-id");
      const song = getSongById(songId); // Assuming you have a function to get the song by ID
      if (song) {
        addToQueue(song);
      }
    });
  });
}
export function addToQueue(song) {
  if (!queue.some((queuedSong) => queuedSong.id === song.id)) {
    queue.push(song);
    updateQueueDisplay();
    saveQueueToLocalStorage(); // Save the updated queue to local storage
  } else {
    console.log("Song is already in the queue.");
  }
}
function updateQueueDisplay() {
  const queueContainer = document.getElementById("myQueue");
  if (!queueContainer) {
    console.error("Up Next Queue container not found");
    return;
  }

  // Clear the current queue display
  queueContainer.innerHTML = "";

  // Add each song in the queue to the display
  queue.forEach((song, index) => {
    const songElement = document.createElement("div");
    songElement.classList.add("queue-song");
    songElement.innerHTML = `
      <span>${index + 1}. ${song.title} - ${song.artist}</span>
      <button class="remove-from-queue" data-song-id="${song.id}">Remove</button>
    `;
    queueContainer.appendChild(songElement);
  });

  // Add event listeners to remove buttons
  document.querySelectorAll(".remove-from-queue").forEach(button => {
    button.addEventListener("click", (e) => {
      const songId = e.target.getAttribute("data-song-id");
      removeFromQueue(songId);
    });
  });
}
export function clearQueue() {
  queue = [];
  updateQueueDisplay();
  saveQueueToLocalStorage();
}
