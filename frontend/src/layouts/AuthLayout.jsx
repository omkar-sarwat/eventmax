// EventMax Auth Layout
// Layout for login/register pages

import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <motion.div
              whileHover={{ rotate: 10 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
            >
              <span className="text-white text-2xl font-bold">E</span>
            </motion.div>
            <span className="text-2xl font-bold text-gray-900">
              Event<span className="text-primary">Max</span>
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </div>

      {/* Right Side - Hero Image */}
      <div className="hidden lg:flex lg:flex-1 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200)' 
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Discover Amazing Events
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-md">
              Join millions of people who discover and book tickets 
              to the best events, concerts, and shows.
            </p>
            
            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <p className="text-3xl font-bold">10K+</p>
                <p className="text-white/60">Events</p>
              </div>
              <div>
                <p className="text-3xl font-bold">5M+</p>
                <p className="text-white/60">Users</p>
              </div>
              <div>
                <p className="text-3xl font-bold">50+</p>
                <p className="text-white/60">Cities</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
