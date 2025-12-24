// EventMax Seat Selection Page
// Interactive seat map with real-time availability

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import Button from '../components/atoms/Button';
import Spinner from '../components/atoms/Spinner';
import SeatMap from '../components/organisms/SeatMap';
import CountdownTimer from '../components/molecules/CountdownTimer';
import eventService from '../services/eventService';
import { useBooking } from '../context/BookingContext';
import { formatDate, formatTime, formatPrice } from '../utils/formatters';
import { cn } from '../utils/cn';

function SeatSelectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    selectedSeats, 
    toggleSeat,
    clearSeats,
    selectEvent,
    timeRemaining,
    hasReservation
  } = useBooking();

  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventService.getEventById(id),
  });

  // Fetch seats
  const { data: seatsData, isLoading: seatsLoading, refetch: refetchSeats } = useQuery({
    queryKey: ['seats', id],
    queryFn: () => eventService.getSeats(id),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Clear selection on unmount
  useEffect(() => {
    // Set the current event in booking context
    if (event) {
      selectEvent(event);
    }
  }, [event, selectEvent]);

  const handleSeatClick = (seat) => {
    if (seat.status !== 'available') return;
    
    // Use toggleSeat from context
    toggleSeat(seat);
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) return;
    navigate(`/checkout`);
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);

  const isLoading = eventLoading || seatsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Spinner size="lg" className="text-white" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <Button onClick={() => navigate('/events')} variant="outline">
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-white line-clamp-1">
                  {event.title}
                </h1>
                <p className="text-sm text-gray-400">
                  {formatDate(event.date)} • {formatTime(event.time)}
                </p>
              </div>
            </div>

            {/* Timer (if reservation started) */}
            {hasReservation && typeof timeRemaining === 'number' && timeRemaining > 0 && (
              <CountdownTimer
                timeRemaining={timeRemaining}
                variant="compact"
                onExpiry={() => {
                  clearSeats();
                  navigate(`/events/${id}`);
                }}
              />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Seat Map */}
        <div className="flex-1 relative overflow-hidden">
          {/* Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <button
              onClick={() => setZoom(z => Math.min(z + 0.2, 2))}
              className="bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
              className="bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Legend Toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="absolute top-4 right-4 z-20 bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* Legend */}
          <AnimatePresence>
            {showLegend && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-16 right-4 z-20 bg-gray-800 rounded-lg p-4 min-w-[200px]"
              >
                <h3 className="text-white font-medium mb-3">Seat Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-green-500" />
                    <span className="text-gray-300 text-sm">Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-blue-500" />
                    <span className="text-gray-300 text-sm">Selected</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-gray-400" />
                    <span className="text-gray-300 text-sm">Sold</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-yellow-500" />
                    <span className="text-gray-300 text-sm">Reserved</span>
                  </div>
                </div>

                {/* Price Categories */}
                {seatsData?.priceCategories && (
                  <>
                    <h3 className="text-white font-medium mt-4 mb-3">Price Categories</h3>
                    <div className="space-y-2">
                      {seatsData.priceCategories.map((cat, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">{cat.name}</span>
                          <span className="text-white text-sm font-medium">
                            {formatPrice(cat.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Seat Map Component */}
          <div 
            className="w-full h-full overflow-auto p-8"
            style={{ minHeight: '60vh' }}
          >
            <SeatMap
              seats={seatsData?.seats || []}
              selectedSeats={selectedSeats}
              onSeatClick={handleSeatClick}
              zoom={zoom}
              eventId={id}
            />
          </div>
        </div>

        {/* Selection Summary (Sidebar on Desktop, Bottom Sheet on Mobile) */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            'bg-gray-800 border-t lg:border-t-0 lg:border-l border-gray-700',
            'w-full lg:w-80 p-6'
          )}
        >
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Selection
          </h2>

          {selectedSeats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No seats selected</p>
              <p className="text-sm text-gray-500 mt-2">
                Click on available seats to select
              </p>
            </div>
          ) : (
            <>
              {/* Selected Seats List */}
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {selectedSeats.map((seat) => (
                  <motion.div
                    key={seat.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                  >
                    <div>
                      <span className="text-white font-medium">
                        Row {seat.row_number || seat.row}, Seat {seat.seat_number || seat.number}
                      </span>
                      <span className="text-gray-400 text-sm ml-2">
                        {seat.category || 'Standard'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-white">
                        {formatPrice(seat.price || 0)}
                      </span>
                      <button
                        onClick={() => toggleSeat(seat)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-gray-700 pt-4 mb-4">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span>Tickets ({selectedSeats.length})</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-white font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Clear Selection */}
              <button
                onClick={clearSeats}
                className="text-sm text-red-400 hover:text-red-300 transition-colors mb-4 block"
              >
                Clear all seats
              </button>
            </>
          )}

          {/* Proceed Button */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={selectedSeats.length === 0}
            onClick={handleProceed}
          >
            Proceed to Checkout
          </Button>

          {/* Info */}
          <p className="text-xs text-gray-500 text-center mt-4">
            You can select up to 10 seats per booking
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default SeatSelectionPage;
