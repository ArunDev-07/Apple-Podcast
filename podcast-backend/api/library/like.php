<?php
require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../../utils/auth.php';
require_once '../../utils/validation.php';

header('Content-Type: application/json');

try {
    // Validate token
    $tokenData = validateToken();
    $userId = $tokenData['user_id'];

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Like a podcast
        $data = json_decode(file_get_contents("php://input"));
        
        validateRequired($data->podcast_id ?? '', 'Podcast ID');
        $podcastId = intval($data->podcast_id);
        
        // Database connection
        $database = new Database();
        $db = $database->getConnection();
        
        // Check if podcast exists
        $podcastQuery = "SELECT id FROM podcasts WHERE id = :podcast_id";
        $podcastStmt = $db->prepare($podcastQuery);
        $podcastStmt->bindParam(":podcast_id", $podcastId);
        $podcastStmt->execute();
        
        if ($podcastStmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(['message' => 'Podcast not found']);
            exit;
        }
        
        // Check if already liked
        $checkQuery = "SELECT id FROM user_favorites WHERE user_id = :user_id AND podcast_id = :podcast_id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(":user_id", $userId);
        $checkStmt->bindParam(":podcast_id", $podcastId);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Podcast already liked', 'liked' => true]);
            exit;
        }
        
        // Add to favorites
        $insertQuery = "INSERT INTO user_favorites (user_id, podcast_id, created_at) VALUES (:user_id, :podcast_id, NOW())";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(":user_id", $userId);
        $insertStmt->bindParam(":podcast_id", $podcastId);
        
        if ($insertStmt->execute()) {
            http_response_code(201);
            echo json_encode([
                'message' => 'Podcast liked successfully',
                'liked' => true
            ]);
        } else {
            throw new Exception('Failed to like podcast');
        }
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
        // Unlike podcast
        if (!isset($_GET['podcast_id'])) {
            throw new Exception('Podcast ID is required');
        }
        $podcastId = intval($_GET['podcast_id']);
        
        // Database connection
        $database = new Database();
        $db = $database->getConnection();
        
        // Remove from favorites
        $deleteQuery = "DELETE FROM user_favorites WHERE user_id = :user_id AND podcast_id = :podcast_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(":user_id", $userId);
        $deleteStmt->bindParam(":podcast_id", $podcastId);
        
        if ($deleteStmt->execute()) {
            http_response_code(200);
            echo json_encode([
                'message' => 'Like removed successfully',
                'liked' => false
            ]);
        } else {
            throw new Exception('Failed to remove like');
        }
        
    } else {
        http_response_code(405);
        echo json_encode(['message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['message' => $e->getMessage()]);
}
?>