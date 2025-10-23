import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function WorkshopScene() {
  const [slideContent, setSlideContent] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideContent(prev => (prev + 1) % 3);
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const slides = [
    { title: "Web Development", content: "< HTML / CSS / JS >" },
    { title: "Data Science", content: "📊 Analytics & ML" },
    { title: "Design Thinking", content: "🎨 UX & Creativity" }
  ];
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Presentation Screen */}
      <motion.div
        className="absolute top-20 left-1/2 transform -translate-x-1/2 w-64 h-40 bg-gradient-to-br from-teal-300/30 to-yellow-300/30 rounded-lg border border-teal-400/50"
        animate={{ 
          boxShadow: [
            "0 0 20px rgba(20, 184, 166, 0.3)",
            "0 0 40px rgba(20, 184, 166, 0.5)",
            "0 0 20px rgba(20, 184, 166, 0.3)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div className="p-4 h-full bg-black/80 rounded-lg m-1">
          <motion.div
            key={slideContent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h3 className="text-yellow-400 text-lg mb-2">{slides[slideContent].title}</h3>
            <p className="text-teal-400 text-sm">{slides[slideContent].content}</p>
          </motion.div>
          
          {/* Screen reflection */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-lg"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </motion.div>
      
      {/* Flying Books */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ 
            x: -100,
            y: Math.random() * window.innerHeight,
            rotate: Math.random() * 360
          }}
          animate={{ 
            x: window.innerWidth + 100,
            rotate: Math.random() * 360 + 360,
            y: Math.random() * window.innerHeight
          }}
          transition={{ 
            duration: 12,
            delay: i * 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <motion.div
            className="w-6 h-8 bg-gradient-to-r from-yellow-400/60 to-teal-400/60 rounded-sm relative"
            animate={{ 
              rotateY: [0, 180, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="absolute inset-0.5 bg-gradient-to-r from-yellow-300/40 to-teal-300/40 rounded-sm" />
            <div className="absolute left-1 top-1 bottom-1 w-0.5 bg-yellow-600/60" />
          </motion.div>
        </motion.div>
      ))}
      
      {/* Students Raising Hands */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-20"
          style={{ left: `${20 + i * 15}%` }}
          animate={{ 
            y: [0, -3, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 3,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Head */}
          <div className="w-3 h-3 bg-gradient-to-b from-yellow-500/70 to-teal-500/70 rounded-full mx-auto mb-1" />
          
          {/* Body */}
          <div className="w-2 h-8 bg-gradient-to-b from-yellow-500/70 to-teal-500/70 rounded mx-auto" />
          
          {/* Raised Hand */}
          {i % 2 === 0 && (
            <motion.div
              className="absolute top-2 -right-1 w-4 h-1 bg-yellow-500/70 rounded"
              animate={{ 
                rotate: [45, 60, 45],
                y: [0, -2, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
          
          {/* Other arm */}
          <div className="absolute top-3 -left-1 w-3 h-1 bg-yellow-500/70 rounded" />
        </motion.div>
      ))}
      
      {/* Floating Knowledge Icons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400/50"
          initial={{ 
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
            scale: 0
          }}
          animate={{ 
            y: -50,
            scale: [0, 1, 1, 0],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 8,
            delay: i * 1.3,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {i % 3 === 0 && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 3L5 6.99h3V14h2V6.99h3L9 3zm7 14.01V21h2v-3.99h3L17 14l-4 3.01z"/>
            </svg>
          )}
          {i % 3 === 1 && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.75c0-.83.94-1.33 1.56-1.33c1.22 0 2.81.91 5.44.91s4.22-.91 5.44-.91c.62 0 1.56.5 1.56 1.33V19z"/>
            </svg>
          )}
          {i % 3 === 2 && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
            </svg>
          )}
        </motion.div>
      ))}
      
      {/* Whiteboard/Screen Stand */}
      <div className="absolute top-60 left-1/2 transform -translate-x-1/2 w-1 h-16 bg-gray-600" />
      <div className="absolute top-76 left-1/2 transform -translate-x-1/2 w-8 h-2 bg-gray-700 rounded" />
      
      {/* Light from projector */}
      <motion.div
        className="absolute top-16 left-1/2 transform -translate-x-1/2 w-72 h-48 opacity-20"
        animate={{ 
          opacity: [0.1, 0.3, 0.1]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="w-full h-full bg-gradient-to-b from-yellow-300/30 via-teal-300/20 to-transparent" 
             style={{ clipPath: 'polygon(45% 0%, 55% 0%, 90% 100%, 10% 100%)' }} />
      </motion.div>
      
      {/* Idea bulbs floating */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-teal-400/60"
          style={{ 
            top: `${20 + i * 15}%`,
            right: `${10 + i * 5}%`
          }}
          animate={{ 
            y: [0, -10, 0],
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.8, 0.4]
          }}
          transition={{ 
            duration: 3,
            delay: i * 0.7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}