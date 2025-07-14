import { useState } from 'react';
import { Edit, Trash2, Clock, Calendar, Headphones, Music, Image, Video, Play, Pause } from 'lucide-react';
import { deleteEpisode } from '../../services/api';

const EpisodeList = ({ episodes, onEdit, onDelete, onPlay }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [imageErrors, setImageErrors] = useState(new Set());
  const [activeVideo, setActiveVideo] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);

  // Enhanced data processing to handle various formats
  const episodeData = (() => {
    console.log('EpisodeList: Processing episodes input:', episodes);
    
    if (!episodes) {
      console.log('EpisodeList: No episodes data provided');
      return [];
    }
    
    if (Array.isArray(episodes)) {
      console.log('EpisodeList: Episodes is already an array with', episodes.length, 'items');
      return episodes;
    }
    
    if (episodes.success && Array.isArray(episodes.data)) {
      console.log('EpisodeList: Found array in episodes.data with', episodes.data.length, 'items');
      return episodes.data;
    }
    
    if (episodes.data && Array.isArray(episodes.data)) {
      console.log('EpisodeList: Found array in episodes.data with', episodes.data.length, 'items');
      return episodes.data;
    }
    
    // Handle single episode object in episodes.data
    if (episodes.data && typeof episodes.data === 'object' && !Array.isArray(episodes.data)) {
      console.log('EpisodeList: Found a single episode object, converting to array');
      return [episodes.data];
    }
    
    // Handle single episode object directly
    if (typeof episodes === 'object' && !Array.isArray(episodes) && episodes.id) {
      console.log('EpisodeList: Episodes appears to be a single episode object, converting to array');
      return [episodes];
    }
    
    console.warn('EpisodeList: Unhandled episodes data format:', episodes);
    return [];
  })();

  console.log('EpisodeList: Processed episodes data:', {
    episodeData,
    length: episodeData.length,
    firstItem: episodeData[0],
    isEmpty: episodeData.length === 0
  });

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Remove this episode?\n\nThis action cannot be undone.');
    if (confirmed) {
      setDeletingId(id);
      try {
        await deleteEpisode(id);
        if (onDelete) {
          onDelete();
        }
      } catch (error) {
        console.error('Error deleting episode:', error);
        let errorMessage = 'Failed to delete episode';
        if (error.response) {
          errorMessage = error.response.data.message || errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        }
        alert('Failed to delete episode: ' + errorMessage);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleImageError = (episodeId) => {
    setImageErrors(prev => new Set([...prev, episodeId]));
  };

  const getEpisodeImage = (episode) => {
    if (imageErrors.has(episode.id)) {
      return null;
    }
    return episode.image_url || episode.podcast_image_url || null;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDuration = (duration) => {
    const dur = parseInt(duration) || 0;
    if (dur === 0) return '0 min';
    if (dur < 60) return `${dur} min`;
    
    const hours = Math.floor(dur / 60);
    const minutes = dur % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setActiveVideo(null);
    } else {
      setExpandedId(id);
      setActiveVideo(null);
    }
  };

  const toggleVideoPlay = (videoUrl, episode, e) => {
    e.stopPropagation();
    
    if (activeVideo === videoUrl) {
      setActiveVideo(null);
    } else {
      setActiveVideo(videoUrl);
      
      // Track play count
      if (onPlay && typeof onPlay === 'function') {
        onPlay(episode.id);
      }
    }
  };
  
  const handleAudioPlay = (episode, e) => {
    // Get the audio element
    const audioElement = e.target;
    
    // Set up event listeners for play
    if (!audioElement.onplay) {
      audioElement.onplay = () => {
        setPlayingAudio(episode.id);
        
        // Track play count
        if (onPlay && typeof onPlay === 'function') {
          onPlay(episode.id);
        }
      };
      
      audioElement.onpause = () => {
        if (playingAudio === episode.id) {
          setPlayingAudio(null);
        }
      };
    }
  };

  // Sort episodes by episode number in ascending order
  const sortedEpisodes = [...episodeData].sort((a, b) => {
    const aNum = parseInt(a.episode_number) || 0;
    const bNum = parseInt(b.episode_number) || 0;
    return aNum - bNum;
  });

  // Check for empty or invalid episodes data
  if (!episodes || (typeof episodes === 'object' && Object.keys(episodes).length === 0) || episodeData.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-16 text-center">
          <div className="w-16 h-16 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4">
            <Headphones className="h-8 w-8 text-[#86868B]" />
          </div>
          <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white mb-2">
            No episodes yet
          </h3>
          <p className="text-[#86868B] text-sm">
            Start building your podcast content by creating your first episode.
          </p>
          {/* Debug info */}
          <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left overflow-auto max-h-40">
            <p>Debug info:</p>
            <pre>{JSON.stringify({episodes, episodeData}, null, 2)}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 sm:p-6 border-b border-[#F2F2F7] dark:border-[#2C2C2E]">
        <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-white">
          Episodes ({episodeData.length})
        </h2>
      </div>
      
      <div className="divide-y divide-[#F2F2F7] dark:divide-[#2C2C2E]">
        {sortedEpisodes.map((episode) => {
          const episodeImage = getEpisodeImage(episode);
          const hasVideo = episode.video_url && episode.video_url.length > 0;
          
          return (
            <div key={episode.id} className="p-0">
              <div 
                className="p-4 sm:p-6 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors cursor-pointer"
                onClick={() => toggleExpand(episode.id)}
              >
                <div className="flex items-start space-x-4">
                  {/* Episode Image */}
                  <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shadow-sm relative group">
                    {episodeImage ? (
                      <>
                        <img 
                          src={episodeImage}
                          alt={`${episode.title} cover`}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError(episode.id)}
                        />
                        {hasVideo && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Video className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-[#9F45F5]/10 flex items-center justify-center">
                        {hasVideo ? (
                          <Video className="h-6 w-6 sm:h-8 sm:w-8 text-[#9F45F5]" />
                        ) : (
                          <Music className="h-6 w-6 sm:h-8 sm:w-8 text-[#9F45F5]" />
                        )}
                      </div>
                    )}
                    
                    {/* Video indicator badge */}
                    {hasVideo && (
                      <div className="absolute top-1 right-1 bg-[#9F45F5] text-white text-xs px-1.5 py-0.5 rounded-full">
                        Video
                      </div>
                    )}
                    
                    {/* Play button overlay */}
                    <div 
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-all duration-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (expandedId === episode.id) {
                          // If already expanded, play media
                          if (hasVideo) {
                            toggleVideoPlay(episode.video_url, episode, e);
                          } else {
                            // Find and play audio
                            const audioElement = document.getElementById(`audio-${episode.id}`);
                            if (audioElement) {
                              if (audioElement.paused) {
                                audioElement.play();
                                // Track play count
                                if (onPlay && typeof onPlay === 'function') {
                                  onPlay(episode.id);
                                }
                              } else {
                                audioElement.pause();
                              }
                            } else {
                              toggleExpand(episode.id);
                            }
                          }
                        } else {
                          toggleExpand(episode.id);
                        }
                      }}
                    >
                      <div className="bg-white/80 p-2 rounded-full">
                        <Play className="h-4 w-4 text-[#9F45F5] ml-0.5" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#9F45F5]/10 text-[#9F45F5]">
                            Episode {episode.episode_number}
                          </span>
                          {episode.is_published === '1' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              Published
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white mb-2 line-clamp-2">
                          {episode.title}
                        </h3>
                        
                        <p className="text-sm text-[#86868B] line-clamp-2 mb-3">
                          {episode.description || 'No description provided.'}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-xs text-[#86868B]">
                          <span className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            Added by {episode.added_by?.toUpperCase() || 'HR'}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1" />
                            {formatDate(episode.created_at)}
                          </span>
                          <span>
                            {episode.play_count || 0} plays
                          </span>
                          {hasVideo && (
                            <span className="flex items-center text-[#9F45F5]">
                              <Video className="h-3.5 w-3.5 mr-1" />
                              Has video
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {onEdit && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(episode);
                            }}
                            className="p-2 hover:bg-[#007AFF]/10 text-[#007AFF] rounded-lg transition-colors"
                            title="Edit Episode"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        
                        {onDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(episode.id);
                            }}
                            disabled={deletingId === episode.id}
                            className="p-2 hover:bg-[#FF3B30]/10 text-[#FF3B30] rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Episode"
                          >
                            {deletingId === episode.id ? (
                              <div className="w-4 h-4 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded content */}
                {expandedId === episode.id && (
                  <div className="mt-6 pt-6 border-t border-[#F2F2F7] dark:border-[#2C2C2E]">
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Large Episode Image */}
                      <div className="lg:col-span-1">
                        <div className="aspect-square rounded-2xl overflow-hidden shadow-lg">
                          {episodeImage ? (
                            <img 
                              src={episodeImage}
                              alt={`${episode.title} cover`}
                              className="w-full h-full object-cover"
                              onError={() => handleImageError(episode.id)}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#9F45F5]/20 to-[#9F45F5]/5 flex items-center justify-center">
                              <div className="text-center">
                                <Image className="h-16 w-16 text-[#9F45F5]/50 mx-auto mb-3" />
                                <p className="text-sm text-[#86868B] font-medium">No episode image</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Episode Details */}
                      <div className="lg:col-span-2 space-y-6">
                        <div>
                          <h4 className="text-sm font-semibold text-[#86868B] uppercase tracking-wide mb-3">
                            Description
                          </h4>
                          <p className="text-[#1D1D1F] dark:text-white leading-relaxed">
                            {episode.description || 'No description provided for this episode.'}
                          </p>
                        </div>
                        
                        {/* Video Player */}
                        {hasVideo && (
                          <div>
                            <h4 className="text-sm font-semibold text-[#86868B] uppercase tracking-wide mb-3 flex items-center">
                              <Video className="h-4 w-4 mr-2" />
                              Video
                            </h4>
                            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl overflow-hidden">
                              {activeVideo === episode.video_url ? (
                                <video 
                                  controls 
                                  autoPlay
                                  className="w-full max-h-[400px]"
                                  src={episode.video_url}
                                >
                                  Your browser does not support the video element.
                                </video>
                              ) : (
                                <div 
                                  className="aspect-video relative group cursor-pointer"
                                  onClick={(e) => toggleVideoPlay(episode.video_url, episode, e)}
                                >
                                  {episodeImage ? (
                                    <img 
                                      src={episodeImage}
                                      alt={`${episode.title} thumbnail`}
                                      className="w-full h-full object-cover opacity-90"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-[#1D1D1F] flex items-center justify-center">
                                      <Video className="h-16 w-16 text-[#9F45F5]/50" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/60 transition-colors">
                                    <div className="p-4 rounded-full bg-[#9F45F5]/80 group-hover:bg-[#9F45F5] transition-colors">
                                      <Play className="h-8 w-8 text-white ml-1" />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {episode.video_size_formatted && (
                                <div className="p-3 text-xs text-[#86868B] flex justify-between">
                                  <span>Video file ({episode.video_size_formatted})</span>
                                  <button 
                                    onClick={(e) => toggleVideoPlay(episode.video_url, episode, e)}
                                    className="text-[#9F45F5] hover:underline"
                                  >
                                    {activeVideo === episode.video_url ? 'Hide Video' : 'Play Video'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Audio Player */}
                        {episode.audio_url && (
                          <div>
                            <h4 className="text-sm font-semibold text-[#86868B] uppercase tracking-wide mb-3 flex items-center">
                              <Music className="h-4 w-4 mr-2" />
                              Audio Player
                            </h4>
                            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4">
                              <audio 
                                id={`audio-${episode.id}`}
                                controls 
                                className="w-full focus:outline-none"
                                src={episode.audio_url}
                                preload="metadata"
                                onPlay={(e) => handleAudioPlay(episode, e)}
                              >
                                Your browser does not support the audio element.
                              </audio>
                              {episode.file_size_formatted && (
                                <div className="mt-2 text-xs text-[#86868B]">
                                  Audio file ({episode.file_size_formatted})
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-semibold text-[#86868B] uppercase tracking-wide mb-3">
                            Episode Stats
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4 text-center">
                              <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                                {episode.play_count || 0}
                              </div>
                              <div className="text-xs text-[#86868B] mt-1">
                                Plays
                              </div>
                            </div>
                            
                            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4 text-center">
                              <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                                {episode.download_count || 0}
                              </div>
                              <div className="text-xs text-[#86868B] mt-1">
                                Downloads
                              </div>
                            </div>
                            
                            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4 text-center">
                              <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                                {hasVideo ? 'Yes' : 'No'}
                              </div>
                              <div className="text-xs text-[#86868B] mt-1">
                                Has Video
                              </div>
                            </div>
                            
                            <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4 text-center">
                              <div className={`text-2xl font-bold ${
                                episode.is_published === '1' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-orange-600 dark:text-orange-400'
                              }`}>
                                {episode.is_published === '1' ? '✓' : '○'}
                              </div>
                              <div className="text-xs text-[#86868B] mt-1">
                                {episode.is_published === '1' ? 'Published' : 'Draft'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4 text-sm text-[#86868B]">
                          <div>
                            <span className="font-medium">Release Date:</span> {formatDate(episode.release_date)}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {formatDate(episode.created_at)}
                          </div>
                          {episode.updated_at && episode.updated_at !== episode.created_at && (
                            <div className="sm:col-span-2">
                              <span className="font-medium">Last Updated:</span> {formatDate(episode.updated_at)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EpisodeList;