import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Add smooth scrolling globally
document.documentElement.style.scrollBehavior = 'smooth'

// Add CSS animations for scroll effects
const style = document.createElement('style')
style.innerHTML = `
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Scroll animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideInDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes zoomIn {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  /* Animation classes */
  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }

  .animate-fade-in-left {
    animation: fadeInLeft 0.6s ease-out;
  }

  .animate-fade-in-right {
    animation: fadeInRight 0.6s ease-out;
  }

  .animate-fade-in {
    animation: fadeIn 0.6s ease-out;
  }

  .animate-slide-in-down {
    animation: slideInDown 0.6s ease-out;
  }

  .animate-zoom-in {
    animation: zoomIn 0.6s ease-out;
  }

  /* Staggered animations */
  .animate-delay-100 {
    animation-delay: 0.1s;
  }

  .animate-delay-200 {
    animation-delay: 0.2s;
  }

  .animate-delay-300 {
    animation-delay: 0.3s;
  }

  .animate-delay-400 {
    animation-delay: 0.4s;
  }

  .animate-delay-500 {
    animation-delay: 0.5s;
  }

  /* Smooth transitions for all elements */
  * {
    transition: all 0.3s ease;
  }

  /* Scroll-triggered animations using Intersection Observer */
  .scroll-animate {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s ease;
  }

  .scroll-animate.animate {
    opacity: 1;
    transform: translateY(0);
  }

  /* Hover animations */
  .hover-lift {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .hover-lift:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  /* Loading animations */
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Respect user's motion preferences */
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`
document.head.appendChild(style)

// Add Intersection Observer for scroll animations
const observeElements = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate')
        }
      })
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
  )

  // Observe elements when DOM is loaded
  const observeScrollElements = () => {
    const elements = document.querySelectorAll('.scroll-animate')
    elements.forEach((element) => observer.observe(element))
  }

  // Initial check
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeScrollElements)
  } else {
    observeScrollElements()
  }

  // Re-observe new elements (for dynamic content)
  const mutationObserver = new MutationObserver(() => {
    const newElements = document.querySelectorAll('.scroll-animate:not(.animate)')
    newElements.forEach((element) => observer.observe(element))
  })

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  })
}

// Initialize observers when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeElements)
} else {
  observeElements()
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)