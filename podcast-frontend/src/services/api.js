import axios from 'axios';

// IMPORTANT: Update the API_URL to the correct backend path
const API_URL = 'http://localhost/Podcast/podcast-backend/api';

// Create axios instance with credentials support
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Ensures cookies are sent with requests
  // Add timeout configuration for large video uploads
  timeout: 300000 // 5 minute timeout for large video uploads
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response handler for more informative error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enhanced error logging, especially useful for upload issues
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      console.error('API Request Error (No Response):', error.request);
    } else {
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = (email, password) => api.post('/auth/login.php', { email, password });
export const register = (name, email, password, role) => api.post('/auth/register.php', { name, email, password, role });
export const logout = () => api.post('/auth/logout.php');

// Podcast endpoints
export const getPodcasts = () => api.get('/podcasts/get.php');

export const getPodcast = (id) => {
  // Add validation to prevent requests with undefined id
  if (!id || id === 'undefined') {
    console.error('Invalid podcast ID provided:', id);
    return Promise.reject(new Error('Valid podcast ID is required'));
  }
  return api.get(`/podcasts/get.php?id=${id}`);
};

export const createPodcast = (podcastData) => {
  // Create proper FormData for file upload
  const formData = new FormData();
  
  // Add text fields
  formData.append('title', podcastData.title || '');
  formData.append('description', podcastData.description || '');
  formData.append('category', podcastData.category || '');
  formData.append('addedBy', podcastData.addedBy || '');
  
  // Add image file (required)
  if (podcastData.image) {
    formData.append('image', podcastData.image);
  }
  
  return api.post('/podcasts/create.php', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true
  });
};

export const updatePodcast = (id, podcastData) => {
  // Create proper FormData for file upload
  const formData = new FormData();
  
  // Add text fields
  formData.append('title', podcastData.title || '');
  formData.append('description', podcastData.description || '');
  formData.append('category', podcastData.category || '');
  formData.append('addedBy', podcastData.addedBy || '');
  
  // Add image file if it exists (optional for updates)
  if (podcastData.image && podcastData.image instanceof File) {
    formData.append('image', podcastData.image);
  }
  
  return api.post(`/podcasts/update.php?id=${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true
  });
};

export const deletePodcast = (id) => api.delete(`/podcasts/delete.php?id=${id}`);

// Episode endpoints
export const getEpisodes = (podcastId) => {
  if (!podcastId) {
    return Promise.reject(new Error('Podcast ID is required'));
  }
  
  console.log(`API: Fetching episodes for podcast ID ${podcastId}`);
  
  return api.get(`/episodes/get.php?podcast_id=${podcastId}`)
    .then(response => {
      console.log('API: Raw response from server:', response);
      
      // Ensure we return data in a consistent format
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log('API: Found array in response.data.data');
        return { data: response.data.data, success: true };
      } 
      else if (response.data && response.data.success && response.data.data) {
        console.log('API: Found data object, converting to array');
        // If it's a single object, convert to array
        return { data: [response.data.data], success: true };
      }
      else if (Array.isArray(response.data)) {
        console.log('API: Response.data is directly an array');
        return { data: response.data, success: true };
      }
      else {
        console.log('API: Unknown data format, returning original response');
        return response;
      }
    })
    .catch(error => {
      console.error('API: Error fetching episodes:', error);
      // If the episodes table doesn't exist yet, return empty array
      if (error.response && error.response.status === 500) {
        console.warn('API: Episodes table may not exist yet - returning empty array');
        return { data: [], success: false };
      }
      throw error;
    });
};

export const getEpisode = (id) => {
  if (!id) {
    return Promise.reject(new Error('Episode ID is required'));
  }
  
  return api.get(`/episodes/get.php?id=${id}`);
};

export const createEpisode = (episodeData) => {
  // Log data for debugging
  console.log('Creating episode with data:', {
    podcast_id: episodeData.podcast_id,
    title: episodeData.title,
    episode_number: episodeData.episode_number,
    added_by: episodeData.added_by,
    audio: episodeData.audio ? `${episodeData.audio.name} (${(episodeData.audio.size / (1024 * 1024)).toFixed(2)}MB)` : 'No file',
    image: episodeData.image ? `${episodeData.image.name} (${(episodeData.image.size / (1024 * 1024)).toFixed(2)}MB)` : 'No image',
    video: episodeData.video ? `${episodeData.video.name} (${(episodeData.video.size / (1024 * 1024)).toFixed(2)}MB)` : 'No video'
  });
  
  // Create FormData object manually
  const formData = new FormData();
  
  // Add text fields
  formData.append('podcast_id', episodeData.podcast_id || '');
  formData.append('title', episodeData.title || '');
  formData.append('description', episodeData.description || '');
  formData.append('episode_number', episodeData.episode_number || '');
  formData.append('added_by', episodeData.added_by || 'hr');
  
  // Add audio file
  if (episodeData.audio) {
    formData.append('audio', episodeData.audio);
  }
  
  // Add image file
  if (episodeData.image) {
    formData.append('image', episodeData.image);
  }
  
  // Add video file (new)
  if (episodeData.video) {
    formData.append('video', episodeData.video);
  }
  
  // Use axios with special configuration for large uploads
  return api.post('/episodes/create.php', formData, {
    headers: { 
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true,
    // Add upload progress tracking for large files
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`Upload progress: ${percentCompleted}%`);
    }
  }).catch(error => {
    console.error('Episode creation error details:', error.response || error);
    throw error;
  });
};

export const updateEpisode = (id, episodeData) => {
  const formData = new FormData();
  
  formData.append('title', episodeData.title || '');
  formData.append('description', episodeData.description || '');
  formData.append('episode_number', episodeData.episode_number || '');
  formData.append('added_by', episodeData.added_by || 'hr');
  
  if (episodeData.audio && episodeData.audio instanceof File) {
    formData.append('audio', episodeData.audio);
  }
  
  // Add image file if provided
  if (episodeData.image && episodeData.image instanceof File) {
    formData.append('image', episodeData.image);
  }
  
  // Add video file if provided (new)
  if (episodeData.video && episodeData.video instanceof File) {
    formData.append('video', episodeData.video);
  }
  
  // If explicitly removing video
  if (episodeData.remove_video) {
    formData.append('remove_video', '1');
  }
  
  return api.post(`/episodes/update.php?id=${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
    // Add upload progress tracking for large files
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      console.log(`Upload progress: ${percentCompleted}%`);
    }
  });
};

export const deleteEpisode = (id) => api.delete(`/episodes/delete.php?id=${id}`);

/**
 * Increment play count for an episode
 * @param {number} episodeId - The ID of the episode being played
 * @returns {Promise} - API response
 */
export const incrementPlayCount = (episodeId) => {
  if (!episodeId) {
    return Promise.reject(new Error('Episode ID is required'));
  }
  
  return api.post('/episodes/increment_play.php', { episode_id: episodeId })
    .catch(error => {
      console.error('Error incrementing play count:', error);
      // Silently fail - don't interrupt the user experience if tracking fails
      return { success: false, error: error.message };
    });
};

/**
 * Update playback progress for an episode
 * @param {number} episodeId - The ID of the episode
 * @param {number} progress - Progress in seconds
 * @param {boolean} completed - Whether the episode has been completed
 * @returns {Promise} - API response
 */
export const updateEpisodeProgress = (episodeId, progress, completed = false) => {
  if (!episodeId) {
    return Promise.reject(new Error('Episode ID is required'));
  }
  
  return api.post('/episodes/update_progress.php', {
    episode_id: episodeId,
    progress: Math.round(progress), // Round to nearest second
    completed: completed
  }).catch(error => {
    console.error('Error updating episode progress:', error);
    // Silently fail - don't interrupt the user experience if tracking fails
    return { success: false, error: error.message };
  });
};

// Library endpoints - adding missing functionality for like/bookmark
/**
 * Like a podcast
 * @param {number} podcastId - The ID of the podcast to like
 * @returns {Promise} - API response
 */
export const likePodcast = (podcastId) => {
  if (!podcastId) {
    return Promise.reject(new Error('Podcast ID is required'));
  }
  
  return api.post('/library/like.php', { podcast_id: podcastId })
    .catch(error => {
      console.error('Error liking podcast:', error);
      throw error;
    });
};

/**
 * Unlike a podcast
 * @param {number} podcastId - The ID of the podcast to unlike
 * @returns {Promise} - API response
 */
export const unlikePodcast = (podcastId) => {
  if (!podcastId) {
    return Promise.reject(new Error('Podcast ID is required'));
  }
  
  return api.delete(`/library/like.php?podcast_id=${podcastId}`)
    .catch(error => {
      console.error('Error unliking podcast:', error);
      throw error;
    });
};

/**
 * Bookmark a podcast
 * @param {number} podcastId - The ID of the podcast to bookmark
 * @returns {Promise} - API response
 */
export const bookmarkPodcast = (podcastId) => {
  if (!podcastId) {
    return Promise.reject(new Error('Podcast ID is required'));
  }
  
  return api.post('/library/bookmark.php', { podcast_id: podcastId })
    .catch(error => {
      console.error('Error bookmarking podcast:', error);
      throw error;
    });
};

/**
 * Remove bookmark from a podcast
 * @param {number} podcastId - The ID of the podcast to remove bookmark
 * @returns {Promise} - API response
 */
export const removeBookmark = (podcastId) => {
  if (!podcastId) {
    return Promise.reject(new Error('Podcast ID is required'));
  }
  
  return api.delete(`/library/bookmark.php?podcast_id=${podcastId}`)
    .catch(error => {
      console.error('Error removing bookmark:', error);
      throw error;
    });
};

/**
 * Get podcast status (liked, bookmarked)
 * @param {number} podcastId - The ID of the podcast
 * @returns {Promise} - API response
 */
export const getPodcastStatus = (podcastId) => {
  if (!podcastId) {
    return Promise.reject(new Error('Podcast ID is required'));
  }
  
  return api.get(`/library/status.php?podcast_id=${podcastId}`)
    .catch(error => {
      console.error('Error getting podcast status:', error);
      // Return default status on error
      return { data: { liked: false, bookmarked: false } };
    });
};

/**
 * Validate a video file before upload
 * @param {File} file - The video file to validate
 * @returns {Object} - Validation result with valid flag and message
 */
export const validateVideoFile = (file) => {
  if (!file) return { valid: false, message: 'No file selected' };
  
  // Check file type
  const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      message: `Invalid file type: ${file.type}. Supported formats: ${validTypes.join(', ')}` 
    };
  }
  
  // Check file size
  const maxSize = 500 * 1024 * 1024; // 500MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `File too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size: 500MB` 
    };
  }
  
  return { valid: true };
};

// Utility functions for media URLs
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop';
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // Return full URL to the image
  return `${API_URL.replace('/api', '')}/uploads/${imageUrl}`;
};

export const getAudioUrl = (audioUrl) => {
  if (!audioUrl) return '';
  if (audioUrl.startsWith('http')) return audioUrl;
  
  // Extract filename from path
  const filename = audioUrl.split('/').pop() || audioUrl;
  
  // Return full URL to the audio file
  return `${API_URL.replace('/api', '')}/uploads/audio/${filename}`;
};

export const getVideoUrl = (videoUrl) => {
  if (!videoUrl) return '';
  if (videoUrl.startsWith('http')) return videoUrl;
  
  // Extract filename from path
  const filename = videoUrl.split('/').pop() || videoUrl;
  
  // Return full URL to the video file
  return `${API_URL.replace('/api', '')}/uploads/video/${filename}`;
};

export default api;