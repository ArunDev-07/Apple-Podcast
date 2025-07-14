import { useState, useEffect } from 'react';
import { 
  X, Play, Pause, Clock, Calendar, Heart, Bookmark, 
  ListMusic, Volume2, SkipBack, SkipForward, Shuffle, Repeat, ArrowLeft,
  Headphones, Download, Share2, MoreVertical, Star, Check, Copy, 
  Search, ChevronUp, ChevronDown, Speaker, VolumeX
} from 'lucide-react';

const ApplePodcastsEpisodesModal = ({ 
  podcast, 
  isOpen, 
  onClose, 
  onPlayEpisode,
  currentlyPlaying,
  podcastStatuses = {},
  onLikeChange,
  onBookmarkChange
}) => {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // off, one, all
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreenInfo, setIsFullscreenInfo] = useState(false);
  const [prevVolume, setPrevVolume] = useState(75);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [animatePulse, setAnimatePulse] = useState(true);
  
  // API Base URL
  const API_BASE_URL = 'http://localhost/Podcast/podcast-backend/api';

  // Get auth token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token') || '';
  };

  // API Headers with authorization
  const getApiHeaders = () => {
    return {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    };
  };

  // Handle screen size detection
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isOpen && podcast?.id) {
      fetchEpisodes();
    }
  }, [isOpen, podcast]);

  useEffect(() => {
    if (!isOpen) {
      setEpisodes([]);
      setSelectedEpisode(null);
      setShowShareMenu(false);
      setShowMoreMenu(false);
    }
    
    // Close the modal with ESC key
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleModalClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen]);

  // Handle clicks outside menus to close them
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showShareMenu || showMoreMenu) {
        if (!e.target.closest('.menu-container')) {
          setShowShareMenu(false);
          setShowMoreMenu(false);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu, showMoreMenu]);

  // Simulate progress for current episode only
  useEffect(() => {
    let interval;
    if (currentlyPlaying) {
      // Set duration based on current episode
      const currentEpisode = episodes.find(ep => ep.id === currentlyPlaying.id);
      if (currentEpisode && currentEpisode.duration) {
        setDuration(currentEpisode.duration * 60); // Convert minutes to seconds
      }
      
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 1;
          return newTime >= duration ? 0 : newTime;
        });
      }, 1000);
    } else {
      setCurrentTime(0);
    }
    
    // Pulse animation controller
    const pulseTimer = setTimeout(() => {
      setAnimatePulse(false);
    }, 3000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(pulseTimer);
    };
  }, [currentlyPlaying, duration, episodes]);

  const fetchEpisodes = async () => {
    if (!podcast?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/episodes/get.php?podcast_id=${podcast.id}`, {
        method: 'GET',
        headers: getApiHeaders(),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch episodes');
      }
      
      const data = await response.json();
      let episodesData = [];
      
      if (data) {
        if (typeof data === 'object' && data.success) {
          episodesData = data.data || [];
        } else if (Array.isArray(data)) {
          episodesData = data;
        }
      }
      
      episodesData.sort((a, b) => {
        if (a.episode_number && b.episode_number) {
          return Number(a.episode_number) - Number(b.episode_number);
        }
        return 0;
      });
      
      setEpisodes(episodesData);
      
      // Calculate total duration from all episodes
      if (episodesData.length > 0) {
        const totalDuration = episodesData.reduce((total, episode) => {
          return total + (episode.duration || 0);
        }, 0);
        setDuration(totalDuration * 60); // Convert minutes to seconds
      }
    } catch (err) {
      console.error('Error fetching episodes:', err);
      setError('Failed to load episodes. Please try again.');
      
      if (podcast) {
        const fallbackEpisode = {
          id: podcast.id,
          title: podcast.title,
          description: podcast.description,
          image_url: podcast.image_url,
          audio_url: podcast.audio_url,
          duration: podcast.duration || 30, // Default 30 minutes if no duration
          created_at: podcast.created_at,
          episode_number: 1
        };
        setEpisodes([fallbackEpisode]);
        setDuration((podcast.duration || 30) * 60); // Convert to seconds
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = (episode) => {
    if (onLikeChange) {
      onLikeChange(episode);
    }
  };

  const handleBookmark = (episode) => {
    if (onBookmarkChange) {
      onBookmarkChange(episode);
    }
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // Add API call here to follow/unfollow podcast
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: podcast?.title,
          text: podcast?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
        setShowShareMenu(!showShareMenu);
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handlePlayAll = () => {
    if (episodes.length > 0) {
      const firstEpisode = isShuffled 
        ? episodes[Math.floor(Math.random() * episodes.length)]
        : episodes[0];
      
      // Reset progress tracking for new episode
      setCurrentTime(0);
      const episodeDuration = firstEpisode.duration ? firstEpisode.duration * 60 : 1800; // Default 30 min
      setDuration(episodeDuration);
      
      onPlayEpisode && onPlayEpisode(firstEpisode);
    }
  };

  const handleSkipForward = () => {
    const currentIndex = episodes.findIndex(ep => ep.id === currentlyPlaying?.id);
    if (currentIndex !== -1 && currentIndex < episodes.length - 1) {
      const nextEpisode = episodes[currentIndex + 1];
      
      // Reset progress for new episode
      setCurrentTime(0);
      const episodeDuration = nextEpisode.duration ? nextEpisode.duration * 60 : 1800;
      setDuration(episodeDuration);
      
      onPlayEpisode && onPlayEpisode(nextEpisode);
    }
  };

  const handleSkipBack = () => {
    const currentIndex = episodes.findIndex(ep => ep.id === currentlyPlaying?.id);
    if (currentIndex > 0) {
      const prevEpisode = episodes[currentIndex - 1];
      
      // Reset progress for new episode
      setCurrentTime(0);
      const episodeDuration = prevEpisode.duration ? prevEpisode.duration * 60 : 1800;
      setDuration(episodeDuration);
      
      onPlayEpisode && onPlayEpisode(prevEpisode);
    }
  };

  const handleDownload = (episode) => {
    const link = document.createElement('a');
    link.href = getAudioUrl(episode.audio_url || '');
    link.download = `${episode.title || 'episode'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      setVolume(0);
    }
  };

  const handleProgressChange = (e) => {
    const newTime = (parseInt(e.target.value) / 100) * duration;
    setCurrentTime(newTime);
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
  };

  const toggleRepeat = () => {
    const modes = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setRepeatMode(modes[nextIndex]);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fixed image URL handling to match your other components
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x300?text=No+Image';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost/Podcast/podcast-backend/uploads/${imageUrl}`;
  };

  // Audio URL handling
  const getAudioUrl = (audioUrl) => {
    if (!audioUrl) return '';
    if (audioUrl.startsWith('http')) return audioUrl;
    return `http://localhost/Podcast/podcast-backend/uploads/${audioUrl}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isEpisodePlaying = (episode) => {
    return currentlyPlaying?.id === episode.id;
  };

  const handleModalClose = () => {
    if (onClose) {
      onClose();
    }
  };

  // Filter episodes based on search query
  const filteredEpisodes = episodes.filter(episode => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (episode.title && episode.title.toLowerCase().includes(query)) ||
      (episode.description && episode.description.toLowerCase().includes(query))
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl overflow-hidden">
      {/* Main container with modern glass design */}
      <div className="flex flex-col md:flex-row h-full">
        {/* Sidebar - Podcast Info */}
        <div className={`${isSmallScreen && isFullscreenInfo ? 'h-full' : 'md:w-80'} bg-gradient-to-b from-gray-900/80 to-black/80 backdrop-blur-lg border-r border-white/10 flex flex-col transition-all duration-300 ${isSmallScreen && !isFullscreenInfo ? 'h-[200px]' : ''}`}>
          {/* Mobile toggle for info */}
          {isSmallScreen && (
            <button 
              className="absolute right-2 top-2 z-20 p-2 bg-black/50 backdrop-blur-md rounded-full text-white"
              onClick={() => setIsFullscreenInfo(!isFullscreenInfo)}
            >
              {isFullscreenInfo ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          )}
          
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={handleModalClose}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleModalClose}
                className="ml-auto p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`${isSmallScreen && !isFullscreenInfo ? 'flex items-center gap-4' : 'text-center'}`}>
              <div className={`relative ${isSmallScreen && !isFullscreenInfo ? 'mb-0 w-20' : 'mb-6 mx-auto'}`}>
                <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-blue-500/30 filter blur-xl opacity-70 rounded-3xl transform scale-110 -z-10 animate-pulse-slow`}></div>
                <img 
                  src={getImageUrl(podcast?.image_url)} 
                  alt={podcast?.title}
                  className={`${isSmallScreen && !isFullscreenInfo ? 'w-20 h-20' : 'w-48 h-48 mx-auto'} rounded-3xl shadow-2xl object-cover border border-white/10`}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                  }}
                />
                <div className={`${isSmallScreen && !isFullscreenInfo ? 'hidden' : 'absolute -bottom-4 left-1/2 transform -translate-x-1/2'} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg shadow-emerald-500/20`}>
                  {episodes.length} Episodes
                </div>
              </div>
              
              <div className={`${isSmallScreen && !isFullscreenInfo ? 'flex-1 min-w-0' : ''}`}>
                <h1 className={`${isSmallScreen && !isFullscreenInfo ? 'text-lg' : 'text-2xl'} font-bold text-white mb-2 ${isSmallScreen && !isFullscreenInfo ? 'truncate' : ''}`}>
                  {podcast?.title}
                </h1>
                {podcast?.category && (
                  <span className="inline-block bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 px-3 py-1 rounded-full text-sm mb-4">
                    {podcast.category}
                  </span>
                )}
                
                <p className={`text-gray-300 text-sm leading-relaxed mb-6 ${isSmallScreen && !isFullscreenInfo ? 'hidden' : ''}`}>
                  {podcast?.description || "No description available for this podcast."}
                </p>
                
                {/* Action buttons */}
                <div className={`${isSmallScreen && !isFullscreenInfo ? 'hidden' : 'flex gap-3 justify-center'}`}>
                  <button 
                    onClick={handleFollow}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                      isFollowing 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/20' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                    <span className="text-sm">{isFollowing ? 'Following' : 'Follow'}</span>
                  </button>
                  <div className="relative menu-container">
                    <button 
                      onClick={handleShare}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all duration-200"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </button>
                    
                    {/* Share menu */}
                    {showShareMenu && (
                      <div className="absolute top-full mt-2 right-0 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 min-w-48 z-10 shadow-xl">
                        <button 
                          onClick={handleCopyLink}
                          className="flex items-center gap-3 w-full text-left px-3 py-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                        >
                          {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span className="text-sm">{copySuccess ? 'Copied!' : 'Copy Link'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats - Only shown in full info mode */}
          <div className={`p-6 ${isSmallScreen && !isFullscreenInfo ? 'hidden' : ''}`}>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-white/5 to-white/10 rounded-xl shadow-inner border border-white/5">
                <div className="text-2xl font-bold text-white">{episodes.length}</div>
                <div className="text-xs text-gray-400">Episodes</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-white/5 to-white/10 rounded-xl shadow-inner border border-white/5">
                <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold">4.8</span>
                </div>
                <div className="text-xs text-gray-400">Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content - Episodes list */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="p-4 md:p-6 border-b border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-lg">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <Headphones className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
                <h2 className="text-lg md:text-xl font-bold text-white">All Episodes</h2>
                <span className="bg-emerald-500/20 text-emerald-300 px-2.5 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold">
                  {episodes.length} total
                </span>
              </div>
              
              {/* Search bar */}
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-white/10 rounded-full bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Search episodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2 md:gap-3 ml-auto">
                <button 
                  onClick={handlePlayAll}
                  className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-3 md:px-4 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 text-sm md:text-base"
                >
                  <Play className="w-4 h-4" />
                  <span>Play All</span>
                </button>
                <div className="relative menu-container">
                  <button 
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {/* More menu */}
                  {showMoreMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-3 min-w-48 z-10 shadow-xl">
                      <button 
                        onClick={toggleShuffle}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                          isShuffled ? 'text-emerald-400 bg-emerald-500/10' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <Shuffle className="w-4 h-4" />
                        <span className="text-sm">Shuffle {isShuffled ? 'On' : 'Off'}</span>
                      </button>
                      <button 
                        onClick={toggleRepeat}
                        className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                          repeatMode !== 'off' ? 'text-emerald-400 bg-emerald-500/10' : 'text-white hover:bg-white/10'
                        }`}
                      >
                        <Repeat className="w-4 h-4" />
                        <span className="text-sm">Repeat {repeatMode === 'off' ? 'Off' : repeatMode === 'one' ? 'One' : 'All'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Episodes list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="relative mb-4">
                  <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-400">Loading episodes...</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-md">
                  <p className="font-medium mb-2">Unable to load episodes</p>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              </div>
            ) : filteredEpisodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                  <ListMusic className="w-8 h-8 text-gray-400" />
                </div>
                {searchQuery ? (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-2">No matching episodes</h3>
                    <p className="text-gray-400">Try a different search term.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white mb-2">No episodes available</h3>
                    <p className="text-gray-400">This podcast doesn't have any episodes yet.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 md:p-6 pb-32">
                <div className="space-y-3 md:space-y-4">
                  {filteredEpisodes.map((episode, index) => (
                    <div
                      key={episode.id}
                      className={`group relative bg-gradient-to-br from-white/5 to-white/8 hover:from-white/8 hover:to-white/12 rounded-xl md:rounded-2xl p-4 md:p-6 transition-all duration-300 border cursor-pointer ${
                        isEpisodePlaying(episode) 
                          ? 'border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 shadow-lg shadow-emerald-500/10' 
                          : 'border-white/10 hover:border-white/20'
                      }`}
                      onClick={() => setSelectedEpisode(selectedEpisode === episode.id ? null : episode.id)}
                    >
                      <div className="flex items-center gap-4 md:gap-6">
                        {/* Episode number */}
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-blue-500/30 filter blur-md opacity-70 rounded-full transform scale-110 -z-10 ${isEpisodePlaying(episode) && animatePulse ? 'animate-pulse-slow' : ''}`}></div>
                          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg ${
                            isEpisodePlaying(episode) ? 'bg-gradient-to-br from-emerald-500 to-blue-500' : 'bg-gradient-to-br from-gray-700 to-gray-800'
                          }`}>
                            {episode.episode_number || index + 1}
                          </div>
                        </div>

                        {/* Episode info */}
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base md:text-lg font-semibold mb-1 md:mb-2 truncate ${isEpisodePlaying(episode) ? 'text-emerald-300' : 'text-white'}`}>
                            {episode.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm text-gray-400 mb-2">
                            {episode.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                {formatDuration(episode.duration)}
                              </span>
                            )}
                            {episode.created_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                {formatDate(episode.created_at)}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 text-xs md:text-sm line-clamp-2 leading-relaxed">
                            {episode.description || "No description available for this episode."}
                          </p>
                        </div>

                        {/* Episode actions */}
                        <div className="flex items-center gap-1 md:gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLike(episode);
                            }}
                            className={`p-2 md:p-3 rounded-full transition-all duration-200 ${
                              podcastStatuses[episode.id]?.liked
                                ? 'text-pink-400 bg-pink-500/20'
                                : 'text-gray-400 hover:text-pink-400 hover:bg-pink-500/10'
                            }`}
                          >
                            <Heart className={`w-4 h-4 md:w-5 md:h-5 ${podcastStatuses[episode.id]?.liked ? 'fill-current' : ''}`} />
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookmark(episode);
                            }}
                            className={`p-2 md:p-3 rounded-full transition-all duration-200 ${
                              podcastStatuses[episode.id]?.bookmarked
                                ? 'text-blue-400 bg-blue-500/20'
                                : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10'
                            }`}
                          >
                            <Bookmark className={`w-4 h-4 md:w-5 md:h-5 ${podcastStatuses[episode.id]?.bookmarked ? 'fill-current' : ''}`} />
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(episode);
                            }}
                            className="p-2 md:p-3 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                          >
                            <Download className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              // Reset progress for new episode
                              setCurrentTime(0);
                              const episodeDuration = episode.duration ? episode.duration * 60 : 1800;
                              setDuration(episodeDuration);
                              onPlayEpisode && onPlayEpisode(episode);
                            }}
                            className={`p-3 md:p-4 rounded-full transition-all duration-200 shadow-lg ${
                              isEpisodePlaying(episode)
                                ? 'bg-white text-black hover:bg-gray-100'
                                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-emerald-500/30'
                            }`}
                          >
                            {isEpisodePlaying(episode) ? (
                              <Pause className="w-4 h-4 md:w-6 md:h-6" />
                            ) : (
                              <Play className="w-4 h-4 md:w-6 md:h-6 ml-0.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded episode details */}
                      {selectedEpisode === episode.id && (
                        <div className="mt-6 pt-6 border-t border-white/10 animate-fadeIn">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                              <h4 className="text-sm font-semibold text-white mb-2">Episode Description</h4>
                              <p className="text-gray-300 text-sm leading-relaxed">
                                {episode.description || "No detailed description available for this episode."}
                              </p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4">
                              <h4 className="text-sm font-semibold text-white mb-3">Episode Details</h4>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5" /> Duration:
                                  </span>
                                  <span className="text-white bg-white/10 px-2 py-1 rounded-md">{formatDuration(episode.duration)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Released:
                                  </span>
                                  <span className="text-white bg-white/10 px-2 py-1 rounded-md">{formatDate(episode.created_at)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400 flex items-center gap-2">
                                    <ListMusic className="w-3.5 h-3.5" /> Episode:
                                  </span>
                                  <span className="text-white bg-white/10 px-2 py-1 rounded-md">#{episode.episode_number || index + 1}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Now playing indicator */}
                      {isEpisodePlaying(episode) && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-b-xl md:rounded-b-2xl">
                          <div 
                            className="h-full bg-white/50 rounded-b-xl md:rounded-b-2xl"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Floating Mini Player */}
      {currentlyPlaying && (
        <div className="fixed bottom-6 left-0 right-0 mx-auto bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 p-4 shadow-2xl max-w-sm md:max-w-md">
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 to-blue-500/30 filter blur-md opacity-70 rounded-xl transform scale-110 -z-10 animate-pulse-slow"></div>
              <img 
                src={getImageUrl(currentlyPlaying.image_url || podcast?.image_url)} 
                alt={currentlyPlaying.title}
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{currentlyPlaying.title}</p>
              <p className="text-gray-400 text-xs truncate">{podcast?.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleSkipBack}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onPlayEpisode && onPlayEpisode(currentlyPlaying)}
                className="p-2.5 bg-white text-black rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                {isEpisodePlaying(currentlyPlaying) ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button 
                onClick={handleSkipForward}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mb-2">
            <input
              type="range"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleProgressChange}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10B981 0%, #10B981 ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) ${duration ? (currentTime / duration) * 100 : 0}%, rgba(255,255,255,0.2) 100%)`
              }}
            />
          </div>
          
          {/* Time and volume */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10B981 0%, #10B981 ${volume}%, rgba(255,255,255,0.2) ${volume}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
            <span className="tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Custom range slider styles */
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #10B981;
          cursor: pointer;
          box-shadow: 0 0 5px 0 rgba(16, 185, 129, 0.7);
        }

        input[type="range"]::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #10B981;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 5px 0 rgba(16, 185, 129, 0.7);
        }
        
        /* Animations */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s infinite;
        
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ApplePodcastsEpisodesModal;