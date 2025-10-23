import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { HackathonScene } from './scenes/HackathonScene';
import { CulturalScene } from './scenes/CulturalScene';
import { SportsScene } from './scenes/SportsScene';
import { WorkshopScene } from './scenes/WorkshopScene';

const scenes = [
  { 
    id: 'hackathon', 
    component: HackathonScene, 
    theme: 'from-cyan-500/20 to-green-500/20',
    accent: 'text-cyan-400'
  },
  { 
    id: 'cultural', 
    component: CulturalScene, 
    theme: 'from-purple-500/20 to-pink-500/20',
    accent: 'text-purple-400'
  },
  { 
    id: 'sports', 
    component: SportsScene, 
    theme: 'from-orange-500/20 to-red-500/20',
    accent: 'text-orange-400'
  },
  { 
    id: 'workshop', 
    component: WorkshopScene, 
    theme: 'from-yellow-500/20 to-teal-500/20',
    accent: 'text-yellow-400'
  }
];

const taglines = [
  "Discover Every College Event",
  "From Hackathons to Fests to Sports", 
  "One Platform. One Community."
];

export function AnimatedHero() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  
  useEffect(() => {
    const sceneInterval = setInterval(() => {
      setCurrentSceneIndex((prev) => (prev + 1) % scenes.length);
    }, 5000);
    
    const taglineInterval = setInterval(() => {
      setCurrentTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 3000);
    
    return () => {
      clearInterval(sceneInterval);
      clearInterval(taglineInterval);
    };
  }, []);
  
  const currentScene = scenes[currentSceneIndex];
  const CurrentSceneComponent = currentScene.component;
  
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className={`absolute inset-0 bg-gradient-to-br ${currentScene.theme}`}
          >
            <CurrentSceneComponent />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Overlay gradient for better text readability */}
      <div className="absolute inset-0 bg-black/30" />
      
      {/* Main Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
        {/* Logo/Title with glow effect */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mb-8"
        >
          <motion.h1 
            className="mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-6xl font-bold text-transparent md:text-8xl"
            animate={{ 
              textShadow: [
                "0 0 20px rgba(255,255,255,0.5)",
                "0 0 40px rgba(255,255,255,0.8)", 
                "0 0 20px rgba(255,255,255,0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            FindMyEvent
          </motion.h1>
          
          {/* Rotating Taglines */}
          <div className="h-8 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTaglineIndex}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={`text-xl md:text-2xl ${currentScene.accent}`}
              >
                {taglines[currentTaglineIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="flex flex-col gap-4 sm:flex-row sm:gap-8"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              className="bg-white text-black hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full shadow-2xl"
            >
              Find Events
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-black px-8 py-4 text-lg font-semibold rounded-full shadow-2xl"
            >
              Host Event
            </Button>
          </motion.div>
        </motion.div>
      </div>
      
      {/* Scene Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {scenes.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSceneIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors duration-300 ${
              index === currentSceneIndex ? 'bg-white' : 'bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}