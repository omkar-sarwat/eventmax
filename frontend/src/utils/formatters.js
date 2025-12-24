// EventMax Utility Formatters
// Date, time, price formatting functions

/**
 * Format a date string to readable format
 * @param {string|Date} date 
 * @param {object} options 
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  if (!date) return 'Date TBA';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date TBA';
    
    const defaultOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: new Date().getFullYear() !== d.getFullYear() ? 'numeric' : undefined,
      ...options,
    };
    
    return d.toLocaleDateString('en-US', defaultOptions);
  } catch {
    return 'Date TBA';
  }
}

/**
 * Format a full date with year
 * @param {string|Date} date 
 * @returns {string}
 */
export function formatFullDate(date) {
  if (!date) return 'Date TBA';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date TBA';
    
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Date TBA';
  }
}

/**
 * Format time string
 * @param {string|Date} time - Time in HH:MM:SS, HH:MM format, or ISO date
 * @returns {string}
 */
export function formatTime(time) {
  if (!time) return '';
  
  try {
    // Check if it's an ISO date string
    if (typeof time === 'string' && (time.includes('T') || time.includes('-'))) {
      const d = new Date(time);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    }
    
    // Handle HH:MM:SS or HH:MM format
    if (typeof time === 'string' && time.includes(':')) {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    return String(time);
  } catch {
    return String(time);
  }
}

/**
 * Format price with currency
 * @param {number} price 
 * @param {string} currency 
 * @returns {string}
 */
export function formatPrice(price, currency = 'INR') {
  if (price === null || price === undefined) return 'Free';
  if (price === 0) return 'Free';
  
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `₹${Number(price).toFixed(2)}`;
  }
}

/**
 * Format number with commas
 * @param {number} num 
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Format duration in minutes to readable format
 * @param {number} minutes 
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (!minutes) return '';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

/**
 * Format relative time (e.g., "2 days ago")
 * @param {string|Date} date 
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  
  try {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(date);
  } catch {
    return '';
  }
}

/**
 * Format countdown timer
 * @param {number} seconds 
 * @returns {string}
 */
export function formatCountdown(seconds) {
  if (seconds <= 0) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Truncate text with ellipsis
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}
