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
