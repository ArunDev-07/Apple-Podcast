-- ========================================
-- Podcast App Database Schema
-- Complete SQL file for database setup
-- ========================================

-- Drop existing database and recreate (CAREFUL: This will delete all data!)
DROP DATABASE IF EXISTS podcast_app;
CREATE DATABASE podcast_app;
USE podcast_app;

-- Set character set and collation
ALTER DATABASE podcast_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ========================================
-- USERS TABLE
-- ========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    avatar_url VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PODCASTS TABLE
-- ========================================
CREATE TABLE podcasts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    audio_url VARCHAR(500) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    duration INT DEFAULT 0 COMMENT 'Duration in seconds',
    file_size BIGINT DEFAULT 0 COMMENT 'Audio file size in bytes',
    play_count INT DEFAULT 0,
    download_count INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_published (is_published),
    INDEX idx_created_at (created_at),
    FULLTEXT KEY idx_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- EPISODES TABLE (NEW)
-- ========================================
CREATE TABLE episodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    podcast_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    episode_number INT NOT NULL,
    audio_url VARCHAR(500) NOT NULL,
    duration INT NOT NULL DEFAULT 0 COMMENT 'Duration in seconds',
    file_size BIGINT DEFAULT 0 COMMENT 'Audio file size in bytes',
    release_date DATE NOT NULL,
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
    INDEX idx_published (is_published),
    FULLTEXT KEY idx_episode_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PODCAST CATEGORIES TABLE (Optional - for better category management)
-- ========================================
CREATE TABLE podcast_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    icon VARCHAR(50) DEFAULT NULL,
    color VARCHAR(7) DEFAULT '#000000',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- USER FAVORITES TABLE
-- ========================================
CREATE TABLE user_favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    podcast_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (podcast_id) REFERENCES podcasts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, podcast_id),
    INDEX idx_user_id (user_id),
    INDEX idx_podcast_id (podcast_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- USER PLAYLISTS TABLE
-- ========================================
CREATE TABLE playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- PLAYLIST ITEMS TABLE
-- ========================================
CREATE TABLE playlist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL,
    podcast_id INT NOT NULL,
    position INT DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (podcast_id) REFERENCES podcasts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_playlist_item (playlist_id, podcast_id),
    INDEX idx_playlist_id (playlist_id),
    INDEX idx_podcast_id (podcast_id),
    INDEX idx_position (position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- LISTENING HISTORY TABLE
-- ========================================
CREATE TABLE listening_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    podcast_id INT NOT NULL,
    progress INT DEFAULT 0 COMMENT 'Progress in seconds',
    completed BOOLEAN DEFAULT FALSE,
    last_listened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (podcast_id) REFERENCES podcasts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_podcast (user_id, podcast_id),
    INDEX idx_user_id (user_id),
    INDEX idx_podcast_id (podcast_id),
    INDEX idx_last_listened (last_listened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- EPISODE LISTENING HISTORY TABLE (NEW)
-- ========================================
CREATE TABLE episode_listening_history (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- COMMENTS TABLE
-- ========================================
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    podcast_id INT NOT NULL,
    parent_id INT DEFAULT NULL COMMENT 'For nested comments/replies',
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (podcast_id) REFERENCES podcasts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_podcast_id (podcast_id),
    INDEX idx_parent_id (parent_id),
    INDEX idx_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- RATINGS TABLE
-- ========================================
CREATE TABLE ratings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    podcast_id INT NOT NULL,
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (podcast_id) REFERENCES podcasts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_rating (user_id, podcast_id),
    INDEX idx_user_id (user_id),
    INDEX idx_podcast_id (podcast_id),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- INSERT SAMPLE DATA
-- ========================================

-- Insert default users
INSERT INTO users (name, email, password, role, bio) VALUES
('Admin User', 'admin@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System administrator and podcast creator'),
('Test User', 'user@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Regular user and podcast enthusiast'),
('John Doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Technology enthusiast and content creator'),
('Jane Smith', 'jane@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Business analyst and podcast host');

-- Insert podcast categories
INSERT INTO podcast_categories (name, slug, description, icon, color) VALUES
('Technology', 'Technology', 'All about tech, programming, and innovation', '💻', '#3B82F6'),
('Business', 'Business', 'Entrepreneurship, finance, and business insights', '💼', '#10B981'),
('Education', 'Education', 'Learning, teaching, and educational content', '📚', '#F59E0B'),
('Entertainment', 'Entertainment', 'Fun, games, movies, and entertainment', '🎭', '#EF4444'),
('Health & Fitness', 'Health-fitness', 'Wellness, fitness, and healthy living', '💪', '#8B5CF6'),
('Science', 'science', 'Scientific discoveries and research', '🔬', '#06B6D4'),
('Sports', 'sports', 'Sports news, analysis, and commentary', '⚽', '#F97316'),
('News', 'news', 'Current events and news analysis', '📰', '#6B7280'),
('Arts & Culture', 'Arts-culture', 'Arts, culture, and creative content', '🎨', '#EC4899'),
('History', 'history', 'Historical events and stories', '📜', '#92400E'),
('Comedy', 'comedy', 'Humor, comedy shows, and funny content', '😂', '#FBBF24'),
('Music', 'music', 'Music, artists, and musical content', '🎵', '#A855F7');

-- Insert sample podcasts (only basic ones since we need actual files for audio_url and image_url)
INSERT INTO podcasts (user_id, title, description, audio_url, image_url, category, duration, file_size) VALUES
(1, 'Tech Talk Daily', 'Daily discussions about the latest in technology, programming, and digital innovation. Join us as we explore the future of tech.', 'audio/sample-tech-talk.mp3', 'images/tech-talk-cover.jpg', 'Technology', 1800, 25600000),
(1, 'Business Insights Weekly', 'Weekly deep dives into business strategies, market analysis, and entrepreneurship tips for modern business leaders.', 'audio/sample-business.mp3', 'images/business-cover.jpg', 'Business', 2400, 32000000),
(2, 'Health & Wellness Today', 'Your daily dose of health tips, fitness advice, and wellness strategies for a better lifestyle.', 'audio/sample-health.mp3', 'images/health-cover.jpg', 'Health & Fitness', 1500, 20480000),
(3, 'Science Frontiers', 'Exploring the cutting edge of scientific research and breakthrough discoveries that shape our world.', 'audio/sample-science.mp3', 'images/science-cover.jpg', 'Science', 2100, 28672000);

-- Insert sample episodes for the podcasts (NEW)
INSERT INTO episodes (podcast_id, title, description, episode_number, audio_url, duration, release_date) VALUES
-- Tech Talk Daily episodes
(1, 'AI Revolution in 2024', 'Exploring the latest developments in artificial intelligence and machine learning', 1, 'audio/tech-talk-ep1.mp3', 1800, '2024-01-01'),
(1, 'Web3 and Blockchain Basics', 'Understanding the fundamentals of decentralized technologies', 2, 'audio/tech-talk-ep2.mp3', 2100, '2024-01-08'),
(1, 'Cybersecurity Best Practices', 'Essential security tips for developers and users', 3, 'audio/tech-talk-ep3.mp3', 1650, '2024-01-15'),

-- Business Insights Weekly episodes
(2, 'Startup Success Stories', 'Learning from successful entrepreneurs and their journeys', 1, 'audio/business-ep1.mp3', 2400, '2024-01-05'),
(2, 'Market Analysis Q1 2024', 'Breaking down market trends and opportunities', 2, 'audio/business-ep2.mp3', 2700, '2024-01-12'),

-- Health & Wellness Today episodes
(3, 'Morning Routine Mastery', 'Building healthy habits for a productive day', 1, 'audio/health-ep1.mp3', 1500, '2024-01-02'),
(3, 'Nutrition Myths Debunked', 'Separating fact from fiction in nutrition', 2, 'audio/health-ep2.mp3', 1800, '2024-01-09'),

-- Science Frontiers episodes
(4, 'Quantum Computing Explained', 'Breaking down complex quantum concepts', 1, 'audio/science-ep1.mp3', 2100, '2024-01-03'),
(4, 'Climate Change Solutions', 'Innovative approaches to environmental challenges', 2, 'audio/science-ep2.mp3', 2400, '2024-01-10');

-- Insert some sample playlists
INSERT INTO playlists (user_id, name, description, is_public) VALUES
(2, 'My Favorites', 'Collection of my favorite podcast episodes', FALSE),
(2, 'Tech Learning', 'Technology and programming podcasts for learning', TRUE),
(3, 'Daily Commute', 'Perfect podcasts for my daily commute', FALSE),
(4, 'Business Growth', 'Podcasts about business and entrepreneurship', TRUE);

-- Insert some playlist items
INSERT INTO playlist_items (playlist_id, podcast_id, position) VALUES
(1, 1, 1),
(1, 3, 2),
(2, 1, 1),
(2, 4, 2),
(3, 2, 1),
(3, 3, 2),
(4, 2, 1);

-- Insert some sample listening history
INSERT INTO listening_history (user_id, podcast_id, progress, completed) VALUES
(2, 1, 900, FALSE),
(2, 3, 1500, TRUE),
(3, 1, 1800, TRUE),
(3, 2, 1200, FALSE),
(4, 2, 2400, TRUE);

-- Insert some sample episode listening history (NEW)
INSERT INTO episode_listening_history (user_id, episode_id, progress, completed) VALUES
(2, 1, 900, FALSE),
(2, 2, 2100, TRUE),
(3, 3, 1650, TRUE),
(3, 4, 1200, FALSE),
(4, 5, 2700, TRUE);

-- Insert some sample favorites
INSERT INTO user_favorites (user_id, podcast_id) VALUES
(2, 1),
(2, 3),
(3, 1),
(3, 2),
(4, 2),
(4, 4);

-- ========================================
-- CREATE VIEWS FOR COMMON QUERIES
-- ========================================

-- View for podcast statistics
CREATE VIEW podcast_stats AS
SELECT 
    p.id,
    p.title,
    p.user_id,
    u.name as author_name,
    p.play_count,
    p.download_count,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_ratings,
    COUNT(DISTINCT c.id) as total_comments,
    COUNT(DISTINCT f.id) as total_favorites,
    COUNT(DISTINCT e.id) as total_episodes
FROM podcasts p
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN ratings r ON p.id = r.podcast_id
LEFT JOIN comments c ON p.id = c.podcast_id AND c.is_approved = TRUE
LEFT JOIN user_favorites f ON p.id = f.podcast_id
LEFT JOIN episodes e ON p.id = e.podcast_id AND e.is_published = TRUE
WHERE p.is_published = TRUE
GROUP BY p.id;

-- View for episode statistics (NEW)
CREATE VIEW episode_stats AS
SELECT 
    e.id,
    e.podcast_id,
    e.title,
    e.episode_number,
    e.play_count,
    e.download_count,
    p.title as podcast_title,
    u.name as author_name,
    COUNT(DISTINCT elh.user_id) as unique_listeners,
    AVG(CASE WHEN elh.completed = TRUE THEN 100 ELSE (elh.progress / e.duration * 100) END) as avg_completion_rate
FROM episodes e
LEFT JOIN podcasts p ON e.podcast_id = p.id
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN episode_listening_history elh ON e.id = elh.episode_id
WHERE e.is_published = TRUE
GROUP BY e.id;

-- View for user dashboard statistics
CREATE VIEW user_dashboard_stats AS
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    COUNT(DISTINCT p.id) as total_podcasts,
    COUNT(DISTINCT e.id) as total_episodes,
    COALESCE(SUM(p.play_count), 0) as total_plays,
    COALESCE(SUM(p.download_count), 0) as total_downloads,
    COALESCE(SUM(p.duration), 0) as total_duration,
    COUNT(DISTINCT f.id) as total_favorites_received,
    COUNT(DISTINCT pl.id) as total_playlists
FROM users u
LEFT JOIN podcasts p ON u.id = p.user_id AND p.is_published = TRUE
LEFT JOIN episodes e ON p.id = e.podcast_id AND e.is_published = TRUE
LEFT JOIN user_favorites f ON p.id = f.podcast_id
LEFT JOIN playlists pl ON u.id = pl.user_id
GROUP BY u.id;

-- ========================================
-- CREATE STORED PROCEDURES
-- ========================================

DELIMITER //

-- Procedure to increment play count
CREATE PROCEDURE IncrementPlayCount(IN podcast_id INT, IN user_id INT)
BEGIN
    -- Update podcast play count
    UPDATE podcasts SET play_count = play_count + 1 WHERE id = podcast_id;
    
    -- Update or insert listening history
    INSERT INTO listening_history (user_id, podcast_id, progress, last_listened_at)
    VALUES (user_id, podcast_id, 0, NOW())
    ON DUPLICATE KEY UPDATE 
        last_listened_at = NOW();
END //

-- Procedure to increment episode play count (NEW)
CREATE PROCEDURE IncrementEpisodePlayCount(IN p_episode_id INT, IN p_user_id INT)
BEGIN
    -- Update episode play count
    UPDATE episodes SET play_count = play_count + 1 WHERE id = p_episode_id;
    
    -- Update podcast play count
    UPDATE podcasts p
    JOIN episodes e ON p.id = e.podcast_id
    SET p.play_count = p.play_count + 1
    WHERE e.id = p_episode_id;
    
    -- Update or insert episode listening history
    INSERT INTO episode_listening_history (user_id, episode_id, progress, last_listened_at)
    VALUES (p_user_id, p_episode_id, 0, NOW())
    ON DUPLICATE KEY UPDATE 
        last_listened_at = NOW();
END //

-- Procedure to update listening progress
CREATE PROCEDURE UpdateListeningProgress(IN p_user_id INT, IN p_podcast_id INT, IN p_progress INT)
BEGIN
    DECLARE podcast_duration INT DEFAULT 0;
    
    -- Get podcast duration
    SELECT duration INTO podcast_duration FROM podcasts WHERE id = p_podcast_id;
    
    -- Update listening history
    INSERT INTO listening_history (user_id, podcast_id, progress, completed, last_listened_at)
    VALUES (p_user_id, p_podcast_id, p_progress, (p_progress >= podcast_duration * 0.9), NOW())
    ON DUPLICATE KEY UPDATE 
        progress = p_progress,
        completed = (p_progress >= podcast_duration * 0.9),
        last_listened_at = NOW();
END //

-- Procedure to update episode listening progress (NEW)
CREATE PROCEDURE UpdateEpisodeListeningProgress(IN p_user_id INT, IN p_episode_id INT, IN p_progress INT)
BEGIN
    DECLARE episode_duration INT DEFAULT 0;
    
    -- Get episode duration
    SELECT duration INTO episode_duration FROM episodes WHERE id = p_episode_id;
    
    -- Update episode listening history
    INSERT INTO episode_listening_history (user_id, episode_id, progress, completed, last_listened_at)
    VALUES (p_user_id, p_episode_id, p_progress, (p_progress >= episode_duration * 0.9), NOW())
    ON DUPLICATE KEY UPDATE 
        progress = p_progress,
        completed = (p_progress >= episode_duration * 0.9),
        last_listened_at = NOW();
END //

DELIMITER ;

-- ========================================
-- CREATE TRIGGERS
-- ========================================

-- Trigger to update podcast updated_at when rating is added/updated
DELIMITER //
CREATE TRIGGER update_podcast_on_rating 
AFTER INSERT ON ratings 
FOR EACH ROW
BEGIN
    UPDATE podcasts SET updated_at = NOW() WHERE id = NEW.podcast_id;
END //

-- Trigger to update podcast updated_at when episode is added/updated (NEW)
CREATE TRIGGER update_podcast_on_episode_insert
AFTER INSERT ON episodes
FOR EACH ROW
BEGIN
    UPDATE podcasts SET updated_at = NOW() WHERE id = NEW.podcast_id;
END //

CREATE TRIGGER update_podcast_on_episode_update
AFTER UPDATE ON episodes
FOR EACH ROW
BEGIN
    UPDATE podcasts SET updated_at = NOW() WHERE id = NEW.podcast_id;
END //

DELIMITER ;

-- ========================================
-- FINAL STATUS CHECK
-- ========================================

-- Show table information
SELECT 
    TABLE_NAME as 'Table',
    TABLE_ROWS as 'Rows',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Size (MB)'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'podcast_app'
ORDER BY TABLE_NAME;

-- Show sample data counts
SELECT 'Users' as Entity, COUNT(*) as Count FROM users
UNION ALL
SELECT 'Podcasts', COUNT(*) FROM podcasts
UNION ALL
SELECT 'Episodes', COUNT(*) FROM episodes
UNION ALL
SELECT 'Categories', COUNT(*) FROM podcast_categories
UNION ALL
SELECT 'Playlists', COUNT(*) FROM playlists
UNION ALL
SELECT 'Favorites', COUNT(*) FROM user_favorites
UNION ALL
SELECT 'Listening History', COUNT(*) FROM listening_history
UNION ALL
SELECT 'Episode History', COUNT(*) FROM episode_listening_history;

-- ========================================
-- NOTES:
-- ========================================
-- 1. Default password for all users is: password
-- 2. Make sure to create these directories in your backend:
--    - uploads/audio/
--    - uploads/images/
-- 3. Set proper file permissions: chmod 755 uploads uploads/audio uploads/images
-- 4. Update your backend configuration to match this schema
-- 5. Consider adding indexes based on your query patterns
-- 6. Remember to backup your database before running this script
-- 7. NEW: Episodes are now supported with their own listening history
-- ========================================