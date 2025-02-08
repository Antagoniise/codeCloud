(function () {
    const PLAYLIST_STORAGE_KEY = "playlists";
    const dynamicArea = document.getElementById("dynamicArea");

    function initPlaylistManager() {
        const myCollectionsBtn = document.getElementById("myCollections");
        if (myCollectionsBtn) {
            myCollectionsBtn.addEventListener("click", showPlaylistManager);
        }

        createAddToPlaylistPopover();

        let playlistManager = document.getElementById("playlistManager");
        if (!playlistManager) {
            playlistManager = document.createElement("div");
            playlistManager.id = "playlistManager";
            playlistManager.style.display = "none";
            dynamicArea.appendChild(playlistManager);
        }

        initializeLocalStorage();
    }

    function initializeLocalStorage() {
        const storedPlaylists = localStorage.getItem(PLAYLIST_STORAGE_KEY);
        if (!storedPlaylists) {
            localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify([]));
        }
    }

    function getStoredPlaylists() {
        const playlists = localStorage.getItem(PLAYLIST_STORAGE_KEY);
        return playlists ? JSON.parse(playlists) : [];
    }

    function savePlaylists(playlists) {
        localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlists));
    }

    function showPlaylistManager() {
        const playlistManager = document.getElementById("playlistManager");
        if (!playlistManager) return;

        playlistManager.style.display =
            playlistManager.style.display === "none" ? "block" : "none";

        playlistManager.innerHTML = "";

        const createBtn = document.createElement("button");
        createBtn.id = "btnCreate";
        createBtn.textContent = "Create Playlist";
        createBtn.addEventListener("click", () => {
            showPlaylistForm("create");
        });
        playlistManager.appendChild(createBtn);
        

        const galleryContainer = document.createElement("div");
        galleryContainer.id = "playlistGallery";
        playlistManager.appendChild(galleryContainer);

        renderPlaylistGallery();
    }

    function renderPlaylistGallery() {
        const galleryContainer = document.getElementById("playlistGallery");
        if (!galleryContainer) return;

        const playlists = getStoredPlaylists();

        galleryContainer.innerHTML = "";

        playlists.forEach((pl, index) => {
            const playlistThumb = document.createElement("div");
            playlistThumb.style.border = "1px solid #ccc";
            playlistThumb.style.padding = "10px";
            playlistThumb.style.margin = "10px";
            playlistThumb.style.display = "inline-block";
            playlistThumb.style.cursor = "pointer";

            const img = document.createElement("img");
            img.src = pl.thumbnail ? pl.thumbnail : "https://via.placeholder.com/80?text=No+Image";
            img.alt = pl.name;
            img.style.width = "80px";
            img.style.height = "80px";
            playlistThumb.appendChild(img);

            const nameEl = document.createElement("div");
            nameEl.textContent = pl.name;
            playlistThumb.appendChild(nameEl);

            const countEl = document.createElement("div");
            countEl.textContent = `Songs: ${pl.songs ? pl.songs.length : 0}`;
            playlistThumb.appendChild(countEl);

            playlistThumb.addEventListener("click", () => {
                showPlaylistForm("edit", pl, index);
            });

            galleryContainer.appendChild(playlistThumb);
        });
    }

    function showPlaylistForm(mode, playlist = null, playlistIndex = -1) {
        const playlistManager = document.getElementById("playlistManager");
        if (!playlistManager) return;

        playlistManager.innerHTML = "";

        const form = document.createElement("div");
        form.style.border = "1px solid #ccc";
        form.style.padding = "10px";
        form.style.margin = "10px";

        const heading = document.createElement("h2");
        heading.textContent = mode === "create" ? "Create Playlist" : "Edit Playlist";
        form.appendChild(heading);

        // Name
        const nameLabel = document.createElement("label");
        nameLabel.textContent = "Name: ";
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.value = playlist ? playlist.name : "";
        form.appendChild(nameLabel);
        form.appendChild(nameInput);
        form.appendChild(document.createElement("br"));

        // Description
        const descLabel = document.createElement("label");
        descLabel.textContent = "Description: ";
        const descInput = document.createElement("textarea");
        descInput.value = playlist ? playlist.description : "";
        form.appendChild(descLabel);
        form.appendChild(descInput);
        form.appendChild(document.createElement("br"));

        // Tags
        const tagsLabel = document.createElement("label");
        tagsLabel.textContent = "Tags: ";
        const tagsInput = document.createElement("input");
        tagsInput.type = "text";
        tagsInput.value = playlist ? playlist.tags : "";
        form.appendChild(tagsLabel);
        form.appendChild(tagsInput);
        form.appendChild(document.createElement("br"));

        // Genre
        const genreLabel = document.createElement("label");
        genreLabel.textContent = "Genre: ";
        const genreInput = document.createElement("input");
        genreInput.type = "text";
        genreInput.value = playlist ? playlist.genre : "";
        form.appendChild(genreLabel);
        form.appendChild(genreInput);
        form.appendChild(document.createElement("br"));

        // Thumbnail Photo Upload
        const thumbLabel = document.createElement("label");
        thumbLabel.textContent = "Thumbnail Photo (URL or upload simulation): ";
        const thumbInput = document.createElement("input");
        thumbInput.type = "text";
        thumbInput.value = playlist ? playlist.thumbnail : "";
        form.appendChild(thumbLabel);
        form.appendChild(thumbInput);
        form.appendChild(document.createElement("br"));

        // Action Buttons
        const actionBtn = document.createElement("button");
        actionBtn.textContent = mode === "create" ? "Create" : "Save";
        actionBtn.addEventListener("click", () => {
            if (mode === "create") {
                createPlaylist({
                    name: nameInput.value,
                    description: descInput.value,
                    tags: tagsInput.value,
                    genre: genreInput.value,
                    thumbnail: thumbInput.value
                });
            } else {
                updatePlaylist(
                    {
                        name: nameInput.value,
                        description: descInput.value,
                        tags: tagsInput.value,
                        genre: genreInput.value,
                        thumbnail: thumbInput.value
                    },
                    playlistIndex
                );
            }
        });
        form.appendChild(actionBtn);

        const cancelBtn = document.createElement("button");
        cancelBtn.style.marginLeft = "10px";
        cancelBtn.textContent = "Cancel";
        cancelBtn.addEventListener("click", () => {
            // Rebuild the manager area (show gallery again).
            showPlaylistManager();
        });
        form.appendChild(cancelBtn);

        // Append form to manager.
        playlistManager.appendChild(form);
    }

    function createPlaylist(playlistData) {
        const playlists = getStoredPlaylists();
        const newPlaylist = {
            name: playlistData.name,
            description: playlistData.description,
            tags: playlistData.tags,
            genre: playlistData.genre,
            thumbnail: playlistData.thumbnail,
            songs: []
        };
        playlists.push(newPlaylist);
        savePlaylists(playlists);
        showPlaylistManager();
    }

    function updatePlaylist(newData, index) {
        let playlists = getStoredPlaylists();
        if (playlists[index]) {
            playlists[index].name = newData.name;
            playlists[index].description = newData.description;
            playlists[index].tags = newData.tags;
            playlists[index].genre = newData.genre;
            playlists[index].thumbnail = newData.thumbnail;
        }
        savePlaylists(playlists);
        showPlaylistManager();
    }

    function createAddToPlaylistPopover() {
        let popover = document.getElementById("addToPlaylistPopover");
        if (!popover) {
            popover = document.createElement("div");
            popover.id = "addToPlaylistPopover";
            popover.style.position = "absolute";
            popover.style.border = "1px solid #ccc";
            popover.style.padding = "10px";
            popover.style.backgroundColor = "#fff";
            popover.style.display = "none";
            document.body.appendChild(popover);

            const label = document.createElement("label");
            label.textContent = "Select Playlist: ";
            popover.appendChild(label);

            const dropdown = document.createElement("select");
            dropdown.id = "playlistDropdown";
            popover.appendChild(dropdown);

            popover.appendChild(document.createElement("br"));
            popover.appendChild(document.createElement("br"));

            const btnSave = document.createElement("button");
            btnSave.textContent = "Save";
            btnSave.addEventListener("click", saveSongToSelectedPlaylist);
            popover.appendChild(btnSave);

            const btnCancel = document.createElement("button");
            btnCancel.textContent = "Cancel";
            btnCancel.style.marginLeft = "10px";
            btnCancel.addEventListener("click", hideAddToPlaylistPopover);
            popover.appendChild(btnCancel);
        }
    }

    window.showAddToPlaylistPopover = function (event, songId) {
        const popover = document.getElementById("addToPlaylistPopover");
        if (!popover) return;

        // Position it near the triggering button.
        popover.style.display = "block";
        popover.style.left = event.pageX + "px";
        popover.style.top = event.pageY + "px";

        // Store the songId in a data attribute for later use.
        popover.setAttribute("data-song-id", songId);

        // Populate the dropdown with existing playlists.
        const dropdown = document.getElementById("playlistDropdown");
        dropdown.innerHTML = "";
        const playlists = getStoredPlaylists();
        playlists.forEach((pl, index) => {
            const option = document.createElement("option");
            option.value = index;
            option.textContent = pl.name;
            dropdown.appendChild(option);
        });
    };

    function hideAddToPlaylistPopover() {
        const popover = document.getElementById("addToPlaylistPopover");
        if (popover) {
            popover.style.display = "none";
            popover.removeAttribute("data-song-id");
        }
    }

    function saveSongToSelectedPlaylist() {
        const popover = document.getElementById("addToPlaylistPopover");
        if (!popover) return;

        const songId = popover.getAttribute("data-song-id");
        if (!songId) return;

        const dropdown = document.getElementById("playlistDropdown");
        const selectedIndex = parseInt(dropdown.value);

        const playlists = getStoredPlaylists();
        if (playlists[selectedIndex]) {
            if (!Array.isArray(playlists[selectedIndex].songs)) {
                playlists[selectedIndex].songs = [];
            }
            // Add the song to the playlist if not already in it
            if (!playlists[selectedIndex].songs.includes(songId)) {
                playlists[selectedIndex].songs.push(songId);
            }
            savePlaylists(playlists);
        }

        hideAddToPlaylistPopover();
    }

    document.addEventListener("DOMContentLoaded", initPlaylistManager);
})();
