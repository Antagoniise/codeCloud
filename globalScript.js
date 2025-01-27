import {
  musicLibrary
} from "./mediaFiles/songs/musicData.js";

let currentSongIndex = 0;
let currentAlbumSongs = [];
let shuffleMode = false;
let repeatMode = false;
let activeButton = null;
let isPlaying = false;
let isDragging = false;
const fastForwardInterval = 10;
const rewindInterval = 10;

// Music Player Controls, Seek Slider, Song Times, ETC.
const audioElement = document.querySelector("#audio");
const progressSlider = document.querySelector(".progress-slider");
const progressBarr = document.querySelector(".progress-bar");
const progressElapsed = document.getElementById("progressElapsed");
const sliderThumb = document.getElementById("sliderThumb");
const timeToolTip = document.getElementById("timeToolTip");
const currentTimeDisplay = document.getElementById("currentTime");
const totalTimeDisplay = document.getElementById("totalTime");
const playPauseButton = document.querySelector("#btnPlayPause");
const btnPlay = document.getElementById("btnPlay");
const btnPause = document.getElementById("btnPause");
const skipForwardButton = document.querySelector(".skip-forward");
const skipBackwardButton = document.querySelector(".skip-backward");
const shuffleButton = document.querySelector(".shuffle");
const repeatButton = document.querySelector(".repeat");

// Loading Animation at the top of the page
const progressBar = document.createElement("div");

// Options that appear for each song
const songInfoIcons = document.querySelectorAll(".song-info-icon");

// Main content, Top and Bottom areas
const dynamicArea = document.getElementById("dynamicArea");
const dynamicAreaBottom = document.getElementById("dynamicAreaBottom");

// Updates with Now Playing song to display Related Media
const similarArtistsPLAYING = document.getElementById("similarArtistsPLAYING");

// NAV otems at the top of page
const navItems = document.querySelectorAll(".cc_sticky-nav-item");

progressBar.id = "loadingBar";
document.body.appendChild(progressBar);
randomizeMe(musicLibrary);






/////////  Play any audio on site  ////////////////
/////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
  if ("launchQueue" in window && "files" in LaunchParams.prototype) {
    launchQueue.setConsumer(async (launchParams) => {
      const fileHandles = launchParams.files;
      if (!fileHandles.length) return;

      const fileHandle = fileHandles[0];
      const file = await fileHandle.getFile();

      clearDynamicArea();
      loadAudioPlayer(file);
    });
  }
});
export function loadAudioPlayer(file) {
  const dynamicArea = document.getElementById("dynamicArea");

  const content = `
  <div class="music-container">
  <h2>Play Your Offline Music or Discover New Music Here</h2>
  </div>
  <style>
  .music-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px;
  background: #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  }
  h2 {
  font-family: 'Arial', sans-serif;
  font-size: 24px;
  color: #333;
  margin-bottom: 15px;
  }
  audio {
  width: 80%;
  max-width: 500px;
  }
  </style>
  `;

  dynamicArea.innerHTML = content;

  const audioElement = document.querySelector("#audio");
  audioElement.src = URL.createObjectURL(file);
  audioElement.play().catch((err) => console.error("Audio playback error:",
    err));
}


/////////  H E L P E R  Functions  ////////////////
/////////////////////////////////////////////////////////////////
export function clearDynamicArea() {
  dynamicArea.innerHTML = "";
  dynamicAreaBottom.innerHTML = "";
}
export function activeAlbum(button) {
  if (activeButton) {
    activeButton.classList.remove("active");
  }
  if (button) {
    button.classList.add("active");
    activeButton = button;
  }
}
export function randomizeMe(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i],
      array[j]] = [array[j],
      array[i]];
  }
}
export function similarArtistsLarge(artistId) {
  const artist = musicLibrary.find((artist) => artist.id === artistId);

  if (artist) {
    const similarArtistIds = artist.similar.map((similarArtistObj) => similarArtistObj.id); // assuming artist.similar stores artist objects with ids
    randomizeMe(similarArtistIds); // Shuffle or randomize the list of IDs
    return similarArtistIds;
  }
  return [];
}
export function setActiveLink(linkId) {
  navItems.forEach((item) => item.classList.remove("active"));

  const activeItem = document.getElementById(linkId)?.parentElement;
  if (activeItem) {
    activeItem.classList.add("active");
  }
}
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
export function scrollRIGHT() {
  const stickyNAV = document.getElementById(stickyNAV);
  const scrollContainer = document.querySelector(".cc_sticky-nav-scroll-track");

  scrollContainer.scrollRight = 0;
}
export function triggerRepaint(element) {
  element.offsetHeight;
}
export function hideContainersSmoothly() {
  const containers = ["all-artists-container",
    "similar-artists-container",
    "artist-info-container"];

  containers.forEach((containerId) => {
    const container = document.getElementById(containerId);
    if (container && container.classList.contains("visible")) {
      container.classList.remove("visible");
      container.classList.add("hidden");
      container.style.transition = "opacity 0.75s";
      container.style.opacity = "0";
      setTimeout(() => {
        container.style.display = "none";
      }, 950);
    }
  });
}
export function animateTrackItems() {
  const trackItems = document.querySelectorAll(".trackItem");
  trackItems.forEach((item, index) => {
    setTimeout(() => {
      item.classList.add("visible");
    }, index * 100); // Stagger the animation for each item
  });
}
export function populateCollectionDropdown() {
  const dropdowns = document.querySelectorAll(".selectCollection");
  dropdowns.forEach((dropdown) => {
    dropdown.innerHTML = `<option value="" disabled selected>Add to Playlist</option>`;

    Object.values(collections).forEach((collection) => {
      const option = document.createElement("option");
      option.value = collection.id;
      option.textContent = collection.title;
      dropdown.appendChild(option);
    });
  });
}


//////////////////  M U S I C  P L A Y E R  /////////////
////////////////  Android Media Session API  //////////////////////////
/***/
let songPlaying = null;
let artistPlaying = null;
let albumPlaying = null;
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
  });

  audioElement.addEventListener("play",
    () => {
      isPlaying = true;
      songCardUpdate();
    });



  
  
}
export function songEnd() {
  if (repeatMode) {
    playSong(currentAlbumSongs[currentSongIndex]);
  } else if (queue.length > 0) {
    const nextSong = queue.shift();
    playSong(nextSong);
  } else if (shuffleMode) {
    currentSongIndex = Math.floor(Math.random() * currentAlbumSongs.length);
    playSong(currentAlbumSongs[currentSongIndex]);
  } else {
    currentSongIndex = (currentSongIndex + 1) % currentAlbumSongs.length;
    playSong(currentAlbumSongs[currentSongIndex]);
  }
}
export function updateTitle(song) {
  if (song && song.title && song.artist) {
    document.title = `${song.title} - ${song.artist}`;
  } else {
    document.title = "MyBeats Ã‚Â® Music Streaming";
  }
}
export function songCardUpdate() {
  const largeAlbumCover = document.getElementById("largeAlbumCover");
  const smallAlbumCover = document.getElementById("smallAlbumCover");
  const songCardTitle = document.getElementById("songCardTitle");
  const songCardArtist = document.getElementById("songCardArtist");
  const songCardAlbum = document.getElementById("songCardAlbum");

  const albumCoverURL = `https://mybeats.cloud/mediaFiles/artistPortraits/${artistPlaying.toLowerCase().replace(/\s/g, "")}.png`;

  largeAlbumCover.src = albumCoverURL;
  smallAlbumCover.src = albumCoverURL;

  songCardTitle.textContent = songPlaying;
  songCardArtist.textContent = artistPlaying;
  songCardAlbum.textContent = albumPlaying;
}
export function updateMediaSession(song, artworkUrl) {
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: song.title || "Unknown Title",
      artist: song.artist || "Unknown Artist",
      album: song.album || "Unknown Album",
      artwork: [{
        src: artworkUrl,
        sizes: "512x512",
        type: "image/png",
      },
      ],
    });

    updateMediaSessionPlaybackState();

    navigator.mediaSession.setActionHandler("play", () => {
      audioElement.play();
      isPlaying = true;
      updateProgress();
      updateMediaSessionPlaybackState();
      togglePlayPauseIcons();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioElement.pause();
      isPlaying = false;
      updateProgress();
      updateMediaSessionPlaybackState();
      togglePlayPauseIcons();
    });
    navigator.mediaSession.setActionHandler("previoustrack", skipBackward);
    navigator.mediaSession.setActionHandler("nexttrack", skipForward);
    navigator.mediaSession.setActionHandler("stop", () => {
      audioElement.pause();
      audioElement.currentTime = 0; // Reset to the beginning
      isPlaying = false;
      updateMediaSessionPlaybackState();
      togglePlayPauseIcons();
      updateProgress();
    });
    navigator.mediaSession.setActionHandler("seekbackward", () => {
      audioElement.currentTime = Math.max(0, audioElement.currentTime - rewindInterval);
      updateProgress();
    });
    navigator.mediaSession.setActionHandler("seekforward", () => {
      audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + fastForwardInterval);
      updateProgress();
    });
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.fastSeek && "fastSeek" in audioElement) {
        audioElement.fastSeek(details.seekTime);
      } else {
        audioElement.currentTime = details.seekTime;
      }
      updateProgress();
    });
    navigator.mediaSession.setActionHandler("repeatmode",
      toggleRepeat);
    navigator.mediaSession.setActionHandler("shufflemode",
      toggleShuffle);
  }
}
export function updateMediaSessionPlaybackState() {
  navigator.mediaSession.playbackState = isPlaying ? "playing": "paused";
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2,
    "0")}`;
}
export function updateProgress() {
  if (!audioElement.duration) return; // Prevent NaN issues if no duration is set

  // Force real-time update for Android Media Session
  const currentTime = !audioElement.paused ? audioElement.currentTime: audioElement.currentTime;
  const duration = audioElement.duration;

  // Calculate progress percentage
  const percent = (currentTime / duration) * 100;

  // Update slider
  progressElapsed.style.width = `${percent}%`;
  sliderThumb.style.left = `${percent}%`;

  // Update time displays
  currentTimeDisplay.textContent = formatTime(currentTime);
  totalTimeDisplay.textContent = formatTime(duration);

  // Sync with Media Session (if applicable)
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setPositionState({
      duration: audioElement.duration,
      playbackRate: audioElement.playbackRate,
      position: audioElement.currentTime,
    });
  }
}
export function updateSlider(e) {
  const rect = progressBarr.getBoundingClientRect();
  let offsetX = e.clientX - rect.left;
  offsetX = Math.max(0, Math.min(offsetX, rect.width));

  const progressPercent = (offsetX / rect.width) * 100;

  // Update slider and progress bar immediately
  progressElapsed.style.width = `${progressPercent}%`;
  sliderThumb.style.left = `${progressPercent}%`;

  // Update tooltip
  const totalDuration = audioElement.duration;
  const currentTime = (progressPercent / 100) * totalDuration;
  timeToolTip.textContent = formatTime(currentTime);
  timeToolTip.style.left = `${progressPercent}%`;

  return currentTime;
}
export function seek() {
  const seekTime = (progressSlider.value / 100) * audioElement.duration;
  audioElement.currentTime = seekTime;
}
export function togglePlayPauseIcons() {
  if (audioElement.paused) {
    btnPlay.style.display = "inline";
    btnPause.style.display = "none";
  } else {
    btnPlay.style.display = "none";
    btnPause.style.display = "inline";
  }
  updateMediaSessionPlaybackState();
}
export function startDragging() {
  isDragging = true;
  audioElement.removeEventListener("timeupdate", updateProgress);
}
export function stopDragging() {
  if (isDragging) {
    const newTime = (progressElapsed.offsetWidth / progressBarr.offsetWidth) * audioElement.duration;
    audioElement.currentTime = newTime; // Set audio time only when dragging stops

    // Resume playback if it was playing before
    if (!audioElement.paused) {
      audioElement.play();
    }
    audioElement.addEventListener("timeupdate", updateProgress);
    isDragging = false;
  }
}
export function handleDragging(e) {
  if (isDragging) {
    updateSlider(e); // Update slider position visually only
  }
}

audioElement.addEventListener("play", togglePlayPauseIcons);
audioElement.addEventListener("pause", togglePlayPauseIcons);
audioElement.addEventListener("ended", () => {
  document.querySelectorAll(".song.active").forEach((songElem) => songElem.classList.remove("active"));
  togglePlayPauseIcons();
});
audioElement.addEventListener("timeupdate", updateProgress);
if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => {
    audioElement.play();
    isPlaying = true; // Ensure correct internal state
    updateProgress(); // Force an update when playback starts
    togglePlayPauseIcons();
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audioElement.pause();
    isPlaying = false; // Ensure correct internal state
    updateProgress(); // Force an update when playback stops
    togglePlayPauseIcons();
  });

  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.fastSeek && "fastSeek" in audioElement) {
      audioElement.fastSeek(details.seekTime);
    } else {
      audioElement.currentTime = details.seekTime;
    }
    updateProgress();
  });
}
progressSlider.addEventListener("mousedown", (e) => {
  startDragging();
  updateSlider(e);
});
document.addEventListener("mousemove", handleDragging);
document.addEventListener("mouseup", () => {
  stopDragging();
});
playPauseButton.addEventListener("click", () => {
  if (audioElement.paused) {
    audioElement.play();
  } else {
    audioElement.pause();
  }
  togglePlayPauseIcons();
});





/////////  P R I M A R Y  Functions  ////////////////
/////////////////////////////////////////////////////////////////
export function loadAllArtists() {
  setPage({
    "data-page": "all",
    "data-artist": null,
    // This will remove the attribute
  });

  artistNameTitle.style.display = "none";
  setTimeout(() => {
    const dynamicArea = document.getElementById("dynamicArea");
    const allArtistsContainer = document.createElement("div");
    allArtistsContainer.id = "allArtistsContainer";
    allArtistsContainer.className = "gallery";
    allArtistsContainer.classList.add("visible");
    dynamicArea.appendChild(allArtistsContainer);
    randomizeMe(musicLibrary);

    musicLibrary.forEach((artist) => {
      const artistDiv = document.createElement("div");
      artistDiv.className = "artistPage";
      artistDiv.classList.add("circlePhoto");
      artistDiv.setAttribute("data-artist", artist.artist);


      const artistImage = document.createElement("img");
      artistImage.src = `https://mybeats.cloud/mediaFiles/artistPortraits/${artist.artist.toLowerCase().replace(/\s/g, "")}.png`;
      artistImage.alt = artist.artist;

      artistImage.width = 100;
      artistImage.height = 100;

      const artistLink = document.createElement("a");
      artistLink.href = "#";
      artistLink.setAttribute("data-transition", "loaders");
      artistLink.addEventListener("click", (event) => {
        event.preventDefault();
        allArtistsContainer.style.width = "0";
        allArtistsContainer.style.transition = "width 1s ease";
        allArtistsContainer.style.display = "none";
        loadArtistInfo(artist.artist);
        const songList = document.createElement("div");
        songList.id = ("song-list");
        dynamicArea.appendChild(songList);
        artistNameTitle.style.display = "block";
      });

      const artistNameHeading = document.createElement("h4");
      artistNameHeading.innerText = artist.artist;

      artistLink.appendChild(artistNameHeading);
      artistDiv.appendChild(artistImage);
      artistDiv.appendChild(artistLink);
      allArtistsContainer.appendChild(artistDiv);
    });

    console.log("All Artists loaded successfully.");
  },
    1000);

  setActiveLink("showAll");
}
export function discoverMusic() {
  setPage({
    "data-page": "home"
  });

  artistNameTitle.style.display = "none";
  const newestArtists = musicLibrary.slice(0,
    5);

  setTimeout(() => {
    const dynamicArea = document.getElementById("dynamicArea");
    const newestArtistsContainer = document.createElement("div");
    newestArtistsContainer.id = "newestArtistsContainer";
    dynamicArea.appendChild(newestArtistsContainer);

    newestArtists.forEach((artist) => {
      const artistId = artist.artist.toLowerCase().replace(/\s/g, "");

      const artistDiv = document.createElement("div");
      artistDiv.setAttribute("data-transition", "loaders");
      artistDiv.className = "newest-artist";
      artistDiv.innerHTML = `
      <h3>${artist.artist}</h3>
      <div class="artist-albums" id="albums-${artistId}">
      </div>
      `;

      newestArtistsContainer.appendChild(artistDiv);

      const artistAlbumsDiv = document.getElementById(`albums-${artistId}`);

      artist.albums.forEach((album) => {
        const albumId = album.album.toLowerCase().replace(/\s/g, "");
        const albumDiv = document.createElement("div");
        albumDiv.className = "album-cover";
        albumDiv.setAttribute("data-album", album.album);

        albumDiv.innerHTML = `
        <img src="https://mybeats.cloud/mediaFiles/albumCovers/${albumId}.png" alt="${album.album}">
        <h5>${album.album}</h5>
        `;

        albumDiv.addEventListener("click", () => {

          setTimeout(() => {
            clearDynamicArea();
            loadArtistInfo(artist.artist);

            const songList = document.createElement("div");
            songList.id = ("song-list");
            dynamicArea.appendChild(songList);
            loadAlbumSongs(album.album, albumDiv);
            
            artistNameTitle.style.display = "block";
            artistNameTitle.classList.add("focusInContract");

            const albumButton = document.querySelector(`button[data-album="${album.album}"]`);
            if (albumButton) {
              albumButton.click();
            }
          },
            1500);
          const albumName = event.currentTarget.getAttribute("data-album");
          loadAlbumSongs(albumName,
            event.currentTarget);
          updateActiveButton(albumButton);
        });

        artistAlbumsDiv.appendChild(albumDiv);
      });
    });
  }, 1000);
}

/*****
export function loadArtistInfo(artistName) {
  // Update page data and URL
  setPage({
    "data-page": "artist",
    "data-artist": artistName,
  });
  pushToURL(artistName);

  const artistNameTitle = document.getElementById("artistNameTitle");
  artistNameTitle.classList.remove("artistInfoContent", "focusInContract");
  artistNameTitle.classList.add("blurOUT");

  // Find artist data
  const artist = musicLibrary.find((artist) => artist.artist === artistName);

  // Create and clear dynamic content
  const artistContainer = document.createElement("div");
  artistContainer.id = "artistDiscography";
  artistContainer.classList.add("artistDiscography");
  clearDynamicArea();
  dynamicArea.appendChild(artistContainer);

  const relatedArea = document.createElement("div");
  relatedArea.id = "relatedArtistsArea";
  relatedArea.classList.add("relatedArtistsArea");
    dynamicAreaBottom.appendChild("relatedArtistsArea");
    dynamicAreaBottom.appendChild("similarArtistsPLAYING");

  setTimeout(() => {
    artistContainer.innerHTML = "";

    if (artist) {
      // Artist information content
      const artistInfoContent = `
        <div class="desktopStyles">
          <div class="mainalbumcover">
            <img src="https://mybeats.cloud/mediaFiles/artistPortraits/${artistName.toLowerCase().replace(/\s/g, "")}.png" alt="${artistName}">
          </div>
          <div class="scrollingButtons" style="overflow-y: visible;">
            ${artist.albums.map((album) => `<button class="btnAlbums" data-album="${album.album}">${album.album}</button>`).join("")}
          </div>
        </div>
      `;
      artistContainer.innerHTML = artistInfoContent;

      // Update artist name title
      artistNameTitle.textContent = artist.artist;
      setTimeout(() => {
        artistNameTitle.classList.remove("blurOUT");
        artistNameTitle.classList.add("focusInContract");
      }, 2000);

      // Add event listeners to album buttons
      const albumButtons = artistContainer.querySelectorAll(".btnAlbums");
      albumButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          const albumName = event.currentTarget.getAttribute("data-album");
          loadAlbumSongs(albumName, event.currentTarget);
        });
      });

      // Related artists handling
      const relatedArtists = getSimilarArtists(artistName);
      relatedArtists.forEach((relatedArtistName) => {
        const relatedArtist = document.createElement("div");
        relatedArtist.className = "card";
        relatedArtist.innerHTML = `
          <div class="imgBx">
            <img src="https://mybeats.cloud/mediaFiles/artistPortraits/${relatedArtistName.toLowerCase().replace(/\s/g, "")}.png">
          </div>
          <div class="content">
            <div class="contentBx">
              <h2>${relatedArtistName}</h2>
            </div>
            <ul class="sci">
              <li style="--i:1"><i class="ph-fill ph-info" data-action="loadArtist"></i></li>
              <li style="--i:2"><i class="ph-fill ph-OTHER" data-action="OTHER"></i></li>
              <li style="--i:3"><i class="ph-fill ph-OTHER" data-action="OTHER"></i></li>
            </ul>
          </div>
        `;
        relatedArtist.setAttribute("data-transition", "loaders");
        relatedArtist.addEventListener("click", (event) => {
          event.preventDefault();
          loadArtistInfo(relatedArtistName);
        });

        relatedArea.appendChild(relatedArtist);
      });

      relatedArea.classList.remove("hidden");
      relatedArea.classList.add("visible");
    } else {
      console.log("Artist not found");
    }

    // Finalize updates
    randomizeMe(relatedArtists);
    dynamicAreaBottom.appendChild(relatedArea);
    scrollToTop();
  }, 1850);

  setActiveLink("artistDiscography");
}
***/

export function updateActiveButton(button) {
  console.log("Updating active button:",
    button);
  if (activeButton) activeButton.classList.remove("active");
  button.classList.add("active");
  activeButton = button;
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
  <div class="songInfo heart" id="favourites">
  <i class="ph-fill ph-heart"></i>
  </div>
  <div class="songInfo duration">${song.duration || "3:35"}</div>
  <div class="songInfo title">
  <h7 class="marquee">${song.title}</h7>
  </div>


  <div class="icon-actions">


  <div class="icon" title="Add to Playlist" data-action="addToPlaylist">
  <i class="ph-fill ph-plus-circle">
  </i>
  </div>

  <div class="icon" title="Play Next" data-action="playNext">
  <i class="ph-fill ph-check-circle">
  </i>
  </div>

  <div class="icon" title="Download" data-action="download">
  <i class="material-symbols-outlined">
  download_for_offline
  </i>
  </div>

  <div class="icon" title="Share" data-action="share">
  <i class="material-symbols-outlined">
  share
  </i>
  </div>


  </div>

  </div>
  <div class="moreMenu">
  <button id="songsMoreMenuBTN${song.id}" class="songsMoreMenuBTN" type="button">
  <i class="ph-fill ph-dots-three-outline"></i>
  </button>
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
    if (!isVisible) {
      iconActions.classList.add("visible");
    } else {
      iconActions.classList.remove("visible");
    }
  });

  const addToPlaylistIcon = songElement.querySelector(`[data-action="addToPlaylist"]`);
  addToPlaylistIcon.addEventListener("click",
    (event) => {
      event.preventDefault();
      popOverPLAY(addToPlaylistIcon, song);
    });

  songElement.addEventListener("dblclick",
    () => {
      currentSongIndex = index;
      playSong(currentAlbumSongs[currentSongIndex]);
    });
}
export function closeAllMenus() {
  document.querySelectorAll(".icon-actions").forEach((menu) => {
    menu.classList.remove("visible");
  });
}
export function popOverPLAY(button, song) {
  const popoverContent = document.createElement("div");
  popoverContent.classList.add("popover-content");
  popoverContent.innerHTML = `
  <div class="popover-playlist-options">
  <h5>Add to Playlist</h5><br>
  <i class="material-symbols-outlined">
  playlist_add_circle
  </i>
  <div class="playlist-options">
  ${Object.values(collections)
  .map(
    (playlist) => `
    <div class="radio-button">
    <input type="radio" id="radio${playlist.id}" name="radio-group" value="${playlist.id}">
    <label for="radio${playlist.id}">${playlist.title}</label>
    </div>`
  )
  .join("")}
  </div>
  <button id="confirmAddToPlaylist">Save</button>
  </div>
  `;

  document.body.appendChild(popoverContent);

  const cleanup = FloatingUIDOM.autoUpdate(button,
    popoverContent,
    () => {
      FloatingUIDOM.computePosition(button, popoverContent, {
        placement: "bottom",
        middleware: [],
      }).then(({
          x, y
        }) => {
        Object.assign(popoverContent.style, {
          left: `${x}px`,
          top: `${y}px`,
          position: "absolute",
        });
      });
    });

  popoverContent.querySelector("#confirmAddToPlaylist").addEventListener("click",
    () => {
      const selectedPlaylistId = popoverContent.querySelector("input[name='radio-group']:checked")?.value;
      if (selectedPlaylistId) {
        playlistPopOver(selectedPlaylistId, song.title, song.artist);
        alert(`Added ${song.title} to playlist!`);
      } else {
        alert("Please select a playlist.");
      }
      popoverContent.remove();
      cleanup();
    });

  setTimeout(() => {
    document.addEventListener(
      "click",
      (e) => {
        if (!popoverContent.contains(e.target) && e.target !== button) {
          popoverContent.remove();
          cleanup();
        }
      },
      {
        once: true
      }
    );
  }, 0);
}










/////// R E F R A C T O R E D
/////////////////// S E C O N D

/////// Player State and Related Artists Management ////////
///////////////////////////////////////////////////////////

let currentArtistId = null; // Tracks currently playing artist ID

/**
 * Updates the related artists area dynamically when a new song is played.
 * @param {string} artistName - Name of the currently playing artist.
 */
function updateRelatedArtistsArea(artistName) {
  const relatedArtistsArea = document.getElementById("relatedArtistsArea") || createRelatedArtistsArea();

  // Clear previous content
  relatedArtistsArea.innerHTML = "";

  // Fetch similar artists
  const artistData = musicLibrary.find((artist) => artist.artist === artistName);
  if (!artistData) {
    console.warn(`Artist "${artistName}" not found in the library.`);
    return;
  }

  // Update the artist's ID
  currentArtistId = artistName;
  const similarArtists = artistData.similar;

  // Render similar artists
  renderArtists(similarArtists, relatedArtistsArea);
}

/**
 * Creates the Related Artists Area and appends it to the DOM.
 * @returns {HTMLDivElement} The newly created related artists area.
 */
function createRelatedArtistsArea() {
  const relatedArtistsArea = document.createElement("div");
  relatedArtistsArea.id = "relatedArtistsArea";
  relatedArtistsArea.classList.add("relatedArtistsArea");
  dynamicAreaBottom.appendChild(relatedArtistsArea);
  return relatedArtistsArea;
}

/**
 * Renders a list of artists in the specified container.
 * @param {string[]} artists - Array of artist names to render.
 * @param {HTMLElement} container - Container where artists are displayed.
 */
function renderArtists(artists, container) {
  const maxDisplay = 20;
  const rowLimit = 4;
  let displayedCount = 0;

  const loadMoreButton = createLoadMoreButton(() => {
    const toDisplay = artists.slice(displayedCount, displayedCount + rowLimit);

    toDisplay.forEach((artistName) => {
      const artistCard = createArtistCard(artistName);
      container.appendChild(artistCard);
    });

    displayedCount += toDisplay.length;

    // Disable button if all artists are displayed
    if (displayedCount >= artists.length || displayedCount >= maxDisplay) {
      loadMoreButton.disabled = true;
    }
  });

  loadMoreButton.click(); // Initial rendering
  container.appendChild(loadMoreButton);
}

/**
 * Creates a "Load More" button for loading more artists.
 * @param {Function} onClick - Callback to handle button clicks.
 * @returns {HTMLButtonElement} The Load More button element.
 */
function createLoadMoreButton(onClick) {
  const button = document.createElement("button");
  button.id = "loadMoreSimilarArtists";
  button.innerText = "Load More";
  button.addEventListener("click", onClick);
  return button;
}

/**
 * Creates an artist card element for display.
 * @param {string} artistName - Name of the artist.
 * @returns {HTMLDivElement} The artist card element.
 */
function createArtistCard(artistName) {
  const card = document.createElement("div");
  card.className = "similarArtistCircle";

  const img = document.createElement("img");
  img.src = `https://mybeats.cloud/mediaFiles/artistPortraits/${artistName.toLowerCase().replace(/\s/g, "")}.png`;
  img.alt = artistName;
  img.width = 75;
  img.height = 75;

  const name = document.createElement("h5");
  name.innerText = artistName;

  card.appendChild(img);
  card.appendChild(name);

  return card;
}

/**
 * Sets the currently playing artist and updates the related artists area.
 * @param {string} artistName - Name of the artist to set as playing.
 */
function setPlayingArtist(artistName) {
  const previousArtist = document.getElementById("relatedArtistPlaying");
  if (previousArtist) previousArtist.removeAttribute("id");

  const newArtistElement = document.querySelector(`[data-artist-name="${artistName}"]`);
  if (newArtistElement) newArtistElement.id = "relatedArtistPlaying";

  updateRelatedArtistsArea(artistName);
}

/////// Updated loadArtistInfo Function ////////
////////////////////////////////////////////////

export function loadArtistInfo(artistName) {
// Update page data and URL
  setPage({
    "data-page": "artist",
    "data-artist": artistName,
  });
  pushToURL(artistName);

  const artistNameTitle = document.getElementById("artistNameTitle");
  artistNameTitle.classList.remove("artistInfoContent", "focusInContract");
  artistNameTitle.classList.add("blurOUT");

  // Find artist data
  const artist = musicLibrary.find((artist) => artist.artist === artistName);

  // Create and clear dynamic content
  const artistContainer = document.createElement("div");
  artistContainer.id = "artistDiscography";
  artistContainer.classList.add("artistDiscography");
  clearDynamicArea();
  dynamicArea.appendChild(artistContainer);

// Create Related Artists Area dynamically
  updateRelatedArtistsArea(artistName);

  setTimeout(() => {
    artistContainer.innerHTML = "";

    if (artist) {
// Artist information content
      const artistInfoContent = `
        <div class="desktopStyles">
          <div class="mainalbumcover">
            <img src="https://mybeats.cloud/mediaFiles/artistPortraits/${artistName.toLowerCase().replace(/\s/g, "")}.png" alt="${artistName}">
          </div>
          <div class="scrollingButtons" style="overflow-y: visible;">
            ${artist.albums.map((album) => `<button class="btnAlbums" data-album="${album.album}">${album.album}</button>`).join("")}
          </div>
        </div>
      `;
      artistContainer.innerHTML = artistInfoContent;

// Update artist name title
      artistNameTitle.textContent = artist.artist;
      setTimeout(() => {
        artistNameTitle.classList.remove("blurOUT");
        artistNameTitle.classList.add("focusInContract");
      }, 2000);

// Add event listeners to album buttons
      const albumButtons = artistContainer.querySelectorAll(".btnAlbums");
      albumButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          const albumName = event.currentTarget.getAttribute("data-album");
          loadAlbumSongs(albumName, event.currentTarget);
        });
      });
    } else {
      console.log("Artist not found");
    }

    scrollToTop();
  }, 1850);

  setActiveLink("artistDiscography");
}

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

    currentAlbumSongs = album.songs.map((song) => ({
      ...song,
      artist: artist.artist,
      album: album.album,
    }));

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









/////////  R O U T I N G  Functions  ////////////////
/////////////////////////////////////////////////////////////////
export function siteRouter() {
  siteMap(window.location.pathname, window.location.search);
  siteMapLinks();
  window.addEventListener("popstate", (event) => {
    siteMap(window.location.pathname,
      window.location.search);
  });
}
export function siteMap(path, query) {
  switch (path) {
    case "/discover":
      executeLoadingSequence();
      clearDynamicArea();
      setActiveLink("goHome");
      scrollToTop();
      discoverMusic();
      break;

    case "/allArtists":
      executeLoadingSequence();
      clearDynamicArea();
      setActiveLink("showAll");
      scrollToTop();
      loadAllArtists();
      break;

    case "/myCollections":
      executeLoadingSequence();
      clearDynamicArea();
      setActiveLink("myCollections");
      scrollToTop();
      displayPlaylists();
      break;

    case "/artists":
      const params = createDynamicURL(query);
      if (params.artist) {
        const artistName = params.artist.replace(/\./g, " ");

        pushToURL(artistName);

        executeLoadingSequence();
        clearDynamicArea();
        setActiveLink("artistDiscography");
        scrollToTop();
        loadArtistInfo(artistName);
      } else {
        loadThis("/allArtists");
      }
      break;

    default:
      loadThis("/discover");
      break;
  }
}
export function siteMapLinks() {
  const goHomeButton = document.getElementById("goHome");
  if (goHomeButton) {
    goHomeButton.addEventListener("click", (event) => {
      event.preventDefault();
      loadThis("/discover");
    });
  }
  const showAllButton = document.getElementById("showAll");
  if (showAllButton) {
    showAllButton.addEventListener("click", (event) => {
      event.preventDefault();
      loadThis("/allArtists");
    });
  }
  const collectionsButton = document.getElementById("myCollections");
  if (collectionsButton) {
    collectionsButton.addEventListener("click", (event) => {
      event.preventDefault();
      loadThis("/myCollections");
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target && event.target.classList.contains("artistPage")) {
      event.preventDefault();
      const artistName = event.target.getAttribute("data-artist");
      if (artistName) {
        // Replace spaces with periods for the URL
        const formattedArtistName = artistName.replace(/\s+/g, ".");
        loadThis(`/artists?artist=${formattedArtistName}`);
      }
    }
  });
}
export function loadThis(path) {
  window.history.pushState({},
    "",
    path);
  siteMap(path,
    window.location.search);
}
export function setPage(attrs) {
  Object.keys(attrs).forEach((key) => {
    document.body.setAttribute(key, attrs[key]);
  });
}

/////// L O A D I N G Animations ///////
///////////////////////////////////////
$(document).on("click", "[data-transition='loaders']", function () {
  executeLoadingSequence();
});
export function executeLoadingSequence() {
  showLoadingOverlay();
  startLoading();
  setTimeout(() => {
    finishLoading();
    hideLoadingOverlay();
  },
    3000);
}
export function resetProgressBar() {
  const progressBar = document.getElementById("loadingBar");
  if (progressBar) {
    progressBar.style.transition = "none";
    progressBar.style.width = "0%";
    progressBar.style.opacity = "1";
    progressBar.offsetWidth; // Force reflow
    progressBar.style.transition = "";
  }
}
export function startLoading() {
  const progressBar = document.getElementById("loadingBar");
  if (!progressBar) return;

  const pauseWidth = randomInt(30, 75);
  const jumpWidth = randomInt(80, 90);

  function updateWidth(width, duration) {
    return new Promise((resolve) => {
      progressBar.style.transition = `width ${duration}ms ease-in-out`;
      progressBar.style.width = `${width}%`;
      setTimeout(resolve, duration);
    });
  }

  async function animateLoading() {
    progressBar.style.opacity = "1";
    await updateWidth(pauseWidth, 2000);
    await updateWidth(jumpWidth, 850);
    await updateWidth(100, 1000);
  }

  animateLoading();
}
export function finishLoading() {
  const progressBar = document.getElementById("loadingBar");
  if (progressBar) {
    progressBar.style.transition = "width 0.75s ease-in-out, opacity 0.75s ease-in-out";
    progressBar.style.width = "100%";

    setTimeout(() => {
      progressBar.style.opacity = "0";
    }, 750);

    setTimeout(resetProgressBar, 1500);
  }
}
export function showLoadingOverlay() {
  toggleLoadingOverlay(true);
}
export function hideLoadingOverlay() {
  setTimeout(() => toggleLoadingOverlay(false), 1500);
}
export function toggleLoadingOverlay(visible) {
  const loadingOverlay = document.getElementById("pageLoader");
  if (loadingOverlay) {
    loadingOverlay.classList.toggle("visible", visible);
  }
}

///////// HELPER Functions /////////////
///////////////////////////////////////
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function createDynamicURL(query) {
  const params = {};
  if (query) {
    const queryString = query.substring(1);
    const pairs = queryString.split("&");
    pairs.forEach((pair) => {
      const [key, value] = pair.split("=");
      params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });
  }
  return params;
}
export function pushToURL(artistName) {
  if (!artistName) return;

  // Replace spaces with periods
  const formattedName = artistName.replace(/\s+/g, ".");
  const newURL = `${window.location.origin}/artists?artist=${formattedName}`;

  window.history.pushState({}, "", newURL);
}
export function fetchFromURL(query) {
  const params = new URLSearchParams(query);
  const artist = params.get("artist");
  if (artist) {
    // Replace periods with spaces
    return artist.replace(/\./g, " ");
  }
  return null; // Return null if no Artist exists
}

document.addEventListener("DOMContentLoaded", () => {
  siteRouter();
  initializeFavorites();
  loadPlaylist();
});





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




/////////  P L A Y L I S T S  Feature  ////////////////
/////////////////////////////////////////////////////////////////
let collections = {};
let tags = [];


const addTag = document.getElementById("addTagBtn");
const editPlaylist = document.querySelector("#playlistEditModal .form-submit-btn");
const uploadPhoto = document.querySelector("#creatorModal .drop-container");
const createButton = document.querySelector("#creatorModal .form-submit-btn");
const closeMe = document.querySelectorAll(".close");


export function thumbNails(file, callback) {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => callback(reader.result);
  reader.onerror = (error) => console.error("Error converting to Base64:", error);
}
export function create(title, description, tags, genre, thumbnail) {
  const id = playlistIDs();
  collections[id] = {
    id,
    title,
    description: description || "",
    tags: tags || "",
    genre: genre || "",
    tracks: [],
    thumbnail: thumbnail || null,
  };
  savePlaylist();
  displayPlaylists();
}
export function savePlaylist() {
  localStorage.setItem("collections", JSON.stringify(collections));
}
export function loadPlaylist() {
  const storedCollections = localStorage.getItem("collections");
  if (storedCollections) {
    collections = JSON.parse(storedCollections);
    displayPlaylists();
  }
}
export function displayPlaylists() {
  setPage({
    "data-page": "collections"
  });

  const dynamicArea = document.getElementById("dynamicArea");
  dynamicArea.innerHTML = '<div class="playlistGrid"></div>';
  const playlistGrid = document.querySelector(".playlistGrid");

  Object.values(collections).forEach((collection) => {
    const playlistThumbnail = document.createElement("div");
    playlistThumbnail.className = "playlistThumbnail";
    playlistThumbnail.id = collection.id;
    playlistThumbnail.setAttribute("data-transition", "loaders");

    const thumbnail = collection.thumbnail ? `<img src="${collection.thumbnail}" alt="${collection.title} Thumbnail" style="width: 150px; height: 150px; border-radius: 10px;">`: "";

    playlistThumbnail.innerHTML = `
    ${thumbnail}
    <div class="playlistDetails">
    <h3 style="margin: 10px 0;">${collection.title}</h3>
    <p class="tags">
    <span class="playlistTag">${collection.tags || "No tags"}</span></p>
    <p style="color: #999;">${collection.tracks.length} Songs</p>
    <button class="viewPlaylistsBtn editPlaylist" data-id="${collection.id}">Edit</button>
    </div>
    <br><br>
    `;

    // Add click event for opening playlist details
    playlistThumbnail.addEventListener("click", function () {
      setTimeout(() => {
        displayPlaylistsInfo(collection.id);
      }, 1000);
    });

    playlistGrid.appendChild(playlistThumbnail);
  });

  // Append "Create New Playlist" Button
  const createNewBtn = document.createElement("button");
  createNewBtn.id = "openCreatePlaylistModal";
  createNewBtn.className = "viewPlaylistsBtn";
  createNewBtn.textContent = "Create New Playlist";
  dynamicArea.appendChild(createNewBtn);

  // Show the "Create Playlist" Modal on Button Click
  createNewBtn.addEventListener("click", function () {
    document.getElementById("creatorModal").classList.add("visible");
  });

  setActiveLink("myCollections");
}
export function displayPlaylistsInfo(collectionId) {
  const collection = collections[collectionId];
  if (!collection) {
    console.error("Playlist not found!");
    return;
  }

  // Ensure the dynamicArea exists before rendering
  const dynamicArea = document.getElementById("dynamicArea");
  if (!dynamicArea) {
    console.error("Dynamic area not found!");
    return;
  }

  const thumbnail = collection.thumbnail ? `<img src="${collection.thumbnail}" alt="${collection.title} Thumbnail" class="playlist-thumbnail">`: ""; // Updated to use a class for styling

  const tagsHtml = collection.tags
  ? collection.tags
  .split(",")
  .map((tag) => `<span class="playlist-tag">${tag.trim()}</span>`)
  .join(" "): "No tags";

  // Render playlist details
  dynamicArea.innerHTML = `
  <div class="mainPlaylist playlistDetailsView">
  <div class="playlist-header">
  <div class="currentplaying">
  ${thumbnail}
  </div>
  <div class="details">
  <h3 class="heading">${collection.title}</h3>
  <div class="playlistTags">${tagsHtml}</div>
  <p class="playlistGenre">Genre: ${collection.genre || "Other"}</p>
  <p class="playlistDescription">${collection.description || "My favourite songs!"}</p>
  <p>${collection.tracks.length} <strong>Songs</strong></p>
  <button id="editPlaylistBtn" class="viewPlaylistsBtn" data-id="${collectionId}">Edit</button>
  </div>
  </div>

  <div id="playlistTracks" class="playlist-songs">
  ${collection.tracks.length > 0 ? "": "<p>You haven't added any songs yet!</p>"}
  </div>
  </div>
  `;

  const playlistTracks = document.getElementById("playlistTracks");
  collection.tracks.forEach((track) => {
    const trackItem = document.createElement("div");
    trackItem.className = "track";
    trackItem.id = track.id;
    trackItem.innerHTML = `
    <div class="loaderPlaylist">
    <div class="songPlaylist">
    <p class="name">${track.title}</p>
    <button class="removeTrackFromDetails" data-id="${track.id}">Remove</button>
    <p class="artistPlaylist">${track.artist}</p>
    </div>
    <div class="albumcoverPlaylist"></div>
    <div class="play"></div>
    </div>
    `;

    playlistTracks.appendChild(trackItem);

    trackItem.querySelector(".removeTrackFromDetails").addEventListener("click", () => {
      removeSong(collectionId, track.id);
      displayPlaylistsInfo(collectionId); // Re-render the details after removal
    });
  });

  document.getElementById("editPlaylistBtn").addEventListener("click", function () {
    playlistEditor(collectionId);
  });
}
export function playlistPopOver(collectionId, trackTitle, trackArtist) {
  const newTrack = {
    id: playlistIDs(),
    title: trackTitle,
    artist: trackArtist,
  };
  collections[collectionId].tracks.push(newTrack);
  savePlaylist();
}
export function playlistEditor(collectionId) {
  const collection = collections[collectionId];
  if (!collection) return;

  document.getElementById("editTitle").value = collection.title;
  document.getElementById("editDescription").value = collection.description;
  document.getElementById("editTags").value = collection.tags;
  document.getElementById("editGenre").value = collection.genre;
  document.getElementById("editThumbnailPreview").src = collection.thumbnail || "";
  document.getElementById("playlistEditModal").classList.add("visible");

  // Save collection ID to track which playlist is being edited
  document.getElementById("playlistEditModal").dataset.currentCollectionId = collectionId;

  // Render tracks within the playlist
  const trackList = document.getElementById("trackList");
  trackList.innerHTML = "";
  collection.tracks.forEach((track) => {
    trackList.innerHTML += `
    <div class="track" id="${track.id}">
    <p><strong>${track.title}</strong> by ${track.artist}</p>
    <button class="removeTrack" data-track-id="${track.id}">Remove</button>
    </div>
    `;
  });

  // Handle track removal
  document.querySelectorAll(".removeTrack").forEach((button) => {
    button.onclick = function () {
      const trackId = button.dataset.trackId;
      removeSong(collectionId, trackId);
    };
  });
}
export function removeSong(collectionId, trackId) {
  collections[collectionId].tracks = collections[collectionId].tracks.filter((track) => track.id !== trackId);
  savePlaylist();
  playlistEditor(collectionId);
}
export function playlistIDs() {
  return "id-" + Math.random().toString(36).substr(2, 16);
}
export function EditorCLOSE(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("visible");
  }
}
export function displayTags() {
  const container = document.getElementById("tags-input-container");
  container.innerHTML = "";

  tags.forEach((tag, index) => {
    const tagElement = document.createElement("span");
    tagElement.classList.add("tag");
    tagElement.innerHTML = `${tag} <span class="remove-tag" data-index="${index}">&times;</span>`;
    container.appendChild(tagElement);
  });
}

const closeCreatorModalBtn = document.getElementById("closeCreatorModal");
if (closeCreatorModalBtn) {
  closeCreatorModalBtn.addEventListener("click", () => {
    EditorCLOSE("creatorModal");
  });
}

const closeEditModalBtn = document.getElementById("closeEditModal");
if (closeEditModalBtn) {
  closeEditModalBtn.addEventListener("click", () => {
    EditorCLOSE("playlistEditModal");
  });
}

const myCollectionsBtn = document.getElementById("myCollections");
if (myCollectionsBtn) {
  myCollectionsBtn.addEventListener("click", function () {
    setTimeout(displayPlaylists, 1000);
  });
}

const createBtn = document.getElementById("create");
if (createBtn) {
  createBtn.addEventListener("click", () => {
    const createPlaylistModal = document.getElementById("creatorModal");
    if (createPlaylistModal) {
      createPlaylistModal.classList.add("visible");
      const insideModal = createPlaylistModal.querySelector(".insideModal");

      if (insideModal) {
        setTimeout(() => {
          insideModal.style.animation = "modalEnter 0.6s ease-in-out forwards";
        }, 50);
      }
    }
  });
}

const savePlaylistChangesBtn = document.getElementById("savePlaylistChanges");
if (savePlaylistChangesBtn) {
  savePlaylistChangesBtn.addEventListener("click", function () {
    const collectionId = document.getElementById("playlistEditModal")?.dataset.currentCollectionId;
    if (!collectionId) return;

    const updatedTitle = document.getElementById("editTitle")?.value.trim();
    const updatedDescription = document.getElementById("editDescription")?.value.trim();
    const updatedTags = document.getElementById("editTags")?.value.trim();
    const updatedGenre = document.getElementById("editGenre")?.value.trim();
    const fileInput = document.getElementById("editThumbnail");
    const updatedThumbnail = fileInput && fileInput.files.length > 0 ? URL.createObjectURL(fileInput.files[0]): collections[collectionId].thumbnail;

    collections[collectionId].title = updatedTitle || collections[collectionId].title;
    collections[collectionId].description = updatedDescription || collections[collectionId].description;
    collections[collectionId].tags = updatedTags || collections[collectionId].tags;
    collections[collectionId].genre = updatedGenre || collections[collectionId].genre;
    collections[collectionId].thumbnail = updatedThumbnail;

    savePlaylist();
    displayPlaylists();
    EditorCLOSE("playlistEditModal");
  });
}

closeMe.forEach((closeBtn) => {
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      const modal = closeBtn.closest(".modal");
      if (modal) {
        modal.classList.remove("visible");
      }
    });
  }
});
createButton.addEventListener("click", function () {
  const title = document.getElementById("createTitle").value.trim();
  const description = document.getElementById("createDescription").value.trim();
  const genre = document.getElementById("createGenre").value.trim();
  const fileInput = document.getElementById("uploadThumbnail");

  if (title) {
    if (fileInput && fileInput.files.length > 0) {
      // Convert file to Base64 and pass it to create
      thumbNails(fileInput.files[0], (base64Image) => {
        create(title, description, tags.join(", "), genre, base64Image);
        EditorCLOSE("creatorModal");
      });
    } else {
      // If no image is uploaded, call create with null for the thumbnail
      create(title, description, tags.join(", "), genre, null);
      EditorCLOSE("creatorModal");
    }
  } else {
    alert("Please enter a title for the playlist.");
  }
});
uploadPhoto.addEventListener("click", function () {
  document.getElementById("uploadThumbnail").click();
});
editPlaylist.addEventListener("click", function () {
  const collectionId = document.getElementById("playlistEditModal").dataset.currentCollectionId;
  if (!collectionId) return;

  const updatedTitle = document.getElementById("editTitle").value.trim();
  const updatedDescription = document.getElementById("editDescription").value.trim();
  const updatedGenre = document.getElementById("editGenre").value.trim();
  const fileInput = document.getElementById("editThumbnail");
  const updatedThumbnail = fileInput && fileInput.files.length > 0 ? URL.createObjectURL(fileInput.files[0]): collections[collectionId].thumbnail;

  // Tags are stored in the global 'tags' array, convert to string for storage
  collections[collectionId].title = updatedTitle || collections[collectionId].title;
  collections[collectionId].description = updatedDescription || collections[collectionId].description;
  collections[collectionId].tags = tags.join(", "); // Update with joined tags
  collections[collectionId].genre = updatedGenre || collections[collectionId].genre;
  collections[collectionId].thumbnail = updatedThumbnail;

  savePlaylist();
  displayPlaylists();
  EditorCLOSE("playlistEditModal");
});
addTag.addEventListener("click", function () {
  const input = document.getElementById("createTags");
  const tag = input.value.trim();

  if (tag !== "" && !tags.includes(tag)) {
    tags.push(tag);
    input.value = "";
    displayTags();
  }
});
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("remove-tag")) {
    const index = e.target.getAttribute("data-index");
    tags.splice(index, 1);
    displayTags();
  }
});

document.querySelectorAll(".modalWrapper").forEach((modal) => {
  modal.addEventListener("transitionend", function () {
    const modalContent = modal.querySelector(".insideModal");
    if (modal.classList.contains("visible")) {
      modalContent.style.transform = "scale(1)";
    } else {
      modalContent.style.transform = "scale(0.7)";
    }
  });
});





