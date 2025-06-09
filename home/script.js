


/**
let isAnimating = false;
const cardsContainer = document.getElementById("cardsContainer");
const minimizedCardsContainer = document.getElementById("minimizedCardsContainer");
const minimizedCardsGrid = document.getElementById("minimizedCardsGrid");

function waitForEvent(element, eventName, timeout) {
  return new Promise((resolve) => {
    let timeoutId;
    const eventListener = () => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve("event");
    };
    element.addEventListener(eventName, eventListener, {
      once: true,
    });
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        element.removeEventListener(eventName, eventListener);
        resolve("timeout");
      }, timeout);
    }
  });
}

function createCard(data) {
  const card = document.createElement("div");
  card.className = `card bg-bgSections rounded-xl shadow-sm overflow-hidden border border-borderPrimary relative transition-all duration-500 cursor-pointer`;
  card.id = `card-${data.id}`;
  card.dataset.cardId = data.id;
  card.dataset.state = "collapsed";

  const banner = document.createElement("div");
  banner.className = `banner ${data.bannerColor} h-full flex items-center justify-center text-white text-5xl transition-all duration-500`;
  banner.innerHTML = `<i class="${data.icon}" style="opacity: 0.65; position: absolute; top: 1rem; left: 1rem; padding: 1rem;"></i>`;

  const header = document.createElement("div");
  header.className = "card-header-element header-hidden absolute top-0 left-0 right-0 bg-headerBg px-4 py-3 flex justify-between items-center border-b border-borderPrimary z-20";

  const title = document.createElement("h3");
  title.className = "font-semibold truncate text-lg";
  title.textContent = data.title;

  const actions = document.createElement("div");
  actions.className = "actionIcons flex space-x-3";

  const minimizeBtn = document.createElement("div");
  minimizeBtn.className = "action action-btn";
  minimizeBtn.innerHTML = `
 <!-- Trashcan -->
 <svg class="global medium trashCan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
 <!--! Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc. -->
 <path
 d="M163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3C140.6 6.8 151.7 0 163.8 0zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zM337 265c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L337 265z"
 />
 </svg>
 `;
  minimizeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    minimizeCard(card);
  });

  const closeBtn = document.createElement("button");
  closeBtn.className = "action action-btn text-textSecondary hover:text-red-500 transition-colors";
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.title = "Close";
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (card.dataset.state === "expanded" && !isAnimating) {
      collapseCard(card);
    }
  });

  const externalBtn = document.createElement("button");
  externalBtn.className = "action action-btn text-textSecondary hover:text-blue transition-colors";
  externalBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';
  externalBtn.title = "Open externally";
  externalBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    window.open(data.url, "_blank");
  });

  actions.appendChild(minimizeBtn);
  actions.appendChild(closeBtn);
  actions.appendChild(externalBtn);
  header.appendChild(title);
  header.appendChild(actions);

  const content = document.createElement("div");
  content.className = "card-summary-content absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-all duration-300";
  content.innerHTML = `
 <svg class="global darkGray large opaqueMD icon-beat-fade" style="justify-self: center; --beat-fade-opacity: 0.67; --beat-fade-scale: 0.825; --beat-fade-duration: 1.5s;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
 <!--! Font Awesome Pro 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2024 Fonticons, Inc. -->
 <defs>
 <style>
 .fa-secondary {
 opacity: 0.4;
 }
 </style>
 </defs>
 <path
 class="fa-secondary"
 d="M0 384c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32zM89.4 153.4c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0zM288 96l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32zM441.4 217.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-64 64zM512 384c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32z"
 />
 <path class="fa-primary" d="M192 384c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-192 0c-17.7 0-32-14.3-32-32z" />
 </svg>


 <p class="text-white text-sm font-medium">${data.description}</p>
 <div class="flex flex-wrap gap-2 mt-2">
 ${data.tags
   .map(
     (tag) => `
  <span class="tag bg-tagBg text-tagText text-xs px-2 py-1 rounded">${tag}</span>
  `
   )
   .join("")}
 </div>
 `;

  const detailsContainer = document.createElement("div");
  detailsContainer.className = "details-container absolute bottom-0 left-0 right-0";
  detailsContainer.innerHTML = data.details;

  card.appendChild(banner);
  card.appendChild(header);
  card.appendChild(content);
  card.appendChild(detailsContainer);

  card.addEventListener("click", () => {
    if (isAnimating) return;
    if (card.dataset.state === "collapsed") {
      expandCard(card);
    }
  });

  return card;
}

async function expandCard(card) {
  if (!card || card.dataset.state !== "collapsed" || isAnimating) return;

  isAnimating = true;
  card.dataset.state = "expanding";

  try {
    const currentlyExpanded = cardsContainer.querySelector('[data-state="expanded"]');
    if (currentlyExpanded && currentlyExpanded !== card) {
      await collapseCard(currentlyExpanded);
    }

    if (card.dataset.state !== "expanding") {
      isAnimating = false;
      return;
    }

    const header = card.querySelector(".card-header-element");
    const banner = card.querySelector(".banner");
    const summaryContent = card.querySelector(".card-summary-content");
    const detailsContainer = card.querySelector(".details-container");

    card.classList.add("card-expanded");

    header.classList.remove("header-hidden");
    header.classList.remove("slide-header-up");
    header.classList.add("slide-header-down");

    banner.classList.add("banner-expanded");
    summaryContent.classList.add("fluid-disappear");

    await waitForEvent(header, "animationend", 300);

    if (card.dataset.state !== "expanding") {
      isAnimating = false;
      return;
    }

    if (detailsContainer) {
      detailsContainer.classList.add("expanded");
      detailsContainer.scrollTop = 0; // Key Fix: Reset scroll position
    }
    card.dataset.state = "expanded";

    setTimeout(() => {
      if (card.dataset.state === "expanded") {
        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 50);
  } catch (error) {
    console.error("Error during expandCard:", error);
    card.dataset.state = "collapsed";
    card.classList.remove("card-expanded", "card-expanding");
    const header = card.querySelector(".card-header-element");
    if (header) {
      header.classList.add("header-hidden");
      header.classList.remove("slide-header-down", "slide-header-up");
    }
    const banner = card.querySelector(".banner");
    if (banner) banner.classList.remove("banner-expanded");
    const summaryContent = card.querySelector(".card-summary-content");
    if (summaryContent) summaryContent.classList.remove("fluid-disappear");
    const detailsContainer = card.querySelector(".details-container");
    if (detailsContainer) {
      detailsContainer.classList.remove("expanded");
      detailsContainer.scrollTop = 0; // Also reset on error/aborted expansion
    }
  } finally {
    isAnimating = false;
  }
}

async function collapseCard(card) {
  if (!card || card.dataset.state !== "expanded" || isAnimating) return;

  isAnimating = true;
  card.dataset.state = "collapsing";

  try {
    const header = card.querySelector(".card-header-element");
    const banner = card.querySelector(".banner");
    const summaryContent = card.querySelector(".card-summary-content");
    const detailsContainer = card.querySelector(".details-container");

    if (detailsContainer) {
      detailsContainer.classList.remove("expanded");
    }
    header.classList.remove("slide-header-down");
    header.classList.add("slide-header-up");
    banner.classList.remove("banner-expanded");
    summaryContent.classList.remove("fluid-disappear");
    summaryContent.classList.add("fluid-appear");

    await Promise.all([waitForEvent(detailsContainer, "transitionend", 500), waitForEvent(header, "animationend", 300)]);

    if (card.dataset.state !== "collapsing") {
      isAnimating = false;
      return;
    }

    header.classList.add("header-hidden");
    header.classList.remove("slide-header-up");
    summaryContent.classList.remove("fluid-appear");
    card.classList.remove("card-expanded");
    card.dataset.state = "collapsed";
    if (detailsContainer) {
      // Ensure scroll is reset for next time too
      detailsContainer.scrollTop = 0;
    }
  } catch (error) {
    console.error("Error during collapseCard:", error);
    card.dataset.state = "collapsed";
    card.classList.remove("card-expanded", "card-collapsing");
    const header = card.querySelector(".card-header-element");
    if (header) {
      header.classList.add("header-hidden");
      header.classList.remove("slide-header-down", "slide-header-up");
    }
    const banner = card.querySelector(".banner");
    if (banner) banner.classList.remove("banner-expanded");
    const summaryContent = card.querySelector(".card-summary-content");
    if (summaryContent) {
      summaryContent.classList.remove("fluid-disappear", "fluid-appear");
    }
    const detailsContainer = card.querySelector(".details-container");
    if (detailsContainer) {
      detailsContainer.classList.remove("expanded");
      detailsContainer.scrollTop = 0; // Reset scroll on error during collapse
    }
  } finally {
    isAnimating = false;
  }
}

function minimizeCard(card) {
  const cardId = card.dataset.cardId;
  const cardData = typeof cardsData !== "undefined" ? cardsData.find((c) => c.id === cardId) : null;
  if (!cardData) {
    console.error("Card data not found for minimizing cardId:", cardId);
    return;
  }

  if (isAnimating && card.dataset.state !== "minimized") return;

  if (card.dataset.state === "minimized") {
    const originalCard = document.getElementById(`card-${cardId}`);
    if (originalCard) {
      originalCard.classList.remove("card-minimized");
      originalCard.dataset.state = "collapsed";
    }
    const minimizedCardElement = document.getElementById(`minimized-${cardId}`);
    if (minimizedCardElement) minimizedCardElement.remove();

    if (minimizedCardsGrid.children.length === 0) {
      minimizedCardsContainer.classList.add("hidden");
    }
  } else {
    const performMinimize = () => {
      card.dataset.state = "minimized";
      card.classList.add("card-minimized");
      minimizedCardsContainer.classList.remove("hidden");

      const minimizedCard = document.createElement("div");
      minimizedCard.className = "minimized-card bg-bgSections p-3 rounded-lg border border-borderPrimary flex items-center justify-between hover:bg-headerBg transition-colors";
      minimizedCard.id = `minimized-${cardId}`;

      minimizedCard.innerHTML = `
   <div class="flex items-center space-x-3">
   <div class="${cardData.bannerColor} w-10 h-10 rounded-lg flex items-center justify-center text-white">
   <i class="${cardData.icon} text-lg"></i>
   </div>
   <div>
   <div class="font-medium">${cardData.title}</div>
   <div class="text-xs text-textSecondary truncate max-w-xs">${cardData.description}</div>
   </div>
   </div>
   <button class="action-btn text-textSecondary hover:text-green transition-colors" title="Restore">
   <i class="fas fa-window-restore"></i>
   </button>
   `;

      minimizedCard.querySelector("button").addEventListener("click", (e) => {
        e.stopPropagation();
        minimizeCard(card);
      });

      minimizedCardsGrid.appendChild(minimizedCard);
    };

    if (card.dataset.state === "expanded") {
      collapseCard(card)
        .then(() => {
          if (card.dataset.state === "collapsed") {
            performMinimize();
          }
        })
        .catch((error) => console.error("Error collapsing card before minimizing:", error));
    } else {
      performMinimize();
    }
  }
}

if (typeof cardsData !== "undefined" && Array.isArray(cardsData)) {
  cardsData.forEach((cardData) => {
    if (cardsContainer) {
      cardsContainer.appendChild(createCard(cardData));
    } else {
      console.error("cardsContainer not found in the DOM.");
    }
  });
} else {
  console.warn("cardsData is not defined or not an array. No cards will be created.");
}


**/





let isAnimating = false;
const cardsContainer = document.getElementById("cardsContainer");
const minimizedCardsContainer = document.getElementById("minimizedCardsContainer");
const minimizedCardsGrid = document.getElementById("minimizedCardsGrid");
const toastContainer = document.getElementById("toastContainer");
const darkModeToggle = document.getElementById("darkModeToggle");
const contactWidgetContainer = document.getElementById("contactWidgetContainer");
const contactTriggerBtn = document.getElementById("contactTriggerBtn");
const contactFormContainer = document.getElementById("contactFormContainer");
const contactFormElement = document.getElementById("contactFormElement");
const cardsData = [
    {
        id: "github",
        title: "GitHub",
        bannerColor: "bg-purple",
        icon: "fab fa-github",
        url: "https://github.com",
        description: "The world's leading software development platform with version control using Git.",
        details: `
 <div class="detailsInner">
 <p class="text-textPrimary">GitHub is a web-based platform used for version control. It makes it easy for developers to share code files and collaborate with fellow developers on open-source projects.</p>

 <div class="bg-headerBg p-4 rounded-lg">
 <h3 class="font-semibold text-lg mb-2 text-green">Key Features</h3>
 <ul class="list-disc pl-5 space-y-2">
 <li><span class="font-medium">Git repositories</span> with full version control capabilities</li>
 <li>Advanced <span class="font-medium">collaboration tools</span> including issues and pull requests</li>
 <li><span class="font-medium">GitHub Actions</span> for powerful CI/CD workflows</li>
 <li>Integrated <span class="font-medium">project management</span> with boards and automation</li>
 <li>Robust <span class="font-medium">code review</span> system with inline comments</li>
 <li><span class="font-medium">GitHub Pages</span> for easy static site hosting</li>
 </ul>
 </div>

 <div class="bg-headerBg p-4 rounded-lg">
 <h3 class="font-semibold text-lg mb-2 text-blue">Community</h3>
 <p>GitHub hosts one of the largest developer communities in the world, with millions of open source projects across all technologies.</p>
 </div>
 </div>
 `,
        tags: ["version control", "collaboration", "open source", "git"],
    },
    {
        id: "stackoverflow",
        title: "Stack Overflow",
        bannerColor: "bg-yellow",
        icon: "fab fa-stack-overflow",
        url: "https://stackoverflow.com",
        description: "Q&A platform for professional and enthusiast programmers with over 10 million questions.",
        details: `
  <div class="detailsInner space-y-4">
  <p class="text-textPrimary">Stack Overflow is the largest, most trusted online community for developers to learn, share their knowledge, and build their careers.</p>

  <div class="bg-headerBg p-4 rounded-lg">
  <h3 class="font-semibold text-lg mb-2 text-green">Why Developers Love It</h3>
  <ul class="list-disc pl-5 space-y-2">
  <li><span class="font-medium">Community-driven Q&A</span> with voting system to surface best answers</li>
  <li>Massive archive of <span class="font-medium">programming solutions</span> for every language</li>
  <li><span class="font-medium">Reputation system</span> that rewards helpful contributors</li>
  <li>Specialized <span class="font-medium">tags system</span> for easy topic navigation</li>
  <li>Integrated <span class="font-medium">job listings</span> for developers</li>
  <li>Active <span class="font-medium">community moderation</span> to maintain quality</li>
  </ul>
  </div>

  <div class="bg-headerBg p-4 rounded-sm">
  <h3 class="font-semibold text-lg mb-2 text-blue">Stats</h3>
  <p>Over 100 million visitors per month and more than 21 million questions asked since founding.</p>
  </div>
  </div>
  `,
        tags: ["Q&A", "community", "problem solving", "documentation"],
    },
    {
        id: "codepen",
        title: "CodePen",
        bannerColor: "bg-blue",
        icon: "fab fa-codepen",
        url: "https://codepen.io",
        description: "Social development environment for front-end designers and developers to showcase work.",
        details: `
  <div class="detailsInner space-y-4">
  <p class="text-textPrimary">CodePen is an essential tool for front-end developers to experiment with, showcase, and test HTML, CSS and JavaScript code snippets.</p>

  <div class="bg-headerBg p-4 rounded-lg">
  <h3 class="font-semibold text-lg mb-2 text-green">Features</h3>
  <ul class="list-disc pl-5 space-y-2">
  <li><span class="font-medium">Live preview</span> of HTML, CSS, JavaScript as you type</li>
  <li>Instant <span class="font-medium">collaborative editing</span> for team projects</li>
  <li>Built-in <span class="font-medium">asset hosting</span> for images and other resources</li>
  <li>Curated <span class="font-medium">community collections</span> of inspiring designs</li>
  <li>Easy <span class="font-medium">embeddable pens</span> for blogs and documentation</li>
  <li>Advanced <span class="font-medium">PRO features</span> for teams and organizations</li>
  </ul>
  </div>

  <div class="bg-headerBg p-4 rounded-lg">
  <h3 class="font-semibold text-lg mb-2 text-purple">Use Cases</h3>
  <p>Perfect for prototyping UI components, testing browser compatibility, creating demos for documentation, and building design systems.</p>
  </div>
  </div>
  `,
        tags: ["frontend", "sandbox", "showcase", "prototyping"],
    },
    {
        id: "mdn",
        title: "MDN Web Docs",
        bannerColor: "bg-red",
        icon: "fas fa-book",
        url: "https://developer.mozilla.org",
        description: "Comprehensive documentation for web technologies including HTML, CSS, and JavaScript.",
        details: `
  <div class="detailsInner space-y-4">
  <p class="text-textPrimary">MDN Web Docs provides detailed documentation for web standards and technologies maintained by Mozilla and a community of contributors.</p>

  <div class="bg-headerBg p-4 rounded-lg">
  <h3 class="font-semibold text-lg mb-2 text-green">Documentation Coverage</h3>
  <ul class="list-disc pl-5 space-y-2">
  <li>Complete <span class="font-medium">HTML elements</span> and attributes reference</li>
  <li>Detailed <span class="font-medium">CSS properties</span> with examples and browser support</li>
  <li>Comprehensive <span class="font-medium">JavaScript</span> language reference</li>
  <li>Extensive <span class="font-medium">Web APIs</span> documentation with examples</li>
  <li>Practical <span class="font-medium">accessibility</span> guides and best practices</li>
  <li>Up-to-date <span class="font-medium">browser compatibility</span> data</li>
  </ul>
  </div>

  <div class="bg-headerBg p-4 rounded-lg">
  <h3 class="font-semibold text-lg mb-2 text-blue">Learning Resources</h3>
  <p>MDN offers structured learning paths for web development beginners, including interactive examples and tutorials.</p>
  </div>
  </div>
  `,
        tags: ["documentation", "web development", "reference", "learning"],
    },
    {
        id: "devto",
        title: "DEV Community",
        bannerColor: "bg-green",
        icon: "fab fa-dev",
        url: "https://dev.to",
        description: "Inclusive social network where programmers share ideas and help each other grow.",
        details: `
  <div class="detailsInner space-y-4">
  <p class="text-textPrimary">DEV Community is a constructive and inclusive social network for software developers at all stages of their careers.</p>

  <div class="bg-headerBg p-4 rounded-lg">
  <h3 class="font-semibold text-lg mb-2 text-green">Community Highlights</h3>
  <ul class="list-disc pl-5 space-y-2">
  <li>High-quality <span class="font-medium">technical articles</span> and tutorials</li>
  <li>Engaging <span class="font-medium">discussion threads</span> on current topics</li>
  <li>Weekly <span class="font-medium">coding challenges</span> to test your skills</li>
  <li>Regular <span class="font-medium">AMA sessions</span> with industry experts</li>
  <li>Curated <span class="font-medium">job listings</span> from top companies</li>
  <li>Active <span class="font-medium">open source</span> community</li>
  </ul>
  </div>

  <div class="bg-headerBg p-4 rounded-lg">
  <h3 class="font-semibold text-lg mb-2 text-purple">Content Formats</h3>
  <p>Beyond articles, DEV features podcasts, video content, live streams, and interactive workshops.</p>
  </div>
  </div>
  `,
        tags: ["community", "blogging", "learning", "discussion"],
    },
    {
        id: "css-tricks",
        title: "CSS-Tricks",
        bannerColor: "bg-blue-600",
        icon: "fas fa-paint-brush",
        url: "https://css-tricks.com",
        description: "Daily articles about CSS, HTML, JavaScript, and all things related to web design.",
        details: `
  <div class="detailsInner space-y-4">
  <p class="text-textPrimary">CSS-Tricks is a premier destination for web designers and developers to learn about the latest techniques and best practices.</p>

  <div class="bg-headerBg p-4 rounded-lg">
  <h3 class="font-semibold text-lg mb-2 text-green">Content Focus</h3>
  <ul class="list-disc pl-5 space-y-2">
  <li>In-depth <span class="font-medium">CSS guides</span> and tutorials</li>
  <li>Modern <span class="font-medium">layout techniques</span> (Flexbox, Grid)</li>
  <li>Practical <span class="font-medium">JavaScript</span> solutions for UI</li>
  <li>Comprehensive <span class="font-medium">accessibility</span> guides</li>
  <li>Performance <span class="font-medium">optimization</span> strategies</li>
  <li>Cutting-edge <span class="font-medium">design system</span> approaches</li>
  </ul>
  </div>

  <div class="bg-headerBg p-4 rounded-lg">
  <h3 class="font-semibold text-lg mb-2 text-purple">Resources</h3>
  <p>The famous CSS-Tricks Almanac provides quick reference for all CSS properties with examples and browser support data.</p>
  </div>
  </div>
  `,
        tags: ["CSS", "frontend", "design", "tutorials"],
    },
];

let minimizedCards = [];
let darkMode = localStorage.getItem('darkMode') === 'true';

if (darkMode) {
  document.documentElement.classList.add('dark');
  darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

darkModeToggle.addEventListener('click', () => {
  darkMode = !darkMode;
  localStorage.setItem('darkMode', darkMode);
  document.documentElement.classList.toggle('dark');
  darkModeToggle.innerHTML = darkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  showToast(darkMode ? 'Dark mode enabled' : 'Dark mode disabled');
});

function showToast(message, undoAction = null) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas fa-check-circle toast-icon"></i>
      <span>${message}</span>
    </div>
    ${undoAction ? '<div class="toast-actions"><button class="toast-btn toast-btn-undo">Undo</button><button class="toast-btn">Dismiss</button></div>' : '<button class="toast-btn">Dismiss</button>'}
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  const dismissBtn = toast.querySelector('.toast-btn:not(.toast-btn-undo)');
  dismissBtn.addEventListener('click', () => {
    hideToast(toast);
  });

  if (undoAction) {
    const undoBtn = toast.querySelector('.toast-btn-undo');
    undoBtn.addEventListener('click', () => {
      undoAction();
      hideToast(toast);
    });
  }

  setTimeout(() => {
    if (toast.parentNode) {
      hideToast(toast);
    }
  }, 5000);
}

function hideToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => {
    toast.remove();
  }, 300);
}








const tooltips = new Set();

function cleanupTooltips() {
    document.querySelectorAll(".tooltip").forEach((tooltip) => {
        if (!tooltips.has(tooltip)) {
            tooltip.remove();
        }
    });
}

function createTooltip(element, text, position = 'top') {
    const tooltip = document.createElement('div');
    tooltip.className = `tooltip tooltip-${position}`;
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    tooltips.add(tooltip);

    const showTooltip = () => {
        if (!document.body.contains(element)) return;
        tooltip.style.opacity = '1';
        updatePosition();
    };

    const hideTooltip = () => {
        tooltip.style.opacity = '0';
    };

    const updatePosition = () => {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        switch (position) {
            case 'top':
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
                break;
            case 'bottom':
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                tooltip.style.top = `${rect.bottom + 8}px`;
                break;
            case 'left':
                tooltip.style.left = `${rect.left - tooltipRect.width - 8}px`;
                tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                break;
            case 'right':
                tooltip.style.left = `${rect.right + 8}px`;
                tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                break;
        }
    };

    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
    element.addEventListener('mousemove', updatePosition);

    return {
        destroy: () => {
            element.removeEventListener('mouseenter', showTooltip);
            element.removeEventListener('mouseleave', hideTooltip);
            element.removeEventListener('mousemove', updatePosition);
            if (document.body.contains(tooltip)) {
                tooltip.remove();
            }
            tooltips.delete(tooltip);
        }
    };
}

document.addEventListener("click", (e) => {
    if (!e.target.closest(".action-btn")) cleanupTooltips();
});
window.addEventListener("blur", cleanupTooltips);
window.addEventListener("resize", cleanupTooltips);


function minimizeCard(card) {
  const cardId = card.dataset.cardId;
  const cardData = typeof cardsData !== "undefined" ? cardsData.find((c) => c.id === cardId) : null;
  if (!cardData) return;

  cleanupTooltips();

  if (isAnimating && card.dataset.state !== "minimized") return;

  if (card.dataset.state === "minimized") {
    const originalCard = document.getElementById(`card-${cardId}`);
    if (originalCard) {
      originalCard.classList.remove("card-minimized");
      originalCard.dataset.state = "collapsed";
    }
    const minimizedCardElement = document.getElementById(`minimized-${cardId}`);
    if (minimizedCardElement) minimizedCardElement.remove();

    if (minimizedCardsGrid.children.length === 0) {
      minimizedCardsContainer.classList.add("hidden");
    }
  } else {
    const performMinimize = () => {
      card.dataset.state = "minimized";
      card.classList.add("card-minimized");
      minimizedCardsContainer.classList.remove("hidden");

      const minimizedCard = document.createElement("div");
      minimizedCard.className = "minimized-card bg-bgSections p-3 rounded-lg border border-borderPrimary flex items-center justify-between hover:bg-headerBg transition-colors";
      minimizedCard.id = `minimized-${cardId}`;

      minimizedCard.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="${cardData.bannerColor} w-10 h-10 rounded-lg flex items-center justify-center text-white">
            <i class="${cardData.icon} text-lg"></i>
          </div>
          <div>
            <div class="font-medium">${cardData.title}</div>
            <div class="text-xs text-textSecondary truncate max-w-xs">${cardData.description}</div>
          </div>
        </div>
        <button class="action-btn text-textSecondary hover:text-green transition-colors restore-btn">
          <i class="fas fa-window-restore"></i>
        </button>
      `;

      const restoreBtn = minimizedCard.querySelector('.restore-btn');
      const tooltipInstance = createTooltip(restoreBtn, 'Restore card', 'top');

      restoreBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        tooltipInstance.destroy();
        minimizeCard(card);
      });

      minimizedCardsGrid.appendChild(minimizedCard);
    };

    if (card.dataset.state === "expanded") {
      collapseCard(card)
        .then(() => {
          if (card.dataset.state === "collapsed") {
            performMinimize();
          }
        });
    } else {
      performMinimize();
    }
  }
}

function waitForEvent(element, eventName, timeout) {
  return new Promise((resolve) => {
    let timeoutId;
    const eventListener = () => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve("event");
    };
    element.addEventListener(eventName, eventListener, {
      once: true,
    });
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        element.removeEventListener(eventName, eventListener);
        resolve("timeout");
      }, timeout);
    }
  });
}

function createCard(data) {
  const card = document.createElement("div");
  card.className = `card bg-bgSections rounded-xl shadow-sm overflow-hidden border border-borderPrimary relative transition-all duration-500 cursor-pointer`;
  card.id = `card-${data.id}`;
  card.dataset.cardId = data.id;
  card.dataset.state = "collapsed";

  const banner = document.createElement("div");
  banner.className = `banner ${data.bannerColor} h-full flex items-center justify-center text-white text-5xl transition-all duration-500`;
  banner.innerHTML = `<i class="${data.icon}" style="opacity: 0.65; position: absolute; top: 1rem; left: 1rem; padding: 1rem;"></i>`;

  const header = document.createElement("div");
  header.className = "card-header-element header-hidden absolute top-0 left-0 right-0 bg-headerBg px-4 py-3 flex justify-between items-center border-b border-borderPrimary z-20";

  const title = document.createElement("h3");
  title.className = "font-semibold truncate text-lg";
  title.textContent = data.title;

  const actions = document.createElement("div");
  actions.className = "actionIcons flex space-x-3";

  const minimizeBtn = document.createElement("div");
  minimizeBtn.className = "action action-btn";
  minimizeBtn.innerHTML = `
    <svg class="global medium trashCan" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
      <path d="M163.8 0L284.2 0c12.1 0 23.2 6.8 28.6 17.7L320 32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 7.2-14.3C140.6 6.8 151.7 0 163.8 0zM32 128l384 0 0 320c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-320zM337 265c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L337 265z"/>
    </svg>
  `;

  const closeBtn = document.createElement("button");
  closeBtn.className = "action action-btn text-textSecondary hover:text-red-500 transition-colors";
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';

  const externalBtn = document.createElement("button");
  externalBtn.className = "action action-btn text-textSecondary hover:text-blue transition-colors";
  externalBtn.innerHTML = '<i class="fas fa-external-link-alt"></i>';

  actions.appendChild(minimizeBtn);
  actions.appendChild(closeBtn);
  actions.appendChild(externalBtn);
  header.appendChild(title);
  header.appendChild(actions);

  const content = document.createElement("div");
  content.className = "card-summary-content absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-all duration-300";
  content.innerHTML = `
    <svg class="global darkGray large opaqueMD icon-beat-fade" style="justify-self: center; --beat-fade-opacity: 0.67; --beat-fade-scale: 0.825; --beat-fade-duration: 1.5s;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
      <path class="fa-secondary" d="M0 384c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32zM89.4 153.4c-12.5 12.5-12.5 32.8 0 45.3l64 64c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-64-64c-12.5-12.5-32.8-12.5-45.3 0zM288 96l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32zM441.4 217.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-64 64zM512 384c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32 14.3-32 32z"/>
      <path class="fa-primary" d="M192 384c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-192 0c-17.7 0-32-14.3-32-32z"/>
    </svg>
    <p class="text-white text-sm font-medium">${data.description}</p>
    <div class="flex flex-wrap gap-2 mt-2">
      ${data.tags.map(tag => `<span class="tag bg-tagBg text-tagText text-xs px-2 py-1 rounded">${tag}</span>`).join('')}
    </div>
  `;

  const detailsContainer = document.createElement("div");
  detailsContainer.className = "details-container absolute bottom-0 left-0 right-0";
  detailsContainer.innerHTML = data.details;

  card.appendChild(banner);
  card.appendChild(header);
  card.appendChild(content);
  card.appendChild(detailsContainer);

  createTooltip(minimizeBtn, 'Minimize card', 'top');
  createTooltip(closeBtn, 'Close card', 'top');
  createTooltip(externalBtn, 'Open in new tab', 'top');

  minimizeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const cardId = card.dataset.cardId;
    minimizedCards.push(cardId);
    minimizeCard(card);
    showToast('Card minimized', () => {
      minimizedCards = minimizedCards.filter(id => id !== cardId);
      minimizeCard(card);
    });
  });

  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (card.dataset.state === "expanded" && !isAnimating) {
      collapseCard(card);
    }
  });

  externalBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    window.open(data.url, "_blank");
  });

  card.addEventListener("click", () => {
    if (isAnimating) return;
    if (card.dataset.state === "collapsed") {
      expandCard(card);
    }
  });

  return card;
}

async function expandCard(card) {
  if (!card || card.dataset.state !== "collapsed" || isAnimating) return;

  isAnimating = true;
  card.dataset.state = "expanding";

  try {
    const currentlyExpanded = cardsContainer.querySelector('[data-state="expanded"]');
    if (currentlyExpanded && currentlyExpanded !== card) {
      await collapseCard(currentlyExpanded);
    }

    if (card.dataset.state !== "expanding") {
      isAnimating = false;
      return;
    }

    const header = card.querySelector(".card-header-element");
    const banner = card.querySelector(".banner");
    const summaryContent = card.querySelector(".card-summary-content");
    const detailsContainer = card.querySelector(".details-container");

    card.classList.add("card-expanded");

    header.classList.remove("header-hidden");
    header.classList.remove("slide-header-up");
    header.classList.add("slide-header-down");

    banner.classList.add("banner-expanded");
    summaryContent.classList.add("fluid-disappear");

    await waitForEvent(header, "animationend", 300);

    if (card.dataset.state !== "expanding") {
      isAnimating = false;
      return;
    }

    if (detailsContainer) {
      detailsContainer.classList.add("expanded");
      detailsContainer.scrollTop = 0;
    }
    card.dataset.state = "expanded";

    setTimeout(() => {
      if (card.dataset.state === "expanded") {
        card.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }, 50);
  } catch (error) {
    card.dataset.state = "collapsed";
    card.classList.remove("card-expanded", "card-expanding");
    const header = card.querySelector(".card-header-element");
    if (header) {
      header.classList.add("header-hidden");
      header.classList.remove("slide-header-down", "slide-header-up");
    }
    const banner = card.querySelector(".banner");
    if (banner) banner.classList.remove("banner-expanded");
    const summaryContent = card.querySelector(".card-summary-content");
    if (summaryContent) summaryContent.classList.remove("fluid-disappear");
    const detailsContainer = card.querySelector(".details-container");
    if (detailsContainer) {
      detailsContainer.classList.remove("expanded");
      detailsContainer.scrollTop = 0;
    }
  } finally {
    isAnimating = false;
  }
}

async function collapseCard(card) {
  if (!card || card.dataset.state !== "expanded" || isAnimating) return;

  isAnimating = true;
  card.dataset.state = "collapsing";

  try {
    const header = card.querySelector(".card-header-element");
    const banner = card.querySelector(".banner");
    const summaryContent = card.querySelector(".card-summary-content");
    const detailsContainer = card.querySelector(".details-container");

    if (detailsContainer) {
      detailsContainer.classList.remove("expanded");
    }
    header.classList.remove("slide-header-down");
    header.classList.add("slide-header-up");
    banner.classList.remove("banner-expanded");
    summaryContent.classList.remove("fluid-disappear");
    summaryContent.classList.add("fluid-appear");

    await Promise.all([waitForEvent(detailsContainer, "transitionend", 500), waitForEvent(header, "animationend", 300)]);

    if (card.dataset.state !== "collapsing") {
      isAnimating = false;
      return;
    }

    header.classList.add("header-hidden");
    header.classList.remove("slide-header-up");
    summaryContent.classList.remove("fluid-appear");
    card.classList.remove("card-expanded");
    card.dataset.state = "collapsed";
    if (detailsContainer) {
      detailsContainer.scrollTop = 0;
    }
  } catch (error) {
    card.dataset.state = "collapsed";
    card.classList.remove("card-expanded", "card-collapsing");
    const header = card.querySelector(".card-header-element");
    if (header) {
      header.classList.add("header-hidden");
      header.classList.remove("slide-header-down", "slide-header-up");
    }
    const banner = card.querySelector(".banner");
    if (banner) banner.classList.remove("banner-expanded");
    const summaryContent = card.querySelector(".card-summary-content");
    if (summaryContent) {
      summaryContent.classList.remove("fluid-disappear", "fluid-appear");
    }
    const detailsContainer = card.querySelector(".details-container");
    if (detailsContainer) {
      detailsContainer.classList.remove("expanded");
      detailsContainer.scrollTop = 0;
    }
  } finally {
    isAnimating = false;
  }
}


if (typeof cardsData !== "undefined" && Array.isArray(cardsData)) {
  cardsData.forEach((cardData) => {
    if (cardsContainer) {
      cardsContainer.appendChild(createCard(cardData));
    }
  });
}



document.addEventListener("DOMContentLoaded", () => {
    contactTriggerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        contactWidgetContainer.classList.toggle("open");
        contactFormContainer.classList.toggle("active");
        if (contactFormContainer.classList.contains("active")) {
            contactFormElement.elements[0]?.focus();
        }
    });

    contactFormElement.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(contactFormElement);
        const name = formData.get("name");
        showToast(`Thanks, ${name}! Message sent.`, null, "success");
        contactFormElement.reset();
        contactWidgetContainer.classList.remove("open");
        contactFormContainer.classList.remove("active");
    });

    document.addEventListener("click", (e) => {
        if (contactFormContainer.classList.contains("active") && !contactWidgetContainer.contains(e.target)) {
            contactWidgetContainer.classList.remove("open");
            contactFormContainer.classList.remove("active");
        }
    });




});
