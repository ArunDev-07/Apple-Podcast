import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Bookmark, Clock, BarChart2, 
  ChevronRight, RefreshCw, Search, PlayCircle, Headphones
} from 'lucide-react';
import { 
  getPodcasts, 
  getImageUrl, 
  likePodcast, 
  unlikePodcast, 
  bookmarkPodcast, 
  removeBookmark,
  incrementPlayCount
} from '../services/api';
import AudioPlayer from '../components/user/AudioPlayer';
import AnimatedWrapper from '../components/animations/AnimatedWrapper';
import PodcastEpisodesModal from '../components/user/PodcastEpisodesModal';

const Categories = () => {
  const navigate = useNavigate();
  const [library, setLibrary] = useState({
    liked_songs: [],
    bookmarked: [],
    recently_played: []
  });
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [podcastStatuses, setPodcastStatuses] = useState({});
  const [showEpisodesModal, setShowEpisodesModal] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    fetchLibraryData();
  }, []);

  // Fetch library data from backend
  const fetchLibraryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/library/get.php`, {
        headers: getApiHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch library data: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.data) {
        setLibrary(data.data);
        
        // Create status map for quick lookup
        const statusMap = {};
        
        // Mark liked podcasts
        data.data.liked_songs?.forEach(podcast => {
          statusMap[podcast.id] = { ...statusMap[podcast.id], liked: true };
        });
        
        // Mark bookmarked podcasts  
        data.data.bookmarked?.forEach(podcast => {
          statusMap[podcast.id] = { ...statusMap[podcast.id], bookmarked: true };
        });
        
        setPodcastStatuses(statusMap);
      }
    } catch (error) {
      console.error('Error fetching library data:', error);
      setError('Failed to load library data. Please try again later.');
      
      // Fallback to regular podcasts if library API fails
      try {
        const fallbackResponse = await getPodcasts();
        const podcasts = fallbackResponse.data || [];
        
        setLibrary({
          liked_songs: [],
          bookmarked: [],
          recently_played: podcasts.slice(0, 4)
        });
      } catch (fallbackError) {
        console.error('Error fetching fallback data:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle liking a podcast via API
  const handleLikePodcast = async (podcast) => {
    if (loadingAction) return;
    
    setLoadingAction(true);
    try {
      const isCurrentlyLiked = podcastStatuses[podcast.id]?.liked || false;
      
      if (isCurrentlyLiked) {
        // Unlike the podcast using the API service
        const response = await unlikePodcast(podcast.id);
        
        if (response.data && response.data.liked === false) {
          // Update local state
          setLibrary(prev => ({
            ...prev,
            liked_songs: prev.liked_songs.filter(p => p.id !== podcast.id)
          }));
          
          setPodcastStatuses(prev => ({
            ...prev,
            [podcast.id]: { ...prev[podcast.id], liked: false }
          }));
        }
      } else {
        // Like the podcast using the API service
        const response = await likePodcast(podcast.id);
        
        if (response.data && response.data.liked === true) {
          // Add to liked songs
          setLibrary(prev => ({
            ...prev,
            liked_songs: [podcast, ...prev.liked_songs]
          }));
          
          setPodcastStatuses(prev => ({
            ...prev,
            [podcast.id]: { ...prev[podcast.id], liked: true }
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Show user-friendly error message
      if (error.response?.status === 401) {
        alert('Please log in to like podcasts');
      } else {
        alert('Failed to update like status. Please try again.');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle bookmarking a podcast via API
  const handleBookmarkPodcast = async (podcast) => {
    if (loadingAction) return;
    
    setLoadingAction(true);
    try {
      const isCurrentlyBookmarked = podcastStatuses[podcast.id]?.bookmarked || false;
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark using the API service
        const response = await removeBookmark(podcast.id);
        
        if (response.data && response.data.bookmarked === false) {
          // Update local state
          setLibrary(prev => ({
            ...prev,
            bookmarked: prev.bookmarked.filter(p => p.id !== podcast.id)
          }));
          
          setPodcastStatuses(prev => ({
            ...prev,
            [podcast.id]: { ...prev[podcast.id], bookmarked: false }
          }));
        }
      } else {
        // Add bookmark using the API service
        const response = await bookmarkPodcast(podcast.id);
        
        if (response.data && response.data.bookmarked === true) {
          // Add to bookmarked
          setLibrary(prev => ({
            ...prev,
            bookmarked: [podcast, ...prev.bookmarked]
          }));
          
          setPodcastStatuses(prev => ({
            ...prev,
            [podcast.id]: { ...prev[podcast.id], bookmarked: true }
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Show user-friendly error message
      if (error.response?.status === 401) {
        alert('Please log in to bookmark podcasts');
      } else {
        alert('Failed to update bookmark status. Please try again.');
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // Handle playing a podcast via API
  const handlePlayPodcast = async (podcast) => {
    setSelectedPodcast(podcast);
    setPlaying(podcast.id);
    
    try {
      // Track play in backend using the API service
      await incrementPlayCount(podcast.id);
      
      // Update recently_played right away
      setLibrary(prev => {
        const filteredRecentlyPlayed = prev.recently_played.filter(p => p.id !== podcast.id);
        return {
          ...prev,
          recently_played: [podcast, ...filteredRecentlyPlayed].slice(0, 8)
        };
      });
      
      // Optional: Do a full refresh of library data after a short delay
      setTimeout(() => {
        fetchLibraryData();
      }, 2000);
      
    } catch (error) {
      console.error('Error tracking play:', error);
      // Don't block playback for tracking errors
    }
  };

  // Function to navigate to podcast detail page
  const handleViewPodcast = (podcast) => {
    if (podcast && podcast.id) {
      // Navigate to podcast detail with state indicating source is 'admin'
      navigate(`/podcasts/${podcast.id}`, { state: { from: 'library' } });
    } else {
      console.error('Cannot navigate: Invalid podcast ID', podcast);
    }
  };

  // Function to show episodes modal
  const handleShowEpisodes = (podcast) => {
    setSelectedPodcast(podcast);
    setShowEpisodesModal(true);
  };

  // Function to play an episode
  const handlePlayEpisode = (episode) => {
    setSelectedEpisode(episode);
    setSelectedPodcast({...selectedPodcast, ...episode}); // Merge podcast and episode data
    setPlaying(episode.id);
    
    try {
      // Track play in backend
      incrementPlayCount(episode.id);
      
      // Update recently_played right away
      setLibrary(prev => {
        const filteredRecentlyPlayed = prev.recently_played.filter(p => p.id !== episode.id);
        return {
          ...prev,
          recently_played: [episode, ...filteredRecentlyPlayed].slice(0, 8)
        };
      });
      
      // Optional: Do a full refresh of library data after a short delay
      setTimeout(() => {
        fetchLibraryData();
      }, 2000);
      
    } catch (error) {
      console.error('Error tracking play:', error);
      // Don't block playback for tracking errors
    }
  };

  const handleClosePlayer = () => {
    setSelectedPodcast(null);
    setSelectedEpisode(null);
    setPlaying(null);
  };

  // Updated to handle missing or zero duration values
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const categorySections = [
    { 
      id: 'liked_songs', 
      title: 'Liked Songs', 
      icon: <Heart className="h-6 w-6 text-pink-500" />, 
      color: 'from-pink-500 to-rose-500',
      gradient: 'bg-gradient-to-r from-pink-500/10 to-rose-500/10',
      border: 'border-pink-200 dark:border-pink-900',
      description: 'Songs you have liked'
    },
    { 
      id: 'bookmarked', 
      title: 'Bookmarked', 
      icon: <Bookmark className="h-6 w-6 text-blue-500" />, 
      color: 'from-blue-500 to-indigo-500',
      gradient: 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10',
      border: 'border-blue-200 dark:border-blue-900',
      description: 'Episodes saved for later'
    },
    { 
      id: 'recently_played', 
      title: 'Recently Played', 
      icon: <Clock className="h-6 w-6 text-emerald-500" />, 
      color: 'from-emerald-500 to-teal-500',
      gradient: 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10',
      border: 'border-emerald-200 dark:border-emerald-900',
      description: 'Recently played episodes'
    }
  ];

  const filterPodcasts = (podcasts) => {
    if (!searchTerm.trim()) return podcasts;
    
    return podcasts.filter(podcast => 
      podcast.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      podcast.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      podcast.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-purple-200 dark:border-purple-800/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Headphones className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">Loading your library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md px-4">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {error}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We couldn't load your library data. This might be because you're not logged in or there's a connection issue.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => fetchLibraryData()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <AnimatedWrapper animation="fadeDown">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg">
                <Headphones className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold">Your Library</h1>
                <div className="flex items-center gap-2 text-sm text-purple-200 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <span>
                    {library.liked_songs?.length + library.bookmarked?.length + library.most_played?.length + library.recently_played?.length} episodes available
                  </span>
                </div>
              </div>
            </div>
            <p className="text-lg text-purple-100 max-w-2xl mb-12">
              All your favorite podcasts in one place. Browse your liked, bookmarked, and recently played content.
            </p>
          </AnimatedWrapper>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-purple-300" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search in your library..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-purple-200 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setActiveCategory('all')}
                className={`px-4 py-3 rounded-xl backdrop-blur-sm border transition-all ${
                  activeCategory === 'all' 
                    ? 'bg-white text-purple-600 border-white' 
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                All
              </button>
              
              <button 
                onClick={fetchLibraryData}
                className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
                title="Refresh library"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Stats Bar */}
        <div className="mb-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {categorySections.map((section, index) => (
            <motion.div
              key={section.id}
              whileHover={{ y: -5, scale: 1.02 }}
              className="relative overflow-hidden rounded-xl shadow-md bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">{section.title}</p>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{library[section.id]?.length || 0}</p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-r ${section.color} text-white`}>
                  {section.icon}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Category Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4 mb-10">
          {categorySections.map((section) => (
            <motion.button
              key={section.id}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(activeCategory === section.id ? 'all' : section.id)}
              className={`relative flex items-center gap-2 px-6 py-3 rounded-xl ${section.gradient} 
                border ${section.border} whitespace-nowrap transition-all 
                ${activeCategory === section.id ? 'ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900 ring-purple-500' : ''}`}
            >
              {activeCategory === section.id && (
                <span className="absolute inset-0 rounded-xl bg-purple-500/20 animate-pulse opacity-75"></span>
              )}
              
              {section.icon}
              <span className="font-medium text-gray-800 dark:text-white">{section.title}</span>
              <span className="bg-white/20 dark:bg-black/20 text-xs px-2 py-1 rounded-full text-gray-700 dark:text-gray-200">
                {library[section.id]?.length || 0}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Library Content */}
        <div className="space-y-16">
          {(activeCategory === 'all' ? categorySections : categorySections.filter(s => s.id === activeCategory))
            .map((section) => {
              const sectionPodcasts = filterPodcasts(library[section.id] || []);
              
              if (sectionPodcasts.length === 0) {
                return (
                  <div key={section.id} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        {section.icon}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
                      </div>
                    </div>
                    
                    <div className="py-12 text-center">
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.1, 1], 
                          opacity: [0.7, 1, 0.7],
                          rotate: [0, 5, 0]
                        }} 
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner"
                      >
                        {section.icon}
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No {section.title.toLowerCase()} yet</h3>
                      <p className="text-gray-500 dark:text-gray-300 mb-6 max-w-md mx-auto">
                        {section.description}
                      </p>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-6 py-3 bg-gradient-to-r ${section.color} text-white rounded-xl shadow-lg hover:shadow-xl transition-all`}
                        onClick={() => navigate('/explore')}
                      >
                        Explore Podcasts
                      </motion.button>
                    </div>
                  </div>
                );
              }
              
              return (
                <AnimatedWrapper key={section.id} animation="fadeUp">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                    {/* Section Header */}
                    <div className={`relative bg-gradient-to-r ${section.color} p-6`}>
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                            {section.icon}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-white/80">
                                {sectionPodcasts.length} episodes
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {activeCategory !== section.id && (
                          <button 
                            onClick={() => setActiveCategory(section.id)}
                            className="flex items-center gap-1 text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
                          >
                            <span>View All</span>
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {sectionPodcasts.slice(0, activeCategory === section.id ? undefined : 4).map((podcast) => (
                          <motion.div 
                            key={`${section.id}-${podcast.id}`}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="group bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-200 dark:border-gray-600 cursor-pointer"
                            onClick={() => handleViewPodcast(podcast)} 
                          >
                            {/* Image container */}
                            <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-600">
                              <img 
                                src={getImageUrl(podcast.image_url)} 
                                alt={podcast.title} 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                onError={(e) => {
                                  e.target.src = 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop';
                                }}
                              />
                              
                              {/* Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              {/* Category Badge */}
                              <div className="absolute top-3 left-3">
                                <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10 uppercase">
                                  <Headphones className="h-3 w-3" />
                                  {podcast.category || 'Podcast'}
                                </span>
                              </div>
                              
                              {/* Duration Badge - Only show if duration exists and is greater than 0 */}
                              {podcast.duration > 0 && (
                                <div className="absolute top-3 right-3">
                                  <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10">
                                    <Clock className="h-3 w-3" />
                                    {formatDuration(podcast.duration)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Content Section */}
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {podcast.title}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-300 line-clamp-2 mb-3">
                                {podcast.description}
                              </p>
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex gap-1">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLikePodcast(podcast);
                                    }}
                                    className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                                      podcastStatuses[podcast.id]?.liked ? 'text-pink-500' : 'text-gray-400 dark:text-gray-300'
                                    }`}
                                    title={podcastStatuses[podcast.id]?.liked ? 'Remove from liked' : 'Add to liked'}
                                    disabled={loadingAction}
                                  >
                                    <Heart className={`h-4 w-4 ${podcastStatuses[podcast.id]?.liked ? 'fill-current' : ''} ${loadingAction ? 'animate-pulse' : ''}`} />
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleBookmarkPodcast(podcast);
                                    }}
                                    className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                                      podcastStatuses[podcast.id]?.bookmarked ? 'text-blue-500' : 'text-gray-400 dark:text-gray-300'
                                    }`}
                                    title={podcastStatuses[podcast.id]?.bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                                    disabled={loadingAction}
                                  >
                                    <Bookmark className={`h-4 w-4 ${podcastStatuses[podcast.id]?.bookmarked ? 'fill-current' : ''} ${loadingAction ? 'animate-pulse' : ''}`} />
                                  </button>
                                </div>
                                <span className="text-gray-500 dark:text-gray-300">
                                  {formatDate(podcast.created_at)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AnimatedWrapper>
              );
            })}
        </div>
      </div>

      {/* Podcast Episodes Modal */}
      <PodcastEpisodesModal
        podcast={selectedPodcast}
        isOpen={showEpisodesModal}
        onClose={() => setShowEpisodesModal(false)}
        onPlayEpisode={handlePlayEpisode}
        currentlyPlaying={selectedEpisode}
        podcastStatuses={podcastStatuses}
        onLikeChange={handleLikePodcast}
        onBookmarkChange={handleBookmarkPodcast}
      />

      {/* Audio Player */}
      <AnimatePresence>
        {selectedPodcast && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 inset-x-0 z-50"
          >
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border-t border-white/20 dark:border-gray-800/20 shadow-xl">
              <div className="max-w-7xl mx-auto">
                <AudioPlayer
                  podcast={selectedPodcast}
                  onClose={handleClosePlayer}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Now Playing Button */}
      {selectedPodcast && (
        <div className="fixed bottom-6 inset-x-0 mx-auto w-max z-20 px-4">
          <motion.button
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all"
          >
            <div className="relative">
              <PlayCircle className="h-6 w-6" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            </div>
            <div>
              <span className="block text-xs text-purple-200">Now Playing</span>
              <span className="block font-medium text-white line-clamp-1">{selectedPodcast.title}</span>
            </div>
          </motion.button>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Categories;