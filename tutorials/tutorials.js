export const tutorials = [
{
  id: "pwa-conversion",
  title: "Complete PWA Conversion Guide",
  created: 1716881000,
  updated: 1716882000,
  steps: [
    {
      description: "Core Manifest Configuration",
      code: [
        {
          language: "json",
          content: `
{
  "name": "My Progressive Web App",
  "short_name": "MyPWA",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4285f4",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop.png",
      "sizes": "1280x800",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
          `
        }
      ]
    },
    {
      description: "Service Worker Implementation with Precaching",
      code: [
        {
          language: "javascript",
          content: `
const CACHE_NAME = 'v1.0';
const PRECACHE_URLS = [
  '/',
  '/styles/main.css',
  '/scripts/main.js',
  '/images/logo.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});
          `
        }
      ]
    },
    {
      description: "Advanced Offline Fallback Strategies",
      code: [
        {
          language: "javascript",
          content: `
const OFFLINE_URL = '/offline.html';
const CACHE_NAME = 'runtime';

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(OFFLINE_URL))
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request)
            .then(response => {
              return caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, response.clone());
                  return response;
                });
            })
            .catch(() => {
              if (event.request.destination === 'image') {
                return caches.match('/images/offline.png');
              }
            });
        })
    );
  }
});
          `
        }
      ]
    },
    {
      description: "Background Sync Implementation",
      code: [
        {
          language: "javascript",
          content: `
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(
      checkForms().then(formsToSubmit => {
        return Promise.all(formsToSubmit.map(formData => {
          return fetch('/api/sync', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: {
              'Content-Type': 'application/json'
            }
          });
        }));
      })
    );
  }
});

function checkForms() {
  return new Promise(resolve => {
    indexedDB.open('formsDB').onsuccess = event => {
      const db = event.target.result;
      const transaction = db.transaction('pendingForms', 'readonly');
      const store = transaction.objectStore('pendingForms');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
    };
  });
}
          `
        }
      ]
    },
    {
      description: "Web App Manifest Dynamic Injection",
      code: [
        {
          language: "javascript",
          content: `
function generateManifest() {
  const manifest = {
    name: document.querySelector('meta[property="og:title"]').content,
    short_name: document.title.substring(0, 12),
    start_url: window.location.pathname,
    display: 'standalone',
    background_color: getComputedStyle(document.documentElement)
      .getPropertyValue('--bg-color') || '#ffffff',
    theme_color: getComputedStyle(document.documentElement)
      .getPropertyValue('--theme-color') || '#4285f4'
  };

  const blob = new Blob([JSON.stringify(manifest)], {type: 'application/json'});
  return URL.createObjectURL(blob);
}

const link = document.createElement('link');
link.rel = 'manifest';
link.href = generateManifest();
document.head.appendChild(link);
          `
        }
      ]
    },
    {
      description: "Install Prompt Handling",
      code: [
        {
          language: "javascript",
          content: `
let deferredPrompt;
const installButton = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installButton.style.display = 'block';
});

installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    trackEvent('PWA Install', 'Accepted');
  } else {
    trackEvent('PWA Install', 'Dismissed');
  }
  deferredPrompt = null;
  installButton.style.display = 'none';
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  installButton.style.display = 'none';
  trackEvent('PWA Install', 'Success');
});
          `
        }
      ]
    },
    {
      description: "Periodic Background Sync",
      code: [
        {
          language: "javascript",
          content: `
async function registerPeriodicSync() {
  const registration = await navigator.serviceWorker.ready;
  try {
    await registration.periodicSync.register('update-content', {
      minInterval: 24 * 60 * 60 * 1000
    });
  } catch (e) {
    console.log('Periodic Sync could not be registered:', e);
  }
}

if ('periodicSync' in navigator) {
  registerPeriodicSync();
}

self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-content') {
    event.waitUntil(updateContentCache());
  }
});

async function updateContentCache() {
  const cache = await caches.open('dynamic-content');
  const response = await fetch('/api/latest-content');
  await cache.put('/api/latest-content', response.clone());
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'content-updated',
      timestamp: Date.now()
    });
  });
  return response;
}
          `
        }
      ]
    },
    {
      description: "Advanced Cache Strategies",
      code: [
        {
          language: "javascript",
          content: `
const CACHE_STRATEGIES = {
  STATIC: 'static-v1',
  API: 'api-v1',
  IMAGES: 'images-v1'
};

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
  } else if (url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirst(event.request));
  } else if (url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png')) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_STRATEGIES.API);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_STRATEGIES.IMAGES);
  const cachedResponse = await cache.match(request);
  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  return cachedResponse || fetchPromise;
}
          `
        }
      ]
    }
  ]
},
{
  id: "preline-advanced",
  title: "Preline UI Advanced Components & Plugins",
  created: 1716883000,
  updated: 1716884000,
  steps: [
    {
      description: "Dynamic Data Tables with Server-Side Processing - A fully interactive table supporting sorting, pagination, and AJAX loading with Preline's enhanced table utilities and custom styling options.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-datatable" id="serverSideTable">
  <div class="hs-datatable-header">
    <div class="hs-datatable-search">
      <input type="text" class="hs-datatable-search-field" placeholder="Search...">
    </div>
  </div>
  <div class="hs-datatable-body">
    <table>
      <thead class="hs-datatable-thead">
        <tr>
          <th data-sort="id">ID</th>
          <th data-sort="name">Name</th>
          <th data-sort="status">Status</th>
          <th data-sort="actions">Actions</th>
        </tr>
      </thead>
      <tbody class="hs-datatable-tbody"></tbody>
    </table>
  </div>
  <div class="hs-datatable-footer">
    <div class="hs-datatable-pagination"></div>
  </div>
</div>

<script>
  const datatable = new HSDatatable('#serverSideTable', {
    processing: true,
    serverSide: true,
    ajax: {
      url: '/api/data',
      dataSrc: json => {
        return json.data.map(item => ({
          id: item.id,
          name: \`<div class="flex items-center"><img src="\${item.avatar}" class="w-8 h-8 rounded-full mr-3">\${item.name}</div>\`,
          status: \`<span class="hs-badge \${item.status === 'Active' ? 'hs-badge-success' : 'hs-badge-danger'}">\${item.status}</span>\`,
          actions: \`<div class="flex space-x-2"><button class="hs-tooltip-btn" data-hs-tooltip="Edit"><i class="bi-pencil"></i></button><button class="hs-tooltip-btn" data-hs-tooltip="Delete"><i class="bi-trash"></i></button></div>\`
        }));
      }
    },
    columns: [
      { data: 'id', className: 'text-right' },
      { data: 'name' },
      { data: 'status', className: 'text-center' },
      { data: 'actions', className: 'text-center' }
    ]
  });
</script>
          `
        }
      ]
    },
    {
      description: "Multi-Step Form Wizard with Validation - A wizard-style form with step validation, progress tracking, and conditional logic using Preline's form validation plugin combined with custom transitions.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-form-wizard" id="applicationWizard">
  <div class="hs-form-wizard-steps">
    <div class="hs-form-wizard-step active" data-step="1">Personal</div>
    <div class="hs-form-wizard-step" data-step="2">Education</div>
    <div class="hs-form-wizard-step" data-step="3">Experience</div>
    <div class="hs-form-wizard-step" data-step="4">Review</div>
  </div>
  
  <div class="hs-form-wizard-content">
    <form id="multiStepForm">
      <div class="hs-form-wizard-pane active" data-step="1">
        <div class="hs-form-group">
          <label class="hs-form-label">Full Name</label>
          <input type="text" class="hs-form-control" name="full_name" required data-hs-validation-rules='{"minLength":3}'>
        </div>
        <!-- More fields -->
      </div>
      
      <div class="hs-form-wizard-pane" data-step="2">
        <!-- Education fields -->
      </div>
      
      <div class="hs-form-wizard-actions">
        <button type="button" class="hs-btn hs-btn-secondary hs-form-wizard-prev">Previous</button>
        <button type="button" class="hs-btn hs-btn-primary hs-form-wizard-next">Next</button>
        <button type="submit" class="hs-btn hs-btn-success hs-form-wizard-submit">Submit</button>
      </div>
    </form>
  </div>
</div>

<script>
  const wizard = new HSFormWizard('#applicationWizard', {
    onStepChange: (currentStep, previousStep) => {
      // Custom logic for step transitions
    },
    onSubmit: (formData) => {
      return fetch('/submit-application', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
    }
  });
</script>
          `
        }
      ]
    },
    {
      description: "Interactive Dashboard with Draggable Widgets - A responsive admin dashboard featuring draggable, resizable widgets with local storage persistence using Preline's grid system and sortable plugin.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-dashboard-grid" id="adminDashboard">
  <div class="hs-dashboard-widget" data-widget-id="stats" data-col="1" data-row="1" data-width="2" data-height="1">
    <div class="hs-dashboard-widget-header">
      <h3>Key Metrics</h3>
      <div class="hs-dashboard-widget-actions">
        <button class="hs-dashboard-widget-refresh"><i class="bi-arrow-clockwise"></i></button>
      </div>
    </div>
    <div class="hs-dashboard-widget-body">
      <div class="hs-stats-grid">
        <div class="hs-stat-card">
          <div class="hs-stat-card-value">1,234</div>
          <div class="hs-stat-card-label">Total Users</div>
        </div>
        <!-- More stats -->
      </div>
    </div>
  </div>
  
  <div class="hs-dashboard-widget" data-widget-id="chart" data-col="3" data-row="1" data-width="2" data-height="2">
    <div class="hs-dashboard-widget-header">
      <h3>Performance Chart</h3>
      <select class="hs-dashboard-widget-filter">
        <option>7 Days</option>
        <option>30 Days</option>
      </select>
    </div>
    <div class="hs-dashboard-widget-body">
      <canvas id="performanceChart"></canvas>
    </div>
  </div>
</div>

<script>
  const dashboard = new HSDashboard('#adminDashboard', {
    grid: {
      cols: 4,
      rowHeight: 100,
      margin: 10
    },
    storageKey: 'adminDashboardLayout',
    widgets: {
      stats: {
        onRefresh: (widget) => {
          return fetch('/api/stats').then(updateWidgetContent);
        }
      },
      chart: {
        onInit: (widget) => {
          initChart(widget.querySelector('canvas'));
        }
      }
    }
  });
</script>
          `
        }
      ]
    },
    {
      description: "Advanced Notification System - A real-time notification center with action buttons, grouping, and expiration timers using Preline's notification plugin with WebSocket integration.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-notification-center" id="notificationCenter">
  <div class="hs-notification-center-header">
    <h3>Notifications</h3>
    <div class="hs-notification-center-actions">
      <button class="hs-btn hs-btn-sm hs-notification-center-mark-all">Mark All Read</button>
    </div>
  </div>
  <div class="hs-notification-center-body"></div>
</div>

<script>
  const notificationCenter = new HSNotificationCenter('#notificationCenter', {
    position: 'bottom-right',
    maxNotifications: 10,
    groupSimilar: true,
    expiration: 10000,
    templates: {
      default: (notification) => \`
        <div class="hs-notification \${notification.read ? 'read' : ''}">
          <div class="hs-notification-icon">
            <i class="bi-\${notification.icon}"></i>
          </div>
          <div class="hs-notification-content">
            <div class="hs-notification-title">\${notification.title}</div>
            <div class="hs-notification-message">\${notification.message}</div>
            <div class="hs-notification-time">\${formatTime(notification.time)}</div>
            \${notification.actions ? \`<div class="hs-notification-actions">\${notification.actions.map(action => \`<button class="hs-btn hs-btn-sm \${action.primary ? 'hs-btn-primary' : ''}" data-action="\${action.name}">\${action.label}</button>\`).join('')}</div>\` : ''}
          </div>
          <button class="hs-notification-close">&times;</button>
        </div>
      \`
    }
  });

  const ws = new WebSocket('wss://notifications.example.com');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    notificationCenter.addNotification({
      id: data.id,
      title: data.title,
      message: data.message,
      icon: data.type,
      time: new Date(),
      actions: data.actions,
      onAction: (action, notification) => {
        handleNotificationAction(action, notification.id);
      }
    });
  };
</script>
          `
        }
      ]
    },
    {
      description: "Interactive Kanban Board - A drag-and-drop task management system with swimlanes, filtering, and real-time collaboration features using Preline's sortable plugin with custom extensions.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-kanban-board" id="taskBoard">
  <div class="hs-kanban-swimlane" data-status="backlog">
    <div class="hs-kanban-column-header">
      <h3>Backlog</h3>
      <span class="hs-kanban-count">0</span>
    </div>
    <div class="hs-kanban-column-body" data-hs-sortable='{"group":"tasks","animation":150,"ghostClass":"hs-kanban-ghost"}'>
      <!-- Tasks will be added here -->
    </div>
    <div class="hs-kanban-column-footer">
      <button class="hs-btn hs-btn-sm hs-kanban-add-task">Add Task</button>
    </div>
  </div>
  
  <div class="hs-kanban-swimlane" data-status="in-progress">
    <!-- In Progress Column -->
  </div>
  
  <div class="hs-kanban-swimlane" data-status="done">
    <!-- Done Column -->
  </div>
</div>

<script>
  const kanban = new HSKanban('#taskBoard', {
    onTaskAdd: (taskData) => {
      return fetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
    },
    onTaskMove: (taskId, newStatus) => {
      return fetch(\`/tasks/\${taskId}/status\`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
    },
    taskTemplate: (task) => \`
      <div class="hs-kanban-task" data-task-id="\${task.id}" draggable="true">
        <div class="hs-kanban-task-header">
          <span class="hs-kanban-task-priority hs-priority-\${task.priority}"></span>
          <button class="hs-kanban-task-menu">&vellip;</button>
        </div>
        <div class="hs-kanban-task-content">\${task.title}</div>
        <div class="hs-kanban-task-footer">
          <div class="hs-kanban-task-assignees">
            \${task.assignees.map(user => \`<img src="\${user.avatar}" class="hs-kanban-assignee-avatar" title="\${user.name}">\`).join('')}
          </div>
          <div class="hs-kanban-task-due">\${formatDate(task.dueDate)}</div>
        </div>
      </div>
    \`
  });

  // Real-time collaboration
  const collabChannel = new BroadcastChannel('kanban-updates');
  collabChannel.onmessage = (event) => {
    kanban.syncState(event.data);
  };
</script>
          `
        }
      ]
    },
    {
      description: "Advanced File Uploader with Chunking - A robust file upload component supporting large files, chunked uploads, progress tracking, and preview generation using Preline's file input enhancements with custom JavaScript.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-file-uploader" id="documentUploader">
  <div class="hs-file-uploader-dropzone" data-hs-file-dropzone>
    <input type="file" id="fileInput" multiple style="display: none;">
    <div class="hs-file-uploader-prompt">
      <i class="bi-cloud-arrow-up"></i>
      <p>Drag & drop files here or click to browse</p>
    </div>
  </div>
  
  <div class="hs-file-uploader-queue">
    <div class="hs-file-uploader-progress">
      <div class="hs-progress-bar">
        <div class="hs-progress-bar-fill" style="width: 0%"></div>
      </div>
      <div class="hs-file-uploader-stats">
        <span class="hs-file-uploader-uploaded">0 MB</span>
        <span class="hs-file-uploader-speed">0 MB/s</span>
        <span class="hs-file-uploader-time">0s remaining</span>
      </div>
    </div>
    
    <div class="hs-file-uploader-items"></div>
  </div>
</div>

<script>
  const uploader = new HSFileUploader('#documentUploader', {
    endpoint: '/api/upload',
    chunkSize: 5 * 1024 * 1024, // 5MB
    maxParallelUploads: 3,
    maxFiles: 10,
    allowedFileTypes: ['image/*', 'application/pdf'],
    onFileAdded: (file) => {
      if (file.type.startsWith('image/')) {
        return generateThumbnail(file);
      }
      return Promise.resolve();
    },
    onProgress: (uploaded, total) => {
      updateProgressBar(uploaded / total * 100);
    },
    onComplete: (results) => {
      showUploadCompleteNotification(results);
    }
  });

  function generateThumbnail(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Thumbnail generation logic
          resolve();
        };
      };
      reader.readAsDataURL(file);
    });
  }
</script>
          `
        }
      ]
    },
    {
      description: "Interactive Calendar with Scheduling - A full-featured calendar component supporting event creation, drag-and-drop rescheduling, and time zone conversion using Preline's date utilities with custom event handling.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-calendar" id="schedulingCalendar">
  <div class="hs-calendar-header">
    <button class="hs-calendar-prev"><i class="bi-chevron-left"></i></button>
    <h2 class="hs-calendar-title">April 2023</h2>
    <button class="hs-calendar-next"><i class="bi-chevron-right"></i></button>
    
    <div class="hs-calendar-views">
      <button class="hs-btn hs-btn-sm hs-calendar-view" data-view="day">Day</button>
      <button class="hs-btn hs-btn-sm hs-calendar-view active" data-view="week">Week</button>
      <button class="hs-btn hs-btn-sm hs-calendar-view" data-view="month">Month</button>
    </div>
    
    <div class="hs-calendar-timezone">
      <select class="hs-timezone-selector">
        <option value="UTC">UTC</option>
        <option value="America/New_York" selected>New York</option>
        <option value="Europe/London">London</option>
      </select>
    </div>
  </div>
  
  <div class="hs-calendar-body">
    <div class="hs-calendar-week-view">
      <div class="hs-calendar-time-column">
        <!-- Time labels -->
      </div>
      <div class="hs-calendar-day-columns">
        <!-- Day columns will be generated here -->
      </div>
    </div>
  </div>
  
  <div class="hs-calendar-footer">
    <button class="hs-btn hs-btn-primary hs-calendar-new-event">New Event</button>
  </div>
</div>

<script>
  const calendar = new HSCalendar('#schedulingCalendar', {
    defaultView: 'week',
    timezone: 'America/New_York',
    events: '/api/events',
    editable: true,
    eventRender: (event, element) => {
      element.className = \`hs-calendar-event hs-event-\${event.type}\`;
      element.innerHTML = \`
        <div class="hs-event-title">\${event.title}</div>
        \${event.description ? \`<div class="hs-event-description">\${event.description}</div>\` : ''}
        <div class="hs-event-time">\${formatTime(event.start)} - \${formatTime(event.end)}</div>
      \`;
    },
    onEventCreate: (newEvent) => {
      return fetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(newEvent)
      });
    },
    onEventUpdate: (updatedEvent) => {
      return fetch(\`/api/events/\${updatedEvent.id}\`, {
        method: 'PUT',
        body: JSON.stringify(updatedEvent)
      });
    }
  });

  document.querySelector('.hs-timezone-selector').addEventListener('change', (e) => {
    calendar.setOption('timezone', e.target.value);
  });
</script>
          `
        }
      ]
    },
    {
      description: "Real-Time Collaborative Editor - A rich text editor with operational transformation for real-time collaboration using Preline's contenteditable enhancements with conflict resolution.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-collab-editor" id="documentEditor">
  <div class="hs-collab-editor-toolbar">
    <div class="hs-toolbar-group">
      <button class="hs-format-btn" data-command="bold"><i class="bi-type-bold"></i></button>
      <button class="hs-format-btn" data-command="italic"><i class="bi-type-italic"></i></button>
    </div>
    <!-- More toolbar buttons -->
  </div>
  
  <div class="hs-collab-editor-content" contenteditable="true">
    <p>Start collaborating on this document...</p>
  </div>
  
  <div class="hs-collab-editor-status">
    <div class="hs-collab-users">
      <span class="hs-collab-user-count">0</span> users editing
    </div>
    <div class="hs-collab-connection hs-connection-status-connected">
      <i class="bi-circle-fill"></i> Connected
    </div>
  </div>
</div>

<script>
  const editor = new HSCollabEditor('#documentEditor', {
    docId: 'unique-document-id',
    websocketUrl: 'wss://collab.example.com',
    onOperation: (op) => {
      // Transform and apply operation
    },
    onPresenceUpdate: (users) => {
      updateUserPresence(users);
    },
    richTextOptions: {
      formats: {
        bold: { tag: 'strong' },
        italic: { tag: 'em' }
      }
    }
  });

  // Register toolbar handlers
  document.querySelectorAll('.hs-format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editor.execCommand(btn.dataset.command);
    });
  });
</script>
          `
        }
      ]
    },
    {
      description: "Interactive Data Visualization Dashboard - A dynamic dashboard featuring multiple chart types with cross-filtering capabilities using Preline's chart components with D3.js integration.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-data-dashboard" id="analyticsDashboard">
  <div class="hs-dashboard-filters">
    <div class="hs-filter-group">
      <label>Date Range</label>
      <div class="hs-date-range-picker">
        <input type="date" class="hs-date-start">
        <span>to</span>
        <input type="date" class="hs-date-end">
      </div>
    </div>
    <!-- More filters -->
  </div>
  
  <div class="hs-dashboard-grid">
    <div class="hs-chart-container" data-chart-type="line" data-source="revenue">
      <div class="hs-chart-header">
        <h3>Revenue Trend</h3>
        <div class="hs-chart-actions">
          <button class="hs-chart-export"><i class="bi-download"></i></button>
        </div>
      </div>
      <div class="hs-chart-body">
        <svg class="hs-line-chart"></svg>
      </div>
    </div>
    
    <div class="hs-chart-container" data-chart-type="bar" data-source="conversion">
      <!-- Bar Chart -->
    </div>
    
    <div class="hs-chart-container" data-chart-type="pie" data-source="traffic">
      <!-- Pie Chart -->
    </div>
  </div>
</div>

<script>
  const dashboard = new HSDataDashboard('#analyticsDashboard', {
    dataSource: '/api/analytics',
    crossFilter: true,
    chartDefaults: {
      margin: { top: 20, right: 20, bottom: 30, left: 40 },
      colorScheme: 'hsCategory10'
    },
    onFilterChange: (filters) => {
      return fetchWithFilters(filters);
    },
    onChartInit: (chartElement, chartType) => {
      switch(chartType) {
        case 'line':
          return initLineChart(chartElement);
        case 'bar':
          return initBarChart(chartElement);
        case 'pie':
          return initPieChart(chartElement);
      }
    }
  });

  function initLineChart(container) {
    const svg = container.querySelector('svg');
    // D3.js chart initialization
  }
</script>
          `
        }
      ]
    },
    {
      description: "Multi-Select with Tagging and Remote Data - An enhanced select component supporting tagging, remote data loading, and custom templates using Preline's select2 integration with advanced features.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-form-group">
  <label class="hs-form-label">Assign Team Members</label>
  <select class="hs-tagging-select" multiple 
          data-placeholder="Select or add team members"
          data-allow-clear="true"
          data-tags="true"
          data-ajax-url="/api/users/search">
  </select>
</div>

<script>
  const taggingSelect = new HSTaggingSelect('.hs-tagging-select', {
    minimumInputLength: 2,
    templateResult: (user) => {
      if (user.loading) return user.text;
      return \`
        <div class="hs-user-option">
          <img src="\${user.avatar}" class="hs-user-avatar">
          <span class="hs-user-name">\${user.name}</span>
          <span class="hs-user-email">\${user.email}</span>
        </div>
      \`;
    },
    templateSelection: (user) => {
      return \`
        <span class="hs-selected-tag">
          <img src="\${user.avatar}" class="hs-tag-avatar">
          \${user.name}
        </span>
      \`;
    },
    createTag: (params) => {
      return {
        id: params.term,
        text: params.term,
        isNew: true
      };
    },
    insertTag: (data, tag) => {
      data.push(tag);
    }
  });

  taggingSelect.on('change', (e) => {
    console.log('Selected items:', e.target.value);
  });
</script>
          `
        }
      ]
    },
    {
      description: "Interactive Map with Geospatial Features - A vector map component with zoom controls, marker clustering, and geospatial querying using Preline's map plugin with Leaflet integration.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-map-container" id="interactiveMap">
  <div class="hs-map-toolbar">
    <button class="hs-map-zoom-in"><i class="bi-plus"></i></button>
    <button class="hs-map-zoom-out"><i class="bi-dash"></i></button>
    <button class="hs-map-locate"><i class="bi-geo-alt"></i></button>
  </div>
  <div class="hs-map-layer-control">
    <div class="hs-map-layer-toggle" data-layer="traffic">Traffic</div>
    <div class="hs-map-layer-toggle" data-layer="satellite">Satellite</div>
  </div>
  <div class="hs-map"></div>
</div>

<script>
  const map = new HSMap('#interactiveMap', {
    center: [40.7128, -74.0060],
    zoom: 12,
    layers: {
      base: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      traffic: '/map-layers/traffic',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    },
    markers: '/api/locations',
    cluster: true,
    clusterOptions: {
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true
    },
    onMarkerClick: (marker) => {
      showMarkerPopup(marker);
    },
    onMapClick: (latlng) => {
      addNewMarker(latlng);
    }
  });

  document.querySelectorAll('.hs-map-layer-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      map.toggleLayer(toggle.dataset.layer);
    });
  });
</script>
          `
        }
      ]
    },
    {
      description: "Real-Time Monitoring Dashboard - A live-updating dashboard with gauges, alerts, and threshold indicators using Preline's visualization components with WebSocket streaming.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-monitoring-dashboard" id="serverMonitoring">
  <div class="hs-monitoring-header">
    <h2>Server Cluster Performance</h2>
    <div class="hs-monitoring-refresh">
      <span class="hs-last-updated">Last updated: <span class="hs-update-time">--:--:--</span></span>
      <button class="hs-btn hs-btn-sm hs-monitoring-refresh-btn"><i class="bi-arrow-clockwise"></i> Refresh</button>
    </div>
  </div>
  
  <div class="hs-monitoring-grid">
    <div class="hs-monitoring-gauge" data-metric="cpu">
      <div class="hs-gauge-container">
        <svg class="hs-gauge" viewBox="0 0 100 100">
          <path class="hs-gauge-background" d="M 10,50 A 40,40 0 1,1 90,50 A 40,40 0 1,1 10,50"/>
          <path class="hs-gauge-arc" stroke-dasharray="0, 251.2" d="M 10,50 A 40,40 0 1,1 90,50 A 40,40 0 1,1 10,50"/>
        </svg>
        <div class="hs-gauge-value">0%</div>
      </div>
      <div class="hs-gauge-label">CPU Usage</div>
    </div>
    
    <div class="hs-monitoring-alerts">
      <div class="hs-alerts-header">
        <h3>Active Alerts</h3>
        <span class="hs-alert-count">0</span>
      </div>
      <div class="hs-alerts-list"></div>
    </div>
  </div>
</div>

<script>
  const monitor = new HSMonitoringDashboard('#serverMonitoring', {
    refreshInterval: 5000,
    thresholds: {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 75, critical: 90 }
    },
    onRefresh: () => {
      return fetch('/api/server-stats')
        .then(updateDashboard)
        .then(updateLastRefreshed);
    },
    onAlert: (alert) => {
      addAlertToPanel(alert);
      if (alert.severity === 'critical') {
        showCriticalAlertNotification(alert);
      }
    }
  });

  const ws = new WebSocket('wss://monitoring.example.com/realtime');
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    monitor.updateMetrics(data);
  };
</script>
          `
        }
      ]
    },
    {
      description: "Accessible Modal Dialog System - A fully accessible modal system with focus trapping, keyboard navigation, and animated transitions using Preline's modal plugin with enhanced accessibility features.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-modal" id="advancedModal" aria-hidden="true">
  <div class="hs-modal-overlay" tabindex="-1" data-hs-modal-close>
    <div class="hs-modal-container" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="hs-modal-header">
        <h2 id="modalTitle">Advanced Settings</h2>
        <button class="hs-modal-close" aria-label="Close modal" data-hs-modal-close>
          &times;
        </button>
      </div>
      
      <div class="hs-modal-body">
        <form id="settingsForm">
          <!-- Form fields -->
        </form>
      </div>
      
      <div class="hs-modal-footer">
        <button class="hs-btn hs-btn-secondary" data-hs-modal-close>Cancel</button>
        <button class="hs-btn hs-btn-primary" type="submit" form="settingsForm">Save Changes</button>
      </div>
    </div>
  </div>
</div>

<script>
  const modal = new HSModal('#advancedModal', {
    animation: 'fade',
    animationSpeed: 300,
    focusTrap: true,
    restoreFocus: true,
    onOpen: (modal) => {
      trackModalView(modal.id);
    },
    onClose: (modal) => {
      if (document.getElementById('settingsForm').checkValidity()) {
        submitSettings();
      }
    }
  });

  document.getElementById('openModal').addEventListener('click', () => {
    modal.open();
  });
</script>
          `
        }
      ]
    },
    {
      description: "Custom Form Builder with Drag-and-Drop - A visual form designer allowing users to create custom forms by dragging fields from a palette using Preline's sortable plugin with form schema generation.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-form-builder" id="formDesigner">
  <div class="hs-form-palette">
    <div class="hs-palette-header">Form Fields</div>
    <div class="hs-palette-body">
      <div class="hs-palette-field" draggable="true" data-type="text">
        <i class="bi-input-cursor-text"></i> Text Input
      </div>
      <div class="hs-palette-field" draggable="true" data-type="select">
        <i class="bi-menu-down"></i> Dropdown
      </div>
      <!-- More field types -->
    </div>
  </div>
  
  <div class="hs-form-canvas">
    <div class="hs-form-preview">
      <form id="formPreview"></form>
    </div>
  </div>
  
  <div class="hs-form-properties">
    <div class="hs-properties-header">Field Properties</div>
    <div class="hs-properties-body">
      <div class="hs-property-editor" id="fieldProperties"></div>
    </div>
  </div>
</div>

<script>
  const formBuilder = new HSFormBuilder('#formDesigner', {
    onFieldAdd: (fieldType) => {
      return createFormField(fieldType);
    },
    onFieldUpdate: (fieldId, properties) => {
      updateFormField(fieldId, properties);
    },
    onFormSave: () => {
      return generateFormSchema();
    },
    fieldTypes: {
      text: {
        label: 'Text Input',
        icon: 'bi-input-cursor-text',
        properties: {
          label: { type: 'string', default: 'Text Field' },
          required: { type: 'boolean', default: false }
        }
      },
      select: {
        label: 'Dropdown',
        icon: 'bi-menu-down',
        properties: {
          label: { type: 'string', default: 'Select Option' },
          options: { type: 'array', default: ['Option 1', 'Option 2'] }
        }
      }
    }
  });

  function createFormField(type) {
    const field = document.createElement('div');
    field.className = 'hs-form-field';
    field.dataset.type = type;
    field.innerHTML = formBuilder.getFieldTemplate(type);
    return field;
  }
</script>
          `
        }
      ]
    },
    {
      description: "Advanced Data Grid with Excel-like Features - A spreadsheet-like data grid supporting formulas, cell formatting, and bulk operations using Preline's grid component with custom extensions.",
      code: [
        {
          language: "html",
          content: `
<div class="hs-data-grid" id="spreadsheetGrid">
  <div class="hs-grid-toolbar">
    <div class="hs-grid-actions">
      <button class="hs-btn hs-btn-sm hs-grid-add-row"><i class="bi-plus-lg"></i> Add Row</button>
      <button class="hs-btn hs-btn-sm hs-grid-delete-row"><i class="bi-trash"></i> Delete</button>
    </div>
    <div class="hs-grid-formulas">
      <input type="text" class="hs-formula-bar" placeholder="Formula">
    </div>
  </div>
  
  <div class="hs-grid-container">
    <div class="hs-grid-header">
      <div class="hs-grid-corner"></div>
      <div class="hs-grid-column-headers"></div>
    </div>
    <div class="hs-grid-body"></div>
  </div>
  
  <div class="hs-grid-status">
    <span class="hs-grid-mode">Ready</span>
    <span class="hs-grid-selection-count">0 cells selected</span>
  </div>
</div>

<script>
  const dataGrid = new HSDataGrid('#spreadsheetGrid', {
    columns: [
      { id: 'id', title: 'ID', type: 'number', width: 80 },
      { id: 'name', title: 'Name', type: 'string', width: 150 },
      { id: 'price', title: 'Price', type: 'number', format: 'currency' },
      { id: 'quantity', title: 'Qty', type: 'number' },
      { id: 'total', title: 'Total', type: 'formula', formula: 'price*quantity' }
    ],
    data: '/api/products',
    editable: true,
    selectable: true,
    rowHeight: 32,
    onCellEdit: (changes) => {
      return saveCellChanges(changes);
    },
    onSelectionChange: (selection) => {
      updateStatusBar(selection);
    },
    formulaEngine: {
      functions: {
        SUM: (args) => args.reduce((a, b) => a + b, 0),
        AVG: (args) => args.reduce((a, b) => a + b, 0) / args.length
      }
    }
  });

  document.querySelector('.hs-formula-bar').addEventListener('change', (e) => {
    dataGrid.setActiveCellFormula(e.target.value);
  });
</script>
          `
        }
      ]
    }
  ]
},
{
  id: "css-scrollbar-hiding",
  title: "Hiding Scrollbars Completely (CSS)",
  created: 1716861457,
  updated: 1716861999,
  steps: [
    {
      description: "## Complete Scrollbar Removal\n\nHide scrollbars while maintaining functionality:",
      code: [
        {
          language: "css",
          content: `
::-webkit-scrollbar {
  display: none;
}
html {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
          `
        }
      ]
    },
    {
      description: "## Custom Scroll Container\n\nCreate a scrollable div without visible scrollbars:",
      code: [
        {
          language: "css",
          content: `
.scroll-container {
  overflow: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-container::-webkit-scrollbar {
  width: 0;
  height: 0;
}
          `
        }
      ]
    }
  ]
},
{
  id: "preline-cdn",
  title: "Preline CDN Implementation",
  created: 1716862457,
  updated: 1716862999,
  steps: [
    {
      description: "## Full Preline Setup\n\nInclude all required dependencies for Preline components:",
      code: [
        {
          language: "html",
          content: `
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@preline/overlay@latest/dist/overlay.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@preline/dropdown@latest/dist/dropdown.min.css">
<script src="https://cdn.jsdelivr.net/npm/@preline/overlay@latest/dist/overlay.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@preline/dropdown@latest/dist/dropdown.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@preline/collapse@latest/dist/collapse.min.js"></script>
          `
        }
      ]
    },
    {
      description: "## Dynamic Component Initialization\n\nInitialize Preline components after DOM load:",
      code: [
        {
          language: "javascript",
          content: `
document.addEventListener('DOMContentLoaded', () => {
  HSOverlay.autoInit();
  HSDropdown.autoInit();
  HSCollapse.autoInit();
});
          `
        }
      ]
    }
  ]
},
{
  id: "iframe-src-doc",
  title: "Advanced iFrame Techniques",
  created: 1716863457,
  updated: 1716863999,
  steps: [
    {
      description: "## iFrame with SRC Attribute\n\nSecure implementation with sandboxing:",
      code: [
        {
          language: "html",
          content: `
<iframe src="https://example.com" 
        sandbox="allow-same-origin allow-scripts allow-popups"
        allow="fullscreen"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin">
</iframe>
          `
        }
      ]
    },
    {
      description: "## iFrame with srcdoc\n\nDynamic content injection with CSP considerations:",
      code: [
        {
          language: "html",
          content: `
<iframe srcdoc="<!DOCTYPE html><html><head>
  <meta http-equiv='Content-Security-Policy' content='default-src &apos;self&apos;'>
</head><body><h1>Dynamic Content</h1></body></html>"
  sandbox="allow-scripts">
</iframe>
          `
        }
      ]
    }
  ]
},
{
  id: "webgl-threejs-shaders",
  title: "WebGL Shader Animation with Three.js",
  created: 1716865000,
  updated: 1716866000,
  steps: [
    {
      description: `
      Example goes here.  This is example text and it goes here to better determine how the layout rendering will be displayed in order to make any necessary changes.
      
      Example goes here.  This is example text and it goes here to better determine how the layout rendering will be displayed in order to make any necessary changes.
      
      Example goes here.  This is example text and it goes here to better determine how the layout rendering will be displayed in order to make any necessary changes.
      
      Example goes here.  This is example text and it goes here to better determine how the layout rendering will be displayed in order to make any necessary changes.
      `,
      code: [
        {
          language: "javascript",
          content: `
const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
  },
  vertexShader: '
    uniform float time;
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      vec3 newPosition = position + normal * sin(time) * 0.2;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  ',
  fragmentShader: '
    varying vec3 vPosition;
    void main() {
      vec3 color = vec3(abs(sin(vPosition.x)), abs(cos(vPosition.y)), abs(sin(vPosition.z)));
      gl_FragColor = vec4(color, 1.0);
    }
  '
});


const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    resolution: { value: new THREE.Vector2() }
  },
  vertexShader: '
    uniform float time;
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      vec3 newPosition = position + normal * sin(time) * 0.2;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  ',
  fragmentShader: '
    varying vec3 vPosition;
    void main() {
      vec3 color = vec3(abs(sin(vPosition.x)), abs(cos(vPosition.y)), abs(sin(vPosition.z)));
      gl_FragColor = vec4(color, 1.0);
    }
  '
});
          `
        }
      ]
    }
  ]
},
{
  id: "websocket-dataviz",
  title: "Real-time WebSocket Data Visualization",
  created: 1716867000,
  updated: 1716868000,
  steps: [
    {
      description: "High-frequency data streaming with buffering",
      code: [
        {
          language: "javascript",
          content: `
const ws = new WebSocket('wss://data-stream.example.com');
const dataBuffer = new CircularBuffer(1000);
const ctx = chartCanvas.getContext('2d');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  dataBuffer.push(data.value);
  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(renderChart);
  }
};

function renderChart() {
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  const points = dataBuffer.getLast(60);
  ctx.beginPath();
  points.forEach((val, i) => {
    const x = i * (chartCanvas.width / points.length);
    const y = chartCanvas.height - (val * chartCanvas.height);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  animationFrameId = null;
}
          `
        }
      ]
    }
  ]
},
{
  id: "css-container-queries",
  title: "CSS Container Query Layouts",
  created: 1716869000,
  updated: 1716870000,
  steps: [
    {
      description: "Responsive components based on container size",
      code: [
        {
          language: "css",
          content: `
.card {
  container-type: inline-size;
}
@container (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
  .card__image {
    aspect-ratio: 1/1;
  }
}
@container (min-width: 800px) {
  .card {
    grid-template-columns: 1fr 3fr;
  grid-template-rows: auto 1fr;
  }
  .card__title {
    grid-column: span 2;
  }
}
          `
        }
      ]
    }
  ]
},
{
  id: "web-components-shadow",
  title: "Custom Web Components with Shadow DOM",
  created: 1716871000,
  updated: 1716872000,
  steps: [
    {
      description: "Encapsulated component with slots and styles",
      code: [
        {
          language: "javascript",
          content: `
class DataTable extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = '
      <style>
        :host {
          display: block;
          contain: content;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        ::slotted(th) {
          background: var(--header-bg, #333);
          color: white;
        }
      </style>
      <table>
        <thead><tr><slot name="header"></slot></tr></thead>
        <tbody><slot name="row"></slot></tbody>
      </table>
    ';
  }
}
customElements.define('data-table', DataTable);
          `
        }
      ]
    }
  ]
},
{
  id: "wasm-react-integration",
  title: "WASM Module Integration in React",
  created: 1716873000,
  updated: 1716874000,
  steps: [
    {
      description: "High-performance image processing pipeline",
      code: [
        {
          language: "javascript",
          content: `
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('image-processor.wasm'),
  {
    env: {
      memoryBase: 0,
      tableBase: 0,
      memory: new WebAssembly.Memory({ initial: 256 }),
      table: new WebAssembly.Table({ initial: 0, element: 'anyfunc' }),
      abort: console.error
    }
  }
);

function processImage(imageData) {
  const inputPtr = instance.exports.alloc(imageData.length);
  new Uint8Array(instance.exports.memory.buffer, inputPtr, imageData.length)
    .set(imageData);
  const outputPtr = instance.exports.process(inputPtr, imageData.length);
  const result = new Uint8Array(
    instance.exports.memory.buffer,
    outputPtr,
    imageData.length
  );
  instance.exports.free(inputPtr);
  instance.exports.free(outputPtr);
  return result;
}
          `
        }
      ]
    }
  ]
},
{
  id: "web-crypto-api",
  title: "Web Cryptography API",
  created: 1716875000,
  updated: 1716876000,
  steps: [
    {
      description: "End-to-end encryption implementation",
      code: [
        {
          language: "javascript",
          content: `
async function generateKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-512'
    },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptMessage(publicKey, message) {
  const encoded = new TextEncoder().encode(message);
  return await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    encoded
  );
}

async function decryptMessage(privateKey, ciphertext) {
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}
          `
        }
      ]
    }
  ]
},
{
  id: "webgpu-pipeline",
  title: "WebGPU Basic Pipeline",
  created: 1716877000,
  updated: 1716878000,
  steps: [
    {
      description: "Compute shader for particle simulation",
      code: [
        {
          language: "javascript",
          content: `
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const computeShader = device.createShaderModule({
  code: '
    @group(0) @binding(0) var<storage, read_write> particles: array<vec2<f32>>;
    @group(0) @binding(1) var<uniform> params: vec2<f32>;
    @compute @workgroup_size(64)
    fn main(@builtin(global_invocation_id) id: vec3<u32>) {
      let idx = id.x;
      particles[idx] = particles[idx] + vec2<f32>(0.0, -9.8) * params.x;
    }
  '
});
const pipeline = device.createComputePipeline({
  layout: 'auto',
  compute: { module: computeShader, entryPoint: 'main' }
});
          `
        }
      ]
    }
  ]
},
{
  id: "svg-filter-effects",
  title: "Advanced SVG Filter Effects",
  created: 1716879000,
  updated: 1716880000,
  steps: [
    {
      description: "Custom displacement map animation",
      code: [
        {
          language: "html",
          content: `
<svg width="0" height="0">
  <filter id="turbulence" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" seed="1" result="turbulence"/>
    <feDisplacementMap in2="turbulence" in="SourceGraphic" scale="20" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
</svg>
<animate xlink:href="#turbulence" attributeName="seed" from="1" to="100" dur="10s" repeatCount="indefinite"/>
          `
        }
      ]
    }
  ]
},
];