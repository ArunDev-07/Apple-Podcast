import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm';
import { motion } from 'framer-motion';
import { Rocket, Star, Zap, Trophy, Target, Gift } from 'lucide-react';

const Register = () => {
  const benefits = [
    { icon: <Star className="h-6 w-6" />, text: 'Access to exclusive content' },
    { icon: <Zap className="h-6 w-6" />, text: 'Personalized recommendations' },
    { icon: <Trophy className="h-6 w-6" />, text: 'Create unlimited playlists' },
    { icon: <Gift className="h-6 w-6" />, text: 'Early access to new features' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5" />
        
        {/* Animated Circles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              background: `radial-gradient(circle, ${
                ['#9333EA', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][i]
              }20 0%, transparent 70%)`,
              width: `${300 + i * 100}px`,
              height: `${300 + i * 100}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="flex min-h-screen">
        {/* Left Side - Form */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="flex-1 flex items-center justify-center p-8"
        >
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="inline-flex p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white mb-4"
              >
                <Rocket className="h-8 w-8" />
              </motion.div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="gradient-text-pro">Join PodStream</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Start your podcast journey today
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center mb-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Create your account
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-purple-600 hover:text-purple-500 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </motion.div>

              <RegisterForm />
            </motion.div>

            {/* Terms */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400"
            >
              By signing up, you agree to our{' '}
              <a href="#" className="text-purple-600 hover:text-purple-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-purple-600 hover:text-purple-500">
                Privacy Policy
              </a>
            </motion.p>
          </div>
        </motion.div>

        {/* Right Side - Benefits */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 bg-gradient-to-br from-purple-600 to-pink-600"
        >
          <div className="max-w-lg text-white">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl font-bold mb-8"
            >
              Start Creating Amazing Podcasts
            </motion.h2>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-6 mb-12"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ x: 10 }}
                  className="flex items-center gap-4"
                >
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    {benefit.icon}
                  </div>
                  <span className="text-lg">{benefit.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Animated Testimonial */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current text-yellow-400" />
                ))}
              </div>
              <p className="text-lg mb-4">
                "PodStream transformed how I share my stories. The platform is intuitive and the community is amazing!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full" />
                <div>
                  <div className="font-semibold">Sarah Johnson</div>
                  <div className="text-sm opacity-80">Top Podcaster</div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;