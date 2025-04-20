import { initParticles } from './particles.js';

document.addEventListener('DOMContentLoaded', function() {

  // --- Dark Mode Toggle --- 
  const themeToggleButton = document.querySelector('button[onclick*="classList.toggle(\'dark\')"]'); // Find button based on existing onclick
  if (themeToggleButton) {
    // Remove the inline onclick attribute
    const inlineOnClick = themeToggleButton.getAttribute('onclick');
    themeToggleButton.removeAttribute('onclick');
    
    // Add event listener
    themeToggleButton.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
    });
  }

  // --- Initialize content visibility (from index.html) --- 
  // Reset styles potentially affected by animations or transitions on load
  // Check if body exists before trying to style it
  if (document.body) {
    document.body.style.opacity = '1';
    document.body.style.transform = 'none';
  }
  
  const elementsToReset = document.querySelectorAll('section, div, p, a, button, span');
  elementsToReset.forEach(element => {
    // Ensure element has style property
    if (element.style) {
      element.style.opacity = '1';
      element.style.transform = 'none';
      element.style.transition = 'none';
    } else {
      // console.warn('Element found without style property:', element);
    }
  });

  // Kill any existing GSAP animations (if GSAP is loaded)
  if (typeof gsap !== 'undefined') {
    gsap.killAll();
  }

  // --- Card Hover Effect (from index.html) --- 
  document.querySelectorAll('.card-hover').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
      
      const rotateY = ((x - rect.width / 2) / rect.width) * 10; // Less intense rotation
      const rotateX = ((y - rect.height / 2) / rect.height) * -10; // Less intense rotation
      
      // Apply perspective and rotation, slight lift and scale
      card.style.transform = `
        perspective(2000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateZ(5px) 
        scale(1.01)
      `;
      
      // Apply radial gradient background effect
      const glare = card.querySelector('.card-background'); // Assuming a child element for the glare
      if (glare) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glare.style.background = `
          radial-gradient(
            circle at ${glareX}% ${glareY}%, 
            rgba(255, 255, 255, 0.1) 0%,
            transparent 50%
          )
        `;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = ''; // Reset transform
      const glare = card.querySelector('.card-background');
      if (glare) {
        glare.style.background = ''; // Reset background if needed
      }
    });
  });

  // --- Magnetic Button Effect (Consolidated) --- 
  document.querySelectorAll('.magnetic-button').forEach(button => {
    button.addEventListener('mousemove', e => {
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate distance from center, normalized to button dimensions
      const deltaX = (x - centerX) / centerX;
      const deltaY = (y - centerY) / centerY;
      
      // Apply translation based on cursor position relative to center
      // Reduce the multiplier for a subtler effect
      button.style.transform = `translate(${deltaX * 5}px, ${deltaY * 5}px)`; 
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = ''; // Reset transform on mouse leave
    });
  });

  // --- Morphing Background Mouse Tracking (Consolidated) --- 
  const morphingBg = document.querySelector('.morphing-bg');
  if (morphingBg) {
    document.addEventListener('mousemove', e => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      morphingBg.style.setProperty('--x', `${x}%`);
      morphingBg.style.setProperty('--y', `${y}%`);
    });
  }

  // --- Twitter Theme Switcher (from index.html) --- 
  // Needs an element with id="twitter-timeline" containing the iframe
  const twitterTimeline = document.querySelector('#twitter-timeline iframe'); 
  if (twitterTimeline) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          twitterTimeline.contentWindow.postMessage(
            {
              element: 'timeline',
              theme: isDark ? 'dark' : 'light'
            },
            'https://platform.twitter.com'
          );
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Send initial theme state on load
    const initialIsDark = document.documentElement.classList.contains('dark');
    twitterTimeline.contentWindow.postMessage(
      {
        element: 'timeline',
        theme: initialIsDark ? 'dark' : 'light'
      },
      'https://platform.twitter.com'
    );
  }

  // --- Initialize Particles (if container exists) --- 
  if (document.getElementById('particles-js')) {
    initParticles();
  }
}); 