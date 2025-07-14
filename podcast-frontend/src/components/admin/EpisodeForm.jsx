import { useState, useEffect } from 'react';
import { 
  X, 
  Music, 
  User, 
  Image, 
  Upload, 
  Video, 
  CheckCircle, 
  AlertTriangle, 
  Info 
} from 'lucide-react';
import { updateEpisode } from '../../services/api';

const EpisodeForm = ({ podcastId, episode, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    episode_number: '',
    added_by: 'hr' // Default to 'hr'
  });
  const [audioFile, setAudioFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mediaType, setMediaType] = useState('audio'); // Default to audio
  const [uploadProgress, setUploadProgress] = useState(0);

  // Added By options
  const addedByOptions = [
    { value: 'hr', label: 'HR' },
    { value: 'manager', label: 'Manager' },
    { value: 'employee', label: 'Employee' }
  ];

  useEffect(() => {
    if (episode) {
      setFormData({
        title: episode.title || '',
        description: episode.description || '',
        episode_number: episode.episode_number || '',
        added_by: episode.added_by || 'hr'
      });
      
      // Set image preview if episode has an image
      if (episode.image_url) {
        setImagePreview(episode.image_url);
      }
      
      // Set video preview if episode has a video
      if (episode.video_url) {
        setVideoPreview(episode.video_url);
        setMediaType('video');
      } else {
        setMediaType('audio');
      }
    }
  }, [episode]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit for images)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        setError(`Image file size exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB). Please select a smaller file.`);
        return;
      }
      
      setImageFile(file);
      setError(''); // Clear any previous errors
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (500MB limit for video based on the PHP backend)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (file.size > maxSize) {
        setError(`Video file size exceeds server limit of 500MB (your file: ${(file.size / (1024 * 1024)).toFixed(2)}MB). Please select a smaller file or compress your video.`);
        return;
      }
      
      // Set as video type
      setMediaType('video');
      
      // Remove audio file if exists
      if (audioFile) {
        setAudioFile(null);
      }
      
      setVideoFile(file);
      setError(''); // Clear any previous errors
      
      // Create video preview URL
      const videoURL = URL.createObjectURL(file);
      setVideoPreview(videoURL);
    }
  };

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (50MB limit for audio)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        setError(`Audio file size exceeds 50MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB). Please select a smaller file.`);
        return;
      }
      
      // Set as audio type
      setMediaType('audio');
      
      // Remove video file if exists
      if (videoFile) {
        setVideoFile(null);
        setVideoPreview(null);
      }
      
      setAudioFile(file);
      setError(''); // Clear any previous errors
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.getElementById('image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const removeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    // Reset the file input
    const fileInput = document.getElementById('video-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };
  
  const removeAudio = () => {
    setAudioFile(null);
    // Reset the file input
    const fileInput = document.getElementById('audio-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleToggleMediaType = () => {
    if (mediaType === 'audio') {
      // Switching from audio to video
      setMediaType('video');
      // Clear audio file if exists
      if (audioFile) {
        removeAudio();
      }
    } else {
      // Switching from video to audio
      setMediaType('audio');
      // Clear video file if exists
      if (videoFile) {
        removeVideo();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    setUploadProgress(0);
    
    // Validate required fields
    if (!formData.title || !formData.episode_number || !formData.added_by) {
      setError('Title, episode number, and added by are required');
      setSubmitting(false);
      return;
    }
    
    // Validate podcast ID
    if (!podcastId) {
      setError('Podcast ID is missing. Please try again.');
      console.error('Missing podcast ID in EpisodeForm', { providedId: podcastId });
      setSubmitting(false);
      return;
    }
    
    // For new episodes, validate media requirements
    if (!episode) {
      if (mediaType === 'audio' && !audioFile) {
        setError('Please select an audio file for the episode');
        setSubmitting(false);
        return;
      }
      
      if (mediaType === 'video' && !videoFile) {
        setError('Please select a video file for the episode');
        setSubmitting(false);
        return;
      }
    }
    
    // For existing episodes, don't require new audio/video files
    
    setLoading(true);

    try {
      // Get token from localStorage
      const getAuthToken = () => {
        return localStorage.getItem('token') || '';
      };
      
      // Prepare episode data - make sure we're not sending both audio and video
      const episodeData = new FormData();
      
      // Add text fields
      episodeData.append('podcast_id', podcastId);
      episodeData.append('title', formData.title);
      episodeData.append('description', formData.description || '');
      episodeData.append('episode_number', formData.episode_number);
      episodeData.append('added_by', formData.added_by);
      
      // Add image if exists
      if (imageFile) {
        episodeData.append('image', imageFile);
      }
      
      // Handle the media type difference
      if (mediaType === 'video') {
        // Creating a dummy audio file if we're uploading a video
        if (videoFile) {
          episodeData.append('video', videoFile);
          
          // Create a proper minimal MP3 file with valid headers
          // This creates a valid but silent MP3 file that will pass MIME type validation
          const mp3Data = new Uint8Array([
            // ID3v2 header
            0x49, 0x44, 0x33, 0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            // MP3 frame header (MPEG-1 Layer 3, 128kbps, 44.1kHz, stereo)
            0xFF, 0xFB, 0x90, 0x44,
            // Frame data (minimal valid MP3 frame with silence)
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            // Additional padding to ensure it's recognized as a valid MP3
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
          ]);
          
          // Create the audio file with the proper MIME type
          const dummyAudioBlob = new Blob([mp3Data], { type: 'audio/mpeg' });
          const dummyAudioFile = new File([dummyAudioBlob], 'dummy.mp3', { 
            type: 'audio/mpeg',
            lastModified: Date.now()
          });
          
          // Add the dummy audio file to satisfy the backend requirement
          episodeData.append('audio', dummyAudioFile);
          
          // Signal that this is actually a video episode
          episodeData.append('is_video_episode', '1');
        }
      } else {
        // Normal audio episode
        if (audioFile) {
          episodeData.append('audio', audioFile);
        }
      }
      
      // If updating an episode that had video, explicitly tell the server to remove it
      if (episode && episode.video_url && mediaType === 'audio') {
        episodeData.append('remove_video', '1');
      }
      
      // If there was an audio file previously and we're switching to video, tell the server
      if (episode && episode.audio_url && mediaType === 'video') {
        episodeData.append('is_video_episode', '1');
      }
      
      // Add media type indicator to the form
      episodeData.append('media_type', mediaType);
      
      // Log what we're sending to help with debugging
      console.log('Submitting episode data:', {
        podcast_id: podcastId,
        title: formData.title,
        description: formData.description,
        episode_number: formData.episode_number,
        added_by: formData.added_by,
        media_type: mediaType,
        is_video_episode: mediaType === 'video' ? '1' : '0',
        audio: audioFile ? `${audioFile.name} (${(audioFile.size / (1024 * 1024)).toFixed(2)}MB)` : (mediaType === 'video' ? 'Dummy audio file' : 'No audio file'),
        image: imageFile ? `${imageFile.name} (${(imageFile.size / (1024 * 1024)).toFixed(2)}MB)` : 'No image file',
        video: videoFile ? `${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(2)}MB)` : 'No video file'
      });
      
      // ACTUAL API CALL
      let result;
      if (episode) {
        // Update existing episode
        try {
          const updateHeaders = {
            'Authorization': `Bearer ${getAuthToken()}`
            // Let browser set the Content-Type header with boundary
          };
          
          // Define a custom function to track upload progress
          const onUploadProgress = (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            console.log(`Upload progress: ${percentCompleted}%`);
          };
          
          result = await updateEpisode(episode.id, episodeData, onUploadProgress);
        } catch (error) {
          console.error('Error updating episode:', error);
          throw error;
        }
      } else {
        // Create new episode - directly call API with fetch instead of axios
        const API_URL = 'http://localhost/Podcast/podcast-backend/api';
        const url = `${API_URL}/episodes/create.php`;
        
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getAuthToken()}`
              // Let browser set the Content-Type header with boundary
            },
            body: episodeData,
            credentials: 'include'
          });
          
          // Check if the response is JSON
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            result = await response.json();
          } else {
            const text = await response.text();
            if (!response.ok) {
              throw new Error(text);
            }
            result = { success: true, message: text };
          }
          
          if (!response.ok) {
            throw new Error(result.message || 'Error creating episode');
          }
        } catch (error) {
          console.error('Error creating episode:', error);
          throw error;
        }
      }
      
      console.log('Episode saved successfully:', result);
      setSuccess(true);
      setLoading(false);
      
      // Close the form after showing success animation
      setTimeout(() => {
        onClose();
        // Trigger parent to refresh episodes list if callback exists
        if (window.refreshEpisodes) {
          window.refreshEpisodes();
        }
      }, 1500);
      
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Enhanced error message
      let errorMessage = 'An error occurred while saving the episode.';
      
      if (error.response) {
        // Server returned an error response
        console.error('Error details:', error.response.data);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        
        // Handle specific error codes
        if (error.response.status === 400 && error.response.data?.message === "Podcast ID is required") {
          errorMessage = "Podcast ID is missing. Please make sure you're in the correct podcast.";
        } else if (error.response.data && typeof error.response.data === 'string' && error.response.data.includes('POST Content-Length')) {
          errorMessage = "Your file exceeds the server's upload limit. Please choose a smaller file or compress your video.";
        }
      } else if (error.request) {
        // No response from server
        errorMessage = 'No response from server. Please check your connection.';
      } else if (error.message) {
        // Something else went wrong
        errorMessage = error.message;
        
        // Check for file size limit error
        if (typeof error.message === 'string' && error.message.includes('POST Content-Length')) {
          errorMessage = "Your file exceeds the server's upload limit. Please choose a smaller file or compress your video.";
        }
        
        // Check for multipart/form-data error
        if (typeof error.message === 'string' && error.message.includes('Missing boundary in multipart/form-data')) {
          errorMessage = "There was an error with the form submission. Please try again.";
        }
        
        // Check for audio file required error
        if (typeof error.message === 'string' && error.message.includes('Audio file is required')) {
          errorMessage = mediaType === 'video' ? 
            "There was an error with the video upload. Please try again." : 
            "Audio file is required for this episode.";
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-white mb-3">
              Episode Saved!
            </h2>
            <p className="text-[#86868B] mb-6">
              Your episode has been successfully {episode ? 'updated' : 'created'}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden ${submitting ? 'animate-pulse' : ''}`}>
        {/* Header */}
        <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] px-8 py-6 border-b border-[#D2D2D7] dark:border-[#38383A]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#1D1D1F] dark:text-white tracking-tight">
                {episode ? 'Edit Episode' : 'New Episode'}
              </h2>
              <p className="text-sm text-[#86868B] mt-1">
                {episode ? 'Update episode details' : 'Add a new episode to your podcast'}
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
          {/* Media Type Toggle Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mb-6 overflow-hidden">
            <div className="flex items-center px-4 py-3 text-sm">
              <Info className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400 mr-3" />
              <div className="flex-1">
                <p className="font-medium text-blue-600 dark:text-blue-400">Media Type Selection</p>
                <p className="text-blue-600/80 dark:text-blue-400/80">Choose whether to upload an audio or video episode</p>
              </div>
              
              {/* Toggle Switch */}
              <div className="flex items-center ml-4">
                <button 
                  type="button"
                  onClick={handleToggleMediaType}
                  className={`relative w-16 h-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                    mediaType === 'video' ? 'bg-blue-600' : 'bg-purple-600'
                  }`}
                >
                  <span className="sr-only">Toggle media type</span>
                  <span 
                    className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-white transition-transform transform ${
                      mediaType === 'video' ? 'translate-x-8' : ''
                    }`}
                  />
                  <span className={`absolute inset-0 flex items-center justify-start pl-2 text-xs text-white font-medium transition-opacity ${
                    mediaType === 'audio' ? 'opacity-100' : 'opacity-0'
                  }`}>
                    🎵
                  </span>
                  <span className={`absolute inset-0 flex items-center justify-end pr-2 text-xs text-white font-medium transition-opacity ${
                    mediaType === 'video' ? 'opacity-100' : 'opacity-0'
                  }`}>
                    🎬
                  </span>
                </button>
              </div>
            </div>
            
            {/* Media Type Indicator */}
            <div className={`px-4 py-3 text-sm font-medium ${
              mediaType === 'audio' 
                ? 'bg-purple-600 text-white' 
                : 'bg-blue-600 text-white'
            }`}>
              <div className="flex items-center">
                {mediaType === 'audio' ? (
                  <>
                    <Music className="h-5 w-5 mr-2" />
                    <span>Audio Episode - Upload MP3, WAV, or M4A files (up to 50MB)</span>
                  </>
                ) : (
                  <>
                    <Video className="h-5 w-5 mr-2" />
                    <span>Video Episode - Upload MP4, MOV, or WEBM files (up to 500MB)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-3 animate-shake">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                Episode Title*
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#9F45F5] focus:border-transparent transition-all"
                placeholder="Enter episode title"
                required
              />
            </div>

            {/* Episode Number */}
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                Episode Number*
              </label>
              <input
                type="number"
                value={formData.episode_number}
                onChange={(e) => setFormData({ ...formData, episode_number: e.target.value })}
                className="w-full px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#9F45F5] focus:border-transparent transition-all"
                placeholder="Episode number (e.g. 1, 2, 3)"
                min="1"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-xl text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#9F45F5] focus:border-transparent transition-all resize-none"
                placeholder="Describe what this episode is about..."
              />
            </div>

            {/* Added By */}
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                Added By*
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#86868B]" />
                <select
                  value={formData.added_by}
                  onChange={(e) => setFormData({ ...formData, added_by: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-xl text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#9F45F5] focus:border-transparent transition-all appearance-none cursor-pointer"
                  required
                >
                  {addedByOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-[#86868B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-[#86868B] mt-2">
                Select who is adding this episode to the podcast
              </p>
            </div>

            {/* Episode Image Upload */}
            <div>
              <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                Episode Image
                <span className="text-xs text-[#86868B] ml-1">(Optional - will use podcast image if not provided)</span>
              </label>
              
              {imagePreview ? (
                <div className="relative">
                  <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-2xl p-4">
                    <div className="flex items-start gap-4">
                      <img 
                        src={imagePreview} 
                        alt="Episode preview" 
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#1D1D1F] dark:text-white mb-1">
                          {imageFile ? imageFile.name : 'Current episode image'}
                        </p>
                        <p className="text-xs text-[#86868B] mb-3">
                          {imageFile ? 'New image selected' : 'Existing image'}
                        </p>
                        <div className="flex gap-2">
                          <label 
                            htmlFor="image-upload"
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#9F45F5] hover:bg-[#8A2BE2] text-white text-xs font-medium rounded-lg cursor-pointer transition-all"
                          >
                            <Upload className="h-3 w-3" />
                            Change
                          </label>
                          <button
                            type="button"
                            onClick={removeImage}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                </div>
              ) : (
                <label 
                  htmlFor="image-upload" 
                  className="block cursor-pointer"
                >
                  <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border-2 border-dashed border-[#D2D2D7] dark:border-[#38383A] rounded-2xl p-6 hover:border-[#9F45F5] hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/50 transition-all text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <div className="p-3 bg-[#9F45F5]/10 rounded-full inline-flex mb-3">
                      <Image className="h-6 w-6 text-[#9F45F5]" />
                    </div>
                    <p className="text-sm font-medium text-[#1D1D1F] dark:text-white mb-1">
                      Episode Cover Image
                    </p>
                    <p className="text-xs text-[#86868B]">
                      Click to upload (JPG, PNG, GIF up to 5MB)
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Conditional Media Upload Section */}
            {mediaType === 'video' ? (
              <div>
                <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                  Video File{!episode ? '*' : ''}
                  <span className="text-xs text-[#86868B] ml-1">(Maximum file size: 500MB)</span>
                </label>
                
                {videoPreview ? (
                  <div className="relative">
                    <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-2xl p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-32 h-24 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                          <video 
                            src={videoPreview} 
                            className="max-w-full max-h-full"
                            controls
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1D1D1F] dark:text-white mb-1">
                            {videoFile ? videoFile.name : 'Current episode video'}
                          </p>
                          <p className="text-xs text-[#86868B] mb-3">
                            {videoFile ? (
                              <>
                                <span className={videoFile.size > 200 * 1024 * 1024 ? 'text-amber-500 font-medium' : ''}>
                                  {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                                {videoFile.size > 200 * 1024 * 1024 && (
                                  <span className="ml-2 text-amber-500">
                                    (Large file - upload may take longer)
                                  </span>
                                )}
                              </>
                            ) : (
                              'Existing video'
                            )}
                          </p>
                          <div className="flex gap-2">
                            <label 
                              htmlFor="video-upload"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#9F45F5] hover:bg-[#8A2BE2] text-white text-xs font-medium rounded-lg cursor-pointer transition-all"
                            >
                              <Upload className="h-3 w-3" />
                              Change
                            </label>
                            <button
                              type="button"
                              onClick={removeVideo}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoChange}
                      className="hidden"
                      id="video-upload"
                    />
                  </div>
                ) : (
                  <label 
                    htmlFor="video-upload" 
                    className="block cursor-pointer"
                  >
                    <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border-2 border-dashed border-[#D2D2D7] dark:border-[#38383A] rounded-2xl p-6 hover:border-[#9F45F5] hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/50 transition-all text-center">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="hidden"
                        id="video-upload"
                      />
                      <div className="p-3 bg-[#9F45F5]/10 rounded-full inline-flex mb-3">
                        <Video className="h-6 w-6 text-[#9F45F5]" />
                      </div>
                      <p className="text-sm font-medium text-[#1D1D1F] dark:text-white mb-1">
                        Episode Video
                      </p>
                      <p className="text-xs text-[#86868B]">
                        Click to upload (MP4, MOV, WEBM files up to 500MB)
                      </p>
                      {!episode && (
                        <p className="text-xs text-red-500 mt-1">Required for new video episodes</p>
                      )}
                    </div>
                  </label>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[#1D1D1F] dark:text-white mb-2">
                  Audio File{!episode ? '*' : ''}
                </label>
                
                {audioFile ? (
                  <div className="relative">
                    <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#D2D2D7] dark:border-[#38383A] rounded-2xl p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                          <Music className="h-10 w-10 text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#1D1D1F] dark:text-white mb-1">
                            {audioFile.name}
                          </p>
                          <p className="text-xs text-[#86868B] mb-3">
                            {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <div className="flex gap-2">
                            <label 
                              htmlFor="audio-upload"
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#9F45F5] hover:bg-[#8A2BE2] text-white text-xs font-medium rounded-lg cursor-pointer transition-all"
                            >
                              <Upload className="h-3 w-3" />
                              Change
                            </label>
                            <button
                              type="button"
                              onClick={removeAudio}
                              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-all"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label 
                    htmlFor="audio-upload" 
                    className="block cursor-pointer"
                  >
                    <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] border-2 border-dashed border-[#D2D2D7] dark:border-[#38383A] rounded-2xl p-6 hover:border-[#9F45F5] hover:bg-[#F2F2F7]/50 dark:hover:bg-[#2C2C2E]/50 transition-all text-center">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioChange}
                        className="hidden"
                        id="audio-upload"
                      />
                      <div className="p-3 bg-[#9F45F5]/10 rounded-full inline-flex mb-3">
                        <Music className="h-6 w-6 text-[#9F45F5]" />
                      </div>
                      <p className="text-sm font-medium text-[#1D1D1F] dark:text-white mb-1">
                        Audio File
                      </p>
                      <p className="text-xs text-[#86868B]">
                        Click to upload (MP3, WAV, M4A up to 50MB)
                      </p>
                      {!episode && (
                        <p className="text-xs text-red-500 mt-1">Required for new audio episodes</p>
                      )}
                    </div>
                  </label>
                )}
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="hidden"
                  id="audio-upload"
                />
              </div>
            )}

            {/* Upload Progress Bar (visible only when uploading) */}
            {loading && uploadProgress > 0 && (
              <div className="mt-4">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-[#D2D2D7] dark:border-[#38383A]">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-[#1D1D1F] dark:text-white bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-xl font-medium transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-[#9F45F5] hover:bg-[#8A2BE2] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center gap-2 relative overflow-hidden group"
              >
                <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-indigo-600 transform ${loading ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-1000 ease-in-out`}></div>
                <div className="relative flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{videoFile && videoFile.size > 100 * 1024 * 1024 ? 'Uploading large file...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{episode ? 'Update' : 'Create'} Episode</span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpisodeForm;