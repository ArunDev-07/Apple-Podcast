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
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    $libraryData = [];
    
    // Get liked songs (favorites)
    $likedQuery = "SELECT p.*, u.name as author_name, f.created_at as liked_at 
                   FROM user_favorites f 
                   JOIN podcasts p ON f.podcast_id = p.id 
                   JOIN users u ON p.user_id = u.id 
                   WHERE f.user_id = :user_id 
                   ORDER BY f.created_at DESC";
    
    $likedStmt = $db->prepare($likedQuery);
    $likedStmt->bindParam(":user_id", $userId);
    $likedStmt->execute();
    $libraryData['liked_songs'] = $likedStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recently played
    $recentQuery = "SELECT p.*, u.name as author_name, h.progress, h.completed, h.last_listened_at as played_at 
                    FROM listening_history h 
                    JOIN podcasts p ON h.podcast_id = p.id 
                    JOIN users u ON p.user_id = u.id 
                    WHERE h.user_id = :user_id 
                    ORDER BY h.last_listened_at DESC 
                    LIMIT 50";
    
    $recentStmt = $db->prepare($recentQuery);
    $recentStmt->bindParam(":user_id", $userId);
    $recentStmt->execute();
    $libraryData['recently_played'] = $recentStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get most played (based on user's listening history)
    $mostPlayedQuery = "SELECT p.*, u.name as author_name, COUNT(h.id) as user_play_count 
                        FROM listening_history h 
                        JOIN podcasts p ON h.podcast_id = p.id 
                        JOIN users u ON p.user_id = u.id 
                        WHERE h.user_id = :user_id 
                        GROUP BY p.id 
                        ORDER BY user_play_count DESC, h.last_listened_at DESC 
                        LIMIT 50";
    
    $mostPlayedStmt = $db->prepare($mostPlayedQuery);
    $mostPlayedStmt->bindParam(":user_id", $userId);
    $mostPlayedStmt->execute();
    $libraryData['most_played'] = $mostPlayedStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get bookmarked songs
    $bookmarkedQuery = "SELECT p.*, u.name as author_name, pi.added_at as bookmarked_at 
                        FROM playlist_items pi 
                        JOIN playlists pl ON pi.playlist_id = pl.id 
                        JOIN podcasts p ON pi.podcast_id = p.id 
                        JOIN users u ON p.user_id = u.id 
                        WHERE pl.user_id = :user_id AND pl.name = 'Bookmarks' 
                        ORDER BY pi.added_at DESC";
    
    $bookmarkedStmt = $db->prepare($bookmarkedQuery);
    $bookmarkedStmt->bindParam(":user_id", $userId);
    $bookmarkedStmt->execute();
    $libraryData['bookmarked'] = $bookmarkedStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get library statistics
    $statsQuery = "SELECT 
                    (SELECT COUNT(*) FROM user_favorites WHERE user_id = :user_id) as total_liked,
                    (SELECT COUNT(*) FROM listening_history WHERE user_id = :user_id) as total_listened,
                    (SELECT COUNT(*) FROM playlist_items pi JOIN playlists pl ON pi.playlist_id = pl.id WHERE pl.user_id = :user_id AND pl.name = 'Bookmarks') as total_bookmarked,
                    (SELECT SUM(progress) FROM listening_history WHERE user_id = :user_id) as total_progress";
    
    $statsStmt = $db->prepare($statsQuery);
    $statsStmt->bindParam(":user_id", $userId);
    $statsStmt->execute();
    $libraryData['statistics'] = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'message' => 'Library data retrieved successfully',
        'data' => $libraryData
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
?>