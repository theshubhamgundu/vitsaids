import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search } from 'lucide-react';

// Full-coverage prominent character animations
function HackathonScene() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-80">
      {/* Large prominent students at laptops */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={`student-${i}`} className="absolute" style={{ 
          left: `${10 + i * 35}%`, 
          bottom: '20%',
          transform: `scale(${1.8 + i * 0.2})`
        }}>
          <motion.div
            className="relative"
            animate={{ 
              y: [0, -3, 0, -1, 0],
            }}
            transition={{ 
              duration: 3 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Large detailed head */}
            <motion.div 
              className="w-12 h-12 bg-gradient-to-b from-cyan-200/90 to-blue-300/90 rounded-full mx-auto mb-2 border-2 border-white/30"
              animate={{ rotate: [0, 3, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
            >
              {/* Hair detail */}
              <div className="absolute top-0 w-full h-6 bg-gradient-to-b from-gray-700/60 to-transparent rounded-t-full" />
              {/* Eyes */}
              <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-white/80 rounded-full" />
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-white/80 rounded-full" />
            </motion.div>
            
            {/* Large body with shirt details */}
            <div className="w-8 h-16 bg-gradient-to-b from-cyan-300/80 to-blue-300/80 rounded-lg mx-auto mb-2 border border-white/20">
              <div className="mt-2 mx-auto w-6 h-1 bg-white/40 rounded" />
              <div className="mt-1 mx-auto w-4 h-1 bg-white/30 rounded" />
            </div>
            
            {/* Dynamic typing arms */}
            <motion.div
              className="absolute top-16 -left-4 w-8 h-2 bg-cyan-300/70 rounded origin-right border border-white/20"
              animate={{ rotate: [-15, 15, -10, 10, -15] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
            />
            <motion.div
              className="absolute top-16 -right-4 w-8 h-2 bg-cyan-300/70 rounded origin-left border border-white/20"
              animate={{ rotate: [15, -15, 10, -10, 15] }}
              transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.2 }}
            />
            
            {/* Large detailed laptop */}
            <div className="relative w-20 h-12 bg-gradient-to-br from-gray-600/90 to-gray-800/90 rounded-lg border-2 border-cyan-300/40">
              <motion.div
                className="absolute inset-2 bg-black/90 rounded overflow-hidden border border-cyan-400/30"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(34, 211, 238, 0.5)",
                    "0 0 30px rgba(34, 211, 238, 0.8)",
                    "0 0 20px rgba(34, 211, 238, 0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              >
                {/* Detailed code lines */}
                <div className="p-1 text-[4px] text-green-300/80 leading-tight font-mono">
                  <motion.div 
                    className="bg-green-300/40 h-1 mb-0.5 rounded"
                    animate={{ width: ['60%', '90%', '70%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div 
                    className="bg-blue-300/40 h-1 mb-0.5 rounded"
                    animate={{ width: ['80%', '50%', '85%'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div 
                    className="bg-yellow-300/40 h-1 rounded"
                    animate={{ width: ['40%', '95%', '60%'] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                </div>
              </motion.div>
              
              {/* Laptop base/keyboard */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-3 bg-gray-500/80 rounded border border-cyan-300/30" />
            </div>
          </motion.div>
          
          {/* Large floating code elements */}
          <motion.div
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-xl text-cyan-300/60 font-mono font-bold"
            animate={{ 
              opacity: [0, 1, 0],
              y: [0, -25, -50],
              scale: [0.8, 1.2, 0.8],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              delay: i * 1 + 1
            }}
          >
            {['{ }', '</>', 'fn()', 'const'][i]}
          </motion.div>
        </div>
      ))}
      
      {/* Large floating binary code background */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={`matrix-${i}`}
          className="absolute text-green-300/40 text-lg font-mono font-bold"
          style={{ 
            left: `${5 + i * 12}%`, 
            top: '-15%'
          }}
          animate={{ 
            y: ['0%', '130vh'],
            opacity: [0, 0.8, 0],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 0.8,
            ease: "linear"
          }}
        >
          {['01', '10', '11', '00', '01', '10', '11', '00'][i]}
        </motion.div>
      ))}
    </div>
  );
}

function CulturalScene() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-80">
      {/* Large dramatic spotlights */}
      <motion.div
        className="absolute top-0 left-1/4 w-48 h-full bg-gradient-to-b from-purple-300/60 via-purple-300/25 to-transparent"
        style={{ clipPath: 'polygon(35% 0%, 65% 0%, 85% 100%, 15% 100%)' }}
        animate={{ 
          x: [-20, 20, -20],
          rotate: [-5, 5, -5]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-0 right-1/4 w-40 h-full bg-gradient-to-b from-pink-300/50 via-pink-300/20 to-transparent"
        style={{ clipPath: 'polygon(38% 0%, 62% 0%, 82% 100%, 18% 100%)' }}
        animate={{ 
          x: [15, -15, 15],
          rotate: [3, -3, 3]
        }}
        transition={{ duration: 4.5, repeat: Infinity, delay: 1 }}
      />
      
      {/* Large prominent dancers */}
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={`dancer-${i}`}
          className="absolute bottom-20"
          style={{ left: `${20 + i * 30}%`, transform: `scale(${2 + i * 0.2})` }}
          animate={{ 
            y: [0, -15, -3, -10, 0],
            rotate: [0, 12, -12, 8, 0],
            scaleX: [1, 0.8, 1.2, 0.9, 1]
          }}
          transition={{ 
            duration: 1.5 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        >
          {/* Large detailed head with hair */}
          <motion.div 
            className="w-10 h-10 bg-gradient-to-b from-purple-200/90 to-pink-300/90 rounded-full mx-auto mb-2 border-2 border-white/40 relative"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
          >
            {/* Hair details */}
            <div className="absolute -top-1 -left-2 w-14 h-8 bg-gradient-to-b from-purple-800/60 to-transparent rounded-t-full" />
            {/* Eyes */}
            <div className="absolute top-3 left-2.5 w-1.5 h-1.5 bg-white/90 rounded-full" />
            <div className="absolute top-3 right-2.5 w-1.5 h-1.5 bg-white/90 rounded-full" />
            {/* Smile */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-2 border-b-2 border-white/70 rounded-full" />
          </motion.div>
          
          {/* Large detailed body with costume */}
          <div className="w-7 h-14 bg-gradient-to-b from-purple-300/80 to-pink-300/80 rounded-lg mx-auto mb-2 border border-white/30 relative">
            {/* Costume details */}
            <div className="mt-2 mx-auto w-5 h-2 bg-white/50 rounded" />
            <div className="mt-1 mx-auto w-3 h-1 bg-white/40 rounded" />
            <div className="mt-1 mx-auto w-4 h-1 bg-white/40 rounded" />
          </div>
          
          {/* Dynamic dancing arms */}
          <motion.div
            className="absolute top-12 -left-5 w-10 h-3 bg-purple-300/80 rounded origin-right border border-white/30"
            animate={{ rotate: [30, -30, 60, -20, 30] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
          />
          <motion.div
            className="absolute top-12 -right-5 w-10 h-3 bg-purple-300/80 rounded origin-left border border-white/30"
            animate={{ rotate: [-30, 30, -60, 20, -30] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.1 }}
          />
          
          {/* Dancing legs with movement */}
          <motion.div
            className="absolute bottom-0 left-2 w-3 h-8 bg-purple-300/80 rounded origin-top border border-white/30"
            animate={{ rotate: [0, 20, -15, 0], scaleY: [1, 0.8, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
          />
          <motion.div
            className="absolute bottom-0 right-2 w-3 h-8 bg-purple-300/80 rounded origin-top border border-white/30"
            animate={{ rotate: [0, -20, 15, 0], scaleY: [1, 1.1, 0.8, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
          />
        </motion.div>
      ))}
      
      {/* Large prominent singer with microphone */}
      <motion.div
        className="absolute bottom-20 right-1/6"
        style={{ transform: 'scale(2.2)' }}
        animate={{ 
          y: [0, -6, 0],
          scale: [2.2, 2.4, 2.2]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Large detailed singer head */}
        <motion.div 
          className="w-12 h-12 bg-gradient-to-b from-purple-200/90 to-pink-300/90 rounded-full mx-auto mb-2 border-2 border-white/50 relative"
          animate={{ rotate: [0, 8, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {/* Long hair */}
          <div className="absolute -top-2 -left-3 w-18 h-10 bg-gradient-to-b from-purple-900/70 to-transparent rounded-t-full" />
          {/* Eyes */}
          <div className="absolute top-4 left-3 w-2 h-2 bg-white/90 rounded-full" />
          <div className="absolute top-4 right-3 w-2 h-2 bg-white/90 rounded-full" />
          {/* Open mouth (singing) */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-3 h-4 bg-pink-800/80 rounded-full" />
        </motion.div>
        
        {/* Singer body with dress */}
        <div className="w-8 h-16 bg-gradient-to-b from-purple-300/80 to-pink-300/80 rounded-lg mx-auto relative border border-white/40">
          {/* Dress details */}
          <div className="mt-3 mx-auto w-6 h-3 bg-white/60 rounded" />
          <div className="mt-2 mx-auto w-5 h-2 bg-white/50 rounded" />
        </div>
        
        {/* Large microphone */}
        <motion.div
          className="absolute -right-6 top-2 flex items-center"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div className="w-2 h-12 bg-gray-600/90 rounded border border-white/30" />
          <div className="w-4 h-4 bg-gray-800/90 rounded-full ml-1 border-2 border-white/40" />
        </motion.div>
        
        {/* Singing arm holding mic */}
        <motion.div
          className="absolute top-8 -right-2 w-6 h-3 bg-purple-300/80 rounded origin-left border border-white/30"
          animate={{ rotate: [-40, -20, -45, -40] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Large floating musical elements */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`note-${i}`}
          className="absolute text-purple-300/60 text-2xl font-bold"
          style={{ 
            left: `${10 + (i * 7)}%`,
            top: `${15 + Math.sin(i) * 20}%`
          }}
          animate={{ 
            y: [0, -40, -80],
            opacity: [0, 1, 0],
            rotate: [0, 360, 720],
            scale: [0.5, 1.5, 0.5]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            delay: i * 0.3
          }}
        >
          {['♪', '♫', '♬', '♩', '🎵', '🎶'][i % 6]}
        </motion.div>
      ))}
      
      {/* Large sound waves */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute right-1/6 bottom-20 border-4 border-pink-300/50 rounded-full"
          style={{ width: `${16 + i * 8}px`, height: `${16 + i * 8}px` }}
          animate={{ 
            scale: [1, 4, 7],
            opacity: [0.9, 0.4, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            delay: i * 0.8
          }}
        />
      ))}
    </div>
  );
}

function SportsScene() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-80">
      {/* Large prominent cricket batsman */}
      <motion.div
        className="absolute bottom-20 left-1/5"
        style={{ transform: 'scale(2.5)' }}
        animate={{ 
          y: [0, -4, 0],
          rotate: [0, 8, -3, 0]
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        {/* Large detailed head with cricket helmet */}
        <div className="w-10 h-10 bg-gradient-to-b from-orange-200/90 to-red-300/90 rounded-full mx-auto mb-2 relative border-2 border-white/50">
          {/* Helmet with grille */}
          <div className="absolute top-0 w-10 h-6 bg-white/60 rounded-t-full border border-gray-400/60" />
          <div className="absolute top-2 left-2 w-6 h-4 border border-gray-600/40 rounded">
            {/* Helmet grille lines */}
            <div className="mt-0.5 w-full h-0.5 bg-gray-600/30" />
            <div className="mt-0.5 w-full h-0.5 bg-gray-600/30" />
          </div>
          {/* Eyes visible through helmet */}
          <div className="absolute top-4 left-2.5 w-1.5 h-1.5 bg-white/80 rounded-full" />
          <div className="absolute top-4 right-2.5 w-1.5 h-1.5 bg-white/80 rounded-full" />
        </div>
        
        {/* Body in batting stance with cricket pads */}
        <motion.div 
          className="w-8 h-14 bg-gradient-to-b from-orange-300/80 to-red-300/80 rounded-lg mx-auto mb-2 border border-white/40 relative"
          animate={{ rotate: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Cricket jersey number */}
          <div className="mt-2 mx-auto w-5 h-5 bg-white/70 rounded text-center text-xs font-bold text-red-800">7</div>
          {/* Body contours */}
          <div className="mt-1 mx-auto w-6 h-2 bg-white/40 rounded" />
        </motion.div>
        
        {/* Large cricket bat */}
        <motion.div
          className="absolute -right-6 top-4 w-3 h-20 bg-gradient-to-b from-yellow-500/90 to-yellow-700/90 rounded origin-bottom border-2 border-yellow-800/60"
          animate={{ 
            rotate: [40, -30, 25, 40],
            x: [0, 4, 0]
          }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          {/* Bat handle */}
          <div className="absolute bottom-0 w-full h-6 bg-brown-600/80 rounded" />
          {/* Bat grip */}
          <div className="absolute bottom-2 w-full h-2 bg-black/60" />
        </motion.div>
        
        {/* Batting arms */}
        <motion.div
          className="absolute top-8 -right-2 w-6 h-3 bg-orange-300/80 rounded origin-left border border-white/40"
          animate={{ rotate: [-15, -40, -20, -15] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-10 -right-4 w-5 h-2 bg-orange-300/80 rounded origin-left border border-white/40"
          animate={{ rotate: [-25, -50, -30, -25] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
        
        {/* Cricket pads on legs */}
        <div className="absolute bottom-0 left-2 w-3 h-10 bg-white/80 rounded border-2 border-gray-400/60" />
        <motion.div
          className="absolute bottom-0 right-2 w-3 h-10 bg-white/80 rounded origin-top border-2 border-gray-400/60"
          animate={{ rotate: [0, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Large prominent bowler in action */}
      <motion.div
        className="absolute bottom-20 right-1/4"
        style={{ transform: 'scale(2.3)' }}
        animate={{ 
          y: [0, -12, 0],
          x: [0, 4, 0],
          rotate: [0, -15, 8, 0]
        }}
        transition={{ duration: 1.8, repeat: Infinity, delay: 0.4 }}
      >
        {/* Large bowler head */}
        <div className="w-9 h-9 bg-gradient-to-b from-orange-300/90 to-red-300/90 rounded-full mx-auto mb-2 border-2 border-white/50 relative">
          {/* Hair */}
          <div className="absolute -top-1 w-full h-5 bg-brown-700/70 rounded-t-full" />
          {/* Focused expression */}
          <div className="absolute top-2.5 left-2 w-1.5 h-1.5 bg-white/90 rounded-full" />
          <div className="absolute top-2.5 right-2 w-1.5 h-1.5 bg-white/90 rounded-full" />
          {/* Determined mouth */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-red-700/60 rounded" />
        </div>
        
        {/* Body in bowling action */}
        <motion.div 
          className="w-7 h-12 bg-gradient-to-b from-orange-300/80 to-red-300/80 rounded-lg mx-auto border border-white/40 relative"
          animate={{ rotate: [0, -20, 0] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          {/* Jersey details */}
          <div className="mt-2 mx-auto w-4 h-4 bg-white/70 rounded text-center text-xs font-bold text-red-800">12</div>
        </motion.div>
        
        {/* Dynamic bowling arm */}
        <motion.div
          className="absolute top-4 -left-4 w-8 h-3 bg-orange-300/80 rounded origin-right border border-white/40"
          animate={{ 
            rotate: [-60, 120, 200, -60],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        
        {/* Supporting arm for balance */}
        <motion.div
          className="absolute top-6 -right-4 w-6 h-3 bg-orange-300/80 rounded origin-left border border-white/40"
          animate={{ rotate: [30, -40, 30] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        
        {/* Bowling legs in action */}
        <motion.div
          className="absolute bottom-0 left-2 w-3 h-8 bg-orange-300/80 rounded origin-top border border-white/40"
          animate={{ rotate: [0, 25, 0], scaleY: [1, 0.8, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Large wicket keeper */}
      <motion.div
        className="absolute bottom-24 left-2/3"
        style={{ transform: 'scale(1.8)' }}
        animate={{ 
          y: [0, -3, 0],
          x: [0, -3, 3, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        <div className="w-6 h-6 bg-gradient-to-b from-orange-300/90 to-red-300/90 rounded-full mx-auto mb-2 border border-white/50" />
        <div className="w-5 h-10 bg-gradient-to-b from-orange-300/80 to-red-300/80 rounded mx-auto border border-white/40" />
        {/* Wicket keeper gloves */}
        <div className="absolute top-8 -left-2 w-4 h-3 bg-brown-600/80 rounded border border-white/40" />
        <div className="absolute top-8 -right-2 w-4 h-3 bg-brown-600/80 rounded border border-white/40" />
      </motion.div>
      
      {/* Large prominent cricket ball */}
      <motion.div
        className="absolute w-6 h-6 bg-gradient-to-br from-red-400/95 to-red-700/95 rounded-full border-2 border-white/50"
        initial={{ x: '70%', y: '50%' }}
        animate={{ 
          x: ['70%', '50%', '20%'],
          y: ['50%', '20%', '45%'],
          rotate: [0, 1080, 2160],
          scale: [1, 1.5, 0.9, 1]
        }}
        transition={{ 
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {/* Cricket ball seam */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/80 transform -translate-y-1/2" />
      </motion.div>
      
      {/* Ball trail with speed lines */}
      <motion.div
        className="absolute h-2 bg-gradient-to-r from-red-300/70 to-transparent rounded-full"
        initial={{ x: '67%', y: '51%', width: '8px' }}
        animate={{ 
          x: ['67%', '47%', '17%'],
          y: ['51%', '21%', '46%'],
          width: ['8px', '24px', '4px'],
          opacity: [0.7, 0.9, 0.3]
        }}
        transition={{ 
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Large stadium crowd */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={`crowd-${i}`}
          className="absolute top-4 bg-orange-300/60 rounded-full border border-white/30"
          style={{ 
            left: `${5 + i * 8}%`,
            width: `${8 + Math.random() * 4}px`,
            height: `${8 + Math.random() * 4}px`
          }}
          animate={{ 
            y: [0, -6, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 1.2 + i * 0.1,
            repeat: Infinity,
            delay: i * 0.15
          }}
        />
      ))}
      
      {/* Large cheering effects and sports emojis */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`cheer-${i}`}
          className="absolute text-orange-300/70 text-xl font-bold"
          style={{ 
            left: `${15 + i * 15}%`,
            top: `${8 + Math.random() * 15}%`
          }}
          animate={{ 
            y: [0, -25],
            opacity: [0, 1, 0],
            scale: [0.5, 1.5, 0.5],
            rotate: [0, 180]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            delay: i * 0.8 + 0.5
          }}
        >
          {['🏏', '🎯', '⚡', '🔥', '👏', '🏆'][i]}
        </motion.div>
      ))}
    </div>
  );
}

function WorkshopScene() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-80">
      {/* Large prominent teacher with presentation screen */}
      <motion.div
        className="absolute bottom-24 right-1/4"
        style={{ transform: 'scale(2.4)' }}
        animate={{ 
          y: [0, -3, 0],
          rotate: [0, 3, -2, 0]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Large teacher head */}
        <div className="w-11 h-11 bg-gradient-to-b from-green-200/90 to-blue-200/90 rounded-full mx-auto mb-2 border-2 border-white/50 relative">
          {/* Hair */}
          <div className="absolute -top-1 w-full h-6 bg-brown-600/70 rounded-t-full" />
          {/* Glasses */}
          <div className="absolute top-3 left-1.5 w-3 h-3 border-2 border-white/80 rounded-full" />
          <div className="absolute top-3 right-1.5 w-3 h-3 border-2 border-white/80 rounded-full" />
          <div className="absolute top-4 left-1/2 w-1 h-0.5 bg-white/70 transform -translate-x-1/2" />
          {/* Speaking mouth */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-700/60 rounded-full" />
        </div>
        
        {/* Professional body with shirt */}
        <div className="w-8 h-15 bg-gradient-to-b from-green-300/80 to-blue-300/80 rounded-lg mx-auto mb-2 border border-white/40 relative">
          {/* Shirt collar */}
          <div className="mt-1 mx-auto w-6 h-2 bg-white/60 rounded-t-lg" />
          {/* Tie */}
          <div className="mt-1 mx-auto w-2 h-8 bg-red-600/70 rounded" />
        </div>
        
        {/* Teaching arm with pointer */}
        <motion.div
          className="absolute top-8 -left-4 w-6 h-3 bg-green-300/80 rounded origin-right border border-white/40"
          animate={{ rotate: [-10, 30, -10] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        <motion.div
          className="absolute top-6 -left-8 w-8 h-1 bg-brown-600/80 rounded origin-right"
          animate={{ rotate: [-10, 30, -10] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Large presentation screen */}
      <motion.div
        className="absolute top-16 right-1/6 w-40 h-24 bg-white/90 rounded-lg border-4 border-gray-600/80"
        style={{ transform: 'scale(1.2)' }}
        animate={{ 
          boxShadow: [
            "0 0 20px rgba(59, 130, 246, 0.3)",
            "0 0 40px rgba(59, 130, 246, 0.5)",
            "0 0 20px rgba(59, 130, 246, 0.3)"
          ]
        }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        {/* Screen content with charts and text */}
        <div className="p-2 h-full">
          <div className="text-xs text-gray-800/80 font-bold mb-1">Workshop Presentation</div>
          
          {/* Animated chart */}
          <motion.div
            className="w-16 h-8 border border-blue-400/60 rounded mb-1 relative overflow-hidden"
            animate={{ borderColor: ['rgba(59, 130, 246, 0.6)', 'rgba(16, 185, 129, 0.6)', 'rgba(59, 130, 246, 0.6)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {/* Chart bars */}
            <motion.div
              className="absolute bottom-0 left-1 w-2 bg-blue-400/70"
              animate={{ height: ['20%', '80%', '40%'] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-4 w-2 bg-green-400/70"
              animate={{ height: ['60%', '30%', '90%'] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute bottom-0 left-7 w-2 bg-purple-400/70"
              animate={{ height: ['40%', '70%', '20%'] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          </motion.div>
          
          {/* Text lines */}
          <div className="space-y-0.5">
            <div className="w-12 h-1 bg-gray-600/60 rounded" />
            <div className="w-14 h-1 bg-gray-600/50 rounded" />
            <div className="w-10 h-1 bg-gray-600/60 rounded" />
          </div>
        </div>
      </motion.div>
      
      {/* Large prominent students listening */}
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={`student-${i}`}
          className="absolute bottom-20"
          style={{ 
            left: `${8 + i * 18}%`,
            transform: `scale(${1.6 + i * 0.1})`,
            zIndex: 10 - i
          }}
          animate={{ 
            y: [0, -2, 0],
            rotate: [0, 2, -1, 0]
          }}
          transition={{ 
            duration: 2.5 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.4
          }}
        >
          {/* Student head with different expressions */}
          <motion.div 
            className="w-9 h-9 bg-gradient-to-b from-green-200/90 to-blue-200/90 rounded-full mx-auto mb-2 border-2 border-white/40 relative"
            animate={{ rotate: [0, 3, -3, 0] }}
            transition={{ duration: 3 + i * 0.2, repeat: Infinity }}
          >
            {/* Different hairstyles */}
            <div className={`absolute -top-1 w-full h-5 bg-gradient-to-b ${
              i % 2 === 0 ? 'from-brown-700/70' : 'from-yellow-700/70'
            } to-transparent rounded-t-full`} />
            
            {/* Eyes looking at presentation */}
            <div className="absolute top-3 left-2 w-1.5 h-1.5 bg-white/90 rounded-full" />
            <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-white/90 rounded-full" />
            
            {/* Focused expression */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-3 h-1 bg-pink-600/60 rounded" />
          </motion.div>
          
          {/* Student body with casual clothes */}
          <div className={`w-7 h-12 bg-gradient-to-b ${
            ['from-blue-300/80 to-green-300/80', 'from-purple-300/80 to-pink-300/80', 
             'from-yellow-300/80 to-orange-300/80', 'from-red-300/80 to-purple-300/80'][i]
          } rounded-lg mx-auto mb-2 border border-white/30 relative`}>
            {/* Shirt details */}
            <div className="mt-1 mx-auto w-5 h-2 bg-white/50 rounded" />
            <div className="mt-1 mx-auto w-3 h-1 bg-white/40 rounded" />
          </div>
          
          {/* Arms in listening position */}
          <div className="absolute top-10 -left-2 w-4 h-2 bg-green-300/70 rounded border border-white/30" />
          <div className="absolute top-10 -right-2 w-4 h-2 bg-green-300/70 rounded border border-white/30" />
          
          {/* Some students taking notes */}
          {i % 2 === 0 && (
            <motion.div
              className="absolute top-14 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-white/80 rounded border border-gray-400/60"
              animate={{ rotate: [0, 2, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {/* Notebook lines */}
              <div className="mt-0.5 mx-1 w-2 h-0.5 bg-blue-600/40" />
              <div className="mt-0.5 mx-1 w-2.5 h-0.5 bg-blue-600/40" />
            </motion.div>
          )}
        </motion.div>
      ))}
      
      {/* Floating knowledge elements */}
      {Array.from({ length: 10 }).map((_, i) => (
        <motion.div
          key={`knowledge-${i}`}
          className="absolute text-green-300/60 text-xl font-bold"
          style={{ 
            left: `${8 + (i * 9)}%`,
            top: `${20 + Math.sin(i) * 10}%`
          }}
          animate={{ 
            y: [0, -30, -60],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360],
            scale: [0.5, 1.2, 0.5]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            delay: i * 0.4
          }}
        >
          {['💡', '📚', '🎓', '✏️', '📊', '🔬', '⚗️', '📝', '💻', '🧠'][i]}
        </motion.div>
      ))}
      
      {/* Floating books */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={`book-${i}`}
          className="absolute bg-gradient-to-br from-yellow-400/70 to-orange-400/70 rounded border-2 border-white/40"
          style={{ 
            left: `${20 + i * 12}%`,
            top: `${15 + Math.sin(i * 0.5) * 20}%`,
            width: `${20 + Math.random() * 8}px`,
            height: `${24 + Math.random() * 6}px`
          }}
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 5 + i * 0.5,
            repeat: Infinity,
            delay: i * 0.8
          }}
        >
          {/* Book spine details */}
          <div className="mt-1 mx-1 w-3 h-1 bg-white/60 rounded" />
          <div className="mt-1 mx-1 w-2 h-0.5 bg-white/50 rounded" />
        </motion.div>
      ))}
    </div>
  );
}

const scenes = [
  { 
    id: 'hackathon', 
    component: HackathonScene, 
    theme: 'from-blue-500/10 to-purple-500/10',
    title: 'Hackathon'
  },
  { 
    id: 'cultural', 
    component: CulturalScene, 
    theme: 'from-purple-500/10 to-pink-500/10',
    title: 'Cultural'
  },
  { 
    id: 'sports', 
    component: SportsScene, 
    theme: 'from-orange-500/10 to-red-500/10',
    title: 'Sports'
  },
  { 
    id: 'workshop', 
    component: WorkshopScene, 
    theme: 'from-green-500/10 to-blue-500/10',
    title: 'Workshop'
  }
];

export function HeroCard() {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSceneIndex((prev) => (prev + 1) % scenes.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const currentScene = scenes[currentSceneIndex];
  const CurrentSceneComponent = currentScene.component;
  
  return (
    <div className="min-h-screen pt-20 px-6 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative w-full max-w-6xl h-[75vh] rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #6B46C1 0%, #3B82F6 100%)',
          boxShadow: '0 25px 50px -12px rgba(107, 70, 193, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Animated Background Layer */}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScene.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className={`absolute inset-0 bg-gradient-to-br ${currentScene.theme}`}
            >
              <CurrentSceneComponent />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Subtle overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
        
        {/* Main Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 text-center">
          {/* Scene indicator */}
          <motion.div
            key={currentScene.title}
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-sm text-white/70 mb-4 uppercase tracking-wider font-medium"
          >
            {currentScene.title} Events
          </motion.div>
          
          {/* Main Title */}
          <motion.h1 
            className="text-7xl md:text-9xl font-bold mb-6"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #E5E7EB 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
            }}
            animate={{ 
              textShadow: [
                "0 0 30px rgba(255,255,255,0.1)",
                "0 0 60px rgba(255,255,255,0.2)", 
                "0 0 30px rgba(255,255,255,0.1)"
              ]
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            FindMyEvent
          </motion.h1>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-2xl md:text-3xl text-white/90 mb-10 font-light"
          >
            Discover Every College Event
          </motion.p>
          
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="relative w-full max-w-lg mb-8"
          >
            <div className="relative">
              <Input
                type="text"
                placeholder="Search Events / Colleges"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-14 pr-6 bg-white/15 backdrop-blur-xl border-2 border-white/20 rounded-2xl text-white text-lg placeholder:text-white/60 focus:border-white/40 focus:outline-none focus:ring-0 transition-all duration-300 hover:bg-white/20"
                style={{
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-white/70" />
            </div>
          </motion.div>
          
          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              size="lg" 
              className="h-14 px-12 text-lg font-semibold rounded-2xl border-0 shadow-xl transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)',
                color: '#1F2937',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
              }}
            >
              Find Events
            </Button>
          </motion.div>
        </div>
        
        {/* Scene Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3">
          {scenes.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => setCurrentSceneIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                index === currentSceneIndex 
                  ? 'bg-white scale-125 shadow-lg' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              whileHover={{ scale: index === currentSceneIndex ? 1.25 : 1.1 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
        
        {/* Subtle glow effect */}
        <div 
          className="absolute -inset-1 rounded-3xl opacity-50 blur-xl"
          style={{
            background: 'linear-gradient(135deg, #6B46C1 0%, #3B82F6 100%)',
            zIndex: -1
          }}
        />
      </motion.div>
    </div>
  );
}