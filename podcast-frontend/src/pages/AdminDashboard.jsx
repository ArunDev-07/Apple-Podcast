import { Routes, Route } from 'react-router-dom';
import Dashboard from '../components/admin/Dashboard';
import PodcastDetail from '../components/admin/PodcastDetail';

const AdminDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-10">
          Admin Dashboard
        </h1>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/podcasts/:id" element={<PodcastDetail />} />
          {/* Add other admin routes here as needed */}
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;