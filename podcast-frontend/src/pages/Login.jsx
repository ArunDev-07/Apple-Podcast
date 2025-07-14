import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import { motion } from 'framer-motion';
import { Headphones, Sparkles, Music, Mic, Radio } from 'lucide-react';

const Login = () => {
  const floatingIcons = [
    { Icon: Music, delay: 0, duration: 20, initialX: -100, initialY: 100 },
    { Icon: Mic, delay: 5, duration: 25, initialX: 100, initialY: -100 },
    { Icon: Radio, delay: 10, duration: 30, initialX: -150, initialY: -50 },
    { Icon: Headphones, delay: 15, duration: 22, initialX: 150, initialY: 50 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full filter blur-3xl opacity-20"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-0 right-0 w-96 h-96 bg-pink-400 rounded-full filter blur-3xl opacity-20"
        />

        {/* Floating Icons */}
        {floatingIcons.map(({ Icon, delay, duration, initialX, initialY }, index) => (
          <motion.div
            key={index}
            initial={{ x: initialX, y: initialY }}
            animate={{
              x: [initialX, -initialX, initialX],
              y: [initialY, -initialY, initialY],
              rotate: [0, 360],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            <Icon className="h-8 w-8 text-purple-300 dark:text-purple-700 opacity-20" />
          </motion.div>
        ))}
      </div>

      <div className="flex min-h-screen">
        {/* Left Side - Animated Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:w-1/2 items-center justify-center p-12"
        >
          <div className="max-w-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="inline-flex p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white mb-8"
            >
              <Headphones className="h-12 w-12" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold mb-6"
            >
              <span className="gradient-text-pro">Welcome Back!</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 dark:text-gray-400 mb-8"
            >
              Sign in to continue your podcast journey and discover amazing content.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-6"
            >
              {[
                { label: 'Podcasts', value: '50K+' },
                { label: 'Creators', value: '10K+' },
                { label: 'Listeners', value: '1M+' },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold gradient-text-pro">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <svg
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
                className="w-full h-20"
              >
                <motion.path
                  d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                  fill="url(#gradient)"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#9333EA" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 flex items-center justify-center p-8"
        >
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8 lg:hidden"
            >
              <div className="inline-flex p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white mb-4">
                <Headphones className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-bold gradient-text-pro">PodStream</h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center mb-8"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Sign in to your account
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Or{' '}
                  <Link
                    to="/register"
                    className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                  >
                    create a new account
                  </Link>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <LoginForm />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
