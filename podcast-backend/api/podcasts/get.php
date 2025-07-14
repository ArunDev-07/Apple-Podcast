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
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if specific podcast requested
    if (isset($_GET['id'])) {
        $id = intval($_GET['id']);
        
        $query = "SELECT p.*, u.name as author_name 
                  FROM podcasts p 
                  JOIN users u ON p.user_id = u.id 
                  WHERE p.id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        
        if ($stmt->rowCount() == 0) {
            http_response_code(404);
            echo json_encode(['message' => 'Podcast not found']);
            exit;
        }
        
        $podcast = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($podcast);
    } else {
        // Get all podcasts based on user role
        $query = "SELECT p.*, u.name as author_name 
                  FROM podcasts p 
                  JOIN users u ON p.user_id = u.id";
        
        // FIXED LOGIC:
        // Admin: See ALL podcasts (published and unpublished)
        // User: See only published podcasts
        if ($tokenData['role'] === 'user') {
            $query .= " WHERE p.is_published = 1";
        }
        // Admin sees everything - no WHERE clause restriction
        
        $query .= " ORDER BY p.created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $podcasts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($podcasts);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => $e->getMessage()]);
}
?>