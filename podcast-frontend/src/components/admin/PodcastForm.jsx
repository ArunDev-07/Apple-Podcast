import { useState, useEffect } from 'react';
import { createPodcast, updatePodcast } from '../../services/api';
import { X, Image, Folder, UserCheck } from 'lucide-react';

const PodcastForm = ({ podcast, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    addedBy: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (podcast) {
      setFormData({
        title: podcast.title,
        description: podcast.description,
        category: podcast.category || '',
        addedBy: podcast.addedBy || ''
      });
    }
  }, [podcast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields
    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }
    
    // For new podcasts, require image file
    if (!podcast && !imageFile) {
      setError('Please select a cover image');
      return;
    }
    
    setLoading(true);

    const podcastData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      addedBy: formData.addedBy,
      image: imageFile
    };

    try {
      if (podcast) {
        await updatePodcast(podcast.id, podcastData);
      } else {
        await createPodcast(podcastData);
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
      setError(error.response?.data?.message || 'An error occurred while saving the podcast');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'technology', label: 'Technology', },
    { value: 'business', label: 'Business',  },
    { value: 'education', label: 'Education', },
    { value: 'entertainment', label: 'Entertainment', },
    { value: 'health', label: 'Health & Fitness', },
    { value: 'science', label: 'Science',  },
    { value: 'sports', label: 'Sports', },
    { value: 'other', label: 'Other', }
  ];

  const roles = [
    { value: 'hr', label: 'HR', },
    { value: 'employee', label: 'Employee', },
    { value: 'manager', label: 'Manager',  }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-8 py-6 border-b border-[#D2D2D7] dark:border-[#38383A]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
                {podcast ? 'Edit Podcast' : 'New Podcast'}
              </h2>
              <p className="text-sm text-[#86868B] mt-1">
                {podcast ? 'Update your podcast details' : 'Create a new podcast folder'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-[#86868B]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                Podcast Title*
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#9F45F5] focus:border-transparent transition-all"
                placeholder="Enter a compelling title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                Description*
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#9F45F5] focus:border-transparent transition-all resize-none"
                placeholder="Describe what your podcast is about..."
                required
              />
            </div>

            {/* Category + Added By Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                  Category*
                </label>
                <div className="relative">
                  <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#86868B]" />
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-xl text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9F45F5] focus:border-transparent transition-all appearance-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Added By */}
              <div>
                <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                  Added By*
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#86868B]" />
                  <select
                    value={formData.addedBy}
                    onChange={(e) => setFormData({ ...formData, addedBy: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-xl text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9F45F5] focus:border-transparent transition-all appearance-none"
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.icon} {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                Cover Image*
              </label>
              <label 
                htmlFor="image-upload" 
                className="block cursor-pointer"
              >
                <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border-2 border-dashed border-[#D2D2D7] dark:border-[#38383A] rounded-2xl p-6 hover:border-[#9F45F5] hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/50 transition-all text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="image-upload"
                  />
                  <div className="p-3 bg-blue-500/10 rounded-full inline-flex mb-3">
                    <Image className="h-6 w-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-[#1D1D1F] dark:text-white mb-1">
                    {imageFile ? imageFile.name : 'Cover Image'}
                  </p>
                  <p className="text-xs text-[#86868B]">
                    {imageFile ? 'Click to change' : 'Click to upload'}
                  </p>
                  {!podcast && !imageFile && (
                    <p className="text-xs text-red-500 mt-1">Required</p>
                  )}
                </div>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-[#D2D2D7] dark:border-[#38383A]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-[#1D1D1F] dark:text-white bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-xl font-medium transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#9F45F5] hover:bg-[#8A2BE2] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{podcast ? 'Update' : 'Create'} Podcast</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PodcastForm;