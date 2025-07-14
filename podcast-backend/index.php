<?php
// Simple router for API
header('Content-Type: application/json');

// Get the request URI
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Basic response for root
if ($request_uri === '/' || $request_uri === '/index.php') {
    echo json_encode([
        'message' => 'Podcast API Server',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => '/api/auth/*',
            'podcasts' => '/api/podcasts/*'
        ]
    ]);
    exit;
}

// Let individual PHP files handle their routes
?>