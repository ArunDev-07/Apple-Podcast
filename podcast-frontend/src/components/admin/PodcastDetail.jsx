import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getPodcast, getEpisodes, incrementPlayCount, updateEpisodeProgress } from '../../services/api';
import EpisodeList from './EpisodeList';
import EpisodeForm from './EpisodeForm';
import { 
  ArrowLeft, 
  PlusCircle, 
  Calendar, 
  Play,
  Video,
  BarChart,
  Clock,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

const PodcastDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [podcast, setPodcast] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalVideos: 0,
    totalDuration: 0,
    completionRate: 0
  });

  // Get the source page from location state
  const fromPage = location.state?.from || 'admin';

  useEffect(() => {
    // Only fetch when ID is valid
    if (id && id !== 'undefined') {
      fetchPodcast();
    } else {
      console.error('Invalid podcast ID detected:', id);
      setLoading(false);
    }
  }, [id]);

  const fetchPodcast = async () => {
    try {
      setLoading(true);
      
      // Ensure ID is valid before making API calls
      if (!id || id === 'undefined') {
        throw new Error('Invalid podcast ID');
      }
      
      console.log(`Fetching podcast with ID: ${id}`);
      const response = await getPodcast(id);
      setPodcast(response.data);
      
      // Fetch episodes for this podcast
      try {
        console.log(`Fetching episodes for podcast ID ${id}`);
        const episodesResponse = await getEpisodes(id);
        console.log('Raw episodes response:', episodesResponse);
        
        // Enhanced data processing with better logging
        let episodesData = [];
        
        if (episodesResponse.data) {
          // If response.data is a string (contains PHP warnings), try to extract JSON
          if (typeof episodesResponse.data === 'string') {
            try {
              console.log('Episodes data is a string, attempting to extract JSON');
              // Find JSON part in the string (after PHP warnings)
              const jsonMatch = episodesResponse.data.match(/\{.*\}$/s);
              if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                if (jsonData.success && jsonData.data) {
                  episodesData = jsonData.data;
                  console.log('Successfully extracted JSON data');
                }
              }
            } catch (parseError) {
              console.error('Error parsing episodes JSON:', parseError);
              episodesData = [];
            }
          }
          // If response.data is already an object
          else if (typeof episodesResponse.data === 'object') {
            console.log('Episodes data is an object');
            
            if (episodesResponse.data.success && Array.isArray(episodesResponse.data.data)) {
              console.log('Found success:true and data array');
              episodesData = episodesResponse.data.data;
            } else if (Array.isArray(episodesResponse.data)) {
              console.log('Response data is directly an array');
              episodesData = episodesResponse.data;
            } else if (episodesResponse.data.data && typeof episodesResponse.data.data === 'object' && !Array.isArray(episodesResponse.data.data)) {
              // Handle case where data is a single object (not an array)
              console.log('Data is a single object, converting to array');
              episodesData = [episodesResponse.data.data];
            } else if (episodesResponse.data.success && !episodesResponse.data.data) {
              // Handle case with success but no data (empty result)
              console.log('Success response but no data');
              episodesData = [];
            } else {
              // Try to extract any available episodes data
              console.log('Unrecognized data format, attempting to extract episodes');
              const possibleData = episodesResponse.data.data || episodesResponse.data;
              if (possibleData) {
                if (Array.isArray(possibleData)) {
                  episodesData = possibleData;
                } else if (typeof possibleData === 'object' && possibleData.id) {
                  // Looks like a single episode object
                  episodesData = [possibleData];
                }
              }
            }
          }
        }
        
        console.log('Processed episodes data:', episodesData);
        console.log('Episode data details:', {
          type: typeof episodesData,
          isArray: Array.isArray(episodesData),
          length: episodesData ? episodesData.length : 0,
          firstItem: episodesData && episodesData.length > 0 ? episodesData[0] : null,
          keys: episodesData && episodesData.length > 0 ? Object.keys(episodesData[0]) : 'No items'
        });
        
        // Ensure episodes is always an array
        setEpisodes(Array.isArray(episodesData) ? episodesData : []);
        
        // Calculate podcast stats
        calculatePodcastStats(episodesData);
        
      } catch (episodeError) {
        console.error('Error fetching episodes:', episodeError);
        setEpisodes([]);
      }
    } catch (error) {
      console.error('Error fetching podcast details:', error);
      setPodcast(null);
    } finally {
      setLoading(false);
    }
  };

  // Add the refresh function to window for EpisodeForm to call
  window.refreshEpisodes = fetchPodcast;

  // Calculate podcast stats from episodes data
  const calculatePodcastStats = (episodesData) => {
    if (!Array.isArray(episodesData) || episodesData.length === 0) {
      setStats({
        totalPlays: 0,
        totalVideos: 0,
        totalDuration: 0,
        completionRate: 0
      });
      return;
    }

    const totalPlays = episodesData.reduce((sum, episode) => sum + (parseInt(episode.play_count) || 0), 0);
    const totalVideos = episodesData.filter(episode => episode.video_url).length;
    const totalDuration = episodesData.reduce((sum, episode) => sum + (parseInt(episode.duration) || 0), 0);
    
    // Calculate completion rate if data available
    let completionRate = 0;
    const episodesWithStats = episodesData.filter(episode => 
      episode.completed_count !== undefined && 
      episode.play_count !== undefined && 
      parseInt(episode.play_count) > 0
    );
    
    if (episodesWithStats.length > 0) {
      const totalCompletions = episodesWithStats.reduce((sum, episode) => 
        sum + (parseInt(episode.completed_count) || 0), 0
      );
      const totalPlaysWithStats = episodesWithStats.reduce((sum, episode) => 
        sum + (parseInt(episode.play_count) || 0), 0
      );
      
      completionRate = totalPlaysWithStats > 0 
        ? Math.round((totalCompletions / totalPlaysWithStats) * 100) 
        : 0;
    }

    setStats({
      totalPlays,
      totalVideos,
      totalDuration,
      completionRate
    });
  };

  // Handle navigation back to the source page - always go to explore
  const handleBackNavigation = () => {
    navigate('/admin');
  };

  const handleAddEpisode = () => {
    setEditingEpisode(null);
    setShowForm(true);
  };

  const handleEditEpisode = (episode) => {
    setEditingEpisode(episode);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEpisode(null);
    fetchPodcast(); // Refresh data
  };

  const handlePlayEpisode = (episodeId) => {
    // Increment play count when an episode is played
    if (episodeId) {
      console.log('Tracking play count for episode:', episodeId);
      incrementPlayCount(episodeId)
        .then(response => {
          console.log('Play count incremented:', response);
          // Optionally update local state to reflect the increment
          setEpisodes(prevEpisodes => 
            prevEpisodes.map(ep => 
              ep.id === episodeId 
                ? {...ep, play_count: (parseInt(ep.play_count) || 0) + 1} 
                : ep
            )
          );
        })
        .catch(error => {
          console.error('Failed to increment play count:', error);
          // Silently fail - don't interrupt user experience
        });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0 min';
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m` 
        : `${hours}h`;
    }
  };

  // Function to check if user is admin (fallback if isAdmin from useAuth is undefined)
  const checkIsAdmin = () => {
    if (typeof isAdmin === 'function') {
      return isAdmin();
    }
    // Fallback check
    return user && user.role === 'admin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-800 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#9F45F5] rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading podcast details...</p>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-red-600 dark:text-red-400">Podcast not found</p>
          </div>
          <button 
            onClick={handleBackNavigation}
            className="mt-4 px-4 py-2 bg-[#9F45F5] text-white rounded-lg"
          >
            Return to Explore
          </button>
        </div>
      </div>
    );
  }

  const isUserAdmin = checkIsAdmin();

  return (
    <motion.div
      className="min-h-screen bg-[#F2F2F7] dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button and title */}
        <div className="mb-6">
          <button 
            onClick={handleBackNavigation}
            className="flex items-center gap-2 text-[#9F45F5] hover:text-[#8A2BE2] transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Explore</span>
          </button>
          <h1 className="text-3xl font-bold text-[#1D1D1F] dark:text-white">
            Podcast Details
          </h1>
        </div>

        {/* Podcast detail card */}
        <motion.div
          className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm overflow-hidden mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="md:flex">
            {/* Cover image - Keeping as object-cover */}
            <div className="md:w-1/3 lg:w-1/4 relative group">
              <img 
                src={`http://localhost/Podcast/podcast-backend/uploads/${podcast.image_url}`}
                alt={podcast.title}
                className="w-full h-64 md:h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop';
                }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="h-16 w-16 text-white fill-white" />
              </div>
            </div>

            {/* Podcast details */}
            <div className="p-4 md:p-6 md:w-2/3 lg:w-3/4">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white mb-3">
                  {podcast.title}
                </h2>

                <div className="flex flex-wrap gap-4 mb-4">
                  {podcast.category && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase">
                      {podcast.category}
                    </span>
                  )}
                  {podcast.created_at && (
                    <div className="flex items-center text-sm text-[#86868B]">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      <span>{formatDate(podcast.created_at)}</span>
                    </div>
                  )}
                </div>

                <p className="text-[#1D1D1F] dark:text-white/90 mb-6">
                  {podcast.description}
                </p>
              </div>

              {/* Stats Dashboard */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <BarChart className="h-5 w-5 text-[#9F45F5]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                    {stats.totalPlays}
                  </div>
                  <div className="text-xs text-[#86868B] mt-1">
                    Total Plays
                  </div>
                </div>
                
                <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Video className="h-5 w-5 text-[#9F45F5]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                    {stats.totalVideos}
                  </div>
                  <div className="text-xs text-[#86868B] mt-1">
                    Videos
                  </div>
                </div>
                
                <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-[#9F45F5]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                    {formatDuration(stats.totalDuration)}
                  </div>
                  <div className="text-xs text-[#86868B] mt-1">
                    Total Duration
                  </div>
                </div>
                
                <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-[#9F45F5]" />
                  </div>
                  <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                    {stats.completionRate}%
                  </div>
                  <div className="text-xs text-[#86868B] mt-1">
                    Completion Rate
                  </div>
                </div>
              </div>

              {/* Add Episode Button - Only shown to admins */}
              {isUserAdmin && (
                <div className="flex justify-end">
                  <button
                    onClick={handleAddEpisode}
                    className="flex items-center gap-2 px-6 py-3 bg-[#9F45F5] hover:bg-[#8A2BE2] text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span>Add Episode</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Episodes section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-white">
              Episodes ({episodes.length})
            </h2>
            {isUserAdmin && (
              <button
                onClick={handleAddEpisode}
                className="flex items-center gap-2 px-4 py-2 bg-[#9F45F5] hover:bg-[#8A2BE2] text-white rounded-lg font-medium transition-all duration-200"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Episode</span>
              </button>
            )}
          </div>

          {/* Episode list */}
          {Array.isArray(episodes) && episodes.length > 0 ? (
            <EpisodeList 
              episodes={episodes} 
              onEdit={isUserAdmin ? handleEditEpisode : null} 
              onDelete={isUserAdmin ? fetchPodcast : null}
              onPlay={handlePlayEpisode} 
            />
          ) : (
            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="h-8 w-8 text-[#86868B]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1D1D1F] dark:text-white mb-2">
                No episodes yet
              </h3>
              <p className="text-[#86868B] text-sm mb-4">
                {isUserAdmin
                  ? "Start building your podcast content by creating your first episode."
                  : "This podcast doesn't have any episodes yet. Check back later."}
              </p>
              {/* Debug info in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-left overflow-auto max-h-40">
                  <p>Debug info:</p>
                  <pre>{JSON.stringify({episodesState: episodes}, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Episode Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EpisodeForm 
                podcastId={id} 
                episode={editingEpisode} 
                onClose={handleCloseForm} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSS styles to override EpisodeList component */}
        <style jsx global>{`
          /* Hide like and share buttons in episode items */
          .episode-item .like-button,
          .episode-item .share-button {
            display: none !important;
          }
          
          /* Make audio player smaller */
          .audio-player {
            padding: 0.75rem !important; /* Smaller padding */
          }
          
          .audio-player-controls {
            transform: scale(0.9); /* Make controls slightly smaller */
            margin: -0.25rem; /* Compensate for scaling */
          }
        `}</style>
      </div>
    </motion.div>
  );
};

export default PodcastDetail;