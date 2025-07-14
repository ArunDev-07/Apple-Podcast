<?php
require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../../utils/auth.php';

header('Content-Type: application/json');

try {
    // Validate token
    $tokenData = validateToken();
    $userId = $tokenData['user_id'];
    
    // Get podcast ID from URL
    $podcastId = $_GET['podcast_id'] ?? null;
    
    if (!$podcastId) {
        // Try to get from path
        $path = $_SERVER['REQUEST_URI'];
        if (preg_match('/\/podcasts\/(\d+)\/episodes\.php/', $path, $matches)) {
            $podcastId = intval($matches[1]);
        }
    }
    
    if (!$podcastId) {
        throw new Exception('Podcast ID is required');
    }
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if episodes table exists
    $tableCheck = $db->query("SHOW TABLES LIKE 'episodes'");
    if ($tableCheck->rowCount() == 0) {
        // Episodes table doesn't exist, return empty array
        http_response_code(200);
        echo json_encode([]);
        exit;
    }
    
    // Get episodes for this podcast
    $query = "SELECT * FROM episodes WHERE podcast_id = :podcast_id ORDER BY published_at DESC, created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":podcast_id", $podcastId);
    $stmt->execute();
    
    $episodes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode($episodes);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
?>