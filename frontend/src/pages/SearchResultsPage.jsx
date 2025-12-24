// EventMax Search Results Page
// Display search results with filters

import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  X,
  SlidersHorizontal
} from 'lucide-react';
import EventGrid from '../components/organisms/EventGrid';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import eventService from '../services/eventService';
import { cn } from '../utils/cn';

function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category');
  const location = searchParams.get('location');
  const date = searchParams.get('date');
  const sortBy = searchParams.get('sortBy') || 'relevance';

  // Fetch search results
  const { data, isLoading } = useQuery({
    queryKey: ['search', { query, category, location, date, sortBy }],
    queryFn: () => eventService.searchEvents({ query, category, location, date, sortBy }),
    enabled: !!query || !!category || !!location,
  });

  // Popular searches for suggestions
  const popularSearches = [
    'Music Concerts',
    'Comedy Shows',
    'Theatre',
    'Sports Events',
    'Food Festivals',
    'Art Exhibitions'
  ];

  const handleRemoveFilter = (key) => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    setSearchParams(params);
  };

  const handleSortChange = (newSort) => {
    const params = new URLSearchParams(searchParams);
    params.set('sortBy', newSort);
    setSearchParams(params);
  };

  const hasFilters = category || location || date;
  const hasQuery = !!query;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, artists, venues..."
                defaultValue={query}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const params = new URLSearchParams(searchParams);
                    params.set('q', e.target.value);
                    setSearchParams(params);
                  }
                }}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
            <Button
              variant="outline"
              leftIcon={<SlidersHorizontal className="w-5 h-5" />}
            >
              Filters
            </Button>
          </div>

          {/* Active Filters */}
          {hasFilters && (
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
              <span className="text-sm text-gray-500">Filters:</span>
              {category && (
                <Badge variant="primary" className="capitalize">
                  {category}
                  <button
                    onClick={() => handleRemoveFilter('category')}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {location && (
                <Badge variant="info">
                  <MapPin className="w-3 h-3 mr-1" />
                  {location}
                  <button
                    onClick={() => handleRemoveFilter('location')}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {date && (
                <Badge variant="secondary">
                  <Calendar className="w-3 h-3 mr-1" />
                  {date}
                  <button
                    onClick={() => handleRemoveFilter('date')}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <button
                onClick={() => setSearchParams({ q: query })}
                className="text-sm text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container-custom py-8">
        {!hasQuery && !hasFilters ? (
          /* No Search Query - Show Suggestions */
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Search for events
            </h2>
            <p className="text-gray-500 mb-8">
              Find concerts, shows, sports events, and more
            </p>

            {/* Popular Searches */}
            <div>
              <p className="text-sm text-gray-500 mb-4">Popular searches</p>
              <div className="flex flex-wrap justify-center gap-2">
                {popularSearches.map((term) => (
                  <Link
                    key={term}
                    to={`/search?q=${encodeURIComponent(term)}`}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {hasQuery ? (
                    <>
                      Results for "{query}"
                    </>
                  ) : (
                    'Browse Events'
                  )}
                </h1>
                <p className="text-gray-500">
                  {isLoading ? 'Searching...' : `${data?.total || 0} events found`}
                </p>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="input py-2 px-3 text-sm w-auto"
              >
                <option value="relevance">Most Relevant</option>
                <option value="date">Date</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>

            {/* Results Grid */}
            {data?.events?.length > 0 ? (
              <>
                <EventGrid
                  events={data.events}
                  loading={isLoading}
                  columns={3}
                  skeletonCount={6}
                />

                {/* Load More */}
                {data.events.length < data.total && (
                  <div className="text-center mt-12">
                    <Button variant="outline">
                      Load More Results
                    </Button>
                  </div>
                )}
              </>
            ) : !isLoading ? (
              /* No Results */
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  No events found
                </h2>
                <p className="text-gray-500 mb-8 max-w-md mx-auto">
                  We couldn't find any events matching "{query}". 
                  Try adjusting your search or browse our categories.
                </p>
                <div className="flex justify-center gap-4">
                  <Link to="/events">
                    <Button variant="primary">
                      Browse All Events
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setSearchParams({})}
                  >
                    Clear Search
                  </Button>
                </div>

                {/* Suggestions */}
                <div className="mt-12">
                  <p className="text-sm text-gray-500 mb-4">Try searching for</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {popularSearches.slice(0, 4).map((term) => (
                      <Link
                        key={term}
                        to={`/search?q=${encodeURIComponent(term)}`}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                      >
                        {term}
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchResultsPage;
