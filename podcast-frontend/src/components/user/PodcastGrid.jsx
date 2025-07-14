import { useState, useEffect } from 'react';
import PodcastCard from './PodcastCard';
import AudioPlayer from './AudioPlayer';
import { Search, Filter, Headphones } from 'lucide-react';

const PodcastGrid = ({ podcasts }) => {
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [episodes, setEpisodes] = useState({});
  const [loading, setLoading] = useState(false);

  // Fetch episodes for a podcast
  const fetchEpisodes = async (podcastId) => {
    // Don't re-fetch if we already have them
    if (episodes[podcastId] && episodes[podcastId].length > 0) {
      return episodes[podcastId];
    }
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost/Podcast/podcast-backend/api/episodes/get.php?podcast_id=${podcastId}`);
      let data = await response.json();
      
      // Handle different response formats
      let episodesData = [];
      if (data.success && Array.isArray(data.data)) {
        episodesData = data.data;
      } else if (Array.isArray(data)) {
        episodesData = data;
      }
      
      console.log(`Fetched ${episodesData.length} episodes for podcast ${podcastId}`);
      
      // Store episodes in state
      setEpisodes(prev => ({
        ...prev,
        [podcastId]: episodesData
      }));
      
      return episodesData;
    } catch (error) {
      console.error('Error fetching episodes:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Handle podcast selection and load its episodes
  const handleSelectPodcast = async (podcast) => {
    if (!podcast || !podcast.id) return;
    
    setSelectedPodcast(podcast);
    
    // Fetch episodes if needed
    const podcastEpisodes = await fetchEpisodes(podcast.id);
    
    // If podcast has episodes, select the first one to play
    if (podcastEpisodes && podcastEpisodes.length > 0) {
      setSelectedEpisode(podcastEpisodes[0]);
    } else {
      // No episodes, just play the podcast itself
      setSelectedEpisode(null);
    }
  };

  // Filter podcasts based on search and category
  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesSearch =
      podcast.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      podcast.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || podcast.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from podcasts
  const categories = [...new Set(podcasts.map(p => p.category).filter(Boolean))];

  // Handle closing the player
  const handleClosePlayer = () => {
    setSelectedPodcast(null);
    setSelectedEpisode(null);
  };

  // Handle playing next episode
  const handleNextEpisode = () => {
    if (!selectedPodcast || !selectedEpisode) return;
    
    const podcastEpisodes = episodes[selectedPodcast.id] || [];
    if (podcastEpisodes.length === 0) return;
    
    const currentIndex = podcastEpisodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex < podcastEpisodes.length - 1) {
      setSelectedEpisode(podcastEpisodes[currentIndex + 1]);
    }
  };

  // Handle playing previous episode
  const handlePrevEpisode = () => {
    if (!selectedPodcast || !selectedEpisode) return;
    
    const podcastEpisodes = episodes[selectedPodcast.id] || [];
    if (podcastEpisodes.length === 0) return;
    
    const currentIndex = podcastEpisodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex > 0) {
      setSelectedEpisode(podcastEpisodes[currentIndex - 1]);
    }
  };

  return (
    <div className="px-6 sm:px-8 lg:px-16">
      {/* Search & Filter */}
      <div className="mb-10 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for podcasts"
              className="pl-12 w-full py-3 text-base border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            />
          </div>

          <div className="relative w-full md:w-64">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-12 pr-4 py-3 text-base w-full border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-600 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* No podcasts state */}
      {filteredPodcasts.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-xl">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Headphones className="h-10 w-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {podcasts.length === 0 ? 'No podcasts available yet' : 'No matching podcasts found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {podcasts.length === 0 
                ? 'Check back later for new content!' 
                : 'Try adjusting your search or filter criteria.'}
            </p>
          </div>
        </div>
      )}

      {/* Podcast Cards */}
      {filteredPodcasts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
          {filteredPodcasts.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              onPlay={() => handleSelectPodcast(podcast)}
              isPlaying={selectedPodcast?.id === podcast.id}
            />
          ))}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-full px-4 py-2 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading episodes...</span>
          </div>
        </div>
      )}

      {/* Audio Player */}
      {selectedPodcast && (
        <AudioPlayer
          podcast={selectedPodcast}
          episode={selectedEpisode}
          onClose={handleClosePlayer}
          onNext={handleNextEpisode}
          onPrevious={handlePrevEpisode}
        />
      )}
    </div>
  );
};

export default PodcastGrid;