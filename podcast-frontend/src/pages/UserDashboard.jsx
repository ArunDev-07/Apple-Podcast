import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Home, ListMusic, BarChart3, Play, Pause, 
  Volume2, VolumeX, X, ChevronRight, Tag, Globe, 
  Heart, Bookmark, Headphones, Mail, Phone, HelpCircle, FileText, Shield
} from 'lucide-react';

const ApplePodcastsDashboard = () => {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState([]);
  const [featuredPodcasts, setFeaturedPodcasts] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [mostPlayed, setMostPlayed] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [currentPodcast, setCurrentPodcast] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volume, setVolume] = useState(80);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentView, setCurrentView] = useState('browse');
  const [likedPodcasts, setLikedPodcasts] = useState([]);
  const [bookmarkedPodcasts, setBookmarkedPodcasts] = useState([]);
  const audioRef = useRef(null);
  
  // API Base URL
  const API_BASE_URL = 'http://localhost/Podcast/podcast-backend/api';

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error("Play failed:", err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (newVolume === 0) {
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
    } else if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.muted = false;
      }
    }
  };

  // Handle close player
  const handleClosePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentPodcast(null);
    setCurrentEpisode(null);
    setIsPlaying(false);
  };

  // Footer Component
  const Footer = () => {
    const currentYear = new Date().getFullYear();

    const supportLinks = [
      { name: 'Help Center', href: '#', icon: HelpCircle },
      { name: 'Contact Us', href: '#', icon: Mail },
      { name: 'Terms of Service', href: '#', icon: FileText },
      { name: 'Privacy Policy', href: '#', icon: Shield }
    ];

    return (
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-4 md:px-6 md:py-8">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
            {/* Brand Section */}
            <div>
              <div className="flex items-center mb-2 md:mb-4">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-purple-600 rounded-full flex items-center justify-center mr-2 md:mr-3">
                  <Headphones className="h-3 w-3 md:h-5 md:w-5 text-white" />
                </div>
                <span className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Podcasts</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-2 md:mb-4 max-w-md text-sm md:text-base">
                Discover, listen, and enjoy your favorite podcasts all in one place. 
                Built for podcast lovers, by podcast lovers.
              </p>
              <div className="flex items-center space-x-3 md:space-x-4">
                <a href="mailto:support@podcasts.com" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <Mail className="h-4 w-4 md:h-5 md:w-5" />
                </a>
                <a href="tel:+1234567890" className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                  <Phone className="h-4 w-4 md:h-5 md:w-5" />
                </a>
              </div>
            </div>

            {/* Support Section */}
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2 md:mb-4">Support</h3>
              <ul className="space-y-2 md:space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-sm md:text-base"
                    >
                      <link.icon className="h-3 w-3 md:h-4 md:w-4 mr-2 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 md:pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-2 md:mb-0">
              © {currentYear} Podcasts. All rights reserved.
            </p>
            <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600 dark:text-gray-400">
              Made with
              <Heart className="h-3 w-3 md:h-4 md:w-4 text-red-500 fill-current mx-1" />
              for podcast lovers
            </div>
          </div>
        </div>
      </footer>
    );
  };

  // Fetch podcasts from API
  useEffect(() => {
    // Define fetch function
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all podcasts
        const response = await fetch(`${API_BASE_URL}/podcasts/get.php`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch podcasts');
        }
        
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
          setPodcasts(data);
          
          // Get categories
          const uniqueCategories = [...new Set(data.map(p => p.category).filter(Boolean))];
          setCategories(uniqueCategories);
          
          // Set featured podcasts
          setFeaturedPodcasts(data.slice(5, 10));
          
          // Set new releases sorted by date (released within last 30 days)
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
          
          const recentPodcasts = data.filter(podcast => {
            const releaseDate = new Date(podcast.created_at || podcast.release_date || 0);
            return releaseDate >= thirtyDaysAgo;
          });
          
          const sortedByDate = recentPodcasts.sort((a, b) => {
            const dateA = new Date(a.created_at || a.release_date || 0);
            const dateB = new Date(b.created_at || b.release_date || 0);
            return dateB - dateA; // Most recent first
          });
          
          setNewReleases(sortedByDate.slice(0, 10));
        }

        // Fetch liked podcasts
        const likedResponse = await fetch(`${API_BASE_URL}/library/liked.php`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (likedResponse.ok) {
          const likedData = await likedResponse.json();
          console.log('Liked podcasts response:', likedData);
          if (likedData && Array.isArray(likedData)) {
            setLikedPodcasts(likedData);
          }
        } else {
          console.error('Failed to fetch liked podcasts:', await likedResponse.text());
        }

        // Fetch bookmarked podcasts
        const bookmarkedResponse = await fetch(`${API_BASE_URL}/library/bookmarked.php`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (bookmarkedResponse.ok) {
          const bookmarkedData = await bookmarkedResponse.json();
          console.log('Bookmarked podcasts response:', bookmarkedData);
          if (bookmarkedData && Array.isArray(bookmarkedData)) {
            setBookmarkedPodcasts(bookmarkedData);
          }
        } else {
          console.error('Failed to fetch bookmarked podcasts:', await bookmarkedResponse.text());
        }

        // Fetch recently played based on listening_history
        try {
          const recentlyPlayedResponse = await fetch(`${API_BASE_URL}/library/recently-played.php`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (recentlyPlayedResponse.ok) {
            const recentlyPlayedData = await recentlyPlayedResponse.json();
            if (recentlyPlayedData && Array.isArray(recentlyPlayedData)) {
              setRecentlyPlayed(recentlyPlayedData);
            }
          } else {
            console.log('Recently played API not available, using fallback');
            setRecentlyPlayed([]);
          }
        } catch (error) {
          console.log('Recently played API failed, using fallback:', error.message);
          setRecentlyPlayed([]);
        }

        // Fetch most played podcasts based on play_count
        try {
          const mostPlayedResponse = await fetch(`${API_BASE_URL}/library/most-played.php`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (mostPlayedResponse.ok) {
            const mostPlayedData = await mostPlayedResponse.json();
            if (mostPlayedData && Array.isArray(mostPlayedData)) {
              setMostPlayed(mostPlayedData);
            }
          } else {
            console.log('Most played API not available, using fallback');
            // Use top 10 podcasts sorted by play_count as fallback
            const fallbackMostPlayed = [...data]
              .filter(p => p.play_count && p.play_count > 0)
              .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
              .slice(0, 10);
            setMostPlayed(fallbackMostPlayed);
          }
        } catch (error) {
          console.log('Most played API failed, using fallback:', error.message);
          // Use top 10 podcasts as fallback
          const fallbackMostPlayed = [...data]
            .filter(p => p.play_count && p.play_count > 0)
            .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
            .slice(0, 10);
          setMostPlayed(fallbackMostPlayed);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Call fetch function
    fetchData();
  }, [API_BASE_URL]);

  // Handle podcast navigation - navigate to PodcastDetailUser component
  const handlePodcastClick = (podcast) => {
    // Track the view in backend (optional)
    try {
      fetch(`${API_BASE_URL}/library/view.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          podcast_id: podcast.id
        })
      }).catch(error => {
        console.log('View tracking failed:', error.message);
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
    
    // Navigate to the podcast detail page
    navigate(`/podcasts/${podcast.id}`);
  };

  // Handle playing podcast
  const handlePlayPodcast = (e, podcast) => {
    e.stopPropagation(); // Prevent navigation
    setCurrentPodcast(podcast);
    setIsPlaying(true);
    
    // Track play in backend
    fetch(`${API_BASE_URL}/library/play.php`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        podcast_id: podcast.id,
        progress: 0,
        duration: podcast.duration || 0
      })
    })
    .then(() => {
      // After tracking play, refresh recently played and most played
      Promise.all([
        fetch(`${API_BASE_URL}/library/recently-played.php`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${API_BASE_URL}/library/most-played.php`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        })
      ])
      .then(([recentlyPlayedRes, mostPlayedRes]) => {
        if (recentlyPlayedRes.ok) {
          recentlyPlayedRes.json().then(data => {
            if (data && Array.isArray(data)) {
              setRecentlyPlayed(data);
            }
          });
        }
        if (mostPlayedRes.ok) {
          mostPlayedRes.json().then(data => {
            if (data && Array.isArray(data)) {
              setMostPlayed(data);
            }
          });
        }
      });
    })
    .catch(error => {
      console.error('Error tracking play:', error);
    });
  };

  // Handle like podcast
  const handleLikePodcast = async (e, podcast) => {
    e.stopPropagation(); // Prevent navigation
    
    const isLiked = likedPodcasts.some(p => p.id === podcast.id);
    
    try {
      let response;
      
      if (isLiked) {
        // Unlike - use DELETE method
        response = await fetch(`${API_BASE_URL}/library/like.php?podcast_id=${podcast.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Like - use POST method
        response = await fetch(`${API_BASE_URL}/library/like.php`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            podcast_id: podcast.id
          })
        });
      }
      
      if (response.ok) {
        const result = await response.json();
        console.log('Like response:', result);
        
        // Update local state based on response
        if (isLiked) {
          setLikedPodcasts(prev => prev.filter(p => p.id !== podcast.id));
        } else {
          setLikedPodcasts(prev => [...prev, podcast]);
        }
        
        // Dispatch event for other components to update
        window.dispatchEvent(new CustomEvent('refreshLikedPodcasts'));
      } else {
        const errorData = await response.json();
        console.error('Like error response:', errorData);
        alert('Error: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error liking podcast:', error);
      alert('Network error occurred');
    }
  };

  // Handle bookmark podcast
  const handleBookmarkPodcast = async (e, podcast) => {
    e.stopPropagation(); // Prevent navigation
    
    const isBookmarked = bookmarkedPodcasts.some(p => p.id === podcast.id);
    
    try {
      let response;
      
      if (isBookmarked) {
        // Remove bookmark - use DELETE method
        response = await fetch(`${API_BASE_URL}/library/bookmark.php?podcast_id=${podcast.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Add bookmark - use POST method
        response = await fetch(`${API_BASE_URL}/library/bookmark.php`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            podcast_id: podcast.id
          })
        });
      }
      
      if (response.ok) {
        const result = await response.json();
        console.log('Bookmark response:', result);
        
        // Update local state based on response
        if (isBookmarked) {
          setBookmarkedPodcasts(prev => prev.filter(p => p.id !== podcast.id));
        } else {
          setBookmarkedPodcasts(prev => [...prev, podcast]);
        }
        
        // Dispatch event for other components to update
        window.dispatchEvent(new CustomEvent('refreshBookmarkedPodcasts'));
      } else {
        const errorData = await response.json();
        console.error('Bookmark error response:', errorData);
        alert('Error: ' + errorData.message);
      }
    } catch (error) {
      console.error('Error bookmarking podcast:', error);
      alert('Network error occurred');
    }
  };

  // Get image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x300?text=No+Image';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `http://localhost/Podcast/podcast-backend/uploads/${imageUrl}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Filter podcasts based on search and category
  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesSearch = !searchTerm || 
      podcast.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      podcast.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      podcast.author_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || podcast.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Podcast Card Component with like and bookmark buttons
  const PodcastCardApple = ({ podcast, index, featured = false }) => {
    const isLiked = likedPodcasts.some(p => p.id === podcast.id);
    const isBookmarked = bookmarkedPodcasts.some(p => p.id === podcast.id);
    
    return (
      <div 
        className="group cursor-pointer transition-transform hover:scale-105 flex-shrink-0 w-36 sm:w-auto"
        onClick={() => handlePodcastClick(podcast)}
      >
        <div className="relative mb-3">
          <img 
            src={getImageUrl(podcast.image_url)}
            alt={podcast.title} 
            className={`w-full object-cover ${featured ? 'rounded-lg' : 'rounded-lg shadow-sm'}`}
            style={{ aspectRatio: '1/1' }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
            }}
          />
          {podcast.explicit && (
            <div className="absolute top-2 right-2 bg-gray-800/80 rounded text-xs px-1 py-0.5 text-white">
              E
            </div>
          )}
        </div>
        
        <div>
          {index !== undefined && (
            <div className="flex items-start">
              <span className="text-2xl font-medium text-gray-400 mr-2 -mt-1 w-5">{index}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{podcast.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{podcast.author_name}</p>
              </div>
            </div>
          )}
          
          {index === undefined && (
            <>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{podcast.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{podcast.author_name}</p>
              
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(podcast.created_at || podcast.release_date)}
                </span>
                
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={(e) => handleLikePodcast(e, podcast)}
                    className={`p-1 rounded-full transition-colors ${
                      isLiked 
                        ? 'text-red-500 hover:text-red-600' 
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                    title={isLiked ? 'Unlike' : 'Like'}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button 
                    onClick={(e) => handleBookmarkPodcast(e, podcast)}
                    className={`p-1 rounded-full transition-colors ${
                      isBookmarked 
                        ? 'text-blue-500 hover:text-blue-600' 
                        : 'text-gray-400 hover:text-blue-500'
                    }`}
                    title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Featured Podcast Component
  const FeaturedPodcastCard = ({ podcast }) => {
    const isLiked = likedPodcasts.some(p => p.id === podcast.id);
    const isBookmarked = bookmarkedPodcasts.some(p => p.id === podcast.id);
    
    return (
      <div 
        className="group cursor-pointer bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
        onClick={() => handlePodcastClick(podcast)}
      >
        <div className="flex">
          <div className="w-24 h-24 flex-shrink-0 relative">
            <img 
              src={getImageUrl(podcast.image_url)}
              alt={podcast.title} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
              }}
            />
          </div>
          
          <div className="p-3 flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{podcast.title}</h3>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={(e) => handleLikePodcast(e, podcast)}
                  className={`p-1 rounded-full transition-colors ${
                    isLiked 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-gray-400 hover:text-red-500'
                  }`}
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                </button>
                
                <button 
                  onClick={(e) => handleBookmarkPodcast(e, podcast)}
                  className={`p-1 rounded-full transition-colors ${
                    isBookmarked 
                      ? 'text-blue-500 hover:text-blue-600' 
                      : 'text-gray-400 hover:text-blue-500'
                  }`}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{podcast.author_name}</p>
            
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                {capitalizeFirstLetter(podcast.category) || 'Podcast'}
              </span>
              
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(podcast.created_at || podcast.release_date)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Section Title Component with See All link
  const SectionTitle = ({ title, onSeeAll, mobileOnly = false }) => (
    <div className={`flex items-center justify-between mb-4 ${mobileOnly ? 'md:hidden' : ''}`}>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
      {onSeeAll && (
        <button 
          onClick={onSeeAll}
          className="text-purple-600 dark:text-purple-400 hover:underline flex items-center"
        >
          <span>See All</span>
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  // Horizontal Scrollable Section
  const HorizontalSection = ({ title, data, renderItem, onSeeAll, mobileOnly = false }) => {
    if (!data || data.length === 0) return null;
    
    return (
      <div className={`mb-8 ${mobileOnly ? 'md:hidden' : ''}`}>
        <SectionTitle title={title} onSeeAll={onSeeAll} mobileOnly={mobileOnly} />
        <div className="overflow-x-auto pb-4 md:overflow-visible hide-scrollbar scroll-smooth">
          <div className="flex space-x-4 md:grid md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
            {data.map((item, index) => renderItem(item, index))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 bg-gray-100 dark:bg-gray-800 hidden md:block">
        <div className="p-4 h-full overflow-y-auto hide-scrollbar">
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full py-2 bg-white dark:bg-gray-700 border-none rounded-full text-sm focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400"
              />
            </div>
          </div>
          
          <nav>
            <ul className="space-y-1">
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                    currentView === 'listen' 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentView('listen');
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                >
                  <Home className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                  Listen Now
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                    currentView === 'browse' 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentView('browse');
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                >
                  <ListMusic className="h-4 w-4 mr-3" />
                  Browse
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                    currentView === 'most-played' 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentView('most-played');
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                >
                  <BarChart3 className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                  Most Played
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                    currentView === 'liked' 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentView('liked');
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                >
                  <Heart className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                  Liked Songs
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                    currentView === 'bookmarked' 
                      ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentView('bookmarked');
                    setSearchTerm('');
                    setSelectedCategory('');
                  }}
                >
                  <Bookmark className="h-4 w-4 mr-3 text-gray-500 dark:text-gray-400" />
                  Bookmarked
                </a>
              </li>
            </ul>
          </nav>
          
          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Categories</h3>
            <ul className="space-y-0.5 overflow-y-auto hide-scrollbar pr-2">
              {categories.map((category) => (
                <li key={category}>
                  <a 
                    href="#" 
                    className={`flex items-center px-3 py-1 text-xs font-medium rounded-lg ${
                      selectedCategory === category 
                        ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCategory(selectedCategory === category ? '' : category);
                    }}
                  >
                    <Tag className="h-3 w-3 mr-2 text-gray-500 dark:text-gray-400" />
                    {capitalizeFirstLetter(category)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Single scrollable container for dashboard + footer */}
        <div className="h-full overflow-y-auto hide-scrollbar">
          {/* Main Content Area */}
          <div className="px-4 sm:px-6 py-6 sm:py-8">
            {/* Mobile Search Bar */}
            <div className="md:hidden mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search podcasts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400"
                />
              </div>
            </div>

            {/* Mobile Categories Horizontal Scroll */}
            <div className="md:hidden overflow-x-auto pb-4 mb-6 hide-scrollbar scroll-smooth">
              <div className="flex space-x-3">
                <button 
                  className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full ${
                    !selectedCategory 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setSelectedCategory('')}
                >
                  All
                </button>
                {categories.map(category => (
                  <button 
                    key={category}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full ${
                      selectedCategory === category 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {capitalizeFirstLetter(category)}
                  </button>
                ))}
              </div>
            </div>

            {(searchTerm || selectedCategory) ? (
              // Search/Filter Results
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {searchTerm ? `Results for "${searchTerm}"` : `Category: ${capitalizeFirstLetter(selectedCategory)}`}
                </h2>
                
                {filteredPodcasts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No podcasts found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your search</p>
                  </div>
                ) : (
                  <div className="pb-4 md:overflow-visible hide-scrollbar">
                    <div className="flex flex-wrap md:grid md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                      {filteredPodcasts.map((podcast) => (
                        <PodcastCardApple key={podcast.id} podcast={podcast} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Combined Mobile View (for mobile screens)
              <>
                {/* Desktop only view switcher based on currentView */}
                <div className="hidden md:block">
                  {currentView === 'listen' && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Listen Now</h2>
                      
                      <HorizontalSection 
                        title="Recently Played"
                        data={recentlyPlayed.slice(0, 5)}
                        renderItem={(podcast) => (
                          <PodcastCardApple key={podcast.id} podcast={podcast} />
                        )}
                      />
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latest Episodes</h3>
                        <div className="space-y-4">
                          {newReleases.slice(0, 5).map((podcast) => (
                            <FeaturedPodcastCard key={podcast.id} podcast={podcast} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentView === 'browse' && (
                    <>
                      <HorizontalSection 
                        title="Most Played"
                        data={mostPlayed.slice(0, 5)}
                        onSeeAll={() => setCurrentView('most-played')}
                        renderItem={(podcast, index) => (
                          <div key={podcast.id} className="relative">
                            <PodcastCardApple podcast={podcast} index={index + 1} />
                            <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                              {podcast.play_count || 0} plays
                            </div>
                          </div>
                        )}
                      />

                      <HorizontalSection 
                        title="Recently Played"
                        data={recentlyPlayed.slice(0, 5)}
                        onSeeAll={() => setCurrentView('recently-played')}
                        renderItem={(podcast) => (
                          <div key={podcast.id} className="relative">
                            <PodcastCardApple podcast={podcast} />
                            {podcast.last_listened_at && (
                              <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                {new Date(podcast.last_listened_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                      />

                      <HorizontalSection 
                        title="New Releases"
                        data={newReleases}
                        renderItem={(podcast) => (
                          <PodcastCardApple key={podcast.id} podcast={podcast} />
                        )}
                      />
                      
                      <div className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
                        </div>
                        
                        <div className="pb-4 md:overflow-visible hide-scrollbar">
                          <div className="flex space-x-3 md:grid md:grid-cols-2 md:grid-cols-3 md:grid-cols-4 md:gap-4">
                            {categories.map((category) => (
                              <div 
                                key={category}
                                className="flex-shrink-0 w-32 md:w-auto bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => setSelectedCategory(category)}
                              >
                                <div className="flex items-center justify-between">
                                  <h3 className="text-white text-sm font-medium">
                                    {capitalizeFirstLetter(category)}
                                  </h3>
                                  <Globe className="h-4 w-4 text-white/70" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {currentView === 'most-played' && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Most Played</h2>
                      
                      {mostPlayed.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No played podcasts yet</h3>
                          <p className="text-gray-500 dark:text-gray-400">Start listening to see your most played podcasts</p>
                        </div>
                      ) : (
                        <div className="pb-4 md:overflow-visible hide-scrollbar">
                          <div className="flex flex-wrap md:grid md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {mostPlayed.map((podcast, index) => (
                              <div key={podcast.id} className="relative">
                                <PodcastCardApple podcast={podcast} index={index + 1} />
                                <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                                  {podcast.play_count || 0} plays
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {currentView === 'recently-played' && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recently Played</h2>
                      
                      {recentlyPlayed.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BarChart3 className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No recently played podcasts</h3>
                          <p className="text-gray-500 dark:text-gray-400">Play a podcast to see it here</p>
                        </div>
                      ) : (
                        <div className="pb-4 md:overflow-visible hide-scrollbar">
                          <div className="flex flex-wrap md:grid md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {recentlyPlayed.map((podcast) => (
                              <div key={podcast.id} className="relative">
                                <PodcastCardApple podcast={podcast} />
                                {podcast.last_listened_at && (
                                  <div className="absolute top-1 right-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                                    {new Date(podcast.last_listened_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {currentView === 'liked' && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Liked Songs</h2>
                      
                      {likedPodcasts.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Heart className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No liked podcasts</h3>
                          <p className="text-gray-500 dark:text-gray-400">Like a podcast to add it to your collection</p>
                        </div>
                      ) : (
                        <div className="pb-4 md:overflow-visible hide-scrollbar">
                          <div className="flex flex-wrap md:grid md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {likedPodcasts.map((podcast) => (
                              <PodcastCardApple key={podcast.id} podcast={podcast} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {currentView === 'bookmarked' && (
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bookmarked</h2>
                      
                      {bookmarkedPodcasts.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bookmark className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bookmarked podcasts</h3>
                          <p className="text-gray-500 dark:text-gray-400">Bookmark a podcast to add it to your collection</p>
                        </div>
                      ) : (
                        <div className="pb-4 md:overflow-visible hide-scrollbar">
                          <div className="flex flex-wrap md:grid md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {bookmarkedPodcasts.map((podcast) => (
                              <PodcastCardApple key={podcast.id} podcast={podcast} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Combined Mobile View (Shows all sections on one page) */}
                <div className="md:hidden">
                  {/* Browse All Section - First section that shows all podcasts */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Browse All</h2>
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="text-purple-600 dark:text-purple-400 hover:underline flex items-center"
                      >
                        <span>See All</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="overflow-x-auto pb-4 md:overflow-visible hide-scrollbar scroll-smooth">
                      <div className="flex space-x-4 md:grid md:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:gap-6">
                        {podcasts.slice(0, 10).map((podcast) => (
                          <PodcastCardApple key={podcast.id} podcast={podcast} />
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* New Releases Section */}
                  <HorizontalSection 
                    title="New Releases"
                    data={newReleases.slice(0, 10)}
                    renderItem={(podcast) => (
                      <PodcastCardApple key={podcast.id} podcast={podcast} />
                    )}
                    mobileOnly={true}
                  />
                  
                  {/* Recently Played Section - moved to be third */}
                  <HorizontalSection 
                    title="Recently Played"
                    data={recentlyPlayed.slice(0, 5)}
                    renderItem={(podcast) => (
                      <PodcastCardApple key={podcast.id} podcast={podcast} />
                    )}
                    mobileOnly={true}
                  />
                  
                  {/* Most Played Section */}
                  <HorizontalSection 
                    title="Most Played"
                    data={mostPlayed.slice(0, 5)}
                    renderItem={(podcast, index) => (
                      <div key={podcast.id} className="relative">
                        <PodcastCardApple podcast={podcast} index={index + 1} />
                        <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                          {podcast.play_count || 0} plays
                        </div>
                      </div>
                    )}
                    mobileOnly={true}
                  />
                  
                  {/* Latest Episodes Section */}
                  <div className="mb-8 md:hidden">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Latest Episodes</h3>
                    <div className="space-y-4">
                      {newReleases.slice(0, 3).map((podcast) => (
                        <FeaturedPodcastCard key={podcast.id} podcast={podcast} />
                      ))}
                    </div>
                  </div>
                  
                  {/* Liked Podcasts Section */}
                  {likedPodcasts.length > 0 && (
                    <HorizontalSection 
                      title="Liked Podcasts"
                      data={likedPodcasts.slice(0, 5)}
                      renderItem={(podcast) => (
                        <PodcastCardApple key={podcast.id} podcast={podcast} />
                      )}
                      mobileOnly={true}
                    />
                  )}
                  
                  {/* Bookmarked Podcasts Section */}
                  {bookmarkedPodcasts.length > 0 && (
                    <HorizontalSection 
                      title="Bookmarked"
                      data={bookmarkedPodcasts.slice(0, 5)}
                      renderItem={(podcast) => (
                        <PodcastCardApple key={podcast.id} podcast={podcast} />
                      )}
                      mobileOnly={true}
                    />
                  )}
                  
                  {/* Categories Section */}
                  <div className="mt-8 mb-8 md:hidden">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Browse Categories</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.slice(0, 6).map((category) => (
                        <div 
                          key={category}
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-2 cursor-pointer hover:shadow-lg transition-shadow"
                          onClick={() => setSelectedCategory(category)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-white text-xs font-medium">
                              {capitalizeFirstLetter(category)}
                            </h3>
                            <Globe className="h-3.5 w-3.5 text-white/70" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* Footer - only render once at the bottom */}
          <Footer />
        </div>
      </div>

      {/* Mini Player */}
      {currentPodcast && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 h-16">
          <div className="flex items-center h-full px-4">
            <img 
              src={getImageUrl(currentPodcast.image_url)}
              alt={currentPodcast.title} 
              className="h-10 w-10 rounded-md object-cover mr-3"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
              }}
            />
            
            <div className="flex-1 min-w-0 mr-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {currentEpisode ? currentEpisode.title : currentPodcast.title}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentPodcast.author_name}
              </p>
            </div>
            
            <div className="flex items-center">
              <button 
                onClick={togglePlayPause}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 mr-3"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>
              
              <div className="relative mr-3 hidden sm:block">
                <button
                  onClick={toggleMute}
                  onMouseEnter={() => setShowVolumeSlider(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                
                {showVolumeSlider && (
                  <div
                    onMouseLeave={() => setShowVolumeSlider(false)}
                    className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700"
                  >
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none"
                      style={{
                        background: `linear-gradient(to right, #9333ea 0%, #9333ea ${isMuted ? 0 : volume}%, #e5e7eb ${isMuted ? 0 : volume}%, #e5e7eb 100%)`,
                      }}
                    />
                  </div>
                )}
              </div>
              
              <button
                onClick={handleClosePlayer}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Audio element */}
          <audio
            ref={audioRef}
            src={currentEpisode ? getImageUrl(currentEpisode.audio_url) : getImageUrl(currentPodcast.audio_url)}
            autoPlay={isPlaying}
            muted={isMuted}
            hidden
          />
        </div>
      )}
      
      <style jsx>{`
        /* Custom range slider styles */
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          margin-top: -5px;
        }
        
        input[type="range"]::-moz-range-thumb {
          height: 12px;
          width: 12px;
          border-radius: 50%;
          background: #9333ea;
          cursor: pointer;
          border: none;
        }
        
        /* Hide scrollbar but keep scrolling functionality */
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        
        .hide-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        
        /* Smooth scrolling */
        .scroll-smooth {
          scroll-behavior: smooth;
        }
        
        /* Global override to hide scrollbars */
        ::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        
        * {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
        
        html, body {
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
};

export default ApplePodcastsDashboard;