import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function SportsScene() {
  const [lightFlicker, setLightFlicker] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLightFlicker(Math.random());
    }, 200);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Stadium Lights */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute top-10"
          style={{ left: `${20 + i * 20}%` }}
          animate={{ 
            opacity: [0.6, 1, 0.8, 1],
            scale: [1, 1.1, 0.95, 1]
          }}
          transition={{ 
            duration: 0.3,
            delay: lightFlicker + i * 0.1,
            repeat: Infinity 
          }}
        >
          <div className="w-8 h-4 bg-gradient-to-b from-orange-300 to-orange-500 rounded-b-full" />
          <motion.div
            className="w-24 h-32 bg-gradient-to-b from-orange-400/40 to-transparent rounded-b-full mx-auto -mt-1"
            animate={{ 
              opacity: [0.3, 0.6, 0.4, 0.6]
            }}
            transition={{ 
              duration: 0.5,
              delay: i * 0.1,
              repeat: Infinity 
            }}
          />
        </motion.div>
      ))}
      
      {/* Bouncing Ball */}
      <motion.div
        className="absolute"
        initial={{ x: 100, y: 300 }}
        animate={{ 
          x: [100, 300, 500, 700, 900],
          y: [300, 150, 300, 100, 250]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg"
          animate={{ 
            rotate: 360,
            scale: [1, 0.8, 1, 0.9, 1]
          }}
          transition={{ 
            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          {/* Ball texture lines */}
          <div className="absolute inset-1 border-2 border-red-600/50 rounded-full" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-600/50" />
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-600/50" />
        </motion.div>
        
        {/* Ball shadow */}
        <motion.div
          className="absolute top-8 left-0 w-8 h-2 bg-black/30 rounded-full blur-sm"
          animate={{ 
            scale: [1, 0.6, 1, 0.5, 0.8],
            opacity: [0.3, 0.1, 0.3, 0.05, 0.2]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>
      
      {/* Running Player Silhouette */}
      <motion.div
        className="absolute bottom-20 left-20"
        animate={{ 
          x: [0, 400, 800],
          scaleX: [1, 1, -1]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <motion.div
          className="relative"
          animate={{ 
            y: [0, -5, 0, -3, 0]
          }}
          transition={{ 
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {/* Head */}
          <div className="w-4 h-4 bg-gradient-to-b from-orange-500/70 to-red-500/70 rounded-full mx-auto" />
          
          {/* Body */}
          <div className="w-3 h-12 bg-gradient-to-b from-orange-500/70 to-red-500/70 rounded mx-auto" />
          
          {/* Arms */}
          <motion.div
            className="absolute top-4 -left-1 w-6 h-1 bg-orange-500/70 rounded"
            animate={{ rotate: [20, -20, 20] }}
            transition={{ duration: 0.4, repeat: Infinity }}
          />
          
          {/* Legs */}
          <motion.div
            className="absolute bottom-0 left-1 w-1 h-8 bg-orange-500/70 rounded"
            animate={{ rotate: [0, 30, -30, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 right-1 w-1 h-8 bg-orange-500/70 rounded"
            animate={{ rotate: [0, -30, 30, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </motion.div>
      </motion.div>
      
      {/* Crowd Wave Animation */}
      <div className="absolute bottom-0 left-0 right-0 h-20 overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bottom-0 w-3"
            style={{ left: `${i * 2.5}%` }}
            animate={{ 
              height: [15, 25, 35, 25, 15],
              opacity: [0.4, 0.7, 1, 0.7, 0.4]
            }}
            transition={{ 
              duration: 2,
              delay: i * 0.05,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="w-full h-full bg-gradient-to-t from-orange-600/60 to-red-500/40 rounded-t" />
          </motion.div>
        ))}
      </div>
      
      {/* Stadium Structure */}
      <div className="absolute bottom-16 left-0 right-0 h-2 bg-gradient-to-r from-gray-600 to-gray-800" />
      
      {/* Floating Sports Icons */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-orange-400/40"
          initial={{ 
            x: -50,
            y: Math.random() * window.innerHeight * 0.7,
            rotate: 0
          }}
          animate={{ 
            x: window.innerWidth + 50,
            rotate: 360,
            scale: [0, 1, 1, 0]
          }}
          transition={{ 
            duration: 8,
            delay: i * 1.2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {i % 3 === 0 && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
              <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2z" />
            </svg>
          )}
          {i % 3 === 1 && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          )}
          {i % 3 === 2 && (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 5.5L12 8l-3.5-2.5L12 3l3.5 2.5zm0 13L12 16l-3.5 2.5L12 21l3.5-2.5z"/>
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
}