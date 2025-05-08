<?php
header('Content-Type: application/json');

$databaseFile = 'snippets/database.json';

if (file_exists($databaseFile)) {
    $database = json_decode(file_get_contents($databaseFile), true);
    echo json_encode(array_values($database));
} else {
    echo json_encode([]);
}