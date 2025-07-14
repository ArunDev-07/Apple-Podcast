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
    
    // Get bookmarked podcasts
    $query = "SELECT p.*, ub.created_at as bookmarked_at 
              FROM podcasts p 
              INNER JOIN user_bookmarks ub ON p.id = ub.podcast_id 
              WHERE ub.user_id = :user_id 
              ORDER BY ub.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $userId);
    $stmt->execute();
    
    $bookmarkedPodcasts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode($bookmarkedPodcasts);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
?>