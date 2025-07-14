<?php
require_once '../config/database.php';
require_once '../config/cors.php';
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
    validateRequired($data->name ?? '', 'Name');
    validateRequired($data->email ?? '', 'Email');
    validateRequired($data->password ?? '', 'Password');
    validateEmail($data->email);
    validateLength($data->password, 'Password', 6, 50);
    
    // Sanitize input
    $name = sanitizeInput($data->name);
    $email = sanitizeInput($data->email);
    $password = $data->password;
    $role = isset($data->role) && in_array($data->role, ['admin', 'user']) ? $data->role : 'user';
    
    // Database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if email already exists
    $check_query = "SELECT id FROM users WHERE email = :email";
    $check_stmt = $db->prepare($check_query);
    $check_stmt->bindParam(":email", $email);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(['message' => 'Email already registered']);
        exit;
    }
    
    // Hash password
    $password_hash = password_hash($password, PASSWORD_BCRYPT);
    
    // Insert new user
    $query = "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)";
    $stmt = $db->prepare($query);
    
    $stmt->bindParam(":name", $name);
    $stmt->bindParam(":email", $email);
    $stmt->bindParam(":password", $password_hash);
    $stmt->bindParam(":role", $role);
    
    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(['message' => 'User registered successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['message' => 'Failed to register user']);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['message' => $e->getMessage()]);
}
?>