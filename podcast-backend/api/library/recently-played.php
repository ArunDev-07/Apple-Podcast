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
    
    // Get recently played podcasts from listening_history
    $query = "SELECT p.*, lh.last_listened_at, lh.progress, lh.completed
              FROM podcasts p 
              INNER JOIN listening_history lh ON p.id = lh.podcast_id 
              WHERE lh.user_id = :user_id 
              ORDER BY lh.last_listened_at DESC 
              LIMIT 20";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    
    $recentlyPlayedPodcasts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode($recentlyPlayedPodcasts);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
?>