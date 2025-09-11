import { motion } from 'motion/react';
import { Code, Music, Trophy } from 'lucide-react';

const features = [
  {
    icon: Code,
    title: 'Tech & Non-Tech',
    description: 'From hackathons to workshops, discover coding competitions and technical events that shape the future.',
    color: 'from-cyan-500 to-green-500',
    bgColor: 'from-cyan-500/10 to-green-500/10',
    animation: 'coding'
  },
  {
    icon: Music,
    title: 'Cultural & Fests',
    description: 'Experience vibrant cultural festivals, music concerts, and artistic performances across campuses.',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'from-purple-500/10 to-pink-500/10',
    animation: 'stage'
  },
  {
    icon: Trophy,
    title: 'Sports Events',
    description: 'Join competitive sports tournaments, fitness challenges, and athletic competitions.',
    color: 'from-orange-500 to-red-500',
    bgColor: 'from-orange-500/10 to-red-500/10',
    animation: 'sports'
  }
];

function CodingAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      {Array.from({ length: 3 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-cyan-400/40 text-xs"
          style={{ left: `${20 + i * 25}%`, top: `${30 + i * 15}%` }}
          animate={{ 
            opacity: [0, 1, 0],
            y: [0, -10, 0]
          }}
          transition={{ 
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity 
          }}
        >
          {'</>'}
        </motion.div>
      ))}
      <motion.div
        className="absolute bottom-4 right-4 w-8 h-6 bg-gradient-to-br from-cyan-400/20 to-green-400/20 rounded border border-cyan-400/30"
        animate={{ 
          boxShadow: [
            "0 0 10px rgba(34, 211, 238, 0.2)",
            "0 0 20px rgba(34, 211, 238, 0.4)",
            "0 0 10px rgba(34, 211, 238, 0.2)"
          ]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

function StageAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      {/* Spotlight */}
      <motion.div
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-full bg-gradient-to-b from-purple-400/30 to-transparent"
        animate={{ 
          rotate: [-5, 5, -5],
          x: [-10, 10, -10]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ clipPath: 'polygon(40% 0%, 60% 0%, 80% 100%, 20% 100%)' }}
      />
      {/* Dancing figures */}
      {Array.from({ length: 2 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-4 w-2 h-8 bg-gradient-to-t from-purple-500/40 to-transparent rounded-t-full"
          style={{ left: `${30 + i * 40}%` }}
          animate={{ 
            scaleY: [1, 1.3, 0.8, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 1,
            delay: i * 0.2,
            repeat: Infinity 
          }}
        />
      ))}
    </div>
  );
}

function SportsAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-30">
      {/* Ball */}
      <motion.div
        className="absolute w-4 h-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full"
        initial={{ x: 20, y: 40 }}
        animate={{ 
          x: [20, 60, 100, 140],
          y: [40, 20, 40, 15]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Player */}
      <motion.div
        className="absolute bottom-6 left-6 w-3 h-8 bg-gradient-to-t from-orange-500/50 to-transparent rounded-t-full"
        animate={{ 
          y: [0, -3, 0],
          scaleX: [1, 0.8, 1]
        }}
        transition={{ 
          duration: 0.8,
          repeat: Infinity 
        }}
      />
    </div>
  );
}

export function AboutSection() {
  const getAnimation = (type: string) => {
    switch (type) {
      case 'coding': return <CodingAnimation />;
      case 'stage': return <StageAnimation />;
      case 'sports': return <SportsAnimation />;
      default: return null;
    }
  };

  return (
    <section className="py-20 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Why FindMyEvent?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover and participate in every type of college event, from technical competitions to cultural celebrations
          </p>
        </motion.div>
        
        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="relative group"
              >
                <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${feature.bgColor} border border-border backdrop-blur-sm h-80 p-8 transition-all duration-300 group-hover:border-border/50 bg-card`}>
                  {/* Background Animation */}
                  {getAnimation(feature.animation)}
                  
                  {/* Content */}
                  <div className="relative z-10 h-full flex flex-col">
                    {/* Icon */}
                    <motion.div
                      className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${feature.color} mb-6 w-fit`}
                      whileHover={{ rotate: 5 }}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                    </motion.div>
                    
                    {/* Title */}
                    <h3 className="text-2xl font-bold text-card-foreground mb-4">
                      {feature.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed flex-grow">
                      {feature.description}
                    </p>
                    
                    {/* Hover effect */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-3xl`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}