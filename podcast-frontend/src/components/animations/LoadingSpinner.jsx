import { motion } from 'framer-motion';

const LoadingSpinner = () => {
  return (
    <div className="flex justify-center items-center h-64">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 dark:border-t-purple-400 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-purple-600 dark:bg-purple-400 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;