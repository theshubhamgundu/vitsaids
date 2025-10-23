import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function CulturalScene() {
  const [beatIndex, setBeatIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBeatIndex(prev => (prev + 1) % 4);
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Stage Spotlight Beams */}
      <motion.div
        className="absolute top-0 left-1/4 w-32 h-full opacity-30"
        animate={{ 
          rotate: [-10, 10, -10],
          x: [-20, 20, -20]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-b from-purple-400/40 via-purple-400/20 to-transparent" 
             style={{ clipPath: 'polygon(40% 0%, 60% 0%, 80% 100%, 20% 100%)' }} />
      </motion.div>
      
      <motion.div
        className="absolute top-0 right-1/4 w-32 h-full opacity-30"
        animate={{ 
          rotate: [10, -10, 10],
          x: [20, -20, 20]
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-full h-full bg-gradient-to-b from-pink-400/40 via-pink-400/20 to-transparent" 
             style={{ clipPath: 'polygon(40% 0%, 60% 0%, 80% 100%, 20% 100%)' }} />
      </motion.div>
      
      {/* Dancing Silhouettes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-20"
          style={{ left: `${15 + i * 12}%` }}
          animate={{ 
            y: [0, -10, 0, -5, 0],
            scaleX: [1, 0.8, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 1,
            delay: i * 0.1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className={`w-4 h-16 bg-gradient-to-t ${
            i % 2 === 0 ? 'from-purple-600/60' : 'from-pink-600/60'
          } to-transparent rounded-t-full`} />
          {/* Arms */}
          <motion.div
            className={`absolute top-4 -left-2 w-6 h-1 ${
              i % 2 === 0 ? 'bg-purple-600/60' : 'bg-pink-600/60'
            } rounded`}
            animate={{ rotate: [0, 30, -30, 0] }}
            transition={{ duration: 0.8, delay: i * 0.05, repeat: Infinity }}
          />
        </motion.div>
      ))}
      
      {/* Microphone */}
      <motion.div
        className="absolute bottom-32 left-1/2 transform -translate-x-1/2"
        animate={{ 
          y: [0, -2, 0],
          rotateZ: [0, 2, -2, 0]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-3 h-8 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full" />
        <div className="w-1 h-12 bg-gray-600 mx-auto" />
        <motion.div
          className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 rounded-full border-2 border-purple-400"
          animate={{ 
            boxShadow: [
              "0 0 10px rgba(168, 85, 247, 0.5)",
              "0 0 20px rgba(168, 85, 247, 0.8)",
              "0 0 10px rgba(168, 85, 247, 0.5)"
            ]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Music Equalizer Bars */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="w-2 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
            animate={{ 
              height: [10, Math.random() * 40 + 20, 10, Math.random() * 50 + 15, 10]
            }}
            transition={{ 
              duration: 0.5,
              delay: i * 0.05,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      {/* Floating Musical Notes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-purple-400/50"
          initial={{ 
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 50,
            scale: 0
          }}
          animate={{ 
            y: -50,
            scale: [0, 1, 1, 0],
            rotate: [0, 180, 360],
            x: Math.random() * window.innerWidth
          }}
          transition={{ 
            duration: 6,
            delay: i * 0.8,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </motion.div>
      ))}
      
      {/* Disco Ball */}
      <motion.div
        className="absolute top-20 right-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-300/60 to-pink-300/60 relative">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/80 rounded-full"
              style={{
                top: `${25 + Math.sin(i * 0.785) * 15}%`,
                left: `${25 + Math.cos(i * 0.785) * 15}%`
              }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ 
                duration: 0.5,
                delay: i * 0.1,
                repeat: Infinity 
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}