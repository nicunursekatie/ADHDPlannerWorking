/**
 * Performance optimization utilities
 */

// Debounce function to limit how often a function can run
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Throttle function to ensure a function runs at most once per interval
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Lazy load images using Intersection Observer
export function lazyLoadImages(selector: string = 'img[data-lazy]') {
  const images = document.querySelectorAll(selector);
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          imageObserver.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px'
  });
  
  images.forEach((img) => imageObserver.observe(img));
  
  return imageObserver;
}

// Request idle callback wrapper for non-critical work
export function whenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    setTimeout(callback, 1);
  }
}

// Measure performance of a function
export function measurePerformance(name: string, fn: () => void) {
  const startTime = performance.now();
  fn();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
  
  return duration;
}

// Memoize expensive computations
export function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn.apply(this, args);
    cache.set(key, result);
    
    return result;
  } as T;
}