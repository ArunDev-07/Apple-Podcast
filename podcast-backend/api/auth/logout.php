<?php
require_once '../config/cors.php';

header('Content-Type: application/json');

// For JWT-based auth, logout is handled client-side
// This endpoint is just for consistency
http_response_code(200);
echo json_encode(['message' => 'Logged out successfully']);
?>