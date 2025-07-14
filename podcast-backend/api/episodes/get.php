<?php
// --- CORS headers (must be at the top)
if (isset($_SERVER['HTTP_ORIGIN'])) {
    // Dynamic CORS - allow the actual origin that made the request
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
} else {
    // Fallback to allow any localhost origin
    header("Access-Control-Allow-Origin: http://localhost:5174");
}
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Base URL for files
    $baseUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname(dirname(dirname($_SERVER['PHP_SELF'])));
    
    // Check if getting episodes for a specific podcast or a specific episode
    if (isset($_GET['podcast_id'])) {
        // Get all episodes for a podcast
        $podcast_id = intval($_GET['podcast_id']);
        
        if ($podcast_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid podcast ID']);
            exit;
        }
        
        $query = "SELECT e.*, p.title as podcast_title, p.image_url as podcast_image_url
                  FROM episodes e 
                  LEFT JOIN podcasts p ON e.podcast_id = p.id 
                  WHERE e.podcast_id = :podcast_id 
                  ORDER BY e.episode_number ASC";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":podcast_id", $podcast_id, PDO::PARAM_INT);
        
    } elseif (isset($_GET['id'])) {
        // Get a specific episode
        $id = intval($_GET['id']);
        
        if ($id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid episode ID']);
            exit;
        }
        
        $query = "SELECT e.*, p.title as podcast_title, p.user_id as podcast_user_id
                  FROM episodes e 
                  LEFT JOIN podcasts p ON e.podcast_id = p.id 
                  WHERE e.id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":id", $id, PDO::PARAM_INT);
        
    } else {
        // Get all episodes (with pagination)
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 50;
        $offset = ($page - 1) * $limit;
        
        // First get total count
        $count_query = "SELECT COUNT(*) as total FROM episodes";
        $count_stmt = $db->prepare($count_query);
        $count_stmt->execute();
        $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        // Get episodes with pagination
        $query = "SELECT e.*, p.title as podcast_title, p.image_url as podcast_image,
                         u.name as author_name
                  FROM episodes e 
                  LEFT JOIN podcasts p ON e.podcast_id = p.id 
                  LEFT JOIN users u ON p.user_id = u.id
                  ORDER BY e.created_at DESC 
                  LIMIT :limit OFFSET :offset";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
    }
    
    $stmt->execute();
    
    if (isset($_GET['id'])) {
        // Single episode
        $episode = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$episode) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Episode not found']);
            exit;
        }
        
        // Fix audio URL - avoid double-prefixing
        if (!empty($episode['audio_url'])) {
            if (!filter_var($episode['audio_url'], FILTER_VALIDATE_URL)) {
                // Only add base URL if it's not already a complete URL
                $episode['audio_url'] = $baseUrl . '/uploads/audio/' . basename($episode['audio_url']);
            }
        }
        
        // Fix video URL if present
        if (!empty($episode['video_url'])) {
            if (!filter_var($episode['video_url'], FILTER_VALIDATE_URL)) {
                $episode['video_url'] = $baseUrl . '/uploads/video/' . basename($episode['video_url']);
            }
            $episode['has_video'] = true;
        } else {
            $episode['has_video'] = false;
        }
        
        // Fix podcast image URL
        if (!empty($episode['podcast_image'])) {
            if (!filter_var($episode['podcast_image'], FILTER_VALIDATE_URL)) {
                $episode['podcast_image'] = $baseUrl . '/uploads/images/' . basename($episode['podcast_image']);
            }
        }
        
        // Format dates
        $episode['release_date_formatted'] = date('F j, Y', strtotime($episode['release_date']));
        $episode['created_at_formatted'] = date('F j, Y', strtotime($episode['created_at']));
        
        // Add file size information
        if (isset($episode['file_size'])) {
            $episode['file_size_formatted'] = formatFileSize($episode['file_size']);
        }
        
        if (isset($episode['video_size']) && $episode['video_size'] > 0) {
            $episode['video_size_formatted'] = formatFileSize($episode['video_size']);
        }
        
        // Ensure numeric fields are proper types
        $episode['episode_number'] = intval($episode['episode_number']);
        $episode['play_count'] = intval($episode['play_count']);
        $episode['download_count'] = intval($episode['download_count']);
        
        // Ensure added_by is properly formatted
        $episode['added_by'] = strtolower($episode['added_by']);
        
        echo json_encode([
            'success' => true,
            'data' => $episode
        ]);
        
    } else {
        // Multiple episodes
        $episodes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process each episode
        foreach ($episodes as &$episode) {
            // Fix audio URL - avoid double-prefixing
            if (!empty($episode['audio_url'])) {
                if (!filter_var($episode['audio_url'], FILTER_VALIDATE_URL)) {
                    // Only add base URL if it's not already a complete URL
                    $episode['audio_url'] = $baseUrl . '/uploads/audio/' . basename($episode['audio_url']);
                }
            }
            
            // Fix video URL if present
            if (!empty($episode['video_url'])) {
                if (!filter_var($episode['video_url'], FILTER_VALIDATE_URL)) {
                    $episode['video_url'] = $baseUrl . '/uploads/video/' . basename($episode['video_url']);
                }
                $episode['has_video'] = true;
            } else {
                $episode['has_video'] = false;
            }
            
            // Fix episode image URL
            if (!empty($episode['image_url'])) {
                if (!filter_var($episode['image_url'], FILTER_VALIDATE_URL)) {
                    $episode['image_url'] = $baseUrl . '/uploads/images/' . basename($episode['image_url']);
                }
            }
            
            // Fix podcast image URL (fallback)
            if (!empty($episode['podcast_image_url'])) {
                if (!filter_var($episode['podcast_image_url'], FILTER_VALIDATE_URL)) {
                    $episode['podcast_image_url'] = $baseUrl . '/uploads/images/' . basename($episode['podcast_image_url']);
                }
            }
            
            // Format dates
            $episode['release_date_formatted'] = date('F j, Y', strtotime($episode['release_date']));
            $episode['created_at_formatted'] = date('F j, Y', strtotime($episode['created_at']));
            
            // Add file size information
            if (isset($episode['file_size'])) {
                $episode['file_size_formatted'] = formatFileSize($episode['file_size']);
            }
            
            if (isset($episode['video_size']) && $episode['video_size'] > 0) {
                $episode['video_size_formatted'] = formatFileSize($episode['video_size']);
            }
            
            // Ensure numeric fields are proper types
            $episode['episode_number'] = intval($episode['episode_number']);
            $episode['play_count'] = intval($episode['play_count']);
            $episode['download_count'] = intval($episode['download_count']);
            
            // Ensure added_by is properly formatted
            $episode['added_by'] = strtolower($episode['added_by']);
        }
        
        // Build response
        $response = [
            'success' => true,
            'data' => $episodes
        ];
        
        // Add pagination info if getting all episodes
        if (!isset($_GET['podcast_id'])) {
            $response['pagination'] = [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ];
        }
        
        echo json_encode($response);
    }
    
} catch (PDOException $e) {
    error_log("DATABASE ERROR in episodes/get.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error occurred'
    ]);
} catch (Exception $e) {
    error_log("ERROR in episodes/get.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred'
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