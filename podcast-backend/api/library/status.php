<?php
require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../../utils/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    // Validate token
    $tokenData = validateToken();
    $userId = $tokenData['user_id'];
    
    if (!isset($_GET['podcast_id'])) {
        throw new Exception('Podcast ID is required');
    }
    
    $podcastId = intval($_GET['podcast_id']);
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if liked
    $likedQuery = "SELECT id FROM user_favorites WHERE user_id = :user_id AND podcast_id = :podcast_id";
    $likedStmt = $db->prepare($likedQuery);
    $likedStmt->bindParam(":user_id", $userId);
    $likedStmt->bindParam(":podcast_id", $podcastId);
    $likedStmt->execute();
    $isLiked = $likedStmt->rowCount() > 0;
    
    // Check if bookmarked
    $bookmarkedQuery = "SELECT pi.id FROM playlist_items pi 
                        JOIN playlists pl ON pi.playlist_id = pl.id 
                        WHERE pl.user_id = :user_id AND pl.name = 'Bookmarks' AND pi.podcast_id = :podcast_id";
    $bookmarkedStmt = $db->prepare($bookmarkedQuery);
    $bookmarkedStmt->bindParam(":user_id", $userId);
    $bookmarkedStmt->bindParam(":podcast_id", $podcastId);
    $bookmarkedStmt->execute();
    $isBookmarked = $bookmarkedStmt->rowCount() > 0;
    
    // Get listening progress if any
    $progressQuery = "SELECT progress, completed, last_listened_at FROM listening_history 
                      WHERE user_id = :user_id AND podcast_id = :podcast_id";
    $progressStmt = $db->prepare($progressQuery);
    $progressStmt->bindParam(":user_id", $userId);
    $progressStmt->bindParam(":podcast_id", $podcastId);
    $progressStmt->execute();
    
    $progressData = null;
    if ($progressStmt->rowCount() > 0) {
        $progressData = $progressStmt->fetch(PDO::FETCH_ASSOC);
    }
    
    http_response_code(200);
    echo json_encode([
        'podcast_id' => $podcastId,
        'liked' => $isLiked,
        'bookmarked' => $isBookmarked,
        'progress' => $progressData ? [
            'progress' => intval($progressData['progress']),
            'completed' => (bool)$progressData['completed'],
            'last_listened_at' => $progressData['last_listened_at']
        ] : null
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['message' => $e->getMessage()]);
}
?>