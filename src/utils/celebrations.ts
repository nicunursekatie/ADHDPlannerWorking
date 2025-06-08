export const triggerCelebration = () => {
  // Create confetti effect
  const confettiColors = ['#7563c1', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];
  
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.className = 'confetti-piece';
      confetti.style.cssText = `
        position: fixed;
        left: ${Math.random() * 100}vw;
        top: -10px;
        width: 8px;
        height: 8px;
        background: ${confettiColors[Math.floor(Math.random() * confettiColors.length)]};
        z-index: 9999;
        pointer-events: none;
        border-radius: 50%;
        animation: confetti-fall 3s linear forwards;
      `;
      
      document.body.appendChild(confetti);
      
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }, i * 50);
  }
  
  // Add celebration keyframes if not already present
  if (!document.querySelector('#celebration-styles')) {
    const style = document.createElement('style');
    style.id = 'celebration-styles';
    style.textContent = `
      @keyframes confetti-fall {
        0% {
          transform: translateY(-100vh) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(360deg);
          opacity: 0;
        }
      }
      
      @keyframes celebration-pulse {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }
      
      .celebration-pulse {
        animation: celebration-pulse 0.6s ease-in-out;
      }
    `;
    document.head.appendChild(style);
  }
};

export const addCelebrationPulse = (element: HTMLElement) => {
  element.classList.add('celebration-pulse');
  setTimeout(() => {
    element.classList.remove('celebration-pulse');
  }, 600);
};

export const showToastCelebration = (message: string = "Great job! 🎉") => {
  const toast = document.createElement('div');
  toast.className = 'celebration-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #7563c1, #22c55e);
    color: white;
    padding: 16px 24px;
    border-radius: 16px;
    font-weight: 600;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    transform: translateX(100%);
    transition: transform 0.3s ease-out;
  `;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Slide in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Slide out and remove
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
};