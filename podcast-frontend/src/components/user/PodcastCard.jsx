import { useState } from 'react';
import { Play, Pause, Heart, Share2, Bookmark, Clock, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const PodcastCard = ({ podcast, onPlay, isPlaying }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Get image URL helper function
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x300?text=No+Image';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost/Podcast/podcast-backend/uploads/${imageUrl}`;
  };

  // Format duration
  const formatDuration = (duration) => {
    if (!duration) return '';
    return duration;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    // Share functionality
    console.log('Share podcast:', podcast.title);
  };

  const handlePlayClick = (e) => {
    e.stopPropagation();
    onPlay();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={getImageUrl(podcast.image_url)}
          alt={podcast.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
          }}
        />
        
        {/* Explicit indicator */}
        {podcast.explicit && (
          <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur-sm rounded text-xs px-1.5 py-0.5 text-white font-medium">
            E
          </div>
        )}

        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlayClick}
            className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors duration-200"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6 text-gray-800" />
            ) : (
              <Play className="h-6 w-6 text-gray-800 ml-1" />
            )}
          </motion.button>
        </div>

        {/* Quick actions */}
        <div className="absolute top-2 left-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors duration-200 ${
              isLiked 
                ? 'bg-red-500 text-white' 
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBookmark}
            className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors duration-200 ${
              isBookmarked 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/80 text-gray-700 hover:bg-white'
            }`}
          >
            <Bookmark className="h-4 w-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </motion.button>
        </div>

        {/* Duration badge */}
        {podcast.duration && (
          <div className="absolute bottom-2 right-2 bg-gray-900/80 backdrop-blur-sm rounded text-xs px-2 py-1 text-white font-medium flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            {formatDuration(podcast.duration)}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-200">
          {podcast.title}
        </h3>

        {/* Author */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {podcast.author_name || 'Unknown Author'}
        </p>

        {/* Description */}
        {podcast.description && (
          <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2 mb-3">
            {podcast.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-3">
          {podcast.category && (
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
              {podcast.category}
            </span>
          )}
          
          {podcast.created_at && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(podcast.created_at)}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlayClick}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center mr-2"
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Play
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="w-10 h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors duration-200"
          >
            <Share2 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </motion.button>
        </div>
      </div>

      {/* Playing indicator */}
      {isPlaying && (
        <div className="absolute inset-0 border-2 border-purple-500 rounded-xl pointer-events-none">
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PodcastCard;