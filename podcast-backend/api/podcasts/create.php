<?php
require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../../utils/auth.php';
require_once '../../utils/upload.php';
require_once '../../utils/validation.php';

header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    // Debug: Log received data
    error_log("DEBUG - Received POST data: " . json_encode($_POST));
    error_log("DEBUG - Received FILES: " . json_encode(array_keys($_FILES)));
    
    // Validate token and check if admin
    $tokenData = validateToken();
    if ($tokenData['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['message' => 'Only admins can create podcasts']);
        exit;
    }
    
    // Validate input
    if (empty($_POST['title'])) {
        throw new Exception('Title is required');
    }
    if (empty($_POST['description'])) {
        throw new Exception('Description is required');
    }
    
    // Check image file (required)
    if (!isset($_FILES['image'])) {
        throw new Exception('No image file received');
    }
    if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        $uploadErrors = [
            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini',
            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive',
            UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload'
        ];
        $errorMessage = $uploadErrors[$_FILES['image']['error']] ?? 'Unknown upload error';
        throw new Exception('Image file upload error: ' . $errorMessage);
    }
    
    // Sanitize input
    $title = trim(strip_tags($_POST['title']));
    $description = trim(strip_tags($_POST['description']));
    $category = trim(strip_tags($_POST['category'] ?? ''));
    $addedBy = trim(strip_tags($_POST['addedBy'] ?? 'hr')); // NEW: Handle addedBy field
    
    // Upload image
    try {
        $image_url = uploadFile($_FILES['image'], 'image');
        error_log("DEBUG - Image uploaded: " . $image_url);
    } catch (Exception $e) {
        throw new Exception('Image upload failed: ' . $e->getMessage());
    }
    
    // Create dummy audio URL - use a placeholder
    $audio_url = 'placeholder_audio.mp3';
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Insert podcast - UPDATED: Include added_by field
    $query = "INSERT INTO podcasts (user_id, title, description, audio_url, image_url, category, added_by, created_at) 
              VALUES (:user_id, :title, :description, :audio_url, :image_url, :category, :added_by, NOW())";
    
    $stmt = $db->prepare($query);
    
    // Bind parameters
    $stmt->bindParam(":user_id", $tokenData['user_id'], PDO::PARAM_INT);
    $stmt->bindParam(":title", $title, PDO::PARAM_STR);
    $stmt->bindParam(":description", $description, PDO::PARAM_STR);
    $stmt->bindParam(":audio_url", $audio_url, PDO::PARAM_STR);
    $stmt->bindParam(":image_url", $image_url, PDO::PARAM_STR);
    $stmt->bindParam(":category", $category, PDO::PARAM_STR);
    $stmt->bindParam(":added_by", $addedBy, PDO::PARAM_STR); // NEW: Bind addedBy
    
    if ($stmt->execute()) {
        $podcast_id = $db->lastInsertId();
        
        // Get the created podcast
        $get_query = "SELECT p.*, u.name as author_name 
                      FROM podcasts p 
                      LEFT JOIN users u ON p.user_id = u.id 
                      WHERE p.id = :id";
        $get_stmt = $db->prepare($get_query);
        $get_stmt->bindParam(":id", $podcast_id, PDO::PARAM_INT);
        $get_stmt->execute();
        
        $podcast = $get_stmt->fetch(PDO::FETCH_ASSOC);
        
        // Add full URLs for files
        $baseUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname(dirname(dirname($_SERVER['PHP_SELF'])));
        $podcast['audio_url'] = $baseUrl . '/uploads/' . $podcast['audio_url'];
        $podcast['image_url'] = $baseUrl . '/uploads/' . $podcast['image_url'];
        
        error_log("DEBUG - Created podcast: ID=" . $podcast_id . ", Title=" . $title . ", Added By=" . $addedBy);
        
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Podcast created successfully',
            'data' => $podcast
        ]);
    } else {
        $errorInfo = $stmt->errorInfo();
        throw new Exception('Database error: ' . $errorInfo[2]);
    }
    
} catch (Exception $e) {
    // Clean up uploaded files if database insert fails
    if (isset($image_url)) {
        $imagePath = dirname(dirname(__DIR__)) . '/uploads/' . $image_url;
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }
    }
    
    error_log("ERROR in create.php: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'debug' => [
            'post_data' => $_POST,
            'files' => array_keys($_FILES)
        ]
    ]);
}
?>