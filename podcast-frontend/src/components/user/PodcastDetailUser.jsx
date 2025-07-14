import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Clock, 
  Calendar, 
  ListMusic,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  SkipBack,
  SkipForward,
  X,
  Volume2,
  VolumeX,
  FastForward,
  Rewind,
  Bookmark,
  Video,
  Maximize,
  Minimize,
  Heart,
  Star,
  Share2,
  Music
} from 'lucide-react';
import AudioPlayer from './AudioPlayer';

const ApplePodcastDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [podcast, setPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeEpisodeId, setActiveEpisodeId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [activeTab, setActiveTab] = useState('audio');
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  
  // API Base URL
  const API_BASE_URL = 'http://localhost/Podcast/podcast-backend/api';

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };


   useEffect(() => {
    if (selectedEpisode) {
      console.log("Selected episode changed, preparing to play:", selectedEpisode.title);
      
      // Short timeout to ensure DOM has updated
      const timer = setTimeout(() => {
        if (hasVideo(selectedEpisode)) {
          if (videoRef.current) {
            console.log("Attempting to play video...");
            videoRef.current.load(); // Force reload with new source
            
            // The play promise
            const playPromise = videoRef.current.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Video playback started successfully");
                  setIsPlaying(true);
                })
                .catch(err => {
                  console.error("Video auto-play was prevented:", err);
                  // Try one more time with user interaction
                  const userPlayHandler = () => {
                    videoRef.current.play();
                    document.removeEventListener('click', userPlayHandler);
                  };
                  document.addEventListener('click', userPlayHandler, { once: true });
                });
            }
          }
        } else {
          if (audioRef.current) {
            console.log("Attempting to play audio...");
            audioRef.current.load();
            
            const playPromise = audioRef.current.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log("Audio playback started successfully");
                  setIsPlaying(true);
                })
                .catch(err => {
                  console.error("Audio auto-play was prevented:", err);
                });
            }
          }
        }
      }, 300); // Slightly longer delay to ensure everything is ready
      
      return () => clearTimeout(timer);
    }
  }, [selectedEpisode]);                  

  // API Headers with authorization
  const getApiHeaders = () => {
    return {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    };
  };

  // Format time helper
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get file type from URL
  const getFileType = (url) => {
    if (!url) return 'unknown';
    
    // Check if URL has an extension
    const extension = url.split('.').pop().toLowerCase();
    
    // Check file extensions
    if (['mp3', 'wav', 'ogg', 'aac', 'm4a'].includes(extension)) {
      return 'audio';
    } else if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension)) {
      return 'video';
    }
    return 'unknown';
  };
  
  // Enhanced function to check if an episode has video
  const hasVideo = (episode) => {
    if (!episode) return false;
    
    // First check if there's a video_url property (matching admin page)
    if (episode.video_url && episode.video_url.trim() !== '') {
      return true;
    }
    
    // Then fall back to extension check
    return getFileType(episode.audio_url) === 'video';
  };

  // Get media URL for episode
  const getMediaUrl = (mediaUrl) => {
    if (!mediaUrl) return '';
    
    // If it's already a full URL, return it as is
    if (mediaUrl.startsWith('http')) return mediaUrl;
    
    // Otherwise, prepend the server path
    return `http://localhost/Podcast/podcast-backend/uploads/${mediaUrl}`;
  };
  
  // Get video URL for the episode
  const getVideoUrl = (episode) => {
    if (!episode) return '';
    
    // First try to use video_url if it exists
    if (episode.video_url) {
      return getMediaUrl(episode.video_url);
    }
    
    // Otherwise, if the audio_url is detected as a video, use that
    if (getFileType(episode.audio_url) === 'video') {
      return getMediaUrl(episode.audio_url);
    }
    
    // Fallback to audio_url even if it's not a video
    return getMediaUrl(episode.audio_url);
  };
  
  // Get media type for content type attribute
  const getMediaType = (episode) => {
    if (!episode) return 'audio/mpeg';
    
    if (episode.video_url) {
      // If it has an explicit video_url, assume it's an MP4
      return 'video/mp4';
    }
    
    // Check the file extension to determine the correct MIME type
    const extension = episode.audio_url ? episode.audio_url.split('.').pop().toLowerCase() : '';
    
    switch (extension) {
      case 'mp4': return 'video/mp4';
      case 'webm': return 'video/webm';
      case 'ogg': return episode.video_url ? 'video/ogg' : 'audio/ogg';
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'aac': return 'audio/aac';
      case 'm4a': return 'audio/mp4';
      default: return hasVideo(episode) ? 'video/mp4' : 'audio/mpeg';
    }
  };

  // Navigate back to user page
  const handleBackNavigation = () => {
    navigate('/user');
  };

  // Fetch podcast data
  const fetchPodcast = async () => {
    try {
      setLoading(true);
      
      // Fetch podcast details
      const response = await fetch(`${API_BASE_URL}/podcasts/get.php?id=${id}`, {
        headers: getApiHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to load podcast');
      }
      
      const data = await response.json();
      setPodcast(data);
      
      // Fetch podcast status (liked, bookmarked)
      try {
        const statusResponse = await fetch(`${API_BASE_URL}/library/status.php?podcast_id=${id}`, {
          headers: getApiHeaders()
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setIsLiked(statusData.liked || false);
          setIsBookmarked(statusData.bookmarked || false);
        }
      } catch (error) {
        console.error('Error loading podcast status:', error);
      }
      
      // Fetch episodes
      const episodesResponse = await fetch(`${API_BASE_URL}/episodes/get.php?podcast_id=${id}`, {
        headers: getApiHeaders()
      });
      
      if (!episodesResponse.ok) {
        throw new Error('Failed to load episodes');
      }
      
      let episodesData = await episodesResponse.json();
      
      // Handle different response formats
      if (typeof episodesData === 'object' && episodesData.success) {
        episodesData = episodesData.data;
      }
      
      // Sort episodes by episode number
      if (Array.isArray(episodesData)) {
        episodesData.sort((a, b) => Number(a.episode_number) - Number(b.episode_number));
        setEpisodes(episodesData);
        
        // Auto-select first episode if available
        if (episodesData.length > 0) {
          setActiveEpisodeId(episodesData[0].id);
        }
      } else {
        setEpisodes([]);
      }
    } catch (error) {
      console.error('Error fetching podcast details:', error);
      setError('Failed to load podcast. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle liking a podcast
  const handleLikePodcast = async () => {
    if (loadingAction) return;
    
    setLoadingAction(true);
    try {
      if (isLiked) {
        // Unlike the podcast - DELETE request
        const response = await fetch(`${API_BASE_URL}/library/like.php?podcast_id=${podcast.id}`, {
          method: 'DELETE',
          headers: getApiHeaders()
        });
        
        if (response.ok) {
          setIsLiked(false);
        }
      } else {
        // Like the podcast - POST request
        const response = await fetch(`${API_BASE_URL}/library/like.php`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            podcast_id: podcast.id
          })
        });
        
        if (response.ok) {
          setIsLiked(true);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to update like status. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle bookmarking a podcast
  const handleBookmarkPodcast = async () => {
    if (loadingAction) return;
    
    setLoadingAction(true);
    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`${API_BASE_URL}/library/bookmark.php?podcast_id=${podcast.id}`, {
          method: 'DELETE',
          headers: getApiHeaders()
        });
        
        if (response.ok) {
          setIsBookmarked(false);
        }
      } else {
        // Add bookmark
        const response = await fetch(`${API_BASE_URL}/library/bookmark.php`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            podcast_id: podcast.id
          })
        });
        
        if (response.ok) {
          setIsBookmarked(true);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark status. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  // Play a specific episode
  const playEpisode = (episode) => {
    if (selectedEpisode?.id === episode.id) {
      // Toggle play/pause if it's the same episode
      setIsPlaying(!isPlaying);
      
      // Directly control the media element
      if (hasVideo(episode)) {
        if (videoRef.current) {
          if (isPlaying) {
            videoRef.current.pause();
          } else {
            videoRef.current.play().catch(err => {
              console.error("Play failed:", err);
            });
          }
        }
      } else {
        if (audioRef.current) {
          if (isPlaying) {
            audioRef.current.pause();
          } else {
            audioRef.current.play().catch(err => {
              console.error("Play failed:", err);
            });
          }
        }
      }
    } else {
      // Play new episode
      setSelectedEpisode(episode);
      setActiveEpisodeId(episode.id);
      setIsPlaying(true);
      
      // Reset time
      setCurrentTime(0);
      
      // Track play in backend
      try {
        fetch(`${API_BASE_URL}/library/play.php`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            podcast_id: podcast.id,
            episode_id: episode.id,
            progress: 0,
            duration: episode.duration || 0
          })
        });
      } catch (error) {
        console.error('Error tracking play count:', error);
      }
    }
  };

  // Format a date string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Format duration from minutes to readable string
  const formatDuration = (minutes) => {
    if (!minutes) return 'Unknown';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Get image URL for podcast/episode
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost/Podcast/podcast-backend/uploads/${imageUrl}`;
  };

  // Handle share functionality
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: podcast.title,
        text: podcast.description,
        url: window.location.href
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Player controls
  const handleClosePlayer = () => {
    setSelectedEpisode(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleNextEpisode = () => {
    if (!selectedEpisode) return;
    
    const currentEpisodes = getCurrentEpisodes();
    const currentIndex = currentEpisodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex < currentEpisodes.length - 1) {
      const nextEpisode = currentEpisodes[currentIndex + 1];
      console.log("Setting next episode:", nextEpisode.title || nextEpisode.id);
      
      // Just set the new episode - the useEffect will handle playback
      setSelectedEpisode(nextEpisode);
      setActiveEpisodeId(nextEpisode.id);
      setCurrentTime(0);
      
      // Track play in backend
      try {
        fetch(`${API_BASE_URL}/library/play.php`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            podcast_id: podcast.id,
            episode_id: nextEpisode.id,
            progress: 0,
            duration: nextEpisode.duration || 0
          })
        });
      } catch (error) {
        console.error('Error tracking play count:', error);
      }
    }
  };

  const handlePreviousEpisode = () => {
    if (!selectedEpisode) return;
    
    const currentEpisodes = getCurrentEpisodes();
    const currentIndex = currentEpisodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex > 0) {
      const prevEpisode = currentEpisodes[currentIndex - 1];
      console.log("Setting previous episode:", prevEpisode.title || prevEpisode.id);
      
      // Just set the new episode - the useEffect will handle playback
      setSelectedEpisode(prevEpisode);
      setActiveEpisodeId(prevEpisode.id);
      setCurrentTime(0);
      
      // Track play in backend
      try {
        fetch(`${API_BASE_URL}/library/play.php`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            podcast_id: podcast.id,
            episode_id: prevEpisode.id,
            progress: 0,
            duration: prevEpisode.duration || 0
          })
        });
      } catch (error) {
        console.error('Error tracking play count:', error);
      }
    }
  };

  // Filter episodes by media type
  const audioEpisodes = episodes.filter(episode => !hasVideo(episode));
  const videoEpisodes = episodes.filter(episode => hasVideo(episode));

  // Get current episodes based on active tab
  const getCurrentEpisodes = () => {
    return activeTab === 'audio' ? audioEpisodes : videoEpisodes;
  };
  
  // Effect for fetching podcast data
  useEffect(() => {
    if (id) {
      fetchPodcast();
    }
  }, [id]);
  
  // Debug effect for selected episode
  useEffect(() => {
    // Log the details of the currently selected episode for debugging
    if (selectedEpisode) {
      console.log('Selected episode:', selectedEpisode);
      console.log('Is video?', hasVideo(selectedEpisode));
      console.log('Media URL:', getVideoUrl(selectedEpisode));
      console.log('Media type:', getMediaType(selectedEpisode));
    }
  }, [selectedEpisode]);
  
  // This ensures all navigation happens in the current tab
  useEffect(() => {
    // Add event listener to all links to prevent them from opening in new tabs
    const handleClick = (e) => {
      // If it's a link that would open in a new tab, prevent default behavior
      if (e.target.tagName === 'A' && e.target.target === '_blank') {
        e.preventDefault();
        const href = e.target.href;
        if (href) {
          navigate(href);
        }
      }
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 border-4 border-indigo-200/30 dark:border-indigo-600/20 rounded-full border-t-indigo-600 dark:border-t-indigo-400 animate-spin mx-auto"></div>
          <p className="mt-8 text-indigo-700 dark:text-indigo-300 text-xl font-medium">Loading your podcast experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20">
          <div className="w-20 h-20 bg-red-100/80 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="h-10 w-10 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Podcast</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{error}</p>
          <button 
            onClick={handleBackNavigation}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full font-semibold shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/30"
          >
            Back to User Page
          </button>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/20">
          <div className="w-20 h-20 bg-yellow-100/80 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="h-10 w-10 text-yellow-500 dark:text-yellow-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Podcast Not Found</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8">The podcast you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={handleBackNavigation}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full font-semibold shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/30"
          >
            Back to User Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-indigo-50/30 to-white dark:from-gray-900 dark:via-indigo-950/30 dark:to-gray-900 overflow-x-hidden">
      {/* Navigation Bar */}
      <div className="h-16 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-700/60 flex items-center px-4 sm:px-6 lg:px-8 sticky top-0 z-50 shadow-lg">
        <button 
          onClick={handleBackNavigation}
          className="p-2.5 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:shadow-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="ml-4 text-lg font-bold text-gray-900 dark:text-white truncate">
          {podcast.title}
        </h1>
        
        {/* Add right-side navigation icons */}
        <div className="ml-auto flex items-center space-x-2">
         
        </div>
      </div>

      {/* Enhanced Header Section */}
      <div className="relative">
        {/* Animated gradient background overlay with blurred podcast cover */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/30 via-purple-500/20 to-transparent dark:from-indigo-900/40 dark:via-purple-800/30 dark:to-transparent"></div>
          <img 
            src={getImageUrl(podcast.image_url)} 
            alt="" 
            className="w-full h-full object-cover blur-3xl opacity-40 dark:opacity-20 scale-110 transform animate-pulse"
            style={{animationDuration: '8s'}}
          />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
          <div className="md:flex items-start">
            {/* Podcast Cover with premium effects */}
            <div className="md:w-64 flex-shrink-0 mb-8 md:mb-0 md:mr-8">
              <div className="rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(79,70,229,0.3)] dark:shadow-[0_20px_50px_rgba(79,70,229,0.2)] transform hover:scale-[1.02] transition-all duration-500 group relative">
                {/* Animated gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-purple-600/0 group-hover:from-indigo-600/20 group-hover:to-purple-600/30 transition-all duration-500 z-10"></div>
                
                {/* Podcast image with zoom effect */}
                <img 
                  src={getImageUrl(podcast.image_url)} 
                  alt={podcast.title} 
                  className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop';
                  }}
                />
                
                {/* Category badge with first letter capitalized */}
                {podcast.category && (
                  <div className="absolute top-3 right-3 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold rounded-full">
                    {podcast.category.charAt(0).toUpperCase() + podcast.category.slice(1)}
                  </div>
                )}
                
                {episodes.length > 0 && (
                  <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-full flex items-center">
                    <ListMusic className="h-3 w-3 mr-1" />
                    {episodes.length} {episodes.length === 1 ? 'Episode' : 'Episodes'}
                  </div>
                )}
              </div>
              
              {/* Action buttons with premium styling */}
              <div className="mt-6 flex flex-col space-y-4">
                <button 
                  onClick={() => {
                    const currentEpisodes = getCurrentEpisodes();
                    if (currentEpisodes.length > 0) {
                      playEpisode(currentEpisodes[0]);
                    }
                  }}
                  disabled={getCurrentEpisodes().length === 0}
                  className="group flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 px-5 rounded-full font-semibold shadow-lg hover:shadow-indigo-500/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                  <Play className="h-4 w-4 mr-2 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-sm">Play Latest</span>
                </button>
                
                {/* UPDATED: Smaller action buttons with reduced gap */}
                <div className="flex justify-center items-center space-x-4">
                  {/* Like Button - Smaller size */}
                  <button 
                    onClick={handleLikePodcast}
                    disabled={loadingAction}
                    className={`group flex flex-col items-center transition-all`}
                  >
                    <div className={`p-2.5 rounded-full ${
                      isLiked 
                        ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-md' 
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                    } transform transition-all duration-300 group-hover:scale-105`}>
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-white' : 'group-hover:stroke-red-500 dark:group-hover:stroke-red-400'}`} />
                    </div>
                    <span className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {isLiked ? 'Liked' : 'Like'}
                    </span>
                  </button>
                  
                  {/* Bookmark Button - Smaller size */}
                  <button 
                    onClick={handleBookmarkPodcast}
                    disabled={loadingAction}
                    className={`group flex flex-col items-center transition-all`}
                  >
                    <div className={`p-2.5 rounded-full ${
                      isBookmarked 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md' 
                        : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm'
                    } transform transition-all duration-300 group-hover:scale-105`}>
                      <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-white' : 'group-hover:stroke-blue-500 dark:group-hover:stroke-blue-400'}`} />
                    </div>
                    <span className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {isBookmarked ? 'Saved' : 'Save'}
                    </span>
                  </button>
                  
                  {/* Share Button - Smaller size */}
                  <button 
                    onClick={handleShare}
                    className="group flex flex-col items-center transition-all"
                  >
                    <div className="p-2.5 rounded-full bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transform transition-all duration-300 group-hover:scale-105">
                      <Share2 className="h-4 w-4 group-hover:stroke-green-500 dark:group-hover:stroke-green-400" />
                    </div>
                    <span className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                      Share
                    </span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Podcast Info with glass morphism effect */}
            <div className="flex-1 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-xl border border-white/20 dark:border-gray-700/20">
              {/* Category and badges row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-indigo-100/90 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 border border-indigo-200/90 dark:border-indigo-800/50">
                  {podcast.category ? podcast.category.charAt(0).toUpperCase() + podcast.category.slice(1) : 'Podcast'}
                </span>
                
                {podcast.explicit && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100/90 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200/90 dark:border-red-800/50">
                    Explicit
                  </span>
                )}
                
                <div className="flex items-center sm:ml-auto mt-2 sm:mt-0">
                  
                 
                </div>
              </div>
              
              {/* Title with gradient effect */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-indigo-900 dark:from-white dark:to-indigo-200 mb-4 leading-tight">
                {podcast.title}
              </h1>
              
              {/* Author with icon */}
              <p className="text-lg text-indigo-700 dark:text-indigo-300 mb-6 font-medium flex items-center">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                By {podcast.author_name || 'Unknown Author'}
              </p>
              
              {/* About section with enhanced styling */}
              <div className="prose prose-lg max-w-none text-gray-600 dark:text-gray-300">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </span>
                  About
                </h3>
                <p className="leading-relaxed">{podcast.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Redesigned Episodes Section (based on screenshot) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 overflow-hidden">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100/60 dark:border-gray-700/40">
          {/* Tab Navigation - Keeping your original audio/video tabs */}
          <div className="px-6 py-5 sm:px-8 border-b border-gray-200/80 dark:border-gray-700/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All episodes</h2>
              
              <div className="flex bg-gray-100/80 dark:bg-gray-700/60 rounded-xl p-1 shadow-inner">
                <button
                  onClick={() => setActiveTab('audio')}
                  className={`flex items-center px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'audio'
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Music className={`h-4 w-4 mr-1.5 sm:mr-2 ${activeTab === 'audio' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                  Audio ({audioEpisodes.length})
                </button>
                
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex items-center px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'video'
                      ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Video className={`h-4 w-4 mr-1.5 sm:mr-2 ${activeTab === 'video' ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                  Video ({videoEpisodes.length})
                </button>
              </div>
            </div>
          </div>
          
          {/* Episodes list with the new design */}
          {getCurrentEpisodes().length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === 'audio' ? (
                  <Music className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                ) : (
                  <Video className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                No {activeTab === 'audio' ? 'Audio' : 'Video'} Episodes Available
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                This podcast doesn't have any {activeTab} episodes yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-3 overflow-hidden">
              {/* Sort episodes based on selected order */}
              {[...getCurrentEpisodes()]
                .sort((a, b) => Number(a.episode_number) - Number(b.episode_number))
                .map((episode, index) => (
                  <div 
                    key={episode.id}
                    className={`px-4 py-4 mx-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${
                      selectedEpisode?.id === episode.id 
                        ? 'bg-gray-50/70 dark:bg-gray-750/70 ring-1 ring-indigo-200 dark:ring-indigo-800/30' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 text-gray-500 dark:text-gray-400 font-medium w-14">
                        <div className="flex flex-col">
                          <span className="text-xs uppercase">EPISODE</span>
                          <span className="text-lg font-semibold">#{episode.episode_number || index + 1}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 px-3">
                        <a 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault();
                            playEpisode(episode);
                          }}
                          className="block group"
                        >
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-2">
                            {episode.title}
                          </h3>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                            {episode.description || 'No description available'}
                          </p>
                          
                          <div className="text-gray-500 dark:text-gray-400 text-sm">
                            {formatDate(episode.created_at)}
                          </div>
                        </a>
                      </div>
                      
                      <div className="flex-shrink-0">
                        <div className="relative group">
                          <img 
                            src={getImageUrl(episode.image_url || podcast.image_url)} 
                            alt={episode.title} 
                            className="w-24 h-24 sm:w-32 sm:h-20 rounded-lg object-cover shadow-md"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop';
                            }}
                          />
                          
                          <button
                            onClick={() => playEpisode(episode)}
                            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/40 transition-all duration-300"
                          >
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-lg transform scale-75 group-hover:scale-100">
                              {selectedEpisode?.id === episode.id && isPlaying ? (
                                <Pause className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <Play className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              )}
                            </div>
                          </button>
                          
                          {/* Media type indicator */}
                          <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm rounded-full p-1">
                            {hasVideo(episode) ? (
                              <Video className="h-2.5 w-2.5 text-white" />
                            ) : (
                              <Music className="h-2.5 w-2.5 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Media Player */}
      {selectedEpisode && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-700/80 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-50 animate-slideUp">
          {hasVideo(selectedEpisode) ? (
            // Premium Video Player
            <div className="h-auto p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  {/* Episode thumbnail with shine effect */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/60 dark:from-white/0 dark:to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl z-10"></div>
                    
                    <img 
                      src={getImageUrl(selectedEpisode.image_url || podcast.image_url)}
                      alt={selectedEpisode.title} 
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover shadow-md transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop';
                      }}
                    />
                  </div>
                  
                  {/* Episode title and podcast info */}
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                      {selectedEpisode.title || 'Episode'}
                    </h4>
                    <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                      {podcast.title}
                    </p>
                  </div>
                </div>
                
                {/* Control buttons */}
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Previous button */}
                  <button
                    onClick={handlePreviousEpisode}
                    className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30 disabled:opacity-50"
                    disabled={!selectedEpisode}
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                  </button>
                  
                  {/* Next button */}
                  <button
                    onClick={handleNextEpisode}
                    className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30 disabled:opacity-50"
                    disabled={!selectedEpisode}
                  >
                    <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                    </svg>
                  </button>
                  
                  {/* Close button */}
                  <button
                    onClick={handleClosePlayer}
                    className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50/80 dark:hover:bg-red-900/30"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>
              
              {/* Video Player Container with Enhanced UI */}
              <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
                <video
                  ref={videoRef}
                  className="w-full rounded-xl"
                  onError={(e) => {
                    console.error("Video playback error:", e);
                    alert("Error playing video. Please try another episode.");
                  }}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                      setDuration(videoRef.current.duration || 0);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      console.log("Video metadata loaded");
                      setDuration(videoRef.current.duration || 0);
                    }
                  }}
                  onEnded={() => {
                    console.log("Video ended, auto-playing next episode");
                    setIsPlaying(false);
                    handleNextEpisode(); // Auto-play next episode when current one ends
                  }}
                  onPlay={() => {
                    console.log("Video play event triggered");
                    setIsPlaying(true);
                  }}
                  onPause={() => {
                    console.log("Video pause event triggered");
                    setIsPlaying(false);
                  }}
                  preload="auto"
                  style={{
                    width: '100%', 
                    height: '200px',
                    objectFit: 'contain',
                    backgroundColor: '#000'
                  }}
                  controls
                >
                  <source src={getVideoUrl(selectedEpisode)} type={getMediaType(selectedEpisode)} />
                  Your browser does not support the video tag.
                </video>
              </div>
              
              {/* Enhanced Custom Controls */}
              <div className="flex items-center justify-between mt-4 px-1 sm:px-2">
                <div className="flex items-center space-x-4">
                  {/* Rewind button */}
                  <button 
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                      }
                    }}
                    className="group p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30"
                  >
                    <div className="relative">
                      <Rewind className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
                      <span className="absolute -top-1 -right-1 text-[8px] sm:text-[10px] font-bold">10</span>
                    </div>
                  </button>
                  
                  {/* Play/Pause button */}
                  <button 
                    onClick={() => {
                      if (videoRef.current) {
                        if (isPlaying) {
                          videoRef.current.pause();
                        } else {
                          videoRef.current.play().catch(err => {
                            console.error("Play failed:", err);
                          });
                        }
                      }
                    }}
                    className="p-2.5 sm:p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-full text-white shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:scale-105"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
                    ) : (
                      <Play className="h-5 w-5 sm:h-6 sm:w-6 ml-0.5" />
                    )}
                  </button>
                  
                  {/* Fast forward button */}
                  <button 
                    onClick={() => {
                      if (videoRef.current) {
                        videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
                      }
                    }}
                    className="group p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30"
                  >
                    <div className="relative">
                      <FastForward className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
                      <span className="absolute -top-1 -right-1 text-[8px] sm:text-[10px] font-bold">10</span>
                    </div>
                  </button>
                </div>
                
                {/* Time and fullscreen controls */}
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">
                    <span className="tabular-nums">{formatTime(currentTime)}</span> / <span className="tabular-nums">{formatTime(duration)}</span>
                  </div>
                  
                  {/* Fullscreen button */}
                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        if (document.fullscreenElement) {
                          document.exitFullscreen();
                        } else {
                          videoRef.current.requestFullscreen();
                        }
                      }}}
                    className="p-1.5 sm:p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-indigo-50/80 dark:hover:bg-indigo-900/30 transform hover:scale-105"
                  >
                    <Maximize className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>
              
              {/* Video file info - helps debug video playback issues */}
              {selectedEpisode && (
                <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                  {selectedEpisode.video_url ? `Video: ${selectedEpisode.video_url}` : `Audio: ${selectedEpisode.audio_url}`}
                </div>
              )}
            </div>
          ) : (
            // Use the custom AudioPlayer component for audio content
            <AudioPlayer
              podcast={podcast}
              episode={selectedEpisode}
              onClose={handleClosePlayer}
              onNext={handleNextEpisode}
              onPrevious={handlePreviousEpisode}
            />
          )}
        </div>
      )}
      
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 10px rgba(79, 70, 229, 0.5); }
          50% { box-shadow: 0 0 20px rgba(79, 70, 229, 0.8); }
        }
        
        /* Add smooth transitions to all elements for better UX */
        * {
          transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        
        /* Hide scrollbars but keep scrolling functionality */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        /* Gradient text effect */
        .text-gradient {
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
          background-image: linear-gradient(to right, #4f46e5, #7e22ce);
        }
        
        /* Floating animation for cover art */
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        /* Progress bar styling */
        .progress-bar {
          height: 6px;
          background-color: rgba(209, 213, 219, 0.3);
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        
        .progress-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(to right, #4f46e5, #7e22ce);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        /* Custom glassmorphism for cards */
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
        }
        
        .dark .glass-card {
          background: rgba(30, 41, 59, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .podcast-cover {
            max-width: 250px;
            margin-left: auto;
            margin-right: auto;
          }
          
          .episode-card {
            padding: 12px;
          }
          
          .episode-image {
            width: 100%;
            height: 160px;
          }
          
          .media-player-container {
            padding: 12px;
          }
          
          controls {
            flex-wrap: wrap;
            gap: 8px;
          }
          
          .media-time {
            font-size: 0.75rem;
          }
          
          .media-title {
            max-width: 180px;
          }
          
          .line-clamp-2 {
            -webkit-line-clamp: 2;
            max-height: 3em;
          }
        }
      `}</style>
    </div>
  );
};

export default ApplePodcastDetail;