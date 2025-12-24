// EventMax Home Page
// Main landing page with hero and featured events

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Calendar, MapPin, Star } from 'lucide-react';
import SearchBar from '../components/molecules/SearchBar';
import EventGrid from '../components/organisms/EventGrid';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import eventService from '../services/eventService';

function HomePage() {
  // Fetch featured events
  const { data: featuredEvents, isLoading: loadingFeatured } = useQuery({
    queryKey: ['events', 'featured'],
    queryFn: () => eventService.getFeaturedEvents(),
  });

  // Fetch all events
  const { data: eventsData, isLoading: loadingEvents } = useQuery({
    queryKey: ['events'],
    queryFn: () => eventService.getEvents({ limit: 6 }),
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => eventService.getCategories(),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => eventService.getStats(),
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: 'url(https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920)' 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
        </div>

        {/* Animated shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-20 right-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -100, 0],
              y: [0, 100, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
          />
        </div>

        {/* Content */}
        <div className="container-custom relative z-10 py-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge variant="trending" className="mb-6" icon={<Sparkles className="w-3 h-3" />}>
                Over {stats?.totalEvents || '1000'}+ Events Live
              </Badge>

              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                Experience
                <span className="block gradient-text">Unforgettable</span>
                Moments
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-xl">
                Discover and book tickets to the best concerts, sports events, 
                theater shows, and more in your city.
              </p>

              {/* Search Bar */}
              <SearchBar 
                variant="hero" 
                placeholder="Search for events, artists, venues..."
                className="mb-8"
              />

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{stats?.totalEvents || 0} Events</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{stats?.totalVenues || 0} Venues</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  <span>{stats?.totalUsers || 0}+ Happy Customers</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Browse by Category
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Find events that match your interests
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories?.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/events?category=${category.name.toLowerCase()}`}
                  className="group block p-6 bg-gray-50 rounded-2xl hover:bg-primary hover:shadow-lg transition-all duration-300"
                >
                  <span className="text-4xl block mb-3">{category.icon}</span>
                  <h3 className="font-semibold text-gray-900 group-hover:text-white transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500 group-hover:text-white/70 transition-colors">
                    {category.count || 0} events
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-primary font-semibold">Trending Now</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Featured Events
              </h2>
            </div>
            <Link to="/events">
              <Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </div>

          <EventGrid 
            events={featuredEvents || []} 
            loading={loadingFeatured}
            columns={3}
          />
        </div>
      </section>

      {/* All Events Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Upcoming Events
            </h2>
            <Link to="/events">
              <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
                See More
              </Button>
            </Link>
          </div>

          <EventGrid 
            events={eventsData?.events || []} 
            loading={loadingEvents}
            columns={3}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-secondary">
        <div className="container-custom text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Never Miss an Event
            </h2>
            <p className="text-white/80 mb-8 max-w-2xl mx-auto">
              Create an account to save your favorite events, get personalized 
              recommendations, and receive exclusive offers.
            </p>
            <Link to="/register">
              <Button variant="dark" size="lg">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
