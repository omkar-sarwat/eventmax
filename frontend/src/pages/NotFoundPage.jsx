// EventMax 404 Not Found Page

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';
import Button from '../components/atoms/Button';

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* Animated 404 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-[150px] font-bold leading-none bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            404
          </h1>
        </motion.div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Oops! Page not found
        </h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved. 
          Let's get you back on track!
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button
              variant="primary"
              leftIcon={<Home className="w-5 h-5" />}
            >
              Go to Homepage
            </Button>
          </Link>
          <Link to="/events">
            <Button
              variant="outline"
              leftIcon={<Search className="w-5 h-5" />}
            >
              Browse Events
            </Button>
          </Link>
        </div>

        {/* Back Link */}
        <button
          onClick={() => window.history.back()}
          className="mt-8 text-gray-500 hover:text-primary transition-colors flex items-center gap-2 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to previous page
        </button>

        {/* Decorative Elements */}
        <div className="mt-16 flex justify-center gap-2">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default NotFoundPage;
