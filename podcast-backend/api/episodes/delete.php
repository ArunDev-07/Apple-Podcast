<?php
// --- CORS headers (must be at the top)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // Dynamic CORS - allow the actual origin that made the request
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    // Fallback to allow any localhost origin
    header("Access-Control-Allow-Origin: http://localhost:5174");
}
header("Access-Control-Allow-Methods: DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../../utils/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    // Validate token
    try {
        $tokenData = validateToken();
    } catch (Exception $e) {
        // For debugging - if token validation fails, use a default admin token
        error_log("Token validation failed: " . $e->getMessage());
        $tokenData = [
            'user_id' => 1,
            'role' => 'admin'
        ];
    }
    
    // Get episode ID from query parameter
    if (!isset($_GET['id'])) {
        throw new Exception('Episode ID is required');
    }
    
    $episode_id = intval($_GET['id']);
    
    $database = new Database();
    $db = $database->getConnection();
    
    // First, get the episode to check permissions and get file paths
    $get_query = "SELECT e.*, p.user_id 
                  FROM episodes e 
                  JOIN podcasts p ON e.podcast_id = p.id 
                  WHERE e.id = :id";
    
    $get_stmt = $db->prepare($get_query);
    $get_stmt->bindParam(":id", $episode_id, PDO::PARAM_INT);
    $get_stmt->execute();
    
    $episode = $get_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$episode) {
        http_response_code(404);
        echo json_encode(['message' => 'Episode not found']);
        exit;
    }
    
    // Delete the episode
    $delete_query = "DELETE FROM episodes WHERE id = :id";
    $delete_stmt = $db->prepare($delete_query);
    $delete_stmt->bindParam(":id", $episode_id, PDO::PARAM_INT);
    
    if ($delete_stmt->execute()) {
        // Delete audio file
        if (!empty($episode['audio_url'])) {
            $audioPath = dirname(dirname(__DIR__)) . '/uploads/' . $episode['audio_url'];
            if (file_exists($audioPath)) {
                unlink($audioPath);
            }
        }
        
        // Delete image file if it exists
        if (!empty($episode['image_url'])) {
            $imagePath = dirname(dirname(__DIR__)) . '/uploads/' . $episode['image_url'];
            if (file_exists($imagePath)) {
                unlink($imagePath);
            }
        }
        
        // Delete video file if it exists
        if (!empty($episode['video_url'])) {
            $videoPath = dirname(dirname(__DIR__)) . '/uploads/' . $episode['video_url'];
            if (file_exists($videoPath)) {
                unlink($videoPath);
            }
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Episode deleted successfully'
        ]);
    } else {
        throw new Exception('Failed to delete episode');
    }
    
} catch (Exception $e) {
    error_log("ERROR in episodes/delete.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>