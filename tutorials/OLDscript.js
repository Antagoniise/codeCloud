import { tutorials } from './tutorials.js';


const $tutorialsGrid = $("#tutorials-grid");
const $loadingIndicator = $("#loading-indicator");
const $loadMoreContainer = $("#load-more-container");
const $loadMoreBtn = $("#load-more-btn");
const TUTORIALS_PER_PAGE = 5;
let currentPage = 0;

const $overlay = $("#offCanvasOverlay");
const $tutorialViewer = $("#tutorial-viewer");
const $tutorialTitle = $("#tutorial-title");
const $tutorialContent = $("#tutorial-content");

const $codeModal = $("#code-modal");
const $expandedCode = $("#expanded-code");


// UTILITIES /////////////////////////////////////////////////
function formatDate(timestamp) {
  if (!timestamp) return "Unknown date";
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function formatMarkdown(text) {
  return text
    .replace(/^# (.*$)/gm, '<h3 class="text-xl font-bold mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h4 class="text-lg font-semibold mb-2">$1</h4>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>')
    .replace(/\n/g, "<br>");
}
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function animateElement(el, animation) {
  return new Promise((resolve) => {
    const $el = $(el);
    $el.removeClass("animate__bounceOutDown animate__bounceInUp animate__animated").addClass(`animate__animated animate__${animation}`);

    function handleEnd() {
      $el.removeClass(`animate__animated animate__${animation}`);
      $el.off("animationend", handleEnd);
      resolve();
    }

    $el.on("animationend", handleEnd);
  });
}


async function openTutorial(tutorial) {
  $tutorialTitle.text(tutorial.title);
  $tutorialContent.empty();

  tutorial.steps.forEach((step) => {
    const html = `
      <div class="tutorial-step">
        <div class="step-description prose prose-invert max-w-none">
          ${formatMarkdown(step.description)}
        </div>
        ${step.code
          .map(
            (code) => `
          <div class="code-block mb-6">
            <div class="code-header">
              <span class="code-language">${code.language.toUpperCase()}</span>
              <button class="expand-code expand-code-btn">
                <svg class="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4">
                  </path>
                </svg>
                Expand
              </button>
            </div>
            <pre class="language-${code.language} max-h-96 overflow-y-auto">
              <code class="language-${code.language}">${escapeHtml(code.content)}</code>
            </pre>
          </div>
        `
          )
          .join("")}
      </div>`;
    $tutorialContent.append(html);
  });

  Prism.highlightAllUnder($tutorialContent[0]);

  $tutorialViewer.removeClass("hide").css("visibility", "visible");
  $overlay.addClass("active");

  await animateElement($tutorialViewer, "bounceInUp");
  $tutorialViewer.addClass("open");
  
  $('body').addClass('no-scroll');
}

async function closeOffcanvas() {
  if (!$tutorialViewer.hasClass("open")) return;
  $overlay.removeClass("active");

  await animateElement($tutorialViewer, "bounceOutDown");

  $tutorialViewer.removeClass("open").addClass("hide").css({
    visibility: "hidden",
    transform: "translateY(0)",
  });
  
  $('body').removeClass('no-scroll');
  $tutorialViewer.scrollTop(0);
}
async function closeOffcanvasByHandle() {
  if (!$tutorialViewer.hasClass("open")) return;
  $overlay.removeClass("active");

  await animateElement($tutorialViewer, "fadeOutDown");

  $tutorialViewer.removeClass("open").addClass("hide").css({
    visibility: "hidden",
    transform: "translateY(0)",
  });
  
  $('body').removeClass('no-scroll');
  $tutorialViewer.scrollTop(0);
}

$(document).on("click", ".hs-offcanvas-close", closeOffcanvas);

$(document).on("click", function (e) {
  if ($tutorialViewer.hasClass("open") && !$(e.target).closest("#tutorial-viewer").length && !$(e.target).hasClass("tutorial-card")) {
    closeOffcanvas();
  }
});
$(document).on("click", function (e) {
  if ($tutorialViewer.hasClass("open") && !$(e.target).closest("#tutorial-viewer").length && !$(e.target).hasClass("tutorial-card")) {
    closeOffcanvas();
  }
});
$(document).on("click", (e) => {
  if ($tutorialViewer.hasClass("open") && !$(e.target).closest("#tutorial-viewer").length && !$(e.target).hasClass("tutorial-card")) {
    closeOffcanvas();
  }
});


$(document).on("click", ".expand-code-btn", function () {
  const $codeBlock = $(this).closest(".code-block").find("pre").clone();
  $codeBlock.removeClass("max-h-96");
  $expandedCode.html($codeBlock.html());
  $codeModal.removeClass("hidden");
  Prism.highlightAllUnder($expandedCode[0]);
});

$("#close-code-modal").on("click", () => {
  $codeModal.addClass("hidden");
});

$(".hs-offcanvas-close").on("click", closeOffcanvas);



$(document).ready(() => {
  loadTutorials();
  $loadMoreBtn.on("click", loadMoreTutorials);
});

// DOCUMENT READY ///////////////////////////////////////////
$(document).ready(() => {
  loadTutorials();

  $loadMoreBtn.on("click", loadMoreTutorials);

  // Code modal handling
  $(document).on("click", ".expand-code-btn", function () {
    const $codeBlock = $(this).closest(".code-block").find("pre").clone();
    $codeBlock.removeClass("max-h-96");
    $expandedCode.html($codeBlock.html());
    $codeModal.removeClass("hidden");
    Prism.highlightAllUnder($expandedCode[0]);
  });

  $("#close-code-modal").on("click", () => {
    $codeModal.addClass("hidden");
  });
});

// PAGE STRUCTURE ///////////////////////////////////////////
function loadTutorials() {
  $loadingIndicator.show();

  // Simulate loading (remove in production)
  setTimeout(() => {
    renderTutorialsPage();
    $loadingIndicator.hide();
  }, 500);
}

function loadMoreTutorials() {
  currentPage++;
  renderTutorialsPage();
}

function renderTutorialsPage() {
  const startIdx = currentPage * TUTORIALS_PER_PAGE;
  const endIdx = startIdx + TUTORIALS_PER_PAGE;
  const tutorialsToRender = tutorials.slice(startIdx, endIdx);

  if (tutorialsToRender.length === 0) {
    $loadMoreContainer.hide();
    return;
  }

  if (currentPage === 0) {
    $tutorialsGrid.empty();
  }

  tutorialsToRender.forEach((tutorial, idx) => {
    const delay = idx * 50;
    const $card = createTutorialCard(tutorial);
    $card.css("animation-delay", `${delay}ms`).addClass("animate-fade-in");

    // Add click handler
    $card.on("click", () => {
      openTutorial(tutorial);
    });

    $tutorialsGrid.append($card);
  });

  $loadMoreContainer.toggle(endIdx < tutorials.length);
}

function createTutorialCard(tutorial) {
  const previewText = tutorial.steps[0]?.description.replace(/#+/g, "").substring(0, 100) || "Tutorial content";
  const stepCount = tutorial.steps.length;

  return $(`
    <div class="tutorial-card group cursor-pointer" data-id="${tutorial.id}">
      <div class="cardItem h-full rounded-xl border border-slate-700 overflow-hidden transition-all duration-300 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10">
        <div class="p-5">
          <div class="flex justify-between items-start mb-3">
            <h3 class="font-bold text-white truncate">${tutorial.title}</h3>
            <span class="text-xs text-slate-400 whitespace-nowrap ml-2">
              ${formatDate(tutorial.created)}
            </span>
          </div>
          <p class="text-slate-400 text-sm line-clamp-2">${previewText}</p>
          <div class="mt-2 text-xs text-blue-400">
            ${stepCount} ${stepCount === 1 ? "step" : "steps"} • Click to view tutorial
          </div>
        </div>
      </div>
    </div>
  `);
}

let startY = 0;
let currentY = 0;
let isDragging = false;
const threshold = 120; // px drag before closing

const $viewer = $("#tutorial-viewer");

function onDragStart(e) {
  isDragging = true;
  startY = e.touches ? e.touches[0].clientY : e.clientY;
  $viewer.css("transition", "none");
}

function onDragMove(e) {
  if (!isDragging) return;
  currentY = (e.touches ? e.touches[0].clientY : e.clientY) - startY;

  if (currentY > 0) {
    $viewer.css("transform", `translateY(${currentY}px)`);
  }
}

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;

  $viewer.css("transition", "transform 0.3s ease");

  if (currentY > threshold) {
    closeOffcanvasByHandle();
  } else {
    $viewer.css("transform", "translateY(0)");
  }

  currentY = 0;
}

$("#offcanvas-handle").on("touchstart mousedown", onDragStart);
$(document).on("touchmove mousemove", onDragMove);
$(document).on("touchend mouseup", onDragEnd);