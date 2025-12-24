// EventMax Events Page
// Browse all events with filters

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Filter, Grid, List, SlidersHorizontal, X } from 'lucide-react';
import SearchBar from '../components/molecules/SearchBar';
import EventGrid from '../components/organisms/EventGrid';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import eventService from '../services/eventService';
import { cn } from '../utils/cn';

function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'date';

  // Fetch events
  const { data, isLoading } = useQuery({
    queryKey: ['events', { category, search, sortBy }],
    queryFn: () => eventService.getEvents({ category, search, sortBy }),
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => eventService.getCategories(),
  });

  const handleCategoryChange = (cat) => {
    const params = new URLSearchParams(searchParams);
    if (cat) {
      params.set('category', cat);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSortChange = (sort) => {
    const params = new URLSearchParams(searchParams);
    params.set('sortBy', sort);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = category || search;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <SearchBar 
              variant="minimal" 
              className="w-full md:w-96"
              placeholder="Search events..."
            />
            
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Filter Toggle (Mobile) */}
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                Filters
              </Button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="input py-2 px-3 text-sm w-auto"
              >
                <option value="date">Date</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="popularity">Popularity</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 transition-colors',
                    viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => handleCategoryChange(null)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                !category 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All Events
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.name.toLowerCase())}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  category === cat.name.toLowerCase()
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-center gap-2 mt-4"
            >
              <span className="text-sm text-gray-500">Active filters:</span>
              {category && (
                <Badge variant="primary" className="capitalize">
                  {category}
                  <button 
                    onClick={() => handleCategoryChange(null)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {search && (
                <Badge variant="info">
                  Search: {search}
                </Badge>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:underline ml-2"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container-custom py-8">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {isLoading ? 'Loading...' : `${data?.total || 0} events found`}
          </p>
        </div>

        {/* Events Grid */}
        <EventGrid 
          events={data?.events || []} 
          loading={isLoading}
          columns={viewMode === 'grid' ? 3 : 1}
          skeletonCount={6}
        />

        {/* Load More */}
        {data?.events?.length > 0 && data.events.length < data.total && (
          <div className="text-center mt-12">
            <Button variant="outline">
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventsPage;
