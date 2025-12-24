// EventMax Loading Screen
// Full page loading state

import { motion } from 'framer-motion';
import Spinner from './Spinner';

function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative">
          {/* Animated rings */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-secondary/20"
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.3,
            }}
          />
          
          {/* Logo/Icon */}
          <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-white text-3xl font-bold">E</span>
          </div>
        </div>
        
        <motion.p
          className="mt-6 text-gray-600 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
        
        <div className="mt-4 flex justify-center">
          <Spinner size="md" />
        </div>
      </motion.div>
    </div>
  );
}

export default LoadingScreen;
