const LANGUAGE_OPTIONS = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'python', name: 'Python' },
  { id: 'php', name: 'PHP' },
  { id: 'java', name: 'Java' },
  { id: 'csharp', name: 'C#' },
  { id: 'cpp', name: 'C++' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'swift', name: 'Swift' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'bash', name: 'Bash' },
  { id: 'sql', name: 'SQL' },
  { id: 'json', name: 'JSON' },
  { id: 'xml', name: 'XML' },
  { id: 'markdown', name: 'Markdown' },
  { id: 'yaml', name: 'YAML' },
  { id: 'go', name: 'Go' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'rust', name: 'Rust' }
];

let snippetsData = [];

document.addEventListener("DOMContentLoaded", function () {
  hljs.highlightAll();
  siteTheme();
  setupTabs();
  setupCopyButtons();
  loadSnippets();
  document.getElementById('newSnippetBtn').addEventListener('click', createNewSnippetUI);
});

function siteTheme() {
  const themeToggle = document.querySelector(".theme-toggle");
  const moonIcon = document.getElementById("moon-icon");
  const sunIcon = document.getElementById("sun-icon");

  if (!themeToggle || !moonIcon || !sunIcon) return;
  
  themeToggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    document.documentElement.classList.toggle("light");

    const isDark = document.documentElement.classList.contains("dark");
    moonIcon.style.display = isDark ? "block" : "none";
    sunIcon.style.display = isDark ? "none" : "block";

    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  });

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    moonIcon.style.display = "none";
    sunIcon.style.display = "block";
  }
}

function setupTabs() {
  document.querySelectorAll(".code-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      if (tab.hasAttribute('data-no-click')) return;
      
      const tabsContainer = tab.closest(".code-tabs");
      const codeDisplay = tab.closest(".code-display");
      const targetId = tab.getAttribute("data-target");
      const targetPanel = codeDisplay.querySelector("#" + targetId);

      if (!targetPanel || tab.classList.contains("active")) return;

      tabsContainer.querySelectorAll(".code-tab").forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });

      codeDisplay.querySelectorAll(".code-panel").forEach((p) => {
        p.classList.remove("active");
        p.style.opacity = "0";
      });

      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      targetPanel.classList.add("active");
      targetPanel.style.opacity = "1";
    });
  });
}

function setupCopyButtons() {
  document.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", () => {
      const codeElement = button.closest(".code-content").querySelector("code");
      if (!codeElement) return;

      navigator.clipboard.writeText(codeElement.textContent.trim())
        .then(() => {
          button.classList.add("copied");
          setTimeout(() => button.classList.remove("copied"), 2000);
        })
        .catch((err) => console.error("Failed to copy:", err));
    });
  });
}

function createNewSnippetUI() {
  const snippetId = 'snippet-' + Date.now();
  const snippetContainer = document.getElementById('snippetContainer');
  
  const displayTemplate = document.getElementById('code-display-template');
  const codeDisplay = displayTemplate.content.cloneNode(true).children[0];
  codeDisplay.id = snippetId;
  codeDisplay.setAttribute('data-creating', 'true');
  
  const titleWrapper = document.createElement('div');
  titleWrapper.className = 'code-title-wrapper';
  
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'code-title-input';
  titleInput.placeholder = 'Enter snippet title...';
  
  const controls = document.createElement('div');
  controls.className = 'snippet-controls';
  
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-snippet-btn';
  saveBtn.textContent = 'Save';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel-snippet-btn';
  cancelBtn.textContent = 'Cancel';
  
  controls.appendChild(saveBtn);
  controls.appendChild(cancelBtn);
  titleWrapper.appendChild(titleInput);
  titleWrapper.appendChild(controls);
  
  const header = codeDisplay.querySelector('.code-header');
  const originalTitle = header.querySelector('.code-title');
  header.insertBefore(titleWrapper, originalTitle);
  header.removeChild(originalTitle);
  
  const tabsContainer = codeDisplay.querySelector('.code-tabs');
  const panelsContainer = codeDisplay.querySelector('.code-panels');
  
  createNewEditableTab(snippetId, tabsContainer, panelsContainer, true);
  
  snippetContainer.prepend(codeDisplay);
  
  saveBtn.addEventListener('click', () => {
    saveSnippet(snippetId, titleInput.value, tabsContainer, panelsContainer);
  });
  
  cancelBtn.addEventListener('click', () => {
    codeDisplay.style.opacity = '0';
    setTimeout(() => codeDisplay.remove(), 300);
  });
}

function createNewEditableTab(snippetId, tabsContainer, panelsContainer, isActive = false) {
  if (tabsContainer.children.length >= 4) return;

  const tabId = 'tab-' + Date.now();
  const panelId = 'panel-' + Date.now();

  const tabTemplate = document.getElementById('code-tab-template');
  const tab = tabTemplate.content.cloneNode(true).children[0];
  tab.setAttribute('data-target', panelId);
  tab.style.cursor = 'default';
  tab.dataset.hasLanguage = 'false';

  if (isActive) {
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
  }

  const dropdownContainer = document.createElement('div');
  dropdownContainer.className = 'language-dropdown-container';

  const dropdownBtn = document.createElement('button');
  dropdownBtn.className = 'language-dropdown-btn';
  dropdownBtn.textContent = 'Select Language';
  dropdownBtn.dataset.languageId = '';

  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'language-dropdown-menu';
  dropdownMenu.style.display = 'none';

  dropdownBtn.addEventListener('click', function(e) {
    if (dropdownMenu.style.display !== 'block') {
      e.stopPropagation();
    }
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
  });

  dropdownMenu.addEventListener('click', function(e) {
    e.stopPropagation();
  });

  LANGUAGE_OPTIONS.forEach(lang => {
    const langOption = document.createElement('div');
    langOption.className = 'language-option';
    langOption.textContent = lang.name;
    langOption.dataset.id = lang.id;

    langOption.addEventListener('click', function() {
      dropdownBtn.textContent = lang.name;
      dropdownBtn.dataset.languageId = lang.id;
      tab.dataset.hasLanguage = 'true';
      tab.textContent = lang.name;
      dropdownMenu.style.display = 'none';
      
      const panel = document.getElementById(panelId);
      if (panel) {
        const codeBlock = panel.querySelector('code');
        if (codeBlock) {
          codeBlock.className = `language-${lang.id}`;
          if (hljs.getLanguage(lang.id)) {
            hljs.highlightElement(codeBlock);
          }
        }
      }
      
      tab.style.cursor = 'pointer';
      tab.onclick = function(e) {
        if (e.target !== addTabBtn) {
          setActiveTab(tab, panelId, tabsContainer, panelsContainer);
        }
      };
    });
    
    dropdownMenu.appendChild(langOption);
  });

  const addTabBtn = document.createElement('span');
  addTabBtn.className = 'add-tab-btn';
  addTabBtn.innerHTML = '+';
  addTabBtn.title = 'Add another language tab';

  addTabBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    createNewEditableTab(snippetId, tabsContainer, panelsContainer);
  });

  dropdownContainer.appendChild(dropdownBtn);
  dropdownContainer.appendChild(dropdownMenu);
  tab.appendChild(dropdownContainer);
  tab.appendChild(addTabBtn);
  tabsContainer.appendChild(tab);

  const panelTemplate = document.getElementById('code-panel-template');
  const panel = panelTemplate.content.cloneNode(true).children[0];
  panel.id = panelId;

  if (isActive) {
    panel.classList.add('active');
    panel.style.opacity = '1';
  } else {
    panel.style.opacity = '0';
  }

  const codeBlock = panel.querySelector('code');
  codeBlock.contentEditable = 'true';
  codeBlock.spellcheck = 'false';
  codeBlock.style.whiteSpace = 'pre';
  codeBlock.style.wordWrap = 'normal';
  codeBlock.style.overflowX = 'auto';

  codeBlock.addEventListener('paste', function(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });

  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        const language = codeBlock.className.replace('language-', '');
        if (language && hljs.getLanguage(language)) {
          hljs.highlightElement(codeBlock);
        }
      }
    });
  });

  observer.observe(codeBlock, { attributes: true });
  panelsContainer.appendChild(panel);

  const copyButton = panel.querySelector('.copy-button');
  if (copyButton) {
    copyButton.addEventListener('click', function() {
      const code = codeBlock.textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyButton.classList.add('copied');
        setTimeout(() => copyButton.classList.remove('copied'), 2000);
      });
    });
  }
}

function finalizeSnippet(snippetId, title, tabsContainer, panelsContainer) {
  const snippetWrapper = document.getElementById(snippetId);
  if (!snippetWrapper) return;
  
  snippetWrapper.removeAttribute('data-creating');
  
  const titleElement = document.createElement('h3');
  titleElement.className = 'code-title';
  titleElement.textContent = title;
  
  const header = snippetWrapper.querySelector('.code-header');
  const titleWrapper = header.querySelector('.code-title-wrapper');
  header.insertBefore(titleElement, titleWrapper);
  header.removeChild(titleWrapper);
  
  snippetWrapper.querySelectorAll('code').forEach(code => {
    code.contentEditable = 'false';
  });
  
  snippetWrapper.querySelectorAll('.add-tab-btn').forEach(btn => {
    btn.remove();
  });
  
  snippetWrapper.querySelectorAll('.code-tab').forEach(tab => {
    const dropdownBtn = tab.querySelector('.language-dropdown-btn');
    if (dropdownBtn) {
      tab.textContent = dropdownBtn.textContent;
      tab.style.cursor = 'pointer';
    }
  });
  
  snippetWrapper.querySelectorAll('pre code').forEach(block => {
    hljs.highlightElement(block);
  });
  
  setupTabsForSnippet(snippetWrapper);
  setupCopyButtonsForSnippet(snippetWrapper);
}

function addSnippetToLocalList(snippetData) {
  snippetsData = snippetsData.filter(s => s.id !== snippetData.id);
  snippetsData.unshift(snippetData);
}

function showSnippetInUI(snippetId) {
  const snippetContainer = document.getElementById('snippetContainer');
  const snippetElement = document.getElementById(snippetId);
  
  const existingElements = document.querySelectorAll(`#${snippetId}`);
  if (existingElements.length > 1) {
    existingElements.forEach((el, index) => {
      if (index > 0) el.remove();
    });
  }
  
  if (snippetElement && snippetContainer.firstChild !== snippetElement) {
    snippetContainer.insertBefore(snippetElement, snippetContainer.firstChild);
  }
  
  alert('Snippet saved successfully!');
}

// ... (keep all the existing code until the loadSnippets function) ...

function loadSnippets() {
  fetch('snippets.json')
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      snippetsData = Array.isArray(data) ? data : [];
      renderSnippets();
    })
    .catch(error => {
      console.error('Error loading snippets:', error);
      snippetsData = [];
    });
}

async function saveSnippet(snippetId, title, tabsContainer, panelsContainer) {
  if (!title?.trim()) {
    alert("Please enter a title for your snippet");
    return;
  }

  const languages = [];

  // Process each tab
  for (const [index, tab] of Array.from(tabsContainer.children).entries()) {
    const panel = panelsContainer.children[index];
    if (!panel) continue;

    const codeElement = panel.querySelector('code');
    if (!codeElement) continue;

    // Get raw code with perfect formatting preservation
    let rawCode = codeElement.textContent;

    // Ensure rawCode is a string
    rawCode = typeof rawCode === 'string' ? rawCode : String(rawCode);

    // Determine language
    let langId, langName;
    const dropdownBtn = tab.querySelector('.language-dropdown-btn');
    
    if (dropdownBtn?.dataset?.languageId && dropdownBtn.textContent !== 'Select Language') {
      langId = dropdownBtn.dataset.languageId;
      langName = dropdownBtn.textContent;
    } else {
      const tabText = tab.textContent.trim().replace('+', '');
      const foundLanguage = LANGUAGE_OPTIONS.find(lang => lang.name === tabText);

      if (foundLanguage) {
        langId = foundLanguage.id;
        langName = foundLanguage.name;
      } else {
        const langClassMatch = codeElement.className.match(/language-(\w+)/);
        langId = langClassMatch?.[1] || 'plaintext';
        langName = LANGUAGE_OPTIONS.find(l => l.id === langId)?.name || langId;
      }
    }

    if (rawCode?.trim() && langId) {
      languages.push({
        id: langId,
        name: langName,
        code: rawCode // Changed from rawCode to code for consistency
      });
    }
  }

  if (languages.length === 0) {
    alert("Please add at least one language with code");
    return;
  }

  const snippetData = {
    id: snippetId,
    title: title.trim(),
    languages: languages,
    createdAt: new Date().toISOString()
  };

  const saveBtn = document.querySelector(`#${snippetId} .save-snippet-btn`);
  const originalBtnText = saveBtn?.textContent;

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
  }

  try {
    const response = await fetch('save_snippets.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snippetData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Save failed');
    }

    finalizeSnippet(snippetId, title, tabsContainer, panelsContainer);
    showSnippetInUI(snippetId);
    showNotification('Snippet saved successfully', 'success');
    
    // Reload snippets after saving
    loadSnippets();
  } catch (error) {
    console.error('Save error:', error);
    showNotification(`Save failed: ${error.message}`, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalBtnText;
    }
  }
}

// ... (keep all the remaining existing functions) ...

function renderSnippets() {
  const snippetContainer = document.getElementById('snippetContainer');
  if (!snippetContainer) {
    console.error('Missing snippetContainer');
    return;
  }

  // Clear existing snippets except those being created
  Array.from(snippetContainer.children).forEach(child => {
    if (!child.hasAttribute('data-creating')) {
      child.remove();
    }
  });

  // Process snippets
  snippetsData?.forEach(snippet => {
    try {
      if (!snippet?.id) return;

      const displayTemplate = document.getElementById('code-display-template');
      if (!displayTemplate) return;

      const codeDisplay = displayTemplate.content.cloneNode(true).children[0];
      codeDisplay.id = snippet.id;

      // Set title with XSS protection
      const titleElement = codeDisplay.querySelector('.code-title');
      if (titleElement) {
        titleElement.textContent = snippet.title || 'Untitled Snippet';
      }

      // Get containers
      const tabsContainer = codeDisplay.querySelector('.code-tabs');
      const panelsContainer = codeDisplay.querySelector('.code-panels');
      if (!tabsContainer || !panelsContainer) return;

      // Process each language
      snippet.languages?.forEach((language, index) => {
        if (!language?.id) return;

        // Create tab
        const tabTemplate = document.getElementById('code-tab-template');
        if (tabTemplate) {
          const tab = tabTemplate.content.cloneNode(true).children[0];
          tab.textContent = language.name || language.id;
          tab.dataset.target = `${snippet.id}-panel-${index}`;
          
          if (index === 0) {
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
          }
          
          tabsContainer.appendChild(tab);
        }

        // Create panel with proper code formatting
        const panelTemplate = document.getElementById('code-panel-template');
        if (panelTemplate) {
          const panel = panelTemplate.content.cloneNode(true).children[0];
          panel.id = `${snippet.id}-panel-${index}`;
          
          if (index === 0) {
            panel.classList.add('active');
            panel.style.opacity = '1';
          } else {
            panel.style.opacity = '0';
          }

          const preElement = panel.querySelector('pre');
          const codeBlock = panel.querySelector('code');
          if (codeBlock && preElement) {
            // Critical: Use textContent to preserve original formatting
            codeBlock.textContent = language.code || '';
            codeBlock.className = `language-${language.id}`;
            
            // Ensure proper whitespace handling
            preElement.style.whiteSpace = 'pre';
            preElement.style.wordWrap = 'normal';
            preElement.style.overflowX = 'auto';
          }

          panelsContainer.appendChild(panel);
        }
      });

      // Add to DOM
      snippetContainer.appendChild(codeDisplay);

      // Apply syntax highlighting
      try {
        codeDisplay.querySelectorAll('pre code').forEach(block => {
          if (block.textContent.trim()) {
            hljs.highlightElement(block);
          }
        });
      } catch (err) {
        console.error('Highlighting error:', err);
      }

      // Setup interactivity
      setupTabsForSnippet(codeDisplay);
      setupCopyButtonsForSnippet(codeDisplay);

    } catch (err) {
      console.error(`Error rendering snippet ${snippet?.id}:`, err);
    }
  });
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function setupTabsForSnippet(snippetElement) {
  snippetElement.querySelectorAll('.code-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabsContainer = tab.closest('.code-tabs');
      const codeDisplay = tab.closest('.code-display');
      const targetId = tab.getAttribute('data-target');
      const targetPanel = codeDisplay.querySelector(`#${targetId}`);
      
      if (!targetPanel || tab.classList.contains('active')) return;
      
      tabsContainer.querySelectorAll('.code-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      
      codeDisplay.querySelectorAll('.code-panel').forEach(p => {
        p.classList.remove('active');
        p.style.opacity = '0';
      });
      
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      targetPanel.classList.add('active');
      targetPanel.style.opacity = '1';
    });
  });
}

function setupCopyButtonsForSnippet(snippetElement) {
  snippetElement.querySelectorAll('.copy-button').forEach(button => {
    button.addEventListener('click', () => {
      const codeElement = button.closest('.code-content').querySelector('code');
      if (!codeElement) return;
      
      navigator.clipboard.writeText(codeElement.textContent.trim())
        .then(() => {
          button.classList.add('copied');
          setTimeout(() => button.classList.remove('copied'), 2000);
        })
        .catch(err => console.error('Failed to copy:', err));
    });
  });
}

function setActiveTab(tab, panelId, tabsContainer, panelsContainer) {
  if (tab.classList.contains('active')) return;

  tabsContainer.querySelectorAll('.code-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });

  panelsContainer.querySelectorAll('.code-panel').forEach(p => {
    p.classList.remove('active');
    p.style.opacity = '0';
  });

  tab.classList.add('active');
  tab.setAttribute('aria-selected', 'true');
  const targetPanel = document.getElementById(panelId);
  if (targetPanel) {
    targetPanel.classList.add('active');
    targetPanel.style.opacity = '1';
  }
}