// useScrollLock Hook
// Lock body scroll (useful for modals)

import { useEffect } from 'react';

function useScrollLock(lock = true) {
  useEffect(() => {
    if (!lock) return;

    // Save original styles
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
    
    // Get scrollbar width
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    
    // Apply lock
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    // Cleanup
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [lock]);
}

export default useScrollLock;
