<?php
require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../../utils/auth.php';

header('Content-Type: application/json');

try {
    // Validate token
    $tokenData = validateToken();
    $userId = $tokenData['user_id'];
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get most played podcasts based on play_count
    $query = "SELECT p.*, COALESCE(p.play_count, 0) as play_count
              FROM podcasts p 
              WHERE p.play_count > 0 
              ORDER BY p.play_count DESC, p.created_at DESC 
              LIMIT 20";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $mostPlayedPodcasts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode($mostPlayedPodcasts);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
?>