import { tutorials } from './tutorials.js';

// =============================================================================
// CONSTANTS & GLOBAL VARIABLES
// =============================================================================
const TUTORIALS_PER_PAGE = 5;
const DRAG_THRESHOLD = 120; // px drag before closing

let currentPage = 0;
let startY = 0;
let currentY = 0;
let isDragging = false;
let currentTutorial = null;
let currentStepIndex = 0;

// =============================================================================
// DOM ELEMENT REFERENCES
// =============================================================================
const $tutorialsGrid = $("#tutorials-grid");
const $loadingIndicator = $("#loading-indicator");
const $loadMoreContainer = $("#load-more-container");
const $loadMoreBtn = $("#load-more-btn");

const $overlay = $("#offCanvasOverlay");
const $tutorialViewer = $("#tutorial-viewer");
const $tutorialTitle = $("#tutorial-title");
const $tutorialContent = $("#tutorial-content");
const $stepDots = $(".step-dots");
const $prevStepBtn = $("#prev-step");
const $nextStepBtn = $("#next-step");

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
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
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function animateElement(el, animation) {
  return new Promise((resolve) => {
    const $el = $(el);
    $el.removeClass("animate__bounceOutDown animate__bounceInUp animate__animated")
       .addClass(`animate__animated animate__${animation}`);

    function handleEnd() {
      $el.removeClass(`animate__animated animate__${animation}`);
      $el.off("animationend", handleEnd);
      resolve();
    }

    $el.on("animationend", handleEnd);
  });
}

// =============================================================================
// TUTORIAL CARD CREATION
// =============================================================================
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

// =============================================================================
// TUTORIAL RENDERING & PAGINATION
// =============================================================================
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
    
    $card.css("animation-delay", `${delay}ms`)
         .addClass("animate-fade-in")
         .on("click", () => openTutorial(tutorial));

    $tutorialsGrid.append($card);
  });

  $loadMoreContainer.toggle(endIdx < tutorials.length);
}

// =============================================================================
// TUTORIAL VIEWER (OFFCANVAS) FUNCTIONALITY
// =============================================================================
async function openTutorial(tutorial) {
  currentTutorial = tutorial;
  currentStepIndex = 0;
  
  $tutorialTitle.text(tutorial.title);
  renderCurrentStep();
  
  // Open the viewer
  $tutorialViewer.removeClass("hide").css("visibility", "visible");
  $overlay.addClass("active");

  await animateElement($tutorialViewer, "bounceInUp");
  $tutorialViewer.addClass("open");
  $('body').addClass('no-scroll');
  $overlay.addClass('no-scroll');
  
  // Initialize tooltips for step dots
  tippy('[data-tippy-content]', {
    placement: 'top',
    theme: 'dark',
    animation: 'shift-away',
    arrow: true
  });
}

function renderCurrentStep() {
  if (!currentTutorial || !currentTutorial.steps[currentStepIndex]) return;

  const step = currentTutorial.steps[currentStepIndex];
  $tutorialContent.empty();

  // Render step description
  const descriptionHtml = `
    <div class="tutorial-step">
      <div class="step-description prose prose-invert max-w-none">
        ${formatMarkdown(step.description)}
      </div>
    </div>
  `;
  $tutorialContent.append(descriptionHtml);

  // Render code blocks if they exist
  if (step.code && step.code.length > 0) {
    step.code.forEach((codeBlock, index) => {
const codeHtml = `
<div class="codeBlockWrapper">
  <div class="code-block" data-code-index="${index}">
    <span class="code-language">${codeBlock.language}</span>
    <pre class="language-${codeBlock.language}">
      <code class="language-${codeBlock.language}">${escapeHtml(codeBlock.content)}</code>
    </pre>
  </div>
  <div class="expandBtnWrapper">
<button class="code-expand-btn">
  <span>Expand</span>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
  </svg>
</button>
  </div>
</div>
`;
      $tutorialContent.append(codeHtml);
    });
  }

  // Update navigation
  updateStepNavigation();

  // Highlight code
  Prism.highlightAllUnder($tutorialContent[0]);
}

function updateStepNavigation() {
  $stepDots.empty();
  
  // Create step dots
  currentTutorial.steps.forEach((_, index) => {
    const dot = $(`
      <div class="step-dot ${index === currentStepIndex ? 'active' : ''}" 
           data-step-index="${index}"
           data-tippy-content="Step ${index + 1}"></div>
    `);
    $stepDots.append(dot);
  });

  // Update arrow buttons
  $prevStepBtn.prop('disabled', currentStepIndex === 0);
  $nextStepBtn.prop('disabled', currentStepIndex === currentTutorial.steps.length - 1);
}

function goToStep(index) {
  if (index < 0 || index >= currentTutorial.steps.length) return;
  
  currentStepIndex = index;
  renderCurrentStep();
}




function toggleCodeBlock($block) {
  const wasExpanded = $block.hasClass('expanded');
  
  // Reset scroll position if we're about to collapse
  if (wasExpanded) {
    $block.scrollTop(0);
  }
  
  $block.toggleClass('expanded');
  
  // If we just collapsed, scroll the wrapper into view
  if (wasExpanded && !$block.hasClass('expanded')) {
    $block.closest('.codeBlockWrapper')[0].scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  }
}




async function closeOffcanvas() {
  if (!$tutorialViewer.hasClass("open")) return;
  
  $overlay.removeClass("active");
  await animateElement($tutorialViewer, "bounceOutDown");
  
  $tutorialViewer.removeClass("open")
                 .addClass("hide")
                 .css({
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
  
  $tutorialViewer.removeClass("open")
                 .addClass("hide")
                 .css({
                   visibility: "hidden",
                   transform: "translateY(0)",
                 });
  
  $('body').removeClass('no-scroll');
  $tutorialViewer.scrollTop(0);
}

// =============================================================================
// DRAG TO CLOSE FUNCTIONALITY
// =============================================================================
function onDragStart(e) {
  isDragging = true;
  startY = e.touches ? e.touches[0].clientY : e.clientY;
  $tutorialViewer.css("transition", "none");
}

function onDragMove(e) {
  if (!isDragging) return;
  
  currentY = (e.touches ? e.touches[0].clientY : e.clientY) - startY;

  if (currentY > 0) {
    $tutorialViewer.css("transform", `translateY(${currentY}px)`);
  }
}

function onDragEnd() {
  if (!isDragging) return;
  
  isDragging = false;
  $tutorialViewer.css("transition", "transform 0.3s ease");

  if (currentY > DRAG_THRESHOLD) {
    closeOffcanvasByHandle();
  } else {
    $tutorialViewer.css("transform", "translateY(0)");
  }

  currentY = 0;
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================
function handleOutsideClick(e) {
  const $target = $(e.target);

  if ($tutorialViewer.hasClass("open") && 
      !$target.closest("#tutorial-viewer").length && 
      !$target.hasClass("tutorial-card")) {
    closeOffcanvas();
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================
$(document).ready(() => {
  // Initialize tutorials
  loadTutorials();
  
  // Load more button
  $loadMoreBtn.on("click", loadMoreTutorials);
  
  // Offcanvas close buttons
  $(document).on("click", ".hs-offcanvas-close", closeOffcanvas);
  
  // Outside click to close
  $(document).on("click", handleOutsideClick);
  
  // Step navigation
  $prevStepBtn.on("click", () => goToStep(currentStepIndex - 1));
  $nextStepBtn.on("click", () => goToStep(currentStepIndex + 1));
  
  // Step dots navigation
  $(document).on("click", ".step-dot", function() {
    e.stopPropagation();
    const stepIndex = $(this).data("step-index");
    goToStep(stepIndex);
  });
  
// Code block expand/collapse
$(document).on("click", ".code-expand-btn", function(e) {
  e.stopPropagation();
  const $btn = $(this);
  const $wrapper = $btn.closest('.codeBlockWrapper');
  const $block = $wrapper.find('.code-block');
  toggleCodeBlock($block);
  
  // Update button text immediately
  $btn.find('span').text($block.hasClass('expanded') ? 'Collapse' : 'Expand');
});
  
  // Drag to close OffCanvas
  $("#offcanvas-handle").on("touchstart mousedown", onDragStart);
  $(document).on("touchmove mousemove", onDragMove);
  $(document).on("touchend mouseup", onDragEnd);
});