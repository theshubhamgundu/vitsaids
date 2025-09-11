import { motion } from 'motion/react';
import { Badge } from '../ui/badge';
import { Code, Music, Trophy, BookOpen, Camera, Palette, Mic, Users, Zap, Award } from 'lucide-react';

const interests = [
  { id: 'hackathon', name: 'Hackathons', icon: Code, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' },
  { id: 'cultural', name: 'Cultural Events', icon: Music, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' },
  { id: 'sports', name: 'Sports', icon: Trophy, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300' },
  { id: 'workshop', name: 'Workshops', icon: BookOpen, color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' },
  { id: 'photography', name: 'Photography', icon: Camera, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' },
  { id: 'art', name: 'Art & Design', icon: Palette, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300' },
  { id: 'debate', name: 'Debate & Speaking', icon: Mic, color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' },
  { id: 'networking', name: 'Networking', icon: Users, color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300' },
  { id: 'startup', name: 'Startup Events', icon: Zap, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' },
  { id: 'competition', name: 'Competitions', icon: Award, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300' }
];

interface InterestSelectionProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function InterestSelection({ data, onUpdate }: InterestSelectionProps) {
  const selectedInterests = data.interests || [];

  const toggleInterest = (interestId: string) => {
    const updated = selectedInterests.includes(interestId)
      ? selectedInterests.filter((id: string) => id !== interestId)
      : [...selectedInterests, interestId];
    
    onUpdate({ interests: updated });
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Select the types of events you're interested in. This helps us show you relevant events from all colleges.
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        {interests.map((interest) => {
          const Icon = interest.icon;
          const isSelected = selectedInterests.includes(interest.id);
          
          return (
            <motion.button
              key={interest.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleInterest(interest.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-2 rounded-lg ${interest.color}`}>
                  <Icon size={24} />
                </div>
                <span className="font-medium text-sm text-center">
                  {interest.name}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {selectedInterests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <p className="text-sm text-muted-foreground mb-3">Selected interests:</p>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.map((interestId: string) => {
              const interest = interests.find(i => i.id === interestId);
              return interest ? (
                <Badge key={interestId} variant="secondary" className="text-xs">
                  {interest.name}
                </Badge>
              ) : null;
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}