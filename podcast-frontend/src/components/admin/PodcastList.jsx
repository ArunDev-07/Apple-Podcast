import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deletePodcast } from '../../services/api';
import { Edit, Trash2, Clock, Play, MoreHorizontal, Calendar, Headphones } from 'lucide-react';

const PodcastList = ({ podcasts, onEdit, onDelete }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    // Apple-style confirmation
    const confirmed = window.confirm('Remove this podcast?\n\nThis action cannot be undone.');
    if (confirmed) {
      setDeletingId(id);
      try {
        await deletePodcast(id);
        onDelete();
      } catch (error) {
        console.error('Error deleting podcast:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const navigateToPodcastDetail = (podcast) => {
    // Add validation to ensure podcast.id exists and is valid
    if (podcast && podcast.id) {
      navigate(`/admin/podcasts/${podcast.id}`);
    } else {
      console.error('Cannot navigate to podcast detail: Invalid podcast ID', podcast);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      technology: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      business: 'bg-green-500/10 text-green-600 dark:text-green-400',
      education: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      entertainment: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
      health: 'bg-red-500/10 text-red-600 dark:text-red-400',
      science: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      sports: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      other: 'bg-gray-500/10 text-gray-600 dark:text-gray-400'
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#D2D2D7] dark:border-[#38383A]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#1D1D1F] dark:text-white">
            Your Library
          </h2>
          <span className="text-sm text-[#86868B]">
            {podcasts.length} {podcasts.length === 1 ? 'episode' : 'episodes'}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#D2D2D7] dark:border-[#38383A]">
              <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wider hidden sm:table-cell">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wider hidden md:table-cell">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#86868B] uppercase tracking-wider hidden lg:table-cell">
                Added
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#86868B] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2F2F7] dark:divide-[#2C2C2E]">
            {podcasts.map((podcast) => (
              <tr 
                key={podcast.id} 
                className="hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-colors"
              >
                {/* Title Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div 
                      className="relative group cursor-pointer" 
                      onClick={() => navigateToPodcastDetail(podcast)}
                    >
                      <img
                        src={`http://localhost:8000/uploads/${podcast.image_url}`}
                        alt={podcast.title}
                        className="h-14 w-14 rounded-xl object-cover shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-6 w-6 text-white fill-white" />
                      </div>
                    </div>
                    <div 
                      className="ml-4 cursor-pointer" 
                      onClick={() => navigateToPodcastDetail(podcast)}
                    >
                      <div className="text-sm font-semibold text-[#1D1D1F] dark:text-white">
                        {podcast.title}
                      </div>
                      <div className="text-xs text-[#86868B] line-clamp-1 max-w-[280px] mt-0.5">
                        {podcast.description}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Category Column */}
                <td className="px-6 py-4 hidden sm:table-cell">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getCategoryColor(podcast.category)}`}>
                    {podcast.category || 'Uncategorized'}
                  </span>
                </td>

                {/* Duration Column */}
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex items-center text-sm text-[#1D1D1F] dark:text-white">
                    <Clock className="h-4 w-4 mr-1.5 text-[#86868B]" />
                    <span>{podcast.role || '0'} min</span>
                  </div>
                </td>

                {/* Date Column */}
                <td className="px-6 py-4 hidden lg:table-cell">
                  <div className="flex items-center text-sm text-[#86868B]">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span>{formatDate(podcast.created_at)}</span>
                  </div>
                </td>

                {/* Actions Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => onEdit(podcast)}
                      className="p-2 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4 text-[#007AFF]" />
                    </button>
                    <button
                      onClick={() => handleDelete(podcast.id)}
                      disabled={deletingId === podcast.id}
                      className="p-2 hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] rounded-lg transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {deletingId === podcast.id ? (
                        <div className="w-4 h-4 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="h-4 w-4 text-[#FF3B30]" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {podcasts.length === 0 && (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones className="h-8 w-8 text-[#86868B]" />
            </div>
            <p className="text-[#86868B] text-sm">
              No podcasts in your library yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer with count */}
      {podcasts.length > 0 && (
        <div className="px-6 py-3 border-t border-[#D2D2D7] dark:border-[#38383A] bg-[#F2F2F7]/50 dark:bg-[#2C2C2E]/50">
          <p className="text-xs text-[#86868B] text-center">
            Showing {podcasts.length} of {podcasts.length} podcasts
          </p>
        </div>
      )}
    </div>
  );
};

export default PodcastList;