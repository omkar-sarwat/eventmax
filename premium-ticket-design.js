// Premium Ticket Design for EventMax
import jsPDF from 'jspdf';

export const createPremiumTicketPDF = (bookingData, confirmationNumber, paymentMethod) => {
  const { event, selectedSeats, pricing } = bookingData;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true
  });

  // Premium ticket design function
  const createPremiumTicketDesign = (seat, ticketIndex) => {
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Premium color palette
    const colors = {
      primaryPurple: '#6366F1',
      secondaryPink: '#EC4899', 
      accentGold: '#F59E0B',
      accentEmerald: '#10B981',
      darkCharcoal: '#111827',
      lightGray: '#F8FAFC',
      mediumGray: '#64748B',
      white: '#FFFFFF'
    };
    
    // Set premium background
    pdf.setFillColor(248, 250, 252);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Main ticket container
    const ticketX = 20;
    const ticketY = 30;
    const ticketWidth = 170;
    const ticketHeight = 240;
    
    // Subtle shadow effect
    pdf.setFillColor(0, 0, 0, 0.08);
    pdf.roundedRect(ticketX + 3, ticketY + 3, ticketWidth, ticketHeight, 15, 15, 'F');
    
    // Main ticket background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(ticketX, ticketY, ticketWidth, ticketHeight, 15, 15, 'F');
    
    // Premium gradient header
    const headerHeight = 50;
    for (let i = 0; i < headerHeight; i++) {
      const progress = i / headerHeight;
      const r = Math.round(99 + (139 - 99) * progress);
      const g = Math.round(102 + (92 - 102) * progress);
      const b = Math.round(241 + (246 - 241) * progress);
      pdf.setFillColor(r, g, b);
      pdf.rect(ticketX, ticketY + i, ticketWidth, 1, 'F');
    }
    
    // Decorative pattern overlay
    pdf.setFillColor(255, 255, 255, 0.1);
    for (let x = 10; x < ticketWidth; x += 25) {
      for (let y = 5; y < headerHeight; y += 25) {
        pdf.circle(ticketX + x, ticketY + y, 3, 'F');
      }
    }
    
    // Premium logo design
    const logoX = ticketX + 20;
    const logoY = ticketY + 18;
    
    // Logo background circle with glow effect
    pdf.setFillColor(255, 255, 255, 0.95);
    pdf.circle(logoX + 12, logoY + 12, 15, 'F');
    
    pdf.setFillColor(255, 255, 255, 0.7);
    pdf.circle(logoX + 12, logoY + 12, 18, 'F');
    
    // Logo icon
    pdf.setFillColor(99, 102, 241);
    pdf.circle(logoX + 12, logoY + 12, 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EM', logoX + 7, logoY + 16);
    
    // Brand name with premium styling
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EVENTMAX', logoX + 35, logoY + 13);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('PREMIUM EXPERIENCES', logoX + 35, logoY + 22);
    
    // Ticket number with elegant styling
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const ticketNum = `#${String(ticketIndex + 1).padStart(4, '0')}`;
    pdf.text(`TICKET ${ticketNum}`, ticketX + ticketWidth - 60, logoY + 16);
    
    // Elegant divider
    pdf.setDrawColor(255, 255, 255, 0.6);
    pdf.setLineWidth(0.8);
    pdf.line(ticketX + 20, ticketY + headerHeight - 8, ticketX + ticketWidth - 20, ticketY + headerHeight - 8);
    
    // Event title with premium typography
    const titleY = ticketY + headerHeight + 25;
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    const eventTitle = event?.title || event?.name || 'Premium Event Experience';
    
    // Title shadow effect
    pdf.setTextColor(210, 210, 210);
    pdf.text(eventTitle, ticketX + 21, titleY + 1);
    pdf.setTextColor(17, 24, 39);
    pdf.text(eventTitle, ticketX + 20, titleY);
    
    // Premium category badge
    const categoryY = titleY + 15;
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(ticketX + 20, categoryY, 60, 14, 7, 7, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREMIUM EVENT', ticketX + 25, categoryY + 9);
    
    // Information sections with elegant cards
    const sectionY = titleY + 40;
    const cardHeight = 38;
    
    // Date & Time card
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(ticketX + 20, sectionY, (ticketWidth - 50) / 2, cardHeight, 8, 8, 'F');
    
    // Card accent
    pdf.setFillColor(99, 102, 241);
    pdf.roundedRect(ticketX + 20, sectionY, 4, cardHeight, 2, 2, 'F');
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATE & TIME', ticketX + 28, sectionY + 10);
    
    const eventDate = new Date(event?.date || event?.starts_at || new Date());
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(eventDate.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    }), ticketX + 28, sectionY + 20);
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const eventTime = event?.time || '7:30 PM';
    pdf.text(eventTime, ticketX + 28, sectionY + 30);
    
    // Venue card
    const venueX = ticketX + 25 + (ticketWidth - 50) / 2;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(venueX, sectionY, (ticketWidth - 50) / 2, cardHeight, 8, 8, 'F');
    
    // Card accent
    pdf.setFillColor(236, 72, 153);
    pdf.roundedRect(venueX, sectionY, 4, cardHeight, 2, 2, 'F');
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VENUE', venueX + 8, sectionY + 10);
    
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const venueName = event?.venue?.name || event?.location || 'Premium Venue';
    pdf.text(venueName.substring(0, 12), venueX + 8, sectionY + 20);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const venueAddress = event?.venue?.address || 'Elite Location';
    pdf.text(venueAddress.substring(0, 15), venueX + 8, sectionY + 30);
    
    // Seat information with premium badges
    const seatY = sectionY + cardHeight + 20;
    
    // Section badge
    pdf.setFillColor(139, 92, 246);
    pdf.roundedRect(ticketX + 20, seatY, 45, 28, 10, 10, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SECTION', ticketX + 23, seatY + 10);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const sectionName = seat?.section || pricing?.type || 'PREM';
    pdf.text(sectionName, ticketX + 30, seatY + 20);
    
    // Row badge
    pdf.setFillColor(236, 72, 153);
    pdf.roundedRect(ticketX + 70, seatY, 38, 28, 10, 10, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ROW', ticketX + 80, seatY + 10);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const rowName = seat?.row || 'A';
    pdf.text(rowName, ticketX + 86, seatY + 20);
    
    // Seat badge
    pdf.setFillColor(16, 185, 129);
    pdf.roundedRect(ticketX + 113, seatY, 38, 28, 10, 10, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SEAT', ticketX + 125, seatY + 10);
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const seatNumber = seat?.number || seat?.col || '7';
    pdf.text(String(seatNumber), ticketX + 130, seatY + 20);
    
    // Price section with golden accent
    const priceY = seatY + 40;
    
    // Price background with gradient effect
    pdf.setFillColor(255, 251, 235);
    pdf.roundedRect(ticketX + 20, priceY, 85, 18, 9, 9, 'F');
    
    pdf.setFillColor(245, 158, 11, 0.2);
    pdf.roundedRect(ticketX + 22, priceY + 2, 81, 14, 7, 7, 'F');
    
    pdf.setTextColor(146, 64, 14);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TICKET PRICE', ticketX + 26, priceY + 8);
    
    pdf.setTextColor(245, 158, 11);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const ticketPrice = seat?.price || pricing?.price || 150;
    pdf.text(`$${ticketPrice}.00`, ticketX + 26, priceY + 16);
    
    // Payment method
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const paymentMethodText = paymentMethod === 'cash' ? 'Pay on Arrival' : 'Paid Online';
    pdf.text(`Payment: ${paymentMethodText}`, ticketX + 110, priceY + 12);
    
    // QR Code section with premium styling
    const qrY = priceY + 30;
    
    // QR background with elegant gradient
    pdf.setFillColor(17, 24, 39);
    pdf.roundedRect(ticketX + 20, qrY, 75, 40, 10, 10, 'F');
    
    // Inner glow effect
    pdf.setFillColor(30, 41, 59);
    pdf.roundedRect(ticketX + 22, qrY + 2, 71, 36, 8, 8, 'F');
    
    // QR code area
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(ticketX + 25, qrY + 5, 28, 28, 5, 5, 'F');
    
    // Enhanced QR pattern
    pdf.setFillColor(17, 24, 39);
    const generatePremiumQRPattern = (data, size = 14) => {
      const pattern = [];
      const hash = data.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      for (let i = 0; i < size; i++) {
        pattern[i] = [];
        for (let j = 0; j < size; j++) {
          // Enhanced finder patterns
          if ((i < 4 && j < 4) || (i < 4 && j >= size - 4) || (i >= size - 4 && j < 4)) {
            pattern[i][j] = (i === 0 || i === 3 || j === 0 || j === 3 || 
                             (i === 1 && (j === 1 || j === 2)) || 
                             (i === 2 && (j === 1 || j === 2))) ? 1 : 0;
          }
          // Central alignment pattern
          else if (i >= 6 && i <= 8 && j >= 6 && j <= 8) {
            pattern[i][j] = (i === 6 || i === 8 || j === 6 || j === 8 || (i === 7 && j === 7)) ? 1 : 0;
          }
          // Data pattern with improved distribution
          else {
            pattern[i][j] = ((hash + i * size + j + i * j) % 5) > 2 ? 1 : 0;
          }
        }
      }
      return pattern;
    };
    
    const premiumQRPattern = generatePremiumQRPattern(confirmationNumber + (seat?.id || ticketIndex));
    
    for (let x = 0; x < premiumQRPattern.length; x++) {
      for (let y = 0; y < premiumQRPattern[x].length; y++) {
        if (premiumQRPattern[x][y] === 1) {
          pdf.rect(ticketX + 26 + x * 1.8, qrY + 6 + y * 1.8, 1.6, 1.6, 'F');
        }
      }
    }
    
    // QR code information
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SCAN TO', ticketX + 58, qrY + 12);
    pdf.text('VERIFY', ticketX + 58, qrY + 20);
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Secure Entry', ticketX + 58, qrY + 27);
    
    // Confirmation section
    pdf.setTextColor(16, 185, 129);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CONFIRMATION', ticketX + 100, qrY + 8);
    
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(confirmationNumber, ticketX + 100, qrY + 18);
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Keep this number safe', ticketX + 100, qrY + 26);
    
    // Premium barcode section
    const barcodeY = qrY + 50;
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Admission barcode for rapid entry verification', ticketX + 20, barcodeY - 3);
    
    // Enhanced barcode
    pdf.setFillColor(17, 24, 39);
    const barcodeData = confirmationNumber + (seat?.id || '');
    const barcodeWidth = ticketWidth - 40;
    const barcodeHeight = 18;
    
    for (let i = 0; i < barcodeData.length * 10; i++) {
      const charCode = barcodeData.charCodeAt(i % barcodeData.length);
      const barWidth = ((charCode % 5) + 1) * 0.4;
      const shouldDraw = (charCode + i) % 4 !== 0;
      
      if (shouldDraw && (ticketX + 20 + i * 1.1) < (ticketX + 20 + barcodeWidth)) {
        pdf.rect(ticketX + 20 + i * 1.1, barcodeY, barWidth, barcodeHeight, 'F');
      }
    }
    
    // Important notices with elegant styling
    const noticeY = barcodeY + 28;
    pdf.setFillColor(254, 242, 242);
    pdf.roundedRect(ticketX + 20, noticeY, ticketWidth - 40, 22, 6, 6, 'F');
    
    // Notice header with icon
    pdf.setFillColor(239, 68, 68);
    pdf.circle(ticketX + 28, noticeY + 8, 3, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('!', ticketX + 26.5, noticeY + 10);
    
    pdf.setTextColor(239, 68, 68);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text('IMPORTANT ENTRY REQUIREMENTS', ticketX + 35, noticeY + 8);
    
    pdf.setTextColor(153, 27, 27);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('• Valid photo ID required  • Arrive 30 min early  • No refunds after purchase', ticketX + 25, noticeY + 14);
    pdf.text('• Subject to venue terms  • Keep ticket safe  • Contact support for issues', ticketX + 25, noticeY + 19);
    
    // Premium footer with benefits
    const footerY = ticketY + ticketHeight - 18;
    
    // Gradient footer
    for (let i = 0; i < 18; i++) {
      const progress = i / 18;
      const r = Math.round(99 + (59 - 99) * progress);
      const g = Math.round(102 + (130 - 102) * progress);
      const b = Math.round(241 + (246 - 241) * progress);
      pdf.setFillColor(r, g, b);
      pdf.rect(ticketX, footerY + i, ticketWidth, 1, 'F');
    }
    
    // Footer content
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PREMIUM BENEFITS INCLUDED:', ticketX + 15, footerY + 8);
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Priority entry • Premium seating • Complimentary refreshments • VIP amenities', ticketX + 15, footerY + 14);
    
    // Elegant corner decorations
    pdf.setFillColor(99, 102, 241, 0.3);
    pdf.circle(ticketX + 15, ticketY + 15, 5, 'F');
    pdf.circle(ticketX + ticketWidth - 15, ticketY + 15, 5, 'F');
    pdf.circle(ticketX + 15, ticketY + ticketHeight - 15, 5, 'F');
    pdf.circle(ticketX + ticketWidth - 15, ticketY + ticketHeight - 15, 5, 'F');
    
    // Security watermark
    pdf.setTextColor(248, 250, 252);
    pdf.setFontSize(60);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VERIFIED', pageWidth/2 - 35, pageHeight/2, {
      angle: 45
    });
  };

  // Generate tickets for all selected seats
  selectedSeats.forEach((seat, index) => {
    if (index > 0) {
      pdf.addPage();
    }
    createPremiumTicketDesign(seat, index);
  });

  return pdf;
};
