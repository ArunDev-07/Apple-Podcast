<?php
/**
 * Uploads a file to the server and returns the relative path
 * 
 * @param array $file The file array from $_FILES
 * @param string $type The type of file: 'image', 'audio', or 'video'
 * @return string The relative path to the uploaded file
 * @throws Exception If upload fails for any reason
 */
function uploadFile($file, $type = 'image') {
    $uploadDir = __DIR__ . '/../uploads/';
    $allowedTypes = [];
    $maxSize = 0;
    
    if ($type === 'image') {
        $uploadDir .= 'images/';
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxSize = 5 * 1024 * 1024; // 5MB
    } else if ($type === 'audio') {
        $uploadDir .= 'audio/';
        $allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/m4a', 'audio/x-m4a'];
        $maxSize = 50 * 1024 * 1024; // 50MB
    } else if ($type === 'video') {
        $uploadDir .= 'video/';
        $allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
        $maxSize = 500 * 1024 * 1024; // 500MB
    } else {
        throw new Exception('Invalid file type specified');
    }
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        if (!mkdir($uploadDir, 0777, true)) {
            throw new Exception("Failed to create directory: $uploadDir");
        }
    }
    
    // Validate file
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        throw new Exception('No file uploaded');
    }
    
    // Check file type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        throw new Exception('Invalid file type: ' . $mimeType . '. Allowed types for ' . $type . ': ' . implode(', ', $allowedTypes));
    }
    
    // Check file size
    if ($file['size'] > $maxSize) {
        throw new Exception('File too large. Maximum size: ' . ($maxSize / 1024 / 1024) . 'MB');
    }
    
    // Generate unique filename with original file extension
    $originalExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $originalExtension;
    $filepath = $uploadDir . $filename;
    
    // Move file
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        throw new Exception('Failed to move uploaded file');
    }
    
    // Return relative path based on file type
    if ($type === 'image') {
        return 'images/' . $filename;
    } else if ($type === 'audio') {
        return 'audio/' . $filename;
    } else if ($type === 'video') {
        return 'video/' . $filename;
    }
}
?>