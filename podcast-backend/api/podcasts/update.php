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
        echo json_encode(['success' => false, 'message' => 'Only admins can update podcasts']);
        exit;
    }
    
    // Get podcast ID
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
    
    // Check if podcast exists (admin can update any podcast)
    $check_query = "SELECT * FROM podcasts WHERE id = :id";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":id", $podcast_id);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() == 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Podcast not found']);
        exit;
    }
    
    $existing_podcast = $check_stmt->fetch(PDO::FETCH_ASSOC);
    
    // Validate input
    if (empty($_POST['title'])) {
        throw new Exception('Title is required');
    }
    if (empty($_POST['description'])) {
        throw new Exception('Description is required');
    }
    
    // Sanitize input
    $title = trim($_POST['title']);
    $description = trim($_POST['description']);
    $category = trim($_POST['category'] ?? '');
    $addedBy = trim($_POST['addedBy'] ?? 'hr'); // NEW: Handle addedBy field
    $duration = intval($_POST['duration'] ?? 0);
    
    // Handle file uploads
    $audio_url = $existing_podcast['audio_url'];
    $image_url = $existing_podcast['image_url'];
    
    // Handle audio file upload
    if (isset($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_OK) {
        try {
            // Delete old audio file
            if (!empty($existing_podcast['audio_url'])) {
                $old_audio_path = __DIR__ . '/../../uploads/audio/' . basename($existing_podcast['audio_url']);
                if (file_exists($old_audio_path)) {
                    @unlink($old_audio_path);
                }
            }
            
            // Upload new audio file
            $audio_url = uploadFile($_FILES['audio'], 'audio');
        } catch (Exception $e) {
            throw new Exception('Audio upload failed: ' . $e->getMessage());
        }
    }
    
    // Handle image file upload
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        try {
            // Delete old image file
            if (!empty($existing_podcast['image_url'])) {
                $old_image_path = __DIR__ . '/../../uploads/images/' . basename($existing_podcast['image_url']);
                if (file_exists($old_image_path)) {
                    @unlink($old_image_path);
                }
            }
            
            // Upload new image file
            $image_url = uploadFile($_FILES['image'], 'image');
        } catch (Exception $e) {
            throw new Exception('Image upload failed: ' . $e->getMessage());
        }
    }
    
    // Update podcast - UPDATED: Include added_by field
    $query = "UPDATE podcasts 
              SET title = :title,
                  description = :description,
                  audio_url = :audio_url,
                  image_url = :image_url,
                  category = :category,
                  added_by = :added_by,
                  duration = :duration,
                  updated_at = NOW()
              WHERE id = :id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":title", $title);
    $stmt->bindParam(":description", $description);
    $stmt->bindParam(":audio_url", $audio_url);
    $stmt->bindParam(":image_url", $image_url);
    $stmt->bindParam(":category", $category);
    $stmt->bindParam(":added_by", $addedBy); // NEW: Bind addedBy
    $stmt->bindParam(":duration", $duration);
    $stmt->bindParam(":id", $podcast_id);
    
    if ($stmt->execute()) {
        // Get updated podcast
        $get_query = "SELECT p.*, u.name as author_name 
                      FROM podcasts p 
                      LEFT JOIN users u ON p.user_id = u.id 
                      WHERE p.id = :id";
        $get_stmt = $db->prepare($get_query);
        $get_stmt->bindParam(":id", $podcast_id);
        $get_stmt->execute();
        
        $podcast = $get_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Format the response
        if ($podcast) {
            $podcast['created_at_formatted'] = date('F j, Y', strtotime($podcast['created_at']));
            $podcast['updated_at_formatted'] = date('F j, Y', strtotime($podcast['updated_at']));
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Podcast updated successfully',
            'data' => $podcast
        ]);
    } else {
        throw new Exception('Failed to update podcast');
    }
    
} catch (Exception $e) {
    error_log("Update podcast error: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
}
?>