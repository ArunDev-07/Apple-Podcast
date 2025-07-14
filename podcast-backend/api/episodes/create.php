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
        echo json_encode(['success' => false, 'message' => 'Only admins can create episodes']);
        exit;
    }
    
    // Validate required fields
    if (empty($_POST['podcast_id'])) {
        throw new Exception('Podcast ID is required');
    }
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
    
    // Validate audio file for new episodes
    if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Audio file is required for new episodes');
    }
    
    // Sanitize input
    $podcast_id = intval($_POST['podcast_id']);
    $title = trim($_POST['title']);
    $description = trim($_POST['description'] ?? '');
    $episode_number = intval($_POST['episode_number']);
    $added_by = trim($_POST['added_by']);
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if podcast exists
    $check_podcast = "SELECT id FROM podcasts WHERE id = :podcast_id";
    $podcast_stmt = $db->prepare($check_podcast);
    $podcast_stmt->bindParam(":podcast_id", $podcast_id);
    $podcast_stmt->execute();
    
    if ($podcast_stmt->rowCount() == 0) {
        throw new Exception('Podcast not found');
    }
    
    // Check if episode number already exists for this podcast
    $check_episode = "SELECT id FROM episodes WHERE podcast_id = :podcast_id AND episode_number = :episode_number";
    $episode_stmt = $db->prepare($check_episode);
    $episode_stmt->bindParam(":podcast_id", $podcast_id);
    $episode_stmt->bindParam(":episode_number", $episode_number);
    $episode_stmt->execute();
    
    if ($episode_stmt->rowCount() > 0) {
        throw new Exception('Episode number already exists for this podcast');
    }
    
    // Handle file uploads
    $audio_url = '';
    $image_url = null;
    $video_url = null;
    $file_size = 0;
    $video_size = 0;
    
    // Upload audio file (required)
    try {
        $audio_url = uploadFile($_FILES['audio'], 'audio');
        $file_size = $_FILES['audio']['size'];
    } catch (Exception $e) {
        throw new Exception('Audio upload failed: ' . $e->getMessage());
    }
    
    // Upload image file (optional)
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        try {
            $image_url = uploadFile($_FILES['image'], 'image');
        } catch (Exception $e) {
            // Log image upload error but don't fail the episode creation
            error_log('Episode image upload failed: ' . $e->getMessage());
        }
    }
    
    // Upload video file (optional)
    if (isset($_FILES['video']) && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        try {
            $video_url = uploadFile($_FILES['video'], 'video');
            $video_size = $_FILES['video']['size'];
        } catch (Exception $e) {
            // Log video upload error but don't fail the episode creation
            error_log('Episode video upload failed: ' . $e->getMessage());
        }
    }
    
    // Insert episode
    $query = "INSERT INTO episodes (
                podcast_id, 
                title, 
                description, 
                episode_number, 
                audio_url, 
                video_url,
                image_url,
                added_by,
                file_size,
                video_size, 
                release_date,
                created_at,
                updated_at
              ) VALUES (
                :podcast_id, 
                :title, 
                :description, 
                :episode_number, 
                :audio_url, 
                :video_url,
                :image_url,
                :added_by,
                :file_size,
                :video_size,
                CURDATE(),
                NOW(),
                NOW()
              )";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":podcast_id", $podcast_id);
    $stmt->bindParam(":title", $title);
    $stmt->bindParam(":description", $description);
    $stmt->bindParam(":episode_number", $episode_number);
    $stmt->bindParam(":audio_url", $audio_url);
    $stmt->bindParam(":video_url", $video_url);
    $stmt->bindParam(":image_url", $image_url);
    $stmt->bindParam(":added_by", $added_by);
    $stmt->bindParam(":file_size", $file_size, PDO::PARAM_INT);
    $stmt->bindParam(":video_size", $video_size, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        $episode_id = $db->lastInsertId();
        
        // Get the created episode with podcast info
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
        
        // Add file size information
        $episode['file_size_formatted'] = formatFileSize($episode['file_size']);
        if ($episode['video_size'] > 0) {
            $episode['video_size_formatted'] = formatFileSize($episode['video_size']);
            $episode['has_video'] = true;
        } else {
            $episode['has_video'] = false;
        }
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Episode created successfully',
            'data' => $episode
        ]);
    } else {
        // Clean up uploaded files if database insert fails
        if ($audio_url) {
            @unlink(__DIR__ . '/../../uploads/audio/' . basename($audio_url));
        }
        if ($image_url) {
            @unlink(__DIR__ . '/../../uploads/images/' . basename($image_url));
        }
        if ($video_url) {
            @unlink(__DIR__ . '/../../uploads/video/' . basename($video_url));
        }
        throw new Exception('Failed to create episode');
    }
    
} catch (Exception $e) {
    error_log("Create episode error: " . $e->getMessage());
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