import { motion } from 'motion/react';
import { Clock, Calendar, Sun, Moon } from 'lucide-react';

interface TimeAvailabilityProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function TimeAvailability({ data, onUpdate }: TimeAvailabilityProps) {
  const timePreferences = data.timePreferences || {
    weekdays: false,
    weekends: false,
    morning: false,
    afternoon: false,
    evening: false
  };

  const updatePreference = (key: string, value: boolean) => {
    onUpdate({
      timePreferences: {
        ...timePreferences,
        [key]: value
      }
    });
  };

  const dayOptions = [
    { key: 'weekdays', label: 'Weekdays', description: 'Monday - Friday', icon: Calendar },
    { key: 'weekends', label: 'Weekends', description: 'Saturday - Sunday', icon: Calendar }
  ];

  const timeOptions = [
    { key: 'morning', label: 'Morning', description: '6 AM - 12 PM', icon: Sun },
    { key: 'afternoon', label: 'Afternoon', description: '12 PM - 6 PM', icon: Clock },
    { key: 'evening', label: 'Evening', description: '6 PM - 11 PM', icon: Moon }
  ];

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        When are you typically available to attend events? This helps us suggest events at times that work for you.
      </p>

      {/* Day Preferences */}
      <div>
        <h4 className="font-medium mb-4 flex items-center">
          <Calendar size={16} className="mr-2" />
          Day Preferences
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {dayOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = timePreferences[option.key];
            
            return (
              <motion.button
                key={option.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updatePreference(option.key, !isSelected)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h5 className="font-medium">{option.label}</h5>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Time Preferences */}
      <div>
        <h4 className="font-medium mb-4 flex items-center">
          <Clock size={16} className="mr-2" />
          Time Preferences
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {timeOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = timePreferences[option.key];
            
            return (
              <motion.button
                key={option.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => updatePreference(option.key, !isSelected)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h5 className="font-medium">{option.label}</h5>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {Object.values(timePreferences).some(Boolean) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
        >
          <p className="text-sm text-green-800 dark:text-green-200">
            Perfect! We'll prioritize showing you events during your preferred times. 
            You'll still see all events, but your preferred ones will be highlighted.
          </p>
        </motion.div>
      )}
    </div>
  );
}