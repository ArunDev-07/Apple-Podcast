import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Clock, Tag, 
  Play, Pause, ChevronDown, ChevronUp, Headphones, 
  TrendingUp, Zap, Award, Sparkles
} from 'lucide-react';
import { getPodcasts } from '../services/api';

const Explore = () => {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState([]);
  const [featuredPodcasts, setFeaturedPodcasts] = useState([]);
  const [trendingPodcasts, setTrendingPodcasts] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [podcastStatuses, setPodcastStatuses] = useState({});

  // API Base URL
  const API_BASE_URL = 'http://localhost/Podcast/podcast-backend/api';

  useEffect(() => {
    fetchPodcasts();
  }, []);

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

  const fetchPodcasts = async () => {
    setLoading(true);
    try {
      // Fetch all podcasts
      const response = await getPodcasts();
      const allPodcasts = response.data || [];
      setPodcasts(allPodcasts);
      
      // Process podcasts for different sections
      processPodcasts(allPodcasts);
      
      // Load podcast statuses (likes, bookmarks)
      await loadPodcastStatuses(allPodcasts);
    } catch (error) {
      console.error('Error fetching podcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Process podcasts for different sections
  const processPodcasts = (allPodcasts) => {
    if (!allPodcasts || allPodcasts.length === 0) return;
    
    // Get unique categories
    const categories = [...new Set(allPodcasts.map(p => p.category).filter(Boolean))];
    
    // Create category objects with count
    const categoryObjects = categories.map(category => {
      const count = allPodcasts.filter(p => p.category === category).length;
      return { 
        name: category, 
        count,
        color: getRandomGradient()
      };
    });
    
    // Sort by count (most popular first)
    categoryObjects.sort((a, b) => b.count - a.count);
    setPopularCategories(categoryObjects);
    
    // Featured podcasts (random selection of 6)
    const featured = [...allPodcasts]
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
    setFeaturedPodcasts(featured);
    
    // Trending podcasts - properly sorted by play_count
    // Filter out podcasts with no play_count or zero play_count
    const podcastsWithPlayCount = [...allPodcasts].filter(p => p.play_count && p.play_count > 0);
    
    // If we have podcasts with play counts, sort them
    if (podcastsWithPlayCount.length > 0) {
      const trending = podcastsWithPlayCount
        .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
        .slice(0, 8);
      setTrendingPodcasts(trending);
    } else {
      // Fallback: If no podcasts have play counts, use random selection
      const randomTrending = [...allPodcasts]
        .sort(() => 0.5 - Math.random())
        .slice(0, 8);
      setTrendingPodcasts(randomTrending);
    }
    
    // New releases - properly sorted by created_at date
    // Filter out podcasts with no created_at date
    const podcastsWithDates = [...allPodcasts].filter(p => p.created_at);
    
    // If we have podcasts with dates, sort them
    if (podcastsWithDates.length > 0) {
      // Parse dates and sort descending (newest first)
      const releases = podcastsWithDates
        .sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB - dateA; // Newest first
        })
        .slice(0, 8);
      setNewReleases(releases);
    } else {
      // Fallback: If no podcasts have dates, use random selection
      const randomReleases = [...allPodcasts]
        .sort(() => 0.5 - Math.random())
        .slice(0, 8);
      setNewReleases(randomReleases);
    }
  };

  // Load podcast statuses (likes, bookmarks)
  const loadPodcastStatuses = async (allPodcasts) => {
    try {
      const response = await fetch(`${API_BASE_URL}/library/status-bulk.php`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          podcast_ids: allPodcasts.map(p => p.id)
        })
      });
      
      if (response.ok) {
        const statusData = await response.json();
        if (statusData && statusData.data) {
          setPodcastStatuses(statusData.data);
        }
      }
    } catch (error) {
      console.error('Error loading podcast statuses:', error);
      // Non-critical error, continue without statuses
    }
  };

  // Handle liking a podcast
  const handleLikePodcast = async (podcast) => {
    try {
      const isCurrentlyLiked = podcastStatuses[podcast.id]?.liked || false;
      
      if (isCurrentlyLiked) {
        // Unlike the podcast
        const response = await fetch(`${API_BASE_URL}/library/like.php?podcast_id=${podcast.id}`, {
          method: 'DELETE',
          headers: getApiHeaders()
        });
        
        if (response.ok) {
          setPodcastStatuses(prev => ({
            ...prev,
            [podcast.id]: { ...prev[podcast.id], liked: false }
          }));
        }
      } else {
        // Like the podcast
        const response = await fetch(`${API_BASE_URL}/library/like.php`, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            podcast_id: podcast.id
          })
        });
        
        if (response.ok) {
          setPodcastStatuses(prev => ({
            ...prev,
            [podcast.id]: { ...prev[podcast.id], liked: true }
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Show user-friendly error message if needed
    }
  };

  // Handle bookmarking a podcast
  const handleBookmarkPodcast = async (podcast) => {
    try {
      const isCurrentlyBookmarked = podcastStatuses[podcast.id]?.bookmarked || false;
      
      if (isCurrentlyBookmarked) {
        // Remove bookmark
        const response = await fetch(`${API_BASE_URL}/library/bookmark.php?podcast_id=${podcast.id}`, {
          method: 'DELETE',
          headers: getApiHeaders()
        });
        
        if (response.ok) {
          setPodcastStatuses(prev => ({
            ...prev,
            [podcast.id]: { ...prev[podcast.id], bookmarked: false }
          }));
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
          setPodcastStatuses(prev => ({
            ...prev,
            [podcast.id]: { ...prev[podcast.id], bookmarked: true }
          }));
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      // Show user-friendly error message if needed
    }
  };

  // Function to navigate to podcast detail page
  const handleViewPodcast = (podcast) => {
    if (podcast && podcast.id) {
      // Navigate to podcast detail with state indicating source is 'admin' (dashboard)
      navigate(`/podcasts/${podcast.id}`, { state: { from: 'admin' } });
    } else {
      console.error('Cannot navigate: Invalid podcast ID', podcast);
    }
  };

  // Helper functions
  const getImageUrl = (imageUrl) => {
    // Uses http://localhost/Podcast/podcast-backend/uploads/
    return `http://localhost/Podcast/podcast-backend/uploads/${imageUrl}`;
  }

  const formatDuration = (minutes) => {
    if (!minutes) return '0 min';
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
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

  // Get random gradient color for categories
  const getRandomGradient = () => {
    const gradients = [
      'from-purple-500 to-indigo-500',
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-amber-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-rose-500',
      'from-indigo-500 to-purple-500',
      'from-teal-500 to-green-500',
      'from-fuchsia-500 to-pink-500',
      'from-amber-500 to-orange-500',
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  // Filter podcasts based on search and category
  const filterPodcasts = (podcastList) => {
    if (!podcastList) return [];
    
    return podcastList.filter(podcast => {
      const matchesSearch = searchTerm ? (
        podcast.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        podcast.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ) : true;
      
      const matchesCategory = activeCategory === 'all' || podcast.category === activeCategory;
      
      return matchesSearch && matchesCategory;
    });
  };

  // Check if podcast is playing
  const isPodcastPlaying = (podcastId) => {
    return false; // Since we're not managing audio state in Explore anymore
  };

  // Sections data
  const sections = [
    {
      id: 'featured',
      title: 'Featured Podcasts',
      icon: <Sparkles className="h-6 w-6 text-yellow-500" />,
      color: 'from-yellow-500 to-amber-500',
      data: featuredPodcasts,
      layout: 'large' // Large card layout
    },
    {
      id: 'trending',
      title: 'Trending Now',
      subtitle: 'Most played podcasts',
      icon: <TrendingUp className="h-6 w-6 text-purple-500" />,
      color: 'from-purple-500 to-indigo-500',
      data: trendingPodcasts,
      layout: 'grid' // Grid layout
    },
    {
      id: 'new',
      title: 'New Releases',
      subtitle: 'Recently added podcasts',
      icon: <Zap className="h-6 w-6 text-blue-500" />,
      color: 'from-blue-500 to-cyan-500',
      data: newReleases,
      layout: 'grid' // Grid layout
    },
    {
      id: 'popular',
      title: 'Popular Categories',
      icon: <Award className="h-6 w-6 text-emerald-500" />,
      color: 'from-emerald-500 to-teal-500',
      data: popularCategories,
      layout: 'categories' // Categories layout
    },
  ];

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
          <p className="mt-6 text-gray-600 dark:text-gray-300 font-medium">Discovering podcasts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '30px 30px'
          }} />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Discover Amazing Podcasts</h1>
            <p className="text-lg md:text-xl text-indigo-100 max-w-3xl mb-8">
              Explore our vast collection of podcasts from around the world. Find your next favorite show and start listening today.
            </p>
            
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-4xl bg-white/10 backdrop-blur-md p-2 rounded-2xl">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-white/80" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search podcasts..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/20 hover:bg-white/20 transition-all w-full sm:w-auto justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <span>{activeCategory === 'all' ? 'All Categories' : activeCategory}</span>
                  </div>
                  {showCategoryFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {/* Category dropdown */}
                <AnimatePresence>
                  {showCategoryFilter && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-20 mt-2 right-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700"
                    >
                      <div className="max-h-72 overflow-y-auto p-2">
                        <button
                          onClick={() => {
                            setActiveCategory('all');
                            setShowCategoryFilter(false);
                          }}
                          className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg text-left ${
                            activeCategory === 'all' 
                              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          All Categories
                        </button>
                        
                        {popularCategories.map((category) => (
                          <button
                            key={category.name}
                            onClick={() => {
                              setActiveCategory(category.name);
                              setShowCategoryFilter(false);
                            }}
                            className={`flex items-center justify-between w-full px-4 py-2 rounded-lg text-left ${
                              activeCategory === category.name 
                                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            <span>{category.name}</span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                              {category.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Wave decoration at the bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 30L48 35C96 40 192 50 288 48.3C384 46.7 480 33.3 576 25C672 16.7 768 13.3 864 20C960 26.7 1056 43.3 1152 50C1248 56.7 1344 53.3 1392 51.7L1440 50V100H1392C1344 100 1248 100 1152 100C1056 100 960 100 864 100C768 100 672 100 576 100C480 100 384 100 288 100C192 100 96 100 48 100H0V30Z" fill="currentColor" className="text-gray-50 dark:text-gray-900 opacity-100"/>
          </svg>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16">
        <div className="space-y-16">
          {/* Dynamically render sections */}
          {sections.map(section => {
            const filteredData = section.id === 'popular' 
              ? popularCategories
              : filterPodcasts(section.data);
              
            if (filteredData.length === 0) return null;
            
            return (
              <motion.div 
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700"
              >
                {/* Section header */}
                <div className={`relative bg-gradient-to-r ${section.color} p-6`}>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                      {section.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{section.title}</h2>
                      <div className="flex items-center gap-2">
                        {section.subtitle && (
                          <span className="text-sm text-white/80">
                            {section.subtitle}
                          </span>
                        )}
                        {!section.subtitle && (
                          <span className="text-sm text-white/80">
                            {section.id === 'popular' 
                              ? `${filteredData.length} categories` 
                              : `${filteredData.length} podcasts`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Section content */}
                <div className="p-6">
                  {/* Featured podcasts layout - large cards */}
                  {section.layout === 'large' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredData.map((podcast) => (
                        <motion.div
                          key={podcast.id}
                          whileHover={{ y: -5 }}
                          className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-600 cursor-pointer"
                          onClick={() => handleViewPodcast(podcast)}
                        >
                          <div className="flex flex-col md:flex-row h-full">
                            {/* Image */}
                            <div className="md:w-2/5 relative aspect-video md:aspect-auto">
                              <img 
                                src={getImageUrl(podcast.image_url)}
                                alt={podcast.title}
                                className="w-full h-full object-cover"
                              />
                              
                              {/* Category badge */}
                              <div className="absolute top-3 left-3">
                                <span className="bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                  <Tag className="h-3 w-3" />
                                  {podcast.category || 'Podcast'}
                                </span>
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="md:w-3/5 p-6 flex flex-col">
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {podcast.title}
                              </h3>
                              
                              <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4 flex-grow">
                                {podcast.description}
                              </p>
                              
                              <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                  {podcast.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {formatDuration(podcast.duration)}
                                    </span>
                                  )}
                                </div>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewPodcast(podcast);
                                  }}
                                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
                                >
                                  <Play className="h-4 w-4" />
                                  <span>Listen</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {/* Grid layout - standard cards */}
                  {section.layout === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {filteredData.map((podcast) => (
                        <motion.div 
                          key={podcast.id}
                          whileHover={{ y: -8, scale: 1.02 }}
                          className="group bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-200 dark:border-gray-600 cursor-pointer"
                          onClick={() => handleViewPodcast(podcast)}
                        >
                          {/* Image container */}
                          <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-600">
                            <img 
                              src={getImageUrl(podcast.image_url)} 
                              alt={podcast.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                              }}
                            />
                            
                            {/* Category Badge */}
                            <div className="absolute top-3 left-3">
                              <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10">
                                <Tag className="h-3 w-3" />
                                {podcast.category || 'Podcast'}
                              </span>
                            </div>
                            
                            {/* Duration Badge - Only show if duration exists and is greater than 0 */}
                            {podcast.duration && podcast.duration > 0 && (
                              <div className="absolute top-3 right-3">
                                <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(podcast.duration)}
                                </span>
                              </div>
                            )}
                            
                            {/* Display play count for trending section */}
                            {section.id === 'trending' && podcast.play_count > 0 && (
                              <div className="absolute bottom-3 right-3">
                                <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-purple-600/80 backdrop-blur-sm text-white border border-white/10">
                                  <Headphones className="h-3 w-3" />
                                  {podcast.play_count} plays
                                </span>
                              </div>
                            )}
                            
                            {/* Display date for new releases section */}
                            {section.id === 'new' && podcast.created_at && (
                              <div className="absolute bottom-3 right-3">
                                <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-blue-600/80 backdrop-blur-sm text-white border border-white/10">
                                  <Zap className="h-3 w-3" />
                                  {formatDate(podcast.created_at)}
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
                              {section.id === 'new' ? (
                                <span className="text-gray-500 dark:text-gray-300 flex items-center gap-1">
                                  <Zap className="h-3 w-3 text-blue-500" />
                                  New
                                </span>
                              ) : section.id === 'trending' ? (
                                <span className="text-gray-500 dark:text-gray-300 flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-purple-500" />
                                  Trending
                                </span>
                              ) : (
                                <span className="text-gray-500 dark:text-gray-300">
                                  {formatDate(podcast.created_at)}
                                </span>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPodcast(podcast);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
                              >
                                <Play className="h-3 w-3" />
                                <span>Listen</span>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {/* Categories layout */}
                  {section.layout === 'categories' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredData.map((category) => (
                        <motion.button
                          key={category.name}
                          whileHover={{ y: -5, scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setActiveCategory(category.name)}
                          className={`relative flex items-center justify-between p-5 rounded-xl bg-gradient-to-r ${category.color} overflow-hidden shadow-md hover:shadow-lg text-white transition-all duration-300 text-left`}
                        >
                          {/* Background pattern */}
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute inset-0" style={{ 
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                              backgroundSize: '30px 30px'
                            }} />
                          </div>
                          
                          <div className="relative">
                            <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
                            <div className="flex items-center text-white/80 text-sm">
                              <Tag className="h-3.5 w-3.5 mr-1" />
                              {category.count} {category.count === 1 ? 'podcast' : 'podcasts'}
                            </div>
                          </div>
                          
                          <div className="h-12 w-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Headphones className="h-6 w-6 text-white" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {/* All podcasts section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Headphones className="h-6 w-6 text-purple-500" />
                All Podcasts
                {activeCategory !== 'all' && (
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    • {activeCategory}
                  </span>
                )}
              </h2>
            </div>
            
            <div className="p-6">
              {/* All podcasts grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filterPodcasts(podcasts).map((podcast) => (
                  <motion.div 
                    key={podcast.id}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="group bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-200 dark:border-gray-600 cursor-pointer"
                    onClick={() => handleViewPodcast(podcast)}
                  >
                    {/* Image container */}
                    <div className="relative aspect-square overflow-hidden bg-gray-200 dark:bg-gray-600">
                      <img 
                        src={getImageUrl(podcast.image_url)} 
                        alt={podcast.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                        }}
                      />
                      
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10">
                          <Tag className="h-3 w-3" />
                          {podcast.category || 'Podcast'}
                        </span>
                      </div>
                      
                      {/* Duration Badge - Only show if duration exists and is greater than 0 */}
                      {podcast.duration && podcast.duration > 0 && (
                        <div className="absolute top-3 right-3">
                          <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10">
                            <Clock className="h-3 w-3" />
                            {formatDuration(podcast.duration)}
                          </span>
                        </div>
                      )}
                      
                      {/* Date Badge */}
                      {podcast.created_at && (
                        <div className="absolute bottom-3 right-3">
                          <span className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white border border-white/10">
                            <Clock className="h-3 w-3" />
                            {formatDate(podcast.created_at)}
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
                        <span className="text-gray-500 dark:text-gray-300">
                          {formatDate(podcast.created_at)}
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewPodcast(podcast);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200"
                        >
                          <Play className="h-3 w-3" />
                          <span>Listen</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Empty state */}
              {filterPodcasts(podcasts).length === 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-12 text-center">
                  <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">No podcasts found</h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    We couldn't find any podcasts matching your search criteria.
                  </p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setActiveCategory('all');
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      <style jsx>{`
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
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Explore;