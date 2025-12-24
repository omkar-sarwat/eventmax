// EventMax Header Component
// Main navigation header

import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Search, User, Ticket, LogOut, 
  ChevronDown, Heart, Settings, Bell 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../atoms/Button';
import Avatar from '../atoms/Avatar';
import SearchBar from '../molecules/SearchBar';
import { cn } from '../../utils/cn';

function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Events', href: '/events' },
    { label: 'Concerts', href: '/events?category=concerts' },
    { label: 'Sports', href: '/events?category=sports' },
    { label: 'Theater', href: '/events?category=theater' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          isScrolled 
            ? 'bg-white/95 backdrop-blur-lg shadow-md' 
            : 'bg-transparent'
        )}
      >
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
              >
                <span className="text-white text-xl font-bold">E</span>
              </motion.div>
              <span className={cn(
                'text-xl font-bold hidden sm:block transition-colors',
                isScrolled ? 'text-gray-900' : 'text-gray-900'
              )}>
                Event<span className="text-primary">Max</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    location.pathname === link.href 
                      ? 'text-primary' 
                      : isScrolled ? 'text-gray-700' : 'text-gray-700'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              {/* Search Button (Desktop) */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSearchOpen(true)}
                className={cn(
                  'hidden md:flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                  isScrolled 
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                    : 'bg-white/10 text-gray-600 hover:bg-white/20'
                )}
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Search events...</span>
              </motion.button>

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Avatar 
                      name={user?.name || user?.email} 
                      src={user?.avatar}
                      size="sm" 
                    />
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform hidden sm:block',
                      isProfileOpen && 'rotate-180'
                    )} />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                      >
                        <div className="p-3 border-b border-gray-100">
                          <p className="font-medium text-gray-900">{user?.name}</p>
                          <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        
                        <div className="p-2">
                          <Link
                            to="/my-bookings"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Ticket className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">My Bookings</span>
                          </Link>
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Settings className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">Settings</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                          >
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Logout</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="hidden sm:flex"
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/register')}
                  >
                    Sign Up
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-t border-gray-100"
            >
              <div className="container-custom py-4 space-y-4">
                {/* Mobile Search */}
                <SearchBar variant="minimal" className="w-full" />
                
                {/* Mobile Nav Links */}
                <nav className="space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center pt-20"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <SearchBar 
                variant="default" 
                placeholder="Search for events, artists, venues..."
                onSearch={() => setIsSearchOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for profile menu */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsProfileOpen(false)} 
        />
      )}
    </>
  );
}

export default Header;
