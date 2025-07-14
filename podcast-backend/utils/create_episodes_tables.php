<?php
// Database connection parameters
$host = "localhost";
$db_name = "podcast_app";
$username = "root";  // Change to your database username
$password = "";      // Change to your database password

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = "-- Create the episodes table
CREATE TABLE IF NOT EXISTS episodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    podcast_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    episode_number INT NOT NULL,
    audio_url VARCHAR(500) NOT NULL,
    duration INT NOT NULL DEFAULT 0 COMMENT 'Duration in seconds',
    file_size BIGINT DEFAULT 0 COMMENT 'Audio file size in bytes',
    release_date DATE DEFAULT CURRENT_DATE,
    play_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (podcast_id) REFERENCES podcasts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_episode (podcast_id, episode_number),
    INDEX idx_podcast_id (podcast_id),
    INDEX idx_episode_number (episode_number),
    INDEX idx_release_date (release_date),
    INDEX idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create the episode listening history table
CREATE TABLE IF NOT EXISTS episode_listening_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    episode_id INT NOT NULL,
    progress INT DEFAULT 0 COMMENT 'Progress in seconds',
    completed BOOLEAN DEFAULT FALSE,
    last_listened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_episode (user_id, episode_id),
    INDEX idx_user_id (user_id),
    INDEX idx_episode_id (episode_id),
    INDEX idx_last_listened (last_listened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    // Execute query
    $conn->exec($sql);
    
    echo "Episodes tables created successfully!";
} catch(PDOException $e) {
    echo "Error: " . $e->getMessage();
}

$conn = null;
?>