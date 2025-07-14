import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Share2, ListMusic } from 'lucide-react';

const AudioPlayer = ({ podcast, episode = null, onClose, onNext, onPrevious }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  // Use episode data if available, otherwise use podcast data
  const mediaData = episode || podcast || {};

  // Check if on mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle closing the player
  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  // Return null if no media data
  if (!mediaData) {
    return null;
  }

  useEffect(() => {
    const audio = audioRef.current;
    
    if (!audio) return;
    
    const setAudioData = () => {
      setDuration(audio.duration);
    };

    const setAudioTime = () => {
      if (!isDragging) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      
      if (onNext && typeof onNext === 'function') {
        onNext();
      }
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('durationchange', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    // Auto play
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(err => {
      console.error("Autoplay failed:", err);
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('durationchange', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [mediaData, isDragging, onNext]);

  // Add mouse and touch event listeners for scrubbing
  useEffect(() => {
    const handleMouseUp = (e) => {
      if (isDragging && audioRef.current) {
        audioRef.current.currentTime = currentTime;
        
        // Resume playback if it was playing before
        if (isPlaying) {
          audioRef.current.play().catch(err => console.error('Error resuming playback:', err));
        }
        
        setIsDragging(false);
      }
    };
    
    const handleMouseMove = (e) => {
      if (isDragging && progressBarRef.current && duration > 0) {
        const rect = progressBarRef.current.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const width = rect.width;
        const percentage = Math.max(0, Math.min(1, x / width));
        const newTime = percentage * duration;
        
        setCurrentTime(newTime);
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
  }, [isDragging, currentTime, duration, isPlaying]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.error("Playback failed:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleProgressMouseDown = (e) => {
    // Pause audio during dragging for smoother experience
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
    
    setIsDragging(true);
    
    // Calculate initial position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '00:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const skipTime = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = Math.max(0, Math.min(audio.currentTime + seconds, duration));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: mediaData.title,
        text: mediaData.description,
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Error copying to clipboard:', err));
    }
  };

  // Helper function to get correct URL for resources
  const getResourceUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `http://localhost:8000/uploads/${url}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <audio
        ref={audioRef}
        src={getResourceUrl(mediaData.audio_url) || "https://www.soundjay.com/misc/sounds/bell-ringing-05.wav"}
        preload="metadata"
      />
      
      {/* Enhanced Progress Bar with Glow Effect */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200/80 dark:bg-gray-700/80 backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 relative overflow-hidden transition-all duration-300 ease-out"
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
        </div>
      </div>

      {/* Main Player Container with Glassmorphism */}
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5">
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center gap-4 sm:gap-6'}`}>
            
            {/* Enhanced Podcast Info Section */}
            <div className={`flex items-center gap-3 sm:gap-4 ${isMobile ? 'w-full' : 'flex-1 min-w-0'}`}>
              <div className="relative group">
                <img
                  src={getResourceUrl(mediaData.image_url) || "https://via.placeholder.com/64x64/8B5CF6/FFFFFF?text=🎵"}
                  alt={mediaData.title || "Podcast"}
                  className={`${isMobile ? 'h-12 w-12' : 'h-12 w-12 sm:h-16 sm:w-16'} rounded-xl sm:rounded-2xl object-cover shadow-lg ring-2 ring-gray-200/20 dark:ring-gray-700/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:ring-purple-500/30`}
                />
                <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'} font-semibold text-gray-900 dark:text-white truncate hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 cursor-pointer max-w-[80%]`}>
                    {mediaData.title || "Untitled Podcast"}
                  </h4>
                  
                  {/* Mobile Close Button - Moved to top right */}
                  {isMobile && (
                    <button
                      onClick={handleClose}
                      className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 -mt-1"
                      aria-label="Close player"
                    >
                      <X className="h-4 w-4 transition-transform duration-200 hover:scale-110 hover:rotate-90" />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <p className="text-gray-500 dark:text-gray-400 truncate font-medium">
                    {mediaData.category || podcast?.category || 'Podcast'}
                  </p>
                  
                  {/* Episode badge */}
                  {episode && !isMobile && (
                    <span className="hidden sm:flex bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs px-2 py-0.5 rounded-full items-center gap-1">
                      <ListMusic className="h-3 w-3" />
                      {episode.episode_number ? `Ep ${episode.episode_number}` : 'Episode'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Progress/Time Display */}
            {isMobile && (
              <div className="w-full flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {formatTime(currentTime)}
                </span>
                
                <div
                  ref={progressBarRef}
                  className="flex-1 h-1.5 bg-gray-200/80 dark:bg-gray-700/80 rounded-full cursor-pointer relative group overflow-hidden"
                  onClick={handleSeek}
                  onMouseDown={handleProgressMouseDown}
                  onTouchStart={handleProgressMouseDown}
                >
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 rounded-full relative transition-all duration-300 ease-out"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  ></div>
                </div>
                
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {formatTime(duration)}
                </span>
              </div>
            )}

            {/* Enhanced Control Buttons */}
            <div className={`flex items-center ${isMobile ? 'justify-between w-full' : 'gap-2 sm:gap-4'}`}>
              {/* Previous Track Button - only visible if onPrevious is provided */}
              {onPrevious && (
                <button
                  onClick={onPrevious}
                  className="p-2 sm:p-3 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 relative overflow-hidden group"
                >
                  <SkipBack className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4 sm:h-5 sm:w-5'} transition-transform duration-200 group-hover:scale-110`} />
                </button>
              )}

              {/* Skip Back Button */}
              {!isMobile && (
                <button
                  onClick={() => skipTime(-10)}
                  className="hidden sm:block p-3 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 relative overflow-hidden group"
                >
                  <SkipBack className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                </button>
              )}

              {/* Enhanced Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className={`relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white ${isMobile ? 'p-3' : 'p-3 sm:p-4'} rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  {isPlaying ? (
                    <Pause className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} transition-transform duration-200 group-hover:scale-110`} />
                  ) : (
                    <Play className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5 sm:h-6 sm:w-6'} ml-0.5 transition-transform duration-200 group-hover:scale-110`} />
                  )}
                </div>
              </button>

              {/* Skip Forward Button */}
              {!isMobile && (
                <button
                  onClick={() => skipTime(10)}
                  className="hidden sm:block p-3 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 relative overflow-hidden group"
                >
                  <SkipForward className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                </button>
              )}
              
              {/* Next Track Button - only visible if onNext is provided */}
              {onNext && (
                <button
                  onClick={onNext}
                  className="p-2 sm:p-3 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 relative overflow-hidden group"
                >
                  <SkipForward className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4 sm:h-5 sm:w-5'} transition-transform duration-200 group-hover:scale-110`} />
                </button>
              )}

              {/* Mobile Share Button */}
              {isMobile && (
                <button 
                  onClick={handleShare}
                  className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
                >
                  <Share2 className="h-4 w-4 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                </button>
              )}

              {/* Enhanced Volume Control */}
              {!isMobile && (
                <div className="relative hidden sm:block">
                  <button
                    onClick={toggleMute}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    className="p-3 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                    ) : (
                      <Volume2 className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                    )}
                  </button>

                  {showVolumeSlider && (
                    <div
                      onMouseLeave={() => setShowVolumeSlider(false)}
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 animate-scale-in"
                    >
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer volume-slider"
                        style={{
                          background: `linear-gradient(to right, #8B5CF6 0%, #8B5CF6 ${
                            (isMuted ? 0 : volume) * 100
                          }%, #E5E7EB ${(isMuted ? 0 : volume) * 100}%, #E5E7EB 100%)`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Time and Progress Section */}
            {!isMobile && (
              <div className="hidden md:flex items-center gap-4 flex-1 min-w-0">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded-md">
                  {formatTime(currentTime)}
                </span>
                
                <div
                  ref={progressBarRef}
                  className="flex-1 h-2 bg-gray-200/80 dark:bg-gray-700/80 rounded-full cursor-pointer relative group overflow-hidden"
                  onClick={handleSeek}
                  onMouseDown={handleProgressMouseDown}
                  onTouchStart={handleProgressMouseDown}
                >
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 rounded-full relative transition-all duration-300 ease-out"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  >
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg group-hover:scale-110" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono bg-gray-100/50 dark:bg-gray-800/50 px-2 py-1 rounded-md">
                  {formatTime(duration)}
                </span>
              </div>
            )}

            {/* Enhanced Additional Controls */}
            <div className={`flex items-center ${isMobile ? 'hidden' : 'gap-1'}`}>
              {/* Share Button on Desktop */}
              {!isMobile && (
                <button 
                  onClick={handleShare}
                  className="hidden sm:block p-3 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all duration-200 group"
                >
                  <Share2 className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12" />
                </button>
              )}
              
              {/* Close Button */}
              <button
                onClick={handleClose}
                className={`${isMobile ? 'p-2' : 'p-2 sm:p-3'} rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group`}
                aria-label="Close player"
              >
                <X className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} transition-transform duration-200 group-hover:scale-110 group-hover:rotate-90`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes scale-in {
          from {
            transform: translate(-50%, 10px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-scale-in {
          animation: scale-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1);
        }

        .volume-slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .volume-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .volume-slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #8B5CF6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .volume-slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
      `}</style>
    </div>
  );
};

export default AudioPlayer;