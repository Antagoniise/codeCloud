class GitHubCloneApp {
  setupDocumentClickListener() {
  document.addEventListener('click', (e) => {
    const isOutsideLeft = !this.elements.leftSidebar?.contains(e.target) && 
                         !this.elements.menuToggle?.contains(e.target);
    
    const isOutsideRight = !this.elements.rightSidebar?.contains(e.target) && 
                          !this.elements.profileToggle?.contains(e.target);
    
    if (isOutsideLeft && isOutsideRight) {
      this.closeAllMenus();
    }
  });
}
   
  
  constructor() {
    this.elements = {};
    this.state = {
      currentPage: '',
      previousPage: sessionStorage.getItem('previousPage') || '',
      navigationData: new Map(),
      isLoading: false,
      leftSidebarOpen: false,
      rightSidebarOpen: false,
      navOpen: false,
      touchStartX: 0,
      touchEndX: 0,
      scrollPosition: 0,
      searchQuery: '',
      loadingProgress: 0,
      loadingInterval: null
    };

    this.navigationConfig = {
      'snippets': {
        title: 'Code Snippets',
        categories: [
          { id: 'javascript', name: 'JavaScript', icon: 'ph ph-javascript-logo' },
          { id: 'python', name: 'Python', icon: 'ph ph-python-logo' },
          { id: 'react', name: 'React', icon: 'ph ph-react-logo' },
          { id: 'css', name: 'CSS', icon: 'ph ph-css3-logo' },
          { id: 'html', name: 'HTML', icon: 'ph ph-html-logo' },
          { id: 'nodejs', name: 'Node.js', icon: 'ph ph-node-logo' }
        ]
      },
      'colours': {
        title: 'Color Tools',
        categories: [
          { id: 'palette', name: 'Palettes', icon: 'ph ph-palette' },
          { id: 'generator', name: 'Generator', icon: 'ph ph-magic-wand' },
          { id: 'picker', name: 'Picker', icon: 'ph ph-eyedropper' },
          { id: 'gradients', name: 'Gradients', icon: 'ph ph-gradient' },
          { id: 'contrast', name: 'Contrast', icon: 'ph ph-circles-three' }
        ]
      },
      'home': {
        title: 'Dashboard',
        categories: [
          { id: 'overview', name: 'Overview', icon: 'ph ph-house' },
          { id: 'recent', name: 'Recent', icon: 'ph ph-clock' },
          { id: 'favorites', name: 'Favorites', icon: 'ph ph-heart' },
          { id: 'activity', name: 'Activity', icon: 'ph ph-activity' }
        ]
      }
    };

    this.init();
  }

  init() {
    this.cacheElements();
    this.setupEventListeners();
    this.setupDocumentClickListener();
    this.setupServiceWorker();
    this.handleInitialRoute();
    this.initializeNavigation();
    console.log('✨ Enhanced GitHub Clone initialized successfully');
  }

  cacheElements() {
    this.elements = {
      header: document.getElementById('header'),
      leftSidebar: document.getElementById('left-sidebar'),
      rightSidebar: document.getElementById('right-sidebar'),
      overlay: document.getElementById('overlay'),
      menuToggle: document.getElementById('menu-toggle'),
      profileToggle: document.getElementById('profile-toggle'),
      navTrigger: document.getElementById('nav-trigger'),
      dynamicNavContainer: document.getElementById('dynamic-nav-container'),
      dynamicNav: document.getElementById('dynamic-nav'),
      contentIframe: document.getElementById('content-iframe'),
      loadingBar: document.getElementById('loading-bar'),
      loadingProgress: document.getElementById('loading-progress'),
      loadingOverlay: document.getElementById('loading-overlay'),
      fab: document.getElementById('fab'),
      searchInput: document.querySelector('.search-input'),
      mainContent: document.getElementById('main-content')
    };
  }
  setupEventListeners() {
    if (this.elements.menuToggle) {
      this.elements.menuToggle.addEventListener('click', (e) => this.toggleLeftSidebar(e));
    }
    if (this.elements.profileToggle) {
      this.elements.profileToggle.addEventListener('click', (e) => this.toggleRightSidebar(e));
    }
    if (this.elements.navTrigger) {
      this.elements.navTrigger.addEventListener('click', () => this.toggleDynamicNav());
    }
    if (this.elements.overlay) {
      this.elements.overlay.addEventListener('click', () => this.closeAllMenus());
    }
    if (this.elements.fab) {
      this.elements.fab.addEventListener('click', () => this.handleFabClick());
    }
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
      this.elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.handleSearchSubmit(e.target.value);
      });
    }
    document.addEventListener('click', (e) => this.handleDynamicLinks(e));
    window.addEventListener('scroll', () => this.handleScroll());
    window.addEventListener('popstate', (e) => this.handlePopState(e));
    if (this.elements.contentIframe) {
      this.elements.contentIframe.addEventListener('load', () => this.handleIframeLoad());
    }
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    window.addEventListener('resize', () => this.handleResize());
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true }); 
  }
  setupServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/serviceWorker.js')
        .then(registration => {
          console.log('Service Worker registered:', registration.scope);
          setInterval(() => registration.update(), 60 * 60 * 1000);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  handleTouchStart(e) {
    this.state.touchStartX = e.changedTouches[0].screenX;
  }
  handleTouchEnd(e) {
    this.state.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipeGesture();
  }
  handleSwipeGesture() {
    const { touchStartX, touchEndX } = this.state;
    const threshold = 50;
    const swipeDistance = touchEndX - touchStartX;

    if (touchStartX < 50 && swipeDistance > threshold) {
      this.openLeftSidebar();
    } else if (touchStartX > window.innerWidth - 50 && -swipeDistance > threshold) {
      this.openRightSidebar();
    } else if (this.state.leftSidebarOpen && -swipeDistance > threshold) {
      this.closeLeftSidebar();
    } else if (this.state.rightSidebarOpen && swipeDistance > threshold) {
      this.closeRightSidebar();
    }
  }

  toggleLeftSidebar(event) {
    event.stopPropagation();
    if (this.state.leftSidebarOpen) {
      this.closeLeftSidebar();
    } else {
      this.openLeftSidebar();
    }
    this.createRippleEffect(event.currentTarget, event);
  }
  openLeftSidebar() {
    this.state.leftSidebarOpen = true;
    this.state.rightSidebarOpen = false;
    if (this.elements.leftSidebar) this.elements.leftSidebar.classList.add('open');
    if (this.elements.rightSidebar) this.elements.rightSidebar.classList.remove('open');
    if (this.elements.overlay) this.elements.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  closeLeftSidebar() {
    this.state.leftSidebarOpen = false;
    if (this.elements.leftSidebar) this.elements.leftSidebar.classList.remove('open');
    if (!this.state.rightSidebarOpen && this.elements.overlay) {
      this.elements.overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  toggleRightSidebar(event) {
    event.stopPropagation();
    if (this.state.rightSidebarOpen) {
      this.closeRightSidebar();
    } else {
      this.openRightSidebar();
    }
    this.createRippleEffect(event.currentTarget, event);
  }
  openRightSidebar() {
    this.state.rightSidebarOpen = true;
    this.state.leftSidebarOpen = false;
    if (this.elements.rightSidebar) this.elements.rightSidebar.classList.add('open');
    if (this.elements.leftSidebar) this.elements.leftSidebar.classList.remove('open');
    if (this.elements.overlay) this.elements.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  closeRightSidebar() {
    this.state.rightSidebarOpen = false;
    if (this.elements.rightSidebar) this.elements.rightSidebar.classList.remove('open');
    if (!this.state.leftSidebarOpen && this.elements.overlay) {
      this.elements.overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  toggleDynamicNav() {
    // Close sidebars first if they're open
    this.closeLeftSidebar();
    this.closeRightSidebar();
    
    // Toggle dynamic nav
    this.state.navOpen = !this.state.navOpen;
    
    if (this.elements.dynamicNavContainer) {
      this.elements.dynamicNavContainer.classList.toggle('active', this.state.navOpen);
    }
    
    if (this.elements.navTrigger) {
      this.elements.navTrigger.classList.toggle('active', this.state.navOpen);
      
      // Update icon
      const icon = this.elements.navTrigger.querySelector('i');
      if (icon) {
        icon.className = this.state.navOpen ? 'ph ph-caret-up' : 'ph ph-caret-down';
      }
    }
    
    // Toggle overlay only for dynamic nav
    if (this.elements.overlay) {
      if (this.state.navOpen) {
        this.elements.overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      } else {
        this.elements.overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  }

  closeDynamicNav() {
    this.state.navOpen = false;
    if (this.elements.dynamicNavContainer) {
      this.elements.dynamicNavContainer.classList.remove('active');
    }
    if (this.elements.navTrigger) {
      this.elements.navTrigger.classList.remove('active');
      const icon = this.elements.navTrigger.querySelector('i');
      if (icon) {
        icon.className = 'ph ph-caret-down';
      }
    }
    if (this.elements.overlay) {
      this.elements.overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
  }

  closeAllMenus() {
    this.closeLeftSidebar();
    this.closeRightSidebar();
    this.closeDynamicNav();
  }

  createRippleEffect(element, event) {
    const rect = element.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    element.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  handleInitialRoute() {
    const currentPath = window.location.pathname;
    const hash = window.location.hash.substring(1);
    if (hash) {
      this.navigateToPage(hash);
    } else if (currentPath !== '/gitHub/' && currentPath.startsWith('/gitHub/')) {
      const relativePath = currentPath.replace('/gitHub/', '');
      this.navigateToPage(relativePath);
      history.replaceState({ page: relativePath }, '', '/gitHub/#' + relativePath);
    } else {
      this.showWelcomePage();
    }
  }
  initializeNavigation() {
    this.updateDynamicNavigation();
  }
  handleDynamicLinks(event) {
    const link = event.target.closest('a[data-link="dynamic"]');
    if (!link) return;
    event.preventDefault();
    const fullUrl = link.getAttribute('href');
    this.navigateToPage(this.getRelativePath(fullUrl));
    this.closeAllMenus();
    history.pushState({ page: this.getRelativePath(fullUrl) }, '', '/gitHub/' + this.getRelativePath(fullUrl));
  }
  async navigateToPage(path) {
    if (this.state.isLoading) return;
    this.state.isLoading = true;
    this.showLoadingState();

    try {
      this.state.previousPage = this.state.currentPage;
      this.state.currentPage = this.extractPageName(path);
      if (this.state.currentPage) {
        sessionStorage.setItem('previousPage', this.state.currentPage);
      }
      await this.loadIframeContent(path);
      this.updateDynamicNavigation();
      this.updatePageTitle();
    } catch (error) {
      console.error('Navigation error:', error);
      this.showErrorState('Failed to load page');
    } finally {
      this.state.isLoading = false;
      this.hideLoadingState();
    }
  }
  loadIframeContent(path) {
    return new Promise((resolve, reject) => {
      if (!this.elements.contentIframe) {
        reject(new Error('Content iframe not found'));
        return;
      }

      this.startLoadingProgress();
      this.elements.contentIframe.classList.remove('loaded');

      const loadTimeout = setTimeout(() => {
        reject(new Error('Load timeout'));
      }, 10000);

      const handleLoad = () => {
        clearTimeout(loadTimeout);
        this.elements.contentIframe.removeEventListener('load', handleLoad);
        this.elements.contentIframe.removeEventListener('error', handleError);
        setTimeout(() => {
          this.elements.contentIframe.classList.add('loaded');
          this.completeLoadingProgress();
          resolve();
        }, 300);
      };

      const handleError = () => {
        clearTimeout(loadTimeout);
        this.elements.contentIframe.removeEventListener('load', handleLoad);
        this.elements.contentIframe.removeEventListener('error', handleError);
        reject(new Error('Failed to load content'));
      };

      this.elements.contentIframe.addEventListener('load', handleLoad);
      this.elements.contentIframe.addEventListener('error', handleError);
      this.elements.contentIframe.src = path;
    });
  }
  updateDynamicNavigation() {
    if (!this.elements.dynamicNav) return;
    const pageKey = this.state.currentPage || 'home';
    const navConfig = this.navigationConfig[pageKey];

    if (!navConfig) {
      this.elements.dynamicNav.innerHTML = this.createDefaultNavigation();
      return;
    }

    this.elements.dynamicNav.innerHTML = navConfig.categories.map((category, index) => `
      <a href="#${pageKey}/${category.id}"
         class="nav-item ${index === 0 ? 'active' : ''}"
         data-category="${category.id}"
         data-page="${pageKey}">
        <i class="${category.icon}" style="margin-right: 8px; font-size: 16px;"></i>
        ${category.name}
      </a>
      ${index < navConfig.categories.length - 1 ? '<div class="nav-separator"></div>' : ''}
    `).join('');

    this.elements.dynamicNav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleCategoryClick(e));
    });
  }
  handleCategoryClick(event) {
    event.preventDefault();
    const clickedItem = event.currentTarget;
    this.elements.dynamicNav.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    clickedItem.classList.add('active');
    document.dispatchEvent(new CustomEvent('categoryChanged', {
      detail: { 
        page: clickedItem.dataset.page, 
        category: clickedItem.dataset.category 
      }
    }));
    this.createRippleEffect(clickedItem, event);
  }

  showLoadingState() {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.classList.add('active');
    }
    if (this.elements.loadingBar) {
      this.elements.loadingBar.style.opacity = '1';
    }
  }
  hideLoadingState() {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.classList.remove('active');
    }
    if (this.elements.loadingBar) {
      this.elements.loadingBar.style.opacity = '0';
    }
  }

  startLoadingProgress() {
    if (this.state.loadingInterval) {
      clearInterval(this.state.loadingInterval);
    }
    this.state.loadingProgress = 0;
    if (this.elements.loadingProgress) {
      this.elements.loadingProgress.style.width = '0%';
      this.elements.loadingProgress.style.opacity = '1';
    }
    
    this.state.loadingInterval = setInterval(() => {
      this.state.loadingProgress += Math.random() * 10;
      if (this.elements.loadingProgress) {
        this.elements.loadingProgress.style.width = `${Math.min(this.state.loadingProgress, 90)}%`;
      }
      if (this.state.loadingProgress >= 90) {
        clearInterval(this.state.loadingInterval);
      }
    }, 300);
  }
  completeLoadingProgress() {
    if (this.state.loadingInterval) {
      clearInterval(this.state.loadingInterval);
    }
    if (this.elements.loadingProgress) {
      this.elements.loadingProgress.style.width = '100%';
      setTimeout(() => {
        this.elements.loadingProgress.style.opacity = '0';
      }, 500);
    }
  }

  showErrorState(message) {
    const errorOverlay = document.createElement('div');
    errorOverlay.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50';
    errorOverlay.innerHTML = `
      <div class="bg-red-900 text-white p-6 rounded-lg max-w-md text-center">
        <i class="ph ph-warning-circle text-4xl mb-4"></i>
        <h3 class="text-xl font-bold mb-2">Error Loading Content</h3>
        <p class="mb-4">${message}</p>
        <button class="bg-red-700 hover:bg-red-600 px-4 py-2 rounded">
          Try Again
        </button>
      </div>
    `;
    errorOverlay.querySelector('button').addEventListener('click', () => {
      errorOverlay.remove();
      this.navigateToPage(this.state.currentPage || 'home');
    });
    document.body.appendChild(errorOverlay);
  }

  handleScroll() {
    this.state.scrollPosition = window.scrollY;
    if (this.elements.header) {
      this.elements.header.classList.toggle('scrolled', this.state.scrollPosition > 10);
    }
  }
  handlePopState(event) {
    if (event.state?.page) {
      this.navigateToPage(event.state.page);
    } else {
      this.showWelcomePage();
    }
  }
  handleIframeLoad() {
    if (this.elements.contentIframe?.contentDocument?.title) {
      document.title = `${this.elements.contentIframe.contentDocument.title} - GitHub Clone`;
    }
  }
  handleKeyboardShortcuts(event) {
    // Close all with Escape
    if (event.key === 'Escape') this.closeAllMenus();
    
    // Toggle search with Ctrl+K or Cmd+K
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      if (this.elements.searchInput) {
        this.elements.searchInput.focus();
      }
    }
    
    // Toggle left sidebar with Ctrl+1
    if (event.ctrlKey && event.key === '1' && this.elements.menuToggle) {
      event.preventDefault();
      this.toggleLeftSidebar({ currentTarget: this.elements.menuToggle });
    }
  }
  handleResize() {
    if (window.innerWidth >= 768 && this.state.leftSidebarOpen) {
      this.closeLeftSidebar();
    }
  }
  handleSearch(query) {
    this.state.searchQuery = query;
    // Debounce search if needed
  }
  handleSearchSubmit(query) {
    if (query.trim()) {
      this.navigateToPage(`search?q=${encodeURIComponent(query)}`);
      if (this.elements.searchInput) {
        this.elements.searchInput.blur();
      }
    }
  }
  handleFabClick() {
    const fabMenu = document.createElement('div');
    fabMenu.className = 'fixed bottom-24 right-6 bg-gray-800 rounded-lg shadow-xl z-40 p-2 min-w-[200px]';
    fabMenu.innerHTML = `
      <div class="text-xs text-gray-400 px-3 py-2">Quick Actions</div>
      <button class="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center">
        <i class="ph ph-plus-circle mr-2"></i> New Repository
      </button>
      <button class="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center">
        <i class="ph ph-upload mr-2"></i> Upload Files
      </button>
      <button class="w-full text-left px-3 py-2 hover:bg-gray-700 rounded flex items-center">
        <i class="ph ph-git-pull-request mr-2"></i> New Pull Request
      </button>
    `;
    
    fabMenu.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        fabMenu.remove();
        this.createRippleEffect(btn, { clientX: 0, clientY: 0 });
      });
    });
    
    document.body.appendChild(fabMenu);
    setTimeout(() => {
      document.addEventListener('click', (e) => {
        if (!fabMenu.contains(e.target)) fabMenu.remove();
      }, { once: true });
    }, 10);
  }

  getRelativePath(fullUrl) {
    try {
      const url = new URL(fullUrl, window.location.origin);
      return url.pathname.replace('/gitHub/', '');
    } catch {
      return fullUrl.replace(/^https?:\/\/[^/]+(\/gitHub\/)?/, '');
    }
  }
  extractPageName(path) {
    return path.split('/')[0].split('?')[0];
  }
  updatePageTitle() {
    const pageConfig = this.navigationConfig[this.state.currentPage];
    document.title = pageConfig ? `${pageConfig.title} - GitHub Clone` : 'GitHub Clone';
  }

  showWelcomePage() {
    if (!this.elements.contentIframe) return;
    
    this.elements.contentIframe.src = '';
    this.elements.contentIframe.srcdoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { 
            background-color: #0d1117; 
            color: #e6edf3; 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          h1 { font-size: 2.5rem; margin-bottom: 1rem; }
          p { font-size: 1.2rem; opacity: 0.8; max-width: 600px; }
        </style>
      </head>
      <body>
        <h1>Welcome to GitHub Clone</h1>
        <p>Select an option from the sidebar to get started, or use the search bar to find repositories.</p>
      </body>
      </html>
    `;
    this.state.currentPage = 'home';
    this.updatePageTitle();
  }

  createDefaultNavigation() {
    return `
      <a href="#home" class="nav-item active">
        <i class="ph ph-house" style="margin-right: 8px; font-size: 16px;"></i>
        Home
      </a>
      <div class="nav-separator"></div>
      <a href="#explore" class="nav-item">
        <i class="ph ph-compass" style="margin-right: 8px; font-size: 16px;"></i>
        Explore
      </a>
    `;
  }
}
