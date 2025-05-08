<?php
// api/snippets.php - API endpoint for managing code snippets with JSON storage

// Enable error reporting during development (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set headers for JSON API response
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Prevent direct access if not via AJAX (optional security measure)
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    // Uncomment in production for added security
    // respond(false, "Direct access not allowed");
}

// Configuration
define('STORAGE_FILE', './data/snippets.json');
define('DATA_DIR', './data');
define('BACKUP_DIR', './data/backups');
define('MAX_BACKUPS', 5);

// Ensure data directory exists
if (!file_exists(DATA_DIR)) {
    if (!mkdir(DATA_DIR, 0755, true)) {
        respond(false, "Failed to create data directory");
    }
}

// Ensure backup directory exists
if (!file_exists(BACKUP_DIR)) {
    if (!mkdir(BACKUP_DIR, 0755, true)) {
        // Not critical, just log the error
        error_log("Failed to create backup directory");
    }
}

// Ensure storage file exists
if (!file_exists(STORAGE_FILE)) {
    $defaultData = json_encode(['snippets' => []], JSON_PRETTY_PRINT);
    if (file_put_contents(STORAGE_FILE, $defaultData, LOCK_EX) === false) {
        respond(false, "Failed to create storage file");
    }
    chmod(STORAGE_FILE, 0644);
}

// Helper function to send JSON response
function respond($success, $message = '', $data = null) {
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response = array_merge($response, $data);
    }
    
    echo json_encode($response);
    exit;
}

// Helper function to create a backup of the data file
function createBackup() {
    if (!file_exists(STORAGE_FILE)) {
        return false;
    }
    
    // Create backup filename with timestamp
    $backupFile = BACKUP_DIR . '/snippets_' . date('Y-m-d_H-i-s') . '.json';
    
    // Copy current file to backup
    if (!copy(STORAGE_FILE, $backupFile)) {
        error_log("Failed to create backup: $backupFile");
        return false;
    }
    
    // Limit the number of backup files
    $backups = glob(BACKUP_DIR . '/snippets_*.json');
    if (count($backups) > MAX_BACKUPS) {
        // Sort by modified time (oldest first)
        usort($backups, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        
        // Delete oldest backups
        $toDelete = array_slice($backups, 0, count($backups) - MAX_BACKUPS);
        foreach ($toDelete as $file) {
            unlink($file);
        }
    }
    
    return true;
}

// Helper function to read snippets from storage
function readSnippets() {
    if (!file_exists(STORAGE_FILE)) {
        return ['snippets' => []];
    }
    
    // Get an exclusive lock for reading
    $fp = fopen(STORAGE_FILE, 'r');
    if (!$fp) {
        respond(false, "Failed to open storage file for reading");
    }
    
    if (!flock($fp, LOCK_SH)) {
        fclose($fp);
        respond(false, "Failed to acquire shared lock for reading");
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
        respond(false, "Failed to parse storage file: " . json_last_error_msg());
    }
    
    if (!isset($json['snippets'])) {
        $json['snippets'] = [];
    }
    
    return $json;
}

// Helper function to write snippets to storage
function writeSnippets($data) {
    // Create a backup before writing
    createBackup();
    
    $json = json_encode($data, JSON_PRETTY_PRINT);
    if ($json === false) {
        respond(false, "Failed to encode data: " . json_last_error_msg());
    }
    
    // Get an exclusive lock for writing
    $fp = fopen(STORAGE_FILE, 'w');
    if (!$fp) {
        respond(false, "Failed to open storage file for writing");
    }
    
    if (!flock($fp, LOCK_EX)) {
        fclose($fp);
        respond(false, "Failed to acquire exclusive lock for writing");
    }
    
    $bytesWritten = fwrite($fp, $json);
    
    flock($fp, LOCK_UN);
    fclose($fp);
    
    if ($bytesWritten === false) {
        respond(false, "Failed to write to storage file");
    }
    
    return true;
}

// Format code based on language
function formatCode($code, $language) {
    // Remove carriage returns to normalize line endings
    $code = str_replace("\r\n", "\n", $code);
    $code = str_replace("\r", "\n", $code);
    
    switch ($language) {
        case 'html':
            return formatHtml($code);
        case 'css':
            return formatCss($code);
        case 'javascript':
            return formatJavaScript($code);
        case 'php':
            return formatPhp($code);
        default:
            return $code;
    }
}

// Format HTML
function formatHtml($code) {
    // If DOMDocument is available, use it
    if (class_exists('DOMDocument')) {
        // Load DOM document
        $dom = new DOMDocument();
        
        // Preserve whitespace for formatting
        $dom->preserveWhiteSpace = false;
        $dom->formatOutput = true;
        
        // Suppress warnings from malformed HTML
        libxml_use_internal_errors(true);
        
        // Try to load HTML
        $dom->loadHTML($code, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        
        // Clear errors
        libxml_clear_errors();
        
        // Get formatted HTML
        $formatted = $dom->saveHTML();
        
        // If DOM parsing failed, use simple formatter
        if (!$formatted) {
            return simpleHtmlFormat($code);
        }
        
        return $formatted;
    }
    
    // Fallback to simple formatter
    return simpleHtmlFormat($code);
}

// Simple HTML formatter as fallback
function simpleHtmlFormat($code) {
    $formatted = '';
    $indent = 0;
    
    // Split by line break
    $lines = explode("\n", $code);
    
    foreach ($lines as $line) {
        // Trim the line
        $trimmedLine = trim($line);
        
        // Skip empty lines
        if (empty($trimmedLine)) {
            $formatted .= "\n";
            continue;
        }
        
        // Check if this line is an ending tag
        if (preg_match('/^<\/\w/', $trimmedLine)) {
            $indent = max(0, $indent - 1);
        }
        
        // Add indentation
        $formatted .= str_repeat('  ', $indent) . $trimmedLine . "\n";
        
        // Check if this line is a starting tag and not self-closing
        if (preg_match('/^<\w[^>]*[^\/]>$/', $trimmedLine) && 
            !preg_match('/^<(br|hr|img|input|link|meta|area|base|col|embed|keygen|param|source)\b/i', $trimmedLine)) {
            $indent++;
        }
    }
    
    return $formatted;
}

// Format CSS
function formatCss($code) {
    // Normalize whitespace
    $code = preg_replace('/\s+/', ' ', $code);
    
    // Add newline after semicolons
    $code = preg_replace('/;/', ";\n  ", $code);
    
    // Add newline after opening braces
    $code = preg_replace('/{/', " {\n  ", $code);
    
    // Add newline before closing braces
    $code = preg_replace('/}/', "\n}", $code);
    
    // Add newline after closing braces
    $code = preg_replace('/}/', "}\n", $code);
    
    // Clean up multiple newlines
    $code = preg_replace('/\n\s*\n/', "\n", $code);
    
    return $code;
}

// Format JavaScript
function formatJavaScript($code) {
    $formatted = '';
    $indent = 0;
    $inString = false;
    $stringChar = '';
    $inComment = false;
    $multilineComment = false;
    
    $lines = explode("\n", $code);
    
    foreach ($lines as $line) {
        $trimmedLine = trim($line);
        
        if (empty($trimmedLine)) {
            $formatted .= "\n";
            continue;
        }
        
        // Check if this line ends a block
        if (preg_match('/^[\s]*[})\]]\s*[,;]?[\s]*$/', $trimmedLine)) {
            $indent = max(0, $indent - 1);
        }
        
        // Add indentation
        $formatted .= str_repeat('  ', $indent) . $trimmedLine . "\n";
        
        // Check if this line starts a block
        if (preg_match('/[{(\[][\s]*$/', $trimmedLine)) {
            $indent++;
        }
    }
    
    return $formatted;
}

// Format PHP
function formatPhp($code) {
    $formatted = '';
    $indent = 0;
    
    // Split by line break
    $lines = explode("\n", $code);
    
    foreach ($lines as $line) {
        // Trim the line
        $trimmedLine = trim($line);
        
        // Skip empty lines
        if (empty($trimmedLine)) {
            $formatted .= "\n";
            continue;
        }
        
        // Check if this line ends a block
        if (preg_match('/^[\s]*[})\]]\s*[,;]?[\s]*$/', $trimmedLine)) {
            $indent = max(0, $indent - 1);
        }
        
        // Add indentation
        $formatted .= str_repeat('  ', $indent) . $trimmedLine . "\n";
        
        // Check if this line starts a block
        if (preg_match('/[{(\[][\s]*$/', $trimmedLine)) {
            $indent++;
        }
    }
    
    return $formatted;
}

// Minify code for storage
function minifyCode($code, $language) {
    switch ($language) {
        case 'html':
            return minifyHtml($code);
        case 'css':
            return minifyCss($code);
        case 'javascript':
            return minifyJs($code);
        case 'php':
            return minifyPhp($code);
        default:
            return $code;
    }
}

// Minify HTML
function minifyHtml($code) {
    // Remove comments
    $code = preg_replace('/<!--(.|\s)*?-->/', '', $code);
    
    // Remove whitespace between tags
    $code = preg_replace('/>\s+</', '><', $code);
    
    // Remove leading/trailing whitespace
    $code = preg_replace('/^\s+|\s+$/m', '', $code);
    
    // Combine multiple whitespace
    $code = preg_replace('/\s{2,}/', ' ', $code);
    
    return $code;
}

// Minify CSS
function minifyCss($code) {
    // Remove comments
    $code = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $code);
    
    // Remove whitespace
    $code = preg_replace('/\s+/', ' ', $code);
    
    // Remove whitespace around operators
    $code = preg_replace('/\s*([{}:;,])\s*/', '$1', $code);
    
    // Remove trailing semicolons
    $code = str_replace(';}', '}', $code);
    
    return trim($code);
}

// Minify JavaScript
function minifyJs($code) {
    // Remove single-line comments
    $code = preg_replace('~//.*$~m', '', $code);
    
    // Remove multi-line comments
    $code = preg_replace('~/\*.*?\*/~s', '', $code);
    
    // Remove whitespace
    $code = preg_replace('/\s+/', ' ', $code);
    
    // Remove whitespace around operators
    $code = preg_replace('/\s*([{}:;,=\(\)\[\]])\s*/', '$1', $code);
    
    return trim($code);
}

// Minify PHP
function minifyPhp($code) {
    // Extract PHP code without tags
    $pattern = '/^<\?php(.*)(\?>)?$/s';
    if (preg_match($pattern, $code, $matches)) {
        $phpCode = $matches[1];
        
        // Remove comments
        $phpCode = preg_replace('~//.*$~m', '', $phpCode);
        $phpCode = preg_replace('~/\*.*?\*/~s', '', $phpCode);
        
        // Remove whitespace
        $phpCode = preg_replace('/\s+/', ' ', $phpCode);
        
        // Remove whitespace around operators
        $phpCode = preg_replace('/\s*([{}:;,=\(\)\[\]])\s*/', '$1', $phpCode);
        
        // Reconstruct PHP tags
        return "<?php" . trim($phpCode) . (isset($matches[2]) ? "?>" : "");
    }
    
    return $code;
}

// Validate input
function validateInput($data, $required = []) {
    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            respond(false, "Field '$field' is required.");
        }
    }
    
    // Validate language if provided
    if (isset($data['language'])) {
        $allowedLanguages = ['html', 'css', 'javascript', 'php'];
        if (!in_array($data['language'], $allowedLanguages)) {
            respond(false, "Invalid language. Allowed values: " . implode(', ', $allowedLanguages));
        }
    }
    
    return true;
}

// Generate a unique ID
function generateId() {
    return uniqid() . '-' . bin2hex(random_bytes(4));
}

// Handle snippet listing
function listSnippets() {
    $data = readSnippets();
    
    // Sort snippets by creation date (newest first)
    usort($data['snippets'], function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    respond(true, "Snippets retrieved successfully", ['snippets' => $data['snippets']]);
}

// Handle snippet retrieval
function getSnippet($id) {
    $data = readSnippets();
    
    // Find snippet by ID
    $snippet = null;
    foreach ($data['snippets'] as $s) {
        if ($s['id'] === $id) {
            $snippet = $s;
            break;
        }
    }
    
    if (!$snippet) {
        respond(false, "Snippet not found.");
    }
    
    respond(true, "Snippet retrieved successfully", ['snippet' => $snippet]);
}

// Handle snippet creation
function createSnippet($data) {
    validateInput($data, ['title', 'language', 'code']);
    
    $title = trim($data['title']);
    $language = trim($data['language']);
    $code = $data['code'];
    
    // Format the code for display
    $formattedCode = formatCode($code, $language);
    
    // Minify the code for storage
    $minifiedCode = minifyCode($code, $language);
    
    // Create new snippet
    $snippet = [
        'id' => generateId(),
        'title' => $title,
        'language' => $language,
        'code' => $formattedCode, // Store formatted code for display
        'minified_code' => $minifiedCode, // Store minified code
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    
    // Load existing snippets
    $data = readSnippets();
    
    // Add new snippet to beginning of array
    array_unshift($data['snippets'], $snippet);
    
    // Save to file
    if (!writeSnippets($data)) {
        respond(false, "Failed to save snippet.");
    }
    
    respond(true, "Snippet created successfully", ['snippet' => $snippet]);
}

// Handle snippet update
function updateSnippet($data) {
    validateInput($data, ['id', 'title', 'language', 'code']);
    
    $id = $data['id'];
    $title = trim($data['title']);
    $language = trim($data['language']);
    $code = $data['code'];
    
    // Format the code for display
    $formattedCode = formatCode($code, $language);
    
    // Minify the code for storage
    $minifiedCode = minifyCode($code, $language);
    
    // Load existing snippets
    $data = readSnippets();
    
    // Find and update snippet
    $found = false;
    foreach ($data['snippets'] as &$snippet) {
        if ($snippet['id'] === $id) {
            $snippet['title'] = $title;
            $snippet['language'] = $language;
            $snippet['code'] = $formattedCode;
            $snippet['minified_code'] = $minifiedCode;
            $snippet['updated_at'] = date('Y-m-d H:i:s');
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        respond(false, "Snippet not found.");
    }
    
    // Save to file
    if (!writeSnippets($data)) {
        respond(false, "Failed to update snippet.");
    }
    
    respond(true, "Snippet updated successfully");
}

// Handle snippet deletion
function deleteSnippet($id) {
    // Load existing snippets
    $data = readSnippets();
    
    // Find and remove snippet
    $found = false;
    foreach ($data['snippets'] as $key => $snippet) {
        if ($snippet['id'] === $id) {
            unset($data['snippets'][$key]);
            $found = true;
            break;
        }
    }
    
    if (!$found) {
        respond(false, "Snippet not found.");
    }
    
    // Reindex array
    $data['snippets'] = array_values($data['snippets']);
    
    // Save to file
    if (!writeSnippets($data)) {
        respond(false, "Failed to delete snippet.");
    }
    
    respond(true, "Snippet deleted successfully");
}

// Handle search
function searchSnippets($query) {
    $query = trim(strtolower($query));
    
    if (empty($query)) {
        respond(false, "Search query is required.");
    }
    
    $data = readSnippets();
    $results = [];
    
    foreach ($data['snippets'] as $snippet) {
        // Search in title, code, and language
        if (strpos(strtolower($snippet['title']), $query) !== false ||
            strpos(strtolower($snippet['code']), $query) !== false ||
            strpos(strtolower($snippet['language']), $query) !== false) {
            $results[] = $snippet;
        }
    }
    
    respond(true, "Search completed", ['snippets' => $results]);
}

// Process the request based on the action parameter
function processRequest() {
    // Determine request method
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'GET') {
        // Handle GET requests
        if (!isset($_GET['action'])) {
            respond(false, "Action parameter is required.");
        }
        
        $action = $_GET['action'];
        
        switch ($action) {
            case 'list':
                listSnippets();
                break;
            case 'get':
                if (!isset($_GET['id'])) {
                    respond(false, "ID parameter is required for 'get' action.");
                }
                getSnippet($_GET['id']);
                break;
            case 'search':
                if (!isset($_GET['query'])) {
                    respond(false, "Query parameter is required for 'search' action.");
                }
                searchSnippets($_GET['query']);
                break;
            default:
                respond(false, "Invalid action. Allowed GET actions: list, get, search");
        }
    } elseif ($method === 'POST') {
        // Handle POST requests
        if (!isset($_POST['action'])) {
            respond(false, "Action parameter is required.");
        }
        
        $action = $_POST['action'];
        
        switch ($action) {
            case 'create':
                createSnippet($_POST);
                break;
            case 'update':
                updateSnippet($_POST);
                break;
            case 'delete':
                if (!isset($_POST['id'])) {
                    respond(false, "ID parameter is required for 'delete' action.");
                }
                deleteSnippet($_POST['id']);
                break;
            default:
                respond(false, "Invalid action. Allowed POST actions: create, update, delete");
        }
    } else {
        respond(false, "Invalid request method. Allowed methods: GET, POST");
    }
}

// Start processing the request
processRequest();