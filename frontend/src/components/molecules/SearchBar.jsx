// EventMax Search Bar Component
// Main search input with suggestions

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MapPin, Calendar, Loader2, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import eventService from '../../services/eventService';

function SearchBar({ 
  placeholder = 'Search for events, artists, venues...',
  className,
  variant = 'default',
  onSearch,
}) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch real suggestions from API
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const result = await eventService.searchEvents({ query });
        const events = result.events || [];
        
        // Transform events to suggestion format
        const eventSuggestions = events.slice(0, 5).map(event => ({
          type: 'event',
          id: event.id,
          title: event.title,
          subtitle: event.venue || event.venueName || '',
          icon: Ticket
        }));
        
        setSuggestions(eventSuggestions);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query);
      } else {
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
      setIsFocused(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const variantStyles = {
    default: 'bg-white border border-gray-200',
    hero: 'bg-white/10 backdrop-blur-lg border border-white/20 text-white placeholder-white/60',
    minimal: 'bg-gray-100 border-transparent',
  };

  return (
    <div className={cn('relative w-full max-w-2xl', className)}>
      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            'relative flex items-center rounded-2xl transition-all duration-300',
            variantStyles[variant],
            isFocused && variant !== 'hero' && 'ring-2 ring-primary/50 border-primary'
          )}
        >
          <Search className={cn(
            'absolute left-4 w-5 h-5',
            variant === 'hero' ? 'text-white/60' : 'text-gray-400'
          )} />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            className={cn(
              'w-full py-4 pl-12 pr-12 bg-transparent rounded-2xl',
              'focus:outline-none font-medium',
              variant === 'hero' ? 'text-white placeholder-white/60' : 'text-gray-900'
            )}
          />
          
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'absolute right-4 p-1 rounded-full',
                variant === 'hero' 
                  ? 'text-white/60 hover:text-white hover:bg-white/10' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {loading && (
            <Loader2 className={cn(
              'absolute right-4 w-5 h-5 animate-spin',
              variant === 'hero' ? 'text-white/60' : 'text-gray-400'
            )} />
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id || index}
                onClick={() => {
                  if (suggestion.id) {
                    navigate(`/events/${suggestion.id}`);
                  } else {
                    navigate(`/search?q=${encodeURIComponent(query)}&type=${suggestion.type}`);
                  }
                  setIsFocused(false);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <suggestion.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-gray-900 font-medium">{suggestion.title}</span>
                  {suggestion.subtitle && (
                    <span className="text-sm text-gray-500">{suggestion.subtitle}</span>
                  )}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;
