<?php
require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../../utils/auth.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Validate token and check if admin
    $tokenData = validateToken();
    if ($tokenData['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only admins can delete podcasts']);
        exit;
    }
    
    // Get podcast ID from URL parameters
    if (!isset($_GET['id'])) {
        throw new Exception('Podcast ID is required');
    }
    $podcast_id = intval($_GET['id']);
    
    if ($podcast_id <= 0) {
        throw new Exception('Invalid podcast ID');
    }
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Check if podcast exists
        $check_query = "SELECT * FROM podcasts WHERE id = :id";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(":id", $podcast_id);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Podcast not found']);
            exit;
        }
        
        $podcast = $check_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Log the deletion attempt for debugging
        error_log("Admin {$tokenData['user_id']} attempting to delete podcast {$podcast_id} created by user {$podcast['user_id']}");
        
        // Delete episodes first (if episodes table exists)
        try {
            // Check if episodes table exists
            $table_check = $db->query("SHOW TABLES LIKE 'episodes'");
            if ($table_check->rowCount() > 0) {
                // Delete episode files first
                $episode_query = "SELECT audio_url FROM episodes WHERE podcast_id = :id";
                $episode_stmt = $db->prepare($episode_query);
                $episode_stmt->bindParam(":id", $podcast_id);
                $episode_stmt->execute();
                
                $episodes = $episode_stmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($episodes as $episode) {
                    if (!empty($episode['audio_url'])) {
                        $audio_path = __DIR__ . '/../../uploads/audio/' . basename($episode['audio_url']);
                        if (file_exists($audio_path)) {
                            @unlink($audio_path);
                        }
                    }
                }
                
                // Delete episodes records
                $delete_episodes = "DELETE FROM episodes WHERE podcast_id = :id";
                $episodes_stmt = $db->prepare($delete_episodes);
                $episodes_stmt->bindParam(":id", $podcast_id);
                $episodes_stmt->execute();
            }
        } catch (Exception $e) {
            error_log("Error deleting episodes: " . $e->getMessage());
        }
        
        // Delete associated records (only if tables exist)
        $tables_to_clean = [
            'user_favorites' => 'podcast_id',
            'playlist_items' => 'podcast_id', 
            'listening_history' => 'podcast_id',
            'comments' => 'podcast_id',
            'ratings' => 'podcast_id'
        ];
        
        foreach ($tables_to_clean as $table => $column) {
            try {
                $table_check = $db->query("SHOW TABLES LIKE '$table'");
                if ($table_check->rowCount() > 0) {
                    $delete_query = "DELETE FROM $table WHERE $column = :id";
                    $delete_stmt = $db->prepare($delete_query);
                    $delete_stmt->bindParam(":id", $podcast_id);
                    $delete_stmt->execute();
                }
            } catch (Exception $e) {
                error_log("Error deleting from $table: " . $e->getMessage());
            }
        }
        
        // Delete files from filesystem
        $audio_deleted = true;
        $image_deleted = true;
        
        if (!empty($podcast['audio_url'])) {
            $audio_path = __DIR__ . '/../../uploads/audio/' . basename($podcast['audio_url']);
            if (file_exists($audio_path)) {
                $audio_deleted = @unlink($audio_path);
            }
        }
        
        if (!empty($podcast['image_url'])) {
            $image_path = __DIR__ . '/../../uploads/images/' . basename($podcast['image_url']);
            if (file_exists($image_path)) {
                $image_deleted = @unlink($image_path);
            }
        }
        
        // Finally, delete the podcast record
        $delete_query = "DELETE FROM podcasts WHERE id = :id";
        $delete_stmt = $db->prepare($delete_query);
        $delete_stmt->bindParam(":id", $podcast_id);
        
        if ($delete_stmt->execute()) {
            // Commit transaction
            $db->commit();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Podcast deleted successfully',
                'deleted_podcast' => [
                    'id' => $podcast_id,
                    'title' => $podcast['title']
                ],
                'files_deleted' => [
                    'audio' => $audio_deleted,
                    'image' => $image_deleted
                ]
            ]);
        } else {
            throw new Exception('Failed to delete podcast from database');
        }
        
    } catch (Exception $e) {
        // Rollback transaction
        $db->rollback();
        throw $e;
    }
    
} catch (Exception $e) {
    error_log("Delete podcast error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>