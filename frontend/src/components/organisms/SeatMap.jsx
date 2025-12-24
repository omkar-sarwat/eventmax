// EventMax Seat Map Component
// Interactive venue seating layout

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import SeatButton from '../molecules/SeatButton';
import { cn } from '../../utils/cn';
import { formatPrice } from '../../utils/formatters';

function SeatMap({
  sections = [],
  seats = [],
  selectedSeats = [],
  onSeatClick,
  loading = false,
  zoom = 1,
  eventId,
  className,
}) {
  const [localZoom, setZoom] = useState(zoom);
  const [activeSection, setActiveSection] = useState(null);

  // Use provided sections, or group flat seats into sections
  const effectiveSections = useMemo(() => {
    if (sections && sections.length > 0) {
      return sections;
    }
    
    // Group flat seats array by section
    if (seats && seats.length > 0) {
      const sectionMap = {};
      seats.forEach(seat => {
        const sectionName = seat.section || 'General';
        if (!sectionMap[sectionName]) {
          sectionMap[sectionName] = {
            name: sectionName,
            seats: [],
            price: seat.price || 0,
          };
        }
        sectionMap[sectionName].seats.push(seat);
        // Update section price to min price
        if (seat.price && seat.price < sectionMap[sectionName].price) {
          sectionMap[sectionName].price = seat.price;
        }
      });
      return Object.values(sectionMap);
    }
    
    return [];
  }, [sections, seats]);

  // Group seats by row within each section
  const sectionData = useMemo(() => {
    return effectiveSections.map(section => {
      const seatsByRow = {};
      section.seats.forEach(seat => {
        const row = seat.row || seat.rowLabel || seat.row_identifier || 'A';
        if (!seatsByRow[row]) {
          seatsByRow[row] = [];
        }
        seatsByRow[row].push(seat);
      });
      
      // Sort rows
      const sortedRows = Object.keys(seatsByRow).sort();
      
      return {
        ...section,
        rows: sortedRows.map(row => ({
          label: row,
          seats: seatsByRow[row].sort((a, b) => (a.number || a.seatNumber || 0) - (b.number || b.seatNumber || 0)),
        })),
      };
    });
  }, [effectiveSections]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const isSeatSelected = (seatId) => {
    return selectedSeats.some(s => s.id === seatId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Loading seat map...</p>
        </div>
      </div>
    );
  }

  if (effectiveSections.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-2xl">
        <div className="text-center">
          <Info className="w-12 h-12 text-gray-400 mx-auto" />
          <p className="mt-4 text-gray-500">No seats available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <SeatButton.Legend />
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            disabled={localZoom <= 0.5}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500 w-16 text-center">
            {Math.round(localZoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={localZoom >= 2}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stage Indicator */}
      <div className="relative">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-gradient-to-b from-gray-800 to-gray-700 text-white text-center py-3 rounded-t-3xl">
            <span className="text-sm font-medium tracking-wider">STAGE</span>
          </div>
          <div className="h-2 bg-gradient-to-b from-gray-600 to-gray-400 rounded-b-lg" />
        </div>
      </div>

      {/* Seat Map Container */}
      <div className="overflow-auto pb-4">
        <motion.div
          style={{ scale: localZoom }}
          className="origin-top min-w-max"
        >
          <div className="space-y-8">
            {sectionData.map((section) => (
              <div key={section.name} className="space-y-4">
                {/* Section Header */}
                <div 
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors',
                    activeSection === section.name 
                      ? 'bg-primary/10 border-2 border-primary' 
                      : 'bg-gray-100 border-2 border-transparent hover:bg-gray-200'
                  )}
                  onClick={() => setActiveSection(
                    activeSection === section.name ? null : section.name
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={cn(
                        'w-4 h-4 rounded',
                        section.name === 'VIP' ? 'bg-purple-500' : 
                        section.name === 'Premium' ? 'bg-pink-500' :
                        section.name === 'Economy' ? 'bg-green-500' :
                        'bg-green-500'
                      )}
                    />
                    <span className="font-semibold text-gray-900">{section.name}</span>
                    <span className="text-sm text-gray-500">
                      {section.seats.length} seats
                    </span>
                  </div>
                  <span className="font-bold text-primary">
                    {formatPrice(section.price)}
                  </span>
                </div>

                {/* Section Seats */}
                <AnimatePresence>
                  {(activeSection === null || activeSection === section.name) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {section.rows.map((row) => (
                        <div key={row.label} className="flex items-center gap-3">
                          {/* Row Label */}
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                            {row.label}
                          </div>
                          
                          {/* Seats */}
                          <div className="flex gap-2 flex-wrap">
                            {row.seats.map((seat) => (
                              <SeatButton
                                key={seat.id}
                                seat={seat}
                                isSelected={isSeatSelected(seat.id)}
                                onClick={onSeatClick}
                                size="md"
                              />
                            ))}
                          </div>
                          
                          {/* Row Label (right) */}
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                            {row.label}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Selected Seats Summary */}
      {selectedSeats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-4 -mb-4 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-gray-400">
                {selectedSeats.map(s => s.label || `${s.row}${s.number}`).join(', ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatPrice(selectedSeats.reduce((sum, s) => sum + s.price, 0))}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default SeatMap;
