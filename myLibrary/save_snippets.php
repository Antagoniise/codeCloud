<?php
// save_snippets.php - Backend for saving and retrieving code snippets

// Enable error reporting during development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers for JSON API response
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Configuration
define('STORAGE_FILE', __DIR__ . '/snippets_data.json');
define('BACKUP_DIR', __DIR__ . '/backups');
define('MAX_BACKUPS', 5);

// Ensure backup directory exists
if (!file_exists(BACKUP_DIR)) {
    if (!mkdir(BACKUP_DIR, 0755, true)) {
        error_log("Failed to create backup directory");
    }
}

// Create initial storage file if it doesn't exist
if (!file_exists(STORAGE_FILE)) {
    $initialData = [
        'snippets' => []
    ];
    file_put_contents(STORAGE_FILE, json_encode($initialData, JSON_PRETTY_PRINT));
    chmod(STORAGE_FILE, 0644);
}

// Helper function to send JSON response
function respond($success, $message = '', $data = null) {
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response);
    exit;
}

// Create backup of snippets file
function createBackup() {
    if (!file_exists(STORAGE_FILE)) return false;
    
    $backupFile = BACKUP_DIR . '/snippets_' . date('Y-m-d_H-i-s') . '.json';
    
    if (!copy(STORAGE_FILE, $backupFile)) {
        error_log("Failed to create backup");
        return false;
    }
    
    // Clean up old backups
    $backups = glob(BACKUP_DIR . '/snippets_*.json');
    if (count($backups) > MAX_BACKUPS) {
        usort($backups, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        
        $toDelete = array_slice($backups, 0, count($backups) - MAX_BACKUPS);
        foreach ($toDelete as $file) {
            unlink($file);
        }
    }
    
    return true;
}

// Read snippets from storage with file locking
function readSnippets() {
    if (!file_exists(STORAGE_FILE)) {
        return ['snippets' => []];
    }
    
    $fp = fopen(STORAGE_FILE, 'r');
    if (!$fp) {
        respond(false, "Failed to open storage file");
    }
    
    if (!flock($fp, LOCK_SH)) {
        fclose($fp);
        respond(false, "Failed to lock storage file");
    }
    
    $data = '';
    while (!feof($fp)) {
        $data .= fread($fp, 8192);
    }
    
    flock($fp, LOCK_UN);
    fclose($fp);
    
    if (empty($data)) {
        return ['snippets' => []];
    }
    
    $json = json_decode($data, true);
    if ($json === null) {
        respond(false, "Failed to parse storage file");
    }
    
    return $json;
}

// Write snippets to storage with file locking
function writeSnippets($data) {
    createBackup();
    
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        respond(false, "Failed to encode data");
    }
    
    $fp = fopen(STORAGE_FILE, 'w');
    if (!$fp) {
        respond(false, "Failed to open storage file for writing");
    }
    
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        respond(false, "Failed to lock storage file for writing");
    }
    
    $bytesWritten = fwrite($fp, $json);
    flock($fp, LOCK_UN);
    fclose($fp);
    
    if ($bytesWritten === false) {
        respond(false, "Failed to write to storage file");
    }
    
    return true;
}

// Handle POST request to save snippets
function handleSaveRequest() {
    // Get raw POST data
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if ($data === null) {
        respond(false, "Invalid JSON data received");
    }
    
    // Validate required fields
    if (empty($data['id']) || empty($data['title']) || empty($data['languages'])) {
        respond(false, "Missing required fields");
    }
    
    // Load existing snippets
    $snippetsData = readSnippets();
    
    // Check if snippet exists
    $existingIndex = null;
    foreach ($snippetsData['snippets'] as $index => $snippet) {
        if ($snippet['id'] === $data['id']) {
            $existingIndex = $index;
            break;
        }
    }
    
    // Prepare snippet data
    $snippet = [
        'id' => $data['id'],
        'title' => $data['title'],
        'languages' => [],
        'createdAt' => $existingIndex !== null 
            ? $snippetsData['snippets'][$existingIndex]['createdAt'] 
            : $data['createdAt'] ?? date('c'),
        'updatedAt' => date('c')
    ];
    
    // Process each language
    foreach ($data['languages'] as $langData) {
        if (empty($langData['id']) || empty($langData['code'])) {
            continue;
        }
        
        $snippet['languages'][] = [
            'id' => $langData['id'],
            'name' => $langData['name'] ?? $langData['id'],
            'code' => $langData['code']
        ];
    }
    
    // Update or add snippet
    if ($existingIndex !== null) {
        $snippetsData['snippets'][$existingIndex] = $snippet;
    } else {
        array_unshift($snippetsData['snippets'], $snippet);
    }
    
    // Save to file
    if (!writeSnippets($snippetsData)) {
        respond(false, "Failed to save snippets");
    }
    
    respond(true, "Snippet saved successfully", [
        'snippet' => $snippet,
        'totalSnippets' => count($snippetsData['snippets'])
    ]);
}

// Handle GET request to load snippets
function handleLoadRequest() {
    $snippetsData = readSnippets();
    
    // Sort by updatedAt (newest first)
    usort($snippetsData['snippets'], function($a, $b) {
        return strtotime($b['updatedAt']) - strtotime($a['updatedAt']);
    });
    
    respond(true, "Snippets loaded successfully", [
        'snippets' => $snippetsData['snippets']
    ]);
}

// Handle GET request for snippets_data.js
function handleJsDataRequest() {
    $snippetsData = readSnippets();
    
    header('Content-Type: application/javascript');
    echo "const snippetsData = " . json_encode($snippetsData['snippets'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . ";";
    exit;
}

// Route the request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    handleSaveRequest();
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['format']) && $_GET['format'] === 'js') {
        handleJsDataRequest();
    } else {
        handleLoadRequest();
    }
} else {
    respond(false, "Invalid request method");
}