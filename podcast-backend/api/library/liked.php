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
    
    // Get liked podcasts
    $query = "SELECT p.*, uf.created_at as liked_at 
              FROM podcasts p 
              INNER JOIN user_favorites uf ON p.id = uf.podcast_id 
              WHERE uf.user_id = :user_id 
              ORDER BY uf.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    
    $likedPodcasts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode($likedPodcasts);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
?>