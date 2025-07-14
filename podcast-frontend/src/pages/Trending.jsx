import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Play, Clock, Headphones, Award, Flame, Star, BarChart, Users, Calendar, ChevronRight, Shuffle, ArrowUp, Pause, Volume2 } from 'lucide-react';
import { getPodcasts } from '../services/api';
import { useNavigate } from 'react-router-dom'; // Add navigation hook

const Trending = () => {
  const navigate = useNavigate(); // Initialize navigation hook
  const [podcasts, setPodcasts] = useState([]);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('today');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [tempSeekTime, setTempSeekTime] = useState(null);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  useEffect(() => {
    fetchTrendingPodcasts();
  }, [timeFilter]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isDragging && audio.currentTime) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
        console.log(`Audio duration set: ${audio.duration}`);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (e) => {
      console.error('Audio error:', e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('durationchange', updateDuration);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      }
    };
  }, [selectedPodcast, isDragging]);

  // Add mouse and touch event listeners for scrubbing
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (isDragging && tempSeekTime !== null) {
        if (audioRef.current) {
          audioRef.current.currentTime = tempSeekTime;
          setCurrentTime(tempSeekTime);
        }
        setIsDragging(false);
        setTempSeekTime(null);
        
        // Resume playback if it was playing before
        if (isPlaying && audioRef.current) {
          audioRef.current.play().catch(err => console.error('Error resuming playback:', err));
        }
      }
    };
    
    const handleMouseMove = (e) => {
      if (isDragging && progressBarRef.current && duration > 0) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));
        const newTime = percentage * duration;
        
        setTempSeekTime(newTime);
      }
    };
    
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
    };
  }, [isDragging, tempSeekTime, duration, isPlaying]);

  const fetchTrendingPodcasts = async () => {
    try {
      setLoading(true);
      const response = await getPodcasts();
      // Sort by trending criteria (you can modify this logic based on your needs)
      const sorted = response.data
        .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
        .slice(0, 10);
      setPodcasts(sorted);
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to podcast detail page
  const handleViewPodcast = (podcast) => {
    if (podcast && podcast.id) {
      // Navigate to podcast detail with state indicating source is 'trending'
      navigate(`/podcasts/${podcast.id}`, { state: { from: 'admin' } });
    } else {
      console.error('Cannot navigate: Invalid podcast ID', podcast);
    }
  };

  const handlePlayPodcast = async (e, podcast) => {
    // Stop propagation to prevent navigation when play button is clicked
    e.stopPropagation();
    
    if (selectedPodcast?.id === podcast.id) {
      togglePlayPause();
    } else {
      setSelectedPodcast(podcast);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      
      // Wait a moment for the audio element to update with the new source
      setTimeout(async () => {
        if (audioRef.current) {
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (error) {
            console.error('Auto-play error:', error);
            setIsPlaying(false);
          }
        }
      }, 100);
    }
  };

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, x / width));
    const newTime = percentage * duration;
    
    // Set the new time
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    
    // If not playing, start playback
    if (!isPlaying) {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Error playing after seek:', err));
    }
  };

  const handleProgressMouseDown = (e) => {
    // Pause audio during dragging for smoother experience
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
    
    setIsDragging(true);
    
    // Calculate initial position
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, x / width));
    const newTime = percentage * duration;
    
    setTempSeekTime(newTime);
  };

  const skipTime = (seconds) => {
    if (audioRef.current && duration) {
      const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      
      // If not playing, start playback
      if (!isPlaying) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(err => console.error('Error playing after skip:', err));
      }
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const shufflePodcasts = () => {
    const shuffled = [...podcasts].sort(() => Math.random() - 0.5);
    setPodcasts(shuffled);
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getAudioUrl = (audioUrl) => {
    if (!audioUrl) return null;
    if (audioUrl.startsWith('http')) return audioUrl;
    return `http://localhost:8000/uploads/${audioUrl}`;
  };

  const timeFilters = [
    { value: 'today', label: 'Today', icon: <Flame className="h-4 w-4" /> },
    { value: 'week', label: 'This Week', icon: <TrendingUp className="h-4 w-4" /> },
    { value: 'month', label: 'This Month', icon: <Award className="h-4 w-4" /> },
    { value: 'all', label: 'All Time', icon: <Star className="h-4 w-4" /> },
  ];

  const getImageUrl = (imageUrl) => {
  // Uses http://localhost/Podcast/podcast-backend/uploads/
  return `http://localhost/Podcast/podcast-backend/uploads/${imageUrl}`;
}

  const getTrendingBadge = (index) => {
    if (index === 0) return { text: 'TRENDING', color: 'from-red-500 to-orange-500', icon: <Flame className="h-3 w-3" /> };
    if (index === 1) return { text: 'RISING', color: 'from-orange-500 to-yellow-500', icon: <TrendingUp className="h-3 w-3" /> };
    if (index === 2) return { text: 'HOT', color: 'from-yellow-500 to-red-500', icon: <Flame className="h-3 w-3" /> };
    return null;
  };

  // Format duration properly
  const formatDuration = (minutes) => {
    // Return empty string if minutes is falsy (null, undefined, 0, etc.)
    if (!minutes || minutes <= 0) return '';
    
    // Format minutes into human-readable format
    if (minutes < 60) return `${minutes} min`;
    
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl mx-auto mb-6 animate-pulse"></div>
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-96 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 mx-auto animate-pulse"></div>
          </div>
          
          {/* Filter Skeleton */}
          <div className="flex justify-center gap-4 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
            ))}
          </div>
          
          {/* List Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="flex gap-4">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-20"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-24"></div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white mb-4 sm:mb-6">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 px-4">
              Trending Podcasts
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              Discover the most popular podcasts that everyone's talking about
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Time Filters */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-2">
          {timeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 ${
                timeFilter === filter.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="h-3 w-3 sm:h-4 sm:w-4">{filter.icon}</span>
              <span className="whitespace-nowrap">{filter.label}</span>
            </button>
          ))}
        </div>

        {/* Trending Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Episodes</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{podcasts.length}</p>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <BarChart className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
         
        </div>

        {/* Trending List */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Top Trending</h2>
            <button 
              onClick={shufflePodcasts}
              className="flex items-center gap-1 sm:gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm sm:text-base bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all"
            >
              <Shuffle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
          </div>

          {podcasts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No trending podcasts</h3>
              <p className="text-gray-600 dark:text-gray-400">Check back later for trending content</p>
            </div>
          ) : (
            podcasts.map((podcast, index) => {
              const badge = getTrendingBadge(index);
              const isCurrentlyPlaying = selectedPodcast?.id === podcast.id && isPlaying;
              
              return (
                <div
                  key={podcast.id}
                  className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 relative overflow-hidden cursor-pointer"
                  onClick={() => handleViewPodcast(podcast)} // Add navigation on click
                >
                  {/* Trending Badge */}
                  {badge && (
                    <div className={`absolute top-0 left-0 bg-gradient-to-r ${badge.color} text-white px-2 sm:px-3 py-1 rounded-br-xl text-xs font-bold flex items-center gap-1`}>
                      <span className="h-2 w-2 sm:h-3 sm:w-3">{badge.icon}</span>
                      <span className="hidden sm:inline">{badge.text}</span>
                    </div>
                  )}

                  <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-3 sm:gap-6">
                      {/* Rank */}
                      <div className="flex-shrink-0">
                        <div className={`text-2xl sm:text-3xl font-bold ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          index === 2 ? 'text-orange-500' :
                          'text-gray-500 dark:text-gray-400'
                        }`}>
                          #{index + 1}
                        </div>
                      </div>

                      {/* Podcast Image */}
                      <div className="flex-shrink-0 relative">
                        <img
                          src={getImageUrl(podcast.image_url)}
                          alt={podcast.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover shadow-md"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=80&h=80&fit=crop';
                          }}
                        />
                        {isCurrentlyPlaying && (
                          <div className="absolute inset-0 bg-green-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                            <div className="flex items-end gap-0.5 h-6">
                              {[...Array(4)].map((_, index) => (
                                <div
                                  key={index}
                                  className="w-0.5 bg-white rounded-full transition-all duration-150 animate-sound-wave"
                                  style={{
                                    height: `${Math.max(4, Math.random() * 20 + 8)}px`,
                                    animationDelay: `${index * 0.1}s`
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Podcast Info - Full width without play button */}
                      <div className="flex-grow min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 line-clamp-1">
                          {podcast.title}
                        </h3>
                       
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-1 sm:line-clamp-2 mb-2 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                          {podcast.description}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                          {/* Only show duration if it exists and is greater than 0 */}
                          {podcast.duration > 0 && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-lg">
                              <Clock className="h-3 w-3" />
                              <span className="whitespace-nowrap">{formatDuration(podcast.duration)}</span>
                            </span>
                          )}
                         
                          {podcast.category && (
                            <span className="px-2 sm:px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium whitespace-nowrap uppercase">
                              {podcast.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Load More */}
        {podcasts.length > 0 && (
          <div className="text-center mt-8 sm:mt-12">
            <button className="flex items-center gap-2 mx-auto px-4 sm:px-6 py-2 sm:py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm sm:text-base">
              View More Trending
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Spotify-Style Bottom Audio Player */}
      {selectedPodcast && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-lg">
          {/* Progress bar at the very top */}
          <div 
            ref={progressBarRef}
            className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 cursor-pointer group hover:h-2 transition-all duration-200"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressMouseDown}
          >
            {/* Main progress fill */}
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-100 relative"
              style={{ width: `${duration > 0 ? ((isDragging && tempSeekTime !== null ? tempSeekTime : currentTime) / duration) * 100 : 0}%` }}
            >
              {/* Animated shine effect when playing */}
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-ping"></div>
              )}
            </div>
            
            {/* Hover effect for progress bar */}
            <div 
              className="absolute top-0 h-full bg-gradient-to-r from-blue-400/30 to-purple-400/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ width: `${duration > 0 ? ((isDragging && tempSeekTime !== null ? tempSeekTime : currentTime) / duration) * 100 : 0}%` }}
            />
            
            {/* Drag handle / progress thumb */}
            <div 
              className={`absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-all duration-200 border-2 border-purple-500 ${
                isDragging || isPlaying ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
              }`}
              style={{ left: `${duration > 0 ? ((isDragging && tempSeekTime !== null ? tempSeekTime : currentTime) / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Main player content */}
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4 py-3">
              {/* Album art and info */}
              <div className="flex items-center gap-3 flex-1 cursor-pointer">
                <div className="relative">
                  <img
                    src={getImageUrl(selectedPodcast.image_url)}
                    alt={selectedPodcast.title}
                    className={`w-12 h-12 rounded-lg object-cover shadow-sm transition-all duration-300 ${
                      isPlaying ? 'animate-pulse shadow-lg shadow-purple-500/30' : ''
                    }`}
                  />
                  {/* Boom effect overlay */}
                  {isPlaying && (
                    <div className="absolute inset-0 rounded-lg">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg animate-pulse"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-end gap-0.5 h-6">
                          {[...Array(4)].map((_, index) => (
                            <div
                              key={index}
                              className="w-0.5 bg-white rounded-full transition-all duration-150 animate-sound-wave"
                              style={{
                                height: `${Math.max(4, Math.random() * 20 + 8)}px`,
                                animationDelay: `${index * 0.1}s`
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-sm font-medium truncate transition-colors ${
                    isPlaying ? 'text-purple-600 dark:text-purple-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {selectedPodcast.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedPodcast.author_name || 'Unknown Artist'}
                  </p>
                  {/* Live time display */}
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <span>{formatTime(isDragging && tempSeekTime !== null ? tempSeekTime : currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              {/* Control buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => skipTime(-10)}
                  className="group p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-110 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                  title="Skip back 10s"
                  aria-label="Skip backward 10 seconds"
                >
                  <div className="relative flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
                    </svg>
                    <span className="absolute text-xs font-bold text-current" style={{ fontSize: '8px' }}>10</span>
                  </div>
                </button>

                <button
                  onClick={togglePlayPause}
                  className={`relative p-3 rounded-full transition-all duration-300 transform ${
                    isPlaying 
                      ? 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white shadow-lg' 
                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:scale-105 shadow-md'
                  }`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6" />
                  ) : (
                    <Play className="w-6 h-6 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => skipTime(10)}
                  className="group p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:scale-110 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                  title="Skip forward 10s"
                  aria-label="Skip forward 10 seconds"
                >
                  <div className="relative flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z"/>
                    </svg>
                    <span className="absolute text-xs font-bold text-current" style={{ fontSize: '8px' }}>10</span>
                  </div>
                </button>

                {/* Volume control */}
                <div className="hidden sm:flex items-center gap-2 ml-2">
                  <Volume2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      {selectedPodcast && getAudioUrl(selectedPodcast.audio_url) && (
        <audio
          ref={audioRef}
          src={getAudioUrl(selectedPodcast.audio_url)}
          preload="metadata"
        />
      )}

      <style jsx>{`
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        input[type="range"]::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        @keyframes sound-wave {
          0% {
            height: 3px;
          }
          50% {
            height: 16px;
          }
          100% {
            height: 6px;
          }
        }

        .animate-sound-wave {
          animation: sound-wave 0.8s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
};

export default Trending;