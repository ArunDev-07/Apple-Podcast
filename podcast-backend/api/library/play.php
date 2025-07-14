<?php
require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../../utils/auth.php';
require_once '../../utils/validation.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    // Validate token
    $tokenData = validateToken();
    $userId = $tokenData['user_id'];
    
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    validateRequired($data->podcast_id ?? '', 'Podcast ID');
    $podcastId = intval($data->podcast_id);
    $progress = isset($data->progress) ? intval($data->progress) : 0;
    $duration = isset($data->duration) ? intval($data->duration) : 0;
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if podcast exists
    $podcastQuery = "SELECT id, duration FROM podcasts WHERE id = :podcast_id";
    $podcastStmt = $db->prepare($podcastQuery);
    $podcastStmt->bindParam(":podcast_id", $podcastId);
    $podcastStmt->execute();
    
    if ($podcastStmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(['message' => 'Podcast not found']);
        exit;
    }
    
    $podcast = $podcastStmt->fetch(PDO::FETCH_ASSOC);
    $podcastDuration = $podcast['duration'] ?: $duration;
    
    // Update or insert listening history
    $historyQuery = "INSERT INTO listening_history (user_id, podcast_id, progress, completed, last_listened_at) 
                     VALUES (:user_id, :podcast_id, :progress, :completed, NOW()) 
                     ON DUPLICATE KEY UPDATE 
                     progress = :progress, 
                     completed = :completed, 
                     last_listened_at = NOW()";
    
    $completed = $podcastDuration > 0 ? ($progress >= ($podcastDuration * 0.9)) : false;
    
    $historyStmt = $db->prepare($historyQuery);
    $historyStmt->bindParam(":user_id", $userId);
    $historyStmt->bindParam(":podcast_id", $podcastId);
    $historyStmt->bindParam(":progress", $progress);
    $historyStmt->bindParam(":completed", $completed, PDO::PARAM_BOOL);
    
    if (!$historyStmt->execute()) {
        throw new Exception('Failed to update listening history');
    }
    
    // Update podcast play count (global counter)
    $updatePlayCountQuery = "UPDATE podcasts SET play_count = play_count + 1 WHERE id = :podcast_id";
    $updateStmt = $db->prepare($updatePlayCountQuery);
    $updateStmt->bindParam(":podcast_id", $podcastId);
    $updateStmt->execute();
    
    // Get updated play count for response
    $getCountQuery = "SELECT play_count FROM podcasts WHERE id = :podcast_id";
    $getCountStmt = $db->prepare($getCountQuery);
    $getCountStmt->bindParam(":podcast_id", $podcastId);
    $getCountStmt->execute();
    $playCountResult = $getCountStmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'message' => 'Play tracked successfully',
        'progress' => $progress,
        'completed' => $completed,
        'play_count' => $playCountResult['play_count'],
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['message' => $e->getMessage()]);
}
?>