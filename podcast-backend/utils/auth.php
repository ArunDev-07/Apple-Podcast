<?php
require_once __DIR__ . '/../api/config/jwt.php';

function getAuthorizationHeader() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

function getBearerToken() {
    $headers = getAuthorizationHeader();
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function validateToken() {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['message' => 'No token provided']);
        exit;
    }

    $decoded = JWT::decode($token);
    if (!$decoded) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid token']);
        exit;
    }

    return $decoded;
}
?>