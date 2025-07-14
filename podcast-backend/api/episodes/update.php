<?php
require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../../utils/auth.php';
require_once '../../utils/upload.php';
require_once '../../utils/validation.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Validate token and check if admin
    $tokenData = validateToken();
    if ($tokenData['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only admins can update episodes']);
        exit;
    }
    
    // Get episode ID
    if (!isset($_GET['id'])) {
        throw new Exception('Episode ID is required');
    }
    $episode_id = intval($_GET['id']);
    
    if ($episode_id <= 0) {
        throw new Exception('Invalid episode ID');
    }
    
    // Validate required fields
    if (empty($_POST['title'])) {
        throw new Exception('Episode title is required');
    }
    if (empty($_POST['episode_number'])) {
        throw new Exception('Episode number is required');
    }
    if (empty($_POST['added_by'])) {
        throw new Exception('Added by field is required');
    }
    
    // Validate added_by field
    $valid_added_by = ['hr', 'manager', 'employee'];
    if (!in_array($_POST['added_by'], $valid_added_by)) {
        throw new Exception('Invalid added_by value. Must be hr, manager, or employee');
    }
    
    // Sanitize input
    $title = trim($_POST['title']);
    $description = trim($_POST['description'] ?? '');
    $episode_number = intval($_POST['episode_number']);
    $added_by = trim($_POST['added_by']);
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if episode exists
    $check_query = "SELECT * FROM episodes WHERE id = :id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":id", $episode_id);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Episode not found']);
        exit;
    }
    
    $existing_episode = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    // Check if episode number conflicts with other episodes in the same podcast
    $conflict_check = "SELECT id FROM episodes 
                       WHERE podcast_id = :podcast_id 
                       AND episode_number = :episode_number 
                       AND id != :id";
    $conflict_stmt = $db->prepare($conflict_check);
    $conflict_stmt->bindParam(":podcast_id", $existing_episode['podcast_id']);
    $conflict_stmt->bindParam(":episode_number", $episode_number);
    $conflict_stmt->bindParam(":id", $episode_id);
    $conflict_stmt->execute();
    
    if ($conflict_stmt->rowCount() > 0) {
        throw new Exception('Episode number already exists for this podcast');
    }
    
    // Handle file uploads
    $audio_url = $existing_episode['audio_url'];
    $image_url = $existing_episode['image_url'];
    $video_url = $existing_episode['video_url'];
    $file_size = $existing_episode['file_size'];
    $video_size = $existing_episode['video_size'];
    
    // Handle audio file upload (optional for updates)
    if (isset($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_OK) {
        try {
            // Delete old audio file
            if (!empty($existing_episode['audio_url'])) {
                $old_audio_path = __DIR__ . '/../../uploads/audio/' . basename($existing_episode['audio_url']);
                if (file_exists($old_audio_path)) {
                    @unlink($old_audio_path);
                }
            }
            
            // Upload new audio file
            $audio_url = uploadFile($_FILES['audio'], 'audio');
            $file_size = $_FILES['audio']['size'];
        } catch (Exception $e) {
            throw new Exception('Audio upload failed: ' . $e->getMessage());
        }
    }
    
    // Handle image file upload (optional)
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        try {
            // Delete old image file
            if (!empty($existing_episode['image_url'])) {
                $old_image_path = __DIR__ . '/../../uploads/images/' . basename($existing_episode['image_url']);
                if (file_exists($old_image_path)) {
                    @unlink($old_image_path);
                }
            }
            
            // Upload new image file
            $image_url = uploadFile($_FILES['image'], 'image');
        } catch (Exception $e) {
            // Log image upload error but don't fail the episode update
            error_log('Episode image upload failed: ' . $e->getMessage());
        }
    }
    
    // Handle video file upload (optional)
    if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        try {
            // Delete old video file
            if (!empty($existing_episode['video_url'])) {
                $old_video_path = __DIR__ . '/../../uploads/video/' . basename($existing_episode['video_url']);
                if (file_exists($old_video_path)) {
                    @unlink($old_video_path);
                }
            }
            
            // Upload new video file
            $video_url = uploadFile($_FILES['video'], 'video');
            $video_size = $_FILES['video']['size'];
        } catch (Exception $e) {
            // Log video upload error but don't fail the episode update
            error_log('Episode video upload failed: ' . $e->getMessage());
        }
    }
    
    // Check if video needs to be removed
    if (isset($_POST['remove_video']) && $_POST['remove_video'] === '1') {
        if (!empty($existing_episode['video_url'])) {
            $old_video_path = __DIR__ . '/../../uploads/video/' . basename($existing_episode['video_url']);
            if (file_exists($old_video_path)) {
                @unlink($old_video_path);
            }
        }
        $video_url = null;
        $video_size = 0;
    }
    
    // Update episode
    $query = "UPDATE episodes 
              SET title = :title,
                  description = :description,
                  episode_number = :episode_number,
                  audio_url = :audio_url,
                  image_url = :image_url,
                  video_url = :video_url,
                  file_size = :file_size,
                  video_size = :video_size,
                  added_by = :added_by,
                  updated_at = NOW()
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":title", $title);
    $stmt->bindParam(":description", $description);
    $stmt->bindParam(":episode_number", $episode_number);
    $stmt->bindParam(":audio_url", $audio_url);
    $stmt->bindParam(":image_url", $image_url);
    $stmt->bindParam(":video_url", $video_url);
    $stmt->bindParam(":file_size", $file_size, PDO::PARAM_INT);
    $stmt->bindParam(":video_size", $video_size, PDO::PARAM_INT);
    $stmt->bindParam(":added_by", $added_by);
    $stmt->bindParam(":id", $episode_id);
    
    if ($stmt->execute()) {
        // Get updated episode with podcast info
        $get_query = "SELECT e.*, p.title as podcast_title 
                      FROM episodes e 
                      LEFT JOIN podcasts p ON e.podcast_id = p.id 
                      WHERE e.id = :id";
        $get_stmt = $db->prepare($get_query);
        $get_stmt->bindParam(":id", $episode_id);
        $get_stmt->execute();
        
        $episode = $get_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Format URLs
        $baseUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname(dirname(dirname($_SERVER['PHP_SELF'])));
        
        if ($episode['audio_url']) {
            $episode['audio_url'] = $baseUrl . '/uploads/audio/' . basename($episode['audio_url']);
        }
        
        if ($episode['video_url']) {
            $episode['video_url'] = $baseUrl . '/uploads/video/' . basename($episode['video_url']);
        }
        
        if ($episode['image_url']) {
            $episode['image_url'] = $baseUrl . '/uploads/images/' . basename($episode['image_url']);
        }
        
        // Format dates
        $episode['release_date_formatted'] = date('F j, Y', strtotime($episode['release_date']));
        $episode['created_at_formatted'] = date('F j, Y', strtotime($episode['created_at']));
        $episode['updated_at_formatted'] = date('F j, Y', strtotime($episode['updated_at']));
        
        // Add file size information
        $episode['file_size_formatted'] = formatFileSize($episode['file_size']);
        if ($episode['video_size'] > 0) {
            $episode['video_size_formatted'] = formatFileSize($episode['video_size']);
            $episode['has_video'] = true;
        } else {
            $episode['has_video'] = false;
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Episode updated successfully',
            'data' => $episode
        ]);
    } else {
        throw new Exception('Failed to update episode');
    }
    
} catch (Exception $e) {
    error_log("Update episode error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * Format file size in human-readable format
 */
function formatFileSize($bytes) {
    if ($bytes < 1024) {
        return $bytes . ' B';
    } elseif ($bytes < 1048576) {
        return round($bytes / 1024, 2) . ' KB';
    } elseif ($bytes < 1073741824) {
        return round($bytes / 1048576, 2) . ' MB';
    } else {
        return round($bytes / 1073741824, 2) . ' GB';
    }
}
?>