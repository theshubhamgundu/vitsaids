import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

const codeLines = [
  "const event = await findEvent();",
  "function registerUser(id) {",
  "  return api.post('/register', id);",
  "}",
  "if (event.isHackathon) {",
  "  startCoding();",
  "}",
  "console.log('Building the future...');",
  "npm install innovation",
  "git commit -m 'Added AI feature'",
  "docker run --name hackathon app"
];

export function HackathonScene() {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLines(prev => {
        const newLine = Math.floor(Math.random() * codeLines.length);
        const updated = [...prev, newLine].slice(-6); // Keep only last 6 lines
        return updated;
      });
    }, 800);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Matrix-style code flow */}
      <div className="absolute inset-0">
        {Array.from({ length: 8 }).map((_, col) => (
          <div
            key={col}
            className="absolute top-0 opacity-20"
            style={{ left: `${(col * 12.5)}%` }}
          >
            {visibleLines.map((lineIndex, i) => (
              <motion.div
                key={`${lineIndex}-${i}`}
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: window.innerHeight + 50, opacity: [0, 1, 1, 0] }}
                transition={{ 
                  duration: 4,
                  delay: i * 0.2,
                  ease: "linear"
                }}
                className="text-cyan-400 text-sm font-mono whitespace-nowrap mb-4"
              >
                {codeLines[lineIndex]}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
      
      {/* 3D Laptop Glow */}
      <motion.div
        className="absolute bottom-20 right-20"
        animate={{ 
          rotateY: [0, 5, 0, -5, 0],
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="relative">
          {/* Laptop Screen */}
          <div className="w-32 h-20 bg-gradient-to-br from-cyan-400/30 to-green-400/30 rounded-t-lg border border-cyan-400/50 relative overflow-hidden">
            <motion.div
              className="absolute inset-1 bg-black/80 rounded"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(34, 211, 238, 0.5)",
                  "0 0 40px rgba(34, 211, 238, 0.8)",
                  "0 0 20px rgba(34, 211, 238, 0.5)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="p-1 text-xs text-cyan-400 font-mono">
                <div>{'> npm start'}</div>
                <div>{'> Building...'}</div>
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {'> █'}
                </motion.div>
              </div>
            </motion.div>
          </div>
          
          {/* Laptop Base */}
          <div className="w-36 h-2 bg-gradient-to-r from-gray-600 to-gray-800 rounded-b-lg" />
        </div>
      </motion.div>
      
      {/* Circuit Board Elements */}
      <motion.div
        className="absolute top-20 left-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100" className="text-cyan-400/40">
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="1" />
          <line x1="30" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="1" />
          <line x1="50" y1="30" x2="50" y2="70" stroke="currentColor" strokeWidth="1" />
        </svg>
      </motion.div>
      
      {/* AI Icons Flying */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-green-400/60"
          initial={{ 
            x: -50, 
            y: Math.random() * window.innerHeight,
            scale: 0 
          }}
          animate={{ 
            x: window.innerWidth + 50,
            scale: [0, 1, 1, 0],
            rotate: 360
          }}
          transition={{ 
            duration: 8,
            delay: i * 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </motion.div>
      ))}
      
      {/* People Typing Silhouettes */}
      <motion.div
        className="absolute bottom-10 left-10"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-16 h-20 bg-gradient-to-t from-cyan-600/40 to-transparent rounded-t-full" />
        <motion.div
          className="w-2 h-2 bg-cyan-400 rounded-full mx-auto -mt-2"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
}