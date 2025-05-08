<?php
header('Content-Type: application/json');

$snippets = [];
$files = glob('./snippets/*.txt');

foreach ($files as $file) {
    $filename = basename($file);
    $parts = explode('_', str_replace('.txt', '', $filename));
    $id = $parts[0];
    $langId = $parts[1] ?? 'plaintext';
    
    if (!isset($snippets[$id])) {
        $snippets[$id] = [
            'id' => $id,
            'title' => 'Snippet ' . substr($id, 8), // Extract from 'snippet-123456'
            'languages' => [],
            'createdAt' => date('Y-m-d\TH:i:s\Z', filemtime($file))
        ];
    }
    
    $code = file_get_contents($file);
    $langName = ucfirst($langId);
    
    $snippets[$id]['languages'][] = [
        'id' => $langId,
        'name' => $langName,
        'code' => $code,
        'rawCode' => $code
    ];
}

echo json_encode(array_values($snippets));
?>