<?php
require_once '../config/database.php';
require_once '../config/cors.php';
require_once '../config/jwt.php';
require_once '../../utils/validation.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

try {
    // Get posted data
    $data = json_decode(file_get_contents("php://input"));
    
    // Validate input
    validateRequired($data->email ?? '', 'Email');
    validateRequired($data->password ?? '', 'Password');
    
    $email = sanitizeInput($data->email);
    $password = $data->password;
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Get user
    $query = "SELECT id, name, email, password, role FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    if ($stmt->rowCount() == 0) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid email or password']);
        exit;
    }
    
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        http_response_code(401);
        echo json_encode(['message' => 'Invalid email or password']);
        exit;
    }
    
    // Generate JWT token
    $payload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'role' => $user['role'],
        'exp' => time() + (24 * 60 * 60) // 24 hours
    ];
    
    $token = JWT::encode($payload);
    
    // Remove password from response
    unset($user['password']);
    
    http_response_code(200);
    echo json_encode([
        'user' => $user,
        'token' => $token
    ]);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['message' => $e->getMessage()]);
}
?>