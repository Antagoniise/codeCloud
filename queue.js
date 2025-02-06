class QueueManager {
     constructor() {
          this.queueList = document.getElementById("queue-sortable");
          this.clearQueueBtn = document.querySelector(".clear-queue-btn");
          this.initEventListeners();
          this.loadQueue();
     }

     initEventListeners() {
          // Drag and Drop Functionality
          this.queueList.addEventListener(
               "dragstart",
               this.handleDragStart.bind(this)
          );
          this.queueList.addEventListener(
               "dragover",
               this.handleDragOver.bind(this)
          );
          this.queueList.addEventListener("drop", this.handleDrop.bind(this));
          this.queueList.addEventListener(
               "dragend",
               this.handleDragEnd.bind(this)
          );

          // Remove Song Interactions
          this.queueList.addEventListener(
               "click",
               this.handleRemoveSong.bind(this)
          );

          // Clear Queue
          this.clearQueueBtn.addEventListener(
               "click",
               this.clearQueue.bind(this)
          );
     }

     handleRemoveSong(e) {
          if (e.target.classList.contains("icon-remove")) {
               const songItem = e.target.closest(".queue-item");
               songItem.remove();
               this.saveQueue();
               this.updateQueueCount();
          }
     }

     clearQueue() {
          this.queueList.innerHTML = "";
          this.saveQueue();
          this.updateQueueCount();
     }

     saveQueue() {
          const queueItems = Array.from(this.queueList.children).map(
               (item) => ({
                    id: item.dataset.songId,
                    title: item.querySelector(".song-title").textContent,
                    artist: item.querySelector(".song-artist").textContent
               })
          );

          localStorage.setItem("musicQueue", JSON.stringify(queueItems));
     }

     loadQueue() {
          const savedQueue = JSON.parse(
               localStorage.getItem("musicQueue") || "[]"
          );

          savedQueue.forEach((song) => {
               const newItem = this.createQueueItemElement(song);
               this.queueList.appendChild(newItem);
          });

          this.updateQueueCount();
     }

     createQueueItemElement(song) {
          // Create queue item dynamically based on saved data
          const li = document.createElement("li");
          li.classList.add("queue-item");
          li.setAttribute("draggable", "true");
          li.dataset.songId = song.id;

          // Populate with song details (simplified for brevity)
          li.innerHTML = `
            <div class="drag-handle">⋮</div>
            <div class="song-details">
                <h3 class="song-title">${song.title}</h3>
                <p class="song-artist">${song.artist}</p>
            </div>
        `;

          return li;
     }

     updateQueueCount() {
          const queueCountElement = document.querySelector(".queue-count");
          const currentCount = this.queueList.children.length;
          queueCountElement.textContent = `(${currentCount} songs)`;
     }
     
     }


// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
     new QueueManager();
});
