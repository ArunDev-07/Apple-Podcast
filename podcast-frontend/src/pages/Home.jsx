import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Star, Users, Headphones, Award, ArrowRight, Menu, X, BookOpen, Mic, TrendingUp, Globe, Quote } from 'lucide-react';

const LandingPage = ({ darkMode }) => {
  const scrollRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Sample data - replace with your actual data
  const artists = [
    {
      id: 1,
      name: 'Sarah Johnson',
      category: 'Motivational Speaker',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b332c1ad?w=250&h=250&fit=crop&crop=face',
      listeners: '2.5M',
      rating: 4.9,
      title: 'The Mindset Architect',
      subtitle: 'Building unshakeable confidence in leaders worldwide',
      featured: true
    },
    {
      id: 2,
      name: 'Marcus Chen',
      category: 'Business Strategy',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&h=250&fit=crop&crop=face',
      listeners: '1.8M',
      rating: 4.8,
      title: 'The Empire Builder',
      subtitle: 'From startup to billion-dollar success stories',
      featured: false
    },
    {
      id: 3,
      name: 'Dr. Emily Rodriguez',
      category: 'Health & Wellness',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=250&h=250&fit=crop&crop=face',
      listeners: '3.2M',
      rating: 4.9,
      title: 'The Human Optimizer',
      subtitle: 'Unlocking peak performance through science',
      featured: true
    },
    {
      id: 4,
      name: 'James Thompson',
      category: 'Future Tech',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&h=250&fit=crop&crop=face',
      listeners: '1.5M',
      rating: 4.7,
      title: 'The Innovation Prophet',
      subtitle: 'Predicting tomorrow\'s breakthroughs today',
      featured: false
    },
    {
      id: 5,
      name: 'Lisa Wang',
      category: 'Personal Growth',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=250&h=250&fit=crop&crop=face',
      listeners: '2.1M',
      rating: 4.8,
      title: 'The Transformation Catalyst',
      subtitle: 'Rewiring minds for extraordinary results',
      featured: true
    },
    {
      id: 6,
      name: 'Dr. Robert Kim',
      category: 'Financial Freedom',
      image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&h=250&fit=crop&crop=face',
      listeners: '2.8M',
      rating: 4.9,
      title: 'The Wealth Strategist',
      subtitle: 'Building generational wealth through wisdom',
      featured: false
    }
  ];

  const testimonials = [
    {
      name: 'Alexandra Stone',
      role: 'CEO, Global Dynamics',
      content: 'STREAMIFY transformed my leadership style. The daily insights from world-class minds have revolutionized how I approach business challenges. My team\'s productivity increased 67% in just 3 months.',
      rating: 5,
      impact: 'Increased team productivity by 67%',
      image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&h=60&fit=crop&crop=face'
    },
    {
      name: 'Michael Torres',
      role: 'Bestselling Author',
      content: 'I was drowning in mediocrity until I discovered STREAMIFY. The voices here don\'t just speak—they ignite transformation. My latest book hit #1 on Amazon thanks to insights I gained from this platform.',
      rating: 5,
      impact: 'Achieved #1 Amazon bestseller status',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face'
    },
    {
      name: 'Dr. Rachel Green',
      role: 'Research Scientist',
      content: 'The caliber of intellectual discourse on STREAMIFY is unmatched. It\'s like having access to the world\'s greatest minds 24/7. My research breakthrough came directly from a conversation I heard here.',
      rating: 5,
      impact: 'Published groundbreaking research',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=60&h=60&fit=crop&crop=face'
    }
  ];

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    
    const cardWidth = 280; // Reduced card width + gap for better mobile experience
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className={`min-h-screen overflow-x-hidden bg-gray-50 dark:bg-gray-900 ${darkMode ? 'text-white' : 'text-black'} transition-colors`}>
      {/* Hero Section */}
      <section className={`relative pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-gray-50 to-white'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-6xl mx-auto">
            <div 
              className={`inline-block ${darkMode ? 'bg-blue-600 text-white' : 'bg-black text-white'} px-4 py-2 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-6 uppercase tracking-wider`}
              style={{ transform: `translateY(${scrollY * 0.1}px)` }}
            >
              Trusted by 10.2 Million Listeners Worldwide
            </div>
            
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 leading-tight tracking-tight"
              style={{ transform: `translateY(${scrollY * 0.05}px)` }}
            >
              THE VOICES THAT
              <span className={`block text-transparent bg-clip-text ${darkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-purple-600 to-blue-600'}`}>
                TRANSFORM LIVES
              </span>
            </h2>
            
            <p 
              className={`text-base sm:text-lg md:text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-8 sm:mb-10 max-w-4xl mx-auto leading-relaxed font-medium`}
              style={{ transform: `translateY(${scrollY * 0.03}px)` }}
            >
              Stream profound conversations with the world's most influential minds. From Fortune 500 CEOs to Nobel Prize winners, discover the insights that separate the extraordinary from the ordinary.
            </p>
            
            <div 
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-16"
              style={{ transform: `translateY(${scrollY * 0.02}px)` }}
            >
              <button 
                className={`group ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-900'} text-white px-8 sm:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto`}
                onClick={() => window.location.href = '/register'}
              >
                <span className="flex items-center justify-center gap-2 sm:gap-3">
                  Experience the Transformation
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium text-sm sm:text-base`}>
                Start your free trial • No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-8 sm:py-12 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'} transition-colors`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
            <div className="group">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2 group-hover:scale-110 transition-transform">10.2M</div>
              <div className="text-gray-400 font-semibold text-xs sm:text-sm">Active Listeners</div>
            </div>
            <div className="group">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2 group-hover:scale-110 transition-transform">500+</div>
              <div className="text-gray-400 font-semibold text-xs sm:text-sm">Expert Voices</div>
            </div>
            <div className="group">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2 group-hover:scale-110 transition-transform">50M</div>
              <div className="text-gray-400 font-semibold text-xs sm:text-sm">Hours Streamed</div>
            </div>
            <div className="group">
              <div className="text-2xl sm:text-3xl md:text-4xl font-black mb-1 sm:mb-2 group-hover:scale-110 transition-transform">4.9★</div>
              <div className="text-gray-400 font-semibold text-xs sm:text-sm">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Voices */}
      <section id="voices" className={`py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-5 leading-tight">
              The Voices Everyone's
              <span className={`block text-transparent bg-clip-text ${darkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400' : 'bg-gradient-to-r from-blue-600 to-purple-600'}`}>
                Listening To
              </span>
            </h3>
            <p className={`text-base sm:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-4xl mx-auto leading-relaxed font-medium`}>
              Meet the minds shaping tomorrow. Industry titans, thought leaders, and change-makers sharing their most powerful insights exclusively on STREAMIFY.
            </p>
          </div>
          
          <div className="relative">
            {/* Navigation Buttons - Positioned on sides */}
            <button
              onClick={() => handleScroll('left')}
              className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 sm:p-3 ${darkMode ? 'bg-gray-800/90 hover:bg-gray-700 border-gray-700' : 'bg-white/90 hover:bg-white border-gray-200'} rounded-full transition-all duration-300 hover:scale-110 shadow-lg border`}
            >
              <ChevronLeft className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />
            </button>
            <button
              onClick={() => handleScroll('right')}
              className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 sm:p-3 ${darkMode ? 'bg-gray-800/90 hover:bg-gray-700 border-gray-700' : 'bg-white/90 hover:bg-white border-gray-200'} rounded-full transition-all duration-300 hover:scale-110 shadow-lg border`}
            >
              <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />
            </button>
            
            <div className="mb-6 sm:mb-10 text-center">
              <div className="hidden md:block">
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm font-semibold`}>Updated Daily</p>
                <p className={`${darkMode ? 'text-white' : 'text-black'} font-bold`}>Fresh Voices • Fresh Insights</p>
              </div>
            </div>
            
            <div
              ref={scrollRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-6 px-8 sm:px-12"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {artists.map((artist, index) => (
                <div 
                  key={artist.id} 
                  className={`flex-shrink-0 w-64 sm:w-72 ${darkMode ? 
                    'bg-gray-800 border-gray-700 shadow-lg hover:shadow-blue-900/20' : 
                    'bg-white border-gray-100 shadow-lg hover:shadow-xl'} 
                    rounded-xl sm:rounded-2xl transition-all duration-500 transform hover:scale-105 border ${
                    artist.featured ? darkMode ? 'ring-2 ring-blue-400' : 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className={`relative ${darkMode ? 'border-t border-l border-r border-gray-700 rounded-t-xl sm:rounded-t-2xl' : ''}`}>
                    <img
                      src={artist.image}
                      alt={artist.name}
                      className="w-full h-48 sm:h-52 object-cover rounded-t-xl sm:rounded-t-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-t-xl sm:rounded-t-2xl"></div>
                    {artist.featured && (
                      <div className={`absolute top-3 left-3 ${darkMode ? 'bg-blue-500' : 'bg-blue-500'} text-white px-2 py-1 rounded-full text-xs font-bold`}>
                        FEATURED
                      </div>
                    )}
                    <div className={`absolute bottom-3 right-3 ${darkMode ? 'bg-gray-900/90' : 'bg-white/90'} backdrop-blur-sm rounded-full px-2 py-1 text-xs sm:text-sm font-bold`}>
                      ⭐ {artist.rating}
                    </div>
                  </div>
                  <div className="p-4 sm:p-5">
                    <div className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} text-xs sm:text-sm font-bold uppercase mb-1 sm:mb-2 tracking-wider`}>
                      {artist.category}
                    </div>
                    <h4 className="text-lg sm:text-xl font-black mb-1 sm:mb-2 leading-tight">{artist.name}</h4>
                    <h5 className={`text-sm sm:text-base font-bold mb-1 sm:mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{artist.title}</h5>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed`}>{artist.subtitle}</p>
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                      <div className={`flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-semibold">{artist.listeners} listeners</span>
                      </div>
                    </div>
                    <button 
                      className={`w-full ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-black hover:bg-gray-900'} text-white py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 transform hover:scale-105`}
                      onClick={() => window.location.href = '/register'}
                    >
                      LISTEN NOW
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="stories" className={`py-12 sm:py-20 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'} transition-colors`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 sm:mb-5 leading-tight">
              Success Stories That
              <span className={`block text-transparent bg-clip-text ${darkMode ? 'bg-gradient-to-r from-green-400 to-blue-400' : 'bg-gradient-to-r from-green-600 to-blue-600'}`}>
                Inspire Action
              </span>
            </h3>
            <p className={`text-base sm:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'} max-w-4xl mx-auto leading-relaxed font-medium`}>
              Real people achieving extraordinary results. These aren't just testimonials—they're proof that transformation is possible.
            </p>
          </div>
          
          <div className="relative">
            <div className={`${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'} rounded-xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-10 border transition-colors`}>
                              <div className="text-center">
                <div className="flex items-center justify-center mb-3 sm:mb-5">
                  <div className={`${darkMode ? 'border-2 border-gray-700 rounded-full' : ''}`}>
                    <img
                      src={testimonials[currentTestimonial].image}
                      alt={testimonials[currentTestimonial].name}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover`}
                    />
                  </div>
                </div>
                
                <div className="flex justify-center mb-3 sm:mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <Quote className={`w-8 h-8 sm:w-10 sm:h-10 ${darkMode ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-3 sm:mb-5`} />
                
                <blockquote className={`text-lg sm:text-xl md:text-2xl ${darkMode ? 'text-gray-200' : 'text-gray-800'} mb-4 sm:mb-6 font-medium leading-relaxed italic`}>
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                
                <div className="mb-3 sm:mb-5">
                  <div className={`font-black text-base sm:text-lg ${darkMode ? 'text-white' : 'text-black'}`}>{testimonials[currentTestimonial].name}</div>
                  <div className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} font-bold text-sm sm:text-base`}>{testimonials[currentTestimonial].role}</div>
                </div>
                
                <div className={`${darkMode ? 'bg-green-900/30 border-2 border-green-700' : 'bg-green-50 border-2 border-green-200'} rounded-full px-3 sm:px-5 py-1 sm:py-2 inline-block`}>
                  <span className={`${darkMode ? 'text-green-400' : 'text-green-700'} font-bold text-xs sm:text-sm`}>
                    ✓ RESULT: {testimonials[currentTestimonial].impact}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-4 sm:mt-6 gap-2 sm:gap-3">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? darkMode ? 'bg-blue-400' : 'bg-blue-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className={`py-12 sm:py-20 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-950 text-white' : 'bg-black text-white'} transition-colors`}>
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 leading-tight">
            Your Transformation
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Starts Today
            </span>
          </h3>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
            Join over 10 million listeners who've already discovered the power of transformational voices. Your future self is waiting.
          </p>
          <button 
            className={`w-full sm:w-auto ${darkMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-black hover:bg-gray-100'} px-8 sm:px-10 py-3 sm:py-4 rounded-full text-base sm:text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-2xl mb-4 sm:mb-5`}
            onClick={() => window.location.href = '/register'}
          >
            BEGIN YOUR JOURNEY
          </button>
          <p className="text-gray-400 text-xs sm:text-sm font-semibold">
            FREE TRIAL • NO COMMITMENTS • CANCEL ANYTIME
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-8 sm:py-10 px-4 sm:px-6 lg:px-8 ${darkMode ? 'bg-gray-950 text-white' : 'bg-gray-900 text-white'} transition-colors`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 ${darkMode ? 'bg-blue-600' : 'bg-white'} rounded-full flex items-center justify-center`}>
                <Mic className={`w-4 h-4 ${darkMode ? 'text-white' : 'text-black'}`} />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black">STREAMIFY</span>
                <p className="text-xs text-gray-400 font-semibold">THE VOICE REVOLUTION</p>
              </div>
            </div>
            <div className="text-gray-400 text-xs sm:text-sm font-medium text-center md:text-right">
              © 2024 STREAMIFY. Transforming lives through powerful voices.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;