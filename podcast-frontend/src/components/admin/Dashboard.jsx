import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPodcasts, deletePodcast } from '../../services/api';
import PodcastForm from './PodcastForm';
import { Plus, Mic, Folder, Music, CalendarDays, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      const response = await getPodcasts();
      setPodcasts(response.data);
    } catch (error) {
      console.error('Error fetching podcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (podcast, e) => {
    e.stopPropagation(); // Prevent navigation when editing
    setEditingPodcast(podcast);
    setShowForm(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent navigation when deleting
    // Apple-style confirmation
    const confirmed = window.confirm('Remove this podcast?\n\nThis action cannot be undone.');
    if (confirmed) {
      try {
        await deletePodcast(id);
        fetchPodcasts();
      } catch (error) {
        console.error('Error deleting podcast:', error);
      }
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPodcast(null);
    fetchPodcasts();
  };

  const navigateToPodcast = (podcast) => {
    if (podcast && podcast.id) {
      navigate(`/admin/podcasts/${podcast.id}`);
    } else {
      console.error('Cannot navigate: Invalid podcast ID', podcast);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Helper function to format the "Added By" field
  const formatAddedBy = (addedBy) => {
    const roleMap = {
      'hr': 'HR',
      'manager': 'Manager',
      'employee': 'Employee'
    };
    return roleMap[addedBy] || 'Unknown';
  };

  // Helper function to get role color
  const getRoleColor = (addedBy) => {
    const colorMap = {
      'hr': 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      'manager': 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
      'employee': 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30'
    };
    return colorMap[addedBy] || 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
  };

  const totalEpisodes = podcasts.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-800 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#9F45F5] rounded-full animate-spin absolute top-0 left-0 border-t-transparent"></div>
          </div>
          <p className="mt-4 text-gray-500 dark:text-gray-400 font-medium">Loading your podcasts...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-[#F2F2F7] dark:bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
            Podcast Library
          </h1>
          <p className="mt-2 text-lg text-[#86868B]">
            Create podcast folders and add episodes to each
          </p>
        </motion.div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <motion.div
            className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center">
              <div className="p-3 bg-[#9F45F5]/10 rounded-xl">
                <Folder className="h-6 w-6 text-[#9F45F5]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#86868B]">TOTAL PODCASTS</p>
                <p className="text-2xl font-semibold text-[#1D1D1F] dark:text-white">{totalEpisodes}</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Music className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#86868B]">LATEST UPDATE</p>
                <p className="text-2xl font-semibold text-[#1D1D1F] dark:text-white">
                  {podcasts.length > 0 ? formatDate(podcasts[0].created_at) : 'None'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-white">
            Podcast Folders
          </h2>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[#9F45F5] hover:bg-[#8A2BE2] text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span>New Podcast</span>
          </button>
        </div>

        {/* Podcast Folders Grid */}
        {podcasts.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: {
                transition: { staggerChildren: 0.1 }
              }
            }}
          >
            {podcasts.map((podcast) => (
              <motion.div
                key={podcast.id}
                className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigateToPodcast(podcast)}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -5 }}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={`http://localhost/Podcast/podcast-backend/uploads/${podcast.image_url}`}
                    alt={podcast.title}
                    className="w-full h-full object-cover transition-transform bg-gray-100 dark:bg-gray-800"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-4">
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center">
                          <Folder className="h-4 w-4 text-white/80 mr-1.5" />
                          <span className="text-xs text-white/80 font-medium uppercase">
                            {podcast.category || 'Uncategorized'}
                          </span>
                        </div>
                        {/* Added By Badge */}
                        {podcast.added_by && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 text-white/80 mr-1" />
                            <span className="text-xs text-white/80 font-medium px-2 py-1 bg-white/20 rounded-full">
                              {formatAddedBy(podcast.added_by)}
                            </span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white line-clamp-1">
                        {podcast.title}
                      </h3>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <p className="text-sm text-[#86868B] line-clamp-2 mb-3 h-10">
                    {podcast.description}
                  </p>
                  
                  {/* Added By Info */}
                  {podcast.added_by && (
                    <div className="flex items-center mb-3">
                      <User className="h-4 w-4 text-[#86868B] mr-2" />
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRoleColor(podcast.added_by)}`}>
                        Added by {formatAddedBy(podcast.added_by)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-[#86868B]">
                      <CalendarDays className="h-3.5 w-3.5 mr-1" />
                      <span>{formatDate(podcast.created_at)}</span>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button 
                        onClick={(e) => handleEdit(podcast, e)}
                        className="p-1.5 rounded-lg bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] transition-colors"
                        title="Edit podcast"
                      >
                        <svg className="h-3.5 w-3.5 text-[#007AFF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => handleDelete(podcast.id, e)}
                        className="p-1.5 rounded-lg bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] transition-colors"
                        title="Delete podcast"
                      >
                        <svg className="h-3.5 w-3.5 text-[#FF3B30]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Add New Podcast Folder Card */}
            <motion.div
              className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-[#D2D2D7] dark:border-[#38383A] flex flex-col items-center justify-center h-[380px]"
              onClick={() => setShowForm(true)}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              whileHover={{ y: -5, borderColor: '#9F45F5' }}
            >
              <div className="p-4 bg-[#9F45F5]/10 rounded-full">
                <Plus className="h-10 w-10 text-[#9F45F5]" />
              </div>
              <h3 className="mt-4 font-semibold text-[#1D1D1F] dark:text-white">Create New Podcast</h3>
              <p className="text-sm text-[#86868B] mt-2">Add a new podcast folder</p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="max-w-sm mx-auto">
              <div className="w-20 h-20 bg-[#9F45F5] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="h-10 w-10 text-[#9F45F5]" />
              </div>
              <h3 className="text-xl font-semibold text-[#1D1D1F] dark:text-white mb-2">
                No podcast folders yet
              </h3>
              <p className="text-[#86868B] mb-6">
                Create your first podcast folder to start organizing your episodes.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#9F45F5] hover:bg-[#8A2BE2] text-white rounded-xl font-medium transition-all duration-200"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Podcast</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Podcast Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <PodcastForm podcast={editingPodcast} onClose={handleCloseForm} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Dashboard;