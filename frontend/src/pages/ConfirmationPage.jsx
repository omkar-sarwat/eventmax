// EventMax Premium Confirmation Page
// World-class booking confirmation with premium animations and professional invoice

import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { QRCodeSVG } from 'qrcode.react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Check,
  Download,
  Share2,
  Calendar,
  Clock,
  MapPin,
  Mail,
  Ticket,
  ArrowRight,
  Home,
  Smartphone,
  FileText,
  Sparkles,
  Crown
} from 'lucide-react';
import Button from '../components/atoms/Button';
import Badge from '../components/atoms/Badge';
import { formatDate, formatTime, formatPrice } from '../utils/formatters';

// Premium color palette
const PREMIUM_COLORS = {
  gold: '#D4AF37',
  goldLight: '#F4E4BA',
  goldDark: '#C0A062',
  deepBlack: '#0A0A0A',
  slateBlack: '#1a1a2e',
  royalPurple: '#6B21A8',
  emerald: '#059669',
  pearl: '#F8F8F8'
};

// Premium confetti configuration
const firePremiumConfetti = () => {
  const duration = 4000;
  const end = Date.now() + duration;

  // Center burst with gold colors
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: [PREMIUM_COLORS.gold, PREMIUM_COLORS.goldLight, PREMIUM_COLORS.goldDark, '#FFFFFF', PREMIUM_COLORS.royalPurple],
    shapes: ['circle', 'square'],
    gravity: 0.8,
    ticks: 300,
    decay: 0.94,
    startVelocity: 45,
    scalar: 1.2,
  });

  // Side cannons
  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: [PREMIUM_COLORS.gold, PREMIUM_COLORS.goldLight],
      shapes: ['circle'],
      gravity: 1,
      scalar: 0.8,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: [PREMIUM_COLORS.gold, PREMIUM_COLORS.goldLight],
      shapes: ['circle'],
      gravity: 1,
      scalar: 0.8,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
};

// Animated Checkmark Component
const AnimatedCheckmark = () => {
  return (
    <motion.div
      className="relative w-28 h-28 mx-auto"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
    >
      {/* Outer glow ring animation */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ 
          background: `linear-gradient(135deg, ${PREMIUM_COLORS.emerald}, #10b981)` 
        }}
        animate={{ 
          boxShadow: [
            "0 0 0 0 rgba(16, 185, 129, 0.4)",
            "0 0 0 20px rgba(16, 185, 129, 0)",
          ]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      
      {/* Inner circle with gradient */}
      <div 
        className="absolute inset-2 rounded-full flex items-center justify-center"
        style={{ 
          background: `linear-gradient(135deg, #10b981, ${PREMIUM_COLORS.emerald})` 
        }}
      >
        {/* Animated checkmark SVG */}
        <svg className="w-14 h-14" viewBox="0 0 24 24">
          <motion.path
            d="M5 13l4 4L19 7"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
          />
        </svg>
      </div>

      {/* Sparkle effects */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: PREMIUM_COLORS.gold,
            left: '50%',
            top: '50%',
          }}
          initial={{ scale: 0, x: 0, y: 0 }}
          animate={{ 
            scale: [0, 1, 0],
            x: [0, Math.cos(i * 60 * Math.PI / 180) * 60],
            y: [0, Math.sin(i * 60 * Math.PI / 180) * 60],
          }}
          transition={{ 
            duration: 0.8, 
            delay: 0.6 + i * 0.05,
            ease: "easeOut"
          }}
        />
      ))}
    </motion.div>
  );
};

// QR Code component (clean, no animation)
const PremiumQRCode = ({ value, size = 160 }) => {
  return (
    <div className="relative bg-white rounded-xl p-4 shadow-lg">
      {/* QR Code */}
      <QRCodeSVG
        value={value}
        size={size}
        level="H"
        includeMargin={false}
        fgColor={PREMIUM_COLORS.deepBlack}
        bgColor="#FFFFFF"
      />
      
      {/* Corner accents */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2" style={{ borderColor: PREMIUM_COLORS.gold }} />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2" style={{ borderColor: PREMIUM_COLORS.gold }} />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2" style={{ borderColor: PREMIUM_COLORS.gold }} />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2" style={{ borderColor: PREMIUM_COLORS.gold }} />
    </div>
  );
};

// Price count-up animation component
const AnimatedPrice = ({ value, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing function for smooth animation
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(value * eased);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return (
    <span style={{ color: PREMIUM_COLORS.gold }}>
      {formatPrice(displayValue)}
    </span>
  );
};

function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const ticketRef = useRef(null);

  // Get booking data from navigation state
  const bookingData = location.state?.booking;

  // Transform booking data to expected format
  const transformBooking = (data) => {
    if (!data) return null;
    
    console.log('ConfirmationPage received data:', data);
    
    // Handle different API response structures
    const booking = data.booking || data;
    const event = booking.event || {};
    const customer = booking.customer || {};
    
    // Handle seats - can be seatPrices, seats, or selectedSeats
    const seats = booking.seatPrices || booking.seats || booking.selectedSeats || [];
    
    // Build full name from customer object or booking fields
    const firstName = customer.firstName || booking.firstName || booking.customer_first_name || '';
    const lastName = customer.lastName || booking.lastName || booking.customer_last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'Guest';
    const email = customer.email || booking.customerEmail || booking.email || booking.customer_email || '';
    
    const transformed = {
      id: booking.bookingReference || booking.booking_reference || booking.id || booking.bookingId || `BK${Date.now()}`,
      confirmationNumber: booking.bookingReference || booking.booking_reference || booking.confirmationNumber || booking.id,
      event: {
        id: event.id || booking.eventId || booking.event_id,
        title: event.title || event.name || booking.eventTitle || booking.event_title || 'Event',
        date: event.eventDate || event.date || booking.eventDate || booking.event_date,
        time: event.startTime || event.time || booking.eventTime || '',
        venue: event.venueName || event.venue || booking.venueName || booking.venue_name || 'Venue',
        location: event.venueAddress || event.location || booking.venueAddress || '',
        image: event.imageUrl || event.image || booking.eventImage || ''
      },
      seats: seats.map((seat, idx) => {
        // Parse seatLabel format like "D-6" to extract row and number
        const label = seat.seatLabel || seat.label || '';
        const labelParts = label.split('-');
        const parsedRow = labelParts[0] || '';
        const parsedNumber = labelParts[1] || '';
        
        return {
          row: seat.row || seat.rowLabel || seat.row_identifier || parsedRow || 'A',
          number: seat.number || seat.seatNumber || seat.seat_number || parsedNumber || String(idx + 1),
          category: seat.category || seat.section || seat.type || seat.seatType || 'Standard',
          price: parseFloat(seat.price || seat.currentPrice || seat.seatPrice || 0),
          seatLabel: label
        };
      }),
      total: parseFloat(booking.totalAmount || booking.total_amount || booking.total || booking.totalPrice || 0) ||
             seats.reduce((sum, s) => sum + parseFloat(s.price || s.currentPrice || 0), 0),
      user: {
        name: fullName,
        email: email
      },
      createdAt: booking.createdAt || booking.created_at || new Date().toISOString(),
      status: booking.status || 'confirmed',
      invoice: data.invoice || booking.invoice || null
    };
    
    console.log('ConfirmationPage transformed data:', transformed);
    return transformed;
  };

  const booking = transformBooking(bookingData);

  // Redirect if no booking data
  useEffect(() => {
    if (!booking) {
      navigate('/events');
    }
  }, [booking, navigate]);

  // Premium confetti effect on mount
  useEffect(() => {
    if (!booking) return;
    
    // Fire premium confetti
    const timer = setTimeout(() => {
      firePremiumConfetti();
    }, 300);
    
    return () => clearTimeout(timer);
  }, [booking]);

  // Generate professional PDF invoice
  const generateInvoicePDF = async () => {
    setIsGeneratingPDF(true);
    
    // Helper function to format currency for PDF (always 2 decimal places)
    const formatCurrency = (amount) => {
      const num = parseFloat(amount) || 0;
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };
    
    // Calculate pricing breakdown
    const subtotal = booking?.seats?.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0) || booking?.total || 0;
    const serviceFeeRate = 0.05; // 5% service fee
    const taxRate = 0.18; // 18% GST (India)
    const serviceFee = subtotal * serviceFeeRate;
    const tax = subtotal * taxRate;
    const total = subtotal + serviceFee + tax;
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Header background
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // Gold accent line
      pdf.setFillColor(212, 175, 55);
      pdf.rect(0, 50, pageWidth, 2, 'F');
      
      // Company name
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EVENTMAX', 20, 25);
      
      // Invoice text
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('INVOICE', 20, 38);
      
      // Invoice number on right
      pdf.setTextColor(212, 175, 55);
      pdf.setFontSize(12);
      pdf.text(`#${booking?.id || 'N/A'}`, pageWidth - 20, 25, { align: 'right' });
      pdf.setTextColor(180, 180, 180);
      pdf.setFontSize(10);
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 35, { align: 'right' });
      pdf.text('Status: PAID', pageWidth - 20, 43, { align: 'right' });
      
      // Bill To section
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BILL TO', 20, 70);
      
      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.text(booking?.user?.name || 'Guest', 20, 80);
      pdf.setFontSize(10);
      pdf.text(booking?.user?.email || '', 20, 88);
      
      // Event Details section
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('EVENT DETAILS', pageWidth / 2 + 10, 70);
      
      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(12);
      pdf.text(booking?.event?.title || 'Event', pageWidth / 2 + 10, 80);
      pdf.setFontSize(10);
      pdf.text(booking?.event?.venue || 'Venue', pageWidth / 2 + 10, 88);
      pdf.text(formatDate(booking?.event?.date) + (booking?.event?.time ? ` at ${formatTime(booking?.event?.time)}` : ''), pageWidth / 2 + 10, 96);
      
      // Line separator
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.5);
      pdf.line(20, 110, pageWidth - 20, 110);
      
      // Table header
      pdf.setFillColor(249, 250, 251);
      pdf.rect(20, 115, pageWidth - 40, 10, 'F');
      
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('ITEM DESCRIPTION', 25, 122);
      pdf.text('QTY', 120, 122);
      pdf.text('UNIT PRICE', 140, 122);
      pdf.text('AMOUNT', pageWidth - 25, 122, { align: 'right' });
      
      // Line items
      let yPos = 135;
      pdf.setTextColor(31, 41, 55);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      if (booking?.seats && booking.seats.length > 0) {
        booking.seats.forEach((seat, index) => {
          // Get seat display info
          const seatRow = seat.row || 'A';
          const seatNumber = seat.number || seat.seatLabel?.split('-')[1] || (index + 1);
          const seatCategory = seat.category || seat.section || 'Standard';
          const seatPrice = parseFloat(seat.price) || 0;
          
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${seatCategory} Seat`, 25, yPos);
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(107, 114, 128);
          pdf.text(`Row ${seatRow}, Seat ${seatNumber}`, 25, yPos + 5);
          
          pdf.setTextColor(31, 41, 55);
          pdf.setFontSize(10);
          pdf.text('1', 120, yPos);
          pdf.text(formatCurrency(seatPrice), 140, yPos);
          pdf.text(formatCurrency(seatPrice), pageWidth - 25, yPos, { align: 'right' });
          
          yPos += 18;
        });
      } else {
        pdf.text('Event Ticket', 25, yPos);
        pdf.text('1', 120, yPos);
        pdf.text(formatCurrency(booking?.total || 0), 140, yPos);
        pdf.text(formatCurrency(booking?.total || 0), pageWidth - 25, yPos, { align: 'right' });
        yPos += 18;
      }
      
      // Subtotal, fees, total
      yPos += 10;
      pdf.setDrawColor(229, 231, 235);
      pdf.line(120, yPos, pageWidth - 20, yPos);
      
      yPos += 10;
      pdf.setTextColor(107, 114, 128);
      pdf.text('Subtotal', 140, yPos);
      pdf.setTextColor(31, 41, 55);
      pdf.text(formatCurrency(subtotal), pageWidth - 25, yPos, { align: 'right' });
      
      yPos += 8;
      pdf.setTextColor(107, 114, 128);
      pdf.text(`Service Fee (${(serviceFeeRate * 100).toFixed(0)}%)`, 140, yPos);
      pdf.setTextColor(31, 41, 55);
      pdf.text(formatCurrency(serviceFee), pageWidth - 25, yPos, { align: 'right' });
      
      yPos += 8;
      pdf.setTextColor(107, 114, 128);
      pdf.text(`GST (${(taxRate * 100).toFixed(0)}%)`, 140, yPos);
      pdf.setTextColor(31, 41, 55);
      pdf.text(formatCurrency(tax), pageWidth - 25, yPos, { align: 'right' });
      
      // Total
      yPos += 5;
      pdf.setDrawColor(212, 175, 55);
      pdf.setLineWidth(1);
      pdf.line(120, yPos, pageWidth - 20, yPos);
      
      yPos += 12;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('TOTAL', 140, yPos);
      pdf.setTextColor(212, 175, 55);
      pdf.text(formatCurrency(total), pageWidth - 25, yPos, { align: 'right' });
      
      // Payment info box
      yPos += 25;
      pdf.setFillColor(240, 253, 244);
      pdf.roundedRect(20, yPos, pageWidth - 40, 35, 3, 3, 'F');
      
      pdf.setTextColor(5, 150, 105);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAYMENT CONFIRMED', 30, yPos + 12);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(31, 41, 55);
      pdf.text(`Transaction ID: TXN-${booking?.id || Date.now()}`, 30, yPos + 22);
      pdf.text(`Payment Date: ${new Date().toLocaleString()}`, 30, yPos + 30);
      
      // "PAID" watermark - using simple text with low opacity simulation
      pdf.setTextColor(200, 230, 200);
      pdf.setFontSize(80);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAID', pageWidth / 2, 180, { align: 'center', angle: 45 });
      
      // Footer
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Thank you for booking with EventMax!', pageWidth / 2, pageHeight - 30, { align: 'center' });
      pdf.text('Questions? Contact support@eventmax.in | +91 1800-123-4567', pageWidth / 2, pageHeight - 22, { align: 'center' });
      
      pdf.setTextColor(180, 180, 180);
      pdf.setFontSize(8);
      pdf.text('EventMax India Pvt. Ltd. | www.eventmax.in | GSTIN: 27AABCE1234F1ZN', pageWidth / 2, pageHeight - 12, { align: 'center' });
      
      // Save PDF
      pdf.save(`EventMax-Invoice-${booking?.id || 'ticket'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Download ticket as image
  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#1a1a2e',
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `EventMax-Ticket-${booking?.id || 'ticket'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error downloading ticket:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share && booking) {
      try {
        await navigator.share({
          title: 'My EventMax Ticket',
          text: `I'm going to ${booking.event.title}! 🎉`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  // Show loading if no booking
  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-t-transparent rounded-full mx-auto mb-4"
            style={{ borderColor: PREMIUM_COLORS.gold, borderTopColor: 'transparent' }}
          />
          <p className="text-gray-400">Loading your premium experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" style={{ 
      background: `linear-gradient(135deg, ${PREMIUM_COLORS.slateBlack} 0%, #16213e 50%, ${PREMIUM_COLORS.slateBlack} 100%)`
    }}>
      {/* Floating particles background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: PREMIUM_COLORS.gold,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="container-custom max-w-2xl relative z-10">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <AnimatedCheckmark />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" style={{ color: PREMIUM_COLORS.gold }} />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Booking Confirmed!
              </h1>
              <Sparkles className="w-5 h-5" style={{ color: PREMIUM_COLORS.gold }} />
            </div>
            <p className="text-gray-400">
              Your premium experience awaits
            </p>
          </motion.div>
        </motion.div>

        {/* Premium Ticket Card */}
        <motion.div
          ref={ticketRef}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8, type: "spring" }}
          style={{ perspective: 1000 }}
          className="relative"
        >
          {/* Holographic shimmer overlay */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none z-10 opacity-20"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
              backgroundSize: '200% 200%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 200%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Gold border glow */}
          <div 
            className="absolute -inset-0.5 rounded-3xl opacity-50 blur-sm"
            style={{ 
              background: `linear-gradient(135deg, ${PREMIUM_COLORS.gold}, ${PREMIUM_COLORS.goldLight}, ${PREMIUM_COLORS.gold})` 
            }}
          />
          
          {/* Main ticket container */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl overflow-hidden shadow-2xl">
            {/* Ticket Header with event info */}
            <div className="relative p-6 pb-8">
              {/* Premium badge */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5" style={{ color: PREMIUM_COLORS.gold }} />
                  <span 
                    className="text-sm font-semibold tracking-wider"
                    style={{ color: PREMIUM_COLORS.gold }}
                  >
                    EVENTMAX PREMIUM
                  </span>
                </div>
                <Badge 
                  variant="light" 
                  className="px-3 py-1 text-xs font-mono"
                  style={{ 
                    background: 'rgba(212, 175, 55, 0.2)',
                    color: PREMIUM_COLORS.gold,
                    border: `1px solid ${PREMIUM_COLORS.gold}40`
                  }}
                >
                  {booking.id}
                </Badge>
              </div>

              {/* Event title */}
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="text-2xl md:text-3xl font-bold text-white mb-4"
              >
                {booking.event.title}
              </motion.h2>

              {/* Event details */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="flex flex-wrap gap-4 text-gray-300"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" style={{ color: PREMIUM_COLORS.gold }} />
                  {formatDate(booking.event.date)}
                </span>
                {booking.event.time && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: PREMIUM_COLORS.gold }} />
                    {formatTime(booking.event.time)}
                  </span>
                )}
              </motion.div>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="flex items-start gap-2 mt-3 text-gray-300"
              >
                <MapPin className="w-4 h-4 mt-0.5" style={{ color: PREMIUM_COLORS.gold }} />
                <div>
                  <p className="font-medium">{booking.event.venue}</p>
                  {booking.event.location && (
                    <p className="text-sm text-gray-500">{booking.event.location}</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Perforated tear line */}
            <div className="relative flex items-center">
              <div 
                className="absolute left-0 w-6 h-6 rounded-full -translate-x-1/2"
                style={{ background: PREMIUM_COLORS.slateBlack }}
              />
              <div 
                className="absolute right-0 w-6 h-6 rounded-full translate-x-1/2"
                style={{ background: PREMIUM_COLORS.slateBlack }}
              />
              <div 
                className="w-full border-t-2 border-dashed mx-6"
                style={{ borderColor: `${PREMIUM_COLORS.gold}40` }}
              />
            </div>

            {/* Ticket bottom section */}
            <div className="p-6 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seat details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.6, duration: 0.5 }}
                >
                  <h3 
                    className="text-xs font-semibold tracking-wider mb-3"
                    style={{ color: PREMIUM_COLORS.gold }}
                  >
                    YOUR SEATS
                  </h3>
                  <div className="space-y-2">
                    {booking.seats.map((seat, idx) => {
                      // Extract seat details properly
                      const seatRow = seat.row || 'A';
                      const seatNumber = seat.number || seat.seatLabel?.split('-')[1] || (idx + 1);
                      const seatCategory = seat.category || seat.section || 'Standard';
                      const seatPrice = parseFloat(seat.price) || 0;
                      
                      return (
                        <div 
                          key={idx}
                          className="bg-white/5 rounded-lg px-4 py-3 border"
                          style={{ borderColor: `${PREMIUM_COLORS.gold}30` }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-white">
                                Row {seatRow}, Seat {seatNumber}
                              </span>
                              <span 
                                className="text-xs ml-2 px-2 py-0.5 rounded-full"
                                style={{ 
                                  background: `${PREMIUM_COLORS.gold}20`,
                                  color: PREMIUM_COLORS.gold
                                }}
                              >
                                {seatCategory}
                              </span>
                            </div>
                            <span className="text-white font-medium">
                              {formatPrice(seatPrice)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* QR Code section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <h3 
                    className="text-xs font-semibold tracking-wider mb-3"
                    style={{ color: PREMIUM_COLORS.gold }}
                  >
                    SCAN TO ENTER
                  </h3>
                  <PremiumQRCode 
                    value={`eventmax://ticket/${booking.id}`}
                    size={140}
                  />
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Show this at the venue entrance
                  </p>
                </motion.div>
              </div>

              {/* Total section */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.5 }}
                className="mt-6 pt-6 border-t flex items-center justify-between"
                style={{ borderColor: `${PREMIUM_COLORS.gold}30` }}
              >
                <div>
                  <span className="text-xs text-gray-500 tracking-wider">TOTAL PAID</span>
                  <div className="text-3xl font-bold">
                    <AnimatedPrice value={booking.total} delay={2000} />
                  </div>
                </div>
                <div 
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ 
                    background: 'rgba(5, 150, 105, 0.2)',
                    color: PREMIUM_COLORS.emerald
                  }}
                >
                  ✓ CONFIRMED
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 0.5 }}
          className="grid grid-cols-2 gap-4 mt-6"
        >
          <Button
            variant="primary"
            leftIcon={isGeneratingPDF ? null : <FileText className="w-5 h-5" />}
            onClick={generateInvoicePDF}
            disabled={isGeneratingPDF}
            fullWidth
            className="relative overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${PREMIUM_COLORS.gold}, ${PREMIUM_COLORS.goldDark})`,
              border: 'none'
            }}
          >
            {isGeneratingPDF ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block"
              />
            ) : (
              'Download Invoice'
            )}
          </Button>
          <Button
            variant="outline"
            leftIcon={<Download className="w-5 h-5" />}
            onClick={handleDownloadTicket}
            fullWidth
            className="border-white/20 text-white hover:bg-white/10"
          >
            Save Ticket
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.3, duration: 0.5 }}
          className="mt-4"
        >
          <Button
            variant="outline"
            leftIcon={<Share2 className="w-5 h-5" />}
            onClick={handleShare}
            fullWidth
            className="border-white/20 text-white hover:bg-white/10"
          >
            Share Your Experience
          </Button>
        </motion.div>

        {/* Email Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.4, duration: 0.5 }}
          className="rounded-xl p-4 mt-6 flex items-start gap-3"
          style={{ background: 'rgba(59, 130, 246, 0.1)' }}
        >
          <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <p className="text-blue-300 font-medium">
              Confirmation email sent
            </p>
            <p className="text-sm text-blue-400/70">
              A copy of your tickets has been sent to {booking.user?.email || 'your email'}
            </p>
          </div>
        </motion.div>

        {/* App Download CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.5, duration: 0.5 }}
          className="rounded-xl p-6 mt-6 flex items-center justify-between"
          style={{ 
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1), rgba(107, 33, 168, 0.1))',
            border: `1px solid ${PREMIUM_COLORS.gold}30`
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-xl"
              style={{ background: `${PREMIUM_COLORS.gold}20` }}
            >
              <Smartphone className="w-6 h-6" style={{ color: PREMIUM_COLORS.gold }} />
            </div>
            <div>
              <p className="text-white font-medium">
                Get the EventMax App
              </p>
              <p className="text-gray-400 text-sm">
                Access your tickets anytime
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-white/30 text-white hover:bg-white hover:text-gray-900"
          >
            Get App
          </Button>
        </motion.div>

        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mt-8 justify-center"
        >
          <Link
            to="/"
            className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
          <Link
            to="/profile/bookings"
            className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Ticket className="w-5 h-5" />
            View All Bookings
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Footer branding */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 0.5 }}
          className="text-center mt-12 pb-8"
        >
          <p 
            className="text-sm font-semibold tracking-wider"
            style={{ color: `${PREMIUM_COLORS.gold}60` }}
          >
            ✨ EVENTMAX PREMIUM EXPERIENCE ✨
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default ConfirmationPage;
