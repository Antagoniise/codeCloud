<?php
// Set headers
header('Content-Type: application/json');

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!$input || !isset($input['title']) || !isset($input['language']) || !isset($input['code'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid snippet data']);
    exit;
}

// Generate unique ID and filename
$snippetId = uniqid();
$filename = "snippets/{$snippetId}.php";

// Create snippet data
$snippetData = [
    'id' => $snippetId,
    'title' => $input['title'],
    'description' => $input['description'] ?? '',
    'language' => $input['language'],
    'framework' => $input['framework'] ?? null,
    'code' => $input['code'],
    'tags' => $input['tags'] ?? [],
    'visibility' => $input['visibility'] ?? 'public',
    'license' => $input['license'] ?? 'mit',
    'gistUrl' => $input['gistUrl'] ?? null,
    'isFavorite' => $input['isFavorite'] ?? false,
    'created' => $input['created'] ?? date('Y-m-d H:i:s'),
    'stars' => $input['stars'] ?? 0
];

// Create snippet file content
$fileContent = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$snippetData['title']} - Code Snippet</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/default.min.css">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .snippet-header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .snippet-title {
            font-size: 24px;
            margin: 0 0 10px;
        }
        .snippet-meta {
            color: #666;
            font-size: 14px;
        }
        .code-block {
            background: #f8f8f8;
            border-radius: 4px;
            overflow: hidden;
            margin: 20px 0;
        }
        .code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 15px;
            background: #e8e8e8;
            border-bottom: 1px solid #ddd;
        }
        .code-language {
            font-weight: bold;
            text-transform: capitalize;
        }
        .code-content {
            padding: 15px;
            overflow-x: auto;
        }
        pre {
            margin: 0;
            border: 2px solid crimson;
        }
    </style>
</head>
<body>
    <div class="snippet-header">
        <h1 class="snippet-title">{$snippetData['title']}</h1>
        <div class="snippet-meta">
            <span>Language: {$snippetData['language']}</span>
            <span> | </span>
            <span>Created: {$snippetData['created']}</span>
        </div>
    </div>
    
    <div class="snippet-description">
        <p>{$snippetData['description']}</p>
    </div>
    
    <div class="code-block">
        <div class="code-header">
            <span class="code-language">{$snippetData['language']}</span>
        </div>
        <div class="code-content">
            <pre><code class="language-{$snippetData['language']}"><?php echo htmlspecialchars(\$snippetData['code']); ?></code></pre>
        </div>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
    <script>hljs.highlightAll();</script>
</body>
</html>
HTML;

// Save the snippet file
if (file_put_contents($filename, $fileContent) {
    // Also save to a central database file (optional)
    $databaseFile = 'snippets/database.json';
    $database = file_exists($databaseFile) ? json_decode(file_get_contents($databaseFile), true) : [];
    $database[$snippetId] = $snippetData;
    file_put_contents($databaseFile, json_encode($database, JSON_PRETTY_PRINT));
    
    echo json_encode(['success' => true, 'id' => $snippetId]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save snippet file']);
}