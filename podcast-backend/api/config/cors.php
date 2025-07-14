<?php
// CORS setup optimized for large file uploads

// Increase PHP execution time for large uploads
ini_set('max_execution_time', 300); // 5 minutes

// Increase memory limit if needed
ini_set('memory_limit', '256M');

// Allow from any origin
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // This will dynamically allow the actual requesting origin
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');    // cache for 1 day
}

// Access-Control headers are received during OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        // Allow all common request methods
        header("Access-Control-Allow-Methods: GET, POST, DELETE, PUT, OPTIONS");
    }
    
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    } else {
        // Fallback to allow common headers
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    }
    
    // For OPTIONS requests, immediately end the response
    exit(0);
}

// Set JSON content type for all non-OPTIONS requests
// But only if not a multipart form submission
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : '';
    // Only set application/json content type if not uploading files
    if (strpos($contentType, 'multipart/form-data') === false) {
        header('Content-Type: application/json');
    }
}
?>