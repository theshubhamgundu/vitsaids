import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, MapPin, Plus, X } from 'lucide-react';

const popularColleges = [
  'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur',
  'NIT Trichy', 'NIT Warangal', 'BITS Pilani', 'VIT Vellore', 'SRM Chennai',
  'IIIT Hyderabad', 'DTU Delhi', 'NSUT Delhi', 'Manipal University', 'Amity University',
  'Christ University', 'Lovely Professional University', 'Thapar University'
];

interface LocationPreferencesProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function LocationPreferences({ data, onUpdate }: LocationPreferencesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const selectedColleges = data.preferredColleges || [];
  
  const filteredColleges = popularColleges.filter(college =>
    college.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedColleges.includes(college)
  );

  const addCollege = (college: string) => {
    const updated = [...selectedColleges, college];
    onUpdate({ preferredColleges: updated });
  };

  const removeCollege = (college: string) => {
    const updated = selectedColleges.filter((c: string) => c !== college);
    onUpdate({ preferredColleges: updated });
  };

  const addCustomCollege = () => {
    if (searchTerm && !selectedColleges.includes(searchTerm)) {
      addCollege(searchTerm);
      setSearchTerm('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-4">
          Select colleges you're interested in following. You'll see events from these colleges and others too.
        </p>
        
        {/* Search/Add College */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search for colleges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-12"
            onKeyDown={(e) => e.key === 'Enter' && addCustomCollege()}
          />
          {searchTerm && (
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={addCustomCollege}
            >
              <Plus size={14} />
            </Button>
          )}
        </div>

        {/* Search Results */}
        {searchTerm && filteredColleges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto"
          >
            {filteredColleges.slice(0, 5).map((college) => (
              <button
                key={college}
                onClick={() => addCollege(college)}
                className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md flex items-center space-x-2"
              >
                <MapPin size={14} className="text-gray-400" />
                <span>{college}</span>
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Selected Colleges */}
      {selectedColleges.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Selected Colleges:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedColleges.map((college: string) => (
              <motion.div
                key={college}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
              >
                <Badge variant="secondary" className="text-sm py-1 px-3 flex items-center space-x-2">
                  <MapPin size={12} />
                  <span>{college}</span>
                  <button
                    onClick={() => removeCollege(college)}
                    className="ml-2 hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Colleges */}
      <div>
        <h4 className="font-medium mb-3">Popular Colleges:</h4>
        <div className="grid grid-cols-2 gap-2">
          {popularColleges
            .filter(college => !selectedColleges.includes(college))
            .slice(0, 8)
            .map((college) => (
              <motion.button
                key={college}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addCollege(college)}
                className="p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-sm">{college}</span>
                </div>
              </motion.button>
            ))}
        </div>
      </div>

      {selectedColleges.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Great! You'll receive personalized event recommendations from these colleges. 
            You can always modify your preferences later in settings.
          </p>
        </motion.div>
      )}
    </div>
  );
}